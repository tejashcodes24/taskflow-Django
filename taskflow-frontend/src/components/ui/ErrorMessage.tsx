import { AlertCircle } from 'lucide-react';
import { Button } from './Button';

interface ErrorMessageProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({
  message = 'Something went wrong.',
  onRetry,
}: ErrorMessageProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 h-64 text-center">
      <AlertCircle className="text-red-400" size={40} />
      <p className="text-slate-400 text-sm">{message}</p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}