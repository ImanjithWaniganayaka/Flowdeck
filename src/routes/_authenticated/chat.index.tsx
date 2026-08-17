import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { useServerFn } from "@tanstack/react-start";

import { createThread, listThreads } from "@/lib/chat.functions";

export const Route = createFileRoute("/_authenticated/chat/")({
  head: () => ({
    meta: [
      { title: "Copilot — Flowdeck" },
      { name: "description", content: "Chat with your Flowdeck AI copilot about your board." },
      { property: "og:title", content: "Copilot — Flowdeck" },
      { property: "og:description", content: "Chat with your Flowdeck AI copilot." },
    ],
  }),
  component: ChatIndex,
});

function ChatIndex() {
  const navigate = useNavigate();
  const fetchThreads = useServerFn(listThreads);
  const makeThread = useServerFn(createThread);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      const threads = await fetchThreads();
      const first = threads[0];
      const thread = first ?? (await makeThread());
      if (thread) await navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
    })();
  }, [fetchThreads, makeThread, navigate]);

  return (
    <div className="grid min-h-screen place-items-center text-sm text-muted-foreground">
      Opening your copilot…
    </div>
  );
}
