"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

type PromptOptions = {
  title: string;
  description?: string;
  label?: string;
  placeholder?: string;
  initialValue?: string;
  suffix?: string;
  confirmLabel?: string;
  cancelLabel?: string;
};

type Pending = {
  options: PromptOptions;
  resolve: (value: string | null) => void;
};

type PromptFn = (options: PromptOptions) => Promise<string | null>;

const PromptContext = createContext<PromptFn | null>(null);

export function PromptDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [pending, setPending] = useState<Pending | null>(null);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  const prompt = useCallback<PromptFn>(
    (options) =>
      new Promise<string | null>((resolve) => {
        setValue(options.initialValue ?? "");
        setPending({ options, resolve });
      }),
    [],
  );

  const resolveWith = useCallback((next: string | null) => {
    setPending((current) => {
      current?.resolve(next);
      return null;
    });
    setValue("");
  }, []);

  useEffect(() => {
    if (!pending) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => {
      const input = inputRef.current;
      if (input) {
        input.focus();
        input.select();
      }
    });
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        resolveWith(null);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [pending, resolveWith]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    resolveWith(value.trim());
  };

  return (
    <PromptContext.Provider value={prompt}>
      {children}
      {pending ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="prompt-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <button
            type="button"
            aria-label="Dismiss dialog"
            onClick={() => resolveWith(null)}
            className="absolute inset-0 bg-[#0b1b2b]/55 backdrop-blur-sm"
          />
          <form
            onSubmit={handleSubmit}
            className="relative w-full max-w-md rounded-[28px] border border-line bg-white p-6 shadow-[0_30px_80px_-40px_rgba(11,27,43,0.55)] sm:p-8"
          >
            <h2
              id="prompt-dialog-title"
              className="font-display text-2xl text-foreground"
            >
              {pending.options.title}
            </h2>
            {pending.options.description ? (
              <p className="mt-3 text-sm leading-relaxed text-muted">
                {pending.options.description}
              </p>
            ) : null}
            <label className="mt-5 block text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              {pending.options.label ?? "Name"}
              <div className="mt-2 flex items-center gap-1 rounded-2xl border border-line bg-white px-3 transition focus-within:border-foreground">
                <input
                  ref={inputRef}
                  type="text"
                  value={value}
                  onChange={(event) => setValue(event.target.value)}
                  placeholder={pending.options.placeholder}
                  className="min-w-0 flex-1 bg-transparent py-2.5 text-sm font-medium text-foreground outline-none placeholder:font-normal placeholder:text-muted"
                />
                {pending.options.suffix ? (
                  <span className="shrink-0 text-sm font-normal text-muted">
                    {pending.options.suffix}
                  </span>
                ) : null}
              </div>
            </label>
            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <button
                type="button"
                onClick={() => resolveWith(null)}
                className="rounded-full border border-line px-5 py-2 text-sm font-semibold transition hover:border-foreground"
              >
                {pending.options.cancelLabel ?? "Cancel"}
              </button>
              <button
                type="submit"
                className="rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-background transition hover:bg-[#1e3347]"
              >
                {pending.options.confirmLabel ?? "OK"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </PromptContext.Provider>
  );
}

export function usePrompt() {
  const ctx = useContext(PromptContext);
  if (!ctx) {
    throw new Error("usePrompt must be used within PromptDialogProvider");
  }
  return ctx;
}
