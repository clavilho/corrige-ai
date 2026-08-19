"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "./exam.model";
import { AnswerKeyItem, ExamFormData } from "@/types/ExamFormData";

const examInput = z.object({
  title: z.string().trim().min(2).max(160),
  subject: z.string().trim().max(120),
  className: z.string().trim().max(120),
  examDate: z.string().optional(),
  questionCount: z.coerce.number().int().min(1).max(120),
  alternativeCount: z.coerce.number().int().min(2).max(6),
});
async function teacherId() {
  const id = await currentUserId();
  if (!id) redirect("/auth");
  return id;
}

export async function createExamWithAnswerKey(
  data: ExamFormData,
  answers: AnswerKeyItem[]
) {
  const teacherId = await currentUserId();
  await connectDatabase();
 
  await ExamModel.create({
    teacherId,
    title: data.title,
    subject: data.subject,
    className: data.className,
    examDate: data.examDate ? new Date(data.examDate) : undefined,
    questionCount: data.questionCount,
    alternativeCount: data.alternativeCount,
    examGrade: data.examGrade,
    answerKey: answers,
  });
 
  redirect("/exams");
}

export async function deleteExam(formData: FormData) {
  const id = await teacherId();
  const examId = z.string().min(1).parse(formData.get("examId"));
  await connectDatabase();
  await ExamModel.deleteOne({ _id: examId, teacherId: id });
  revalidatePath("/exams");
}
// use server file (where saveAnswerKey is defined)
export async function saveAnswerKey(formData: FormData) {
  const id = await teacherId();
  const examId = z.string().min(1).parse(formData.get("examId"));
  const raw = z.string().parse(formData.get("answers"));
  const answers = z
    .array(
      z.object({
        questionNumber: z.number().int().positive(),
        correctAnswer: z.string().regex(/^[A-F]$/),
      }),
    )
    .parse(JSON.parse(raw));

  await connectDatabase();
  const exam = await ExamModel.findOne({ _id: examId, teacherId: id });
  if (!exam) redirect("/exams");

  if (
    answers.length !== exam.questionCount ||
    new Set(answers.map((item) => item.questionNumber)).size !== answers.length
  ) {
    throw new Error("Preencha uma resposta para cada questão.");
  }

  await ExamModel.updateOne(
    { _id: examId, teacherId: id },
    { $set: { answerKey: answers } },
  );

  // Revalidate pages if needed
  revalidatePath(`/exams/${examId}`);
  revalidatePath("/dashboard");

  // Redirect to the exams list after saving (per your request)
  redirect("/exams");
}
