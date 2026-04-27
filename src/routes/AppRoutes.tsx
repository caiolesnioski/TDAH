import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';
import Conquistas from '@/pages/dashboard/Conquistas';
import Estatisticas from '@/pages/dashboard/Estatisticas';
import WeeklyRoutine from '../pages/schedule/WeeklyRoutine';
import MyWeek from '@/pages/schedule/MyWeek';
import Today from '@/pages/schedule/Today';
import Tomorrow from '@/pages/schedule/Tomorrow';
import NewSchedule from '@/pages/schedule/NewSchedule';
import SchedulesList from '@/pages/schedule/SchedulesList';
import TasksNotionView from '@/pages/tasks/TasksNotionView';
import Completed from '@/pages/tasks/Completed';
import ByCategory from '@/pages/tasks/ByCategory';
import FocusTimer from '@/pages/focus/FocusTimer';
import Profile from '@/pages/settings/Profile';
import Notifications from '@/pages/settings/Notifications';
import TdahPreferences from '@/pages/settings/TdahPreferences';
import NotFound from '@/pages/NotFound';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import TestLogin from '@/pages/test/TestLogin';
import TestRegister from '@/pages/test/TestRegister';
import TestDashboard from '@/pages/test/TestDashboard';

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Testes */}
      <Route path="/test-login" element={<TestLogin />} />
      <Route path="/test-register" element={<TestRegister />} />
      <Route path="/test-dashboard" element={<TestDashboard />} />

      <Route element={<ProtectedRoute />}>
        {/* Dashboard */}
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/dashboard/conquistas" element={<Conquistas />} />
        <Route path="/dashboard/estatisticas" element={<Estatisticas />} />

        {/* Agenda */}
        <Route path="/schedule/week" element={<MyWeek />} />
        <Route path="/schedule/today" element={<Today />} />
        <Route path="/schedule/tomorrow" element={<Tomorrow />} />
        <Route path="/schedule/routine" element={<WeeklyRoutine />} />
        <Route path="/schedule/new" element={<NewSchedule />} />
        <Route path="/schedule/list" element={<SchedulesList />} />

        {/* Tarefas */}
        <Route path="/tasks/notion" element={<TasksNotionView />} />
        <Route path="/tasks/completed" element={<Completed />} />
        <Route path="/tasks/by-category" element={<ByCategory />} />

        {/* Foco */}
        <Route path="/focus" element={<FocusTimer />} />

        {/* Configurações */}
        <Route path="/settings/profile" element={<Profile />} />
        <Route path="/settings/notifications" element={<Notifications />} />
        <Route path="/settings/tdah" element={<TdahPreferences />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
