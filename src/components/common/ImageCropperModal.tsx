import React, { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import Modal, { ModalFooter } from '../ui/Modal';
import Button from '../ui/Button';
import { getCroppedImg } from '../../utils/imageUtils';
import { Loader } from 'lucide-react';

interface ImageCropperModalProps {
  image: string;
  isOpen: boolean;
  onClose: () => void;
  onCropComplete: (croppedImage: Blob) => void;
  aspectRatio?: number;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({
  image,
  isOpen,
  onClose,
  onCropComplete,
  aspectRatio = 1 / 1,
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [loading, setLoading] = useState(false);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteInternal = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleCrop = async () => {
    if (!croppedAreaPixels) return;

    try {
      setLoading(true);
      const croppedImage = await getCroppedImg(image, croppedAreaPixels);
      if (croppedImage) {
        onCropComplete(croppedImage);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustar Imagem"
      description="Arraste para posicionar e use o controle abaixo para dar zoom."
      size="md"
    >
      <div className="flex flex-col gap-6">
        <div className="relative h-64 sm:h-80 w-full bg-slate-900 rounded-xl overflow-hidden shadow-inner">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={aspectRatio}
            onCropChange={onCropChange}
            onCropComplete={onCropCompleteInternal}
            onZoomChange={onZoomChange}
            cropShape="round"
            showGrid={false}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm font-medium text-slate-700">
            <span>Zoom</span>
            <span>{Math.round(zoom * 100)}%</span>
          </div>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <ModalFooter className="px-0 pb-0">
          <Button
            variant="secondary"
            onClick={onClose}
            className="rounded-full px-6"
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCrop}
            className="rounded-full px-8 bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              'Confirmar e Salvar'
            )}
          </Button>
        </ModalFooter>
      </div>
    </Modal>
  );
};

export default ImageCropperModal;
