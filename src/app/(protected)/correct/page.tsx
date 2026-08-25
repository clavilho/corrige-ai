import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";

import { ExamModel } from "@/features/exams/exam.model";

import CorrectPageClient from "./correct-page-client";

export default async function CorrectPage({
  searchParams,
}: {
  searchParams: Promise<{
    examId?: string;
    studentId?: string;
  }>;
}) {
  const teacherId = await currentUserId();

  const params = await searchParams;

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
      exams={exams.map((exam) => ({
        id: exam._id.toString(),
        title: exam.title,
        questionCount: exam.questionCount,
        classes: Array.isArray(exam.classes)
          ? exam.classes.map((item: any) => ({
              id: item.classId.toString(),
              name: item.className,
            }))
          : [],
      }))}
      initialExamId={params.examId ?? ""}
      initialStudentId={params.studentId ?? ""}
    />
  );
}
