# Gantt Planner — Deployment Guide

## Step 1 — Database (Supabase)

1. Go to https://supabase.com and log in (or create a free account)
2. Click **New project** → name it (e.g. "gantt-planner") → choose EU West region
3. Go to **SQL Editor** in the left panel
4. Paste the entire contents of `supabase_schema.sql` and click **Run**
5. Go to **Project Settings → API**
6. Copy:
   - **Project URL** → this is `VITE_SUPABASE_URL`
   - **anon public** key → this is `VITE_SUPABASE_ANON_KEY`

## Step 2 — Hosting (Vercel — same account, new project)

1. Go to https://vercel.com and log in
2. Click **Add New → Project**
3. Push this repo to GitHub first if you haven't:
   ```bash
   git init
   git add .
   git commit -m "init"
   gh repo create gantt-planner --public --push
   ```
4. Import the repository from GitHub in Vercel
5. Set **Root Directory** to `gantt-app` (important — the app lives in a subdirectory)
6. Add **Environment Variables**:
   - `VITE_SUPABASE_URL` = value from Step 1
   - `VITE_SUPABASE_ANON_KEY` = value from Step 1
7. Click **Deploy**

The free Vercel plan supports unlimited projects.

## Workspace access

On first load the app generates a unique `workspace_id` stored in localStorage.
Use **Share link** in the toolbar to copy your workspace URL.
Anyone with the link has full access — keep it private.

## Local development

```bash
cp .env.example .env
# fill in your Supabase values
npm install
npm run dev
```
