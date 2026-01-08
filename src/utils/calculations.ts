import { MINIMUM_RATES } from './constants';

export interface SimulationData {
  consumptions: number[];
  tariffGroup: string;
  baseTariff: number;
  pagluzDiscount: number; // percent
  additionalRate: number; // R$/kWh
  cosip: number; // R$
}

export interface ProjectionPeriod {
  celesc: number;
  pagluz: number;
  savings: number;
}

export interface SimulationResults {
  averageConsumption: number;
  minimumRateKW: number;
  celescValue: number;
  discountValue: number;
  pagluzValue: number;
  monthlySavings: number;
  savingsPercentage: number;
  projections: {
    oneMonth: ProjectionPeriod;
    oneYear: ProjectionPeriod;
    threeYears: ProjectionPeriod;
    fiveYears: ProjectionPeriod;
    tenYears: ProjectionPeriod;
  };
}

export function calculateEconomy(data: SimulationData): SimulationResults {
  const validConsumptions = data.consumptions.filter((c) => c > 0);
  const monthCount = validConsumptions.length || 1;
  const sumConsumptions = validConsumptions.reduce((acc, val) => acc + val, 0);
  const averageConsumption = sumConsumptions / monthCount;

  const minimumRateRS = MINIMUM_RATES[data.tariffGroup] ?? 22.5;
  const minimumRateKW = minimumRateRS / data.baseTariff;

  const celescValue = averageConsumption * data.baseTariff + data.cosip;

  let discountValue = 0;
  if (averageConsumption > minimumRateKW) {
    discountValue =
      (averageConsumption - minimumRateKW) *
      (data.baseTariff - data.additionalRate) *
      (data.pagluzDiscount / 100);
  }

  const pagluzValue = averageConsumption * data.baseTariff - discountValue + data.cosip;

  const monthlySavings = Math.max(0, celescValue - pagluzValue);
  const savingsPercentage = celescValue > 0 ? (monthlySavings / celescValue) * 100 : 0;

  const projections = {
    oneMonth: { celesc: celescValue, pagluz: pagluzValue, savings: monthlySavings },
    oneYear: { celesc: celescValue * 12, pagluz: pagluzValue * 12, savings: monthlySavings * 12 },
    threeYears: { celesc: celescValue * 36, pagluz: pagluzValue * 36, savings: monthlySavings * 36 },
    fiveYears: { celesc: celescValue * 60, pagluz: pagluzValue * 60, savings: monthlySavings * 60 },
    tenYears: { celesc: celescValue * 120, pagluz: pagluzValue * 120, savings: monthlySavings * 120 }
  };

  return {
    averageConsumption,
    minimumRateKW,
    celescValue,
    discountValue,
    pagluzValue,
    monthlySavings,
    savingsPercentage,
    projections
  };
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function formatNumber(value: number, decimals = 2): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}


