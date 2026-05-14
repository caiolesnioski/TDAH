-- Tabela de preferências do usuário para o TDAH Planner
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id               UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  ideal_sleep_hours     NUMERIC     NOT NULL DEFAULT 8,
  wake_time             TEXT        NOT NULL DEFAULT '07:00',
  sleep_time            TEXT        NOT NULL DEFAULT '23:00',
  pomodoro_length       INTEGER     NOT NULL DEFAULT 25,
  break_length          INTEGER     NOT NULL DEFAULT 5,
  daily_goal            INTEGER     NOT NULL DEFAULT 5,
  max_tasks_per_day     INTEGER     NOT NULL DEFAULT 8,
  task_chunk_minutes    INTEGER     NOT NULL DEFAULT 25,
  simplified_view       BOOLEAN     NOT NULL DEFAULT false,
  priority_highlight    BOOLEAN     NOT NULL DEFAULT true,
  motivation_messages   BOOLEAN     NOT NULL DEFAULT true,
  confirm_destructive   BOOLEAN     NOT NULL DEFAULT true,
  auto_break_reminder   BOOLEAN     NOT NULL DEFAULT true,
  task_reminders        BOOLEAN     NOT NULL DEFAULT true,
  reminder_minutes      INTEGER     NOT NULL DEFAULT 15,
  daily_digest          BOOLEAN     NOT NULL DEFAULT true,
  digest_hour           TEXT        NOT NULL DEFAULT '08:00',
  streak_alerts         BOOLEAN     NOT NULL DEFAULT true,
  xp_alerts             BOOLEAN     NOT NULL DEFAULT true,
  focus_reminders       BOOLEAN     NOT NULL DEFAULT false,
  focus_interval_minutes INTEGER    NOT NULL DEFAULT 25,
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario acessa proprios dados" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);
