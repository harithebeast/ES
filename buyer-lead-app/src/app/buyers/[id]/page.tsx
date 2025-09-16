import { notFound } from 'next/navigation';
import { cookies, headers } from 'next/headers';
import { db } from '@/db/client';
import { buyers, buyerHistory } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { DEMO_COOKIE, type DemoUser } from '@/lib/auth';
import { updateBuyerSchema } from '@/validation/buyer';
import { cityValues, propertyTypeValues, bhkValues, purposeValues, timelineValues, sourceValues, statusValues } from '@/validation/buyer';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';
import { redirect } from 'next/navigation';

async function getBuyer(id: string) {
  const [buyer] = await db.select().from(buyers).where(eq(buyers.id, id));
  if (!buyer) return null;
  
  const history = await db
    .select()
    .from(buyerHistory)
    .where(eq(buyerHistory.buyerId, id))
    .orderBy(desc(buyerHistory.changedAt))
    .limit(5);
    
  return { buyer, history };
}

function formatBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return '-';
  if (!min) return `≤ ${max?.toLocaleString()}`;
  if (!max) return `≥ ${min.toLocaleString()}`;
  return `${min.toLocaleString()} - ${max.toLocaleString()}`;
}

function HistoryItem({ item }: { item: any }) {
  const diff = item.diff as Record<string, any>;
  const changes = Object.entries(diff).filter(([key, value]) => key !== 'created' && key !== 'by');
  
  return (
    <div className="border-l-2 border-gray-200 pl-4 py-2">
      <div className="text-sm text-gray-600">
        {item.changedAt.toLocaleString()}
      </div>
      {changes.length > 0 ? (
        <div className="text-sm">
          {changes.map(([field, value]) => (
            <div key={field}>
              <span className="font-medium">{field}:</span> {String(value)}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">Created</div>
      )}
    </div>
  );
}

export default async function BuyerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(DEMO_COOKIE)?.value;
  if (!cookieVal) throw new Error('Not authenticated');
  const user = JSON.parse(decodeURIComponent(cookieVal)) as DemoUser;

  const p = await params;
  const data = await getBuyer(p.id);
  if (!data) notFound();
  
  const { buyer, history } = data;

  async function updateAction(formData: FormData) {
    'use server';
    
    // Check ownership
    if (buyer.ownerId !== user.id) {
      return { error: 'You can only edit your own leads' };
    }
    
    // Rate limiting
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const rateLimitKey = getRateLimitKey(ip, 'update-buyer');
    const rateLimitResult = rateLimit(rateLimitKey, 10, 60 * 1000); // 10 requests per minute
    
    if (!rateLimitResult.allowed) {
      return { error: 'Too many requests. Please try again later.' };
    }
    
    const payload = Object.fromEntries(formData.entries());
    const tags = (payload.tags as string | undefined)?.split(',').map((t) => t.trim()).filter(Boolean);
    const updatedAt = payload.updatedAt as string;
    
    // Check concurrency
    if (new Date(updatedAt).getTime() !== buyer.updatedAt.getTime()) {
      return { error: 'Record changed, please refresh' };
    }
    
    const parsed = updateBuyerSchema.safeParse({ 
      ...payload, 
      tags, 
      id: buyer.id,
      updatedAt: buyer.updatedAt.toISOString()
    });
    
    if (!parsed.success) {
      return { error: parsed.error.flatten() };
    }
    
    const data = parsed.data;
    
    // Calculate diff
    const diff: Record<string, any> = {};
    if (data.fullName !== buyer.fullName) diff.fullName = data.fullName;
    if (data.email !== buyer.email) diff.email = data.email;
    if (data.phone !== buyer.phone) diff.phone = data.phone;
    if (data.city !== buyer.city) diff.city = data.city;
    if (data.propertyType !== buyer.propertyType) diff.propertyType = data.propertyType;
    if (data.bhk !== buyer.bhk) diff.bhk = data.bhk;
    if (data.purpose !== buyer.purpose) diff.purpose = data.purpose;
    if (data.budgetMin !== buyer.budgetMin) diff.budgetMin = data.budgetMin;
    if (data.budgetMax !== buyer.budgetMax) diff.budgetMax = data.budgetMax;
    if (data.timeline !== buyer.timeline) diff.timeline = data.timeline;
    if (data.source !== buyer.source) diff.source = data.source;
    if (data.status !== buyer.status) diff.status = data.status;
    if (data.notes !== buyer.notes) diff.notes = data.notes;
    if (JSON.stringify(data.tags) !== JSON.stringify(buyer.tags)) diff.tags = data.tags;
    
    // Update buyer
    await db
      .update(buyers)
      .set({
        fullName: data.fullName,
        email: data.email,
        phone: data.phone,
        city: data.city,
        propertyType: data.propertyType,
        bhk: data.bhk,
        purpose: data.purpose,
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        timeline: data.timeline,
        source: data.source,
        status: data.status,
        notes: data.notes,
        tags: data.tags,
        updatedAt: new Date(),
      })
      .where(eq(buyers.id, buyer.id));
    
    // Add history entry if there are changes
    if (Object.keys(diff).length > 0) {
      await db.insert(buyerHistory).values({
        buyerId: buyer.id,
        changedBy: user.id,
        diff,
      });
    }
    
    return { success: true };
  }

  async function deleteAction() {
    'use server';

    // Ownership check
    if (buyer.ownerId !== user.id) {
      return { error: 'You can only delete your own leads' };
    }

    // Rate limit
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const rateKey = getRateLimitKey(ip, 'delete-buyer');
    const rl = rateLimit(rateKey, 5, 60 * 1000);
    if (!rl.allowed) {
      return { error: 'Too many requests. Please try again later.' };
    }

    // Delete buyer (history cascades)
    await db.delete(buyers).where(eq(buyers.id, buyer.id));
    redirect('/buyers');
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">{buyer.fullName}</h1>
        <div className="text-sm text-gray-600">
          Owner: {buyer.ownerId === user.id ? 'You' : 'Other'}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div>
          <h2 className="text-lg font-semibold mb-4">Edit Lead</h2>
          <form
  className="space-y-4"
  action={async (formData: FormData) => {
    'use server';
    const payload = Object.fromEntries(formData.entries());
    try {
      const parsed = updateBuyerSchema.safeParse(payload);
      if (!parsed.success) {
        alert('Validation failed');
        return;
      }
      // Do DB update here...
      await db.update(buyers).set({ fullName: parsed.data.fullName }).where(eq(buyers.id, buyer.id));
      alert('Lead updated successfully');
    } catch (err) {
      alert('Update failed: ' + (err as Error).message);
    }
  }}
>
            <input type="hidden" name="id" value={buyer.id} />
            <input type="hidden" name="updatedAt" value={buyer.updatedAt.toISOString()} />
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input 
                  name="fullName" 
                  defaultValue={buyer.fullName}
                  className="w-full border p-2 rounded bg-white text-black" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input 
                  name="email" 
                  defaultValue={buyer.email || ''}
                  className="w-full border p-2 rounded bg-white text-black" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input 
                  name="phone" 
                  defaultValue={buyer.phone}
                  className="w-full border p-2 rounded bg-white text-black" 
                  required 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City</label>
                <select name="city" defaultValue={buyer.city} className="w-full border p-2 rounded bg-white text-black">
                  {cityValues.map(city => (
                    <option key={city} value={city}>{city}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Property Type</label>
                <select name="propertyType" defaultValue={buyer.propertyType} className="w-full border p-2 rounded bg-white text-black">
                  {propertyTypeValues.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">BHK</label>
                <select name="bhk" defaultValue={buyer.bhk || ''} className="w-full border p-2 rounded bg-white text-black">
                  <option value="">Select BHK</option>
                  {bhkValues.map(bhk => (
                    <option key={bhk} value={bhk}>{bhk}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Purpose</label>
                <select name="purpose" defaultValue={buyer.purpose} className="w-full border p-2 rounded bg-white text-black">
                  {purposeValues.map(purpose => (
                    <option key={purpose} value={purpose}>{purpose}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Timeline</label>
                <select name="timeline" defaultValue={buyer.timeline} className="w-full border p-2 rounded bg-white text-black">
                  {timelineValues.map(timeline => (
                    <option key={timeline} value={timeline}>{timeline}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Budget Min (INR)</label>
                <input 
                  name="budgetMin" 
                  type="number"
                  defaultValue={buyer.budgetMin || ''}
                  className="w-full border p-2 rounded bg-white text-black" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Budget Max (INR)</label>
                <input 
                  name="budgetMax" 
                  type="number"
                  defaultValue={buyer.budgetMax || ''}
                  className="w-full border p-2 rounded bg-white text-black" 
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Source</label>
                <select name="source" defaultValue={buyer.source} className="w-full border p-2 rounded bg-white text-black">
                  {sourceValues.map(source => (
                    <option key={source} value={source}>{source}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Status</label>
                <select name="status" defaultValue={buyer.status} className="w-full border p-2 rounded bg-white text-black">
                  {statusValues.map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Notes</label>
              <textarea 
                name="notes" 
                defaultValue={buyer.notes || ''}
                className="w-full border p-2 rounded bg-white text-black" 
                rows={3}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">Tags (comma separated)</label>
              <input 
                name="tags" 
                defaultValue={buyer.tags?.join(', ') || ''}
                className="w-full border p-2 rounded" 
              />
            </div>
            
            <div className="flex gap-3">
              <button 
                type="submit" 
                className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
              >
                Update Lead
              </button>
              <button
                type="submit"
                className="bg-red-600 text-white px-6 py-2 rounded hover:bg-red-700"
                formAction={deleteAction}
              >
                Delete
              </button>
            </div>
          </form>
        </div>
        
        <div>
          <h2 className="text-lg font-semibold mb-4">Lead Details</h2>
          <div className="bg-white text-black p-4 rounded border space-y-2">
            <div><strong>Phone:</strong> {buyer.phone}</div>
            <div><strong>Email:</strong> {buyer.email || 'Not provided'}</div>
            <div><strong>City:</strong> {buyer.city}</div>
            <div><strong>Property:</strong> {buyer.propertyType} {buyer.bhk && `(${buyer.bhk} BHK)`}</div>
            <div><strong>Purpose:</strong> {buyer.purpose}</div>
            <div><strong>Budget:</strong> {formatBudget(buyer.budgetMin, buyer.budgetMax)}</div>
            <div><strong>Timeline:</strong> {buyer.timeline}</div>
            <div><strong>Source:</strong> {buyer.source}</div>
            <div><strong>Status:</strong> {buyer.status}</div>
            <div><strong>Updated:</strong> {buyer.updatedAt.toLocaleString()}</div>
            {buyer.tags && buyer.tags.length > 0 && (
              <div><strong>Tags:</strong> {buyer.tags.join(', ')}</div>
            )}
            {buyer.notes && (
              <div><strong>Notes:</strong> {buyer.notes}</div>
            )}
          </div>
          
          <h3 className="text-lg font-semibold mt-8 mb-4">Recent Changes</h3>
          <div className="space-y-2">
            {history.map(item => (
              <HistoryItem key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
