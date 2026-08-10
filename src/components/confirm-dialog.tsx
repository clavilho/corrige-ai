"use client";

import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

type ConfirmDialogProps = {
  title?: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => Promise<void> | void;
  children: React.ReactElement; // trigger element (will be cloned)
  className?: string;
};

export default function ConfirmDialog({
  title = "Confirmar ação",
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onConfirm,
  children,
  className,
}: ConfirmDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const confirmRef = useRef<HTMLButtonElement | null>(null);

  // focus confirm button when dialog opens
  useEffect(() => {
    if (open) {
      const t = setTimeout(() => confirmRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [open]);

  async function handleConfirm() {
    try {
      setLoading(true);
      await onConfirm();
      // If onConfirm navigates away, modal closure is irrelevant; otherwise close
      setOpen(false);
    } catch (err) {
      console.error("ConfirmDialog onConfirm error:", err);
    } finally {
      setLoading(false);
    }
  }

  const trigger = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<any>, {
        onClick: (e: any) => {
          const origOnClick = (children.props as any)?.onClick;
          if (typeof origOnClick === "function") origOnClick(e);
          e?.preventDefault?.();
          setOpen(true);
        },
        className: [(children.props as any)?.className, className]
          .filter(Boolean)
          .join(" "),
      })
    : children;

  return (
    <>
      {trigger}

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="relative mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {description && (
              <p className="mt-3 text-sm text-slate-700">{description}</p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                {cancelLabel}
              </Button>

              <Button
                ref={confirmRef}
                variant="destructive"
                onClick={handleConfirm}
                disabled={loading}
              >
                {loading ? "Aguarde..." : confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
