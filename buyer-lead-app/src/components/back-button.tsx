'use client';

import { useRouter } from 'next/navigation';

type BackButtonProps = {
  label?: string;
  className?: string;
};

export function BackButton({ label = 'Back', className = '' }: BackButtonProps) {
  const router = useRouter();
  return (
    <button
      type="button"
      onClick={() => router.back()}
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded border bg-white text-black hover:bg-gray-100 ${className}`}
    >
      ← {label}
    </button>
  );
}


