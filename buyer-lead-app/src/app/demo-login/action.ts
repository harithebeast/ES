'use server'; // MUST be at the top

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { DEMO_COOKIE, type DemoUser } from '@/lib/auth';

export function demoLogin() {
  const user: DemoUser = { id: 'demo-user-1', name: 'Demo User' };
  
  // Server Action: cookies() returns writable RequestCookies
  const cookieStore = cookies(); 
  cookieStore.set(DEMO_COOKIE, encodeURIComponent(JSON.stringify(user)), {
    path: '/',
    maxAge: 7 * 24 * 60 * 60, // 7 days
  });

  redirect('/buyers');
}


























