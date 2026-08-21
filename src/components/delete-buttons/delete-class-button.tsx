"use client";

import React, { useRef, useState } from "react";
import ConfirmDialog from "@/components/confirm-dialog";
import { excludeClass } from "@/features/classes/actions";

export default function DeleteClassButton({
  classId,
  className
}: {
  classId: string;
  className: string;
}) {
  const formRef = useRef<HTMLFormElement | null>(null);
  const [loading, setLoading] = useState(false);

  function onConfirm(): Promise<void> {
    return new Promise<void>((resolve) => {
      try {
        setLoading(true);

        // dispara o submit da Server Action
        formRef.current?.requestSubmit();

        // se a página navegar (submissão/redirecionamento), o evento 'pagehide' será disparado
        const onPageHide = () => {
          cleanup();
          resolve();
        };

        // fallback para resolver caso nada aconteça (evita loader travado)
        const timeout = window.setTimeout(() => {
          cleanup();
          resolve();
        }, 10000); // 10s fallback

        function cleanup() {
          window.removeEventListener("pagehide", onPageHide);
          window.clearTimeout(timeout);
          // manter loading true até resolve ser chamado; o caller/ConfirmDialog irá mudar o estado
          setLoading(false);
        }

        window.addEventListener("pagehide", onPageHide, { once: true });
      } catch (err) {
        console.error("deleteExam submit failed", err);
        setLoading(false);
        resolve();
      }
    });
  }

  return (
    <>
      <form ref={formRef} action={excludeClass} className="m-0">
        <input type="hidden" name="classId" value={classId} />
        
        <ConfirmDialog
          title="Confirmar exclusão"
          description={`Tem certeza que deseja excluir a turma ${className ?? ""}? Todos os alunos cadastrados tambem serão excluidos. Esta ação é irreversível.`}
          confirmLabel={loading ? "Excluindo..." : "Sim, excluir"}
          cancelLabel="Cancelar"
          onConfirm={onConfirm}
        >
          {/* Trigger button: mostra loader quando loading === true */}
          <button
            type="button"
            className="inline-flex w-full items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-semibold border border-red-200 text-red-700 bg-white hover:bg-red-50 transition disabled:opacity-60 sm:w-auto"
            aria-label={`Excluir turma ${classId}`}
            disabled={loading}
          >
            {loading ? (
              <>
                <svg
                  className="h-4 w-4 animate-spin text-red-700"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeOpacity="0.25"
                    strokeWidth="4"
                  />
                  <path
                    d="M22 12a10 10 0 00-10-10"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                  />
                </svg>
                <span>Excluindo...</span>
              </>
            ) : (
              <>Excluir</>
            )}
          </button>
        </ConfirmDialog>
      </form>
    </>
  );
}
