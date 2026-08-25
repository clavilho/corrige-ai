"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { StudentModel } from "./student.model";
import mongoose from "mongoose";
import { revalidatePath } from "next/cache";
import { ClassModel } from "../classes/class.model";

const createStudentSchema = z.object({
  classId: z.string().min(1),
  name: z.string().trim().min(1).max(200),
  registration: z.string().trim().optional(),
});

export async function createStudent(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const data = createStudentSchema.parse(raw);
  const classId = z.string().min(1).parse(formData.get("classId"));
  const teacherId = await currentUserId();

  if (!teacherId) redirect("/auth");

  await connectDatabase();

  // validate classId as ObjectId
  const classObjId = new mongoose.Types.ObjectId(data.classId);

  await StudentModel.create({
    teacherId,
    classId: classObjId,
    name: data.name,
    registration: data.registration || undefined,
    grades: [],
  });

  // increment studentCount on class
  await ClassModel.updateOne({ _id: classObjId }, { $inc: { studentCount: 1 } });

  revalidatePath(`classes/${classId}`);
}

// add grade to student
const addGradeSchema = z.object({
  studentId: z.string().min(1),
  examId: z.string().optional(),
  correctionId: z.string().optional(),
  score: z.preprocess((v) => Number(v), z.number()),
  totalPoints: z.preprocess(
    (v) => (v === undefined || v === "" ? undefined : Number(v)),
    z.number().optional(),
  ),
  note: z.string().optional(),
});

export async function addGrade(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const data = addGradeSchema.parse(raw);

  const teacherId = await currentUserId();
  if (!teacherId) redirect("/auth");

  await connectDatabase();

  const student = await StudentModel.findOne({
    _id: new mongoose.Types.ObjectId(data.studentId),
    teacherId,
  });
  if (!student) throw new Error("Aluno não encontrado.");

  const grade: any = {
    score: data.score,
    totalPoints: data.totalPoints,
    note: data.note,
    createdAt: new Date(),
  };
  if (data.examId) grade.examId = new mongoose.Types.ObjectId(data.examId);
  if (data.correctionId)
    grade.correctionId = new mongoose.Types.ObjectId(data.correctionId);

  student.grades.push(grade);
  await student.save();
}

export async function deleteStudent(formData: FormData) {
  const studentId = z.string().min(1).parse(formData.get("studentId"));
  const classId = z.string().min(1).parse(formData.get("classId"));

  await connectDatabase();
  await StudentModel.deleteOne({ _id: studentId });
  await ClassModel.findByIdAndUpdate(
    { _id: classId },
    { $inc: { studentCount: -1 } },
    { new: true },
  );

  revalidatePath(`classes/${classId}`);
}
