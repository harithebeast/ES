import { Suspense } from 'react';
import Link from 'next/link';
import { cookies } from 'next/headers';
import { db } from '@/src/db/client';
import { buyers } from '@/src/db/schema';
import { eq, and, desc, ilike, or, sql } from 'drizzle-orm';
import { DEMO_COOKIE, type DemoUser } from '@/src/lib/auth';
import { cityValues, propertyTypeValues, statusValues, timelineValues } from '@/src/validation/buyer';

type SearchParams = {
  page?: string;
  search?: string;
  city?: string;
  propertyType?: string;
  status?: string;
  timeline?: string;
  sort?: string;
};

async function getBuyers(params: SearchParams) {
  const page = Math.max(1, parseInt(params.page || '1'));
  const limit = 10;
  const offset = (page - 1) * limit;
  
  const search = params.search?.trim();
  const city = params.city;
  const propertyType = params.propertyType;
  const status = params.status;
  const timeline = params.timeline;
  const sort = params.sort || 'updatedAt-desc';

  let whereConditions = [];
  
  if (search) {
    whereConditions.push(
      or(
        ilike(buyers.fullName, `%${search}%`),
        ilike(buyers.phone, `%${search}%`),
        ilike(buyers.email, `%${search}%`)
      )!
    );
  }
  
  if (city) whereConditions.push(eq(buyers.city, city as any));
  if (propertyType) whereConditions.push(eq(buyers.propertyType, propertyType as any));
  if (status) whereConditions.push(eq(buyers.status, status as any));
  if (timeline) whereConditions.push(eq(buyers.timeline, timeline as any));

  const where = whereConditions.length > 0 ? and(...whereConditions) : undefined;

  let orderBy;
  if (sort === 'name-asc') orderBy = buyers.fullName;
  else if (sort === 'name-desc') orderBy = desc(buyers.fullName);
  else if (sort === 'updatedAt-asc') orderBy = buyers.updatedAt;
  else orderBy = desc(buyers.updatedAt);

  const [results, countResult] = await Promise.all([
    db
      .select()
      .from(buyers)
      .where(where)
      .orderBy(orderBy)
      .limit(limit)
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)` })
      .from(buyers)
      .where(where)
  ]);

  const total = countResult[0]?.count || 0;
  const totalPages = Math.ceil(total / limit);

  return { results, pagination: { page, limit, total, totalPages } };
}

function formatBudget(min?: number | null, max?: number | null) {
  if (!min && !max) return '-';
  if (!min) return `≤ ${max?.toLocaleString()}`;
  if (!max) return `≥ ${min.toLocaleString()}`;
  return `${min.toLocaleString()} - ${max.toLocaleString()}`;
}

function FilterForm({ searchParams }: { searchParams: SearchParams }) {
  return (
    <form method="GET" className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
      <input
        name="search"
        placeholder="Search name, phone, email"
        defaultValue={searchParams.search}
        className="border p-2"
      />
      <select name="city" defaultValue={searchParams.city} className="border p-2">
        <option value="">All Cities</option>
        {cityValues.map(city => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
      <select name="propertyType" defaultValue={searchParams.propertyType} className="border p-2">
        <option value="">All Types</option>
        {propertyTypeValues.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <select name="status" defaultValue={searchParams.status} className="border p-2">
        <option value="">All Status</option>
        {statusValues.map(status => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
      <select name="timeline" defaultValue={searchParams.timeline} className="border p-2">
        <option value="">All Timelines</option>
        {timelineValues.map(timeline => (
          <option key={timeline} value={timeline}>{timeline}</option>
        ))}
      </select>
      <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
        Filter
      </button>
    </form>
  );
}

function Pagination({ pagination, searchParams }: { pagination: any, searchParams: SearchParams }) {
  const { page, totalPages } = pagination;
  const params = new URLSearchParams(searchParams as any);
  
  return (
    <div className="flex justify-between items-center mt-6">
      <div className="text-sm text-gray-600">
        Page {page} of {totalPages} ({pagination.total} total)
      </div>
      <div className="flex gap-2">
        {page > 1 && (
          <Link
            href={`/buyers?${new URLSearchParams({ ...params, page: (page - 1).toString() })}`}
            className="px-3 py-1 border rounded"
          >
            Previous
          </Link>
        )}
        {page < totalPages && (
          <Link
            href={`/buyers?${new URLSearchParams({ ...params, page: (page + 1).toString() })}`}
            className="px-3 py-1 border rounded"
          >
            Next
          </Link>
        )}
      </div>
    </div>
  );
}

async function CSVExportButton({ searchParams }: { searchParams: SearchParams }) {
  const { results } = await getBuyers(searchParams);
  
  const csvData = results.map(buyer => ({
    fullName: buyer.fullName,
    email: buyer.email || '',
    phone: buyer.phone,
    city: buyer.city,
    propertyType: buyer.propertyType,
    bhk: buyer.bhk || '',
    purpose: buyer.purpose,
    budgetMin: buyer.budgetMin || '',
    budgetMax: buyer.budgetMax || '',
    timeline: buyer.timeline,
    source: buyer.source,
    status: buyer.status,
    notes: buyer.notes || '',
    tags: buyer.tags?.join(',') || '',
    updatedAt: buyer.updatedAt.toISOString(),
  }));

  const csvContent = [
    'fullName,email,phone,city,propertyType,bhk,purpose,budgetMin,budgetMax,timeline,source,status,notes,tags,updatedAt',
    ...csvData.map(row => Object.values(row).map(val => `"${val}"`).join(','))
  ].join('\n');

  return (
    <form action="/api/export-csv" method="POST" className="inline">
      <input type="hidden" name="data" value={csvContent} />
      <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded">
        Export CSV
      </button>
    </form>
  );
}

export default async function BuyersPage({ searchParams }: { searchParams: SearchParams }) {
  const cookieVal = cookies().get(DEMO_COOKIE)?.value;
  if (!cookieVal) throw new Error('Not authenticated');
  const user = JSON.parse(decodeURIComponent(cookieVal)) as DemoUser;

  const { results, pagination } = await getBuyers(searchParams);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Buyer Leads</h1>
        <div className="flex gap-2">
          <Link href="/buyers/new" className="bg-blue-600 text-white px-4 py-2 rounded">
            New Lead
          </Link>
          <Suspense fallback={<div>Loading...</div>}>
            <CSVExportButton searchParams={searchParams} />
          </Suspense>
          <Link href="/buyers/import" className="bg-green-600 text-white px-4 py-2 rounded">
            Import CSV
          </Link>
        </div>
      </div>

      <FilterForm searchParams={searchParams} />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-50">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Phone</th>
              <th className="border p-2 text-left">City</th>
              <th className="border p-2 text-left">Property</th>
              <th className="border p-2 text-left">Budget</th>
              <th className="border p-2 text-left">Timeline</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Updated</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {results.map(buyer => (
              <tr key={buyer.id}>
                <td className="border p-2">{buyer.fullName}</td>
                <td className="border p-2">{buyer.phone}</td>
                <td className="border p-2">{buyer.city}</td>
                <td className="border p-2">
                  {buyer.propertyType}
                  {buyer.bhk && ` (${buyer.bhk} BHK)`}
                </td>
                <td className="border p-2">{formatBudget(buyer.budgetMin, buyer.budgetMax)}</td>
                <td className="border p-2">{buyer.timeline}</td>
                <td className="border p-2">
                  <span className={`px-2 py-1 rounded text-xs ${
                    buyer.status === 'New' ? 'bg-gray-100' :
                    buyer.status === 'Qualified' ? 'bg-blue-100' :
                    buyer.status === 'Converted' ? 'bg-green-100' :
                    buyer.status === 'Dropped' ? 'bg-red-100' :
                    'bg-yellow-100'
                  }`}>
                    {buyer.status}
                  </span>
                </td>
                <td className="border p-2 text-sm text-gray-600">
                  {buyer.updatedAt.toLocaleDateString()}
                </td>
                <td className="border p-2">
                  <Link 
                    href={`/buyers/${buyer.id}`}
                    className="text-blue-600 hover:underline"
                  >
                    View/Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No buyers found. <Link href="/buyers/new" className="text-blue-600">Create your first lead</Link>
        </div>
      )}

      <Pagination pagination={pagination} searchParams={searchParams} />
    </div>
  );
}
