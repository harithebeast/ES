'use server'; // must be at the top

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEMO_COOKIE, type DemoUser } from '@/lib/auth';

export async function demoLogin() {  // <-- async here
  const user: DemoUser = { id: 'demo-user-1', name: 'Demo User' };

  const cookieStore = cookies(); // Server-side, synchronous
  cookieStore.set(DEMO_COOKIE, encodeURIComponent(JSON.stringify(user)), {
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });

  redirect('/buyers');
}
