import { redirect } from 'next/navigation';
import { requireUser } from '@/features/auth/session';
import { CreateCommunityForm } from '@/features/communities/forms';
import { CommunityShell } from '@/features/communities/presentation';
export const metadata = {
  title: 'Create community',
  robots: { index: false, follow: false },
};
export default async function NewCommunityPage() {
  const { client, user } = await requireUser();
  const [profile, sports] = await Promise.all([
    client.from('profiles').select('id').eq('id', user.id).maybeSingle(),
    client.from('sports').select('id,name').order('name').limit(100),
  ]);
  if (profile.error || sports.error)
    throw new Error('Community creation is unavailable');
  if (!profile.data) redirect('/onboarding');
  return (
    <CommunityShell title="Create a community">
      <CreateCommunityForm sports={sports.data} />
    </CommunityShell>
  );
}
