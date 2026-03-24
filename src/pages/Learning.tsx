import { useAuth } from '@/contexts/AuthContext';
import LearningSection from '@/components/guide/LearningSection';
import SEO from '@/components/SEO';

export default function Learning() {
  const { user } = useAuth();

  return (
    <>
      <SEO title="Apprentissage – SpeedWork" description="Espace d'apprentissage SpeedWork : tutoriels vidéo et ressources." path="/learning" />
      <LearningSection isAdmin={user?.role === 'admin'} userId={user?.id} />
    </>
  );
}
