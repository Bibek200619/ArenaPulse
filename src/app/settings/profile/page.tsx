import { ProfileForm } from '@/features/auth/profile-form';
import { requireUser } from '@/features/auth/session';
import { redirect } from 'next/navigation';
export const metadata = { title: 'Edit profile' };
export default async function EditProfilePage() {
  const { client, user } = await requireUser();
  const [{ data: profile }, { data: preferences }] = await Promise.all([
    client.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    client
      .from('profile_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);
  if (!profile) redirect('/onboarding');
  return (
    <section className="auth-panel">
      <h1>Edit your profile.</h1>
      <ProfileForm
        profile={{
          ...profile,
          favorite_sports: preferences?.favorite_sports ?? [],
        }}
      />
    </section>
  );
}
