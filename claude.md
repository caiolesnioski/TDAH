# TDAH Planner — Documentação para Claude Code

## 1. Visão Geral

Aplicação React voltada para gerenciamento de tarefas adaptado para pessoas com TDAH. O sistema oferece organização de tarefas, timer de foco com recompensas (XP + conquistas), planejamento semanal, horários fixos e visualizações de agenda diária/semanal.

**Backend:** Supabase (auth + PostgreSQL + RLS)  
**URL env:** `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` no `.env`

---

## 2. Stack Técnica

| Pacote | Versão | Uso |
|--------|--------|-----|
| React | 19.2.0 | UI |
| TypeScript | 5.9.3 | Tipagem |
| Vite | 7.2.4 | Build / dev server |
| React Router DOM | 7.12.0 | Roteamento |
| TanStack Query | 5.90.16 | Estado servidor / cache |
| Zustand | 5.0.9 | Estado UI global |
| Supabase JS | 2.104.0 | Auth + banco de dados |
| Tailwind CSS | 4.1.18 | Estilização utility-first |
| daisyUI | 5.5.19 | Componentes e tema |
| shadcn/ui (sidebar-07) | — | Sidebar com collapse/hover |
| Radix UI | vários | Primitivas acessíveis |
| React Hook Form | 7.70.0 | Formulários |
| Recharts | 2.15.4 | Gráficos (Dashboard) |
| Motion | 12.26.1 | Animações (Framer Motion v12) |
| canvas-confetti | 1.9.4 | Efeito de confetti no XP |
| dnd-kit | 6/9/10 | Drag and drop |
| Lucide React | 0.562.0 | Ícones |
| dayjs | 1.11.19 | Manipulação de datas |
| zod | 4.3.5 | Validação de schema |
| sonner | 2.0.7 | Toast notifications |

---

## 3. Estrutura de Diretórios

