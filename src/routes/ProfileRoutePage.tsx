import { FacultyProfilePage } from '../routes/FacultyProfilePage';
import { StudentProfilePage } from '../routes/StudentProfilePage';
import { useAuthStore } from '../store/useAuthStore';


export function ProfileRouter() {
  const { user } = useAuthStore();

  if (user?.roles?.includes('STUDENT')) {
    return <StudentProfilePage />;
  }

  return <FacultyProfilePage />;
}