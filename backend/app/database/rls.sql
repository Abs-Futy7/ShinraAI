-- Supabase Auth ownership + RLS policies for Shinrai.
-- Run this in Supabase SQL Editor after schema.sql.

-- Step 1: Ensure owner column exists on parent table.
alter table public.runs
  add column if not exists user_id uuid;

create index if not exists idx_runs_user_id on public.runs(user_id);

-- Step 2: Enable RLS on parent + child tables.
alter table public.runs enable row level security;
alter table public.run_steps enable row level security;
alter table public.run_logs enable row level security;
alter table public.llm_calls enable row level security;
alter table public.run_rubrics enable row level security;

-- Parent table policies.
drop policy if exists runs_select_own on public.runs;
drop policy if exists runs_insert_own on public.runs;
drop policy if exists runs_update_own on public.runs;
drop policy if exists runs_delete_own on public.runs;

create policy runs_select_own
on public.runs
for select
to authenticated
using (auth.uid() = user_id);

create policy runs_insert_own
on public.runs
for insert
to authenticated
with check (auth.uid() = user_id);

create policy runs_update_own
on public.runs
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy runs_delete_own
on public.runs
for delete
to authenticated
using (auth.uid() = user_id);

-- Child table policies: access only rows whose parent run belongs to auth.uid().
drop policy if exists run_steps_select_own on public.run_steps;
drop policy if exists run_steps_insert_own on public.run_steps;
drop policy if exists run_steps_update_own on public.run_steps;
drop policy if exists run_steps_delete_own on public.run_steps;

create policy run_steps_select_own
on public.run_steps
for select
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = run_steps.run_id
      and r.user_id = auth.uid()
  )
);

create policy run_steps_insert_own
on public.run_steps
for insert
to authenticated
with check (
  exists (
    select 1
    from public.runs r
    where r.id = run_steps.run_id
      and r.user_id = auth.uid()
  )
);

create policy run_steps_update_own
on public.run_steps
for update
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = run_steps.run_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.runs r
    where r.id = run_steps.run_id
      and r.user_id = auth.uid()
  )
);

create policy run_steps_delete_own
on public.run_steps
for delete
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = run_steps.run_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists run_logs_select_own on public.run_logs;
drop policy if exists run_logs_insert_own on public.run_logs;
drop policy if exists run_logs_update_own on public.run_logs;
drop policy if exists run_logs_delete_own on public.run_logs;

create policy run_logs_select_own
on public.run_logs
for select
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = run_logs.run_id
      and r.user_id = auth.uid()
  )
);

create policy run_logs_insert_own
on public.run_logs
for insert
to authenticated
with check (
  exists (
    select 1
    from public.runs r
    where r.id = run_logs.run_id
      and r.user_id = auth.uid()
  )
);

create policy run_logs_update_own
on public.run_logs
for update
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = run_logs.run_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.runs r
    where r.id = run_logs.run_id
      and r.user_id = auth.uid()
  )
);

create policy run_logs_delete_own
on public.run_logs
for delete
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = run_logs.run_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists llm_calls_select_own on public.llm_calls;
drop policy if exists llm_calls_insert_own on public.llm_calls;
drop policy if exists llm_calls_update_own on public.llm_calls;
drop policy if exists llm_calls_delete_own on public.llm_calls;

create policy llm_calls_select_own
on public.llm_calls
for select
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = llm_calls.run_id
      and r.user_id = auth.uid()
  )
);

create policy llm_calls_insert_own
on public.llm_calls
for insert
to authenticated
with check (
  exists (
    select 1
    from public.runs r
    where r.id = llm_calls.run_id
      and r.user_id = auth.uid()
  )
);

create policy llm_calls_update_own
on public.llm_calls
for update
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = llm_calls.run_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.runs r
    where r.id = llm_calls.run_id
      and r.user_id = auth.uid()
  )
);

create policy llm_calls_delete_own
on public.llm_calls
for delete
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = llm_calls.run_id
      and r.user_id = auth.uid()
  )
);

drop policy if exists run_rubrics_select_own on public.run_rubrics;
drop policy if exists run_rubrics_insert_own on public.run_rubrics;
drop policy if exists run_rubrics_update_own on public.run_rubrics;
drop policy if exists run_rubrics_delete_own on public.run_rubrics;

create policy run_rubrics_select_own
on public.run_rubrics
for select
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = run_rubrics.run_id
      and r.user_id = auth.uid()
  )
);

create policy run_rubrics_insert_own
on public.run_rubrics
for insert
to authenticated
with check (
  exists (
    select 1
    from public.runs r
    where r.id = run_rubrics.run_id
      and r.user_id = auth.uid()
  )
);

create policy run_rubrics_update_own
on public.run_rubrics
for update
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = run_rubrics.run_id
      and r.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.runs r
    where r.id = run_rubrics.run_id
      and r.user_id = auth.uid()
  )
);

create policy run_rubrics_delete_own
on public.run_rubrics
for delete
to authenticated
using (
  exists (
    select 1
    from public.runs r
    where r.id = run_rubrics.run_id
      and r.user_id = auth.uid()
  )
);

