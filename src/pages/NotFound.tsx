import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Home, ListTodo, Calendar, Clock } from 'lucide-react';

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-1 items-center justify-center min-h-[calc(100vh-3rem)] bg-gradient-to-br from-slate-50 to-gray-100 dark:from-gray-900 dark:to-slate-900">
          <div className="text-center space-y-6 max-w-md px-6">
            <div className="text-8xl select-none">🚧</div>

            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                Oops! Essa página ainda não existe
              </h1>
              <p className="text-gray-500 dark:text-gray-400">
                Essa funcionalidade está chegando em breve! Por enquanto, volte para uma das páginas disponíveis.
              </p>
            </div>

            <Button
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white gap-2"
            >
              <Home className="h-5 w-5" />
              Voltar ao Dashboard
            </Button>

            <div className="space-y-2">
              <p className="text-sm text-gray-400 dark:text-gray-500 font-medium">
                Páginas disponíveis:
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/tasks/notion')}
                  className="gap-2 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950"
                >
                  <ListTodo className="h-4 w-4" />
                  Minhas Tarefas
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/schedule/week')}
                  className="gap-2 text-purple-600 border-purple-200 hover:bg-purple-50 dark:text-purple-400 dark:border-purple-800 dark:hover:bg-purple-950"
                >
                  <Calendar className="h-4 w-4" />
                  Minha Semana
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/schedule/routine')}
                  className="gap-2 text-orange-600 border-orange-200 hover:bg-orange-50 dark:text-orange-400 dark:border-orange-800 dark:hover:bg-orange-950"
                >
                  <Clock className="h-4 w-4" />
                  Rotina Semanal
                </Button>
              </div>
            </div>
          </div>
        </div>
  );
}
