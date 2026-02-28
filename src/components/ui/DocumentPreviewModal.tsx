import React from 'react';
import Modal, { ModalFooter } from './Modal';
import Button from './Button';
import { ExternalLink, Eye, FileText, Image as ImageIcon } from 'lucide-react';

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
  const isPdf = documentUrl?.match(/\.pdf(\?.*)?$/i) || !isImage;

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
        <div className="bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden min-h-[50vh] max-h-[70vh] flex items-center justify-center relative">
          {isImage ? (
            <img
              src={documentUrl}
              alt={documentTitle}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <iframe
              src={`${documentUrl}#toolbar=0`}
              className="w-full h-[60vh] border-0"
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
