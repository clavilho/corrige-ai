import Link from "next/link";
import { Button } from "@/components/ui/button";
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
      <Button variant="link" render={<Link href="/exams" />} className="px-0">
        ← Voltar às provas
      </Button>
      <h1 className="mt-4 text-3xl font-bold">{(exam as any).title}</h1>
      <p className="mt-1 text-slate-600">Defina uma resposta correta para cada questão.</p>
      <div className="mt-6">
        <AnswerKeyEditor
          examId={(exam as any)._id.toString()}
          examTitle={(exam as any).title ?? ""}
          questionCount={(exam as any).questionCount}
          alternativeCount={(exam as any).alternativeCount}
          initialAnswers={(exam as any).answerKey ?? []}
        />
      </div>
    </div>
  );
}