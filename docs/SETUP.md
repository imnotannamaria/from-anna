# Setup

The accounts and keys a fresh clone needs, in the order that matters. Every variable is listed, with a comment, in [`.env.example`](../.env.example).

Step 2 comes before any model call.

---

## 1. An OpenRouter key

1. Create an account at https://openrouter.ai
2. Go to https://openrouter.ai/settings/keys
3. **Create Key** and copy it. It is shown once.

## 2. Privacy, before the first call

https://openrouter.ai/settings/privacy → **Data Training**

Turn all four switches **off**:

| Switch | Why |
| --- | --- |
| Allow paid endpoints that train on request data | a paid provider that trains on what you send |
| Allow free endpoints that train on request data | **on by default**, and the main leak |
| Allow free endpoints that publish prompts | would publish requests in a public dataset |
| Allow 1% data discount in workspaces | would hand the inputs to OpenRouter itself |

What goes to the provider is a photograph of a personal letter. Training is not reversible: once the text is in a model's weights it does not come back out.

**Zero Data Retention** (the switches at the top of the same page) is about logs, not training. Turning it on for non-frontier models removes many of the cheap multimodal candidates you will want to compare in step 4. Choose the model first, then decide whether to tighten retention.

To confirm, scroll to **Eligibility Preview**: the number of available models drops after the free-endpoint switch is off, and the `(free)` models that train disappear.

The code also sends `provider.data_collection: "deny"` and `allow_fallbacks: false` on every request. The account setting is the first lock and cannot be skipped; the request field is the second.

## 3. Credits

The free tier (no card) routes to `:free` models, and those are free because they train on the data. With training switched off, OpenRouter stops routing to them, so a small top-up is needed. At a fraction of a cent per page, $10 lasts a very long time.

## 4. Choosing the model

Do not choose by price. The difference between candidates is a fraction of a cent per page; the difference in reading cursive is large.

1. Photograph three real pages in your own handwriting, one of them written in a hurry.
2. Find candidates at https://openrouter.ai/models with **two** filters: `Input modalities → Image` in the left column, and the **Text** tab at the top.

   The tabs at the top (`Text | Image | Video`) filter the **output**. Image input plus the Image tab lists image generators, which take a photo and return another image. On a model's page, the **Modalities** block has to end in `→ T`.
3. Run the three pages through each candidate with the same prompt.
4. Count the words that needed correcting, and choose by that number.

`no endpoints found that support image input` means the model is text-only. The transcription route reports it with the model's name.

## 5. The database (Neon)

1. Create a project at https://neon.tech
2. Copy the **pooled** connection string into `DATABASE_URL`.

## 6. Photo storage (Vercel Blob)

1. In the Vercel project: **Storage → Create → Blob**, and make the store **private**.
2. Copy `BLOB_READ_WRITE_TOKEN`.

It has to be private because the photo is the letter. A public URL would keep working after the letter is unpublished or expires. Photos are served through `/api/letters/[id]/pages/[index]`, which checks the letter first.

## 7. Sign-in (Clerk)

1. Create an application at https://clerk.com and copy the two keys.
2. Sign in once at `/admin/sign-in`, then copy your user id (it starts with `user_`) from the Clerk dashboard into `ADMIN_USER_IDS`.

Signing in is not being allowed in: an empty `ADMIN_USER_IDS` denies everyone. A development instance and a production one issue different ids, so the variable is set in both places.

Before Clerk exists, `DEV_ADMIN_BYPASS=1` opens `/admin` locally. It is never read in a production build.

## 8. Environment and migration

```bash
cp .env.example .env.local
npm run db:migrate
```

`drizzle-kit migrate` uses Neon's serverless driver. Pointed at anything other than a hosted Neon database it **exits 0 without applying anything**, so check that the tables exist:

```bash
npm run db:studio
```

## 9. Run it

```bash
npm run dev
```

Open http://localhost:3000/admin/sign-in, start a letter, add its photographs and transcribe.

---

## Checklist

- [ ] OpenRouter key created
- [ ] **Training switched off for paid and free endpoints, before any call**
- [ ] Model chosen by counting corrected words on three real pages
- [ ] Neon database created, pooled string copied
- [ ] Private Blob store created
- [ ] Clerk keys set, and your user id in `ADMIN_USER_IDS`
- [ ] `.env.local` filled in
- [ ] Migration run, **and checked in the studio**
