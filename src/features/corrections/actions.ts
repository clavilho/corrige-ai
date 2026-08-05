"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { GoogleGenAI } from "@google/genai";

import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";

import { ExamModel } from "@/features/exams/exam.model";
import { CorrectionModel } from "./correction.model";
import { DetectedAnswer, scoreAnswers } from "./scoring";

const requestSchema = z.object({
  examId: z.string().min(1),
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

  console.log("🤖 Enviando imagem para Gemini...");
    const models = await ai.models.list();

    console.log(models);
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

  console.log("✅ Resposta Gemini recebida");

  const json = response.text
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  console.log(json);

  const reading = readingSchema.parse(JSON.parse(json));

  return {
    detected: reading.answers.map((item) => ({
      question: item.question,

      answer:
        item.answer && alternatives.includes(item.answer.toUpperCase())
          ? item.answer.toUpperCase()
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
  console.log("🚀 createCorrection iniciou");

  const data = requestSchema.parse(input);

  console.log("📄 Dados recebidos:", {
    examId: data.examId,
    studentName: data.studentName,
    imageSize: data.imageDataUrl.length,
  });

  const teacherId = await requireTeacher();

  console.log("👨‍🏫 Professor:", teacherId);

  await connectDatabase();

  console.log("🗄️ Banco conectado");

  const exam = await ExamModel.findOne({
    _id: data.examId,
    teacherId,
  });

  console.log("📝 Prova encontrada:", !!exam);

  if (!exam) {
    throw new Error("Prova não encontrada.");
  }

  if (exam.answerKey.length !== exam.questionCount) {
    throw new Error("Cadastre o gabarito completo antes de corrigir.");
  }

  const alternatives = ["A", "B", "C", "D", "E", "F"].slice(
    0,
    exam.alternativeCount,
  );

  console.log("🤖 Enviando imagem para Gemini");

  const reading = await readAnswerSheet(
    data.imageDataUrl,
    exam.questionCount,
    alternatives,
  );

  console.log("✅ Leitura Gemini:");
  console.log(reading);

  const result = scoreAnswers(exam.answerKey, reading.detected);

  console.log("📊 Resultado da correção:");
  console.log(result);

  if (result.unidentified) {
    reading.warnings.push(
      `${result.unidentified} questão(ões) não identificada(s).`,
    );
  }

  const correction = await CorrectionModel.create({
    teacherId,
    examId: exam.id,
    studentName: data.studentName,
    imageDataUrl: data.imageDataUrl,

    warnings: reading.warnings,

    ...result,
  });

  console.log("💾 Correção salva:", correction.id);

  revalidatePath("/dashboard");
  revalidatePath("/corrections");
  revalidatePath("/correct");

  return {
    correctionId: correction.id,
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
