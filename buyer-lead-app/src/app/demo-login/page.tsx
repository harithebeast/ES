'use client';

import { useRouter } from 'next/navigation';
import { DEMO_COOKIE, type DemoUser } from '@/lib/auth';

export default function DemoLoginPage() {
  const router = useRouter();

  async function loginAction() {
    'use server';

    const user: DemoUser = { id: 'demo-user-1', name: 'Demo User' };

    // Use ResponseCookies from next/headers
    const { cookies } = await import('next/headers');
    const cookieStore = cookies();
    cookieStore.set(DEMO_COOKIE, encodeURIComponent(JSON.stringify(user)), {
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    // redirect
    router.push('/buyers'); // client-side redirect
  }

  return (
    <form action={loginAction} className="p-8 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Demo Login</h1>
      <button
        type="button"
        onClick={() => loginAction().catch(console.error)}
        className="px-4 py-2 bg-black text-white rounded"
      >
        Continue as Demo User
      </button>
    </form>
  );
}
