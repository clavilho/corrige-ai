"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";

import { ExamModel } from "@/features/exams/exam.model";
import { StudentModel } from "@/features/students/student.model";

import { CorrectionModel } from "./correction.model";
import { DetectedAnswer, scoreAnswers } from "./scoring";

import { buildAnswerSheetPrompt } from "./prompts/answer-sheet.prompt";

// ================================================================
// CONSTANTES
// ================================================================

const ALL_ALTERNATIVES = ["A", "B", "C", "D", "E", "F"] as const;

// ================================================================
// SCHEMAS
// ================================================================

const requestSchema = z.object({
  examId: z.string().min(1),

  studentId: z.string().min(1),

  studentName: z.string().trim().min(1).max(120),

  imageDataUrl: z.string().startsWith("data:image/").max(6_000_000),

  replaceExisting: z.boolean().optional().default(false),
});

// ================================================================
// AUTH
// ================================================================

async function requireTeacher() {
  const id = await currentUserId();

  if (!id) {
    redirect("/auth");
  }

  return id;
}

// ================================================================
// READ ANSWER SHEET
// ================================================================

async function readAnswerSheet(
  imageDataUrl: string,
  questionCount: number,
  alternatives: string[],
): Promise<{
  detected: DetectedAnswer[];
  warnings: string[];
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Configure GEMINI_API_KEY no arquivo .env.local");
  }

  const ai = new GoogleGenAI({
    apiKey,
  });

  // ============================================================
  // SEPARA MIME TYPE E BASE64
  // ============================================================

  const [header, base64] = imageDataUrl.split(",");

  if (!base64) {
    throw new Error("Imagem inválida ou corrompida.");
  }

  const mimeType = header.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";

  // ============================================================
  // PROMPT
  // ============================================================

  const prompt = buildAnswerSheetPrompt(questionCount, alternatives);

  // ============================================================
  // SCHEMA DA RESPOSTA DO GEMINI
  // ============================================================

  const answerSchema = z.object({
    question: z.number().int().min(1).max(questionCount),

    answer: z
      .string()
      .transform((value) => value.trim().toUpperCase())
      .refine((value) => alternatives.includes(value), {
        message: "Alternativa inválida.",
      })
      .nullable(),
  });

  const readingSchema = z.object({
    answers: z.array(answerSchema).length(questionCount),

    image_quality: z.enum(["boa", "regular", "ruim"]).optional(),

    notes: z.string().max(300).optional(),
  });

  // ============================================================
  // ENVIA IMAGEM PARA O GEMINI
  // ============================================================

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL ?? "gemini-3.6-flash",

    contents: [
      {
        inlineData: {
          mimeType,
          data: base64,
        },
      },
      {
        text: prompt,
      },
    ],

    config: {
      responseMimeType: "application/json",
    },
  });

  // ============================================================
  // VALIDA RESPOSTA
  // ============================================================

  if (!response.text) {
    throw new Error("Gemini não retornou conteúdo.");
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(response.text);
  } catch {
    console.error("Resposta inválida do Gemini:", response.text);

    throw new Error("O Gemini retornou uma resposta inválida.");
  }

  // ============================================================
  // VALIDA COM ZOD
  // ============================================================

  const reading = readingSchema.safeParse(parsed);

  if (!reading.success) {
    console.error(
      "Erro na validação da resposta do Gemini:",
      reading.error.flatten(),
    );

    throw new Error(
      "Não foi possível interpretar corretamente as respostas da prova.",
    );
  }

  // ============================================================
  // VALIDA QUESTÕES
  // ============================================================

  const questions = reading.data.answers.map((item) => item.question);

  const uniqueQuestions = new Set(questions);

  const allQuestionsPresent = Array.from(
    { length: questionCount },
    (_, index) => index + 1,
  ).every((question) => uniqueQuestions.has(question));

  if (uniqueQuestions.size !== questionCount || !allQuestionsPresent) {
    console.error("Questões identificadas pelo Gemini:", questions);

    throw new Error("O Gemini não identificou corretamente todas as questões.");
  }

  // ============================================================
  // ORDENA QUESTÕES
  // ============================================================

  const detected: DetectedAnswer[] = reading.data.answers
    .sort((a, b) => a.question - b.question)
    .map((item) => ({
      question: item.question,

      answer: item.answer ? item.answer.trim().toUpperCase() : null,
    }));

  // ============================================================
  // WARNINGS
  // ============================================================

  const warnings: string[] = [];

  if (reading.data.image_quality === "ruim") {
    warnings.push(
      "A qualidade da imagem está baixa; confira o resultado manualmente.",
    );
  }

  if (reading.data.image_quality === "regular") {
    warnings.push(
      "A qualidade da imagem é regular; confira questões com marcações pouco visíveis.",
    );
  }

  if (reading.data.notes?.trim()) {
    warnings.push(reading.data.notes.trim());
  }

  return {
    detected,
    warnings,
  };
}

