-- Task Sessions, User Stats, and User Achievements for Timer + Rewards System

-- ── user_stats ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_stats (
  user_id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_xp              INTEGER     NOT NULL DEFAULT 0,
  current_streak        INTEGER     NOT NULL DEFAULT 0,
  longest_streak        INTEGER     NOT NULL DEFAULT 0,
  tasks_completed       INTEGER     NOT NULL DEFAULT 0,
  total_focus_minutes   INTEGER     NOT NULL DEFAULT 0,
  last_activity_date    DATE,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_stats: owner full access"
  ON user_stats FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── user_achievements ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_achievements (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id VARCHAR(50) NOT NULL,
  unlocked_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_achievements: owner full access"
  ON user_achievements FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_achievements_user
  ON user_achievements (user_id);

-- ── task_sessions ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS task_sessions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id             UUID        NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  estimated_minutes   INTEGER     NOT NULL,
  actual_minutes      INTEGER,
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at        TIMESTAMPTZ,
  status              VARCHAR(20) NOT NULL DEFAULT 'in_progress'
                        CHECK (status IN ('in_progress','completed_on_time','completed_late','abandoned')),
  extra_minutes_added INTEGER     NOT NULL DEFAULT 0,
  xp_earned          INTEGER     NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE task_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "task_sessions: owner full access"
  ON task_sessions FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS task_sessions_user_date
  ON task_sessions (user_id, started_at DESC);

CREATE INDEX IF NOT EXISTS task_sessions_task
  ON task_sessions (task_id);
