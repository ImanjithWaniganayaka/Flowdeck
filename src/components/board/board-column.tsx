import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { SortableCard } from "@/components/board/card-item";
import type { Card } from "@/lib/board";
import { cn } from "@/lib/utils";

type Props = {
  columnKey: string;
  label: string;
  accent: string;
  cards: Card[];
  onOpen: (card: Card) => void;
  onAdd: (columnKey: string) => void;
};

export function BoardColumn({ columnKey, label, accent, cards, onOpen, onAdd }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: `column:${columnKey}` });

  return (
    <section className="flex min-w-[17rem] flex-1 flex-col">
      <header className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: accent }} />
          <h2 className="font-display text-sm font-semibold text-foreground">{label}</h2>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {cards.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          aria-label={`Add task to ${label}`}
          onClick={() => onAdd(columnKey)}
        >
          <Plus className="size-4" />
        </Button>
      </header>

      <div
        ref={setNodeRef}
        className={cn(
          "mt-3 flex flex-1 flex-col gap-3 rounded-4xl border border-dashed border-transparent p-2 transition-colors",
          isOver && "border-primary/40 bg-primary/5",
        )}
      >
        <SortableContext
          items={cards.map((card) => card.id)}
          strategy={verticalListSortingStrategy}
        >
          {cards.map((card) => (
            <SortableCard key={card.id} card={card} onOpen={onOpen} />
          ))}
        </SortableContext>

        {cards.length === 0 ? (
          <button
            type="button"
            onClick={() => onAdd(columnKey)}
            className="rounded-3xl border border-dashed border-border px-4 py-8 text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
          >
            Drop a task here or click to add one
          </button>
        ) : null}
      </div>
    </section>
  );
}
