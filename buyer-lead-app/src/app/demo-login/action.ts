
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEMO_COOKIE, type DemoUser } from '@/lib/auth';

export async function demoLogin() {
  const user: DemoUser = { id: 'demo-user-1', name: 'Demo User' };

  // Synchronous cookies API in Server Actions
  const cookieStore = cookies(); 
  cookieStore.set(DEMO_COOKIE, JSON.stringify(user), {
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  redirect('/buyers');
}
