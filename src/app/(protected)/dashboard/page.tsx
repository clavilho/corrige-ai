import Link from "next/link";
import { FileText, ScanLine, Target, TrendingUp } from "lucide-react";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { CorrectionModel } from "@/features/corrections/correction.model";
import { ExamModel } from "@/features/exams/exam.model";

export default async function DashboardPage() {
  const teacherId = await currentUserId();
  await connectDatabase();

  const [exams, corrections] = await Promise.all([
    ExamModel.find({ teacherId }).lean(),
    CorrectionModel.find({ teacherId }).sort({ createdAt: -1 }).lean(),
  ]);

  const average = corrections.length
    ? corrections.reduce((sum, item) => sum + (item.score ?? 0), 0) / corrections.length
    : 0;

  const accuracy =
    (corrections.reduce((sum, item) => sum + (item.correctAnswers ?? 0), 0) /
      Math.max(
        1,
        corrections.reduce((sum, item) => sum + (item.totalQuestions ?? 0), 0),
      )) *
    100;

  const stats = [
    { label: "Provas criadas", value: exams.length, icon: FileText },
    { label: "Provas corrigidas", value: corrections.length, icon: ScanLine },
    { label: "Média das notas", value: average.toFixed(1), icon: Target },
    {
      label: "Taxa de acerto",
      value: `${accuracy.toFixed(0)}%`,
      icon: TrendingUp,
    },
  ];

  // --- build question-level error stats ---
  // map key => `${examId}:${questionNumber}`
  type Agg = {
    examId: string;
    examTitle: string;
    questionNumber: number;
    attempts: number;
    wrongs: number;
  };

  const examTitleById = new Map<string, string>();
  for (const ex of exams) {
    const id = String((ex as any)._id ?? ex._id);
    examTitleById.set(id, (ex as any).title ?? "Prova sem título");
  }

  const aggMap = new Map<string, Agg>();

  for (const corr of corrections) {
    const examId = String((corr as any).examId ?? corr.examId);
    const examTitle = examTitleById.get(examId) ?? "Prova desconhecida";

    // prefer 'answers' (AnswerRow[] with isCorrect), fallback: skip if absent
    const answers = (corr as any).answers as
      | Array<{ questionNumber: number; isCorrect: boolean; markedAnswer?: string }>
      | undefined;

    if (!Array.isArray(answers) || answers.length === 0) {
      // if no detailed answers are available, skip this correction for per-question stats
      continue;
    }

    for (const a of answers) {
      const q = Number(a.questionNumber);
      if (!Number.isInteger(q) || q < 1) continue;

      const key = `${examId}:${q}`;
      const entry = aggMap.get(key);
      const isWrong = !a.isCorrect; // treat not correct (including null/blank) as wrong

      if (entry) {
        entry.attempts += 1;
        if (isWrong) entry.wrongs += 1;
      } else {
        aggMap.set(key, {
          examId,
          examTitle,
          questionNumber: q,
          attempts: 1,
          wrongs: isWrong ? 1 : 0,
        });
      }
    }
  }

  // convert to array and compute error percentage
  const questionStats = Array.from(aggMap.values())
    .map((v) => ({
      ...v,
      errorRate: v.attempts > 0 ? (v.wrongs / v.attempts) * 100 : 0,
    }))
    // sort by number of wrongs desc, then by errorRate desc
    .sort((a, b) => {
      if (b.wrongs !== a.wrongs) return b.wrongs - a.wrongs;
      return b.errorRate - a.errorRate;
    })
    .slice(0, 5); // top 5

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Visão geral das suas provas e correções.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-medium shadow-sm"
            href="/exams"
          >
            Nova prova
          </Link>
          <Link
            className="rounded-md bg-[#007782] px-3 py-2 text-sm font-medium text-white shadow-sm"
            href="/correct"
          >
            Corrigir prova
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <article
            key={label}
            className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]"
          >
            <span className="grid size-10 place-items-center rounded-lg bg-[#e8f5f5] text-[#007782]">
              <Icon className="size-5" />
            </span>
            <div>
              <p className="text-2xl font-semibold">{value}</p>
              <p className="text-xs text-slate-500">{label}</p>
            </div>
          </article>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]">
          <h2 className="font-medium">Evolução das notas</h2>
          <p className="mt-1 text-sm text-slate-500">
            As últimas correções aparecerão aqui.
          </p>
          <div className="mt-8 grid h-36 place-items-center rounded-lg bg-slate-50 text-sm text-slate-400">
            {corrections.length
              ? `${corrections.length} correção(ões) registrada(s)`
              : "Ainda não há dados para exibir."}
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]">
          <h2 className="font-medium">Questões com mais erros</h2>
          <p className="mt-1 text-sm text-slate-500">
            Questões com maior número de respostas incorretas (ou não identificadas) — top 5.
          </p>

          <div className="mt-4 space-y-3">
            {questionStats.length === 0 ? (
              <div className="rounded-lg bg-slate-50 p-6 text-sm text-slate-400">
                Ainda não há dados suficientes para identificar as questões mais problemáticas.
              </div>
            ) : (
              <ul className="space-y-2">
                {questionStats.map((q) => (
                  <li key={`${q.examId}-${q.questionNumber}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                    <div>
                      <div className="text-sm text-slate-600">
                        <strong className="text-slate-800">Questão {q.questionNumber}</strong>{" "}
                        <span className="text-xs text-slate-500"> — {q.examTitle}</span>
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        {q.wrongs} erro(s) em {q.attempts} tentativa(s) — {q.errorRate.toFixed(0)}% de erro
                      </div>
                    </div>

                    <div className="text-sm font-semibold text-slate-800">
                      {q.errorRate.toFixed(0)}%
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}