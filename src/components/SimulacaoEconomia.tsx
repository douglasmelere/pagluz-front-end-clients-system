import { useState, useMemo, useRef } from 'react';
import {
  Zap,
  Download,
  Eye,
  RotateCcw,
  TrendingDown,
  User,
  ChevronDown,
  ChevronUp,
  Calculator,
  Leaf,
  Copy,
  Check,
  Image,
  Percent,
  Info,
} from 'lucide-react';
import logoSvgUrl from '../assets/new-logo.svg';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { useSettings } from '../hooks/useSettings';

// ─── Tipos ────────────────────────────────────────────────────
type TipoConsumidor = 'monofasico' | 'bifasico' | 'trifasico';

interface SimulationForm {
  // Inputs do usuário (4 campos principais)
  clientName: string;
  consumoFatura: number;     // kWh da fatura do cliente
  tipoConsumidor: TipoConsumidor;
  descontoPercent: number;   // % de desconto pretendido
}

// ─── Constantes por tipo de consumidor ────────────────────────
const CONSTANTES: Record<TipoConsumidor, { cosip: number; taxaMinima: number; label: string }> = {
  monofasico: { cosip: 30.00, taxaMinima: 30.80, label: 'Monofásico' },
  bifasico: { cosip: 50.00, taxaMinima: 57.20, label: 'Bifásico' },
  trifasico: { cosip: 90.00, taxaMinima: 105.60, label: 'Trifásico' },
};

// ─── Utilitários ───────────────────────────────────────────────
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ─── Lógica de cálculo conforme especificação ─────────────────
//
// Dados do backend (somente leitura):
//   kwhPrice       = Valor do kW Atual (R$)     → /settings/kwh-price
//   fioBPercentage = Fator de ajuste do Fio B   → /settings/fio-b-percentage
//                    (padrão 65% = 0.65, configurável pelo admin)
//
// Dados extraídos da conta física do cliente (inputs):
//   fioBAtualReais   = R$ do Fio B que aparece na fatura
//   valorFaturaAtual = R$ total da fatura atual
//
// Fórmula:
//   FioB_Percentual = (Fio B R$ / Fatura Total R$) / (fioBPercentage / 100)
//   Ex: (966.75 / 10996.56) / 0.65 = 8.79% / 65% = 13.52%
//
function calcularProposta(
  form: SimulationForm,
  kwhPrice: number,
  fioBFator: number   // fioBPercentage do backend como decimal (65 → 0.65)
) {
  const { cosip, taxaMinima } = CONSTANTES[form.tipoConsumidor];

  const valorConsumo = form.consumoFatura * kwhPrice;

  // Valor do Fio B = consumo * valor do kwh * porcentagem do fio B do sistema
  const perdasFioB = valorConsumo * fioBFator;

  // Base de cálculo "valor limpo"
  const baseCalculo = Math.max(0, valorConsumo - cosip - taxaMinima - perdasFioB);

  // 5. Desconto mensal aplicado sobre o valor limpo
  const descontoMensal = baseCalculo * (form.descontoPercent / 100);

  // Fatura Celesc inclui a COSIP (valor que o cliente paga hoje aprox)
  const valorContaCelesc = valorConsumo + cosip;

  // 6. Nova fatura PagLuz
  const novaFatura = Math.max(0, valorContaCelesc - descontoMensal);

  // 7. Economias
  const economiaAnual = descontoMensal * 12;

  // fioBPercentual no novo formato é o próprio fioBFator configurado (só p/ manter compatibilidade)
  const fioBPercentual = fioBFator;

  return {
    valorContaCelesc,
    fioBPercentual,
    perdasFioB,
    baseCalculo,
    descontoMensal,
    novaFatura,
    economiaAnual,
    economia3anos: economiaAnual * 3,
    economia5anos: economiaAnual * 5,
    economia10anos: economiaAnual * 10,
  };
}

