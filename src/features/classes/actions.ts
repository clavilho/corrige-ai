"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { connectDatabase } from "@/lib/database";
import { currentUserId } from "@/lib/session";
import { ClassModel } from "./class.model";

const createSchema = z.object({
  name: z.string().trim().min(1).max(200),
  code: z.string().trim().optional(),
  description: z.string().trim().max(1000).optional(),
  academicYear: z.string().trim().max(20).optional(),
  term: z.string().trim().max(50).optional(),
  turno: z.enum(["manhã", "tarde", "noite"]).optional(),
});

async function teacherId() {
  const id = await currentUserId();
  if (!id) redirect("/auth");
  return id;
}


export async function createClass(formData: FormData) {
  const raw = Object.fromEntries(formData.entries());
  const data = createSchema.parse(raw);

  const teacherId = await currentUserId();
  if (!teacherId) redirect("/auth");

  await connectDatabase();

  try {
    await ClassModel.create({
      teacherId,
      name: data.name,
      code: data.code || undefined,
      description: data.description || undefined,
      academicYear: data.academicYear || undefined,
      term: data.term || undefined,
      turno: data.turno || undefined,
      studentCount: 0,
    });

    redirect("/classes");
  } catch (err: any) {
    if (err?.code === 11000) throw new Error("Já existe uma turma com esse código.");
    console.error("createClass error:", err);
    throw err;
  }
}