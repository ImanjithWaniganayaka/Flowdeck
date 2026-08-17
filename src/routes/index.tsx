import { createFileRoute, Link } from "@tanstack/react-router";
import { LayoutGrid, MessageCircle, Sparkle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { COLUMNS } from "@/lib/board";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flowdeck — a Kanban board with an AI copilot" },
      {
        name: "description",
        content:
          "Plan work on a drag-and-drop Kanban board and ask an AI copilot to create, move and summarise your tasks.",
      },
      { property: "og:title", content: "Flowdeck — a Kanban board with an AI copilot" },
      {
        property: "og:description",
        content: "Drag-and-drop Kanban with a built-in AI copilot that edits your board for you.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-background">
      <div className="pointer-events-none absolute -left-40 -top-32 h-[28rem] w-[28rem] rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 top-40 h-[26rem] w-[26rem] rounded-full bg-accent/50 blur-3xl" />

      <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span className="flex items-center gap-2 font-display text-lg font-semibold text-foreground">
          <span className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <LayoutGrid className="size-4" />
          </span>
          Flowdeck
        </span>
        <Button asChild variant="outline">
          <Link to="/auth" search={{ redirect: undefined }}>
            Sign in
          </Link>
        </Button>
      </header>

      <section className="relative mx-auto max-w-3xl px-6 pb-16 pt-14 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-[var(--shadow-soft)]">
          <Sparkle className="size-3.5 text-primary" />
          Kanban, with an AI copilot that actually moves cards
        </span>
        <h1 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
          Plan the work. Let the copilot handle the busywork.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-base text-muted-foreground">
          Drag tasks through To Do, In Progress, Review and Done — then ask Flowdeck Copilot to
          add tasks, reshuffle your week, or tell you what's slipping.
        </p>
        <div className="mt-8 flex justify-center">
          <Button asChild size="lg">
            <Link to="/auth" search={{ redirect: "/board" }}>
              Start your board
            </Link>
          </Button>
        </div>
      </section>

      <section className="relative mx-auto max-w-5xl px-6 pb-20">
        <div className="rounded-4xl border border-border bg-card/80 p-5 shadow-[var(--shadow-soft)] backdrop-blur">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {COLUMNS.map((column, columnIndex) => (
              <div key={column.key} className="rounded-3xl bg-background/70 p-4">
                <div className="flex items-center gap-2">
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: column.accent }}
                  />
                  <p className="font-display text-sm font-semibold text-foreground">
                    {column.label}
                  </p>
                </div>
                <div className="mt-3 space-y-2">
                  {Array.from({ length: 3 - columnIndex % 2 }).map((_, index) => (
                    <div
                      key={index}
                      className="rounded-2xl border border-border bg-card p-3 shadow-[var(--shadow-soft)]"
                    >
                      <div className="h-2 w-16 rounded-full bg-muted" />
                      <div className="mt-2 h-2 w-24 rounded-full bg-muted/70" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-3xl bg-primary p-4 text-primary-foreground">
            <MessageCircle className="size-5 shrink-0" />
            <p className="text-sm">
              "Move the landing page review to In Progress and add a task to ship it by Friday."
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
