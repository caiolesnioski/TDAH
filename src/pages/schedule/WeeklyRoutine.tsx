import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  Plus,
  Trash2,
  Briefcase,
  GraduationCap,
  CalendarClock,
  Save,
  RotateCcw,
} from 'lucide-react';
import { TimeBlockType } from '@/types';
import { cn } from '@/lib/utils';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Domingo', short: 'Dom' },
  { value: 1, label: 'Segunda', short: 'Seg' },
  { value: 2, label: 'Terça', short: 'Ter' },
  { value: 3, label: 'Quarta', short: 'Qua' },
  { value: 4, label: 'Quinta', short: 'Qui' },
  { value: 5, label: 'Sexta', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
];

const BLOCK_TYPE_CONFIG = {
  [TimeBlockType.WORK]: {
    label: 'Trabalho',
    icon: Briefcase,
    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-300',
  },
  [TimeBlockType.CLASS]: {
    label: 'Aula',
    icon: GraduationCap,
    color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-orange-300',
  },
  [TimeBlockType.FIXED]: {
    label: 'Compromisso',
    icon: CalendarClock,
    color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-purple-300',
  },
  [TimeBlockType.TASK]: {
    label: 'Tarefa',
    icon: Clock,
    color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 border-green-300',
  },
};

const generateId = () => Math.random().toString(36).substring(2, 9);

// Load from localStorage
const loadBlocks = (): TimeBlock[] => {
  try {
    const saved = localStorage.getItem('weeklyRoutine');
    if (saved) {
      return JSON.parse(saved);
    }
  } catch {
    // ignore
  }
  return [];
};

// Save to localStorage
const saveBlocks = (blocks: TimeBlock[]) => {
  localStorage.setItem('weeklyRoutine', JSON.stringify(blocks));
};

// Formatar data para exibição
const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

interface NewBlockForm {
  title: string;
  type: TimeBlockType;
  daysOfWeek: number[]; // Múltiplos dias
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  validFrom: string; // Data início
  validUntil: string; // Data fim
}

