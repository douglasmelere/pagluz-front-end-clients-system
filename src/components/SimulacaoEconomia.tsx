import { useState, useMemo, useEffect, useRef } from 'react';
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
  ZapOff,
  Copy,
  Check,
} from 'lucide-react';
import defaultLogoUrl from '../assets/new-logo.svg?url';

// ─── Interfaces ────────────────────────────────────────────────
interface SimulationForm {
  clientName: string;
  consumoKwh: number;
  descontoTotal: number;
  fase: 'MONOFASICO' | 'BIFASICO' | 'TRIFASICO';
}

interface EconomyProjection {
  label: string;
  months: number;
  semPagluz: number;
  comPagluz: number;
  economia: number;
}

// ─── Utilitários ───────────────────────────────────────────────
function formatBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function calcularEconomias(
  valorSemPagluz: number,
  valorComPagluz: number
): EconomyProjection[] {
  const economiaMensal = Math.max(0, valorSemPagluz - valorComPagluz);
  const periodos = [
    { label: '1 ano', months: 12 },
    { label: '3 anos', months: 36 },
    { label: '5 anos', months: 60 },
    { label: '10 anos', months: 120 },
  ];

  return periodos.map(({ label, months }) => ({
    label,
    months,
    semPagluz: valorSemPagluz * months,
    comPagluz: valorComPagluz * months,
    economia: economiaMensal * months,
  }));
}

