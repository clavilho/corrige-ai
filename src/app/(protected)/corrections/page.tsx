import Link from "next/link";
import { deleteCorrection } from "@/features/corrections/actions";
import { CorrectionModel } from "@/features/corrections/correction.model";
import { ExamModel } from "@/features/exams/exam.model";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";

export default async function CorrectionsPage() {
  const teacherId = await currentUserId();
  await connectDatabase();
  const corrections = await CorrectionModel.find({ teacherId })
    .sort({ createdAt: -1 })
    .lean();
  const exams = await ExamModel.find({
    _id: { $in: corrections.map((item) => item.examId) },
    teacherId,
  }).lean();
  const titles = new Map(
    exams.map((exam) => [exam._id.toString(), exam.title]),
  );
  return (
    <div>
      <h1 className="text-3xl font-bold">Minhas correções</h1>
      <p className="mt-1 text-slate-600">
        Histórico de resultados processados.
      </p>
      <div className="mt-6 space-y-3">
        {corrections.length === 0 ? (
          <p className="text-slate-600">Nenhuma correção registrada ainda.</p>
        ) : (
          corrections.map((correction) => (
            <article
              key={correction._id.toString()}
              className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4"
            >
              <div className="flex-1">
                <h2 className="font-semibold">
                  {titles.get(correction.examId.toString()) ?? "Prova removida"}
                </h2>
                <p className="text-sm text-slate-600">
                  {correction.studentName || "Aluno não informado"} ·{" "}
                  {new Date(correction.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="text-right">
                <strong className="text-xl">
                  {correction.score.toFixed(1)}
                </strong>
                <p className="text-xs text-slate-500">nota</p>
              </div>
              <Link
                href={`/corrections/${correction._id.toString()}`}
                className="text-sm font-semibold text-teal-800"
              >
                Detalhes
              </Link>
              <form action={deleteCorrection}>
                <input
                  type="hidden"
                  name="correctionId"
                  value={correction._id.toString()}
                />
                <button className="text-sm text-red-700">Excluir</button>
              </form>
            </article>
          ))
        )}
      </div>
    </div>
  );
}
