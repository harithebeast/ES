import { cookies } from 'next/headers';
import { DEMO_COOKIE, type DemoUser } from '@/lib/auth';
import Link from 'next/link';

type ImportError = {
  row: number;
  message: string;
};

type SearchParams = {
  success?: string;
  imported?: string;
  errors?: string;
  error?: string;
};

export default async function ImportResultPage({ searchParams }: { searchParams: SearchParams }) {
  const cookieVal = cookies().get(DEMO_COOKIE)?.value;
  if (!cookieVal) throw new Error('Not authenticated');
  const user = JSON.parse(decodeURIComponent(cookieVal)) as DemoUser;

  const success = searchParams.success === 'true';
  const imported = parseInt(searchParams.imported || '0');
  const error = searchParams.error;
  const errors: ImportError[] = searchParams.errors ? JSON.parse(decodeURIComponent(searchParams.errors)) : [];

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Import Result</h1>
      
      {success && (
        <div className="bg-green-50 border border-green-200 rounded p-4 mb-6">
          <h2 className="text-green-800 font-semibold mb-2">Import Successful!</h2>
          <p className="text-green-700">Successfully imported {imported} leads.</p>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
          <h2 className="text-red-800 font-semibold mb-2">Import Failed</h2>
          <p className="text-red-700">{error}</p>
        </div>
      )}
      
      {errors.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
          <h2 className="text-yellow-800 font-semibold mb-2">Validation Errors</h2>
          <p className="text-yellow-700 mb-3">
            {imported > 0 ? `Imported ${imported} valid rows, but found errors in ${errors.length} rows:` : `Found errors in ${errors.length} rows:`}
          </p>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Row</th>
                  <th className="text-left p-2">Error</th>
                </tr>
              </thead>
              <tbody>
                {errors.map((err, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-2 font-mono">{err.row}</td>
                    <td className="p-2 text-red-600">{err.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div className="flex gap-4">
        <Link 
          href="/buyers" 
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          View All Leads
        </Link>
        <Link 
          href="/buyers/import" 
          className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
        >
          Import Another File
        </Link>
      </div>
    </div>
  );
}
