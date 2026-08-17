import { Link } from "@tanstack/react-router";
import { AlertTriangle, CalendarClock, Sparkle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { COLUMNS, dueState, formatDue, type Card } from "@/lib/board";

export function InsightsPanel({ cards }: { cards: Card[] }) {
  const total = cards.length;
  const done = cards.filter((card) => card.column_key === "done").length;
  const percent = total === 0 ? 0 : Math.round((done / total) * 100);
  const overdue = cards.filter(
    (card) => card.column_key !== "done" && dueState(card.due_date) === "overdue",
  );
  const soon = cards.filter(
    (card) => card.column_key !== "done" && dueState(card.due_date) === "soon",
  );

  const ring = `conic-gradient(var(--primary) ${percent * 3.6}deg, var(--muted) ${percent * 3.6}deg)`;

  return (
    <div className="flex h-full flex-col gap-5 p-5">
      <div className="rounded-4xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <h2 className="font-display text-sm font-semibold text-card-foreground">Productivity</h2>
        <div className="mt-4 flex items-center gap-5">
          <div
            className="grid size-24 place-items-center rounded-full"
            style={{ background: ring }}
          >
            <div className="grid size-[4.5rem] place-items-center rounded-full bg-card">
              <span className="font-display text-lg font-semibold text-card-foreground">
                {percent}%
              </span>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-card-foreground">
              {done} of {total} done
            </p>
            <p className="text-xs text-muted-foreground">
              {total - done} task{total - done === 1 ? "" : "s"} still open
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2">
          {COLUMNS.map((column) => {
            const count = cards.filter((card) => card.column_key === column.key).length;
            const width = total === 0 ? 0 : Math.round((count / total) * 100);
            return (
              <div key={column.key}>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{column.label}</span>
                  <span>{count}</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${width}%`, backgroundColor: column.accent }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-4xl border border-border bg-card p-5 shadow-[var(--shadow-soft)]">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-card-foreground">
          <AlertTriangle className="size-4 text-destructive" />
          Needs attention
        </h2>
        {overdue.length === 0 && soon.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Nothing overdue. Enjoy the calm.
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {[...overdue, ...soon].slice(0, 5).map((card) => (
              <li
                key={card.id}
                className="flex items-center justify-between gap-2 rounded-2xl bg-muted/60 px-3 py-2"
              >
                <span className="truncate text-xs font-medium text-card-foreground">
                  {card.title}
                </span>
                <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground">
                  <CalendarClock className="size-3" />
                  {formatDue(card.due_date)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-4xl bg-primary p-5 text-primary-foreground shadow-[var(--shadow-soft)]">
        <h2 className="flex items-center gap-2 font-display text-sm font-semibold">
          <Sparkle className="size-4" />
          Ask the copilot
        </h2>
        <p className="mt-2 text-xs text-primary-foreground/80">
          Have it plan your week, add tasks or summarise what's slipping.
        </p>
        <Button asChild variant="secondary" className="mt-4 w-full">
          <Link to="/chat">Open Copilot</Link>
        </Button>
      </div>
    </div>
  );
}
