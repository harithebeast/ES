import { NextRequest, NextResponse } from 'next/server';
import { cookies, headers } from 'next/headers';
import { DEMO_COOKIE, type DemoUser } from '@/lib/auth';
import { createBuyerSchema } from '@/validation/buyer';
import { db } from '@/db/client';
import { buyers, buyerHistory } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { rateLimit, getRateLimitKey } from '@/lib/rate-limit';

type ImportError = {
  row: number;
  message: string;
};

async function parseCSV(csvContent: string): Promise<{ data: any[], errors: ImportError[] }> {
  const lines = csvContent.trim().split('\n');
  if (lines.length < 2) {
    return { data: [], errors: [{ row: 0, message: 'CSV must have at least a header and one data row' }] };
  }
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const expectedHeaders = [
    'fullName', 'email', 'phone', 'city', 'propertyType', 'bhk', 'purpose',
    'budgetMin', 'budgetMax', 'timeline', 'source', 'notes', 'tags', 'status'
  ];
  
  const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
  if (missingHeaders.length > 0) {
    return { 
      data: [], 
      errors: [{ row: 0, message: `Missing headers: ${missingHeaders.join(', ')}` }] 
    };
  }
  
  const data: any[] = [];
  const errors: ImportError[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
    if (values.length !== headers.length) {
      errors.push({ row: i + 1, message: `Expected ${headers.length} columns, got ${values.length}` });
      continue;
    }
    
    const row: any = {};
    headers.forEach((header, idx) => {
      let value = values[idx];
      
      // Parse specific fields
      if (header === 'budgetMin' || header === 'budgetMax') {
        value = value ? parseInt(value) : undefined;
      } else if (header === 'tags') {
        value = value ? value.split(',').map((t: string) => t.trim()).filter(Boolean) : undefined;
      } else if (header === 'email' && !value) {
        value = undefined;
      }
      
      row[header] = value;
    });
    
    // Validate the row
    const parsed = createBuyerSchema.safeParse(row);
    if (!parsed.success) {
      const fieldErrors = Object.entries(parsed.error.flatten().fieldErrors)
        .map(([field, errors]) => `${field}: ${errors?.join(', ')}`)
        .join('; ');
      errors.push({ row: i + 1, message: fieldErrors });
      continue;
    }
    
    data.push(parsed.data);
  }
  
  return { data, errors };
}

export async function POST(request: NextRequest) {
  try {
    const cookieVal = cookies().get(DEMO_COOKIE)?.value;
    if (!cookieVal) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    const user = JSON.parse(decodeURIComponent(cookieVal)) as DemoUser;
    
    // Rate limiting
    const headersList = headers();
    const ip = headersList.get('x-forwarded-for') || headersList.get('x-real-ip') || 'unknown';
    const rateLimitKey = getRateLimitKey(ip, 'import-csv');
    const rateLimitResult = rateLimit(rateLimitKey, 3, 60 * 1000); // 3 imports per minute
    
    if (!rateLimitResult.allowed) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many import requests. Please try again later.' 
      }, { status: 429 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    
    if (file.size > 1024 * 1024) { // 1MB limit
      return NextResponse.json({ error: 'File too large (max 1MB)' }, { status: 400 });
    }
    
    const csvContent = await file.text();
    const { data, errors } = await parseCSV(csvContent);
    
    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        errors, 
        imported: 0 
      });
    }
    
    if (data.length > 200) {
      return NextResponse.json({ 
        success: false, 
        error: 'Too many rows (max 200)' 
      }, { status: 400 });
    }
    
    if (data.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: 'No valid data to import' 
      }, { status: 400 });
    }
    
    // Import in transaction
    try {
      const imported = [];
      for (const buyerData of data) {
        const [inserted] = await db
          .insert(buyers)
          .values({
            ...buyerData,
            ownerId: user.id,
          })
          .returning({ id: buyers.id });
          
        await db.insert(buyerHistory).values({
          buyerId: inserted.id,
          changedBy: user.id,
          diff: { created: true, by: user.id },
        });
        
        imported.push(inserted.id);
      }
      
      return NextResponse.json({ 
        success: true, 
        imported: imported.length 
      });
    } catch (error) {
      return NextResponse.json({ 
        success: false, 
        error: 'Import failed: ' + (error as Error).message 
      }, { status: 500 });
    }
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}
