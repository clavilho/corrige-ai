import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const cookieName = "corrigeai_session";
const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "change-this-development-secret-before-production");

export async function createSession(userId: string) {
  const token = await new SignJWT({ role: "teacher" }).setProtectedHeader({ alg: "HS256" }).setSubject(userId).setIssuedAt().setExpirationTime("7d").sign(secret);
  const store = await cookies();
  store.set(cookieName, token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 60 * 60 * 24 * 7 });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function currentUserId(): Promise<string | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    return (await jwtVerify(token, secret)).payload.sub ?? null;
  } catch {
    return null;
  }
}
