# Flowza

A drag-and-drop Kanban board with a built-in AI copilot. Plan your work across **To Do → In Progress → Review → Done**, and just tell the AI what to add, move, or update instead of clicking through forms.

## Features

- **Drag-and-drop board** — four columns (To Do, In Progress, Review, Done) built with `@dnd-kit`, with smooth reordering and column-to-column moves.
- **Confetti on completion** — dropping a task into Done triggers a little celebration.
- **AI Copilot chat** — a threaded chat assistant that can read your board and act on it:
  - `list_cards` — see everything on the board, including due dates and overdue items
  - `create_card` — add a new task to any column
  - `update_card` — edit title, description, due date, time estimate, or category on an existing card
  - `move_card` — move a card to a different column (e.g. mark it Done)
  - `delete_card` — remove a card
- **Task metadata** — category tags, due dates, and time estimates per card.
- **Auth** — email/password and Google sign-in via Supabase, using [Lovable Cloud](https://lovable.dev) as the backend.
- **Vibrant, colorful UI** — each column has its own accent color, and cards get a matching accent stripe.

## Tech stack

| Layer       | Tech                                                                           |
| ----------- | ------------------------------------------------------------------------------- |
| Framework   | [TanStack Start](https://tanstack.com/start) (React, file-based routing, SSR)  |
| Build tool  | Vite                                                                             |
| Styling     | Tailwind CSS + shadcn/ui (Radix primitives)                                     |
| Drag & drop | `@dnd-kit`                                                                       |
| Backend     | Supabase (Postgres, Auth) via Lovable Cloud                                     |
| AI          | Vercel AI SDK (`ai`, `@ai-sdk/react`), Google Gemini                            |
| State/data  | TanStack Query                                                                   |

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

Copy the example below into a `.env` file in the project root (or edit the one already there):

```dotenv
# Supabase — your Lovable Cloud project's connection details
SUPABASE_PROJECT_ID="your-project-id"
SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
SUPABASE_URL="https://your-project-id.supabase.co"

# Same values, exposed to the client build (Vite requires the VITE_ prefix)
VITE_SUPABASE_PROJECT_ID="your-project-id"
VITE_SUPABASE_PUBLISHABLE_KEY="your-publishable-key"
VITE_SUPABASE_URL="https://your-project-id.supabase.co"

# AI Copilot — pick ONE of the two below
LOVABLE_API_KEY=""     # only works when hosted on Lovable Cloud itself
GEMINI_API_KEY=""      # for local dev — get a free key at https://aistudio.google.com/apikey
```

> **Note on the AI key:** `LOVABLE_API_KEY` is auto-provisioned by Lovable and only works when the app is running on Lovable's own hosting — it can't be copied out and reused locally. For local development, get a free `GEMINI_API_KEY` instead; the app automatically falls back to it when `LOVABLE_API_KEY` isn't set.

### 3. Run the dev server

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) (or whatever port Vite prints) and sign in.

### 4. Build for production

```bash
npm run build
npm run preview   # to test the production build locally
```

## Project structure

```
src/
├── components/
│   ├── board/              # BoardColumn, CardFace/SortableCard, CardDialog
│   ├── ai-elements/         # Chat UI primitives (Conversation, Message, Tool, PromptInput)
│   ├── ui/                   # shadcn/ui components
│   └── app-shell.tsx          # Sidebar/nav layout
├── integrations/
│   └── supabase/               # Generated Supabase client + types
├── lib/
│   ├── board.ts                  # Column/category definitions, formatting helpers
│   ├── board.functions.ts        # Server functions for CRUD on cards
│   ├── chat.functions.ts         # Server functions for chat threads
│   ├── ai-gateway.server.ts      # Lovable Gateway + Gemini provider setup
│   ├── confetti.ts                # Canvas confetti effect
│   └── supabase-request.server.ts # Auth helper for API routes
└── routes/
    ├── index.tsx                  # Landing page
    ├── auth.tsx                    # Sign in / sign up
    ├── api/chat.ts                  # AI Copilot streaming endpoint + tools
    └── _authenticated/
        ├── board.tsx                # The Kanban board
        └── chat.$threadId.tsx       # Copilot chat UI
```

## How the AI Copilot works

Every message goes to `/api/chat`, which streams a response from Gemini using the [Vercel AI SDK](https://sdk.vercel.ai/). The model has direct access to five tools that read and write your Supabase `cards` table, so it can act on your board rather than just describe what to do. Conversations and messages are persisted per-user in `chat_threads` / `chat_messages`.

## License

Personal project — no license specified.
