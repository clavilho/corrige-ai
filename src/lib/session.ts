import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

export const cookieName = "corrigeai_session";
export const secret = new TextEncoder().encode(process.env.AUTH_SECRET ?? "change-this-development-secret-before-production");

export async function verifySessionToken(token: string): Promise<string | null> {
  try {
    return (await jwtVerify(token, secret)).payload.sub ?? null;
  } catch {
    return null;
  }
}

export async function createSession(userId: string) {
  const ONE_YEAR_IN_SECONDS = 60 * 60 * 24 * 365;
  const token = await new SignJWT({ role: "teacher" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("365d")
    .sign(secret);
  const store = await cookies();
  store.set(cookieName, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ONE_YEAR_IN_SECONDS,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(cookieName);
}

export async function currentUserId(): Promise<string | null> {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}
