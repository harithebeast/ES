import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen p-8 flex items-center justify-center">
      <main className="max-w-xl w-full space-y-6 text-center">
        <h1 className="text-3xl font-semibold">Buyer Lead Intake</h1>
        <p className="text-gray-600">Capture, manage, search, and import/export buyer leads.</p>
        <div className="flex gap-3 justify-center">
          <Link href="/demio-login" className="px-4 py-2 rounded border">Demo Login</Link>
          <Link href="/buyers" className="px-4 py-2 rounded border">View Buyers</Link>
          <Link href="/buyers/new" className="px-4 py-2 rounded border">Create Lead</Link>
        </div>
      </main>
    </div>
  );
}
