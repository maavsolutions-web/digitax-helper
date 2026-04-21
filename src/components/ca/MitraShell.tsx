import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { TopBar } from "@/components/TopBar";
import { Briefcase, LayoutDashboard, Users, KanbanSquare, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

const links = [
  { to: "/mitra", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/mitra/clients", label: "Clients", icon: Users },
  { to: "/mitra/pipeline", label: "Pipeline", icon: KanbanSquare },
];

export const MitraShell = ({ children }: { children: ReactNode }) => {
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const onSignOut = async () => {
    await signOut();
    navigate("/ca/login");
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar showCta={false} />
      <div className="container max-w-7xl py-6 sm:py-8">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <aside className="md:sticky md:top-24 md:self-start">
            <div className="rounded-2xl border border-border bg-card p-3 shadow-card">
              <div className="flex items-center gap-2 px-2 py-2">
                <div className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-primary">
                  <Briefcase className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">Maav Mitra</p>
                  <p className="text-xs font-semibold">CA Workspace</p>
                </div>
              </div>
              <nav className="mt-2 flex flex-col gap-1">
                {links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    end={l.end}
                    className={({ isActive }) =>
                      `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition-base ${
                        isActive
                          ? "bg-accent text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`
                    }
                  >
                    <l.icon className="h-4 w-4" />
                    {l.label}
                  </NavLink>
                ))}
              </nav>
              <div className="mt-3 border-t border-border pt-3">
                <Button onClick={onSignOut} variant="ghost" size="sm" className="w-full justify-start gap-2 text-muted-foreground">
                  <LogOut className="h-4 w-4" /> Sign out
                </Button>
              </div>
            </div>
          </aside>
          <main>{children}</main>
        </div>
      </div>
    </div>
  );
};
