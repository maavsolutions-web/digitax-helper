import { Check } from "lucide-react";

interface Props {
  current: number; // 1-based
  total: number;
  label: string;
}

export const StepHeader = ({ current, total, label }: Props) => {
  const pct = (current / total) * 100;
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs font-medium">
        <span className="text-muted-foreground">
          Step <span className="text-foreground">{current}</span> of {total}
        </span>
        <span className="text-primary">{label}</span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => {
          const done = i + 1 < current;
          const active = i + 1 === current;
          return (
            <div
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-base ${
                done || active ? "bg-primary" : "bg-muted"
              } ${active ? "shadow-glow" : ""}`}
            />
          );
        })}
      </div>
      <div className="sr-only" aria-live="polite">{Math.round(pct)}% complete</div>
    </div>
  );
};

export const FlowShell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <main className="container max-w-xl py-6 sm:py-10">{children}</main>
  </div>
);

export const StepCheck = ({ done }: { done: boolean }) => (
  <div
    className={`grid h-5 w-5 place-items-center rounded-full border transition-base ${
      done
        ? "border-success bg-success text-success-foreground"
        : "border-border bg-background"
    }`}
  >
    {done && <Check className="h-3 w-3" strokeWidth={3} />}
  </div>
);
