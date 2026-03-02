import React, { useRef, useState } from 'react';
import { Camera, Trash2, Loader, User } from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';

interface AvatarUploadProps {
  /** URL da foto atual (pode ser null) */
  currentAvatarUrl?: string | null;
  /** Nome do usuário para gerar inicial como fallback */
  name?: string;
  /** Tamanho do avatar em pixels (default: 96) */
  size?: number;
  /** Callback chamado quando o usuário seleciona um arquivo */
  onUpload: (file: File) => Promise<void>;
  /** Callback chamado quando o usuário quer remover o avatar */
  onRemove?: () => Promise<void>;
  /** Se desabilitado (ex: durante carregamento) */
  disabled?: boolean;
  /** Classe extra para o container */
  className?: string;
  /** Se deve esconder os botões de ação abaixo do avatar (default: false) */
  hideButtons?: boolean;
}

export default function AvatarUpload({
  currentAvatarUrl,
  name,
  size = 96,
  onUpload,
  onRemove,
  disabled = false,
  className = '',
  hideButtons = false,
}: AvatarUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Estados para o Cropper
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);

  const initial = name?.charAt(0)?.toUpperCase() ?? '?';
  const displayUrl = previewUrl || currentAvatarUrl;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedImage(reader.result as string);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);

    // Limpa o input
    if (inputRef.current) inputRef.current.value = '';
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setShowCropper(false);

    // Preview local imediato
    const objectUrl = URL.createObjectURL(croppedBlob);
    setPreviewUrl(objectUrl);

    try {
      setUploading(true);

      // Converte Blob em File para manter compatibilidade com a prop onUpload
      const file = new File([croppedBlob], 'avatar.jpg', { type: 'image/jpeg' });
      await onUpload(file);
    } catch {
      setPreviewUrl(null);
    } finally {
      setUploading(false);
      setSelectedImage(null);
    }
  };

  const handleRemove = async () => {
    if (!onRemove) return;
    if (!window.confirm('Remover foto de perfil?')) return;
    try {
      setRemoving(true);
      await onRemove();
      setPreviewUrl(null);
    } finally {
      setRemoving(false);
    }
  };

  const isLoading = uploading || removing;

  return (
    <div className={`flex flex-col items-center gap-3 avatar-upload-container ${className}`}>
      {/* Avatar circle */}
      <div
        className="relative group cursor-pointer"
        style={{ width: size, height: size }}
        onClick={() => !isLoading && !disabled && inputRef.current?.click()}
      >
        <div
          className="w-full h-full rounded-full overflow-hidden ring-2 ring-white/30 shadow-lg flex items-center justify-center bg-gradient-to-br from-indigo-400 to-indigo-600 text-white font-bold select-none transition-transform group-hover:scale-105"
          style={{ fontSize: size * 0.38 }}
        >
          {displayUrl ? (
            <img
              src={displayUrl}
              alt={name ?? 'Avatar'}
              className="w-full h-full object-cover"
            />
          ) : name ? (
            <span>{initial}</span>
          ) : (
            <User style={{ width: size * 0.42, height: size * 0.42 }} />
          )}
        </div>

        {/* Overlay de loading */}
        {isLoading && (
          <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center z-10">
            <Loader className="text-white animate-spin" style={{ width: size * 0.3, height: size * 0.3 }} />
          </div>
        )}

        {/* Botão câmera (hover) */}
        {!isLoading && !disabled && (
          <div
            className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
          >
            <Camera className="text-white drop-shadow-md" style={{ width: size * 0.35, height: size * 0.35 }} />
          </div>
        )}
      </div>

      {/* Botões de ação abaixo */}
      {!disabled && !hideButtons && (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-display"
          >
            <Camera className="h-3.5 w-3.5" />
            {uploading ? 'Enviando...' : 'Alterar foto'}
          </button>

          {onRemove && displayUrl && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-display"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {removing ? 'Removendo...' : 'Remover'}
            </button>
          )}
        </div>
      )}

      {/* Input oculto — sem `capture` para exibir o menu câmera/galeria no mobile */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
        aria-hidden="true"
      />
      {/* Modal de Corte */}
      {selectedImage && (
        <ImageCropperModal
          image={selectedImage}
          isOpen={showCropper}
          onClose={() => {
            setShowCropper(false);
            setSelectedImage(null);
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  );
}
