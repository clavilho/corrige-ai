import { CorrectionForm } from "@/components/correction-form";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";

export default async function CorrectPage() {
  const teacherId = await currentUserId();
  await connectDatabase();
  const exams = await ExamModel.find({
    teacherId,
    $expr: { $eq: [{ $size: "$answerKey" }, "$questionCount"] },
  })
    .sort({ createdAt: -1 })
    .lean();
  return (
    <div className="max-w-xl">
      <h1 className="text-3xl font-bold">Corrigir prova por foto</h1>
      <p className="mt-2 text-slate-600">
        Envie uma foto bem iluminada e enquadrada da folha de respostas.
      </p>
      {exams.length ? (
        <div className="mt-6">
          <CorrectionForm
            exams={exams.map((exam) => ({
              id: exam._id.toString(),
              title: exam.title,
              questionCount: exam.questionCount,
            }))}
          />
        </div>
      ) : (
        <p className="mt-6 rounded border border-amber-300 bg-amber-50 p-4 text-amber-900">
          Cadastre e complete o gabarito de uma prova antes de iniciar uma
          correção.
        </p>
      )}
    </div>
  );
}
