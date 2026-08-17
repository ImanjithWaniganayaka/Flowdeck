import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { Plus, Trash2, MessageCircle } from "lucide-react";
import { toast } from "sonner";

import { AppShell } from "@/components/app-shell";
import { supabase } from "@/integrations/supabase/client";
import { createThread, deleteThread, getThread, listThreads } from "@/lib/chat.functions";
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputSubmit,
  PromptInputFooter,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from "@/components/ai-elements/tool";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Copilot — Flowdeck" },
      { name: "description", content: "Chat with your Flowdeck AI copilot about your board." },
      { property: "og:title", content: "Copilot — Flowdeck" },
      { property: "og:description", content: "Chat with your Flowdeck AI copilot." },
    ],
  }),
  component: ChatPage,
});

const transport = new DefaultChatTransport({
  api: "/api/chat",
  fetch: async (url, options) => {
    const { data } = await supabase.auth.getSession();
    const headers = new Headers(options?.headers as HeadersInit);
    if (data.session) headers.set("Authorization", `Bearer ${data.session.access_token}`);
    return fetch(url, { ...options, headers });
  },
});

function ChatPage() {
  const { threadId } = Route.useParams();
  const context = Route.useRouteContext();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const fetchThreads = useServerFn(listThreads);
  const fetchThread = useServerFn(getThread);
  const makeThread = useServerFn(createThread);
  const removeThread = useServerFn(deleteThread);

  const threadsQuery = useQuery({ queryKey: ["threads"], queryFn: () => fetchThreads() });
  const threadQuery = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => fetchThread({ data: { id: threadId } }),
  });

  const initialMessages = useMemo<UIMessage[]>(() => {
    const rows = threadQuery.data?.messages ?? [];
    return rows.map((row) => ({
      id: row.id,
      role: row.role,
      parts: JSON.parse(row.parts) as UIMessage["parts"],
    }));
  }, [threadQuery.data]);

  if (threadQuery.isSuccess && threadQuery.data === null) {
    void navigate({ to: "/chat" });
  }

  return (
    <AppShell active="chat" email={context.user.email}>
      <div className="flex h-screen">
        <div className="hidden w-64 shrink-0 flex-col border-r border-border p-4 md:flex">
          <Button
            className="w-full gap-2"
            onClick={async () => {
              const thread = await makeThread();
              await queryClient.invalidateQueries({ queryKey: ["threads"] });
              await navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
            }}
          >
            <Plus className="size-4" />
            New chat
          </Button>

          <div className="mt-4 min-h-0 flex-1 space-y-1 overflow-y-auto">
            {(threadsQuery.data ?? []).map((thread) => (
              <div
                key={thread.id}
                className={cn(
                  "group flex items-center gap-1 rounded-2xl px-2 transition-colors",
                  thread.id === threadId ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: thread.id }}
                  className="min-w-0 flex-1 truncate py-2 text-sm text-foreground"
                >
                  {thread.title}
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Delete chat"
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                  onClick={async () => {
                    await removeThread({ data: { id: thread.id } });
                    await queryClient.invalidateQueries({ queryKey: ["threads"] });
                    if (thread.id === threadId) await navigate({ to: "/chat" });
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {threadQuery.isLoading ? (
          <div className="grid flex-1 place-items-center text-sm text-muted-foreground">
            Loading conversation…
          </div>
        ) : (
          <ChatWindow key={threadId} threadId={threadId} initialMessages={initialMessages} />
        )}
      </div>
    </AppShell>
  );
}

function ChatWindow({
  threadId,
  initialMessages,
}: {
  threadId: string;
  initialMessages: UIMessage[];
}) {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const queryClient = useQueryClient();

  const { messages, sendMessage, status } = useChat({
    id: threadId,
    messages: initialMessages,
    transport,
    onError: (error) => toast.error(error.message || "The copilot hit an error"),
    onFinish: () => {
      void queryClient.invalidateQueries({ queryKey: ["cards"] });
      void queryClient.invalidateQueries({ queryKey: ["threads"] });
      inputRef.current?.focus();
    },
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, [threadId]);

  const busy = status === "submitted" || status === "streaming";

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text }, { body: { threadId } });
    inputRef.current?.focus();
  };

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl">
          {messages.length === 0 ? (
            <div className="mx-auto max-w-md py-20 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-3xl bg-primary text-primary-foreground">
                <MessageCircle className="size-5" />
              </span>
              <h1 className="mt-4 font-display text-xl font-semibold text-foreground">
                Flowdeck Copilot
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Ask what's overdue, get a plan for the week, or say "add a task to review the
                landing page by Friday".
              </p>
            </div>
          ) : null}

          {messages.map((message) => (
            <Message from={message.role} key={message.id}>
              <MessageContent>
                {message.parts.map((part, index) => {
                  if (part.type === "text") {
                    return (
                      <MessageResponse key={index}>{part.text}</MessageResponse>
                    );
                  }
                  if (part.type.startsWith("tool-")) {
                    const toolPart = part as unknown as {
                      type: string;
                      state: "input-streaming" | "input-available" | "output-available" | "output-error";
                      input?: unknown;
                      output?: unknown;
                      errorText?: string;
                    };
                    return (
                      <Tool key={index} defaultOpen={false}>
                        <ToolHeader type={toolPart.type as `tool-${string}`} state={toolPart.state} />
                        <ToolContent>
                          <ToolInput input={toolPart.input} />
                          <ToolOutput
                            output={
                              toolPart.output ? (
                                <pre className="overflow-x-auto text-xs">
                                  {JSON.stringify(toolPart.output, null, 2)}
                                </pre>
                              ) : undefined
                            }
                            errorText={toolPart.errorText}
                          />
                        </ToolContent>
                      </Tool>
                    );
                  }
                  return null;
                })}
              </MessageContent>
            </Message>
          ))}

          {status === "submitted" ? <Shimmer>Thinking…</Shimmer> : null}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="mx-auto w-full max-w-3xl p-4">
        <PromptInput onSubmit={submit}>
          <PromptInputTextarea
            ref={inputRef}
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about your board or create a task…"
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit status={status} disabled={!input.trim() || busy} />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
