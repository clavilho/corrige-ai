"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";
import { CorrectionModel } from "./correction.model";
import { DetectedAnswer, scoreAnswers } from "./scoring";

const requestSchema = z.object({
  examId: z.string().min(1),
  studentName: z.string().trim().max(120),
  imageDataUrl: z.string().startsWith("data:image/").max(6_000_000),
});
const responseSchema = z.object({
  choices: z
    .array(z.object({ message: z.object({ content: z.string() }) }))
    .min(1),
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
  if (!id) redirect("/auth");
  return id;
}

async function readAnswerSheet(
  imageDataUrl: string,
  questionCount: number,
  alternatives: string[],
): Promise<{ detected: DetectedAnswer[]; warnings: string[] }> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey)
    throw new Error(
      "Configure OPENAI_API_KEY para habilitar a leitura de imagens.",
    );
  const prompt = `Leia esta folha de respostas. Há ${questionCount} questões e as alternativas válidas são ${alternatives.join(", ")}. Para cada questão, retorne a bolha claramente preenchida. Use null para nenhuma, múltiplas ou ilegível. Responda somente JSON: {"answers":[{"question":1,"answer":"A"}],"image_quality":"boa|regular|ruim","notes":""}.`;
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_VISION_MODEL ?? "gpt-4.1-mini",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });
  if (!response.ok)
    throw new Error(
      "Não foi possível analisar a imagem. Tente novamente com uma foto mais nítida.",
    );
  const payload = responseSchema.parse(await response.json());
  const reading = readingSchema.parse(
    JSON.parse(payload.choices[0].message.content),
  );
  return {
    detected: reading.answers.map((item) => ({
      question: item.question,
      answer:
        item.answer && alternatives.includes(item.answer.toUpperCase())
          ? item.answer
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
  const exam = await ExamModel.findOne({ _id: data.examId, teacherId });
  if (!exam) throw new Error("Prova não encontrada.");
  if (exam.answerKey.length !== exam.questionCount)
    throw new Error("Cadastre o gabarito completo antes de corrigir.");
  const alternatives = ["A", "B", "C", "D", "E", "F"].slice(
    0,
    exam.alternativeCount,
  );
  const reading = await readAnswerSheet(
    data.imageDataUrl,
    exam.questionCount,
    alternatives,
  );
  const result = scoreAnswers(exam.answerKey, reading.detected);
  if (result.unidentified)
    reading.warnings.push(
      `${result.unidentified} questão(ões) não identificada(s).`,
    );
  const correction = await CorrectionModel.create({
    teacherId,
    examId: exam.id,
    studentName: data.studentName,
    imageDataUrl: data.imageDataUrl,
    warnings: reading.warnings,
    ...result,
  });
  revalidatePath("/dashboard");
  revalidatePath("/corrections");
  return { correctionId: correction.id };
}

export async function deleteCorrection(formData: FormData) {
  const teacherId = await requireTeacher();
  const id = z.string().min(1).parse(formData.get("correctionId"));
  await connectDatabase();
  await CorrectionModel.deleteOne({ _id: id, teacherId });
  revalidatePath("/corrections");
  revalidatePath("/dashboard");
}
