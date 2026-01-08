import { useMemo, useState } from 'react';
import { DEFAULT_VALUES, MONTHS, TARIFF_GROUPS } from '../utils/constants';
import { calculateEconomy, formatCurrency, formatNumber } from '../utils/calculations';
import { generateProposalPDFEmbedded } from '../utils/pdf';

export default function Propostas() {
  const [form, setForm] = useState({
    consumptions: Array(12).fill(0) as number[],
    tariffGroup: '',
    baseTariff: DEFAULT_VALUES.baseTariff,
    pagluzDiscount: DEFAULT_VALUES.pagluzDiscount,
    additionalRate: DEFAULT_VALUES.additionalRate,
    cosip: DEFAULT_VALUES.cosip,
  });

  const results = useMemo(() => {
    if (!form.tariffGroup) return null;
    return calculateEconomy(form);
  }, [form]);

  const setAllMonths = (value: number) => {
    setForm(prev => ({ ...prev, consumptions: Array(12).fill(value) }));
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-green-500 p-6 md:p-10 text-white shadow-xl mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold">Geração de Propostas</h1>
            <p className="text-white/90 mt-1">Simule sua economia e gere um PDF profissional para o cliente.</p>
          </div>
          {results && (
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm font-medium">Economia mensal</span>
              <span className="text-3xl font-bold drop-shadow-sm">{formatCurrency(results.monthlySavings)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Conteúdo principal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Grupo Tarifário</label>
              <select
                value={form.tariffGroup}
                onChange={(e) => setForm(prev => ({ ...prev, tariffGroup: e.target.value }))}
                className="w-full input"
              >
                <option value="">Selecione</option>
                {TARIFF_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tarifa Base (R$/kWh)</label>
                <input type="number" step="0.001" className="w-full input" value={form.baseTariff} onChange={(e) => setForm(p => ({ ...p, baseTariff: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Desconto Pagluz (%)</label>
                <input type="number" step="0.1" className="w-full input" value={form.pagluzDiscount} onChange={(e) => setForm(p => ({ ...p, pagluzDiscount: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Taxa Adicional (R$/kWh)</label>
                <input type="number" step="0.001" className="w-full input" value={form.additionalRate} onChange={(e) => setForm(p => ({ ...p, additionalRate: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">COSIP (R$)</label>
                <input type="number" step="0.01" className="w-full input" value={form.cosip} onChange={(e) => setForm(p => ({ ...p, cosip: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Consumos (kWh)</label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {MONTHS.map((m, i) => (
                  <input
                    key={m}
                    type="number"
                    step="0.01"
                    className="w-full input"
                    placeholder={m}
                    value={form.consumptions[i] || ''}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value) || 0;
                      setForm(prev => {
                        const c = [...prev.consumptions];
                        c[i] = v; return { ...prev, consumptions: c };
                      });
                    }}
                  />
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button className="btn-secondary" onClick={(e) => { e.preventDefault(); setAllMonths(0); }}>Zerar</button>
                <button className="btn-primary" onClick={(e) => { e.preventDefault(); const avg = (form.consumptions.filter(c=>c>0).reduce((a,b)=>a+b,0) / (form.consumptions.filter(c=>c>0).length || 1)); setAllMonths(Number(avg.toFixed(2))); }}>Preencher pela média</button>
                <button className="btn-secondary" onClick={(e) => { e.preventDefault(); setAllMonths(200); }}>Exemplo 200 kWh</button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="rounded-xl border border-slate-200 p-5 bg-gradient-to-br from-slate-50 to-white">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-800">Resultado</h3>
                {results && (
                  <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">{formatNumber(results.savingsPercentage,1)}% off</span>
                )}
              </div>
              {!results ? (
                <p className="text-slate-500 text-sm">Informe grupo tarifário e consumos para calcular.</p>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between"><span>Consumo médio</span><strong>{formatNumber(results.averageConsumption)} kWh</strong></div>
                  <div className="flex justify-between"><span>Tarifa mínima (kW)</span><strong>{formatNumber(results.minimumRateKW)}</strong></div>
                  <div className="flex justify-between"><span>Conta CELESC</span><strong>{formatCurrency(results.celescValue)}</strong></div>
                  <div className="flex justify-between"><span>Desconto</span><strong className="text-emerald-600">{formatCurrency(results.discountValue)}</strong></div>
                  <div className="flex justify-between"><span>Conta com Pagluz</span><strong>{formatCurrency(results.pagluzValue)}</strong></div>
                  <div className="flex justify-between"><span>Economia mensal</span><strong className="text-emerald-600">{formatCurrency(results.monthlySavings)}</strong></div>
                </div>
              )}
              <div className="mt-5 grid grid-cols-2 gap-2">
                <button className="btn-primary">Salvar</button>
                <button className="btn-secondary" onClick={async (e) => { e.preventDefault(); if (results) await generateProposalPDFEmbedded(undefined, results); }}>Exportar PDF</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


