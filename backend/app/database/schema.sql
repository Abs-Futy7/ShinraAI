-- 1) Runs: one row per PRD→Blog execution
create table if not exists public.runs (
  id uuid primary key,
  user_id uuid null,
  status text not null default 'PENDING',
  inputs jsonb not null,
  model_provider text,
  model_name text,
  use_web_search boolean default false,
  started_at timestamptz,
  finished_at timestamptz,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Steps: one row per agent step (and iteration)
create table if not exists public.run_steps (
  id bigserial primary key,
  run_id uuid references public.runs(id) on delete cascade,
  step_name text not null,          -- researcher|writer|fact_checker|style_editor|...
  iteration int not null default 1,
  status text not null default 'RUNNING',
  input jsonb,
  output jsonb,
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  latency_ms int
);

-- 3) LLM call metrics (tokens, model, latency)
create table if not exists public.llm_calls (
  id bigserial primary key,
  run_id uuid references public.runs(id) on delete cascade,
  step_name text not null,
  model_provider text,
  model_name text,
  prompt_tokens int,
  completion_tokens int,
  total_tokens int,
  latency_ms int,
  created_at timestamptz not null default now(),
  error text
);

-- 4) Logs (for timeline + debugging)
create table if not exists public.run_logs (
  id bigserial primary key,
  run_id uuid references public.runs(id) on delete cascade,
  level text not null default 'info',
  message text not null,
  ts timestamptz not null default now()
);

-- 5) Rubric scores (quality gate after style polish)
create table if not exists public.run_rubrics (
  run_id uuid primary key references public.runs(id) on delete cascade,
  clarity_score numeric(4,2) not null,
  correctness_score numeric(4,2) not null,
  completeness_score numeric(4,2) not null,
  overall_score numeric(4,2) not null,
  passed boolean not null default false,
  review_required boolean not null default false,
  attempts int not null default 1,
  thresholds jsonb not null default '{}'::jsonb,
  summary jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_run_steps_run_id on public.run_steps(run_id);
create index if not exists idx_llm_calls_run_id on public.llm_calls(run_id);
create index if not exists idx_run_logs_run_id on public.run_logs(run_id);
create index if not exists idx_run_rubrics_passed on public.run_rubrics(passed);
