// Grupos tarifários suportados para simulação
export const TARIFF_GROUPS = [
  'B1 / Mono - Residencial Convencional',
  'B1 - B / Mono - Residencial Baixa Renda',
  'B2 / Mono - Rural (Convencional, Cooperativas, Agroindustrial)',
  'B3 / Mono - Comercial, Serviços e Outras Atividades',
  'B4 / Mono - Industrial (Baixa Tensão)',
  'B1 / Bif - Residencial Convencional',
  'B1 - B / Bif - Residencial Baixa Renda',
  'B2 / Bif - Rural (Convencional, Cooperativas, Agroindustrial)',
  'B3 / Bif - Comercial, Serviços e Outras Atividades',
  'B4 / Bif - Industrial (Baixa Tensão)',
  'B1 / Tri - Residencial Convencional',
  'B1 - B / Tri - Residencial Baixa Renda',
  'B2 / Tri - Rural (Convencional, Cooperativas, Agroindustial)',
  'B3 / Tri - Comercial, Serviços e Outras Atividades',
  'B4 / Tri - Industrial (Baixa Tensão)'
];

// Taxas mínimas (R$) por grupo tarifário da CELESC
export const MINIMUM_RATES: Record<string, number> = {
  'B1 / Mono - Residencial Convencional': 22.5,
  'B1 - B / Mono - Residencial Baixa Renda': 9.0,
  'B2 / Mono - Rural (Convencional, Cooperativas, Agroindustrial)': 18.0,
  'B3 / Mono - Comercial, Serviços e Outras Atividades': 23.88,
  'B4 / Mono - Industrial (Baixa Tensão)': 24.0,
  'B1 / Bif - Residencial Convencional': 37.5,
  'B1 - B / Bif - Residencial Baixa Renda': 15.0,
  'B2 / Bif - Rural (Convencional, Cooperativas, Agroindustrial)': 30.0,
  'B3 / Bif - Comercial, Serviços e Outras Atividades': 39.8,
  'B4 / Bif - Industrial (Baixa Tensão)': 40.0,
  'B1 / Tri - Residencial Convencional': 75.0,
  'B1 - B / Tri - Residencial Baixa Renda': 30.0,
  'B2 / Tri - Rural (Convencional, Cooperativas, Agroindustial)': 60.0,
  'B3 / Tri - Comercial, Serviços e Outras Atividades': 79.61,
  'B4 / Tri - Industrial (Baixa Tensão)': 80.0
};

export const MONTHS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

export const DEFAULT_VALUES = {
  baseTariff: 0.87,
  pagluzDiscount: 15,
  additionalRate: 0.045,
  cosip: 60
};


