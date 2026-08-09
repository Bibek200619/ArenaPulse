import { ProfileForm } from '@/features/auth/profile-form';
import { requireUser } from '@/features/auth/session';
export const metadata = { title: 'Make it yours' };
export default async function OnboardingPage() {
  await requireUser();
  return (
    <section className="auth-panel">
      <p className="eyebrow">A QUICK INTRODUCTION</p>
      <h1>Make it yours.</h1>
      <p>
        Choose a username and the sports you love. You can update these later.
      </p>
      <ProfileForm />
    </section>
  );
}
