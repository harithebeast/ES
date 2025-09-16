import { Suspense } from 'react';
import Link from 'next/link';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { cookies } from 'next/headers';
import { db } from '@/db/client';
import { buyers } from '@/db/schema';
import { eq, and, desc, ilike, or, sql } from 'drizzle-orm';
import { DEMO_COOKIE, type DemoUser } from '@/lib/auth';
import { cityValues, propertyTypeValues, statusValues, timelineValues } from '@/validation/buyer';

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
        className="border p-2 bg-white text-black"
      />
      <select name="city" defaultValue={searchParams.city} className="border p-2 bg-white text-black">
        <option value="">All Cities</option>
        {cityValues.map(city => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>
      <select name="propertyType" defaultValue={searchParams.propertyType} className="border p-2 bg-white text-black">
        <option value="">All Types</option>
        {propertyTypeValues.map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <select name="status" defaultValue={searchParams.status} className="border p-2 bg-white text-black">
        <option value="">All Status</option>
        {statusValues.map(status => (
          <option key={status} value={status}>{status}</option>
        ))}
      </select>
      <select name="timeline" defaultValue={searchParams.timeline} className="border p-2 bg-white text-black">
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

export default async function BuyersPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const sp = await searchParams;
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(DEMO_COOKIE)?.value;
  if (!cookieVal) throw new Error('Not authenticated');
  const user = JSON.parse(decodeURIComponent(cookieVal)) as DemoUser;

  const { results, pagination } = await getBuyers(sp);

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Buyer Leads</h1>
        <div className="flex gap-2">
          <Link href="/buyers/new" className="bg-blue-600 text-white px-4 py-2 rounded">
            New Lead
          </Link>
          <Suspense fallback={<div>Loading...</div>}>
            <CSVExportButton searchParams={sp} />
          </Suspense>
          <Link href="/buyers/import" className="bg-green-600 text-white px-4 py-2 rounded">
            Import CSV
          </Link>
        </div>
      </div>

      <FilterForm searchParams={sp} />

      <TableContainer component={Paper} sx={{ backgroundColor: '#111', color: '#fff' }}>
        <Table size="small" aria-label="buyers table" sx={{ '& td, & th': { borderColor: '#333' } }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#f3f4f6' }}>
              <TableCell sx={{ color: '#000', fontWeight: 600 }}>Name</TableCell>
              <TableCell sx={{ color: '#000', fontWeight: 600 }}>Phone</TableCell>
              <TableCell sx={{ color: '#000', fontWeight: 600 }}>City</TableCell>
              <TableCell sx={{ color: '#000', fontWeight: 600 }}>Property</TableCell>
              <TableCell sx={{ color: '#000', fontWeight: 600 }}>Budget</TableCell>
              <TableCell sx={{ color: '#000', fontWeight: 600 }}>Timeline</TableCell>
              <TableCell sx={{ color: '#000', fontWeight: 600 }}>Status</TableCell>
              <TableCell sx={{ color: '#000', fontWeight: 600 }}>Updated</TableCell>
              <TableCell sx={{ color: '#000', fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {results.map((buyer) => (
              <TableRow key={buyer.id} sx={{ backgroundColor: '#111' }}>
                <TableCell sx={{ color: '#fff' }}>{buyer.fullName}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{buyer.phone}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{buyer.city}</TableCell>
                <TableCell sx={{ color: '#fff' }}>
                  {buyer.propertyType}
                  {buyer.bhk && ` (${buyer.bhk} BHK)`}
                </TableCell>
                <TableCell sx={{ color: '#fff' }}>{formatBudget(buyer.budgetMin, buyer.budgetMax)}</TableCell>
                <TableCell sx={{ color: '#fff' }}>{buyer.timeline}</TableCell>
                <TableCell sx={{ color: '#111' }}>
                  <span className={`px-2 py-1 rounded text-xs ${
                    buyer.status === 'New' ? 'bg-gray-100' :
                    buyer.status === 'Qualified' ? 'bg-blue-100' :
                    buyer.status === 'Converted' ? 'bg-green-100' :
                    buyer.status === 'Dropped' ? 'bg-red-100' :
                    'bg-yellow-100'
                  }`}>
                    {buyer.status}
                  </span>
                </TableCell>
                <TableCell sx={{ color: '#9ca3af', fontSize: '0.85rem' }}>
                  {buyer.updatedAt.toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Link href={`/buyers/${buyer.id}`} className="text-blue-300 hover:underline">
                    View/Edit
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {results.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No buyers found. <Link href="/buyers/new" className="text-blue-600">Create your first lead</Link>
        </div>
      )}

      <Pagination pagination={pagination} searchParams={sp} />
    </div>
  );
}
