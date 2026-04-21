import { MaavLogo } from "./MaavLogo";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const TopBar = ({ showCta = true }: { showCta?: boolean }) => (
  <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
    <div className="container flex h-16 items-center justify-between">
      <Link to="/"><MaavLogo /></Link>
      {showCta && (
        <Link to="/signup">
          <Button size="sm" variant="ghost" className="text-muted-foreground hover:text-foreground">
            Sign in
          </Button>
        </Link>
      )}
    </div>
  </header>
);
