# Kanban Board with AI Assistant

A polished, interactive Kanban board in the style of the reference dashboards: soft light surfaces, rounded cards, colored category pills, generous whitespace, a left icon rail, and a right-side insight panel.

## Board

- Four columns: To Do, In Progress, Review, Done. Each shows a count and an inline "add card" button.
- Cards: title, description, due date, time estimate, category tag (colored pill).
- Drag and drop cards between and within columns, with a lift/tilt effect on grab and smooth settle on drop, matching the dragged-card look in the reference.
- Click a card to open a detail panel for editing all fields, or delete it.
- Overdue and due-soon dates are visually flagged.
- Right panel: totals per column, completion ring, overdue count, upcoming due dates.

## Accounts and saving

- Email/password sign-in, plus Google sign-in.
- Every board change saves automatically to your account, so it's there when you come back on any device.
- Each person only ever sees their own board and chats.

## AI assistant

- Chat panel with multiple conversations: a thread list, a "New chat" action, and each thread on its own URL you can revisit and reload.
- The assistant can read your board and act on it: create tasks, move cards between columns, and update fields — asked in plain language ("add a landing page task due Friday", "move Discovery Call to Review").
- It answers questions about your work: what's overdue, what's due this week, a summary of progress, and productivity insights.
- Streams its reply as it types, with tool activity shown inline (collapsed by default) so you can see what it changed.
- Board updates from chat appear on the board immediately.

## Design direction

Light lavender/indigo palette on off-white, single accent for primary actions, pastel per-category tag colors, soft shadows, pill buttons, rounded 16px+ cards. Motion is restrained: hover lift on cards, animated progress ring and bars, smooth column reflow.

## Technical notes

- Lovable Cloud (Postgres + auth) with tables for `cards`, `chat_threads`, `chat_messages`; RLS scoping every row to `auth.uid()`, plus explicit grants.
- Card ordering via a per-column `position` value updated on drop.
- Board reads/writes through authenticated server functions under the protected route layout; TanStack Query for cache and optimistic drag updates.
- AI chat via a streaming server route on the Lovable AI gateway, with tool calling for create/move/update card and board-query tools. AI Elements for the transcript, composer, and tool rendering. Threads live at `/chat/$threadId` with messages persisted per thread.
- Drag and drop with `@dnd-kit`.
