import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarDays, Clock, GripVertical } from "lucide-react";

import { categoryStyle, dueState, formatDue, type Card } from "@/lib/board";
import { cn } from "@/lib/utils";

const dueStyles: Record<string, string> = {
  overdue: "bg-destructive/10 text-destructive",
  soon: "bg-warning/15 text-warning-foreground",
  later: "bg-muted text-muted-foreground",
};

export function CardFace({
  card,
  dragging,
  className,
}: {
  card: Card;
  dragging?: boolean;
  className?: string;
}) {
  const state = dueState(card.due_date);

  return (
    <div
      className={cn(
        "group rounded-3xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] transition-all",
        dragging ? "rotate-1 scale-[1.02] shadow-[var(--shadow-lift)]" : "hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize",
            categoryStyle(card.category),
          )}
        >
          {card.category}
        </span>
        <GripVertical className="size-4 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>

      <h3 className="mt-3 text-sm font-semibold leading-snug text-card-foreground">
        {card.title}
      </h3>
      {card.description ? (
        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {card.description}
        </p>
      ) : null}

      {card.due_date || card.time_estimate ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {card.due_date ? (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium",
                dueStyles[state] ?? dueStyles["later"],
              )}
            >
              <CalendarDays className="size-3" />
              {state === "overdue" ? "Overdue · " : ""}
              {formatDue(card.due_date)}
            </span>
          ) : null}
          {card.time_estimate ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-[11px] font-medium text-muted-foreground">
              <Clock className="size-3" />
              {card.time_estimate}
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

export function SortableCard({ card, onOpen }: { card: Card; onOpen: (card: Card) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("touch-none", isDragging && "opacity-40")}
      {...attributes}
      {...listeners}
      onClick={() => onOpen(card)}
      role="button"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "Enter") onOpen(card);
      }}
    >
      <CardFace card={card} />
    </div>
  );
}
