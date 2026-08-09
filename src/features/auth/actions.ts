"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { z } from "zod";
import { connectDatabase } from "@/lib/database";
import { clearSession, createSession } from "@/lib/session";
import { UserModel } from "./user.model";

const credentials = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(8).max(72),
});

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  
  const input = credentials.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  await connectDatabase();
  const user = await UserModel.findOne({
    email: input.email.toLowerCase(),
  }).lean();
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash)))
    redirect("/auth?error=credenciais");
  await createSession(user._id.toString());
  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const name = z.string().trim().min(2).max(120).parse(formData.get("name"));
  const input = credentials.parse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  await connectDatabase();
  if (await UserModel.exists({ email: input.email.toLowerCase() }))
    redirect("/auth?error=email");
  const user = await UserModel.create({
    name,
    email: input.email.toLowerCase(),
    passwordHash: await bcrypt.hash(input.password, 12),
  });
  await createSession(user.id);
  redirect("/dashboard");
}

export async function signOut() {
  await clearSession();
  redirect("/");
}
