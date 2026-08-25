"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";

/**
 * ============================================================
 * TYPES
 * ============================================================
 */

export interface ExamClass {
  classId: string;
  className: string;
}

export interface ExamFormData {
  title: string;
  examDate: string;
  subject: string;

  classes: ExamClass[];

  questionCount: number;
  alternativeCount: number;
  examGrade: number;
}

export interface AnswerKeyItem {
  questionNumber: number;
  correctAnswer: string;
}

/**
 * ============================================================
 * SCHEMAS
 * ============================================================
 */

const examClassSchema = z.object({
  classId: z.string().trim().min(1, "ID da turma é obrigatório."),
  className: z.string().trim().min(1, "Nome da turma é obrigatório."),
});

const examFormSchema = z.object({
  title: z.string().trim().min(1, "O nome da prova é obrigatório."),

  subject: z.string().trim().min(1, "A disciplina é obrigatória."),

  classes: z.array(examClassSchema).min(1, "Selecione pelo menos uma turma."),

  examDate: z.string().optional(),

  questionCount: z.coerce
    .number()
    .int()
    .min(1, "A prova precisa ter pelo menos uma questão.")
    .max(100, "A prova pode ter no máximo 100 questões."),

  alternativeCount: z.coerce
    .number()
    .int()
    .min(2, "A prova precisa ter pelo menos 2 alternativas.")
    .max(6, "A prova pode ter no máximo 6 alternativas."),

  examGrade: z.coerce.number().min(0, "A nota da prova não pode ser negativa."),

  answerKey: z.string().min(1, "O gabarito é obrigatório."),
});

const answerKeyItemSchema = z.object({
  questionNumber: z.number().int().min(1),

  correctAnswer: z
    .string()
    .trim()
    .regex(/^[A-F]$/, "Alternativa inválida."),
});

const answerKeySchema = z.array(answerKeyItemSchema);

/**
 * ============================================================
 * HELPERS
 * ============================================================
 */

function parseJsonArray(
  value: FormDataEntryValue | null,
  fieldName: string,
): unknown[] {
  if (!value || typeof value !== "string") {
    throw new Error(`${fieldName} não informado.`);
  }

  try {
    const parsed = JSON.parse(value);

    if (!Array.isArray(parsed)) {
      throw new Error();
    }

    return parsed;
  } catch {
    throw new Error(`${fieldName} inválido.`);
  }
}

/**
 * Valida o gabarito da prova.
 */
function validateAnswerKey(
  answers: unknown,
  questionCount: number,
  alternativeCount: number,
) {
  const answerKey = answerKeySchema.parse(answers);

  /**
   * Quantidade de respostas.
   */
  if (answerKey.length !== questionCount) {
    throw new Error(
      "O gabarito precisa ter uma resposta para todas as questões.",
    );
  }

  /**
   * Verifica questões duplicadas.
   */
  const questionNumbers = answerKey.map((item) => item.questionNumber);

  const uniqueQuestionNumbers = new Set(questionNumbers);

  if (uniqueQuestionNumbers.size !== questionCount) {
    throw new Error("O gabarito possui questões duplicadas ou inválidas.");
  }

  /**
   * Verifica se todas as questões estão
   * dentro do intervalo da prova.
   */
  const hasInvalidQuestionNumber = answerKey.some(
    (item) => item.questionNumber < 1 || item.questionNumber > questionCount,
  );

  if (hasInvalidQuestionNumber) {
    throw new Error("O gabarito possui uma ou mais questões inválidas.");
  }

  /**
   * Verifica alternativas permitidas.
   */
  const allowedAlternatives = ["A", "B", "C", "D", "E", "F"].slice(
    0,
    alternativeCount,
  );

  const hasInvalidAlternative = answerKey.some(
    (item) => !allowedAlternatives.includes(item.correctAnswer),
  );

  if (hasInvalidAlternative) {
    throw new Error(
      "O gabarito possui uma alternativa que não está disponível na prova.",
    );
  }

  return answerKey;
}

/**
 * Valida e normaliza as turmas.
 */
function validateClasses(classes: unknown): ExamClass[] {
  const parsedClasses = z
    .array(examClassSchema)
    .min(1, "Selecione pelo menos uma turma.")
    .parse(classes);

  /**
   * Remove espaços desnecessários.
   */
  const normalizedClasses = parsedClasses.map((item) => ({
    classId: item.classId.trim(),
    className: item.className.trim(),
  }));

  /**
   * Verifica IDs duplicados.
   */
  const classIds = normalizedClasses.map((item) => item.classId);

  const uniqueClassIds = new Set(classIds);

  if (uniqueClassIds.size !== classIds.length) {
    throw new Error("Uma ou mais turmas foram selecionadas mais de uma vez.");
  }

  return normalizedClasses;
}

/**
 * ============================================================
 * CREATE EXAM
 * ============================================================
 */

