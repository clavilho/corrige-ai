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

const nameSchema = z.string().trim().min(2).max(120);

export async function signIn(formData: FormData) {
  const inputResult = credentials.safeParse({
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    password: String(formData.get("password") ?? ""),
  });

  if (!inputResult.success) {
    redirect("/auth?error=credenciais");
  }

  const input = inputResult.data;

  await connectDatabase();

  const user = await UserModel.findOne({
    email: input.email,
  }).lean();

  if (!user) {
    redirect("/auth?error=credenciais");
  }

  const passwordValid = await bcrypt.compare(
    input.password,
    user.passwordHash,
  );

  if (!passwordValid) {
    redirect("/auth?error=credenciais");
  }

  await createSession(user._id.toString());

  redirect("/dashboard");
}

export async function signUp(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  const nameResult = nameSchema.safeParse(name);

  if (!nameResult.success) {
    redirect("/auth?error=dados");
  }

  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();

  const password = String(formData.get("password") ?? "");

  const credentialsResult = credentials.safeParse({
    email,
    password,
  });

  if (!credentialsResult.success) {
    redirect("/auth?error=dados");
  }

  const input = credentialsResult.data;

  await connectDatabase();

  const existingUser = await UserModel.exists({
    email: input.email,
  });

  if (existingUser) {
    redirect("/auth?error=email");
  }

  const passwordHash = await bcrypt.hash(input.password, 12);

  const user = await UserModel.create({
    name: nameResult.data,
    email: input.email,
    passwordHash,
  });

  await createSession(user._id.toString());

  redirect("/dashboard");
}

export async function signOut() {
  await clearSession();

  redirect("/");
}