import { useState, useRef } from 'react';
import Modal, { ModalFooter } from './ui/Modal';
import Button from './ui/Button';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';

interface UploadPaymentProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
  commissionId: string;
  commissionValue: number;
  representativeName: string;
}

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return 'Tipo de arquivo não permitido. Use JPG, PNG ou PDF.';
  }

  if (file.size > MAX_SIZE) {
    return `Arquivo muito grande. Tamanho máximo: 5MB. Tamanho atual: ${(file.size / 1024 / 1024).toFixed(2)}MB`;
  }

  return null;
}

export default function UploadPaymentProofModal({
  isOpen,
  onClose,
  onUpload,
  commissionId,
  commissionValue,
  representativeName,
}: UploadPaymentProofModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (selectedFile: File | null) => {
    if (!selectedFile) {
      setFile(null);
      setError(null);
      return;
    }

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setError(validationError);
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    handleFileChange(selectedFile || null);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFile = e.dataTransfer.files?.[0];
    handleFileChange(droppedFile || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      setError('Selecione um arquivo');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onUpload(file);
      // Reset e fechar
      setFile(null);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Erro ao fazer upload do comprovante');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setError(null);
      onClose();
    }
  };

  const getFileIcon = () => {
    if (!file) return <Upload className="h-12 w-12 text-slate-400" />;

    if (file.type.startsWith('image/')) {
      return <img src={URL.createObjectURL(file)} alt="Preview" className="h-24 w-24 object-cover rounded-lg" />;
    }

    return <FileText className="h-12 w-12 text-red-500" />;
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Anexar Comprovante de Pagamento"
      description={`Comissão de R$ ${commissionValue.toFixed(2)} - ${representativeName}`}
      size="lg"
      headerVariant="brand"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Info da comissão */}
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-emerald-600 mr-3 mt-0.5" />
            <div>
              <h4 className="font-medium text-emerald-900">Marcar como Paga</h4>
              <p className="text-sm text-emerald-700 mt-1">
                Ao anexar o comprovante, a comissão será automaticamente marcada como paga.
              </p>
            </div>
          </div>
        </div>

        {/* Área de upload */}
        <div
          className={`relative border-2 border-dashed rounded-2xl p-8 transition-all ${dragActive
              ? 'border-accent bg-accent/5'
              : error
                ? 'border-red-300 bg-red-50'
                : file
                  ? 'border-emerald-300 bg-emerald-50'
                  : 'border-slate-300 bg-slate-50 hover:border-accent hover:bg-accent/5'
            }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(',')}
            onChange={handleInputChange}
            className="hidden"
            disabled={loading}
          />

          <div className="flex flex-col items-center text-center">
            {getFileIcon()}

            {file ? (
              <div className="mt-4 space-y-2">
                <p className="font-medium text-slate-900">{file.name}</p>
                <p className="text-sm text-slate-500">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileChange(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remover arquivo
                </Button>
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-slate-700 font-medium">
                  Arraste um arquivo aqui ou clique para selecionar
                </p>
                <p className="text-sm text-slate-500">
                  Aceita JPG, PNG ou PDF • Máximo 5MB
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-3"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivo
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Mensagem de erro */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start">
            <AlertCircle className="h-5 w-5 text-red-600 mr-3 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Footer com botões */}
        <ModalFooter>
          <Button
            type="button"
            variant="secondary"
            onClick={handleClose}
            disabled={loading}
            className="rounded-full"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading || !file}
            isLoading={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full border-transparent"
            showArrow
          >
            {loading ? 'Enviando...' : 'Anexar e Marcar como Paga'}
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}
