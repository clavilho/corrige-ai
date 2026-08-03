"use client";

import React, { useEffect, useRef, useState } from "react";

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

  // clone trigger element to open modal (preserve existing props/click handler)
  const trigger = React.cloneElement(children, {
    onClick: (e: any) => {
      if (typeof children.props.onClick === "function") children.props.onClick(e);
      e?.preventDefault?.();
      setOpen(true);
    },
    className: [children.props.className, className].filter(Boolean).join(" "),
  });

  return (
    <>
      {trigger}

      {open && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          <div className="relative mx-4 w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
            {title && <h3 className="text-lg font-semibold">{title}</h3>}
            {description && <p className="mt-3 text-sm text-slate-700">{description}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="rounded-md border px-4 py-2 text-sm font-medium cursor-pointer"
                disabled={loading}
              >
                {cancelLabel}
              </button>

              <button
                ref={confirmRef}
                onClick={handleConfirm}
                className="rounded-md bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 cursor-pointer"
                disabled={loading}
              >
                {loading ? "Aguarde..." : confirmLabel}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}