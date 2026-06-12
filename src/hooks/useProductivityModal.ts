import { useState, useEffect } from 'react';
import dayjs from 'dayjs';
import { useTasks } from './useTasks';
import { TaskStatus } from '@/types';
import type { Task } from '@/types';
import type { ProductivityStats } from '@/components/DailyProductivityModal';

/**
 * Controla QUANDO o modal de celebração diária deve aparecer:
 * - Modal noturno: a partir das 21h, se houve tarefas concluídas hoje.
 * - Modal matinal: entre 6h e 12h, resumindo ontem (se o modal de ontem não foi visto).
 *
 * Exibição é controlada por chaves no localStorage para nunca repetir no mesmo dia.
 */
export function useProductivityModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalStats, setModalStats] = useState<ProductivityStats | null>(null);
  const { data: tasks = [] } = useTasks();

  useEffect(() => {
    if (tasks.length === 0) return;

    const now = dayjs();
    const today = now.format('YYYY-MM-DD');
    const yesterday = now.subtract(1, 'day').format('YYYY-MM-DD');
    const currentHour = now.hour();

    // Chave do localStorage para controlar exibição de hoje
    const shownKey = `productivity_modal_shown_${today}`;
    if (localStorage.getItem(shownKey)) return;

    const dayKey = (t: Task) => {
      const deadline = t.deadline ? dayjs(t.deadline).format('YYYY-MM-DD') : null;
      const createdAt = dayjs(t.createdAt).format('YYYY-MM-DD');
      return { deadline, createdAt };
    };

    // Tarefas de hoje (por deadline ou criação)
    const todayTasks = tasks.filter((t) => {
      const { deadline, createdAt } = dayKey(t);
      return deadline === today || createdAt === today;
    });

    // Tarefas de ontem (para o modal matinal)
    const yesterdayTasks = tasks.filter((t) => {
      const { deadline, createdAt } = dayKey(t);
      return deadline === yesterday || createdAt === yesterday;
    });

    // CASO 1: Modal noturno — 21h+ e há tarefas concluídas hoje
    if (currentHour >= 21) {
      const completedToday = todayTasks.filter((t) => t.status === TaskStatus.COMPLETED);
      if (completedToday.length > 0) {
        const incompleteTasks = todayTasks.filter((t) => t.status !== TaskStatus.COMPLETED);
        setModalStats({
          completed: completedToday.length,
          total: todayTasks.length,
          completionRate: completedToday.length / Math.max(todayTasks.length, 1),
          incompleteTasks,
          xpEarned: completedToday.length * 20, // estimativa
          isNextDay: false,
        });
        const t = setTimeout(() => setIsOpen(true), 2000); // pequeno delay
        return () => clearTimeout(t);
      }
      return;
    }

    // CASO 2: Modal matinal — manhã (6h-12h) e ontem teve tarefas concluídas
    if (currentHour >= 6 && currentHour < 12) {
      // Não mostrar se o modal de ontem já foi visto
      if (localStorage.getItem(`productivity_modal_shown_${yesterday}`)) return;

      const completedYesterday = yesterdayTasks.filter((t) => t.status === TaskStatus.COMPLETED);
      if (completedYesterday.length > 0) {
        const incompleteTasks = yesterdayTasks.filter((t) => t.status !== TaskStatus.COMPLETED);
        setModalStats({
          completed: completedYesterday.length,
          total: yesterdayTasks.length,
          completionRate: completedYesterday.length / Math.max(yesterdayTasks.length, 1),
          incompleteTasks,
          xpEarned: completedYesterday.length * 20,
          isNextDay: true, // resumo de ontem
        });
        const t = setTimeout(() => setIsOpen(true), 3000); // delay maior no matinal
        return () => clearTimeout(t);
      }
    }
  }, [tasks]);

  const closeModal = () => {
    setIsOpen(false);
    const today = dayjs().format('YYYY-MM-DD');
    localStorage.setItem(`productivity_modal_shown_${today}`, 'true');

    // Se é o modal matinal, marca ontem também como visto
    if (modalStats?.isNextDay) {
      const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
      localStorage.setItem(`productivity_modal_shown_${yesterday}`, 'true');
    }
  };

  return { isOpen, modalStats, closeModal };
}
