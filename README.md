# from anna

Handwritten letters, published on the web.

You write a letter by hand in a notebook, photograph the pages, and the site turns them into a page with the photo on one side and a real, readable transcription on the other. Passages can be highlighted in colour and grouped under themes, and each letter gets its own link.

The photo is the visual layer. The transcription is the content, which means the letter still works for a screen reader, for search, and for anyone whose images didn't load.

> Early days. The docs are ahead of the code — see [docs/](docs/).

## Why

I got a notebook and realised it had been a long time since I'd written anything by hand. With AI in the middle of how most things get made now, a handwritten letter means more than it used to. The long version is in [docs/GOAL.md](docs/GOAL.md).

The project is also an excuse to use things I hadn't used before: OpenRouter for the transcription, Neon for the database, Vercel Blob for the photos.

## How it works

```
Photograph the page  →  Transcribe  →  Edit and highlight  →  Publish  →  Link per recipient
```

1. Write the letter by hand and photograph each page
2. Upload the photos; they're resized and compressed in the browser before they leave it
3. Press transcribe — a vision model returns markdown, one block per page
4. Fix the transcription against the photo and mark the passages worth reading first
5. Publish, which generates a readable but unguessable slug

Highlights live inside the markdown itself, as directives:

```md
This has :mark[honestly been one of the best weeks]{c=important} I've had.

:::theme{label="what I actually built"}
A whole block grouped under a theme, with :mark[a highlight]{c=note} inside it.
:::
```

No table of offsets, no join. The `.md` file carries everything, so fixing a comma doesn't break the highlighting. That layer is being extracted into a standalone package — see [docs/features/markdown-hightlight/](docs/features/markdown-hightlight/).

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + entrepta tokens |
| Design system | entrepta, dark first |
| Markdown | unified, remark-parse, remark-directive, remark-rehype, rehype-sanitize |
| Database | Postgres (Neon) via Drizzle ORM |
| File storage | Vercel Blob |
| Transcription | OpenRouter, vision model |
| Auth | Clerk |
| OG images | `next/og` |
| Deploy | Vercel |

## Getting started

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

### Environment variables

```bash
# Postgres (Neon)
DATABASE_URL=

# Vercel Blob, for the page photos
BLOB_READ_WRITE_TOKEN=

# OpenRouter, for transcription
OPENROUTER_API_KEY=
OPENROUTER_MODEL=

# Clerk, guards /admin
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Base URL, used for OG images
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Before your first OpenRouter call

Turn on the account setting that **restricts routing to providers that don't train on your input and output**. Several free models say in their own description that prompts may be used for training, and the thing you're sending is a photograph of a personal letter.

Also set `provider: { allow_fallbacks: false }` on the request. Transcription should be reproducible, and silently landing on a different provider makes it not.

## Choosing a transcription model

Recognising cursive is the expensive part of the pipeline, and the models differ a lot. Don't pick from a pricing table — at this volume the cost difference is fractions of a cent.

Run three real pages, including one written in a hurry, through the candidates on the same prompt. Count the words that needed correcting. Pick by that number.

The prompt is deliberately restrictive: plain markdown, keep paragraph breaks, mark illegible passages as `[?]`, don't invent words, separate pages with `---`. Hallucination is the dangerous failure here, because it comes back plausible and a quick reread won't catch it. **Checking the transcription against the photo is a required step, not an optional one.**

## Docs

| Doc | What's in it |
| --- | --- |
| [docs/README.md](docs/README.md) | Index, and the original board |
| [docs/GOAL.md](docs/GOAL.md) | Why the project exists |
| [docs/features/photo-transcription/](docs/features/photo-transcription/) | Upload, image processing, the model call |
| [docs/features/markdown-hightlight/](docs/features/markdown-hightlight/) | The directive syntax, the package |
| [docs/features/share/](docs/features/share/) | Publishing, slugs, the reading page, analytics |

Each feature folder holds a `DECISIONS.md` (X because Y) and an `IMPLEMENTATION.md` (phases, each with a done-when list and checks).

Conventions for writing code here are in [CLAUDE.md](CLAUDE.md).

## Licence

MIT.