// ================================================================
// CREATE CORRECTION
// ================================================================

export async function createCorrection(input: unknown) {
  const data = requestSchema.parse(input);

  const teacherId = await requireTeacher();

  await connectDatabase();

  // ============================================================
  // 1. BUSCA A PROVA
  // ============================================================

  const exam = await ExamModel.findOne({
    _id: data.examId,
    teacherId,
  });

  if (!exam) {
    throw new Error("Prova não encontrada.");
  }

  // ============================================================
  // 2. CONFIRMA QUE O ALUNO PERTENCE À TURMA
  // ============================================================

  const student = await StudentModel.findOne({
    _id: data.studentId,
    teacherId,
    classId: exam.classId,
  });

  if (!student) {
    throw new Error("Aluno não pertence à turma desta prova.");
  }

  // ============================================================
  // 3. VERIFICA SE JÁ EXISTE CORREÇÃO
  // ============================================================

  const existingCorrection = await CorrectionModel.findOne({
    teacherId,
    examId: exam._id,
    studentId: student._id,
  })
    .select("_id score createdAt")
    .lean();

  if (existingCorrection && !data.replaceExisting) {
    return {
      alreadyExists: true,

      correctionId: existingCorrection._id.toString(),

      score: Number(existingCorrection.score ?? 0),

      createdAt:
        existingCorrection.createdAt instanceof Date
          ? existingCorrection.createdAt.toISOString()
          : new Date(existingCorrection.createdAt).toISOString(),
    };
  }

  // ============================================================
  // 4. VALIDA GABARITO
  // ============================================================

  if (
    !Array.isArray(exam.answerKey) ||
    exam.answerKey.length !== exam.questionCount
  ) {
    throw new Error("Cadastre o gabarito completo antes de corrigir.");
  }

  // ============================================================
  // 5. ALTERNATIVAS
  // ============================================================

  const alternatives = ALL_ALTERNATIVES.slice(0, exam.alternativeCount);

  if (alternatives.length !== exam.alternativeCount) {
    throw new Error("Quantidade de alternativas inválida.");
  }

  // ============================================================
  // 6. ENVIA A IMAGEM PARA O GEMINI
  // ============================================================

  const reading = await readAnswerSheet(data.imageDataUrl, exam.questionCount, [
    ...alternatives,
  ]);

  // ============================================================
  // 7. TOTAL DE PONTOS
  // ============================================================

  const totalPoints =
    typeof (exam as any).totalPoints === "number"
      ? (exam as any).totalPoints
      : typeof (exam as any).examGrade === "number"
        ? (exam as any).examGrade
        : 100;

  // ============================================================
  // 8. CALCULA A NOTA
  // ============================================================

  const scoreResult = scoreAnswers(
    exam.answerKey,
    reading.detected as DetectedAnswer[],
    {
      totalPoints,

      questionCount:
        typeof exam.questionCount === "number"
          ? exam.questionCount
          : exam.answerKey.length,
    },
  );

  // ============================================================
  // QUESTÕES NÃO IDENTIFICADAS
  // ============================================================

  if (scoreResult.unidentified) {
    reading.warnings.push(
      `${scoreResult.unidentified} questão(ões) não identificada(s).`,
    );
  }

  // ============================================================
  // NOTA FINAL
  // ============================================================

  const finalScore =
    typeof scoreResult.finalScore === "number"
      ? scoreResult.finalScore
      : scoreResult.legacyScore;

  // ============================================================
  // 9. SE EXISTIA CORREÇÃO E USUÁRIO CONFIRMOU,
  //    REMOVE A CORREÇÃO ANTERIOR
  // ============================================================

  if (existingCorrection && data.replaceExisting) {
    await CorrectionModel.deleteOne({
      _id: existingCorrection._id,
      teacherId,
    });

    // ----------------------------------------------------------
    // Remove também a nota antiga do aluno
    // ----------------------------------------------------------

    await StudentModel.updateOne(
      {
        _id: student._id,
        teacherId,
      },
      {
        $pull: {
          grades: {
            examId: exam._id,
          },
        },
      },
    );
  }

  // ============================================================
  // 10. CRIA A NOVA CORREÇÃO
  // ============================================================

  const correction = await CorrectionModel.create({
    teacherId,

    examId: exam._id,

    studentId: student._id,

    studentName: student.name,

    imageDataUrl: data.imageDataUrl,

    warnings: reading.warnings,

    answers: scoreResult.answers,

    totalQuestions: scoreResult.totalQuestions,

    correctAnswers: scoreResult.correctAnswers,

    unidentified: scoreResult.unidentified,

    wrongAnswers: scoreResult.wrongAnswers,

    score: finalScore,

    legacyScore: scoreResult.legacyScore,

    totalPoints,
  });

  if (!correction) {
    throw new Error("Erro ao salvar a correção.");
  }

  // ============================================================
  // 11. ADICIONA A NOVA NOTA AO ALUNO
  // ============================================================

  await StudentModel.findByIdAndUpdate(
    student._id,
    {
      $push: {
        grades: {
          examId: exam._id,

          correctionId: correction._id,

          score: finalScore,

          totalPoints,

          createdAt: new Date(),
        },
      },
    },
    {
      new: true,
    },
  );

  // ============================================================
  // 12. ID DA CORREÇÃO
  // ============================================================

  const correctionId = (correction._id ?? correction.id).toString();

  // ============================================================
  // 13. INVALIDA CACHE
  // ============================================================

  revalidatePath("/dashboard");

  revalidatePath("/corrections");

  revalidatePath("/correct");

  // ============================================================
  // 14. RETORNO
  // ============================================================

  return {
    alreadyExists: false,

    correctionId,

    correctCount: scoreResult.correctAnswers,

    finalScore,

    legacyScore: scoreResult.legacyScore,

    replaced: Boolean(existingCorrection),
  };
}

