"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type ConfirmOptions = {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "destructive";
};

type Pending = {
  options: ConfirmOptions;
  resolve: (value: boolean) => void;
};

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  const confirm = useCallback<ConfirmFn>(
    (options) =>
      new Promise<boolean>((resolve) => {
        setPending({ options, resolve });
      }),
    [],
  );

  const resolveWith = useCallback((value: boolean) => {
    setPending((current) => {
      current?.resolve(value);
      return null;
    });
  }, []);

  useEffect(() => {
    if (!pending) return;
    cancelRef.current?.focus();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        resolveWith(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [pending, resolveWith]);

  const tone = pending?.options.tone ?? "default";

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      {pending ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <button
            type="button"
            aria-label="Dismiss dialog"
            onClick={() => resolveWith(false)}
            className="absolute inset-0 bg-[#0b1b2b]/55 backdrop-blur-sm"
          />
          <div className="relative w-full max-w-md rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_80px_-40px_rgba(11,27,43,0.55)] sm:p-8">
            <h2
              id="confirm-dialog-title"
              className="font-display text-2xl text-foreground"
            >
              {pending.options.title}
            </h2>
            {pending.options.description ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {pending.options.description}
              </p>
            ) : null}
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                ref={cancelRef}
                type="button"
                onClick={() => resolveWith(false)}
                className="rounded-full border border-line px-5 py-2 text-sm font-semibold transition hover:border-foreground"
              >
                {pending.options.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="button"
                onClick={() => resolveWith(true)}
                className={
                  tone === "destructive"
                    ? "rounded-full bg-[#8f2b18] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#6f2113]"
                    : "rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:bg-[#1e3347]"
                }
              >
                {pending.options.confirmLabel ?? "Confirm"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error("useConfirm must be used within ConfirmDialogProvider");
  }
  return ctx;
}
