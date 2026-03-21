export const translateConsumerType = (type?: string | null) => {
  if (!type) return '-';
  const translations: Record<string, string> = {
    RESIDENTIAL: 'Residencial',
    COMMERCIAL: 'Comercial',
    INDUSTRIAL: 'Industrial',
    RURAL: 'Rural',
    PUBLIC_POWER: 'Poder Público'
  };
  return translations[type] || type;
};
