import { useForm } from 'react-hook-form';
import { DateInput } from '@/components/ui/IosWheelPicker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Task, TaskCategory, TaskPriority } from '@/types';
import { Calendar, Clock, Flag, FolderOpen } from 'lucide-react';

interface TaskFormProps {
  task?: Task | null;
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TaskFormData) => void;
  isLoading?: boolean;
}

export interface TaskFormData {
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedMinutes: number;
  deadline: string;
}

const categories = [
  { value: '0', label: 'Estudos', icon: '📚' },
  { value: '1', label: 'Trabalho', icon: '💼' },
  { value: '2', label: 'Casa', icon: '🏠' },
  { value: '3', label: 'Saúde', icon: '💚' },
  { value: '4', label: 'Lazer', icon: '🎮' },
  { value: '5', label: 'Outros', icon: '📌' },
];

const priorities = [
  { value: '0', label: 'Baixa', color: 'text-gray-600' },
  { value: '1', label: 'Média', color: 'text-orange-600' },
  { value: '2', label: 'Alta', color: 'text-red-600' },
];

export function TaskForm({ task, open, onClose, onSubmit, isLoading }: TaskFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<TaskFormData>({
    defaultValues: task
      ? {
          title: task.title,
          description: task.description || '',
          category: task.category,
          priority: task.priority,
          estimatedMinutes: task.estimatedMinutes,
          deadline: task.deadline.split('T')[0],
        }
      : {
          category: 0,
          priority: 1,
          estimatedMinutes: 30,
          deadline: new Date().toISOString().split('T')[0],
        },
  });

  const selectedCategory = watch('category');
  const selectedPriority = watch('priority');

  const handleFormSubmit = (data: TaskFormData) => {
    onSubmit(data);
    reset();
    onClose();
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            {task ? '✏️ Editar Tarefa' : '➕ Nova Tarefa'}
          </DialogTitle>
          <DialogDescription>
            {task
              ? 'Atualize as informações da sua tarefa'
              : 'Preencha os detalhes da nova tarefa. Todos os campos são importantes!'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          {/* Título */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-base font-semibold">
              Título da Tarefa *
            </Label>
            <Input
              id="title"
              placeholder="Ex: Estudar React por 1 hora"
              {...register('title', {
                required: 'O título é obrigatório',
                minLength: { value: 3, message: 'Mínimo 3 caracteres' },
              })}
              className="text-base"
            />
            {errors.title && <p className="text-sm text-red-600">{errors.title.message}</p>}
          </div>

          {/* Descrição */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-base font-semibold">
              Descrição
            </Label>
            <Textarea
              id="description"
              placeholder="Adicione detalhes sobre a tarefa..."
              rows={3}
              {...register('description')}
              className="text-base resize-none"
            />
            <p className="text-xs text-gray-500">
              Dica: Seja específico sobre o que precisa fazer!
            </p>
          </div>

          {/* Categoria e Prioridade */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Categoria */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <FolderOpen className="w-4 h-4" />
                Categoria *
              </Label>
              <Select
                value={selectedCategory?.toString()}
                onValueChange={(value: string) =>
                  setValue('category', parseInt(value) as TaskCategory)
                }
              >
                <SelectTrigger className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value} className="text-base">
                      {cat.icon} {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Prioridade */}
            <div className="space-y-2">
              <Label className="text-base font-semibold flex items-center gap-2">
                <Flag className="w-4 h-4" />
                Prioridade *
              </Label>
              <Select
                value={selectedPriority?.toString()}
                onValueChange={(value: string) =>
                  setValue('priority', parseInt(value) as TaskPriority)
                }
              >
                <SelectTrigger className="text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value} className="text-base">
                      <span className={priority.color}>⚑ {priority.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tempo Estimado e Prazo */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Tempo Estimado */}
            <div className="space-y-2">
              <Label
                htmlFor="estimatedMinutes"
                className="text-base font-semibold flex items-center gap-2"
              >
                <Clock className="w-4 h-4" />
                Tempo Estimado (minutos) *
              </Label>
              <Input
                id="estimatedMinutes"
                type="number"
                min="5"
                step="5"
                {...register('estimatedMinutes', {
                  required: 'Campo obrigatório',
                  min: { value: 5, message: 'Mínimo 5 minutos' },
                  valueAsNumber: true,
                })}
                className="text-base"
              />
              {errors.estimatedMinutes && (
                <p className="text-sm text-red-600">{errors.estimatedMinutes.message}</p>
              )}
            </div>

            {/* Prazo */}
            <div className="space-y-2">
              <Label htmlFor="deadline" className="text-base font-semibold flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Prazo *
              </Label>
              <DateInput
                id="deadline"
                value={watch('deadline')}
                onChange={(e) => setValue('deadline', e.target.value, { shouldValidate: true })}
                className="text-base flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
              />
              {errors.deadline && <p className="text-sm text-red-600">{errors.deadline.message}</p>}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[100px]">
              {isLoading ? 'Salvando...' : task ? 'Atualizar' : 'Criar Tarefa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
