import { redirect } from 'next/navigation';
import { type DemoUser, DEMO_COOKIE } from '@/lib/auth';

export default function DemoLoginPage({ searchParams }: { searchParams: { redirect?: string } }) {
  async function loginAction() {
    'use server';

    const user: DemoUser = { id: 'demo-user-1', name: 'Demo User' };

    // Use `cookies()` from the server action parameter (automatic in form action)
    // `cookies()` now returns a mutable ResponseCookies object
    const resCookies = new Headers();
    resCookies.append('Set-Cookie', `${DEMO_COOKIE}=${encodeURIComponent(JSON.stringify(user))}; Path=/; Max-Age=${7 * 24 * 60 * 60}`);

    // Redirect after setting cookie
    redirect(searchParams.redirect || '/buyers');
  }

  return (
    <form action={loginAction} className="p-8 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Demo Login</h1>
      <button className="px-4 py-2 bg-black text-white rounded" type="submit">
        Continue as Demo User
      </button>
    </form>
  );
}
