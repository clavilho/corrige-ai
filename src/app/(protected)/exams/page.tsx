import Link from "next/link";
import { Button } from "@/components/ui/button";
import DeleteExamButton from "@/components/delete-buttons/delete-exam-button";
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
        <Button render={<Link href="/exams/form" />}>
          + Nova prova
        </Button>
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
                <Button variant="link" render={<Link href={`/exams/${exam._id.toString()}`} />}>
                  Gabarito
                </Button>
 
                <DeleteExamButton examId={exam._id.toString()} examTitle={exam.title} />
              </div>
            </article>
          ))
        )}
      </div>
    </div>
  );
}