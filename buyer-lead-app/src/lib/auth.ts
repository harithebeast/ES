export type DemoUser = {
	id: string;
	name: string;
};

export const DEMO_COOKIE = "demo_user";

export function getDemoUserFromCookie(cookieHeader: string | undefined): DemoUser | null {
	if (!cookieHeader) return null;
	const match = cookieHeader.match(new RegExp(`${DEMO_COOKIE}=([^;]+)`));
	if (!match) return null;
	try {
		const decoded = decodeURIComponent(match[1]);
		const user = JSON.parse(decoded) as DemoUser;
		if (user && user.id) return user;
		return null;
	} catch {
		return null;
	}
}

export function serializeDemoUserCookie(user: DemoUser): string {
	const value = encodeURIComponent(JSON.stringify(user));
	// 7 day expiry, httpOnly not possible via header in client nav; set via response
	return `${DEMO_COOKIE}=${value}; Path=/; Max-Age=${7 * 24 * 60 * 60}`;
}
