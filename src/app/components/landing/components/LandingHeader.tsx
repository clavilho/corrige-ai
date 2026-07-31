import Link from "next/link";
import { Button } from "../../ui/button";

// Cabeçalho simples da landing, com logo e botão de acesso à área do professor.
export function LandingHeader() {
  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
      <span className="text-lg font-semibold tracking-tight">
        CorrigeAI
      </span>

      <Button asChild size="sm">
        <Link href="/auth">Entrar</Link>
      </Button>
    </header>
  );
}