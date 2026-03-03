import React from 'react';
import Modal, { ModalFooter } from './Modal';
import Button from './Button';
import { ExternalLink, Loader2 } from 'lucide-react';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentTitle?: string;
}

export default function DocumentPreviewModal({
  isOpen,
  onClose,
  documentUrl,
  documentTitle = 'Visualizar Documento'
}: DocumentPreviewModalProps) {
  if (!isOpen) return null;

  const isImage = documentUrl?.match(/\.(jpeg|jpg|gif|png|webp|bmp)(\?.*)?$/i);

  const [isLoading, setIsLoading] = React.useState(true);

  // Reset loading state when url changes
  React.useEffect(() => {
    if (isOpen) setIsLoading(true);
  }, [isOpen, documentUrl]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={documentTitle}
      description="Visualizando anexo"
      size="xl"
      headerVariant="brand"
    >
      <div className="flex flex-col space-y-4">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl min-h-[50vh] max-h-[70vh] flex items-center justify-center relative shadow-inner overflow-hidden">
          {isLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-10">
              <Loader2 className="w-10 h-10 text-accent animate-spin mb-4" />
              <span className="text-slate-500 font-medium text-sm animate-pulse">Carregando documento...</span>
            </div>
          )}
          {isImage ? (
            <img
              src={documentUrl}
              alt={documentTitle}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
            />
          ) : (
            <iframe
              src={`${documentUrl}#toolbar=0`}
              onLoad={() => setIsLoading(false)}
              onError={() => setIsLoading(false)}
              className={`w-full h-[60vh] border-0 transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
              title={documentTitle}
            />
          )}
        </div>
      </div>

      <ModalFooter>
        <div className="flex justify-between w-full">
          <Button
            variant="outline"
            onClick={() => window.open(documentUrl, '_blank')}
            className="rounded-full flex items-center text-slate-700 font-medium font-display"
          >
            <ExternalLink className="w-4 h-4 mr-2" />
            Abrir em Nova Aba
          </Button>

          <Button
            onClick={onClose}
            className="rounded-full bg-slate-800 hover:bg-slate-900 text-white font-medium font-display"
          >
            Fechar Visualização
          </Button>
        </div>
      </ModalFooter>
    </Modal>
  );
}