export default function WeeklyRoutine() {
  const [blocks, setBlocks] = useState<TimeBlock[]>(loadBlocks);
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [blockToDelete, setBlockToDelete] = useState<string | null>(null);

  // Data de hoje formatada para input date
  const today = new Date().toISOString().split('T')[0];

  const [newBlock, setNewBlock] = useState<NewBlockForm>({
    title: '',
    type: TimeBlockType.WORK,
    daysOfWeek: [1], // Segunda por padrão
    startTime: '09:00',
    endTime: '18:00',
    isRecurring: true,
    validFrom: today,
    validUntil: '',
  });

  // Toggle dia da semana
  const toggleDay = (dayValue: number) => {
    setNewBlock((prev) => {
      const isSelected = prev.daysOfWeek.includes(dayValue);
      if (isSelected) {
        // Não permite desmarcar se for o único dia selecionado
        if (prev.daysOfWeek.length === 1) return prev;
        return {
          ...prev,
          daysOfWeek: prev.daysOfWeek.filter((d) => d !== dayValue),
        };
      } else {
        return {
          ...prev,
          daysOfWeek: [...prev.daysOfWeek, dayValue].sort((a, b) => a - b),
        };
      }
    });
  };

  // Selecionar dias úteis (Seg-Sex)
  const selectWeekdays = () => {
    setNewBlock((prev) => ({
      ...prev,
      daysOfWeek: [1, 2, 3, 4, 5],
    }));
  };

  // Selecionar todos os dias
  const selectAllDays = () => {
    setNewBlock((prev) => ({
      ...prev,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    }));
  };

  const handleAddBlock = () => {
    if (!newBlock.title.trim()) return;
    if (newBlock.daysOfWeek.length === 0) return;

    // Cria um bloco para cada dia selecionado
    const newBlocks: TimeBlock[] = newBlock.daysOfWeek.map((day) => ({
      id: generateId(),
      title: newBlock.title,
      type: newBlock.type,
      dayOfWeek: day as 0 | 1 | 2 | 3 | 4 | 5 | 6,
      startTime: newBlock.startTime,
      endTime: newBlock.endTime,
      isRecurring: newBlock.isRecurring,
      validFrom: newBlock.isRecurring ? newBlock.validFrom : undefined,
      validUntil: newBlock.isRecurring && newBlock.validUntil ? newBlock.validUntil : undefined,
    }));

    const updatedBlocks = [...blocks, ...newBlocks];
    setBlocks(updatedBlocks);
    saveBlocks(updatedBlocks);

    setNewBlock({
      title: '',
      type: TimeBlockType.WORK,
      daysOfWeek: [1],
      startTime: '09:00',
      endTime: '18:00',
      isRecurring: true,
      validFrom: today,
      validUntil: '',
    });
    setShowAddForm(false);
  };

  const handleRemoveBlock = (id: string) => {
    const updatedBlocks = blocks.filter((b) => b.id !== id);
    setBlocks(updatedBlocks);
    saveBlocks(updatedBlocks);
  };

  const handleClearAll = () => {
    setBlocks([]);
    localStorage.removeItem('weeklyRoutine');
  };

  // Group blocks by day
  const blocksByDay = DAYS_OF_WEEK.map((day) => ({
    ...day,
    blocks: blocks
      .filter((b) => b.dayOfWeek === day.value)
      .sort((a, b) => a.startTime.localeCompare(b.startTime)),
  }));

  return (
    <>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-6 p-4 md:p-6 bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900 min-h-screen">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                  <Clock className="h-6 w-6 text-focus-blue-500" />
                  Minha Rotina Semanal
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Configure seus horários fixos de trabalho, aulas e compromissos.
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setConfirmClearAll(true)}
                  disabled={blocks.length === 0}
                  className="text-red-500 hover:text-red-600"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Limpar Tudo
                </Button>
                <Button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="bg-gradient-to-r from-focus-blue-500 to-calm-purple-500"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Horário
                </Button>
              </div>
            </div>

            {/* Add Form */}
            {showAddForm && (
              <Card className="border-2 border-dashed border-focus-blue-300 dark:border-focus-blue-700">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Plus className="h-5 w-5 text-focus-blue-500" />
                    Novo Horário
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Linha 1: Título e Tipo */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Título</Label>
                      <Input
                        id="title"
                        placeholder="Ex: Trabalho, Faculdade, Estágio..."
                        value={newBlock.title}
                        onChange={(e) => setNewBlock({ ...newBlock, title: e.target.value })}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type">Tipo</Label>
                      <select
                        id="type"
                        value={newBlock.type}
                        onChange={(e) => setNewBlock({ ...newBlock, type: e.target.value as TimeBlockType })}
                        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {Object.entries(BLOCK_TYPE_CONFIG).map(([key, config]) => (
                          <option key={key} value={key}>
                            {config.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Linha 2: Dias da Semana */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Dias da Semana</Label>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectWeekdays}
                          className="text-xs h-7"
                        >
                          Seg-Sex
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={selectAllDays}
                          className="text-xs h-7"
                        >
                          Todos
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => {
                        const isSelected = newBlock.daysOfWeek.includes(day.value);
                        return (
                          <button
                            key={day.value}
                            type="button"
                            onClick={() => toggleDay(day.value)}
                            className={cn(
                              'px-3 py-2 rounded-lg text-sm font-medium transition-all border-2',
                              isSelected
                                ? 'bg-focus-blue-500 text-white border-focus-blue-500'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-transparent hover:border-focus-blue-300'
                            )}
                          >
                            {day.short}
                          </button>
                        );
                      })}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {newBlock.daysOfWeek.length === 1
                        ? '1 dia selecionado'
                        : `${newBlock.daysOfWeek.length} dias selecionados`}
                    </p>
                  </div>

                  {/* Linha 3: Horários */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start">Hora Início</Label>
                      <Input
                        id="start"
                        type="time"
                        value={newBlock.startTime}
                        onChange={(e) => setNewBlock({ ...newBlock, startTime: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="end">Hora Fim</Label>
                      <Input
                        id="end"
                        type="time"
                        value={newBlock.endTime}
                        onChange={(e) => setNewBlock({ ...newBlock, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Linha 4: Repetição */}
                  <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CalendarRange className="h-4 w-4 text-focus-blue-500" />
                        <Label className="font-medium">Repetir toda semana</Label>
                      </div>
                      <Switch
                        checked={newBlock.isRecurring}
                        onCheckedChange={(checked) => setNewBlock({ ...newBlock, isRecurring: checked })}
                      />
                    </div>

                    {newBlock.isRecurring && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="space-y-2">
                          <Label htmlFor="validFrom">A partir de</Label>
                          <Input
                            id="validFrom"
                            type="date"
                            value={newBlock.validFrom}
                            onChange={(e) => setNewBlock({ ...newBlock, validFrom: e.target.value })}
                            min={today}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="validUntil">Até (opcional)</Label>
                          <Input
                            id="validUntil"
                            type="date"
                            value={newBlock.validUntil}
                            onChange={(e) => setNewBlock({ ...newBlock, validUntil: e.target.value })}
                            min={newBlock.validFrom || today}
                            placeholder="Sem data fim"
                          />
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Deixe vazio para repetir indefinidamente
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Linha 5: Botões */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={handleAddBlock}
                      disabled={!newBlock.title.trim() || newBlock.daysOfWeek.length === 0}
                      className="flex-1 bg-focus-blue-500 hover:bg-focus-blue-600"
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Salvar {newBlock.daysOfWeek.length > 1 ? `(${newBlock.daysOfWeek.length} dias)` : ''}
                    </Button>
                    <Button variant="outline" onClick={() => setShowAddForm(false)}>
                      Cancelar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Weekly Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
              {blocksByDay.map((day) => (
                <Card key={day.value} className="border-0 shadow-lg bg-white dark:bg-gray-800">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center justify-between">
                      {day.label}
                      <Badge variant="outline" className="text-xs">
                        {day.blocks.length}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 min-h-[200px]">
                    {day.blocks.length > 0 ? (
                      day.blocks.map((block) => {
                        const config = BLOCK_TYPE_CONFIG[block.type];
                        const Icon = config.icon;

                        return (
                          <div
                            key={block.id}
                            className={cn(
                              'p-2 rounded-lg border text-xs group relative',
                              config.color
                            )}
                          >
                            <div className="flex items-center gap-1 mb-1">
                              <Icon className="h-3 w-3" />
                              <span className="font-medium truncate">{block.title}</span>
                            </div>
                            <div className="text-xs opacity-75">
                              {block.startTime} - {block.endTime}
                            </div>
                            {block.isRecurring && (block.validFrom || block.validUntil) && (
                              <div className="text-[10px] opacity-60 mt-1">
                                {block.validFrom && formatDate(block.validFrom)}
                                {block.validUntil && ` - ${formatDate(block.validUntil)}`}
                              </div>
                            )}
                            <button
                              onClick={() => setBlockToDelete(block.id)}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-opacity"
                            >
                              <Trash2 className="h-3 w-3 text-red-500" />
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                        Nenhum horário
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Summary */}
            <Card className="border-0 shadow-lg bg-white dark:bg-gray-800">
              <CardHeader>
                <CardTitle className="text-lg text-gray-800 dark:text-white">Resumo da Semana</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(BLOCK_TYPE_CONFIG).map(([type, config]) => {
                    const count = blocks.filter((b) => b.type === type).length;
                    const Icon = config.icon;

                    return (
                      <div key={type} className={cn('p-4 rounded-xl', config.color)}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5" />
                          <span className="font-medium">{config.label}</span>
                        </div>
                        <p className="text-2xl font-bold mt-2">{count}</p>
                        <p className="text-xs opacity-75">horários</p>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

    <ConfirmDialog
      open={confirmClearAll}
      title="Limpar toda a rotina"
      message="Tem certeza que deseja remover todos os horários? Essa ação não pode ser desfeita."
      confirmLabel="Limpar Tudo"
      onConfirm={() => { handleClearAll(); setConfirmClearAll(false); }}
      onCancel={() => setConfirmClearAll(false)}
    />

    <ConfirmDialog
      open={!!blockToDelete}
      title="Remover horário"
      message="Tem certeza que deseja remover esse horário da sua rotina?"
      confirmLabel="Remover"
      onConfirm={() => {
        if (blockToDelete) handleRemoveBlock(blockToDelete);
        setBlockToDelete(null);
      }}
      onCancel={() => setBlockToDelete(null)}
    />
    </>
  );
}
