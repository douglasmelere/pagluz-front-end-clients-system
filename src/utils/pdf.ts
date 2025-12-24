// @ts-ignore - Tipos opcionais do jsPDF podem não ser resolvidos em alguns ambientes
import jsPDF from 'jspdf';
import { SimulationResults, formatCurrency } from './calculations';
import defaultLogoUrl from '../assets/new-logo.svg?url';

export function generateProposalPDF(
  clientName: string | undefined,
  results: SimulationResults,
  logoBase64?: string
) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 15;
  let y = 20;

  if (logoBase64) {
    try {
      doc.addImage(logoBase64, 'PNG', marginX, y - 10, 30, 12);
    } catch {}
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Proposta de Economia - Pagluz', pageWidth / 2, y, { align: 'center' });
  y += 8;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.text(`Cliente: ${clientName || 'Não informado'}`, marginX, y);
  y += 10;

  // Resumo
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo', marginX, y); y += 6;
  doc.setFont('helvetica', 'normal');
  const rows = [
    ['Conta CELESC (média mensal)', formatCurrency(results.celescValue)],
    ['Conta com Pagluz (média mensal)', formatCurrency(results.pagluzValue)],
    ['Economia Mensal', formatCurrency(results.monthlySavings)],
    ['Economia Anual', formatCurrency(results.projections.oneYear.savings)]
  ];
  rows.forEach(([label, value]) => {
    doc.text(label, marginX, y);
    doc.text(value, pageWidth - marginX, y, { align: 'right' });
    y += 7;
  });

  // Projeções
  y += 4; doc.setFont('helvetica', 'bold'); doc.text('Projeções', marginX, y); y += 6; doc.setFont('helvetica', 'normal');
  const proj = results.projections;
  const projRows = [
    ['1 mês', proj.oneMonth],
    ['1 ano', proj.oneYear],
    ['3 anos', proj.threeYears],
    ['5 anos', proj.fiveYears],
    ['10 anos', proj.tenYears]
  ];
  projRows.forEach(([label, p]) => {
    const pr = p as any;
    doc.text(label as string, marginX, y);
    doc.text(`CELESC: ${formatCurrency(pr.celesc)}  |  Pagluz: ${formatCurrency(pr.pagluz)}  |  Economia: ${formatCurrency(pr.savings)}`, pageWidth - marginX, y, { align: 'right' });
    y += 7;
  });

  doc.save(`proposta-pagluz-${clientName || 'cliente'}.pdf`);
}


// Utilitário: converte um SVG (via URL) para PNG (data URL) para uso no jsPDF
async function svgUrlToPngDataUrl(svgUrl: string, width = 120, height = 40): Promise<string> {
  const svgText = await fetch(svgUrl).then(r => r.text());
  const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
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

// Gera PDF embutindo a logo padrão do projeto automaticamente
export async function generateProposalPDFEmbedded(
  clientName: string | undefined,
  results: SimulationResults
) {
  try {
    const pngDataUrl = await svgUrlToPngDataUrl(defaultLogoUrl, 120, 40);
    generateProposalPDF(clientName, results, pngDataUrl);
  } catch {
    // Se falhar a conversão, gera sem logo
    generateProposalPDF(clientName, results);
  }
}