```
src/
├── components/
│   ├── app-sidebar.tsx         # Sidebar principal com navegação seccionada
│   ├── brand-logo.tsx          # Logo "TDAH" exibido no topo da sidebar
│   ├── nav-main.tsx            # NavMain: renderiza seções da sidebar
│   ├── nav-user.tsx            # NavUser: avatar + menu do usuário no rodapé
│   ├── WeeklyPlanningBanner.tsx # Banner de lembrete de planejamento semanal
│   ├── TaskFocusModal.tsx      # Modal de timer de foco (Zustand-driven)
│   ├── layout/
│   │   ├── AppLayout.tsx       # Layout wrapper: SidebarProvider + AppSidebar + Outlet
│   │   └── ProtectedRoute.tsx  # Guarda de rota: auth check + onboarding gate + sunday planning
│   ├── tasks/
│   │   ├── TaskCard.tsx        # Card de tarefa individual
│   │   ├── TaskForm.tsx        # Formulário de criação/edição de tarefa
│   │   └── TaskFilters.tsx     # Filtros (categoria, prioridade, status)
│   ├── dashboard/
│   │   ├── RecentTasks.tsx     # Lista de tarefas recentes do dashboard
│   │   └── EmptyState.tsx      # Estado vazio do dashboard
│   └── ui/                     # Primitivas shadcn/ui (Radix) — NÃO usar Card como wrapper de página
│       ├── sidebar.tsx         # shadcn sidebar-07 (746 linhas, primitiva completa)
│       └── button.tsx, input.tsx, dialog.tsx, etc.
├── context/
│   └── AuthContext.tsx         # Supabase auth: user, session, isLoading, isAuthenticated
├── hooks/
│   ├── useTasks.ts             # useTasks, useCreateTask, useUpdateTask, useDeleteTask
│   ├── useTimeBlocks.ts        # useTimeBlocks, useCreateTimeBlock, useDeleteTimeBlock
│   ├── useWeeklyPlan.ts        # useWeeklyPlan, useCreateWeeklyPlan, useWeeklyPlanTasks
│   ├── usePreferences.ts       # usePreferences, useUpdatePreferences
│   ├── useTaskTimer.ts         # Lógica do timer de foco (start/stop/complete)
│   ├── useSundayPlanning.ts    # Detecta domingo + needsPlanning; dispara redirect
│   └── useAuthActions.ts       # login/register/logout wrappers com toast
├── lib/
│   ├── supabase.ts             # createClient com VITE_SUPABASE_URL/ANON_KEY
│   ├── rewards.ts              # calculateSessionXP + checkAchievements
│   ├── design-system.ts        # Tokens de design (constantes reutilizáveis)
│   ├── queryClient.ts          # TanStack QueryClient config
│   └── utils.ts                # cn() (clsx + tailwind-merge)
├── pages/
│   ├── auth/Login.tsx          # Página de login
│   ├── auth/Register.tsx       # Página de registro
│   ├── dashboard/
│   │   ├── Dashboard.tsx       # Dashboard principal com stats, gráficos, tarefas recentes
│   │   ├── Conquistas.tsx      # Galeria de conquistas/achievements
│   │   └── Estatisticas.tsx    # Estatísticas detalhadas
│   ├── schedule/
│   │   ├── Today.tsx           # Tarefas de hoje
│   │   ├── Tomorrow.tsx        # Tarefas de amanhã
│   │   ├── MyWeek.tsx          # Visão semanal das tarefas
│   │   ├── WeeklyRoutine.tsx   # Horários fixos (time blocks) configurados
│   │   ├── NewSchedule.tsx     # Criar novo time block
│   │   └── SchedulesList.tsx   # Lista de horários fixos
│   ├── tasks/
│   │   ├── TasksNotionView.tsx # Visão estilo Notion (tabela) de tarefas
│   │   ├── ByCategory.tsx      # Tarefas agrupadas por categoria
│   │   └── Completed.tsx       # Tarefas concluídas
│   ├── focus/FocusTimer.tsx    # Página de timer de foco
│   ├── planning/WeeklyPlanning.tsx # Planejamento semanal (domingo)
│   ├── onboarding/Onboarding.tsx   # Onboarding pós-cadastro (horários, sono)
│   ├── settings/
│   │   ├── Profile.tsx         # Perfil do usuário
│   │   ├── Notifications.tsx   # Configurações de notificações
│   │   └── TdahPreferences.tsx # Preferências TDAH (pomodoro, daily goal, etc.)
│   └── NotFound.tsx
├── routes/AppRoutes.tsx         # Definição de todas as rotas
├── store/
│   └── focusModalStore.ts      # Zustand: isOpen, activeTask, openModal, closeModal
├── types/index.ts               # Todos os tipos TypeScript do projeto
├── index.css                    # Tema daisyUI + tokens sidebar + dot-grid background
└── main.tsx                     # Entry point
```

---

## 4. Features Implementadas

| Feature | Status | Observações |
|---------|--------|-------------|
| Autenticação (Supabase) | ✅ Funcionando | Email/senha; JWT via supabase-js; sem OAuth |
| Dashboard | ✅ Funcionando | Stats cards, gráfico semanal (Recharts), tarefas recentes |
| CRUD de Tarefas | ✅ Funcionando | Criação, edição, exclusão, marcação como concluída |
| Visão Notion de Tarefas | ✅ Funcionando | Tabela com filtros |
| Tarefas Por Categoria | ✅ Funcionando | Agrupamento visual por categoria |
| Tarefas Concluídas | ✅ Funcionando | Histórico |
| TaskFocusModal (timer) | ✅ Funcionando | Modal abre via Zustand store (`useFocusModalStore`) |
| Sistema de XP | ✅ Funcionando | `lib/rewards.ts`: bônus por categoria/prioridade/streak |
| Conquistas (Achievements) | ✅ Funcionando | 5 conquistas no catálogo; página `/dashboard/conquistas` |
| Planejamento Semanal | ✅ Funcionando | Auto-redirect no domingo; banner permanente no topo |
| Horários Fixos (Time Blocks) | ✅ Funcionando | CRUD; visão semanal em WeeklyRoutine |
| Hoje / Amanhã / Semana | ✅ Funcionando | Páginas de agenda por período |
| Onboarding | ✅ Funcionando | Gateado por `localStorage('onboardingCompleted')` |
| Preferências TDAH | ✅ Funcionando | Salvas no Supabase via `user_preferences` |
| Perfil | ⚠️ Parcial | Exibe dados do auth; sem upload de foto de perfil |
| Notificações | ⚠️ Parcial | UI pronta; sem envio real de emails/push |
| Estatísticas | ⚠️ Parcial | Página existe; dados podem estar incompletos |
| Sidebar expand-on-hover | ✅ Funcionando | collapsible="icon" + onMouseEnter/Leave via useSidebar().setOpen |

