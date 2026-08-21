"use server";

import { redirect } from "next/navigation";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";
import { revalidatePath } from "next/cache";
import { z } from "zod";

export interface ExamFormData {
  title: string;
  examDate: string;
  subject: string;
  classId: string;
  className: string;
  questionCount: number;
  alternativeCount: number;
  examGrade: number;
}

export interface AnswerKeyItem {
  questionNumber: number;
  correctAnswer: string;
}

export async function createExam(formData: FormData) {
  const data: ExamFormData = {
    title: String(formData.get("title") ?? ""),
    examDate: String(formData.get("date") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    classId: String(formData.get("classId") ?? ""),
    className: String(formData.get("className") ?? ""),
    questionCount: Number(formData.get("questionCount") ?? 0),
    alternativeCount: Number(formData.get("alternativeCount") ?? 0),
    examGrade: Number(formData.get("totalPoints") ?? 0),
  };

  if (!data.title) {
    throw new Error("Informe o nome da prova.");
  }

  if (!data.subject) {
    throw new Error("Informe a disciplina.");
  }

  if (!data.classId) {
    throw new Error("Selecione uma turma.");
  }

  if (!data.className) {
    throw new Error("Nome da turma não informado.");
  }

  if (data.questionCount < 1 || data.questionCount > 100) {
    throw new Error("A quantidade de questões deve estar entre 1 e 100.");
  }

  if (data.alternativeCount < 2 || data.alternativeCount > 6) {
    throw new Error("A quantidade de alternativas deve estar entre 2 e 6.");
  }

  const answerKeyValue = formData.get("answerKey");

  let answers: AnswerKeyItem[] = [];

  if (typeof answerKeyValue === "string") {
    try {
      const parsed = JSON.parse(answerKeyValue);

      if (Array.isArray(parsed)) {
        answers = parsed.map((answer, index) => ({
          questionNumber: index + 1,
          correctAnswer: String(answer ?? ""),
        }));
      }
    } catch {
      throw new Error("Gabarito inválido.");
    }
  }

  await createExamWithAnswerKey(data, answers);
}

export async function createExamWithAnswerKey(
  data: ExamFormData,
  answers: AnswerKeyItem[],
) {
  const teacherId = await currentUserId();

  if (!teacherId) {
    throw new Error("Usuário não autenticado.");
  }

  await connectDatabase();

  await ExamModel.create({
    teacherId,

    // Identificação da turma
    classId: data.classId,

    // Nome da turma salvo como snapshot
    className: data.className,

    title: data.title,
    subject: data.subject,

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

async function teacherId() {
  const id = await currentUserId();
  if (!id) redirect("/auth");
  return id;
}
