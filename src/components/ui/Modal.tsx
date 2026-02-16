import React from 'react';
import { X } from 'lucide-react';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showCloseButton?: boolean;
  headerVariant?: 'default' | 'brand';
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  showCloseButton = true,
  headerVariant = 'default'
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  };

  if (!isOpen) return null;

  const headerBaseClasses = "flex items-start justify-between p-6 transition-colors";
  const headerVariantClasses = headerVariant === 'brand'
    ? "bg-gradient-to-r from-accent to-accent-secondary text-white rounded-t-2xl"
    : "bg-card text-foreground border-b border-border rounded-t-2xl"; // Added rounded-t-2xl to match modal

  const closeButtonClasses = headerVariant === 'brand'
    ? "text-white/80 hover:text-white hover:bg-white/20"
    : "text-muted-foreground hover:text-foreground hover:bg-muted";

  const descriptionClasses = headerVariant === 'brand'
    ? "text-blue-100"
    : "text-muted-foreground";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`relative bg-card rounded-2xl shadow-2xl w-full ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-scale-in`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className={`${headerBaseClasses} ${headerVariantClasses}`}>
            <div className="flex-1">
              {title && (
                <h2 className={`text-2xl font-display ${headerVariant === 'brand' ? 'text-white' : 'text-foreground'}`}>
                  {title}
                </h2>
              )}
              {description && (
                <p className={`text-sm mt-1 ${descriptionClasses}`}>
                  {description}
                </p>
              )}
            </div>
            {showCloseButton && (
              <button
                onClick={onClose}
                className={`ml-4 p-2 rounded-lg transition-colors ${closeButtonClasses}`}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {children}
        </div>
      </div>
    </div>
  );
};

export const ModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = ''
}) => (
  <div className={`flex items-center justify-end gap-3 p-6 border-t border-border ${className}`}>
    {children}
  </div>
);

export default Modal;
