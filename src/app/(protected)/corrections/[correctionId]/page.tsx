import Link from "next/link";
import { notFound } from "next/navigation";
import { CorrectionModel } from "@/features/corrections/correction.model";
import { ExamModel } from "@/features/exams/exam.model";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";

export default async function CorrectionDetailPage({
  params,
}: {
  params: Promise<{ correctionId: string }>;
}) {
  const { correctionId } = await params;
  const teacherId = await currentUserId();
  await connectDatabase();
  const correction = await CorrectionModel.findOne({
    _id: correctionId,
    teacherId,
  }).lean();
  if (!correction) notFound();
  const exam = await ExamModel.findOne({
    _id: correction.examId,
    teacherId,
  }).lean();
  return (
    <div>
      <Link href="/corrections" className="text-sm text-teal-800">
        ← Voltar ao histórico
      </Link>
      <h1 className="mt-4 text-3xl font-bold">
        {exam?.title ?? "Resultado da correção"}
      </h1>
      <p className="mt-1 text-slate-600">
        {correction.studentName || "Aluno não informado"} ·{" "}
        {new Date(correction.createdAt).toLocaleString("pt-BR")}
      </p>
      {correction.warnings.length > 0 && (
        <aside className="mt-5 rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          {correction.warnings.map((warning) => (
            <p key={warning}>{warning}</p>
          ))}
        </aside>
      )}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Nota final", correction.score.toFixed(1)],
          ["Questões", correction.totalQuestions],
          ["Acertos", correction.correctAnswers],
          ["Erros", correction.wrongAnswers],
          ["Não identificadas", correction.unidentified],
        ].map(([label, value]) => (
          <article key={label} className="rounded-xl border bg-white p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="mt-1 text-2xl font-bold">{value}</p>
          </article>
        ))}
      </div>
      <section className="mt-7 overflow-hidden rounded-xl border bg-white">
        <h2 className="border-b p-4 font-bold">Detalhamento por questão</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left">
              <tr>
                <th className="p-3">Questão</th>
                <th className="p-3">Marcada</th>
                <th className="p-3">Gabarito</th>
                <th className="p-3">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {correction.answers.map((answer) => (
                <tr key={answer.questionNumber} className="border-t">
                  <td className="p-3">{answer.questionNumber}</td>
                  <td className="p-3">{answer.markedAnswer ?? "—"}</td>
                  <td className="p-3">{answer.correctAnswer}</td>
                  <td className="p-3">
                    <span
                      className={
                        answer.isCorrect ? "text-green-700" : "text-red-700"
                      }
                    >
                      {answer.isCorrect ? "Correta" : "Incorreta"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      {correction.imageDataUrl && (
        <section className="mt-7 max-w-sm">
          <h2 className="mb-3 font-bold">Imagem enviada</h2>
          <img
            src={correction.imageDataUrl}
            alt="Folha de respostas enviada"
            className="rounded border"
          />
        </section>
      )}
    </div>
  );
}
