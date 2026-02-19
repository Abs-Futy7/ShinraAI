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
  rubric?: RubricEvaluation | null;
}

export interface RubricScores {
  clarity: number;
  correctness: number;
  completeness: number;
  overall: number;
  scale_min: number;
  scale_max: number;
}

export interface RubricThresholds {
  min_clarity: number;
  min_correctness: number;
  min_completeness: number;
  min_overall: number;
}

export interface RubricEvaluation {
  scores: RubricScores;
  thresholds?: RubricThresholds;
  passed: boolean;
  strengths?: string[];
  weaknesses?: string[];
  recommendations?: string[];
  grader_model?: string;
  attempt?: number;
  attempts?: number;
  review_required?: boolean;
}

export interface RiskyClaim {
  claim: string;
  risk_type: string;
  suggestion: string;
}

export interface ClaimsCheck {
  safe_claims: string[];
  risky_claims: RiskyClaim[];
  overall_assessment: "LOW_RISK" | "MEDIUM_RISK" | "HIGH_RISK" | "UNKNOWN";
}

export interface LinkedInPost {
  post_text: string;
  hashtags: string[];
  cta: string;
  word_count: number;
}

export interface ImagePrompt {
  prompt: string;
  negative_prompt: string;
  model_suggestion: string;
  style_notes: string;
}

export interface GeneratedImage {
  generation_id: string;
  images: string[];
  status: "success" | "failed";
  result?: any;
}

export interface LinkedInPack {
  claims_check: ClaimsCheck;
  linkedin_post: LinkedInPost;
  image_prompt: ImagePrompt;
  generated_image?: GeneratedImage;
  status: string;
  assessment: string;
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
  linkedin_pack?: LinkedInPack;
  quality_gate?: {
    passed: boolean;
    review_required: boolean;
    attempts: number;
    scores?: RubricScores;
  } | null;
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

export interface MetricsHeadline {
  total_runs: number | null;
  completed_runs: number | null;
  avg_duration_ms: number | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  avg_llm_latency_ms?: number | null;
  rubric_avg_overall?: number | null;
  rubric_scored_runs?: number | null;
  rubric_passed_runs?: number | null;
  rubric_pass_rate?: number | null;
}

export interface MetricsDailyPoint {
  day: string;
  runs: number;
  errors: number;
}

export interface MetricsSummaryResponse {
  headline: MetricsHeadline;
  daily: MetricsDailyPoint[];
}

export interface MetricsRun {
  id: string;
  status: string;
  model_provider: string | null;
  model_name: string | null;
  use_web_search: boolean;
  created_at: string;
  duration_ms: number | null;
  prompt_tokens?: number | null;
  completion_tokens?: number | null;
  total_tokens?: number | null;
  avg_llm_latency_ms?: number | null;
  llm_calls_count?: number;
  rubric_clarity_score?: number | null;
  rubric_correctness_score?: number | null;
  rubric_completeness_score?: number | null;
  rubric_overall_score?: number | null;
  rubric_passed?: boolean | null;
  rubric_review_required?: boolean | null;
}
