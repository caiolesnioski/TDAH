-- Weekly Planning System
-- Tables: weekly_plans, weekly_plan_tasks, user_planning_settings

-- ── weekly_plans ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weekly_plans (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start   DATE        NOT NULL,        -- always the Monday of the planned week
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,                 -- set when the user finishes distributing
  UNIQUE (user_id, week_start)
);

ALTER TABLE weekly_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "weekly_plans: owner full access"
  ON weekly_plans FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS weekly_plans_user_week
  ON weekly_plans (user_id, week_start);

-- ── weekly_plan_tasks ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS weekly_plan_tasks (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  weekly_plan_id    UUID         NOT NULL REFERENCES weekly_plans(id) ON DELETE CASCADE,
  title             VARCHAR(255) NOT NULL,
  category          VARCHAR(50)  NOT NULL,  -- Estudos | Trabalho | Casa | Saúde | Lazer | Outros
  priority          VARCHAR(20)  NOT NULL,  -- alta | media | baixa
  estimated_minutes INTEGER      NOT NULL,
  scheduled_day     VARCHAR(20),            -- seg | ter | qua | qui | sex | sab | dom
  scheduled_start   TIME,                   -- filled by the distribute endpoint
  task_id           UUID         REFERENCES tasks(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE weekly_plan_tasks ENABLE ROW LEVEL SECURITY;

-- Access is allowed only when the parent plan belongs to the authenticated user
CREATE POLICY "weekly_plan_tasks: owner full access"
  ON weekly_plan_tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM weekly_plans
       WHERE weekly_plans.id      = weekly_plan_tasks.weekly_plan_id
         AND weekly_plans.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM weekly_plans
       WHERE weekly_plans.id      = weekly_plan_tasks.weekly_plan_id
         AND weekly_plans.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS weekly_plan_tasks_plan
  ON weekly_plan_tasks (weekly_plan_id);

-- ── user_planning_settings ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS user_planning_settings (
  user_id                 UUID    PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  sunday_planning_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_reminded_at        TIMESTAMPTZ
);

ALTER TABLE user_planning_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_planning_settings: owner full access"
  ON user_planning_settings FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
