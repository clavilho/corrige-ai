import Link from "next/link";
import { deleteExam } from "@/features/exams/actions";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";

export default async function ExamsPage() {
  const teacherId = await currentUserId();
  await connectDatabase();
  const exams = await ExamModel.find({ teacherId }).sort({ createdAt: -1 }).lean();
 
  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Minhas provas</h2>
        <Link
          href="/exams/form"
          className="rounded-xl bg-[#006F72] px-5 py-2.5 font-semibold text-white hover:brightness-105"
        >
          + Nova prova
        </Link>
      </div>
 
      <div className="mt-6 space-y-4">
        {exams.length === 0 ? (
          <p className="text-slate-600">Nenhuma prova criada ainda.</p>
        ) : (
          exams.map((exam) => (
            <article
              key={exam._id.toString()}
              className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold text-slate-900">{exam.title}</h3>
                <p className="text-sm text-slate-600">
                  {exam.subject || "Sem disciplina"} · {exam.className || "Sem turma"} ·{" "}
                  {exam.questionCount} questões
                </p>
              </div>
 
              <div className="flex items-center gap-4">
                <Link
                  className="text-sm font-semibold text-teal-800"
                  href={`/exams/${exam._id.toString()}`}
                >
                  Gabarito
                </Link>
 
                <form action={deleteExam}>
                  <input type="hidden" name="examId" value={exam._id.toString()} />
                  <button type="submit" className="text-sm text-red-700 hover:underline">
                    Excluir
                  </button>
                </form>
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}