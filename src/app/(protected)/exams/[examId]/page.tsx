import Link from "next/link";
import { notFound } from "next/navigation";
import { AnswerKeyEditor } from "@/components/answer-key-editor";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";
import { ArrowLeft } from "lucide-react";

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
        <Link
              href="/exams"
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
                      duration-200
                      hover:-translate-x-1
                      hover:border-[#006F72]
                      hover:bg-[#EAF7F7]
                      hover:text-[#006F72]
                    "
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar às provas
            </Link>

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