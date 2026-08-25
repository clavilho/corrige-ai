import Link from "next/link";
import DeleteCorrectionButton from "@/components/delete-buttons/delete-correction-button";

import { CorrectionModel } from "@/features/corrections/correction.model";
import { ExamModel } from "@/features/exams/exam.model";
import { StudentModel } from "@/features/students/student.model";

import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";

type CorrectionItem = {
  id: string;
  studentName: string;
  score: number;
  createdAt: Date;
};

type ExamGroup = {
  id: string;
  title: string;
  corrections: CorrectionItem[];
};

type ClassGroup = {
  id: string;
  name: string;
  exams: ExamGroup[];
};

export default async function CorrectionsPage() {
  const teacherId = await currentUserId();

  if (!teacherId) {
    return null;
  }

  await connectDatabase();

  /*
   * Busca todas as correções do professor.
   */
  const corrections = await CorrectionModel.find({
    teacherId,
  })
    .sort({ createdAt: -1 })
    .lean();

  /*
   * Nenhuma correção.
   */
  if (corrections.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Minhas correções</h1>

          <p className="mt-1 text-slate-600">
            Histórico de resultados processados.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-slate-600">Nenhuma correção registrada ainda.</p>
        </div>
      </div>
    );
  }

  /*
   * Busca somente as provas relacionadas às correções.
   */
  const examIds = corrections.map((correction) => correction.examId);

  const exams = await ExamModel.find({
    _id: { $in: examIds },
    teacherId,
  }).lean();

  /*
   * Mapa das provas:
   *
   * examId -> prova
   */
  const examsMap = new Map(exams.map((exam) => [exam._id.toString(), exam]));

  /*
   * Busca os alunos relacionados às correções.
   *
   * Precisamos disso porque agora uma mesma prova
   * pode estar associada a várias turmas.
   *
   * A correção possui o studentId, então usamos
   * o aluno para descobrir a turma correta.
   */
  const studentIds = corrections
    .map((correction) => correction.studentId)
    .filter(Boolean);

  const students = await StudentModel.find({
    _id: { $in: studentIds },
    teacherId,
  })
    .select("_id classId className")
    .lean();

  /*
   * Mapa dos alunos:
   *
   * studentId -> aluno
   */
  const studentsMap = new Map(
    students.map((student) => [student._id.toString(), student]),
  );

  /*
   * Estrutura final:
   *
   * turma
   *   └── prova
   *         └── correções
   */
  const classesMap = new Map<string, ClassGroup>();

  for (const correction of corrections) {
    /*
     * Busca a prova da correção.
     */
    const exam = examsMap.get(correction.examId.toString());

    if (!exam) {
      continue;
    }

    /*
     * Busca o aluno da correção.
     */
    const student = correction.studentId
      ? studentsMap.get(correction.studentId.toString())
      : null;

    /*
     * ============================================================
     * DESCOBRE A TURMA
     * ============================================================
     *
     * Prioridade:
     *
     * 1. Turma do aluno
     * 2. classId antigo da prova
     * 3. primeira turma da prova
     * 4. fallback
     */

    let classId = "";
    let className = "";

    /*
     * 1. NOVO MODELO
     *
     * A turma vem do aluno.
     */
    if (student?.classId) {
      classId = student.classId.toString();

      /*
       * Tenta descobrir o nome da turma
       * através das classes da prova.
       */
      if (Array.isArray(exam.classes)) {
        const examClass = exam.classes.find(
          (item: any) => item.classId?.toString() === classId,
        );

        if (examClass) {
          className = examClass.className ?? examClass.className ?? "";
        }
      }

      /*
       * Caso a prova não tenha o nome salvo,
       * tenta usar o nome que veio do aluno.
       */
      if (!className) {
        className = (student as any).className ?? "";
      }
    }

    /*
     * 2. COMPATIBILIDADE COM O MODELO ANTIGO
     *
     * Algumas provas antigas ainda podem possuir
     * classId diretamente na prova.
     */
    if (!classId && (exam as any).classId) {
      classId = (exam as any).classId.toString();

      className = (exam as any).className ?? "";
    }

    /*
     * 3. PROVA COM APENAS UMA TURMA
     *
     * Se não conseguimos obter a turma através
     * do aluno, mas a prova possui uma única turma,
     * usamos essa turma.
     */
    if (!classId && Array.isArray(exam.classes) && exam.classes.length === 1) {
      const examClass = exam.classes[0];

      classId = examClass.classId?.toString() ?? examClass.classId?.toString() ?? "";

      className = examClass.className ?? examClass.className ?? "";
    }

    /*
     * 4. FALLBACK
     */
    if (!classId) {
      classId = "unknown";
    }

    if (!className) {
      className = "Turma não informada";
    }

    /*
     * Cria a turma caso ainda não exista.
     */
    if (!classesMap.has(classId)) {
      classesMap.set(classId, {
        id: classId,
        name: className,
        exams: [],
      });
    }

    const classGroup = classesMap.get(classId)!;

    /*
     * Procura a prova dentro da turma.
     */
    let examGroup = classGroup.exams.find(
      (item) => item.id === exam._id.toString(),
    );

    /*
     * Cria a prova caso ainda não exista.
     */
    if (!examGroup) {
      examGroup = {
        id: exam._id.toString(),
        title: exam.title,
        corrections: [],
      };

      classGroup.exams.push(examGroup);
    }

    /*
     * Adiciona a correção à prova.
     */
    examGroup.corrections.push({
      id: correction._id.toString(),

      studentName: correction.studentName || "Aluno não informado",

      score: Number(correction.score ?? 0),

      createdAt: correction.createdAt,
    });
  }

  const classes = Array.from(classesMap.values());

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Minhas correções</h1>

        <p className="mt-1 text-slate-600">
          Histórico de resultados organizados por turma e prova.
        </p>
      </div>

      {/* TURMAS */}
      <div className="space-y-8">
        {classes.map((classGroup) => (
          <section key={classGroup.id} className="space-y-4">
            {/* TURMA */}
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006F72] text-sm font-bold text-white">
                {classGroup.name.slice(0, 2).toUpperCase()}
              </div>

              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  {classGroup.name}
                </h2>

                <p className="text-sm text-slate-500">
                  {classGroup.exams.length}{" "}
                  {classGroup.exams.length === 1 ? "prova" : "provas"}
                </p>
              </div>
            </div>

            {/* PROVAS */}
            <div className="space-y-5">
              {classGroup.exams.map((examGroup) => (
                <div
                  key={examGroup.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
                  {/* CABEÇALHO DA PROVA */}
                  <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-5 py-4">
                    <div>
                      <h3 className="font-semibold text-slate-900">
                        {examGroup.title}
                      </h3>

                      <p className="mt-1 text-xs text-slate-500">
                        {examGroup.corrections.length}{" "}
                        {examGroup.corrections.length === 1
                          ? "correção"
                          : "correções"}
                      </p>
                    </div>

                    <Link
                      href={`/exams/${examGroup.id}`}
                      className="rounded-lg border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-700 hover:text-white"
                    >
                      Ver prova
                    </Link>
                  </div>

                  {/* CORREÇÕES */}
                  <div className="divide-y divide-slate-100">
                    {examGroup.corrections.map((correction) => (
                      <article
                        key={correction.id}
                        className="flex flex-wrap items-center gap-4 px-5 py-4"
                      >
                        {/* ALUNO */}
                        <div className="min-w-0 flex-1">
                          <h4 className="truncate font-semibold text-slate-900">
                            {correction.studentName}
                          </h4>

                          <p className="text-sm text-slate-500">
                            {new Date(correction.createdAt).toLocaleString(
                              "pt-BR",
                            )}
                          </p>
                        </div>

                        {/* NOTA */}
                        <div className="text-right">
                          <div className="text-xl font-bold text-slate-900">
                            {correction.score.toFixed(1)}
                          </div>

                          <p className="text-xs text-slate-500">nota</p>
                        </div>

                        {/* AÇÕES */}
                        <div className="flex items-center gap-3">
                          <Link
                            href={`/corrections/${correction.id}`}
                            className="inline-flex items-center rounded-md border border-teal-700 px-3 py-2 text-sm font-semibold text-teal-700 transition hover:bg-teal-700 hover:text-white"
                          >
                            Detalhes
                          </Link>

                          <DeleteCorrectionButton
                            correctionId={correction.id}
                            studentName={correction.studentName}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
