"use server";

import { OAuth2Client } from "google-auth-library";
import { redirect } from "next/navigation";
import { connectDatabase } from "@/lib/database";
import { clearSession, createSession } from "@/lib/session";
import { UserModel } from "./user.model";

const googleClientId = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim();
const oauth2Client = new OAuth2Client(googleClientId);

export async function authenticateWithGoogle(credentialToken: string) {
  if (!credentialToken) {
    throw new Error("Token de credencial do Google não informado.");
  }

  let payload;
  try {
    const ticket = await oauth2Client.verifyIdToken({
      idToken: credentialToken,
      audience: googleClientId || undefined,
    });
    payload = ticket.getPayload();
  } catch (error) {
    console.error("Erro na verificação da assinatura do ID Token do Google:", error);
    throw new Error("Falha na autenticação: ID Token do Google inválido ou não assinado.");
  }

  if (!payload || !payload.email || !payload.sub) {
    throw new Error("Token do Google incompleto ou sem dados de e-mail.");
  }

  const googleId = payload.sub;
  const email = payload.email.toLowerCase();
  const name = payload.name || email.split("@")[0] || "Usuário";
  const avatarUrl = payload.picture;

  await connectDatabase();

  let user = await UserModel.findOne({
    $or: [{ googleId }, { email }],
  });

  if (!user) {
    user = await UserModel.create({
      googleId,
      email,
      name,
      avatarUrl,
    });
  } else {
    let updated = false;
    if (!user.googleId) {
      user.googleId = googleId;
      updated = true;
    }
    if (avatarUrl && user.avatarUrl !== avatarUrl) {
      user.avatarUrl = avatarUrl;
      updated = true;
    }
    if (updated) {
      await user.save();
    }
  }

  const userId = user._id.toString();
  await createSession(userId);

  return { success: true, userId };
}

export async function signOut() {
  await clearSession();
  redirect("/");
}
