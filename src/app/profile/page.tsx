import Link from 'next/link';
import { redirect } from 'next/navigation';
import { requireUser } from '@/features/auth/session';
import { logout } from '@/features/auth/actions';
export const metadata = { title: 'Your profile' };
export default async function ProfilePage() {
  const { client, user } = await requireUser();
  const [{ data: profile, error }, { data: preferences }] = await Promise.all([
    client.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    client
      .from('profile_preferences')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle(),
  ]);
  if (error) throw new Error('Profile read failed');
  if (!profile) redirect('/onboarding');
  return (
    <section className="auth-panel profile-panel">
      <p className="eyebrow">YOUR ARENAPULSE</p>
      <div className="profile-avatar" aria-hidden="true">
        {profile.display_name.slice(0, 1).toUpperCase()}
      </div>
      <h1>{profile.display_name}</h1>
      <p>
        @{profile.username} ·{' '}
        {profile.is_private ? 'Private profile' : 'Public profile'}
      </p>
      <p>{profile.bio || 'Your sports story starts here.'}</p>
      <h2>Your sports</h2>
      <p>
        {preferences?.favorite_sports.join(' · ') ||
          'No favorites selected yet.'}
      </p>
      <div className="actions">
        <Link className="button" href="/settings/profile">
          Edit profile
        </Link>
        <Link className="text-link" href="/matches">
          Explore matches →
        </Link>
      </div>
      <div className="actions">
        <Link className="text-link" href="/settings/sports">
          Choose favorite teams, competitions and players →
        </Link>
      </div>
      <form action={logout}>
        <button className="button secondary">Sign out</button>
      </form>
    </section>
  );
}
