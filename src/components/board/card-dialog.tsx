import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, COLUMNS, type Card } from "@/lib/board";

export type CardDraft = {
  title: string;
  description: string;
  column_key: string;
  due_date: string;
  time_estimate: string;
  category: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: Card | null;
  defaultColumn: string;
  onSave: (draft: CardDraft) => void;
  onDelete?: (() => void) | undefined;
  saving?: boolean;
};

const emptyDraft = (column: string): CardDraft => ({
  title: "",
  description: "",
  column_key: column,
  due_date: "",
  time_estimate: "",
  category: "general",
});

export function CardDialog({
  open,
  onOpenChange,
  card,
  defaultColumn,
  onSave,
  onDelete,
  saving,
}: Props) {
  const [draft, setDraft] = useState<CardDraft>(emptyDraft(defaultColumn));

  useEffect(() => {
    if (!open) return;
    setDraft(
      card
        ? {
            title: card.title,
            description: card.description ?? "",
            column_key: card.column_key,
            due_date: card.due_date ?? "",
            time_estimate: card.time_estimate ?? "",
            category: card.category,
          }
        : emptyDraft(defaultColumn),
    );
  }, [open, card, defaultColumn]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">
            {card ? "Edit task" : "New task"}
          </DialogTitle>
        </DialogHeader>

        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!draft.title.trim()) return;
            onSave(draft);
          }}
        >
          <div className="space-y-1.5">
            <Label htmlFor="card-title">Title</Label>
            <Input
              id="card-title"
              value={draft.title}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              placeholder="Design the onboarding flow"
              autoFocus
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="card-description">Description</Label>
            <Textarea
              id="card-description"
              rows={3}
              value={draft.description}
              onChange={(event) => setDraft({ ...draft, description: event.target.value })}
              placeholder="What needs to happen?"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Column</Label>
              <Select
                value={draft.column_key}
                onValueChange={(value) => setDraft({ ...draft, column_key: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLUMNS.map((column) => (
                    <SelectItem key={column.key} value={column.key}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select
                value={draft.category}
                onValueChange={(value) => setDraft({ ...draft, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((category) => (
                    <SelectItem key={category} value={category} className="capitalize">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="card-due">Due date</Label>
              <Input
                id="card-due"
                type="date"
                value={draft.due_date}
                onChange={(event) => setDraft({ ...draft, due_date: event.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="card-estimate">Time estimate</Label>
              <Input
                id="card-estimate"
                value={draft.time_estimate}
                onChange={(event) => setDraft({ ...draft, time_estimate: event.target.value })}
                placeholder="2h"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            {onDelete ? (
              <Button
                type="button"
                variant="ghost"
                className="text-destructive hover:text-destructive"
                onClick={onDelete}
              >
                <Trash2 className="size-4" />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {card ? "Save changes" : "Add task"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
