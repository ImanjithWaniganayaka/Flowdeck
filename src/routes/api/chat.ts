import { createFileRoute } from "@tanstack/react-router";
import { convertToModelMessages, streamText, stepCountIs, tool, type UIMessage } from "ai";
import { z } from "zod";

import { createLovableAiGatewayProvider } from "@/lib/ai-gateway.server";
import { getRequestUser } from "@/lib/supabase-request.server";
import { COLUMN_KEYS, CATEGORIES } from "@/lib/board";

const cardFields =
  "id,title,description,column_key,position,due_date,time_estimate,category,created_at,updated_at";

type ChatRequestBody = { messages?: unknown; threadId?: unknown };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = await getRequestUser(request);
        if (!auth) return new Response("Unauthorized", { status: 401 });

        const apiKey = process.env["LOVABLE_API_KEY"];
        if (!apiKey) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = (await request.json()) as ChatRequestBody;
        const messages = body.messages;
        const threadId = typeof body.threadId === "string" ? body.threadId : null;
        if (!Array.isArray(messages) || !threadId) {
          return new Response("messages and threadId are required", { status: 400 });
        }

        const { supabase, userId } = auth;

        const { data: thread } = await supabase
          .from("chat_threads")
          .select("id,title")
          .eq("id", threadId)
          .maybeSingle();
        if (!thread) return new Response("Thread not found", { status: 404 });

        const uiMessages = messages as UIMessage[];
        const lastMessage = uiMessages[uiMessages.length - 1];

        if (lastMessage?.role === "user") {
          const { error } = await supabase.from("chat_messages").insert({
            thread_id: threadId,
            user_id: userId,
            role: "user",
            parts: lastMessage.parts as never,
          });
          if (error) console.error("Failed to save user message", error.message);

          const text = lastMessage.parts
            .map((part) => (part.type === "text" ? part.text : ""))
            .join(" ")
            .trim();
          if (thread.title === "New chat" && text) {
            await supabase
              .from("chat_threads")
              .update({ title: text.slice(0, 60) })
              .eq("id", threadId);
          } else {
            await supabase
              .from("chat_threads")
              .update({ updated_at: new Date().toISOString() })
              .eq("id", threadId);
          }
        }

        const listBoard = async () => {
          const { data, error } = await supabase
            .from("cards")
            .select(cardFields)
            .order("position", { ascending: true });
          if (error) throw new Error(error.message);
          return data ?? [];
        };

        const tools = {
          list_cards: tool({
            description:
              "List every card on the user's board with its column, due date, time estimate and category. Use this before answering questions about tasks, overdue work or progress.",
            inputSchema: z.object({}),
            execute: async () => {
              const cards = await listBoard();
              const today = new Date().toISOString().slice(0, 10);
              return { today, count: cards.length, cards };
            },
          }),
          create_card: tool({
            description: "Create a new task card on the board.",
            inputSchema: z.object({
              title: z.string().describe("Short task title"),
              description: z.string().nullable().describe("Longer details, or null"),
              column: z.enum(COLUMN_KEYS as [string, ...string[]]).describe("Target column"),
              due_date: z.string().nullable().describe("Due date as YYYY-MM-DD, or null"),
              time_estimate: z
                .string()
                .nullable()
                .describe("Time estimate such as '2h' or '3d', or null"),
              category: z.enum(CATEGORIES as unknown as [string, ...string[]]).nullable(),
            }),
            execute: async (input) => {
              const { data: last } = await supabase
                .from("cards")
                .select("position")
                .eq("column_key", input.column)
                .order("position", { ascending: false })
                .limit(1);
              const { data, error } = await supabase
                .from("cards")
                .insert({
                  user_id: userId,
                  title: input.title,
                  description: input.description ?? "",
                  column_key: input.column,
                  due_date: input.due_date,
                  time_estimate: input.time_estimate,
                  category: input.category ?? "general",
                  position: (last?.[0]?.position ?? 0) + 1000,
                })
                .select(cardFields)
                .single();
              if (error) return { ok: false, error: error.message };
              return { ok: true, card: data };
            },
          }),
          move_card: tool({
            description: "Move an existing card to a different column.",
            inputSchema: z.object({
              card_id: z.string().describe("The id of the card to move"),
              column: z.enum(COLUMN_KEYS as [string, ...string[]]),
            }),
            execute: async (input) => {
              const { data: last } = await supabase
                .from("cards")
                .select("position")
                .eq("column_key", input.column)
                .order("position", { ascending: false })
                .limit(1);
              const { data, error } = await supabase
                .from("cards")
                .update({
                  column_key: input.column,
                  position: (last?.[0]?.position ?? 0) + 1000,
                })
                .eq("id", input.card_id)
                .select(cardFields)
                .maybeSingle();
              if (error) return { ok: false, error: error.message };
              if (!data) return { ok: false, error: "Card not found" };
              return { ok: true, card: data };
            },
          }),
          update_card: tool({
            description:
              "Update fields on an existing card. Pass null for any field that should stay unchanged.",
            inputSchema: z.object({
              card_id: z.string(),
              title: z.string().nullable(),
              description: z.string().nullable(),
              due_date: z.string().nullable().describe("YYYY-MM-DD or null"),
              time_estimate: z.string().nullable(),
              category: z.enum(CATEGORIES as unknown as [string, ...string[]]).nullable(),
            }),
            execute: async (input) => {
              const patch: Record<string, string> = {};
              if (input.title !== null) patch["title"] = input.title;
              if (input.description !== null) patch["description"] = input.description;
              if (input.due_date !== null) patch["due_date"] = input.due_date;
              if (input.time_estimate !== null) patch["time_estimate"] = input.time_estimate;
              if (input.category !== null) patch["category"] = input.category;
              const { data, error } = await supabase
                .from("cards")
                .update(patch)
                .eq("id", input.card_id)
                .select(cardFields)
                .maybeSingle();
              if (error) return { ok: false, error: error.message };
              if (!data) return { ok: false, error: "Card not found" };
              return { ok: true, card: data };
            },
          }),
          delete_card: tool({
            description: "Delete a card from the board.",
            inputSchema: z.object({ card_id: z.string() }),
            execute: async (input) => {
              const { error } = await supabase.from("cards").delete().eq("id", input.card_id);
              if (error) return { ok: false, error: error.message };
              return { ok: true };
            },
          }),
        };

        const gateway = createLovableAiGatewayProvider(apiKey);
        const today = new Date().toISOString().slice(0, 10);

        const result = streamText({
          model: gateway("google/gemini-3.6-flash"),
          stopWhen: stepCountIs(50),
          tools,
          system: [
            "You are Flowdeck Copilot, an assistant embedded in a personal Kanban board app.",
            `Today's date is ${today}.`,
            `The board columns are: ${COLUMN_KEYS.join(", ")} (todo = To Do, progress = In Progress, review = Review, done = Done).`,
            `Available categories: ${CATEGORIES.join(", ")}.`,
            "Always call list_cards before answering questions about the board so your answer reflects the real data.",
            "When the user asks to add, move, update or remove work, use the tools instead of only describing what to do.",
            "Be concise and practical. Use short markdown with bullet lists when summarising. Mention overdue tasks first when relevant.",
          ].join("\n"),
          messages: convertToModelMessages(uiMessages),
        });

        return result.toUIMessageStreamResponse({
          originalMessages: uiMessages,
          onFinish: async ({ responseMessage }) => {
            const { error } = await supabase.from("chat_messages").insert({
              thread_id: threadId,
              user_id: userId,
              role: "assistant",
              parts: responseMessage.parts as never,
            });
            if (error) console.error("Failed to save assistant message", error.message);
          },
        });
      },
    },
  },
});