// ─── SVG to PNG Converter ──────────────────────────────────────
async function svgUrlToPngDataUrl(
  svgUrl: string,
  width = 200,
  height = 66
): Promise<string> {
  const svgText = await fetch(svgUrl).then((r) => r.text());
  const svgBlob = new Blob([svgText], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const domUrl = URL.createObjectURL(svgBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = domUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas context not available');
    ctx.drawImage(img, 0, 0, width, height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(domUrl);
  }
}

// ─── PDF Generator ─────────────────────────────────────────────
async function generateSimulationPDF(form: SimulationForm, valorSemPagluz: number, valorComPagluz: number) {
  // Dynamic import to avoid bundle size issues
  const { default: jsPDF } = await import('jspdf');

  const doc = new jsPDF('p', 'mm', 'a4');
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(1, 55, 90);
  doc.rect(0, 0, pageW, pageH, 'F');

  // Top header section with white background
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 10, pageW - 20, 45, 5, 5, 'F');

  // Logo
  try {
    const pngDataUrl = await svgUrlToPngDataUrl(defaultLogoUrl, 200, 66);
    doc.addImage(pngDataUrl, 'PNG', 20, 15, 50, 16.5);
  } catch {
    doc.setFontSize(16);
    doc.setTextColor(1, 55, 90);
    doc.text('PAGLUZ', 20, 28);
  }

  // Title
  doc.setFontSize(20);
  doc.setTextColor(1, 55, 90);
  doc.setFont('helvetica', 'bold');
  doc.text('PROPOSTA CONSUMIDOR', pageW / 2 + 15, 25, { align: 'center' });

  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Simulação de Economia de Energia', pageW / 2 + 15, 33, {
    align: 'center',
  });

  // Client name section
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, 62, pageW - 20, 25, 5, 5, 'F');

  doc.setFontSize(11);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('CLIENTE', 20, 72);

  doc.setFontSize(18);
  doc.setTextColor(1, 55, 90);
  doc.setFont('helvetica', 'bold');
  doc.text(form.clientName || 'Nome do Cliente', 20, 82);

  // Monthly values section
  const cardY = 95;
  const cardW = (pageW - 30) / 2;

  // Card: Sem PagLuz
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, cardY, cardW, 45, 5, 5, 'F');

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('VALOR MENSAL SEM PAGLUZ', 15, cardY + 12);

  doc.setFontSize(22);
  doc.setTextColor(1, 55, 90);
  doc.setFont('helvetica', 'bold');
  doc.text(formatBRL(valorSemPagluz), 15, cardY + 28);

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('Valor da conta de energia convencional', 15, cardY + 38);

  // Card: Com PagLuz
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10 + cardW + 10, cardY, cardW, 45, 5, 5, 'F');

  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text('VALOR MENSAL COM PAGLUZ', 15 + cardW + 10, cardY + 12);

  doc.setFontSize(22);
  doc.setTextColor(57, 172, 23);
  doc.setFont('helvetica', 'bold');
  doc.text(formatBRL(valorComPagluz), 15 + cardW + 10, cardY + 28);

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.text('Valor da conta com a PagLuz', 15 + cardW + 10, cardY + 38);

  // Monthly savings highlight
  const economiaMensal = Math.max(
    0,
    valorSemPagluz - valorComPagluz
  );
  const percentual =
    valorSemPagluz > 0
      ? ((economiaMensal / valorSemPagluz) * 100).toFixed(1)
      : '0.0';

  doc.setFillColor(57, 172, 23);
  doc.roundedRect(10, cardY + 52, pageW - 20, 25, 5, 5, 'F');

  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'normal');
  doc.text('ECONOMIA MENSAL', 20, cardY + 63);

  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${formatBRL(economiaMensal)}  (${percentual}%)`,
    pageW - 20,
    cardY + 66,
    { align: 'right' }
  );

  // Economy projections table
  const tableY = cardY + 85;

  // Table header
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(10, tableY, pageW - 20, 15, 5, 5, 'F');

  doc.setFontSize(12);
  doc.setTextColor(1, 55, 90);
  doc.setFont('helvetica', 'bold');
  doc.text('PROJEÇÃO DE ECONOMIAS', pageW / 2, tableY + 10, {
    align: 'center',
  });

  const projections = calcularEconomias(
    valorSemPagluz,
    valorComPagluz
  );
  const rowH = 20;

  projections.forEach((proj, i) => {
    const rowY = tableY + 20 + i * (rowH + 5);
    const isEven = i % 2 === 0;

    doc.setFillColor(isEven ? 255 : 245, isEven ? 255 : 248, isEven ? 255 : 255);
    doc.roundedRect(10, rowY, pageW - 20, rowH, 3, 3, 'F');

    // Period label
    doc.setFontSize(11);
    doc.setTextColor(1, 55, 90);
    doc.setFont('helvetica', 'bold');
    doc.text(proj.label.toUpperCase(), 18, rowY + 8);

    // Values row
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont('helvetica', 'normal');

    const col1 = 18;
    const col2 = 75;
    const col3 = 135;

    doc.text(`Sem PagLuz: ${formatBRL(proj.semPagluz)}`, col1, rowY + 15);
    doc.text(`Com PagLuz: ${formatBRL(proj.comPagluz)}`, col2, rowY + 15);

    doc.setTextColor(57, 172, 23);
    doc.setFont('helvetica', 'bold');
    doc.text(`Economia: ${formatBRL(proj.economia)}`, col3, rowY + 15);
  });

  // Footer
  const footerY = pageH - 20;
  doc.setFontSize(8);
  doc.setTextColor(150, 180, 210);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `PagLuz Operações de Energia • Simulação gerada em ${new Date().toLocaleDateString('pt-BR')}`,
    pageW / 2,
    footerY,
    { align: 'center' }
  );
  doc.text(
    'Os valores apresentados são estimativas e podem variar conforme condições de mercado.',
    pageW / 2,
    footerY + 5,
    { align: 'center' }
  );

  // Save
  const safeName = (form.clientName || 'cliente')
    .replace(/[^a-zA-Z0-9]/g, '_')
    .toLowerCase();
  doc.save(`simulacao-pagluz-${safeName}.pdf`);
}

// ─── Componente Principal ──────────────────────────────────────
import { useSettings } from '../hooks/useSettings';

export default function SimulacaoEconomia() {
  const { kwhPrice, fioBPercentage } = useSettings();

  const [form, setForm] = useState<SimulationForm>({
    clientName: '',
    consumoKwh: 0,
    descontoTotal: 0,
    fase: 'MONOFASICO',
  });

  const [showPreview, setShowPreview] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [templateHtml, setTemplateHtml] = useState<string | null>(null);
  const [filledHtml, setFilledHtml] = useState<string | null>(null);
  const exportRef = useRef<HTMLDivElement | null>(null);

  const { valorSemPagluz, valorComPagluz, economiaMensal, percentual } = useMemo(() => {
    const kwhValue = kwhPrice ?? 0.87;
    const fiosBPercent = fioBPercentage ?? 0;
    
    let COSIP = 30;
    let TAXAS_MINIMAS = 30.80;

    if (form.fase === 'BIFASICO') {
      COSIP = 50;
      TAXAS_MINIMAS = 57.20;
    } else if (form.fase === 'TRIFASICO') {
      COSIP = 90;
      TAXAS_MINIMAS = 105.60;
    }

    const valorConsumo = form.consumoKwh * kwhValue;
    const valorFioB = valorConsumo * (fiosBPercent / 100);
    const valorLimpo = Math.max(0, valorConsumo - COSIP - TAXAS_MINIMAS - valorFioB);
    
    const economia = valorLimpo * (form.descontoTotal / 100);
    const semPagluz = valorConsumo + COSIP;
    const comPagluz = Math.max(0, semPagluz - economia);

    const percentualCalculado = semPagluz > 0 ? ((economia / semPagluz) * 100).toFixed(1) : '0.0';

    return {
      valorSemPagluz: semPagluz,
      valorComPagluz: comPagluz,
      economiaMensal: economia,
      percentual: percentualCalculado,
    };
  }, [form.consumoKwh, form.descontoTotal, form.fase, kwhPrice, fioBPercentage]);

  const projections = useMemo(
    () => calcularEconomias(valorSemPagluz, valorComPagluz),
    [valorSemPagluz, valorComPagluz]
  );

  useEffect(() => {
    // Load the external template (kept 100% faithful in public/templates)
    fetch('/templates/simulacao-body.html')
      .then((r) => r.text())
      .then((html) => setTemplateHtml(html))
      .catch(() => setTemplateHtml(null));
  }, []);

  useEffect(() => {
    if (!templateHtml) return;

    const projHtml = projections
      .map((p, i) => `
        <div class="rounded-lg p-2.5 sm:p-3 flex items-center justify-between ${
          i % 2 === 0 ? 'bg-slate-50' : 'bg-white'
        }">
          <div>
            <p class="text-xs sm:text-sm font-bold text-[#01375A]">${p.label.toUpperCase()}</p>
            <div class="flex gap-3 mt-0.5">
              <span class="text-[9px] sm:text-[10px] text-slate-400">Sem: ${formatBRL(p.semPagluz)}</span>
              <span class="text-[9px] sm:text-[10px] text-slate-400">Com: ${formatBRL(p.comPagluz)}</span>
            </div>
          </div>
          <div class="text-right">
            <p class="text-xs sm:text-sm font-bold text-[#39AC17]">${formatBRL(p.economia)}</p>
            <p class="text-[9px] text-slate-400">economia</p>
          </div>
        </div>
      `)
      .join('');

    const replaced = templateHtml
      .replace('{{CLIENT_NAME}}', form.clientName || 'Nome do Cliente')
      .replace('{{VALOR_SEM}}', formatBRL(valorSemPagluz))
      .replace('{{VALOR_COM}}', formatBRL(valorComPagluz))
      .replace('{{ECONOMIA_MENSAL}}', formatBRL(economiaMensal))
      .replace('{{PERCENTUAL}}', percentual)
      .replace('{{PROJECTIONS}}', projHtml)
      .replace('<!-- PROJECTIONS_PLACEHOLDER -->', projHtml)
      .replace('{{DATE}}', new Date().toLocaleDateString('pt-BR'));

    setFilledHtml(replaced);
  }, [templateHtml, form.clientName, valorSemPagluz, valorComPagluz, projections, economiaMensal, percentual]);

  const handleReset = () => {
    setForm({ clientName: '', consumoKwh: 0, descontoTotal: 0, fase: 'MONOFASICO' });
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      // Prefer capturing the rendered template for pixel-perfect fidelity
      const root = exportRef.current || document.getElementById('simulation-export-root');
      if (root) {
        // Load html2canvas dynamically from CDN if not present
        if (!(window as any).html2canvas) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script');
            s.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            s.onload = () => resolve();
            s.onerror = () => reject(new Error('Failed to load html2canvas'));
            document.head.appendChild(s);
          });
        }

        // Clone node and inline computed styles to ensure fidelity
        const inlineCloneWithStyles = (el: HTMLElement) => {
          const clone = el.cloneNode(true) as HTMLElement;

          const walk = (src: Element, dst: Element) => {
            const cs = window.getComputedStyle(src as Element);
            let cssText = '';
            for (let i = 0; i < cs.length; i++) {
              const prop = cs[i];
              cssText += `${prop}:${cs.getPropertyValue(prop)};`;
            }
            (dst as HTMLElement).setAttribute('style', cssText);

            const srcChildren = Array.from(src.children || []);
            const dstChildren = Array.from(dst.children || []);
            for (let i = 0; i < srcChildren.length; i++) {
              walk(srcChildren[i], dstChildren[i]);
            }
          };

          walk(el, clone);
          return clone;
        };

        const clone = inlineCloneWithStyles(root as HTMLElement);
        // Ensure fonts are available by copying font links from head
        const existingFontLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis"]')) as HTMLLinkElement[];
        existingFontLinks.forEach((ln) => {
          const copy = ln.cloneNode(true) as HTMLLinkElement;
          clone.insertAdjacentElement('afterbegin', copy);
        });

        // Append clone visibly off-screen for accurate rendering
        clone.style.position = 'fixed';
        clone.style.left = '-9999px';
        clone.style.top = '0';
        clone.style.zIndex = '99999';
        document.body.appendChild(clone);

        const html2canvas = (window as any).html2canvas;
        const canvas = await html2canvas(clone, { scale: 2, useCORS: true });
        // remove clone after capture
        document.body.removeChild(clone);

        const imgData = canvas.toDataURL('image/png');

        const { default: jsPDF } = await import('jspdf');
        const doc = new jsPDF('p', 'mm', 'a4');
        const pageW = doc.internal.pageSize.getWidth();
        const imgW = pageW - 10; // small margin
        const imgH = (canvas.height * imgW) / canvas.width;
        doc.addImage(imgData, 'PNG', 5, 5, imgW, imgH);
        const safeName = (form.clientName || 'cliente').replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
        doc.save(`simulacao-pagluz-${safeName}.pdf`);
      } else {
        await generateSimulationPDF(form, valorSemPagluz, valorComPagluz);
      }
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopySummary = () => {
    const summary = `📊 Simulação PagLuz - ${form.clientName || 'Cliente'}\n\n💡 Valor sem PagLuz: ${formatBRL(valorSemPagluz)}\n🟢 Valor com PagLuz: ${formatBRL(valorComPagluz)}\n💰 Economia mensal: ${formatBRL(economiaMensal)} (${percentual}%)\n\n📅 Projeções:\n${projections.map((p) => `  • ${p.label}: ${formatBRL(p.economia)}`).join('\n')}`;

    navigator.clipboard.writeText(summary).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const updateField = (field: keyof SimulationForm, value: string | number) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* ─── Hero Header ─────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-[#01375A] via-[#024178] to-[#013568]" />
        <div className="absolute inset-0 dot-pattern-light" />
        <div className="relative p-6 md:p-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2.5 rounded-xl bg-white/10 backdrop-blur-sm">
                  <Zap className="h-6 w-6 text-green-400" />
                </div>
                <h1 className="text-2xl md:text-3xl font-semibold text-white">
                  Simulação de Economia
                </h1>
              </div>
              <p className="text-blue-200/80 ml-14">
                Gere simulações de economia de energia com o template PagLuz e
                exporte como PDF profissional.
              </p>
            </div>
            {economiaMensal > 0 && (
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 border border-white/10">
                <TrendingDown className="h-5 w-5 text-green-400" />
                <div>
                  <p className="text-xs text-blue-200/70 font-medium">
                    Economia mensal
                  </p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatBRL(economiaMensal)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ─── Main Content Grid ─────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* ─── Form Panel ─────────────────────────────── */}
        <div className="lg:col-span-2 space-y-5">
          {/* Form Card */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-accent/10">
                  <Calculator className="h-4 w-4 text-accent" />
                </div>
                <h2 className="text-base font-semibold text-slate-800">
                  Dados da Simulação
                </h2>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Nome do Cliente */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
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

              {/* Fase do Relógio */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <ZapOff className="h-4 w-4 text-purple-500" />
                  Tipo de Fase
                </label>
                <div className="relative">
                  <select
                    value={form.fase}
                    onChange={(e) => updateField('fase', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-purple-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-300/50 focus:border-purple-400 focus:bg-white transition-all duration-200 text-sm font-medium appearance-none"
                  >
                    <option value="MONOFASICO">Monofásico</option>
                    <option value="BIFASICO">Bifásico</option>
                    <option value="TRIFASICO">Trifásico</option>
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
                <p className="text-xs text-slate-400 mt-1.5 ml-1">
                  Usado para determinar o valor da COSIP e das Taxas Mínimas
                </p>
              </div>

              {/* Consumo em kWh */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <Zap className="h-4 w-4 text-blue-500" />
                  Quantidade Total de kWh da Fatura
                </label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                    kWh
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.consumoKwh || ''}
                    onChange={(e) => updateField('consumoKwh', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 350"
                    className="w-full px-4 py-3 rounded-xl border border-blue-200 bg-blue-50/50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-blue-400 focus:bg-white transition-all duration-200 text-sm font-medium"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 ml-1">
                  O consumo total em kWh medido na fatura de energia
                </p>
              </div>

              {/* Desconto Total */}
              <div>
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2">
                  <TrendingDown className="h-4 w-4 text-green-500" />
                  Desconto Total Aplicado
                </label>
                <div className="relative">
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-slate-400 font-medium">
                    %
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={form.descontoTotal || ''}
                    onChange={(e) => updateField('descontoTotal', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 15"
                    className="w-full px-4 py-3 rounded-xl border border-green-200 bg-green-50/50 text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-green-300/50 focus:border-green-400 focus:bg-white transition-all duration-200 text-sm font-medium"
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1.5 ml-1">
                  Desconto percentual oferecido sobre a economia gerada
                </p>
              </div>
            </div>

            {/* Action buttons */}
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-wrap gap-3">
              <button
                onClick={handleGeneratePDF}
                disabled={isGenerating || !form.consumoKwh}
                className="flex-1 min-w-[140px] flex items-center justify-center gap-2 px-5 py-3 rounded-xl 
                  bg-gradient-to-r from-[#01375A] to-[#024178] text-white font-semibold text-sm
                  hover:shadow-lg hover:shadow-[#01375A]/25 active:scale-[0.98] 
                  disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none
                  transition-all duration-200"
              >
                {isGenerating ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Exportar PDF
                  </>
                )}
              </button>

              <button
                onClick={handleCopySummary}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl 
                  border border-slate-200 bg-white text-slate-700 font-medium text-sm
                  hover:bg-slate-50 hover:border-slate-300 active:scale-[0.98]
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
                  hover:bg-red-50 hover:text-red-600 hover:border-red-200 active:scale-[0.98]
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
                <h3 className="text-sm font-semibold text-green-800">
                  Resumo da Economia
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-white/80 p-3.5 border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-1">Mensal</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatBRL(economiaMensal)}
                  </p>
                  <p className="text-xs text-green-500 mt-0.5">{percentual}% de economia</p>
                </div>
                <div className="rounded-xl bg-white/80 p-3.5 border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-1">Anual</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatBRL(economiaMensal * 12)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/80 p-3.5 border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-1">5 anos</p>
                  <p className="text-lg font-bold text-green-700">
                    {formatBRL(economiaMensal * 60)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/80 p-3.5 border border-green-100">
                  <p className="text-xs text-green-600 font-medium mb-1">10 anos</p>
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
                <h2 className="text-base font-semibold text-slate-800">
                  Pré-visualização
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
              <div className="p-4 md:p-6 bg-slate-100/50">
                {/* Template Preview - renders the external template (100% faithful) */}
                <div className="mx-auto" style={{ maxWidth: '600px' }}>
                  {filledHtml ? (
                    <div id="simulation-preview-root" dangerouslySetInnerHTML={{ __html: filledHtml }} />
                  ) : (
                    <div className="p-6 text-sm text-slate-500">Carregando template...</div>
                  )}
                </div>
                {/* Hidden export node (same content) */}
                <div id="simulation-export-root" ref={exportRef} style={{ position: 'fixed', left: -9999, top: -9999 }} aria-hidden>
                  {filledHtml ? (
                    <div dangerouslySetInnerHTML={{ __html: filledHtml }} />
                  ) : null}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
