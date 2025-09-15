import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const csvData = formData.get('data') as string;
    
    if (!csvData) {
      return NextResponse.json({ error: 'No data provided' }, { status: 400 });
    }

    const filename = `buyers-export-${new Date().toISOString().split('T')[0]}.csv`;
    
    return new NextResponse(csvData, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}
