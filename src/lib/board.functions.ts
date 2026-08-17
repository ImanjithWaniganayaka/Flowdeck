import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const cardFields = "id,title,description,column_key,position,due_date,time_estimate,category,created_at,updated_at";

const CreateCardInput = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  column_key: z.string().min(1).max(40),
  due_date: z.string().nullable().optional(),
  time_estimate: z.string().max(40).nullable().optional(),
  category: z.string().max(40).optional(),
});

const UpdateCardInput = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(4000).optional(),
  column_key: z.string().min(1).max(40).optional(),
  due_date: z.string().nullable().optional(),
  time_estimate: z.string().max(40).nullable().optional(),
  category: z.string().max(40).optional(),
  position: z.number().optional(),
});

export const listCards = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cards")
      .select(cardFields)
      .order("position", { ascending: true });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const createCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateCardInput.parse(input))
  .handler(async ({ data, context }) => {
    const { data: last } = await context.supabase
      .from("cards")
      .select("position")
      .eq("column_key", data.column_key)
      .order("position", { ascending: false })
      .limit(1);
    const position = (last?.[0]?.position ?? 0) + 1000;

    const { data: row, error } = await context.supabase
      .from("cards")
      .insert({
        user_id: context.userId,
        title: data.title,
        description: data.description ?? "",
        column_key: data.column_key,
        due_date: data.due_date ?? null,
        time_estimate: data.time_estimate ?? null,
        category: data.category ?? "general",
        position,
      })
      .select(cardFields)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => UpdateCardInput.parse(input))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { data: row, error } = await context.supabase
      .from("cards")
      .update(patch)
      .eq("id", id)
      .select(cardFields)
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("cards").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const moveCard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        column_key: z.string().min(1).max(40),
        position: z.number(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("cards")
      .update({ column_key: data.column_key, position: data.position })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
