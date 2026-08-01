import Link from "next/link";
import {
  FileText,
  GraduationCap,
  History,
  LayoutDashboard,
  LogOut,
  ScanLine,
} from "lucide-react";
import { signOut } from "@/features/auth/actions";

const navigation = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/exams", label: "Provas", icon: FileText },
  { href: "/correct", label: "Corrigir prova", icon: ScanLine },
  { href: "/corrections", label: "Minhas correções", icon: History },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#fcfbf7]">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 font-semibold"
          >
            <span className="grid size-8 place-items-center rounded-lg bg-[#007782] text-white">
              <GraduationCap className="size-4" />
            </span>
            <span>CorrigeAI</span>
          </Link>
          <nav className="ml-auto hidden items-center gap-1 md:flex">
            {navigation.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-md px-3 py-2 text-sm text-slate-500 transition hover:bg-[#e8f5f5] hover:text-slate-900"
              >
                {label}
              </Link>
            ))}
          </nav>
          <form action={signOut} className="ml-auto md:ml-0">
            <button className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-slate-600 hover:bg-slate-100">
              <LogOut className="size-4" />
              Sair
            </button>
          </form>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-slate-200 px-3 py-2 md:hidden">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex shrink-0 items-center gap-1 rounded-md px-3 py-1.5 text-xs text-slate-500"
            >
              <Icon className="size-3.5" />
              {label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
