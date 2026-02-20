"""Postgres repository for pipeline runs, steps, logs, and metrics."""
from __future__ import annotations

import json
from typing import Any, Optional

from app.db import pool


def _to_jsonb(value: Any) -> Optional[str]:
    if value is None:
        return None
    return json.dumps(value)


class RunRepo:
    async def create_run(
        self,
        run_id: str,
        inputs: dict[str, Any],
        user_id: Optional[str],
        model_provider: Optional[str],
        model_name: Optional[str],
        use_web_search: bool,
    ) -> None:
        q = """
        insert into public.runs
        (id, user_id, status, inputs, model_provider, model_name, use_web_search, created_at, updated_at)
        values ($1::uuid, $2::uuid, 'PENDING', $3::jsonb, $4, $5, $6, now(), now())
        """
        await pool().execute(
            q,
            run_id,
            user_id,
            _to_jsonb(inputs),
            model_provider,
            model_name,
            use_web_search,
        )

    async def set_status(self, run_id: str, status: str, error: Optional[str] = None) -> None:
        q = """
        update public.runs
        set
            status = $2,
            error = $3,
            updated_at = now(),
            started_at = case
                when $2 = 'RUNNING' and started_at is null then now()
                else started_at
            end,
            finished_at = case
                when $2 in ('DONE', 'DONE_WITH_WARNINGS', 'ERROR') then now()
                else finished_at
            end
        where id = $1::uuid
        """
        await pool().execute(q, run_id, status, error)

    async def step_start(
        self,
        run_id: str,
        step_name: str,
        iteration: int,
        step_input: Optional[dict[str, Any]] = None,
    ) -> int:
        q = """
        insert into public.run_steps (run_id, step_name, iteration, status, input, started_at)
        values ($1::uuid, $2, $3, 'RUNNING', $4::jsonb, now())
        returning id
        """
        row = await pool().fetchrow(q, run_id, step_name, iteration, _to_jsonb(step_input))
        if row is None:
            raise RuntimeError("Failed to create run step row")
        return int(row["id"])

    async def step_end(
        self,
        step_id: int,
        status: str,
        step_output: Optional[dict[str, Any]],
        latency_ms: int,
    ) -> None:
        q = """
        update public.run_steps
        set
            status = $2,
            output = $3::jsonb,
            latency_ms = $4,
            finished_at = now()
        where id = $1
        """
        await pool().execute(q, step_id, status, _to_jsonb(step_output), latency_ms)

    async def log(self, run_id: str, message: str, level: str = "info") -> None:
        q = """
        insert into public.run_logs (run_id, level, message, ts)
        values ($1::uuid, $2, $3, now())
        """
        await pool().execute(q, run_id, level, message)

    async def log_llm_call(
        self,
        run_id: str,
        step_name: str,
        model_provider: Optional[str],
        model_name: Optional[str],
        prompt_tokens: int,
        completion_tokens: int,
        total_tokens: int,
        latency_ms: int,
        error: Optional[str] = None,
    ) -> None:
        q = """
        insert into public.llm_calls
        (run_id, step_name, model_provider, model_name, prompt_tokens, completion_tokens, total_tokens, latency_ms, error)
        values ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9)
        """
        await pool().execute(
            q,
            run_id,
            step_name,
            model_provider,
            model_name,
            prompt_tokens,
            completion_tokens,
            total_tokens,
            latency_ms,
            error,
        )

    async def save_rubric(
        self,
        run_id: str,
        clarity_score: float,
        correctness_score: float,
        completeness_score: float,
        overall_score: float,
        passed: bool,
        review_required: bool,
        attempts: int,
        thresholds: dict[str, Any],
        summary: dict[str, Any],
    ) -> None:
        q = """
        insert into public.run_rubrics
        (run_id, clarity_score, correctness_score, completeness_score, overall_score, passed, review_required, attempts, thresholds, summary, created_at, updated_at)
        values ($1::uuid, $2, $3, $4, $5, $6, $7, $8, $9::jsonb, $10::jsonb, now(), now())
        on conflict (run_id) do update set
            clarity_score = excluded.clarity_score,
            correctness_score = excluded.correctness_score,
            completeness_score = excluded.completeness_score,
            overall_score = excluded.overall_score,
            passed = excluded.passed,
            review_required = excluded.review_required,
            attempts = excluded.attempts,
            thresholds = excluded.thresholds,
            summary = excluded.summary,
            updated_at = now()
        """
        await pool().execute(
            q,
            run_id,
            clarity_score,
            correctness_score,
            completeness_score,
            overall_score,
            passed,
            review_required,
            attempts,
            _to_jsonb(thresholds),
            _to_jsonb(summary),
        )

    async def metrics_summary(self, user_id: Optional[str] = None) -> dict[str, Any]:
        if user_id is None:
            q1 = """
        select
            count(*) as total_runs,
            count(*) filter (where status in ('DONE', 'DONE_WITH_WARNINGS')) as completed_runs,
            round(avg(extract(epoch from (finished_at - started_at))) * 1000)::int as avg_duration_ms
        from public.runs
        """
            row = await pool().fetchrow(q1)

            q_llm = """
        select
            coalesce(sum(prompt_tokens), 0)::bigint as prompt_tokens,
            coalesce(sum(completion_tokens), 0)::bigint as completion_tokens,
            coalesce(sum(total_tokens), 0)::bigint as total_tokens,
            round(avg(latency_ms))::int as avg_llm_latency_ms
        from public.llm_calls
        """
            llm_row = await pool().fetchrow(q_llm)

            q_rubric = """
        select
            round(avg(overall_score), 2) as rubric_avg_overall,
            count(*)::int as rubric_scored_runs,
            count(*) filter (where passed)::int as rubric_passed_runs,
            round(100.0 * count(*) filter (where passed) / nullif(count(*), 0), 1) as rubric_pass_rate
        from public.run_rubrics
        """
            rubric_row = await pool().fetchrow(q_rubric)

            q2 = """
        select
            date_trunc('day', created_at) as day,
            count(*) as runs,
            count(*) filter (where status = 'ERROR') as errors
        from public.runs
        where created_at > now() - interval '14 days'
        group by 1
        order by 1
        """
            rows = await pool().fetch(q2)
        else:
            q1 = """
        select
            count(*) as total_runs,
            count(*) filter (where status in ('DONE', 'DONE_WITH_WARNINGS')) as completed_runs,
            round(avg(extract(epoch from (finished_at - started_at))) * 1000)::int as avg_duration_ms
        from public.runs
        where user_id = $1::uuid
        """
            row = await pool().fetchrow(q1, user_id)

            q_llm = """
        select
            coalesce(sum(c.prompt_tokens), 0)::bigint as prompt_tokens,
            coalesce(sum(c.completion_tokens), 0)::bigint as completion_tokens,
            coalesce(sum(c.total_tokens), 0)::bigint as total_tokens,
            round(avg(c.latency_ms))::int as avg_llm_latency_ms
        from public.llm_calls c
        join public.runs r on r.id = c.run_id
        where r.user_id = $1::uuid
        """
            llm_row = await pool().fetchrow(q_llm, user_id)

            q_rubric = """
        select
            round(avg(rr.overall_score), 2) as rubric_avg_overall,
            count(*)::int as rubric_scored_runs,
            count(*) filter (where rr.passed)::int as rubric_passed_runs,
            round(100.0 * count(*) filter (where rr.passed) / nullif(count(*), 0), 1) as rubric_pass_rate
        from public.run_rubrics rr
        join public.runs r on r.id = rr.run_id
        where r.user_id = $1::uuid
        """
            rubric_row = await pool().fetchrow(q_rubric, user_id)

            q2 = """
        select
            date_trunc('day', created_at) as day,
            count(*) as runs,
            count(*) filter (where status = 'ERROR') as errors
        from public.runs
        where created_at > now() - interval '14 days'
          and user_id = $1::uuid
        group by 1
        order by 1
        """
            rows = await pool().fetch(q2, user_id)

        headline = dict(row) if row is not None else {}
        if llm_row is not None:
            headline.update(dict(llm_row))
        if rubric_row is not None:
            headline.update(dict(rubric_row))

        return {"headline": headline, "daily": [dict(r) for r in rows]}

    async def metrics_runs(self, limit: int = 50, user_id: Optional[str] = None) -> list[dict[str, Any]]:
        q = """
        select
            r.id,
            r.status,
            r.model_provider,
            r.model_name,
            r.use_web_search,
            r.created_at,
            extract(epoch from (r.finished_at - r.started_at)) * 1000 as duration_ms,
            coalesce(sum(c.prompt_tokens), 0)::bigint as prompt_tokens,
            coalesce(sum(c.completion_tokens), 0)::bigint as completion_tokens,
            coalesce(sum(c.total_tokens), 0)::bigint as total_tokens,
            round(avg(c.latency_ms))::int as avg_llm_latency_ms,
            count(c.id)::int as llm_calls_count,
            rr.clarity_score as rubric_clarity_score,
            rr.correctness_score as rubric_correctness_score,
            rr.completeness_score as rubric_completeness_score,
            rr.overall_score as rubric_overall_score,
            rr.passed as rubric_passed,
            rr.review_required as rubric_review_required
        from public.runs r
        left join public.llm_calls c on c.run_id = r.id
        left join public.run_rubrics rr on rr.run_id = r.id
        where ($2::uuid is null or r.user_id = $2::uuid)
        group by
            r.id, r.status, r.model_provider, r.model_name, r.use_web_search, r.created_at, r.started_at, r.finished_at,
            rr.clarity_score, rr.correctness_score, rr.completeness_score, rr.overall_score, rr.passed, rr.review_required
        order by r.created_at desc
        limit $1
        """
        rows = await pool().fetch(q, limit, user_id)
        return [dict(r) for r in rows]
