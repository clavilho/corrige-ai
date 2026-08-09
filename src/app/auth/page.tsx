import Link from "next/link";
import Image from "next/image";

import { AuthPanel } from "@/components/auth-panel";
import { currentUserId } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function AuthPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  const message =
    error === "credenciais"
      ? "E-mail ou senha inválidos."
      : error === "email"
        ? "Este e-mail já está cadastrado."
        : "";

  if (await currentUserId()) {
    redirect("/dashboard");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fcfbf7] px-4 py-12">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-6 flex items-center justify-center gap-2 text-lg font-semibold"
        >
         <Image
  src="/logo.png"
  alt="CorrigeAI"
  width={260}
  height={120}
  className="h-auto w-[260px]"
  priority
/>
        </Link>

        <AuthPanel message={message} />
      </div>
    </main>
  );
}