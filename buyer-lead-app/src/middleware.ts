import { NextRequest, NextResponse } from 'next/server';
import { DEMO_COOKIE } from './lib/auth';

export function middleware(req: NextRequest) {
	const { pathname } = req.nextUrl;
	if (pathname.startsWith('/demo-login')) return NextResponse.next();
	if (pathname.startsWith('/buyers')) {
		const userCookie = req.cookies.get(DEMO_COOKIE)?.value;
		if (!userCookie) {
			const url = req.nextUrl.clone();
			url.pathname = '/demo-login';
			url.searchParams.set('redirect', pathname);
			return NextResponse.redirect(url);
		}
	}
	return NextResponse.next();
}

export const config = {
	matcher: ['/buyers/:path*', '/demo-login'],
};
