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

/**
 * Schema dos dados enviados pelo formulário.
 */
const examFormSchema = z.object({
  title: z.string().trim().min(1, "O nome da prova é obrigatório."),

  subject: z.string().trim().min(1, "A disciplina é obrigatória."),

  classId: z.string().min(1, "A turma é obrigatória."),

  className: z.string().trim().min(1, "O nome da turma é obrigatório."),

  examDate: z.string().optional(),

  questionCount: z.coerce.number().int().min(1).max(100),

  alternativeCount: z.coerce.number().int().min(2).max(6),

  examGrade: z.coerce.number().min(0),

  answerKey: z.string().min(1, "O gabarito é obrigatório."),
});

const answerKeyItemSchema = z.object({
  questionNumber: z.number().int().min(1),

  correctAnswer: z
    .string()
    .trim()
    .regex(/^[A-F]$/, "Alternativa inválida."),
});

/**
 * Schema completo do gabarito.
 */
const answerKeySchema = z.array(answerKeyItemSchema);

export async function createExam(formData: FormData) {
  const teacherId = await currentUserId();

  if (!teacherId) {
    redirect("/auth");
  }

  const answerKeySchema = z.array(
    z.object({
      questionNumber: z.number().int().positive(),
      correctAnswer: z.string().min(1),
    }),
  );

  const rawData = {
    title: formData.get("title"),

    subject: formData.get("subject"),

    classId: formData.get("classId"),

    className: formData.get("className"),

    examDate: formData.get("date"),

    questionCount: formData.get("questionCount"),

    alternativeCount: formData.get("alternativeCount"),

    examGrade: formData.get("totalPoints"),

    answerKey: formData.get("answerKey"),
  };

  /**
   * Valida os dados básicos.
   */
  const data = examFormSchema.parse(rawData);

  /**
   * Converte o JSON do gabarito para objeto.
   */
  let parsedAnswers: unknown;

  try {
    parsedAnswers = JSON.parse(data.answerKey);
  } catch {
    throw new Error("Gabarito inválido.");
  }

  const answerKey = answerKeySchema.parse(parsedAnswers);

  if (answerKey.length !== data.questionCount) {
    throw new Error(
      "O gabarito precisa ter uma resposta para todas as questões.",
    );
  }

  const questionNumbers = answerKey.map((item) => item.questionNumber);

  const uniqueQuestionNumbers = new Set(questionNumbers);

  if (uniqueQuestionNumbers.size !== data.questionCount) {
    throw new Error("O gabarito possui questões duplicadas ou inválidas.");
  }

  const hasInvalidQuestionNumber = answerKey.some(
    (item) =>
      item.questionNumber < 1 || item.questionNumber > data.questionCount,
  );

  if (hasInvalidQuestionNumber) {
    throw new Error("O gabarito possui uma ou mais questões inválidas.");
  }

  const allowedAlternatives = ["A", "B", "C", "D", "E", "F"].slice(
    0,
    data.alternativeCount,
  );

  const hasInvalidAlternative = answerKey.some(
    (item) => !allowedAlternatives.includes(item.correctAnswer),
  );

  if (hasInvalidAlternative) {
    throw new Error(
      "O gabarito possui uma alternativa que não está disponível na prova.",
    );
  }

  await connectDatabase();

  await ExamModel.create({
    teacherId,

    classId: data.classId,

    className: data.className,

    title: data.title,

    subject: data.subject,

    examDate: data.examDate ? new Date(data.examDate) : undefined,

    questionCount: data.questionCount,

    alternativeCount: data.alternativeCount,

    examGrade: data.examGrade,

    /**
     * IMPORTANTE:
     *
     * Aqui agora estamos salvando objetos:
     *
     * {
     *   questionNumber: 1,
     *   correctAnswer: "A"
     * }
     *
     * e não apenas "A".
     */
    answerKey,
  });

  /**
   * Atualiza a página de provas.
   */
  revalidatePath("/exams");

  /**
   * Atualiza também a página de correção,
   * caso ela utilize a lista de provas.
   */
  revalidatePath("/correct");

  redirect("/exams");
}

