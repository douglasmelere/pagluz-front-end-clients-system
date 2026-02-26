import { useState, useMemo, useRef } from 'react';
import {
  Zap,
  Download,
  Eye,
  RotateCcw,
  TrendingDown,
  User,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Calculator,
  Leaf,
  Copy,
  Check,
  Image,
  Percent,
} from 'lucide-react';
import logoSvgUrl from '../assets/new-logo.svg';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';

// ─── Interfaces ────────────────────────────────────────────────
interface SimulationForm {
  clientName: string;
  descontoPercent: number;
  valorSemPagluz: number;
}

interface EconomyProjection {
  label: string;
  months: number;
  economia: number;
}

// ─── Utilitários ───────────────────────────────────────────────
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatNumber(value: number): string {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function calcularValorComPagluz(
  valorSemPagluz: number,
  descontoPercent: number
): number {
  // O desconto % é aplicado sobre a energia injetada (o valor sem pagluz)
  // Valor com pagluz = valor sem pagluz - (valor sem pagluz * desconto / 100)
  return valorSemPagluz - valorSemPagluz * (descontoPercent / 100);
}

function calcularEconomias(economiaMensal: number): EconomyProjection[] {
  const periodos = [
    { label: '1 ano', months: 12 },
    { label: '3 anos', months: 36 },
    { label: '5 anos', months: 60 },
    { label: '10 anos', months: 120 },
  ];

  return periodos.map(({ label, months }) => ({
    label,
    months,
    economia: economiaMensal * months,
  }));
}

// ─── Inline styles for the faithful PAGLUZ template ────────────
const templateStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,700;0,900;1,400;1,500;1,700;1,900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,400;0,600;0,700;0,900;1,600;1,900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap');
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');

  .pagluz-page * { margin: 0; padding: 0; box-sizing: border-box; }
  .pagluz-page {
    font-family: 'Inter', system-ui, sans-serif;
    color: #333;
    background-color: #ffffff;
    width: 620px;
  }
  .pagluz-page header {
    background-color: #01375a;
    padding: 0;
    text-align: center;
    overflow: hidden;
  }
  .pagluz-page header img.logo-img {
    width: 240px;
    height: auto;
    display: inline-block;
    margin: -80px 0 -87px 0;
  }
  .pagluz-page .logo-text {
    font-size: 2.4rem; font-weight: 900; color: #fff; letter-spacing: 1px;
  }
  .pagluz-page .logo-text span { color: #ffc400; }
  .pagluz-page .logo-sub {
    font-size: 0.65rem; color: #aac8d8; letter-spacing: 3px; margin-top: 3px;
  }
  .pagluz-page main { padding: 26px 28px 36px; }
  .pagluz-page h1.titulo {
    font-family: 'Plus Jakarta Sans', 'Poppins', 'Calistoga', Georgia, serif !important;
    font-size: 1.45rem !important;
    font-weight: 900 !important;
    font-style: italic !important;
    color: #01375a !important;
    text-decoration: underline !important;
    text-decoration-color: #ffc400 !important;
    text-underline-offset: 4px !important;
    margin-bottom: 22px !important;
    line-height: 1.3 !important;
    text-align: center !important;
    -webkit-text-stroke: 0.5px currentColor !important;
  }
  .pagluz-page .nome-cliente {
    border: 2px solid #01375a;
    border-radius: 12px 12px 0 0;
    padding: 14px 16px 16px;
    font-size: 1.05rem;
    color: #01375a;
    margin-bottom: 8px;
    background: #fff;
    display: flex;
    align-items: center;
  }
  .pagluz-page .nome-cliente span { font-weight: 900; margin-left: 6px; font-family: 'Plus Jakarta Sans', 'Poppins', 'Calistoga', Georgia, serif; }
  .pagluz-page .desconto {
    text-align: center;
    color: #008000;
    font-size: 0.95rem;
    font-family: 'Plus Jakarta Sans', 'Poppins', 'Calistoga', Georgia, serif;
    font-weight: 900;
    margin-bottom: 18px;
  }
  .pagluz-page .cards-container {
    display: flex;
    gap: 16px;
    margin-bottom: 26px;
  }
  .pagluz-page .card-wrapper {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .pagluz-page .tab {
    background-color: #01375a;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 900;
    font-style: italic;
    text-align: center;
    padding: 8px 0;
    width: 68%;
    border-radius: 8px 8px 0 0;
    margin-bottom: -2px; /* Overlap border to prevent sub-pixel gaps */
    position: relative;
    z-index: 10;
  }
  .pagluz-page .card { width: 100%; border-radius: 0 0 12px 12px; overflow: hidden; }
  .pagluz-page .card-left  { border: 3px solid #cc0000; background-color: #cc0000; }
  .pagluz-page .card-right { border: 3px solid #008000; background-color: #008000; }
  .pagluz-page .card-title {
    padding: 14px 10px;
    font-family: 'Plus Jakarta Sans', 'Poppins', 'Calistoga', Georgia, serif;
    text-align: center;
    font-size: 1.25rem;
    font-weight: 900;
    font-style: italic;
    color: #fff;
    -webkit-text-stroke: 0.5px currentColor;
  }
  .pagluz-page .card-left .card-title { background-color: #cc0000; }
  .pagluz-page .card-right .card-title { background-color: #008000; }
  .pagluz-page .card-body { background: #fff; padding: 18px 14px; text-align: center; border-radius: 0 0 9px 9px; }
  .pagluz-page .card-label { font-size: 0.85rem; color: #01375a; margin-bottom: 4px; font-weight: 500; }
  .pagluz-page .card-value { font-size: 1.9rem; font-family: 'Plus Jakarta Sans', 'Poppins', 'Calistoga', Georgia, serif; font-weight: 900; color: #01375a; letter-spacing: -0.5px; -webkit-text-stroke: 0.8px currentColor; }
  .pagluz-page .card-divider { border: none; height: 2px; margin: 14px 0; }
  .pagluz-page .card-left .card-divider { background-color: #cc0000; }
  .pagluz-page .card-right .card-divider { background-color: #008000; }
  .pagluz-page .economia-section {
    background-color: #01375a;
    border: 3px solid #01375a;
    border-radius: 0 0 14px 14px;
    overflow: visible;
  }
  .pagluz-page .economia-titulo {
    background-color: #01375a;
    font-family: 'Plus Jakarta Sans', 'Poppins', 'Calistoga', Georgia, serif;
    font-size: 1.35rem;
    font-weight: 900;
    font-style: italic;
    color: #fff;
    padding: 14px 20px;
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    -webkit-text-stroke: 0.5px currentColor;
  }
  .pagluz-page .economia-rows {
    background-color: #fff;
    border-radius: 0 0 11px 11px;
    padding: 18px 18px 20px;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .pagluz-page .economia-row {
    display: flex;
    align-items: center;
    gap: 0;
    padding-right: 1rem;
  }
  .pagluz-page .economia-ano {
    background-color: #079841;
    color: #fff;
    font-family: 'Inter', system-ui, sans-serif;
    font-weight: 900;
    font-size: 1.05rem;
    line-height: 1;
    padding: 16px 0;
    width: 100px;
    text-align: center;
    border-radius: 5px;
    flex-shrink: 0;
    position: relative;
    z-index: 2;
  }
  .pagluz-page .economia-valor {
    background-color: #01375a;
    color: #fff;
    font-family: 'Plus Jakarta Sans', 'Poppins', 'Calistoga', Georgia, serif;
    font-size: 1.45rem;
    font-weight: 900;
    font-style: italic;
    line-height: 1;
    padding: 6px 22px 6px 40px;
    border-radius: 8px;
    flex: 1;
    margin-left: -20px;
    position: relative;
    z-index: 1;
    -webkit-text-stroke: 0.8px currentColor;
    letter-spacing: -0.5px;
  }
`;

// ─── Componente Principal ──────────────────────────────────────
export default function SimulacaoEconomia() {
  const [form, setForm] = useState<SimulationForm>({
    clientName: '',
    descontoPercent: 15,
    valorSemPagluz: 0,
  });

  const [showPreview, setShowPreview] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [copied, setCopied] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  // ─── Cálculos automáticos ─────────────────────────────────
  const valorComPagluz = useMemo(
    () => calcularValorComPagluz(form.valorSemPagluz, form.descontoPercent),
    [form.valorSemPagluz, form.descontoPercent]
  );

  const economiaMensal = useMemo(
    () => Math.max(0, form.valorSemPagluz - valorComPagluz),
    [form.valorSemPagluz, valorComPagluz]
  );

  const projections = useMemo(
    () => calcularEconomias(economiaMensal),
    [economiaMensal]
  );

  // ─── Gerar HTML do template fiel ──────────────────────────
  const templateHtml = useMemo(() => {
    const clientName = form.clientName || 'Nome do Cliente';
    const valorSemMensal = formatNumber(form.valorSemPagluz);
    const valorSemAnual = formatNumber(form.valorSemPagluz * 12);
    const valorComMensal = formatNumber(valorComPagluz);
    const valorComAnual = formatNumber(valorComPagluz * 12);

    const projectionsHtml = projections
      .map(
        (p) => `
        <div class="economia-row" style="display:flex;align-items:center;gap:0;padding-right:1rem;margin-bottom:12px;">
          <div class="economia-ano" style="background-color:#079841;color:#fff;font-weight:900;font-size:1.05rem;display:flex;align-items:center;justify-content:center;height:52px;width:100px;min-width:100px;text-align:center;border-radius:5px;position:relative;z-index:2;">${p.label}</div>
          <div class="economia-valor" style="background-color:#01375a;color:#fff;font-size:1.4rem;font-weight:900;font-style:italic;display:flex;align-items:center;height:42px;padding:0 22px 0 40px;border-radius:8px;flex:1;margin-left:-20px;position:relative;z-index:1;">R$ ${formatNumber(p.economia)}</div>
        </div>
      `
      )
      .join('');

    return `
      <style>${templateStyles}</style>
      <div class="pagluz-page">
        <header>
          <img class="logo-img" src="${logoSvgUrl}" alt="PAGLUZ" />
        </header>

        <main>
          <h1 class="titulo">Quanto você pode economizar conosco?</h1>

          <div class="nome-cliente">
            Cliente: <span>${clientName}</span>
          </div>

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
              ${projectionsHtml}
            </div>
          </div>
        </main>
      </div>
    `;
  }, [form.clientName, form.descontoPercent, form.valorSemPagluz, valorComPagluz, projections]);

  // ─── Handlers ─────────────────────────────────────────────
  const handleReset = () => {
    setForm({ clientName: '', descontoPercent: 15, valorSemPagluz: 0 });
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const previewContainer = exportRef.current;
      const root = previewContainer?.querySelector('.pagluz-page') as HTMLElement || previewContainer;
      if (root) {
        // html-to-image accurately renders modern CSS and flexbox
        const imgData = await toPng(root, {
          cacheBust: true,
          quality: 1,
          pixelRatio: 3, // High quality 
          backgroundColor: '#ffffff'
        });

        const pdfWidth = 210; // A4 width in mm

        // Calculate the height proportionally 
        // Measure real DOM node rather than trusting canvas
        const nodeWidth = root.offsetWidth || 620;
        const nodeHeight = root.offsetHeight || 900;
        const pdfHeight = (nodeHeight * pdfWidth) / nodeWidth;

        const doc = new jsPDF({
          orientation: 'p',
          unit: 'mm',
          format: [pdfWidth, pdfHeight],
        });

        doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);

        const safeName = (form.clientName || 'cliente')
          .replace(/[^a-zA-Z0-9]/g, '_')
          .toLowerCase();

        doc.save(`proposta-pagluz-${safeName}.pdf`);
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateImage = async () => {
    setIsGeneratingImage(true);
    try {
      const previewContainer = exportRef.current;
      const root = previewContainer?.querySelector('.pagluz-page') as HTMLElement || previewContainer;
      if (root) {
        // Gera a imagem PNG em alta resolução de forma semelhante ao PDF
        const imgDataUrl = await toPng(root, {
          cacheBust: true,
          quality: 1,
          pixelRatio: 3,
          backgroundColor: '#ffffff'
        });

        const safeName = (form.clientName || 'cliente')
          .replace(/[^a-zA-Z0-9]/g, '_')
          .toLowerCase();

        const link = document.createElement('a');
        link.download = `proposta-pagluz-${safeName}.png`;
        link.href = imgDataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Erro ao gerar Imagem:', err);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const handleCopySummary = () => {
    const summary = `📊 Proposta PagLuz - ${form.clientName || 'Cliente'}\n\n💡 Valor sem PagLuz: ${formatBRL(form.valorSemPagluz)}\n🟢 Valor com PagLuz: ${formatBRL(valorComPagluz)}\n📉 Desconto: ${form.descontoPercent}%\n💰 Economia mensal: ${formatBRL(economiaMensal)}\n\n📅 Projeções:\n${projections.map((p) => `  • ${p.label}: ${formatBRL(p.economia)}`).join('\n')}`;

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const updateField = (
    field: keyof SimulationForm,
    value: string | number
  ) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-12">
      {/* ─── Premium Header ─────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-white/20 bg-white/80 backdrop-blur-xl shadow-sm mb-8">
        <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-x-4">
              <div className="h-12 w-12 bg-gradient-to-br from-accent to-accent-secondary rounded-xl flex items-center justify-center shadow-lg shadow-accent/20 text-white">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-semibold text-slate-900">
                  Geração de Propostas
                </h1>
                <p className="text-slate-500 font-medium text-sm">
                  Gere propostas de economia de energia com o template PAGLUZ.
                </p>
              </div>
            </div>
            {economiaMensal > 0 && (
              <div className="flex items-center gap-3 bg-green-50/80 backdrop-blur-sm rounded-xl px-5 py-3 border border-green-100 shadow-sm">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingDown className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-green-700 font-medium font-display">
                    Economia mensal
                  </p>
                  <p className="text-xl font-bold text-green-600 font-display">
                    {formatBRL(economiaMensal)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* ─── Main Content Grid ─────────────────────────── */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
          {/* ─── Form Panel ─────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Form Card */}
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <Calculator className="h-4 w-4 text-accent" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-slate-900">
                    Dados da Proposta
                  </h2>
                </div>
              </div>

              <div className="p-6 space-y-5">
                {/* Nome do Cliente */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                    <User className="h-4 w-4 text-accent" />
                    Nome do Cliente
                  </label>
                  <input
                    type="text"
                    value={form.clientName}
                    onChange={(e) => updateField('clientName', e.target.value)}
                    placeholder="Ex: João Silva"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 placeholder:text-slate-400 
                    focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent focus:bg-white 
                    transition-all duration-200 text-sm"
                  />
                </div>

                {/* Desconto na Energia Injetada */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                    <Percent className="h-4 w-4 text-green-500" />
                    Desconto na Energia Injetada
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={form.descontoPercent || ''}
                      onChange={(e) =>
                        updateField(
                          'descontoPercent',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="15"
                      className="w-full px-4 pr-12 py-3 rounded-xl border border-green-200 bg-green-50/50 text-slate-800 placeholder:text-slate-400 
                      focus:outline-none focus:ring-2 focus:ring-green-300/50 focus:border-green-400 focus:bg-white 
                      transition-all duration-200 text-sm font-medium"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-green-500 font-bold">
                      %
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-1">
                    Porcentagem de desconto aplicada sobre a energia injetada
                  </p>
                </div>

                {/* Valor Sem PagLuz */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-800 mb-2">
                    <DollarSign className="h-4 w-4 text-red-500" />
                    Valor Mensal{' '}
                    <span className="text-red-500 font-bold">SEM</span> PagLuz
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                      R$
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={form.valorSemPagluz || ''}
                      onChange={(e) =>
                        updateField(
                          'valorSemPagluz',
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0,00"
                      className="w-full pl-12 pr-4 py-3 rounded-xl border border-red-200 bg-red-50/50 text-slate-800 placeholder:text-slate-400 
                      focus:outline-none focus:ring-2 focus:ring-red-300/50 focus:border-red-400 focus:bg-white 
                      transition-all duration-200 text-sm font-medium"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1.5 ml-1">
                    Valor que o cliente paga atualmente na conta de energia
                  </p>
                </div>

                {/* Valor Calculado COM PagLuz (readonly) */}
                {form.valorSemPagluz > 0 && (
                  <div className="rounded-xl border border-green-200 bg-green-50/30 p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold text-green-700 flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        Valor COM PagLuz (calculado)
                      </span>
                    </div>
                    <p className="text-2xl font-bold font-display text-green-700">
                      {formatBRL(valorComPagluz)}
                    </p>
                    <p className="text-sm font-medium text-green-600 mt-1">
                      Economia de {formatBRL(economiaMensal)}/mês ({form.descontoPercent}% de desconto)
                    </p>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3">
                <button
                  onClick={handleGeneratePDF}
                  disabled={isGenerating || isGeneratingImage || !form.valorSemPagluz}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl 
                  bg-gradient-to-r from-accent to-accent-secondary text-white font-semibold text-sm
                  hover:shadow-lg hover:shadow-accent/25 hover:-translate-y-0.5 active:scale-[0.98] 
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0
                  transition-all duration-200 font-display"
                >
                  {isGenerating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Gerando PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Exportar PDF
                    </>
                  )}
                </button>

                <button
                  onClick={handleGenerateImage}
                  disabled={isGenerating || isGeneratingImage || !form.valorSemPagluz}
                  className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl 
                  bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-semibold text-sm
                  hover:shadow-lg hover:shadow-emerald-500/25 hover:-translate-y-0.5 active:scale-[0.98] 
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:translate-y-0
                  transition-all duration-200 font-display"
                >
                  {isGeneratingImage ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Gerando Imagem...
                    </>
                  ) : (
                    <>
                      <Image className="h-4 w-4" />
                      Exportar Imagem
                    </>
                  )}
                </button>

                <button
                  onClick={handleCopySummary}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl 
                  border border-slate-200 bg-white text-slate-700 font-medium text-sm
                  hover:bg-slate-50 hover:border-slate-300 hover:-translate-y-0.5 active:scale-[0.98] shadow-sm
                  transition-all duration-200"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 text-green-500" />
                      Copiado!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copiar
                    </>
                  )}
                </button>

                <button
                  onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl 
                  border border-slate-200 bg-white text-slate-500 font-medium text-sm
                  hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-[0.98] shadow-sm
                  transition-all duration-200"
                >
                  <RotateCcw className="h-4 w-4" />
                  Limpar
                </button>
              </div>
            </div>

            {/* Quick Economy Summary */}
            {economiaMensal > 0 && (
              <div className="rounded-2xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <div className="p-1.5 rounded-lg bg-green-100">
                    <Leaf className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="text-base font-display font-semibold text-green-800">
                    Resumo da Economia
                  </h3>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-white/80 p-3.5 border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">
                      Mensal
                    </p>
                    <p className="text-lg font-bold text-green-700">
                      {formatBRL(economiaMensal)}
                    </p>
                    <p className="text-xs text-green-500 mt-0.5">
                      {form.descontoPercent}% de economia
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3.5 border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">
                      Anual
                    </p>
                    <p className="text-lg font-bold text-green-700">
                      {formatBRL(economiaMensal * 12)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3.5 border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">
                      5 anos
                    </p>
                    <p className="text-lg font-bold text-green-700">
                      {formatBRL(economiaMensal * 60)}
                    </p>
                  </div>
                  <div className="rounded-xl bg-white/80 p-3.5 border border-green-100">
                    <p className="text-xs text-green-600 font-medium mb-1">
                      10 anos
                    </p>
                    <p className="text-lg font-bold text-green-700">
                      {formatBRL(economiaMensal * 120)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Preview Panel ─────────────────────────── */}
          <div className="lg:col-span-3">
            <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
              {/* Preview Header */}
              <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-lg bg-accent/10">
                    <Eye className="h-4 w-4 text-accent" />
                  </div>
                  <h2 className="text-lg font-display font-semibold text-slate-900">
                    Pré-visualização da Proposta
                  </h2>
                </div>
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="text-sm text-slate-500 hover:text-accent flex items-center gap-1 transition-colors"
                >
                  {showPreview ? (
                    <>
                      <ChevronUp className="h-4 w-4" />
                      Recolher
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      Expandir
                    </>
                  )}
                </button>
              </div>

              {showPreview && (
                <div className="p-4 md:p-6 bg-[#e0e0e0]">
                  {/* Template Preview - faithful PAGLUZ layout */}
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
