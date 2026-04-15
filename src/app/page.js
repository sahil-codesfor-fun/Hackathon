'use client';
import useGuardexStore from '@/store/useGuardexStore';
import LoginPage from '@/components/LoginPage';
import AdminDashboard from '@/components/admin/AdminDashboard';
import StudentExamPortal from '@/components/student/StudentExamPortal';
import ExamEnvironment from '@/components/student/ExamEnvironment';
import PermissionWizard from '@/components/student/PermissionWizard';

export default function Home() {
  const { isAuthenticated, user, currentPage } = useGuardexStore();

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Admin / Developer flow
  if (user.role === 'admin' || user.role === 'developer') {
    return <AdminDashboard />;
  }

  // Student flow (PRD Phase 1)
  if (user.role === 'student') {
    switch (currentPage) {
      case 'wizard':
        return <PermissionWizard />;
      case 'exam':
        return <ExamEnvironment />;
      case 'portal':
      default:
        return <StudentExamPortal />;
    }
  }

  return <LoginPage />;
}
