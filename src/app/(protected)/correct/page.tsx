// src/app/correct/page.tsx
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ExamModel } from "@/features/exams/exam.model";
import CorrectPageClient from "./correct-page-client";

export default async function CorrectPage() {
  const teacherId = await currentUserId();
  await connectDatabase();

  const exams = await ExamModel.find({
    teacherId,
    $expr: {
      $eq: [{ $size: "$answerKey" }, "$questionCount"],
    },
  })
    .sort({ createdAt: -1 })
    .lean();

  return (
    <CorrectPageClient
      exams={exams.map((e) => ({
        id: e._id.toString(),
        title: e.title,
        questionCount: e.questionCount,
      }))}
    />
  );
}
