import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({ message, onRetry, className = '' }: ErrorMessageProps) {
  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center">
        <AlertCircle className="h-5 w-5 text-red-500 mr-3" />
        <div className="flex-1">
          <h3 className="text-sm font-medium text-red-800">Erro</h3>
          <p className="text-sm text-red-700 mt-1">{message}</p>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="ml-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded-md text-sm font-medium transition-colors duration-200 flex items-center"
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Tentar novamente
          </button>
        )}
      </div>
    </div>
  );
}