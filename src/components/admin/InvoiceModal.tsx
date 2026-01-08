import { X, FileText } from 'lucide-react';
import InvoiceView from './InvoiceView';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  consumerId?: string;
  invoiceUrl?: string; // Mantido para compatibilidade, mas não será usado
  invoiceFileName?: string;
  invoiceUploadedAt?: string;
  invoiceScannedData?: {
    text?: string;
    confidence?: number;
    extractedData?: {
      ucNumber?: string;
      consumption?: number;
      value?: number;
      dueDate?: string;
    };
  };
  consumerName?: string;
}

export default function InvoiceModal({
  isOpen,
  onClose,
  consumerId,
  invoiceUrl,
  invoiceFileName,
  invoiceUploadedAt,
  invoiceScannedData,
  consumerName
}: InvoiceModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <FileText className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  Fatura do Consumidor
                </h2>
                {consumerName && (
                  <p className="text-blue-100 text-sm mt-1">{consumerName}</p>
                )}
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors duration-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-100px)] p-6">
          <InvoiceView
            consumerId={consumerId}
            invoiceUrl={invoiceUrl}
            invoiceFileName={invoiceFileName}
            invoiceUploadedAt={invoiceUploadedAt}
            invoiceScannedData={invoiceScannedData}
          />
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

