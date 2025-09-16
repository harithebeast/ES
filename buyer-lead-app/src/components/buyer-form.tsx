'use client';

import { useRef, useState } from 'react';
import { createBuyerSchema } from '@/validation/buyer';

type BuyerFormProps = {
  children: React.ReactNode;
  className?: string;
};

export function BuyerForm({ children, className }: BuyerFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [errorText, setErrorText] = useState<string | null>(null);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const fd = new FormData(form);
    
    const raw = Object.fromEntries(fd.entries());
    const tags = (raw.tags as string | undefined)?.split(',').map((t) => t.trim()).filter(Boolean);
    const payload = {
      ...raw,
      tags,
        
      budgetMin: raw.budgetMin as string,
      budgetMax: raw.budgetMax as string,
    } as Record<string, unknown>;

    const parsed = createBuyerSchema.safeParse(payload);
    if (!parsed.success) {
      const msg = Object.entries(parsed.error.flatten().fieldErrors)
        .filter(([, v]) => v && v.length)
        .map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`)
        .join('; ');
      setErrorText(msg || 'Please fix the highlighted errors.');
      return;
    }

    setErrorText(null);
    // Submit to server action
    formRef.current?.requestSubmit();
  }

  return (
    <form ref={formRef} className={className} onSubmit={onSubmit} noValidate aria-describedby="form-error" aria-live="polite">
      {errorText && (
        <div id="form-error" className="mb-3 rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700" role="alert">
          {errorText}
        </div>
      )}
      {children}
    </form>
  );
}


