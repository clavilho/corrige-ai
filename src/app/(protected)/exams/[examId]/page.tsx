import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerKeyEditor } from "@/components/answer-key-editor";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";

export default async function ExamDetailPage({
  params,
}: {
  params: Promise<{ examId: string }>;
}) {
  const { examId } = await params;
  const teacherId = await currentUserId();
  await connectDatabase();
  const exam = await ExamModel.findOne({ _id: examId, teacherId }).lean();
  if (!exam) notFound();
  return (
    <div>
      <Link href="/exams" className="text-sm text-teal-800">
        ← Voltar às provas
      </Link>
      <h1 className="mt-4 text-3xl font-bold">{exam.title}</h1>
      <p className="mt-1 text-slate-600">
        Defina uma resposta correta para cada questão.
      </p>
      <div className="mt-6">
        <AnswerKeyEditor
          examId={exam._id.toString()}
          questionCount={exam.questionCount}
          alternativeCount={exam.alternativeCount}
          initialAnswers={exam.answerKey}
        />
      </div>
    </div>
  );
}
