import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { FlowShell } from "@/components/flow/StepHeader";
import { Check, Loader2 } from "lucide-react";

const steps = [
  "Reading your documents…",
  "Cross-checking Form 26AS & AIS…",
  "Detecting income mismatches…",
  "Calculating tax liability…",
  "Finding deduction opportunities…",
];

const Processing = () => {
  const [active, setActive] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const t = setInterval(() => {
      setActive((s) => {
        if (s + 1 >= steps.length) {
          clearInterval(t);
          setTimeout(() => navigate("/report"), 900);
          return s + 1;
        }
        return s + 1;
      });
    }, 1100);
    return () => clearInterval(t);
  }, [navigate]);

  return (
    <>
      <TopBar showCta={false} />
      <FlowShell>
        <div className="grid min-h-[60vh] place-items-center text-center">
          <div className="w-full animate-fade-in">
            {/* Animated brain/orb */}
            <div className="relative mx-auto h-32 w-32">
              <div className="absolute inset-0 animate-pulse-ring rounded-full" />
              <div className="absolute inset-0 rounded-full gradient-primary opacity-20 blur-2xl" />
              <div className="relative grid h-full w-full place-items-center rounded-full gradient-primary text-primary-foreground shadow-elevated">
                <Loader2 className="h-10 w-10 animate-spin" strokeWidth={2.25} />
              </div>
            </div>

            <h1 className="mt-8 font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Analyzing your tax data…
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              This usually takes 20–30 seconds. Hang tight.
            </p>

            {/* Steps */}
            <div className="mx-auto mt-10 max-w-md space-y-2.5 text-left">
              {steps.map((label, i) => {
                const done = i < active;
                const current = i === active;
                return (
                  <div
                    key={label}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 transition-base ${
                      current
                        ? "border-primary bg-accent shadow-glow"
                        : done
                        ? "border-success/30 bg-success-soft/40"
                        : "border-border bg-card opacity-60"
                    }`}
                  >
                    <div
                      className={`grid h-7 w-7 place-items-center rounded-full ${
                        done
                          ? "bg-success text-success-foreground"
                          : current
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {done ? (
                        <Check className="h-3.5 w-3.5" strokeWidth={3} />
                      ) : current ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <span className="text-xs font-semibold">{i + 1}</span>
                      )}
                    </div>
                    <span className={`text-sm font-medium ${current ? "text-foreground" : done ? "text-foreground/80" : "text-muted-foreground"}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </FlowShell>
    </>
  );
};

export default Processing;
