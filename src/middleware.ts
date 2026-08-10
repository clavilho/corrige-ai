import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const cookieName = "corrigeai_session";
const secret = new TextEncoder().encode(
  process.env.AUTH_SECRET ?? "change-this-development-secret-before-production"
);

const PROTECTED_PREFIXES = ["/dashboard", "/correct", "/corrections", "/exams"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtectedRoute = PROTECTED_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
  const isAuthPage = pathname === "/auth";

  const token = request.cookies.get(cookieName)?.value;
  let isAuthenticated = false;

  if (token) {
    try {
      const verified = await jwtVerify(token, secret);
      if (verified.payload.sub) {
        isAuthenticated = true;
      }
    } catch {
      isAuthenticated = false;
    }
  }

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL("/auth", request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && isAuthenticated) {
    const dashboardUrl = new URL("/dashboard", request.url);
    return NextResponse.redirect(dashboardUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|assets|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
