import { Link, useNavigate } from "@tanstack/react-router";
import { LayoutGrid, MessageCircle, LogOut } from "lucide-react";
import type { ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  active: "board" | "chat";
  children: ReactNode;
  aside?: ReactNode;
  email?: string | undefined;
};

export function AppShell({ active, children, aside, email }: Props) {
  const navigate = useNavigate();

  const signOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/auth", search: { redirect: undefined } });
  };

  const navItem = (
    to: string,
    label: string,
    icon: ReactNode,
    key: Props["active"],
  ) => (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition-colors",
        active === key
          ? "bg-primary text-primary-foreground shadow-[var(--shadow-soft)]"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {icon}
      {label}
    </Link>
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border bg-sidebar px-4 py-6 lg:flex">
        <Link to="/" className="flex items-center gap-2 px-2">
          <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <LayoutGrid className="size-4" />
          </span>
          <span className="font-display text-base font-semibold text-sidebar-foreground">
            Flowdeck
          </span>
        </Link>

        <nav className="mt-8 space-y-1">
          {navItem("/board", "Board", <LayoutGrid className="size-4" />, "board")}
          {navItem("/chat", "Copilot", <MessageCircle className="size-4" />, "chat")}
        </nav>

        <div className="mt-auto space-y-3 border-t border-border pt-4">
          {email ? (
            <p className="truncate px-2 text-xs text-muted-foreground">{email}</p>
          ) : null}
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={signOut}>
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3 lg:hidden">
          <span className="font-display text-base font-semibold">Flowdeck</span>
          <div className="flex items-center gap-2">
            <Link to="/board" className="text-sm text-muted-foreground">
              Board
            </Link>
            <Link to="/chat" className="text-sm text-muted-foreground">
              Copilot
            </Link>
            <Button variant="ghost" size="icon-sm" onClick={signOut} aria-label="Sign out">
              <LogOut className="size-4" />
            </Button>
          </div>
        </header>

        <div className="flex min-w-0 flex-1 flex-col xl:flex-row">
          <div className="min-w-0 flex-1">{children}</div>
          {aside ? (
            <div className="w-full shrink-0 border-t border-border xl:w-80 xl:border-l xl:border-t-0">
              {aside}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