// ─── CSS do template PAGLUZ ───────────────────────────────────
const templateStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,700;0,900;1,900&display=swap');
  .pagluz-page * { margin: 0; padding: 0; box-sizing: border-box; }
  .pagluz-page { font-family: 'Gotham Book', 'Inter', system-ui, sans-serif; color: #333; background-color: #fff; width: 620px; }
  .pagluz-page header { background-color: #01375a; text-align: center; overflow: hidden; }
  .pagluz-page header img.logo-img { width: 240px; height: auto; display: inline-block; margin: -80px 0 -87px 0; }
  .pagluz-page main { padding: 36px 48px 42px; }
  .pagluz-page h1.titulo { font-family: 'Gotham Ultra', 'Plus Jakarta Sans', sans-serif !important; font-size: 1.45rem !important; font-weight: 900 !important; font-style: italic !important; color: #01375a !important; text-decoration: underline !important; text-decoration-color: #ffc400 !important; text-underline-offset: 4px !important; margin-bottom: 22px !important; text-align: center !important; -webkit-text-stroke: 1px #01375a; }
  .pagluz-page .nome-cliente { border: 2px solid #01375a; border-radius: 12px 12px 0 0; padding: 14px 16px 16px; font-size: 1.05rem; color: #01375a; margin-bottom: 8px; background: #fff; display: flex; align-items: center; }
  .pagluz-page .nome-cliente span { font-weight: 900; margin-left: 6px; font-family: 'Gotham Black', 'Plus Jakarta Sans', sans-serif; -webkit-text-stroke: 1px #01375a; }
  .pagluz-page .desconto { text-align: center; color: #45a527; font-size: 0.95rem; font-family: 'Gotham Black', 'Plus Jakarta Sans', sans-serif; font-weight: 900; margin-bottom: 18px; }
  .pagluz-page .cards-container { display: flex; gap: 16px; margin-bottom: 26px; }
  .pagluz-page .card-wrapper { flex: 1; display: flex; flex-direction: column; align-items: center; }
  .pagluz-page .tab { background-color: #01375a; color: #fff; font-size: 0.95rem; font-weight: 900; font-family: 'Gotham Ultra', 'Plus Jakarta Sans', sans-serif; font-style: italic; text-align: center; padding: 6px 36px; width: auto; border-radius: 6px 6px 0 0; margin-bottom: 0; position: relative; z-index: 10; }
  .pagluz-page .card { width: 100%; border-radius: 0 0 12px 12px; overflow: hidden; }
  .pagluz-page .card-left { border: 4px solid #ff0002; }
  .pagluz-page .card-right { border: 4px solid #45a527; }
  .pagluz-page .card-title { padding: 14px 10px; font-family: 'Gotham Ultra', 'Plus Jakarta Sans', sans-serif; font-weight: 900; text-align: center; font-size: 1.25rem; font-style: italic; color: #fff; -webkit-text-stroke: 0.6px #fff; }
  .pagluz-page .card-left .card-title { background-color: #ff0002; }
  .pagluz-page .card-right .card-title { background-color: #45a527; }
  .pagluz-page .card-body { background: #fff; padding: 18px 14px; text-align: center; border-radius: 0 0 9px 9px; }
  .pagluz-page .card-label { font-size: 0.85rem; color: #01375a; margin-bottom: 4px; font-family: 'Gotham Book', 'Inter', sans-serif; }
  .pagluz-page .card-value { font-size: 1.9rem; font-family: 'Gotham Black', 'Plus Jakarta Sans', sans-serif; font-weight: 900; color: #01375a; letter-spacing: -0.5px; -webkit-text-stroke: 1.5px #01375a; }
  .pagluz-page .card-divider { border: none; height: 3px; margin: 14px 0; }
  .pagluz-page .card-left .card-divider { background-color: #ff0002; }
  .pagluz-page .card-right .card-divider { background-color: #45a527; }
  .pagluz-page .economia-section { background-color: #01375a; border: 4px solid #01375a; border-radius: 0 0 14px 14px; }
  .pagluz-page .economia-titulo { font-family: 'Gotham Ultra', 'Plus Jakarta Sans', sans-serif; font-weight: 900; font-size: 1.35rem; font-style: italic; color: #fff; padding: 14px 20px; text-align: center; -webkit-text-stroke: 0.6px #fff; }
  .pagluz-page .economia-rows { background-color: #fff; border-radius: 0 0 11px 11px; padding: 18px 18px 20px; display: flex; flex-direction: column; gap: 12px; }
`;

// ─── Componente Principal ──────────────────────────────────────
export default function SimulacaoEconomia() {
  const { kwhPrice, fioBPercentage, fioBHistory } = useSettings();

  // Dados do backend (somente leitura no formulário)
  const kwhAtual = kwhPrice ?? 0;
  // fioBFator: divisor dinâmico (padrão 0.65, configurável pelo admin)
  const fioBPctAdmin = fioBPercentage ?? (fioBHistory.find(h => h.isActive)?.value ?? 65);
  const fioBFator = fioBPctAdmin / 100;   // ex: 65 → 0.65, 78 → 0.78

  const [form, setForm] = useState<SimulationForm>({
    clientName: '',
    consumoFatura: 0,
    tipoConsumidor: 'trifasico',
    descontoPercent: 20,
  });

  const [showPreview, setShowPreview] = useState(true);
  const [showCalcDetail, setShowCalcDetail] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isGeneratingImg, setIsGeneratingImg] = useState(false);
  const [copied, setCopied] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // ─── Cálculo automático ───────────────────────────────────
  const resultado = useMemo(() => {
    if (
      !form.consumoFatura ||
      !kwhAtual
    ) return null;
    return calcularProposta(form, kwhAtual, fioBFator);
  }, [form, kwhAtual, fioBFator]);

  const backendReady = kwhAtual > 0 && fioBPctAdmin > 0;
  const canGenerate = backendReady && form.consumoFatura > 0;

  // ─── Template HTML PAGLUZ ─────────────────────────────────
  const templateHtml = useMemo(() => {
    const clientName = form.clientName || 'Nome do Cliente';
    const valorSemMensal = formatNumber(resultado?.valorContaCelesc ?? 0);
    const valorSemAnual = formatNumber((resultado?.valorContaCelesc ?? 0) * 12);
    const valorComMensal = formatNumber(resultado?.novaFatura ?? 0);
    const valorComAnual = formatNumber((resultado?.novaFatura ?? 0) * 12);

    const projections = resultado ? [
      { label: '1 ano', valor: resultado.economiaAnual },
      { label: '3 anos', valor: resultado.economia3anos },
      { label: '5 anos', valor: resultado.economia5anos },
      { label: '10 anos', valor: resultado.economia10anos },
    ] : [];

    const projectionsHtml = projections.map(p => `
      <div style="display:flex;align-items:center;gap:0;padding-right:1rem;margin-bottom:12px;">
        <div style="background-color:#45a527;color:#fff;font-family:'Gotham Black', sans-serif;font-weight:900;font-size:1.05rem;display:flex;align-items:center;justify-content:center;height:52px;width:100px;min-width:100px;text-align:center;border-radius:5px;position:relative;z-index:2;">${p.label}</div>
        <div style="background-color:#01375a;color:#fff;font-family:'Gotham Black', sans-serif;font-weight:900;font-size:1.4rem;font-style:italic;display:flex;align-items:center;height:42px;padding:0 22px 0 40px;border-radius:8px;flex:1;margin-left:-20px;position:relative;z-index:1;">R$ ${formatNumber(p.valor)}</div>
      </div>
    `).join('');

    return `
      <style>${templateStyles}</style>
      <div class="pagluz-page">
        <header><img class="logo-img" src="${logoSvgUrl}" alt="PAGLUZ" /></header>
        <main>
          <h1 class="titulo">Quanto você pode economizar conosco?</h1>
          <div class="nome-cliente">Cliente: <span>${clientName}</span></div>
          <div class="desconto">Desconto na energia injetada de: <span>${form.descontoPercent}%</span></div>
          <div class="cards-container">
            <div class="card-wrapper">
              <div class="tab">Sem a</div>
              <div class="card card-left">
                <div class="card-title">Pague Minha Luz</div>
                <div class="card-body">
                  <p class="card-label">Média gasto mensal (R$)</p>
                  <p class="card-value">${valorSemMensal}</p>
                  <hr class="card-divider">
                  <p class="card-label">Média gasto anual (R$)</p>
                  <p class="card-value">${valorSemAnual}</p>
                </div>
              </div>
            </div>
            <div class="card-wrapper">
              <div class="tab">Com a</div>
              <div class="card card-right">
                <div class="card-title">Pague Minha Luz</div>
                <div class="card-body">
                  <p class="card-label">Média gasto mensal (R$)</p>
                  <p class="card-value">${valorComMensal}</p>
                  <hr class="card-divider">
                  <p class="card-label">Média gasto anual (R$)</p>
                  <p class="card-value">${valorComAnual}</p>
                </div>
              </div>
            </div>
          </div>
          <div class="economia-section">
            <div class="economia-titulo">Economia garantida, hoje, amanhã e sempre</div>
            <div class="economia-rows">
              ${projectionsHtml || '<p style="color:#888;text-align:center;padding:16px;">Preencha os dados para ver as projeções</p>'}
            </div>
          </div>
        </main>
      </div>
    `;
  }, [form, resultado]);

  // ─── Handlers ─────────────────────────────────────────────
  const updateField = (field: keyof SimulationForm, value: string | number | TipoConsumidor) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleReset = () =>
    setForm({ clientName: '', consumoFatura: 0, tipoConsumidor: 'trifasico', descontoPercent: 20 });

  const handleGeneratePDF = async () => {
    setIsGeneratingPDF(true);
    try {
      const root = exportRef.current?.querySelector('.pagluz-page') as HTMLElement || exportRef.current;
      if (root) {
        const imgData = await toPng(root, { cacheBust: true, quality: 1, pixelRatio: 3, backgroundColor: '#ffffff' });
        const pdfWidth = 210;
        const pdfHeight = (root.offsetHeight * pdfWidth) / (root.offsetWidth || 620);
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: [pdfWidth, pdfHeight] });
        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        const safeName = (form.clientName || 'cliente').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        doc.save(`proposta-pagluz-${safeName}.pdf`);
      }
    } catch (err) { }
    finally { setIsGeneratingPDF(false); }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImg(true);
    try {
      const root = exportRef.current?.querySelector('.pagluz-page') as HTMLElement || exportRef.current;
      if (root) {
        const url = await toPng(root, { cacheBust: true, quality: 1, pixelRatio: 3, backgroundColor: '#ffffff' });
        const safeName = (form.clientName || 'cliente').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        const a = document.createElement('a');
        a.download = `proposta-pagluz-${safeName}.png`;
        a.href = url;
        a.click();
      }
    } catch (err) { }
    finally { setIsGeneratingImg(false); }
  };

  const handleCopy = () => {
    if (!resultado) return;
    const text = `📊 Proposta PagLuz — ${form.clientName || 'Cliente'}\n\n💡 Conta Celesc (sim.): ${formatBRL(resultado.valorContaCelesc)}\n🟢 Nova fatura PagLuz: ${formatBRL(resultado.novaFatura)}\n📉 Desconto mensal: ${formatBRL(resultado.descontoMensal)} (${form.descontoPercent}%)\n💰 Economia anual: ${formatBRL(resultado.economiaAnual)}\n\n📅 Projeções:\n  • 3 anos: ${formatBRL(resultado.economia3anos)}\n  • 5 anos: ${formatBRL(resultado.economia5anos)}\n  • 10 anos: ${formatBRL(resultado.economia10anos)}`;
    navigator.clipboard.writeText(text).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  const constantes = CONSTANTES[form.tipoConsumidor];

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">

      {/* ─── Header ──────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-sm mb-8">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-accent to-accent-secondary rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-semibold text-slate-900">Geração de Propostas</h1>
                <p className="text-slate-500 font-medium text-sm">Gere propostas de economia de energia com o template PAGLUZ.</p>
              </div>
            </div>
            {resultado && resultado.descontoMensal > 0 && (
              <div className="flex items-center gap-3 bg-green-50/80 rounded-xl px-5 py-3 border border-green-100 shadow-sm">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium font-display">Desconto mensal</p>
                  <p className="text-xl font-bold text-green-600 font-display">{formatBRL(resultado.descontoMensal)}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Body ────────────────────────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">

          {/* ─── Painel Esquerdo ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* Dados automáticos do sistema (somente leitura) */}
            <div className={`rounded-2xl border p-4 shadow-sm ${backendReady ? 'border-blue-100 bg-blue-50/50' : 'border-amber-100 bg-amber-50/50'}`}>
              <div className="flex items-center gap-2 mb-3">
                <Info className={`h-4 w-4 ${backendReady ? 'text-blue-500' : 'text-amber-500'}`} />
                <span className={`text-sm font-semibold font-display ${backendReady ? 'text-blue-700' : 'text-amber-700'}`}>
                  Parâmetros do Sistema (automáticos)
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white border border-blue-100 p-3">
                  <p className="text-xs text-blue-500 font-medium mb-1">Tarifa do kWh</p>
                  <p className="text-lg font-bold text-blue-700 font-display">
                    {kwhAtual > 0
                      ? `R$ ${formatNumber(kwhAtual)}`
                      : <span className="text-amber-500 text-sm animate-pulse">Carregando...</span>}
                  </p>
                </div>
                <div className="rounded-xl bg-white border border-blue-100 p-3">
                  <p className="text-xs text-blue-500 font-medium mb-1">Fator Fio B (TUSD)</p>
                  <p className="text-lg font-bold text-blue-700 font-display">
                    {fioBPctAdmin > 0
                      ? `${fioBPctAdmin}% (÷${fioBPctAdmin}%)`
                      : <span className="text-amber-500 text-sm animate-pulse">Carregando...</span>}
                  </p>
                </div>
              </div>
              <p className="text-xs text-blue-500 mt-2 ml-1">
                Configurados em <strong>Configurações do Sistema</strong>. O fator Fio B substitui o padrão de 65% da planilha.
              </p>
            </div>

            {/* Formulário */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <Calculator className="h-4 w-4 text-accent" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-slate-900">Dados da Proposta</h2>
                </div>
              </div>

              <div className="p-6 space-y-5">

                {/* 1 – Nome do Cliente */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                    <User className="h-4 w-4 text-accent" />
                    Nome do Cliente
                  </label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={e => updateField('clientName', e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent focus:bg-white transition-all duration-200 text-sm"
                  />
                </div>

                {/* 2 – Tipo de Consumidor */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    Tipo de Consumidor
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(CONSTANTES) as TipoConsumidor[]).map(tipo => (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => updateField('tipoConsumidor', tipo)}
                        className={`py-2.5 px-3 rounded-xl text-sm font-semibold border-2 transition-all duration-200
                          ${form.tipoConsumidor === tipo
                            ? 'bg-amber-500 border-amber-500 text-white shadow-md shadow-amber-200'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-amber-300 hover:text-amber-600'}`}
                      >
                        {CONSTANTES[tipo].label}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-1">
                    COSIP: R$ {formatNumber(constantes.cosip)} · Taxa mínima: R$ {formatNumber(constantes.taxaMinima)}
                  </p>
                </div>

                {/* 3 – Consumo da Fatura */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    Consumo da Fatura
                  </label>
                  <div className="relative">
                    <input
                      type="number" step="1" min="0"
                      value={form.consumoFatura || ''}
                      onChange={e => updateField('consumoFatura', parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 12050"
                      className="w-full px-4 pr-16 py-3 rounded-xl border border-blue-200 bg-blue-50/50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-blue-400 focus:bg-white transition-all duration-200 text-sm font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-blue-500 font-bold">kWh</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-1">Consumo médio mensal da fatura do cliente</p>
                </div>

                {/* 4 – Desconto Pretendido */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                    <Percent className="h-4 w-4 text-green-500" />
                    Desconto Pretendido
                  </label>
                  <div className="relative">
                    <input
                      type="number" step="0.5" min="0" max="100"
                      value={form.descontoPercent || ''}
                      onChange={e => updateField('descontoPercent', parseFloat(e.target.value) || 0)}
                      placeholder="20"
                      className="w-full px-4 pr-12 py-3 rounded-xl border border-green-200 bg-green-50/50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300/50 focus:border-green-400 focus:bg-white transition-all duration-200 text-sm font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-green-500 font-bold">%</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-1">Aplicado sobre a base de cálculo</p>
                </div>



                {!backendReady && (
                  <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-700 font-medium flex items-center gap-2">
                    <Info className="h-4 w-4 flex-shrink-0" />
                    Configure o kWh e o fator Fio B em Configurações do Sistema para habilitar os cálculos.
                  </div>
                )}
              </div>

              {/* Botões */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3">
                <button
                  onClick={handleGeneratePDF}
                  disabled={isGeneratingPDF || isGeneratingImg || !canGenerate}
                  className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold text-sm hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-display"
                >
                  {isGeneratingPDF
                    ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Gerando...</>
                    : <><Download className="h-4 w-4" />Exportar PDF</>}
                </button>

                <button
                  onClick={handleGenerateImage}
                  disabled={isGeneratingPDF || isGeneratingImg || !canGenerate}
                  className="flex-1 min-w-[130px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-sm hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-display"
                >
                  {isGeneratingImg
                    ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />Gerando...</>
                    : <><Image className="h-4 w-4" />Exportar Imagem</>}
                </button>

                <button
                  onClick={handleCopy}
                  disabled={!resultado}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium text-sm hover:bg-slate-50 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm transition-all duration-200 disabled:opacity-40"
                >
                  {copied ? <><Check className="h-4 w-4 text-green-500" />Copiado!</> : <><Copy className="h-4 w-4" />Copiar</>}
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-500 font-medium text-sm hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-[0.98] shadow-sm transition-all duration-200"
                >
                  <RotateCcw className="h-4 w-4" />Limpar
                </button>
              </div>
            </div>

            {/* Resumo de Economia */}
            {resultado && (
              <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 shadow-sm overflow-hidden">
                <div className="px-5 py-4 flex items-center justify-between border-b border-green-100">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-green-100">
                      <Leaf className="h-4 w-4 text-green-600" />
                    </div>
                    <h3 className="text-base font-display font-semibold text-green-800">Resumo da Economia</h3>
                  </div>
                  <button
                    onClick={() => setShowCalcDetail(!showCalcDetail)}
                    className="text-xs text-green-600 hover:text-green-800 flex items-center gap-1 transition-colors"
                  >
                    {showCalcDetail
                      ? <><ChevronUp className="h-3 w-3" />Menos</>
                      : <><ChevronDown className="h-3 w-3" />Ver cálculos</>}
                  </button>
                </div>

                <div className="p-5">
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: 'Conta Celesc (sim.)', valor: resultado.valorContaCelesc, color: 'text-slate-700' },
                      { label: 'Desconto Mensal', valor: resultado.descontoMensal, color: 'text-green-700' },
                      { label: 'Nova Fatura PagLuz', valor: resultado.novaFatura, color: 'text-slate-700' },
                      { label: 'Economia Anual', valor: resultado.economiaAnual, color: 'text-green-700' },
                    ].map(item => (
                      <div key={item.label} className="rounded-xl bg-white/80 p-3.5 border border-green-100">
                        <p className="text-xs text-slate-500 font-medium mb-1">{item.label}</p>
                        <p className={`text-base font-bold ${item.color}`}>{formatBRL(item.valor)}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: '3 anos', valor: resultado.economia3anos },
                      { label: '5 anos', valor: resultado.economia5anos },
                      { label: '10 anos', valor: resultado.economia10anos },
                    ].map(p => (
                      <div key={p.label} className="rounded-xl bg-white/80 p-3 border border-green-100 text-center">
                        <p className="text-xs text-green-600 font-medium mb-1">{p.label}</p>
                        <p className="text-sm font-bold text-green-700">{formatBRL(p.valor)}</p>
                      </div>
                    ))}
                  </div>

                  {showCalcDetail && (
                    <div className="mt-4 rounded-xl bg-white/70 border border-green-100 p-4 text-xs space-y-2 font-mono">
                      <p className="font-sans font-semibold text-slate-700 mb-2">Detalhamento do cálculo:</p>
                      <div className="flex justify-between text-slate-600">
                        <span>{form.consumoFatura} kWh × R$ {formatNumber(kwhAtual)}</span>
                        <span className="font-medium">{formatBRL(resultado.valorContaCelesc)}</span>
                      </div>
                      <div className="flex justify-between text-slate-500">
                        <span>Fio B ({fioBPctAdmin}%)</span>
                        <span className="font-medium">= {(fioBPctAdmin).toFixed(2)}% Fio B</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Perdas Fio B ({fioBPctAdmin}%)</span>
                        <span className="font-medium text-red-500">- {formatBRL(resultado.perdasFioB)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>COSIP</span>
                        <span className="font-medium text-red-500">- {formatBRL(constantes.cosip)}</span>
                      </div>
                      <div className="flex justify-between text-slate-600">
                        <span>Taxa Mínima</span>
                        <span className="font-medium text-red-500">- {formatBRL(constantes.taxaMinima)}</span>
                      </div>
                      <div className="flex justify-between text-slate-700 font-sans font-semibold border-t border-green-100 pt-2">
                        <span>Base de cálculo</span>
                        <span>{formatBRL(resultado.baseCalculo)}</span>
                      </div>
                      <div className="flex justify-between text-green-700 font-sans font-semibold">
                        <span>Desconto ({form.descontoPercent}% sobre base)</span>
                        <span>{formatBRL(resultado.descontoMensal)}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ─── Preview ─────────────────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <Eye className="h-4 w-4 text-accent" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-slate-900">Pré-visualização da Proposta</h2>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-slate-500 hover:text-accent flex items-center gap-1 transition-colors"
                >
                  {showPreview
                    ? <><ChevronUp className="h-4 w-4" />Recolher</>
                    : <><ChevronDown className="h-4 w-4" />Expandir</>}
                </button>
              </div>
              {showPreview && (
                <div className="p-4 md:p-6 bg-[#e0e0e0]">
                  <div
                    ref={exportRef}
                    className="mx-auto"
                    style={{ maxWidth: '620px' }}
                    dangerouslySetInnerHTML={{ __html: templateHtml }}
                  />
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
