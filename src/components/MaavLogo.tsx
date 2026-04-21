import { ShieldCheck } from "lucide-react";

export const MaavLogo = ({ className = "" }: { className?: string }) => (
  <div className={`inline-flex items-center gap-2 ${className}`}>
    <div className="relative grid h-8 w-8 place-items-center rounded-xl gradient-primary text-primary-foreground shadow-elevated">
      <ShieldCheck className="h-4 w-4" strokeWidth={2.5} />
    </div>
    <span className="font-display text-xl font-bold tracking-tight text-foreground">
      MAAV
    </span>
  </div>
);
