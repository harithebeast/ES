import { redirect } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { DEMO_COOKIE, type DemoUser } from '@/lib/auth';
import { db } from '@/db/client';
import { buyers, buyerHistory } from '@/db/schema';
import { createBuyerSchema } from '@/validation/buyer';
import { eq } from 'drizzle-orm';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { FormError } from '@/components/form-error';
import { BuyerForm } from '@/components/buyer-form';

export default async function CreateBuyerPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
    const sp = await searchParams;
	async function createAction(formData: FormData) {
  'use server';

  const cookieStore = await cookies(); // ✅ await here
  const cookieVal = cookieStore.get(DEMO_COOKIE)?.value;
  if (!cookieVal) throw new Error('Not authenticated');
  const user = JSON.parse(decodeURIComponent(cookieVal)) as DemoUser;

  // Rate limiting
  const headersList = await headers(); // also await headers()
  const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
  const rateLimitKey = getRateLimitKey(ip, 'create-buyer');
  const rateLimitResult = rateLimit(rateLimitKey, 5, 60 * 1000);
  if (!rateLimitResult.allowed) {
    return { error: 'Too many requests. Please try again later.' };
  }

  const payload = Object.fromEntries(formData.entries());
  const tags = (payload.tags as string | undefined)?.split(',').map((t) => t.trim()).filter(Boolean);
  const parsed = createBuyerSchema.safeParse({ ...payload, tags });
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  const data = parsed.data;
  const [inserted] = await db
    .insert(buyers)
    .values({ ...data, ownerId: user.id, status: data.status ?? 'New' })
    .returning({ id: buyers.id });

  await db.insert(buyerHistory).values({
    buyerId: inserted.id,
    changedBy: user.id,
    diff: { created: true, by: user.id },
  });

  redirect(`/buyers/${inserted.id}`);
}


	return (
		<div className="max-w-2xl mx-auto p-6">
			<h1 className="text-2xl font-semibold mb-4">Create Lead</h1>
			<FormError error={sp.error} className="mb-4" />
			<BuyerForm className="grid grid-cols-1 gap-3">
				<input name="fullName" placeholder="Full name" className="border p-2 bg-white text-black" required />
				<input name="email" placeholder="Email" className="border p-2 bg-white text-black" />
				<input name="phone" placeholder="Phone" className="border p-2 bg-white text-black" required />
				<select name="city" className="border p-2 bg-white text-black" required>
					<option value="">City</option>
					<option>Chandigarh</option>
					<option>Mohali</option>
					<option>Zirakpur</option>
					<option>Panchkula</option>
					<option>Other</option>
				</select>
				<select name="propertyType" className="border p-2 bg-white text-black" required>
					<option value="">Property Type</option>
					<option>Apartment</option>
					<option>Villa</option>
					<option>Plot</option>
					<option>Office</option>
					<option>Retail</option>
				</select>
				<select name="bhk" className="border p-2 bg-white text-black">
					<option value="">BHK (if residential)</option>
					<option>1</option>
					<option>2</option>
					<option>3</option>
					<option>4</option>
					<option>Studio</option>
				</select>
				<select name="purpose" className="border p-2 bg-white text-black" required>
					<option>Buy</option>
					<option>Rent</option>
				</select>
				<input name="budgetMin" placeholder="Budget Min (INR)" className="border p-2 bg-white text-black" />
				<input name="budgetMax" placeholder="Budget Max (INR)" className="border p-2 bg-white text-black" />
				<select name="timeline" className="border p-2 bg-white text-black" required>
					<option>0-3m</option>
					<option>3-6m</option>
					<option>&gt;6m</option>
					<option>Exploring</option>
				</select>
				<select name="source" className="border p-2 bg-white text-black" required>
					<option>Website</option>
					<option>Referral</option>
					<option>Walk-in</option>
					<option>Call</option>
					<option>Other</option>
				</select>
				<textarea name="notes" placeholder="Notes (max 1000 chars)" className="border p-2 bg-white text-black" />
				<input name="tags" placeholder="Tags (comma separated)" className="border p-2 bg-white text-black" />
				<button type="submit" className="bg-black text-white rounded px-4 py-2">Create</button>
			</BuyerForm>
		</div>
	);
}
