import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '@/pages/auth/Login';
import Register from '../pages/auth/Register';
import Dashboard from '../pages/dashboard/Dashboard';
import WeeklyRoutine from '../pages/schedule/WeeklyRoutine';
import MyWeek from '@/pages/schedule/MyWeek';
import TasksNotionView from '@/pages/tasks/TasksNotionView';
import FocusTimer from '@/pages/focus/FocusTimer';
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
      {/* Fim dos testes */}

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/schedule/routine" element={<WeeklyRoutine />} />
        <Route path="/schedule/week" element={<MyWeek />} />
        <Route path="/tasks/notion" element={<TasksNotionView />} />
        <Route path="/focus" element={<FocusTimer />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
