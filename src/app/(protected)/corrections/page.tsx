import Link from "next/link";
import { deleteCorrection } from "@/features/corrections/actions";
import { CorrectionModel } from "@/features/corrections/correction.model";
import { ExamModel } from "@/features/exams/exam.model";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";

export default async function CorrectionsPage() {
  const teacherId = await currentUserId();
  await connectDatabase();
  const corrections = await CorrectionModel.find({ teacherId }).sort({ createdAt: -1 }).lean();
  const exams = await ExamModel.find({
    _id: { $in: corrections.map((item) => item.examId) },
    teacherId,
  }).lean();
  const titles = new Map(exams.map((exam) => [exam._id.toString(), exam.title]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Minhas correções</h1>
        <p className="mt-1 text-slate-600">Histórico de resultados processados.</p>
      </div>

      <div className="space-y-4">
        {corrections.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <p className="text-slate-600">Nenhuma correção registrada ainda.</p>
          </div>
        ) : (
          corrections.map((correction) => (
            <article
              key={correction._id.toString()}
              className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
            >
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-900 truncate">
                  {titles.get(correction.examId.toString()) ?? "Prova removida"}
                </h2>
                <p className="text-sm text-slate-600">
                  {correction.studentName || "Aluno não informado"} ·{" "}
                  {new Date(correction.createdAt).toLocaleString("pt-BR")}
                </p>
              </div>

              <div className="flex items-center gap-6">
                <div className="text-right">
                  <div className="text-xl font-bold text-slate-900">{Number(correction.score).toFixed(1)}</div>
                  <p className="text-xs text-slate-500">nota</p>
                </div>

                <Link
                  href={`/corrections/${correction._id.toString()}`}
                  className="text-sm font-semibold text-teal-800"
                >
                  Detalhes
                </Link>

                <form action={deleteCorrection} className="m-0">
                  <input type="hidden" name="correctionId" value={correction._id.toString()} />
                  <button
                    type="submit"
                    className="text-sm text-red-700 hover:underline"
                    aria-label={`Excluir correção ${correction._id.toString()}`}
                  >
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