// ================================================================
// DELETE CORRECTION
// ================================================================

export async function deleteCorrection(formData: FormData) {
  const teacherId = await requireTeacher();

  const id = z.string().min(1).parse(formData.get("correctionId"));

  await connectDatabase();

  const correction = await CorrectionModel.findOne({
    _id: id,
    teacherId,
  });

  if (!correction) {
    throw new Error("Correção não encontrada.");
  }

  await CorrectionModel.deleteOne({
    _id: id,
    teacherId,
  });

  // ============================================================
  // REMOVE A NOTA CORRESPONDENTE DO ALUNO
  // ============================================================

  if (correction.studentId) {
    await StudentModel.updateOne(
      {
        _id: correction.studentId,
        teacherId,
      },
      {
        $pull: {
          grades: {
            correctionId: correction._id,
          },
        },
      },
    );
  }

  revalidatePath("/dashboard");

  revalidatePath("/corrections");

  revalidatePath("/correct");
}

// ================================================================
// GET STUDENTS BY EXAM
// ================================================================

export async function getStudentsByExam(examId: string) {
  const teacherId = await requireTeacher();

  await connectDatabase();

  const exam = await ExamModel.findOne({
    _id: examId,
    teacherId,
  })
    .select("classId")
    .lean();

  if (!exam) {
    throw new Error("Prova não encontrada.");
  }

  if (!exam.classId) {
    throw new Error("A prova não possui uma turma associada.");
  }

  const students = await StudentModel.find({
    teacherId,
    classId: exam.classId,
  })
    .select("_id name registration")
    .sort({ name: 1 })
    .lean();

  return students.map((student) => ({
    id: student._id.toString(),

    name: student.name,

    registration: student.registration ?? null,
  }));
}

// ================================================================
// GET EXISTING CORRECTION
// ================================================================

export async function getExistingCorrection(examId: string, studentId: string) {
  const teacherId = await currentUserId();

  if (!teacherId) {
    throw new Error("Usuário não autenticado.");
  }

  await connectDatabase();

  const correction = await CorrectionModel.findOne({
    teacherId,
    examId,
    studentId,
  })
    .select("_id score createdAt")
    .lean();

  if (!correction) {
    return null;
  }

  return {
    correctionId: correction._id.toString(),

    score: Number(correction.score ?? 0),

    createdAt:
      correction.createdAt instanceof Date
        ? correction.createdAt.toISOString()
        : new Date(correction.createdAt).toISOString(),
  };
}
