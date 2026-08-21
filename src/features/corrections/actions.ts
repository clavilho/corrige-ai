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

  const mimeType = header.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";

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

  const exam = await ExamModel.findOne({
    _id: data.examId,
    teacherId,
  });

  if (!exam) {
    throw new Error("Prova não encontrada.");
  }

  // Confirma que o aluno pertence à turma da prova
  const student = await StudentModel.findOne({
    _id: data.studentId,
    teacherId,
    classId: exam.classId,
  });

  if (!student) {
    throw new Error("Aluno não pertence à turma desta prova.");
  }

  if (
    !Array.isArray(exam.answerKey) ||
    exam.answerKey.length !== exam.questionCount
  ) {
    throw new Error("Cadastre o gabarito completo antes de corrigir.");
  }

  const alternatives = ["A", "B", "C", "D", "E", "F"].slice(
    0,
    exam.alternativeCount,
  );

  const reading = await readAnswerSheet(
    data.imageDataUrl,
    exam.questionCount,
    alternatives,
  );

  // chama a função de scoring passando totalPoints e questionCount
  const totalPoints =
    typeof (exam as any).totalPoints === "number"
      ? (exam as any).totalPoints
      : typeof (exam as any).examGrade === "number"
        ? (exam as any).examGrade
        : 100;

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

  // prefira finalScore (baseado em totalPoints) quando disponível; senão use legacyScore
  const finalScore =
    typeof scoreResult.finalScore === "number"
      ? scoreResult.finalScore
      : scoreResult.legacyScore;

  const correction = await CorrectionModel.create({
    teacherId,
    examId: exam.id,
    studentId: data.studentId,
    studentName: data.studentName,
    imageDataUrl: data.imageDataUrl,

    warnings: reading.warnings,

    // detalhe por questão
    answers: scoreResult.answers,

    // métricas
    totalQuestions: scoreResult.totalQuestions,
    correctAnswers: scoreResult.correctAnswers,
    unidentified: scoreResult.unidentified,
    wrongAnswers: scoreResult.wrongAnswers,

    // notas
    score: finalScore, // nota "oficial"
    legacyScore: scoreResult.legacyScore,
    totalPoints, // qual foi o total de pontos usado
  });

 await StudentModel.findByIdAndUpdate(
  data.studentId,
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
  // checagem defensiva para agradar o TS (create normalmente retorna documento)
  if (!correction) {
    throw new Error("Erro ao salvar a correção.");
  }

  const correctionId = (correction._id ?? correction.id).toString();

  revalidatePath("/dashboard");
  revalidatePath("/corrections");
  revalidatePath("/correct");

  return {
    correctionId: correction.id,
    correctCount: scoreResult.correctAnswers,
    finalScore,
    legacyScore: scoreResult.legacyScore,
  };
}

export async function deleteCorrection(formData: FormData) {
  const teacherId = await requireTeacher();

  const id = z.string().min(1).parse(formData.get("correctionId"));

  await connectDatabase();

  await CorrectionModel.deleteOne({
    _id: id,
    teacherId,
  });

  revalidatePath("/dashboard");
  revalidatePath("/corrections");
}

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
