"use client";

import { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin, CredentialResponse } from "@react-oauth/google";
import { useRouter } from "next/navigation";
import { authenticateWithGoogle } from "@/features/auth/actions";
import { Loader2 } from "lucide-react";

const GOOGLE_CLIENT_ID = (process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "").trim() || "YOUR_GOOGLE_CLIENT_ID";



export function AuthPanel() {
  const router = useRouter();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (credentialResponse: CredentialResponse) => {
    if (!credentialResponse.credential) {
      setErrorMsg("Não foi possível obter as credenciais do Google.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await authenticateWithGoogle(credentialResponse.credential);
      if (res.success) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err: unknown) {
      console.error("Erro na autenticação via Google:", err);
      setErrorMsg("Ocorreu um erro ao realizar o login com o Google. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setErrorMsg("Falha ao se conectar com o Google.");
  };

  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-[0_12px_32px_-12px_rgba(23,38,51,.18)]">
        <h1 className="text-xl font-bold text-center sm:text-left">Área do professor</h1>
        <p className="mt-1 text-base text-slate-500 text-center sm:text-left">
          Entre na sua conta para começar a corrigir.
        </p>

        {errorMsg && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {errorMsg}
          </div>
        )}

        <div className="mt-8 flex flex-col items-center justify-center">
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-slate-600 font-medium">
              <Loader2 className="size-5 animate-spin text-[#007782]" />
              <span>Autenticando com o Google...</span>
            </div>
          ) : (
            <div className="w-full flex justify-center min-h-[44px]">
              <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                useOneTap
                text="signin_with"
                shape="rectangular"
                size="large"
              />
            </div>
          )}
        </div>
      </section>
    </GoogleOAuthProvider>
  );
}