export async function createExam(formData: FormData) {
  const teacherId = await currentUserId();

  if (!teacherId) {
    redirect("/auth");
  }

  /**
   * ----------------------------------------------------------
   * Turmas
   * ----------------------------------------------------------
   *
   * O frontend deve enviar:
   *
   * classes:
   *
   * [
   *   {
   *     classId: "123",
   *     className: "Turma A"
   *   },
   *   {
   *     classId: "456",
   *     className: "Turma B"
   *   }
   * ]
   */

  const classesRaw = parseJsonArray(formData.get("classes"), "Turmas");

  const classes = validateClasses(classesRaw);

  /**
   * ----------------------------------------------------------
   * Dados básicos
   * ----------------------------------------------------------
   */

  const rawData = {
    title: formData.get("title"),

    subject: formData.get("subject"),

    classes,

    examDate: formData.get("date") ?? formData.get("examDate") ?? undefined,

    questionCount: formData.get("questionCount"),

    alternativeCount: formData.get("alternativeCount"),

    examGrade: formData.get("totalPoints") ?? formData.get("examGrade"),

    answerKey: formData.get("answerKey"),
  };

  /**
   * ----------------------------------------------------------
   * Validação
   * ----------------------------------------------------------
   */

  const data = examFormSchema.parse(rawData);

  /**
   * ----------------------------------------------------------
   * Converte o gabarito
   * ----------------------------------------------------------
   */

  let parsedAnswers: unknown;

  try {
    parsedAnswers = JSON.parse(data.answerKey);
  } catch {
    throw new Error("Gabarito inválido.");
  }

  /**
   * ----------------------------------------------------------
   * Valida o gabarito
   * ----------------------------------------------------------
   */

  const answerKey = validateAnswerKey(
    parsedAnswers,
    data.questionCount,
    data.alternativeCount,
  );

  /**
   * ----------------------------------------------------------
   * Banco
   * ----------------------------------------------------------
   */

  await connectDatabase();

  await ExamModel.create({
    teacherId,

    classes,

    title: data.title,

    subject: data.subject,

    examDate: data.examDate ? new Date(data.examDate) : undefined,

    questionCount: data.questionCount,

    alternativeCount: data.alternativeCount,

    examGrade: data.examGrade,

    answerKey,
  });

  /**
   * ----------------------------------------------------------
   * Atualiza páginas
   * ----------------------------------------------------------
   */

  revalidatePath("/exams");

  revalidatePath("/correct");

  redirect("/exams");
}

/**
 * ============================================================
 * CREATE EXAM WITH ANSWER KEY
 * ============================================================
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
   * ----------------------------------------------------------
   * Valida dados básicos
   * ----------------------------------------------------------
   */

  const validatedData = examFormSchema
    .omit({
      answerKey: true,
    })
    .parse({
      title: data.title,
      subject: data.subject,
      classes: data.classes,
      examDate: data.examDate,
      questionCount: data.questionCount,
      alternativeCount: data.alternativeCount,
      examGrade: data.examGrade,
    });

  /**
   * ----------------------------------------------------------
   * Valida turmas
   * ----------------------------------------------------------
   */

  const classes = validateClasses(validatedData.classes);

  /**
   * ----------------------------------------------------------
   * Valida gabarito
   * ----------------------------------------------------------
   */

  const answerKey = validateAnswerKey(
    answers,
    validatedData.questionCount,
    validatedData.alternativeCount,
  );

  /**
   * ----------------------------------------------------------
   * Banco
   * ----------------------------------------------------------
   */

  await connectDatabase();

  await ExamModel.create({
    teacherId,
    classes,
    title: validatedData.title,
    subject: validatedData.subject,
    examDate: validatedData.examDate
      ? new Date(validatedData.examDate)
      : undefined,
    questionCount: validatedData.questionCount,
    alternativeCount: validatedData.alternativeCount,
    examGrade: validatedData.examGrade,
    answerKey,
  });

  /**
   * ----------------------------------------------------------
   * Atualiza páginas
   * ----------------------------------------------------------
   */

  revalidatePath("/exams");

  revalidatePath("/correct");

  redirect("/exams");
}

/**
 * ============================================================
 * DELETE EXAM
 * ============================================================
 */

export async function deleteExam(formData: FormData) {
  const teacherId = await getTeacherId();

  const examId = z
    .string()
    .min(1, "ID da prova não informado.")
    .parse(formData.get("examId"));

  await connectDatabase();

  await ExamModel.deleteOne({
    _id: examId,
    teacherId,
  });

  revalidatePath("/exams");

  revalidatePath("/correct");
}

/**
 * ============================================================
 * GET TEACHER ID
 * ============================================================
 */

async function getTeacherId() {
  const id = await currentUserId();

  if (!id) {
    redirect("/auth");
  }

  return id;
}

/**
 * ============================================================
 * SAVE ANSWER KEY
 * ============================================================
 */

export async function saveAnswerKey(formData: FormData) {
  const teacherId = await currentUserId();

  if (!teacherId) {
    redirect("/auth");
  }

  /**
   * ----------------------------------------------------------
   * Exam ID
   * ----------------------------------------------------------
   */

  const examId = z
    .string()
    .min(1, "ID da prova não informado.")
    .parse(formData.get("examId"));

  /**
   * ----------------------------------------------------------
   * Answers
   * ----------------------------------------------------------
   */

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

  /**
   * ----------------------------------------------------------
   * Banco
   * ----------------------------------------------------------
   */

  await connectDatabase();

  const exam = await ExamModel.findOne({
    _id: examId,
    teacherId,
  });

  if (!exam) {
    throw new Error("Prova não encontrada.");
  }

  /**
   * ----------------------------------------------------------
   * Validação do gabarito
   * ----------------------------------------------------------
   */

  const answerKey = validateAnswerKey(
    answers,
    exam.questionCount,
    exam.alternativeCount,
  );

  /**
   * ----------------------------------------------------------
   * Atualiza gabarito
   * ----------------------------------------------------------
   */

  exam.set("answerKey", answerKey);

  await exam.save();

  /**
   * ----------------------------------------------------------
   * Atualiza páginas
   * ----------------------------------------------------------
   */

  revalidatePath("/exams");

  revalidatePath(`/exams/${examId}`);

  revalidatePath("/correct");

  redirect("/exams");
}
