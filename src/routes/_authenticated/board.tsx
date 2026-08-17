import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { BoardColumn } from "@/components/board/board-column";
import { CardFace } from "@/components/board/card-item";
import { CardDialog, type CardDraft } from "@/components/board/card-dialog";
import { InsightsPanel } from "@/components/board/insights-panel";
import { Button } from "@/components/ui/button";
import { COLUMNS, type Card } from "@/lib/board";
import { createCard, deleteCard, listCards, moveCard, updateCard } from "@/lib/board.functions";

export const Route = createFileRoute("/_authenticated/board")({
  head: () => ({
    meta: [
      { title: "Your board — Flowdeck" },
      {
        name: "description",
        content: "Drag and drop tasks across To Do, In Progress, Review and Done.",
      },
      { property: "og:title", content: "Your board — Flowdeck" },
      {
        property: "og:description",
        content: "Drag and drop tasks across To Do, In Progress, Review and Done.",
      },
    ],
  }),
  component: BoardPage;
});

function BoardPage() {
  const context = Route.useRouteContext();
  const queryClient = useQueryClient();

  const fetchCards = useServerFn(listCards);
  const create = useServerFn(createCard);
  const update = useServerFn(updateCard);
  const remove = useServerFn(deleteCard);
  const move = useServerFn(moveCard);

  const { data: cards = [], isLoading } = useQuery({
    queryKey: ["cards"],
    queryFn: () => fetchCards() as Promise<Card[]>,
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Card | null>(null);
  const [targetColumn, setTargetColumn] = useState<string>("todo");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const byColumn = useMemo(() => {
    const map: Record<string, Card[]> = {};
    for (const column of COLUMNS) map[column.key] = [];
    for (const card of cards) (map[card.column_key] ??= []).push(card);
    for (const key of Object.keys(map)) map[key]!.sort((a, b) => a.position - b.position);
    return map;
  }, [cards]);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["cards"] });

  const saveMutation = useMutation({
    mutationFn: async (draft: CardDraft) => {
      const payload = {
        title: draft.title.trim(),
        description: draft.description,
        column_key: draft.column_key,
        due_date: draft.due_date || null,
        time_estimate: draft.time_estimate || null,
        category: draft.category,
      };
      if (editing) {
        return update({ data: { id: editing.id, ...payload } });
      }
      return create({ data: payload });
    },
    onSuccess: async () => {
      setDialogOpen(false);
      setEditing(null);
      await invalidate();
      toast.success(editing ? "Task updated" : "Task added");
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Save failed"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => remove({ data: { id } }),
    onSuccess: async () => {
      setDialogOpen(false);
      setEditing(null);
      await invalidate();
      toast.success("Task deleted");
    },
  });

  const moveMutation = useMutation({
    mutationFn: (input: { id: string; column_key: string; position: number }) =>
      move({ data: input }),
    onError: async (error) => {
      await invalidate();
      toast.error(error instanceof Error ? error.message : "Move failed");
    },
  });

  const activeCard = cards.find((card) => card.id === activeId) ?? null;

  const onDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const onDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const dragged = cards.find((card) => card.id === String(active.id));
    if (!dragged) return;

    const overId = String(over.id);
    let column = dragged.column_key;
    let index = 0;

    if (overId.startsWith("column:")) {
      column = overId.slice("column:".length);
      index = (byColumn[column] ?? []).filter((card) => card.id !== dragged.id).length;
    } else {
      const overCard = cards.find((card) => card.id === overId);
      if (!overCard) return;
      column = overCard.column_key;
      const list = (byColumn[column] ?? []).filter((card) => card.id !== dragged.id);
      index = list.findIndex((card) => card.id === overCard.id);
      if (index < 0) index = list.length;
    }

    const list = (byColumn[column] ?? []).filter((card) => card.id !== dragged.id);
    const before = list[index - 1]?.position;
    const after = list[index]?.position;
    let position: number;
    if (before === undefined && after === undefined) position = 1000;
    else if (before === undefined) position = after! - 500;
    else if (after === undefined) position = before + 1000;
    else position = (before + after) / 2;

    if (column === dragged.column_key && position === dragged.position) return;

    queryClient.setQueryData<Card[]>(["cards"], (previous) =>
      (previous ?? []).map((card) =>
        card.id === dragged.id ? { ...card, column_key: column, position } : card,
      ),
    );
    moveMutation.mutate({ id: dragged.id, column_key: column, position });
  };

  const openNew = (column: string) => {
    setEditing(null);
    setTargetColumn(column);
    setDialogOpen(true);
  };

  const openCard = (card: Card) => {
    setEditing(card);
    setTargetColumn(card.column_key);
    setDialogOpen(true);
  };

  return (
    <AppShell active="board" email={context.user.email} aside={<InsightsPanel cards={cards} />}>
      <div className="flex h-full flex-col gap-6 p-5 lg:p-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Workspace
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold text-foreground">
              Your board
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {cards.length} task{cards.length === 1 ? "" : "s"} across four stages.
            </p>
          </div>
          <Button onClick={() => openNew("todo")} className="gap-2">
            <Plus className="size-4" />
            New task
          </Button>
        </div>

        {isLoading ? (
          <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((column) => (
              <div
                key={column.key}
                className="h-64 animate-pulse rounded-4xl border border-border bg-card/60"
              />
            ))}
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <div className="flex flex-1 flex-col gap-6 lg:flex-row lg:items-start lg:gap-4">
              {COLUMNS.map((column) => (
                <BoardColumn
                  key={column.key}
                  columnKey={column.key}
                  label={column.label}
                  accent={column.accent}
                  cards={byColumn[column.key] ?? []}
                  onOpen={openCard}
                  onAdd={openNew}
                />
              ))}
            </div>

            <DragOverlay dropAnimation={{ duration: 200, easing: "cubic-bezier(0.2,0,0,1)" }}>
              {activeCard ? <CardFace card={activeCard} dragging className="w-72" /> : null}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <CardDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        card={editing}
        defaultColumn={targetColumn}
        saving={saveMutation.isPending}
        onSave={(draft) => saveMutation.mutate(draft)}
        onDelete={editing ? () => deleteMutation.mutate(editing.id) : undefined}
      />
    </AppShell>
  );
}
