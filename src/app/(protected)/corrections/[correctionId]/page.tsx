import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  FileText,
  Users,
} from "lucide-react";

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

  if (!correction) {
    notFound();
  }

  const exam = await ExamModel.findOne({
    _id: correction.examId,
    teacherId,
  }).lean();

  const totalQuestions =
    exam?.questionCount ??
    correction.totalQuestions ??
    correction.answers?.length ??
    0;

  const correctAnswers =
    correction.correctAnswers ??
    (correction.answers
      ? correction.answers.filter(
          (answer: any) =>
            answer.markedAnswer === answer.correctAnswer,
        ).length
      : 0);

  const wrongAnswers =
    correction.wrongAnswers ??
    Math.max(0, totalQuestions - correctAnswers);

  const unidentified =
    correction.unidentified ??
    (correction.answers
      ? correction.answers.filter(
          (answer: any) => !answer.markedAnswer,
        ).length
      : 0);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div>
        <Link
          href="/corrections"
          className="
            inline-flex
            items-center
            gap-2
            rounded-xl
            border
            border-slate-200
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-slate-700
            shadow-sm
            transition-all
            hover:-translate-x-1
            hover:border-[#006F72]
            hover:bg-[#EAF7F7]
            hover:text-[#006F72]
          "
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao histórico
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          {exam?.title ?? "Resultado da correção"}
        </h1>

        <p className="mt-1 text-slate-600">
          {correction.studentName || "Aluno não informado"} ·{" "}
          {new Date(correction.createdAt).toLocaleString("pt-BR")}
        </p>
      </div>

      {/* AÇÕES RÁPIDAS */}
      <section
        className="
          rounded-2xl
          border
          border-teal-100
          bg-teal-50
          p-5
        "
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-semibold text-slate-900">
              Correção concluída
            </h2>

            <p className="mt-1 text-sm text-slate-600">
              Continue corrigindo sem precisar refazer todo o fluxo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {/* OUTRO ALUNO DA MESMA PROVA */}
            <Link
              href={`/correct?examId=${correction.examId.toString()}`}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                bg-[#006F72]
                px-4
                py-2.5
                text-sm
                font-semibold
                text-white
                transition
                hover:bg-[#005B5E]
              "
            >
              <Users className="h-4 w-4" />
              Corrigir outro aluno
            </Link>

            {/* OUTRA PROVA */}
            <Link
              href="/correct"
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:border-teal-600
                hover:text-teal-700
              "
            >
              <Camera className="h-4 w-4" />
              Corrigir outra prova
            </Link>

            {/* HISTÓRICO */}
            <Link
              href="/corrections"
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                border-slate-200
                bg-white
                px-4
                py-2.5
                text-sm
                font-semibold
                text-slate-700
                transition
                hover:border-teal-600
                hover:text-teal-700
              "
            >
              <FileText className="h-4 w-4" />
              Ver histórico
            </Link>
          </div>
        </div>
      </section>

      {/* AVISOS */}
      {correction.warnings &&
        correction.warnings.length > 0 && (
          <aside className="rounded border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
            {correction.warnings.map((warning: string) => (
              <p key={warning}>{warning}</p>
            ))}
          </aside>
        )}

      {/* ESTATÍSTICAS */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [
            "Nota final",
            Number(correction.score).toFixed(1),
          ],
          ["Questões", totalQuestions],
          ["Acertos", correctAnswers],
          ["Erros", wrongAnswers],
          ["Não identificadas", unidentified],
        ].map(([label, value]) => (
          <article
            key={label}
            className="
              rounded-2xl
              border
              border-slate-200
              bg-white
              p-4
              shadow-sm
            "
          >
            <p className="text-sm text-slate-500">
              {label}
            </p>

            <p className="mt-1 text-2xl font-bold">
              {value}
            </p>
          </article>
        ))}
      </div>

      {/* DETALHAMENTO */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <h2 className="border-b p-4 font-bold">
          Detalhamento por questão
        </h2>

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
              {correction.answers.map(
                (answer: any) => (
                  <tr
                    key={answer.questionNumber}
                    className="border-t"
                  >
                    <td className="p-3">
                      {answer.questionNumber}
                    </td>

                    <td className="p-3">
                      {answer.markedAnswer ?? "—"}
                    </td>

                    <td className="p-3">
                      {answer.correctAnswer ?? "—"}
                    </td>

                    <td className="p-3">
                      <span
                        className={
                          answer.isCorrect
                            ? "text-green-700"
                            : "text-red-700"
                        }
                      >
                        {answer.isCorrect
                          ? "Correta"
                          : "Incorreta"}
                      </span>
                    </td>
                  </tr>
                ),
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* IMAGEM */}
      {correction.imageDataUrl && (
        <section className="max-w-md">
          <h2 className="mb-3 font-bold">
            Imagem enviada
          </h2>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <img
              src={correction.imageDataUrl}
              alt="Folha de respostas enviada"
              className="w-full rounded object-contain"
            />
          </div>
        </section>
      )}
    </div>
  );
}