---

## 5. Banco de Dados (Supabase)

Todas as tabelas têm RLS habilitado com políticas `auth.uid() = user_id`.

### Tabelas Principais

**`tasks`**
```
id, user_id, title, description, category (int 0-5), priority (int 0-2),
status (int 0-3), estimated_minutes, actual_minutes, deadline, created_at, updated_at
```

**`user_stats`**
```
user_id (PK), total_xp, current_streak, longest_streak,
tasks_completed, total_focus_minutes, last_activity_date, updated_at
```

**`user_achievements`**
```
id, user_id, achievement_id (varchar), unlocked_at
UNIQUE (user_id, achievement_id)
```

**`task_sessions`**
```
id, user_id, task_id, estimated_minutes, actual_minutes,
started_at, completed_at,
status: 'in_progress'|'completed_on_time'|'completed_late'|'abandoned',
extra_minutes_added, xp_earned
```

**`user_preferences`**
```
user_id (PK), ideal_sleep_hours, wake_time, sleep_time,
pomodoro_length, break_length, daily_goal, max_tasks_per_day, task_chunk_minutes,
simplified_view, priority_highlight, motivation_messages, confirm_destructive,
auto_break_reminder, task_reminders, reminder_minutes,
daily_digest, digest_hour, streak_alerts, xp_alerts,
focus_reminders, focus_interval_minutes, updated_at
```

**`weekly_plans`**
```
id, user_id, week_start (DATE - sempre segunda-feira), created_at, completed_at
UNIQUE (user_id, week_start)
```

**`weekly_plan_tasks`**
```
id, weekly_plan_id, title, category, priority, estimated_minutes,
scheduled_day, scheduled_start, task_id (FK→tasks, nullable)
```

**`user_planning_settings`**
```
user_id (PK), sunday_planning_enabled, last_reminded_at
```

**`time_blocks`**
```
id, user_id, day_of_week (0=domingo..6=sábado), start_time, end_time,
type (WORK|CLASS|FIXED|TASK), title, created_at, updated_at
```

### Migrations
Localizadas em `supabase/migrations/`:
- `20260509_task_sessions.sql` — user_stats, user_achievements, task_sessions
- `20260509_user_preferences.sql` — user_preferences
- `20260509_weekly_planning.sql` — weekly_plans, weekly_plan_tasks, user_planning_settings

As tabelas `tasks` e `time_blocks` existem de migrations anteriores (não incluídas nessa pasta).

---

## 6. Padrões do Projeto

### Hooks de Dados (TanStack Query + Supabase)
Todos os hooks seguem o mesmo padrão:
1. `useQuery` para leitura; `useMutation` para escrita
2. Função `mapXxx()` converte snake_case do banco → camelCase TypeScript
3. Mutations invalidam o queryKey correspondente no `onSuccess`
4. Auth verificada via `supabase.auth.getUser()` dentro das mutations

### Estado Global
- **TanStack Query** — todo estado do servidor (tasks, preferences, time_blocks, etc.)
- **Zustand** — apenas `focusModalStore` (abertura do modal de foco + task ativa)
- **React Context** — `AuthContext` (user, session, isLoading, isAuthenticated)

### Roteamento
- Todas as rotas protegidas ficam dentro de `<Route element={<ProtectedRoute />}>`
- `ProtectedRoute` verifica em ordem: `isLoading` → `isAuthenticated` → `onboardingCompleted`
- `AuthenticatedLayout` (dentro de ProtectedRoute) executa `useSundayPlanning` para redirect automático no domingo
- Onboarding gate: `localStorage.getItem('onboardingCompleted') === 'true'`

### Sistema de Design
- **Tema:** `data-theme="tdah"` (daisyUI v5) — dark, paleta amber/orange quente
  - Primary: `#E8713C` (laranja)
  - Secondary/Accent: `#F5C842` (âmbar)
  - Base-100: `#1A1612` (marrom escuro quente)
