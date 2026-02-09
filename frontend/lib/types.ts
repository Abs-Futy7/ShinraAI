export interface Citation {
  id: string;
  title: string;
  url: string;
}

export interface DraftIteration {
  iteration: number;
  text: string;
}

export interface FactIssue {
  claim: string;
  reason: string;
  suggested_fix: string;
  source_ids: string[];
}

export interface FactCheckIteration {
  iteration: number;
  passed: boolean;
  issues: FactIssue[];
  rewrite_instructions?: string;
}

export interface ResearchSource {
  id: string;
  title: string;
  url: string;
  query: string;
  key_facts: string[];
}

export interface ResearchOutput {
  queries: string[];
  sources: ResearchSource[];
  summary_facts: string[];
  unknowns: string[];
}

export interface RunSteps {
  research: ResearchOutput | null;
  drafts: DraftIteration[];
  fact_checks: FactCheckIteration[];
  final: { markdown: string } | null;
}

export interface RunState {
  run_id: string;
  inputs: {
    prd: string;
    tone: string;
    audience: string;
    word_count: number;
    use_web_search: boolean;
    model_provider?: string;
    model_name?: string;
  };
  steps: RunSteps;
  citations: Citation[];
  status: string;
  error: string | null;
  logs: string[];
}

export interface CreateRunRequest {
  prd: string;
  tone: string;
  audience: string;
  word_count: number;
  use_web_search: boolean;
  model_provider?: string;
  model_name?: string;
}
