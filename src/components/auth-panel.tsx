"use client";

import { useState } from "react";
import { signIn, signUp } from "@/features/auth/actions";

type AuthPanelProps = {
  message: string;
};

export function AuthPanel({ message }: AuthPanelProps) {
  const [tab, setTab] = useState<"login" | "signup">("login");

  return (
    <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]">
      <h1 className="text-xl font-bold">Área do professor</h1>

      <p className="mt-1 text-base text-slate-500">
        Entre ou crie sua conta para começar a corrigir.
      </p>

      {message && (
        <p className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {message}
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 rounded-lg bg-[#e8f5f5] p-1">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`rounded-lg px-3 py-2 text-base ${
            tab === "login"
              ? "bg-white font-medium shadow-sm"
              : "text-slate-600"
          }`}
        >
          Entrar
        </button>

        <button
          type="button"
          onClick={() => setTab("signup")}
          className={`rounded-lg px-3 py-2 text-base ${
            tab === "signup"
              ? "bg-white font-medium shadow-sm"
              : "text-slate-600"
          }`}
        >
          Cadastrar
        </button>
      </div>

      {tab === "login" ? (
        <form action={signIn} className="mt-6 space-y-5">
          <label className="block text-base font-medium">
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              required
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3 outline-none shadow-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <label className="block text-base font-medium">
            Senha
            <input
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className="mt-1.5 h-11 w-full rounded-xl border border-slate-300 px-3 outline-none shadow-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <button
            type="submit"
            className="h-11 w-full rounded-xl bg-[#007782] font-semibold text-white shadow-sm hover:bg-[#006571]"
          >
            Entrar
          </button>

          <button
            type="button"
            className="block w-full text-center text-base text-slate-500"
          >
            Esqueci minha senha
          </button>

          <div className="flex items-center gap-4 text-sm text-slate-500">
            <span className="h-px flex-1 bg-slate-200" />
            <span>ou</span>
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          <button
            type="button"
            className="h-12 w-full rounded-xl border border-slate-300 font-medium shadow-sm"
          >
            Continuar com Google
          </button>
        </form>
      ) : (
        <form action={signUp} className="mt-7 space-y-5">
          <label className="block text-base font-medium">
            Nome
            <input
              name="name"
              type="text"
              autoComplete="name"
              required
              className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-3 outline-none shadow-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <label className="block text-base font-medium">
            E-mail
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              required
              className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-3 outline-none shadow-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <label className="block text-base font-medium">
            Senha
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={8}
              required
              className="mt-1.5 h-12 w-full rounded-xl border border-slate-300 px-3 outline-none shadow-sm focus:border-teal-700 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <button
            type="submit"
            className="h-12 w-full rounded-xl bg-[#007782] font-semibold text-white shadow-sm hover:bg-[#006571]"
          >
            Cadastrar
          </button>
        </form>
      )}
    </section>
  );
}
