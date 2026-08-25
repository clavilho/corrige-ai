import Link from "next/link";
import { FileText, ScanLine, Target, TrendingUp } from "lucide-react";

import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";

import { CorrectionModel } from "@/features/corrections/correction.model";
import { ExamModel } from "@/features/exams/exam.model";

import DashboardQuestionStats from "@/components/dashboard-question-stats";

export default async function DashboardPage() {
  const teacherId = await currentUserId();

  if (!teacherId) {
    return null;
  }

  await connectDatabase();

  const [exams, corrections] = await Promise.all([
    ExamModel.find({ teacherId }).lean(),

    CorrectionModel.find({
      teacherId,
    })
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  /*
   * ============================================================
   * ESTATÍSTICAS GERAIS
   * ============================================================
   */

  const average = corrections.length
    ? corrections.reduce((sum, item) => sum + (item.score ?? 0), 0) /
      corrections.length
    : 0;

  const totalCorrectAnswers = corrections.reduce(
    (sum, item) => sum + (item.correctAnswers ?? 0),
    0,
  );

  const totalQuestionsAnswered = corrections.reduce(
    (sum, item) => sum + (item.totalQuestions ?? 0),
    0,
  );

  const accuracy =
    (totalCorrectAnswers / Math.max(1, totalQuestionsAnswered)) * 100;

  const stats = [
    {
      label: "Provas criadas",
      value: exams.length,
      icon: FileText,
    },

    {
      label: "Provas corrigidas",
      value: corrections.length,
      icon: ScanLine,
    },

    {
      label: "Média das notas",
      value: average.toFixed(1),
      icon: Target,
    },

    {
      label: "Taxa de acerto",
      value: `${accuracy.toFixed(0)}%`,
      icon: TrendingUp,
    },
  ];

  /*
   * ============================================================
   * MAPA DE PROVAS
   * ============================================================
   *
   * A estrutura atual da prova é:
   *
   * exam.classes = [
   *   {
   *     classId,
   *     className
   *   }
   * ]
   *
   * Uma prova pode possuir uma ou várias turmas.
   *
   * Como o DashboardQuestionStats precisa saber a turma
   * associada à prova, mantemos aqui a primeira turma.
   *
   * A estrutura continua compatível com o componente atual.
   */

  type ExamInfo = {
    title: string;
    classId: string;
    className: string;
  };

  const examInfoById = new Map<string, ExamInfo>();

  for (const exam of exams) {
    const examId = String(exam._id);

    const firstClass =
      Array.isArray(exam.classes) && exam.classes.length > 0
        ? exam.classes[0]
        : null;

    examInfoById.set(examId, {
      title: exam.title ?? "Prova sem título",

      classId: firstClass ? String(firstClass.classId) : "",

      className: firstClass?.className ?? "Turma não informada",
    });
  }

  /*
   * ============================================================
   * QUESTÕES COM MAIS ERROS
   *
   * Agrupamento:
   *
   * turma + prova + questão
   *
   * Isso evita misturar a mesma questão de provas/turmas
   * diferentes.
   * ============================================================
   */

  type QuestionAgg = {
    examId: string;
    examTitle: string;

    classId: string;
    className: string;

    questionNumber: number;

    attempts: number;
    wrongs: number;
  };

  const questionMap = new Map<string, QuestionAgg>();

  for (const correction of corrections) {
    const examId = String(correction.examId);

    const examInfo = examInfoById.get(examId);

    if (!examInfo) {
      continue;
    }

    const answers = correction.answers as
      | Array<{
          questionNumber: number;
          isCorrect: boolean;
          markedAnswer?: string | null;
        }>
      | undefined;

    if (!Array.isArray(answers) || answers.length === 0) {
      continue;
    }

    for (const answer of answers) {
      const questionNumber = Number(answer.questionNumber);

      if (!Number.isInteger(questionNumber) || questionNumber < 1) {
        continue;
      }

      /*
       * A chave considera:
       *
       * turma
       * prova
       * questão
       */

      const key = `${examInfo.classId}:${examId}:${questionNumber}`;

      const isWrong = !answer.isCorrect;

      const existing = questionMap.get(key);

      if (existing) {
        existing.attempts += 1;

        if (isWrong) {
          existing.wrongs += 1;
        }
      } else {
        questionMap.set(key, {
          examId,

          examTitle: examInfo.title,

          classId: examInfo.classId,

          className: examInfo.className,

          questionNumber,

          attempts: 1,

          wrongs: isWrong ? 1 : 0,
        });
      }
    }
  }

  /*
   * ============================================================
   * TRANSFORMA OS DADOS PARA O COMPONENTE
   * ============================================================
   */

  const questionStats = Array.from(questionMap.values())
    .map((item) => ({
      ...item,

      errorRate: item.attempts > 0 ? (item.wrongs / item.attempts) * 100 : 0,
    }))
    .sort((a, b) => {
      if (b.wrongs !== a.wrongs) {
        return b.wrongs - a.wrongs;
      }

      return b.errorRate - a.errorRate;
    });

  /*
   * ============================================================
   * TURMAS DISPONÍVEIS
   * ============================================================
   *
   * Uma prova pode possuir várias turmas.
   *
   * Portanto, percorremos:
   *
   * exams
   *   └── classes
   *        ├── classId
   *        └── className
   *
   * Não utilizamos mais:
   *
   * exam.classId
   * exam.className
   */

  const classesMap = new Map<
    string,
    {
      id: string;
      name: string;
    }
  >();

  for (const exam of exams) {
    const examClasses = Array.isArray(exam.classes) ? exam.classes : [];

    for (const examClass of examClasses) {
      const classId = String(examClass.classId);

      const className = examClass.className ?? "Turma não informada";

      if (!classesMap.has(classId)) {
        classesMap.set(classId, {
          id: classId,
          name: className,
        });
      }
    }
  }

  const classes = Array.from(classesMap.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );

  /*
   * ============================================================
   * SERIALIZA OS DADOS
   * ============================================================
   */

  const serializedQuestionStats = questionStats.map((item) => ({
    examId: item.examId,

    examTitle: item.examTitle,

    classId: item.classId,

    className: item.className,

    questionNumber: item.questionNumber,

    attempts: item.attempts,

    wrongs: item.wrongs,

    errorRate: item.errorRate,
  }));

  /*
   * ============================================================
   * RENDER
   * ============================================================
   */

  return (
    <div className="space-y-8">
      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>

          <p className="text-sm text-slate-500">
            Visão geral das suas provas e correções.
          </p>
        </div>

        <div className="flex gap-2">
          <Link
            className="
              rounded-md
              border
              border-slate-200
              bg-white
              px-3
              py-2
              text-sm
              font-medium
              shadow-sm
              transition
              hover:bg-slate-50
            "
            href="/exams"
          >
            Nova prova
          </Link>

          <Link
            className="
              rounded-md
              bg-[#007782]
              px-3
              py-2
              text-sm
              font-medium
              text-white
              shadow-sm
              transition
              hover:bg-[#00666b]
            "
            href="/correct"
          >
            Corrigir prova
          </Link>
        </div>
      </div>

      {/* ====================================================== */}
      {/* ESTATÍSTICAS */}
      {/* ====================================================== */}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="
                flex
                items-center
                gap-4
                rounded-xl
                border
                border-slate-200
                bg-white
                p-6
                shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]
              "
          >
            <span
              className="
                  grid
                  size-10
                  place-items-center
                  rounded-lg
                  bg-[#e8f5f5]
                  text-[#007782]
                "
            >
              <Icon className="size-5" />
            </span>

            <div>
              <p className="text-2xl font-semibold">{value}</p>

              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </article>
        ))}
      </div>

      {/* ====================================================== */}
      {/* GRÁFICOS / QUESTÕES */}
      {/* ====================================================== */}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ==================================================== */}
        {/* EVOLUÇÃO */}
        {/* ==================================================== */}

        <section
          className="
            rounded-xl
            border
            border-slate-200
            bg-white
            p-6
            shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]
          "
        >
          <h2 className="font-medium">Evolução das notas</h2>

          <p className="mt-1 text-sm text-slate-500">
            As últimas correções aparecerão aqui.
          </p>

          <div
            className="
              mt-8
              grid
              h-36
              place-items-center
              rounded-lg
              bg-slate-50
              text-sm
              text-slate-400
            "
          >
            {corrections.length
              ? `${corrections.length} correção(ões) registrada(s)`
              : "Ainda não há dados para exibir."}
          </div>
        </section>

        {/* ==================================================== */}
        {/* QUESTÕES COM MAIS ERROS */}
        {/* ==================================================== */}

        <DashboardQuestionStats
          questionStats={serializedQuestionStats}
          classes={classes}
        />
      </div>
    </div>
  );
}
