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
5. Publish. The link is the title and the day it was started — `carta-pro-joao-2026-09-10` — or one I type myself

Highlights live inside the markdown itself, as directives:

```md
This has :mark[honestly been one of the best weeks]{c=important} I've had.

:::theme{label="what I actually built"}
A whole block grouped under a theme, with :mark[a highlight]{c=note} inside it.
:::

:::passage
A run of paragraphs grouped into one passage,
one thing the reader arrives at.
:::
```

No table of offsets, no join. The `.md` file carries everything, so fixing a comma doesn't break the highlighting.

That layer is a package of its own, published as [**remark-scanned-page**](https://www.npmjs.com/package/remark-scanned-page):

```bash
npm install remark-scanned-page
```

Its source is in [packages/remark-scanned-page/](packages/remark-scanned-page/), and why it is the way it is is in [docs/features/markdown-hightlight/](docs/features/markdown-hightlight/).

## Reading a letter

On a wide screen the photograph of each sheet pins itself while its transcription scrolls past, and the sheets stack down the page in the order they were written. The bar at the top says who it is for: *from anna to you*, or to whoever I wrote it to.

On a phone there is one column, so nothing pins and nothing zooms: the photograph opens first and one tap gets you the transcription. Both halves are in the HTML either way — which half is on screen is a CSS decision, never something that depends on JavaScript having run.

Everything the reading view adds is an enhancement over a page that already works: the transcription is rendered on the server, and the highlights are painted with no script.

## Stack

| Layer | Tech |
| --- | --- |
| Framework | Next.js 16 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + entrepta tokens |
| Design system | entrepta (julia), run in light mode |
| Markdown | unified, remark-parse, remark-directive, remark-rehype, rehype-sanitize |
| Database | Postgres (Neon) via Drizzle ORM |
| File storage | Vercel Blob |
| Transcription | OpenRouter, vision model |
| Auth | Clerk |
| OG images | `next/og` |
| Deploy | Vercel |

## Continuous integration

Two workflows, in [.github/workflows/](.github/workflows/).

**CI** runs lint, typecheck, tests and a build on every push to `main` and every pull request. It needs no secrets: every value this app reads is looked up at request time, so `next build` needs none of them — and a CI that needed the production database to compile is a CI nobody can run from a fork.

**Release** runs only when `packages/remark-scanned-page/` changes. It reads the version out of the package's own `package.json`, does nothing if that version is already on npm, and otherwise packs the tarball, **installs it into an empty project and runs it**, then publishes and tags.

That install step is the point. It is the only check that can catch what broke this package twice before its first release — `publishConfig` never rewrote the entry points, and ESM relative imports had no `.js` extension. Next, Turbopack and vitest all resolve what Node refuses, so neither failure was visible from inside the repository.

Publishing uses npm [trusted publishing](https://docs.npmjs.com/trusted-publishers), so there is no `NPM_TOKEN` in the repository — the job mints a short-lived credential through OIDC.

### The lockfile is generated on Linux

npm prunes the transitive dependencies of optional packages that do not apply to the machine it ran on. A lockfile written on a Mac is therefore missing entries `npm ci` needs on a runner, and the error it gives — `Missing: @emnapi/runtime from lock file` — advises running `npm install`, which is exactly what caused it.

So after adding or updating a dependency:

```bash
docker run --rm --platform linux/amd64 -v "$PWD":/w -w /w node:22 \
  npm install --package-lock-only --no-audit --no-fund
```

It only ever adds: nothing already resolved changes version, and `npm ci` then works on both platforms.

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

# Where "write back" at the end of a letter goes. Empty hides the button.
WRITE_BACK_EMAIL=
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
