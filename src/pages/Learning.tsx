import { useAuth } from '@/contexts/AuthContext';
import LearningSection from '@/components/guide/LearningSection';
import SEO from '@/components/SEO';
import { useAdSense } from '@/hooks/useAdSense';
import AdSenseSlot from '@/components/blog/AdSenseSlot';

export default function Learning() {
  const { user } = useAuth();
  useAdSense();

  return (
    <>
      <SEO title="Apprentissage – SpeedWork" description="Espace d'apprentissage SpeedWork : tutoriels vidéo et ressources." path="/learning" />
      <LearningSection isAdmin={user?.role === 'admin'} userId={user?.id} />
      <AdSenseSlot slot="learning-bottom" className="mt-6" />
    </>
  );
}
