interface FormErrorProps {
  error?: any;
  className?: string;
}

export function FormError({ error, className = '' }: FormErrorProps) {
  if (!error) return null;

  // Handle Zod error format
  if (error.fieldErrors) {
    const fieldErrors = Object.entries(error.fieldErrors)
      .filter(([_, errors]) => errors && errors.length > 0)
      .map(([field, errors]) => `${field}: ${(errors as string[]).join(', ')}`)
      .join('; ');

    if (fieldErrors) {
      return (
        <div className={`bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm ${className}`} role="alert" aria-live="assertive">
          <strong>Validation errors:</strong> {fieldErrors}
        </div>
      );
    }
  }

  // Handle simple string error
  if (typeof error === 'string') {
    return (
      <div className={`bg-red-50 border border-red-200 rounded p-3 text-red-700 text-sm ${className}`} role="alert" aria-live="assertive">
        {error}
      </div>
    );
  }

  return null;
}
