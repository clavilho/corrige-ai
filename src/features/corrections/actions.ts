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

const requestSchema = z.object({
  examId: z.string().min(1),
  studentId: z.string().min(1),
  studentName: z.string().trim().min(1).max(120),
  imageDataUrl: z.string().startsWith("data:image/").max(6_000_000),
  replaceExisting: z.boolean().optional().default(false),
});

const readingSchema = z.object({
  answers: z.array(
    z.object({
      question: z.number().int().positive(),
      answer: z.string().nullable(),
    }),
  ),
  image_quality: z.enum(["boa", "regular", "ruim"]).optional(),
  notes: z.string().max(300).optional(),
});

async function requireTeacher() {
  const id = await currentUserId();

  if (!id) {
    redirect("/auth");
  }

  return id;
}

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

  const [header, base64] = imageDataUrl.split(",");

  const mimeType =
    header.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";

  const prompt = `
Você é um corretor de gabaritos de provas.

Analise a imagem enviada.

Existem ${questionCount} questões.

As alternativas possíveis são:

${alternatives.join(", ")}

Para cada questão:

- identifique apenas UMA alternativa;
- se houver duas marcações,
  nenhuma marcação
  ou estiver ilegível,
  responda null.

Responda SOMENTE JSON.

Formato obrigatório:

{
  "answers": [
    {
      "question": 1,
      "answer": "A"
    }
  ],
  "image_quality":"boa",
  "notes":""
}
`;

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

  if (!response.text) {
    throw new Error("Gemini não retornou conteúdo.");
  }

  const json = response.text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  const reading = readingSchema.parse(JSON.parse(json));

  return {
    detected: reading.answers.map((item) => ({
      question: item.question,
      answer: item.answer
        ? String(item.answer).trim().toUpperCase().slice(0, 1)
        : null,
    })),

    warnings: [
      reading.image_quality === "ruim"
        ? "A qualidade da imagem está baixa; confira o resultado manualmente."
        : "",

      reading.notes ?? "",
    ].filter(Boolean),
  };
}

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

  const existingCorrection =
    await CorrectionModel.findOne({
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
    throw new Error(
      "Cadastre o gabarito completo antes de corrigir.",
    );
  }

  // ============================================================
  // 5. ALTERNATIVAS
  // ============================================================

  const alternatives = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
  ].slice(0, exam.alternativeCount);

  // ============================================================
  // 6. ENVIA A IMAGEM PARA O GEMINI
  // ============================================================

  const reading = await readAnswerSheet(
    data.imageDataUrl,
    exam.questionCount,
    alternatives,
  );

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

  if (scoreResult.unidentified) {
    reading.warnings.push(
      `${scoreResult.unidentified} questão(ões) não identificada(s).`,
    );
  }

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

    /*
     * Remove também a nota antiga do array grades.
     *
     * Assim não teremos:
     *
     * grades: [
     *   prova 1 = 7
     *   prova 1 = 9
     * ]
     *
     * Teremos somente:
     *
     * grades: [
     *   prova 1 = 9
     * ]
     */
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

  const correctionId = (
    correction._id ?? correction.id
  ).toString();

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

  const id = z
    .string()
    .min(1)
    .parse(formData.get("correctionId"));

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

  /*
   * Também remove a nota correspondente do aluno.
   */

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
    throw new Error(
      "A prova não possui uma turma associada.",
    );
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

export async function getExistingCorrection(
  examId: string,
  studentId: string,
) {
  const teacherId = await currentUserId();

  if (!teacherId) {
    throw new Error("Usuário não autenticado.");
  }

  await connectDatabase();

  const correction =
    await CorrectionModel.findOne({
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
        : new Date(
            correction.createdAt,
          ).toISOString(),
  };
}