-- Alpha-07: persist six-dimension quiz engine outputs.

alter table public.quiz_sessions
  add column if not exists dimension_scores jsonb not null default '{}'::jsonb;

alter table public.archetype_results
  add column if not exists dimension_scores jsonb not null default '{}'::jsonb;

alter table public.quiz_answers
  add column if not exists dimension_effect jsonb not null default '{}'::jsonb;

create index if not exists quiz_sessions_dimension_scores_gin_idx
  on public.quiz_sessions using gin (dimension_scores);

create index if not exists archetype_results_dimension_scores_gin_idx
  on public.archetype_results using gin (dimension_scores);

create index if not exists quiz_answers_dimension_effect_gin_idx
  on public.quiz_answers using gin (dimension_effect);