/**
 * Cria uma prova utilizando os dados já convertidos
 * para ExamFormData e AnswerKeyItem[].
 *
 * Mantida porque já fazia parte do projeto.
 */
export async function createExamWithAnswerKey(
  data: ExamFormData,
  answers: AnswerKeyItem[],
) {
  const teacherId = await currentUserId();

  if (!teacherId) {
    throw new Error("Usuário não autenticado.");
  }

  /**
   * Valida o gabarito antes de salvar.
   */
  const answerKey = answerKeySchema.parse(answers);

  /**
   * Garante que existe uma resposta para
   * cada questão.
   */
  if (answerKey.length !== data.questionCount) {
    throw new Error(
      "O gabarito precisa ter uma resposta para todas as questões.",
    );
  }

  /**
   * Verifica questões duplicadas.
   */
  const questionNumbers = answerKey.map((item) => item.questionNumber);

  const uniqueQuestionNumbers = new Set(questionNumbers);

  if (uniqueQuestionNumbers.size !== data.questionCount) {
    throw new Error("O gabarito possui questões duplicadas ou inválidas.");
  }

  /**
   * Verifica as alternativas permitidas.
   */
  const allowedAlternatives = ["A", "B", "C", "D", "E", "F"].slice(
    0,
    data.alternativeCount,
  );

  const hasInvalidAlternative = answerKey.some(
    (item) => !allowedAlternatives.includes(item.correctAnswer),
  );

  if (hasInvalidAlternative) {
    throw new Error(
      "O gabarito possui uma alternativa que não está disponível na prova.",
    );
  }

  await connectDatabase();

  await ExamModel.create({
    teacherId,

    // ID da turma
    classId: data.classId,

    // Nome da turma salvo como snapshot
    className: data.className,

    title: data.title,

    subject: data.subject,

    examDate: data.examDate ? new Date(data.examDate) : undefined,

    questionCount: data.questionCount,

    alternativeCount: data.alternativeCount,

    examGrade: data.examGrade,

    /**
     * Gabarito no formato esperado pelo ExamModel.
     */
    answerKey,
  });

  revalidatePath("/exams");
  revalidatePath("/correct");

  redirect("/exams");
}

/**
 * Exclui uma prova.
 */
export async function deleteExam(formData: FormData) {
  const id = await teacherId();

  const examId = z.string().min(1).parse(formData.get("examId"));

  await connectDatabase();

  await ExamModel.deleteOne({
    _id: examId,
    teacherId: id,
  });

  revalidatePath("/exams");
  revalidatePath("/correct");
}

/**
 * Obtém o professor autenticado.
 */
async function teacherId() {
  const id = await currentUserId();

  if (!id) {
    redirect("/auth");
  }

  return id;
}

export async function saveAnswerKey(formData: FormData) {
  const teacherId = await currentUserId();

  if (!teacherId) {
    redirect("/auth");
  }

  const examId = z
    .string()
    .min(1)
    .parse(formData.get("examId"));

  const answersRaw = formData.get("answers");

  if (!answersRaw || typeof answersRaw !== "string") {
    throw new Error("Gabarito não informado.");
  }

  let answers: unknown;

  try {
    answers = JSON.parse(answersRaw);
  } catch {
    throw new Error("Gabarito inválido.");
  }

  const answerKey = answerKeySchema.parse(answers);

  await connectDatabase();

  const exam = await ExamModel.findOne({
    _id: examId,
    teacherId,
  });

  if (!exam) {
    throw new Error("Prova não encontrada.");
  }

  if (answerKey.length !== exam.questionCount) {
    throw new Error(
      "O gabarito precisa ter uma resposta para todas as questões.",
    );
  }

  exam.set("answerKey", answerKey);

  await exam.save();

  revalidatePath("/exams");
  revalidatePath(`/exams/${examId}`);

  redirect("/exams");
}