# DesignOS — AI Creative Generator

Generate on-brand creatives instantly with AI.

## Stack
- Next.js 14 (App Router)
- Anthropic Claude (copy + vision)
- Pollinations.ai (free image gen)
- Supabase (history + brand library)
- Tailwind CSS

## Deploy to Vercel

1. Push this repo to GitHub
2. Go to vercel.com → Import repository
3. Add Environment Variables:
   - ANTHROPIC_API_KEY
   - NEXT_PUBLIC_SUPABASE_URL
   - NEXT_PUBLIC_SUPABASE_ANON_KEY
4. Deploy

## Supabase Table

```sql
create table generations (
  id uuid default gen_random_uuid() primary key,
  creative_type text,
  width integer,
  height integer,
  prompt text,
  image_url text,
  headline text,
  subheading text,
  cta text,
  colors jsonb,
  starred boolean default false,
  created_at timestamp with time zone default now()
);
alter table generations enable row level security;
create policy "open_insert" on generations for insert with check (true);
create policy "open_select" on generations for select using (true);
create policy "open_update" on generations for update using (true);
```
