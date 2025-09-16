// src/app/demo-login/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEMO_COOKIE, type DemoUser } from '@/lib/auth';

async function loginAction() {
  'use server';

  const user: DemoUser = { id: 'demo-user-1', name: 'Demo User' };
  const cookieStore = cookies();
  cookieStore.set(DEMO_COOKIE, encodeURIComponent(JSON.stringify(user)), {
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  redirect('/buyers');
}

export default function DemoLoginPage() {
  return (
    <form action={loginAction} className="p-8 max-w-sm mx-auto">
      <h1 className="text-xl font-semibold mb-4">Demo Login</h1>
      <button
        type="submit"
        className="px-4 py-2 bg-black text-white rounded"
      >
        Continue as Demo User
      </button>
    </form>
  );
}
