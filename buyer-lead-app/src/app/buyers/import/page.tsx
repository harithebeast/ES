import { cookies } from "next/headers";
import { DEMO_COOKIE, type DemoUser } from "@/lib/auth";
import { createBuyerSchema } from "@/validation/buyer";
import { db } from "@/db/client";
import { buyers, buyerHistory } from "@/db/schema";

type ImportError = { row: number; message: string };

async function parseCSV(csvContent: string): Promise<{ data: any[]; errors: ImportError[] }> {
  const lines = csvContent.trim().split("\n");
  if (lines.length < 2) return { data: [], errors: [{ row: 0, message: "CSV must have at least a header and one data row" }] };

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
  const expectedHeaders = [
    "fullName","email","phone","city","propertyType","bhk","purpose",
    "budgetMin","budgetMax","timeline","source","notes","tags","status"
  ];

  const missingHeaders = expectedHeaders.filter((h) => !headers.includes(h));
  if (missingHeaders.length > 0) return { data: [], errors: [{ row: 0, message: `Missing headers: ${missingHeaders.join(", ")}` }] };

  const data: any[] = [];
  const errors: ImportError[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    if (values.length !== headers.length) {
      errors.push({ row: i + 1, message: `Expected ${headers.length} columns, got ${values.length}` });
      continue;
    }

    const row: Record<string, unknown> = {};
    headers.forEach((header, idx) => {
      const raw = values[idx];
      if (header === "budgetMin" || header === "budgetMax") row[header] = raw ? parseInt(raw, 10) : undefined;
      else if (header === "tags") row[header] = raw ? raw.split(",").map((t) => t.trim()).filter(Boolean) : undefined;
      else if (header === "email" && !raw) row[header] = undefined;
      else row[header] = raw;
    });

    const parsed = createBuyerSchema.safeParse(row);
    if (!parsed.success) {
      const fieldErrors = Object.entries(parsed.error.flatten().fieldErrors)
        .map(([field, errs]) => `${field}: ${errs?.join(", ")}`)
        .join("; ");
      errors.push({ row: i + 1, message: fieldErrors });
      continue;
    }

    data.push(parsed.data);
  }

  return { data, errors };
}

export default async function ImportPage() {
  const cookieStore = await cookies();
  const cookieVal = cookieStore.get(DEMO_COOKIE)?.value;
  if (!cookieVal) throw new Error("Not authenticated");
  const user = JSON.parse(decodeURIComponent(cookieVal)) as DemoUser;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-6">Import CSV</h1>

      <div className="bg-black border border-blue-200 rounded p-4 mb-6">
        <h2 className="font-semibold mb-2">CSV Format Requirements:</h2>
        <ul className="text-sm space-y-1">
          <li>• Headers: fullName, email, phone, city, propertyType, bhk, purpose, budgetMin, budgetMax, timeline, source, notes, tags, status</li>
          <li>• phone: 10-15 digits, required</li>
          <li>• city: Chandigarh, Mohali, Zirakpur, Panchkula, Other</li>
          <li>• propertyType: Apartment, Villa, Plot, Office, Retail</li>
          <li>• bhk: 1, 2, 3, 4, Studio (required for Apartment/Villa)</li>
          <li>• purpose: Buy, Rent</li>
          <li>• timeline: 0-3m, 3-6m, &gt;6m, Exploring</li>
          <li>• source: Website, Referral, Walk-in, Call, Other</li>
          <li>• status: New, Qualified, Contacted, Visited, Negotiation, Converted, Dropped</li>
          <li>• budgetMin/budgetMax: numbers in INR</li>
          <li>• tags: comma-separated values</li>
          <li>• Max 200 rows, 1MB file size</li>
        </ul>
      </div>

      <form
        className="space-y-4"
        action={async (formData: FormData) => {
          "use server";
          const file = formData.get("file") as File;
          if (!file) return alert("No file provided");
          if (file.size > 1024 * 1024) return alert("File too large (max 1MB)");

          const { data, errors } = await parseCSV(await file.text());

          if (errors.length > 0) return alert(errors.map(e => `Row ${e.row}: ${e.message}`).join("\n"));
          if (data.length > 200) return alert("Too many rows (max 200)");
          if (data.length === 0) return alert("No valid data to import");

          try {
            for (const buyerData of data) {
              const [inserted] = await db.insert(buyers).values({ ...buyerData, ownerId: user.id }).returning({ id: buyers.id });
              await db.insert(buyerHistory).values({ buyerId: inserted.id, changedBy: user.id, diff: { created: true, by: user.id } });
            }
            alert(`Imported ${data.length} rows successfully!`);
          } catch (err) {
            alert("Import failed: " + (err as Error).message);
          }
        }}
      >
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-2">Select CSV File</label>
          <input type="file" id="file" name="file" accept=".csv" required className="w-full border p-2 rounded" />
        </div>

        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700">
          Import CSV
        </button>
      </form>
    </div>
  );
}
