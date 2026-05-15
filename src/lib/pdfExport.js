import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];

const CATEGORY_LABELS = {
  alimentacao: 'Alimentação',
  transporte:  'Transporte',
  lazer:       'Lazer',
  moradia:     'Moradia',
  saude:       'Saúde',
  outros:      'Outros',
  metas:       'Metas',
};

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2 });
}

function formatDate(iso) {
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

function normalizeFilename(str) {
  return str.normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function getLastThreeMonths() {
  const now = new Date();
  return [0, 1, 2].map((offset) => {
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1);
    return {
      iso:   `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
    };
  });
}

export function exportMonthlyPDF({ transactions, monthISO, userName }) {
  const [year, month] = monthISO.split('-');
  const monthName = MONTH_NAMES[parseInt(month, 10) - 1];
  const monthYear = `${monthName} ${year}`;

  const filtered = transactions
    .filter((t) => t.date.startsWith(monthISO))
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  let income = 0;
  let expense = 0;
  for (const t of filtered) {
    if (t.type === 'income') income += Number(t.amount);
    else expense += Number(t.amount);
  }
  const balance = income - expense;

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;

  const now = new Date();
  const nowDate = now.toLocaleDateString('pt-BR');
  const nowTime = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const nowStr  = `${nowDate} às ${nowTime}`;

  // ── Accent bar top ──────────────────────────────────────────────────────────
  doc.setFillColor(239, 35, 60);
  doc.rect(0, 0, pageW, 3, 'F');

  // ── Brand + title ───────────────────────────────────────────────────────────
  let y = 17;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(15, 15, 15);
  doc.text('VibeFinance', margin, y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(239, 35, 60);
  doc.text(monthYear, pageW - margin, y, { align: 'right' });

  y += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(110, 110, 110);
  doc.text('Relatório Financeiro Mensal', margin, y);

  y += 5;
  doc.setFontSize(8.5);
  doc.setTextColor(150, 150, 150);
  doc.text(`Usuário: ${userName}`, margin, y);
  doc.text(`Gerado em: ${nowStr}`, pageW - margin, y, { align: 'right' });

  y += 5;
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.3);
  doc.line(margin, y, pageW - margin, y);

  // ── Summary cards ───────────────────────────────────────────────────────────
  y += 9;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('RESUMO DO MÊS', margin, y);

  y += 5;
  const cards = [
    { label: 'RECEITAS',     value: `R$ ${brl(income)}`,   accent: [16, 185, 129],  bg: [240, 253, 244] },
    { label: 'DESPESAS',     value: `R$ ${brl(expense)}`,  accent: [239, 35, 60],   bg: [255, 242, 244] },
    { label: 'SALDO DO MÊS', value: `R$ ${brl(balance)}`,  accent: [59, 130, 246],  bg: [239, 246, 255] },
    { label: 'TRANSAÇÕES',   value: String(filtered.length), accent: [107, 114, 128], bg: [248, 250, 252] },
  ];
  const gap    = 3;
  const cardW  = (pageW - margin * 2 - gap * 3) / 4;
  const cardH  = 20;

  cards.forEach((card, i) => {
    const cx = margin + i * (cardW + gap);
    doc.setFillColor(...card.bg);
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'F');
    doc.setFillColor(...card.accent);
    doc.rect(cx, y, 2.5, cardH, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(120, 120, 120);
    doc.text(card.label, cx + 5, y + 6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(balance < 0 && card.label === 'SALDO DO MÊS' ? 8.5 : 9.5);
    doc.setTextColor(...card.accent);
    doc.text(card.value, cx + 5, y + 14.5);
  });

  y += cardH + 10;

  // ── Transactions table ──────────────────────────────────────────────────────
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('TRANSAÇÕES', margin, y);
  y += 4;

  if (filtered.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text('Nenhuma transação encontrada neste mês.', margin, y + 8);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
      body: filtered.map((t) => [
        formatDate(t.date),
        t.title,
        CATEGORY_LABELS[t.category] ?? t.category,
        t.type === 'income' ? 'Receita' : 'Despesa',
        (t.type === 'income' ? '+ ' : '- ') + 'R$ ' + brl(t.amount),
      ]),
      styles: {
        font: 'helvetica',
        fontSize: 8.5,
        cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 },
        textColor: [30, 30, 30],
        lineColor: [225, 225, 225],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [25, 25, 25],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
      },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 28 },
        3: { cellWidth: 20 },
        4: { cellWidth: 32, halign: 'right' },
      },
      didParseCell(data) {
        if (data.section !== 'body') return;
        if (data.column.index === 3 || data.column.index === 4) {
          const t = filtered[data.row.index];
          if (t) {
            data.cell.styles.textColor =
              t.type === 'income' ? [16, 185, 129] : [239, 35, 60];
          }
        }
      },
    });
  }

  // ── Footer on every page ────────────────────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    const pH = doc.internal.pageSize.getHeight();

    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, pH - 14, pageW - margin, pH - 14);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(170, 170, 170);
    doc.text('Gerado por VibeFinance • vibeFinance.app', margin, pH - 9);
    doc.text(
      `${nowStr} • Página ${p} de ${pageCount}`,
      pageW - margin,
      pH - 9,
      { align: 'right' },
    );

    doc.setFillColor(239, 35, 60);
    doc.rect(0, pH - 3, pageW, 3, 'F');
  }

  const safeMonth = normalizeFilename(monthName);
  doc.save(`VibeFinance_Relatorio_${safeMonth}_${year}.pdf`);
}