- **Fonte:** DM Sans (Google Fonts)
- **Background:** `#0F1117` com dot-grid (radial-gradient branco 7% opacidade, 28px spacing)
- **Sidebar:** shadcn sidebar-07, collapsible="icon", expand-on-hover, tokens em `@theme {}` no CSS

### Tipos
`src/types/index.ts` usa `as const` objects (não TypeScript enums):
```ts
export const TaskCategory = { STUDY: 0, WORK: 1, HOME: 2, HEALTH: 3, LEISURE: 4, OTHER: 5 } as const;
export type TaskCategory = (typeof TaskCategory)[keyof typeof TaskCategory];
// TaskStatus: PENDING=0, IN_PROGRESS=1, COMPLETED=2, CANCELLED=3
// TaskPriority: LOW=0, MEDIUM=1, HIGH=2
// TimeBlockType: 'WORK' | 'CLASS' | 'FIXED' | 'TASK' (strings, não números)
```

---

## 7. O Que NÃO Fazer

- **Não reimportar `Card` do shadcn/ui** como wrapper de página. Todas as páginas foram migradas para divs com classes daisyUI. O arquivo `ui/card.tsx` existe mas não deve ser usado em páginas.
- **Não adicionar `SidebarTrigger`** no layout. A sidebar expande via hover. Um botão de toggle seria redundante.
- **Não adicionar wrappers de sidebar por página.** Antes de maio/2026 cada página tinha seu próprio `SidebarProvider` — isso causava bugs. O `AppLayout` é o único ponto de controle.
- **Não usar enums TypeScript** para categorias/prioridades/status. O projeto usa `as const` objects com valores numéricos.
- **Não remover o `.finally(() => setIsLoading(false))`** no `AuthContext.tsx`. Bug crítico corrigido em 2026-05-30 — sem ele a tela fica em loading infinito se `getSession()` rejeitar.
- **Não usar `axios`** para chamadas ao Supabase. O projeto usa o cliente supabase-js diretamente em todos os hooks.

---

## 8. Comandos Úteis

```bash
# Desenvolvimento
npm run dev

# Build de produção (roda tsc + lint + vite build)
npm run build

# Testes
npm run test

# Lint
npm run lint

# Formatação
npm run format

# Migrations Supabase (requer Supabase CLI)
supabase db push              # aplica migrations pendentes
supabase migration new <nome> # cria nova migration
```

---

## 9. Objetivos do Produto e Visão

### Público-Alvo
Pessoas com TDAH que precisam de um sistema de organização adaptado ao seu modo de funcionamento — não apenas um todo-list genérico.

### Problema que Resolve
- Dificuldade de planejamento e priorização
- Esquecimento de tarefas e compromissos
- Falta de senso de progresso e recompensa
- Sobrecarga cognitiva ao usar ferramentas genéricas

### Princípios de Design do Produto
1. **Menos é mais** — evitar sobrecarga visual e cognitiva. Se uma tela tem muita informação, simplificar antes de adicionar.
2. **Feedback imediato** — animações, XP e recompensas reforçam comportamento positivo no momento certo.
3. **Estrutura flexível** — o sistema se adapta à rotina da pessoa, não o contrário.
4. **Não punitivo** — linguagem sempre encorajadora. Nunca mostrar mensagens de falha ou atraso de forma negativa.

### Regra para Claude Code
> Antes de implementar qualquer feature, verificar: ela **reduz** ou **aumenta** a carga cognitiva do usuário com TDAH? Se aumentar, simplificar primeiro.

### Roadmap (Features Prioritárias Ainda Não Implementadas)
- [ ] Upload de foto de perfil no avatar (atualmente string vazia)
- [ ] Notificação por email no domingo para lembrete de planejamento semanal
- [ ] Mini calendário lateral clicável com eventos e lembretes
- [ ] Dicas manuais de foco/produtividade no Dashboard (`ui/TipBanner.tsx` já existe)
- [ ] Onboarding mais completo pós-cadastro (categorias de vida, rotina de sono detalhada)
- [ ] Conquistas adicionais no catálogo (apenas 5 atualmente em `lib/rewards.ts`)
- [ ] Página de Estatísticas com dados reais completos

---

**Última atualização:** 2026-05-30  
**Branch atual de trabalho:** feature/ui-polish-sprint
