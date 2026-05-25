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

export function generateAnnualReport({ transactions, year, userName }) {
  const yearNum = parseInt(year, 10);

  const monthly = Array.from({ length: 12 }, (_, i) => {
    const iso = `${year}-${String(i + 1).padStart(2, '0')}`;
    const txs = transactions.filter((t) => t.date.startsWith(iso));
    let income = 0, expense = 0;
    for (const t of txs) {
      if (t.type === 'income') income += Number(t.amount);
      else expense += Number(t.amount);
    }
    return { month: i, iso, income, expense, balance: income - expense, count: txs.length };
  });

  const yearTxs = transactions.filter((t) => t.date.startsWith(year));
  const totalIncome  = monthly.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthly.reduce((s, m) => s + m.expense, 0);
  const totalBalance = totalIncome - totalExpense;

  const catTotals = {};
  for (const t of yearTxs) {
    if (t.type !== 'expense') continue;
    catTotals[t.category] = (catTotals[t.category] ?? 0) + Number(t.amount);
  }
  const top5 = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat, val]) => [CATEGORY_LABELS[cat] ?? cat, `R$ ${brl(val)}`]);

  const worstMonth  = [...monthly].sort((a, b) => b.expense - a.expense)[0];
  const bestMonth   = [...monthly].filter((m) => m.income > 0).sort((a, b) => b.balance - a.balance)[0];

  let accumulated = 0;
  const patrimony = monthly.map((m) => {
    accumulated += m.balance;
    return { ...m, accumulated };
  });

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 18;

  const now = new Date();
  const nowStr = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  function drawHeader(doc, title, subtitle) {
    doc.setFillColor(239, 35, 60);
    doc.rect(0, 0, pageW, 3, 'F');
    let y = 17;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.setTextColor(15, 15, 15);
    doc.text('VibeFinance', margin, y);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(239, 35, 60);
    doc.text(title, pageW - margin, y, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(110, 110, 110);
    doc.text(subtitle, margin, y);
    y += 5;
    doc.setFontSize(8.5);
    doc.setTextColor(150, 150, 150);
    doc.text(`Usuário: ${userName}`, margin, y);
    doc.text(`Gerado em: ${nowStr}`, pageW - margin, y, { align: 'right' });
    y += 5;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    return y + 9;
  }

  // ── PAGE 1 ──────────────────────────────────────────────────────────────────
  let y = drawHeader(doc, String(year), 'Relatório Financeiro Anual');

  // Summary cards
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('RESUMO ANUAL', margin, y);
  y += 5;

  const cards = [
    { label: 'RECEITAS TOTAIS', value: `R$ ${brl(totalIncome)}`,   accent: [16, 185, 129],  bg: [240, 253, 244] },
    { label: 'DESPESAS TOTAIS', value: `R$ ${brl(totalExpense)}`,  accent: [239, 35, 60],   bg: [255, 242, 244] },
    { label: 'SALDO DO ANO',    value: `R$ ${brl(totalBalance)}`,  accent: [59, 130, 246],  bg: [239, 246, 255] },
    { label: 'TRANSAÇÕES',      value: String(yearTxs.length),     accent: [107, 114, 128], bg: [248, 250, 252] },
  ];
  const gap   = 3;
  const cardW = (pageW - margin * 2 - gap * 3) / 4;
  const cardH = 20;
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
    doc.setFontSize(9);
    doc.setTextColor(...card.accent);
    doc.text(card.value, cx + 5, y + 14.5);
  });
  y += cardH + 8;

  // Highlights
  if (worstMonth || bestMonth) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text('DESTAQUES', margin, y);
    y += 5;

    const highlights = [];
    if (worstMonth && worstMonth.expense > 0) {
      highlights.push({ label: 'MÊS COM MAIOR GASTO', value: `${MONTH_NAMES[worstMonth.month]} — R$ ${brl(worstMonth.expense)}`, accent: [239, 35, 60], bg: [255, 242, 244] });
    }
    if (bestMonth) {
      highlights.push({ label: 'MELHOR MÊS (SALDO)', value: `${MONTH_NAMES[bestMonth.month]} — R$ ${brl(bestMonth.balance)}`, accent: [16, 185, 129], bg: [240, 253, 244] });
    }
    const hW = highlights.length === 2 ? (pageW - margin * 2 - gap) / 2 : pageW - margin * 2;
    highlights.forEach((h, i) => {
      const cx = margin + i * (hW + gap);
      doc.setFillColor(...h.bg);
      doc.roundedRect(cx, y, hW, 16, 2, 2, 'F');
      doc.setFillColor(...h.accent);
      doc.rect(cx, y, 2.5, 16, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.5);
      doc.setTextColor(120, 120, 120);
      doc.text(h.label, cx + 5, y + 5.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...h.accent);
      doc.text(h.value, cx + 5, y + 12);
    });
    y += 24;
  }

  // Monthly table
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('EVOLUÇÃO MENSAL', margin, y);
  y += 4;

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Mês', 'Receitas', 'Despesas', 'Saldo do Mês', 'Patrimônio Acum.']],
    body: patrimony.map((m) => [
      MONTH_NAMES[m.month],
      `R$ ${brl(m.income)}`,
      `R$ ${brl(m.expense)}`,
      `R$ ${brl(m.balance)}`,
      `R$ ${brl(m.accumulated)}`,
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
      0: { cellWidth: 28 },
      1: { cellWidth: 36, halign: 'right' },
      2: { cellWidth: 36, halign: 'right' },
      3: { cellWidth: 36, halign: 'right' },
      4: { cellWidth: 'auto', halign: 'right' },
    },
    didParseCell(data) {
      if (data.section !== 'body') return;
      const m = patrimony[data.row.index];
      if (!m) return;
      if (data.column.index === 3) {
        data.cell.styles.textColor = m.balance >= 0 ? [16, 185, 129] : [239, 35, 60];
      }
      if (data.column.index === 4) {
        data.cell.styles.textColor = m.accumulated >= 0 ? [59, 130, 246] : [239, 35, 60];
      }
    },
  });

  // ── PAGE 2 ──────────────────────────────────────────────────────────────────
  doc.addPage();
  y = drawHeader(doc, String(year), 'Relatório Financeiro Anual');

  // Top 5 categories
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('TOP 5 CATEGORIAS POR GASTO', margin, y);
  y += 4;

  if (top5.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text('Nenhuma despesa registrada no ano.', margin, y + 8);
    y += 20;
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Categoria', 'Total Gasto']],
      body: top5.map((row, i) => [String(i + 1), row[0], row[1]]),
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
        textColor: [30, 30, 30],
        lineColor: [225, 225, 225],
        lineWidth: 0.2,
      },
      headStyles: {
        fillColor: [25, 25, 25],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 50, halign: 'right', textColor: [239, 35, 60], fontStyle: 'bold' },
      },
    });
    y = doc.lastAutoTable.finalY + 12;
  }

  // Bar chart: income vs expense per month
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.text('RECEITAS vs DESPESAS — GRÁFICO MENSAL', margin, y);
  y += 6;

  const chartX = margin;
  const chartW = pageW - margin * 2;
  const chartH = 55;
  const maxVal = Math.max(...monthly.map((m) => Math.max(m.income, m.expense)), 1);
  const barGroupW = chartW / 12;
  const barW = barGroupW * 0.32;

  doc.setFillColor(245, 245, 245);
  doc.roundedRect(chartX, y, chartW, chartH, 2, 2, 'F');

  const gridLines = 4;
  for (let g = 0; g <= gridLines; g++) {
    const gy = y + chartH - (g / gridLines) * (chartH - 8) - 4;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.2);
    doc.line(chartX + 2, gy, chartX + chartW - 2, gy);
    if (g > 0) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(5.5);
      doc.setTextColor(180, 180, 180);
      doc.text(`R$${brl((maxVal * g) / gridLines)}`, chartX + 3, gy - 1);
    }
  }

  monthly.forEach((m, i) => {
    const groupX = chartX + i * barGroupW + barGroupW * 0.08;
    const incomeH = m.income > 0 ? ((m.income / maxVal) * (chartH - 12)) : 0;
    const expH    = m.expense > 0 ? ((m.expense / maxVal) * (chartH - 12)) : 0;
    const baseY   = y + chartH - 8;

    doc.setFillColor(16, 185, 129);
    if (incomeH > 0) doc.rect(groupX, baseY - incomeH, barW, incomeH, 'F');

    doc.setFillColor(239, 35, 60);
    if (expH > 0) doc.rect(groupX + barW + 0.8, baseY - expH, barW, expH, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(130, 130, 130);
    doc.text(MONTH_NAMES[m.month].slice(0, 3), groupX + barW * 0.5, baseY + 3.5, { align: 'center' });
  });

  // Legend
  const legendY = y + chartH + 5;
  doc.setFillColor(16, 185, 129);
  doc.rect(margin, legendY, 7, 3.5, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(80, 80, 80);
  doc.text('Receitas', margin + 9, legendY + 3);

  doc.setFillColor(239, 35, 60);
  doc.rect(margin + 35, legendY, 7, 3.5, 'F');
  doc.text('Despesas', margin + 44, legendY + 3);

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
    doc.text(`${nowStr} • Página ${p} de ${pageCount}`, pageW - margin, pH - 9, { align: 'right' });
    doc.setFillColor(239, 35, 60);
    doc.rect(0, pH - 3, pageW, 3, 'F');
  }

  doc.save(`VibeFinance_Relatorio_Anual_${year}.pdf`);
}

// ─── Helper: lista de meses entre dois ISO dates ─────────────────────────────
function getMonthsInRange(startISO, endISO) {
  const [sy, sm] = startISO.split('-').map(Number);
  const [ey, em] = endISO.split('-').map(Number);
  const result = [];
  let y = sy, m = sm;
  while (y < ey || (y === ey && m <= em)) {
    result.push({ year: y, month: m - 1, iso: `${y}-${String(m).padStart(2, '0')}` });
    if (++m > 12) { m = 1; y++; }
  }
  return result;
}

export function exportAnnualReport({
  transactions,
  installments = [],
  subscriptions = [],
  goals = [],
  startDate,
  endDate,
  userName = 'Usuário',
}) {
  const [start, end] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];

  const filtered = transactions
    .filter((t) => t.date >= start && t.date <= end)
    .sort((a, b) => (a.date < b.date ? -1 : 1));

  const months = getMonthsInRange(start, end);

  const monthly = months.map(({ year, month, iso }) => {
    const txs = filtered.filter((t) => t.date.startsWith(iso));
    let income = 0, expense = 0;
    for (const t of txs) {
      if (t.type === 'income') income += Number(t.amount);
      else expense += Number(t.amount);
    }
    return { year, month, iso, income, expense, balance: income - expense, txs };
  });

  const totalIncome  = monthly.reduce((s, m) => s + m.income, 0);
  const totalExpense = monthly.reduce((s, m) => s + m.expense, 0);
  const netBalance   = totalIncome - totalExpense;

  const activeMonths = monthly.filter((m) => m.income > 0 || m.expense > 0);
  const bestMonth  = activeMonths.length > 0 ? [...activeMonths].sort((a, b) => b.balance - a.balance)[0] : null;
  const worstMonth = activeMonths.filter((m) => m.expense > 0).sort((a, b) => b.expense - a.expense)[0] ?? null;

  const catTotals = {};
  for (const t of filtered) {
    if (t.type !== 'expense') continue;
    catTotals[t.category] = (catTotals[t.category] ?? 0) + Number(t.amount);
  }
  const catRows = Object.entries(catTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => ({ cat, label: CATEGORY_LABELS[cat] ?? cat, val }));

  const subsTotal = subscriptions.reduce((s, sub) => {
    const amt = Number(sub.amount);
    return s + (sub.cycle === 'monthly' ? amt * months.length : amt);
  }, 0);
  const installTotal = installments.reduce((s, inst) => s + Number(inst.total_amount), 0);

  const top10 = [...filtered].sort((a, b) => Number(b.amount) - Number(a.amount)).slice(0, 10);

  // Quarterly groups (up to 4, each up to 3 months)
  const quarterGroups = [[], [], [], []];
  months.forEach((m, i) => { quarterGroups[Math.min(Math.floor(i / 3), 3)].push(m); });
  const quarters = quarterGroups
    .map((qMs, qi) => ({
      label: `Trimestre ${'IIIIIIVIV'.slice(qi * 2, qi * 2 + (qi === 3 ? 2 : qi === 2 ? 2 : qi === 1 ? 2 : 1))}`,
      txs:     qMs.flatMap((m) => m.txs),
      income:  qMs.reduce((s, m) => s + m.income, 0),
      expense: qMs.reduce((s, m) => s + m.expense, 0),
      months:  qMs,
    }))
    .filter((q) => q.months.length > 0);

  // Fix quarter roman numeral labels
  const ROMAN = ['I', 'II', 'III', 'IV'];
  quarters.forEach((q, i) => { q.label = `Trimestre ${ROMAN[i]}`; });

  // ── PDF setup ─────────────────────────────────────────────────────────────
  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 18;
  const now    = new Date();
  const nowStr = `${now.toLocaleDateString('pt-BR')} às ${now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;

  const [sy, sm] = start.split('-');
  const [ey, em] = end.split('-');
  const startLabel  = `${MONTH_NAMES[parseInt(sm, 10) - 1]} ${sy}`;
  const endLabel    = `${MONTH_NAMES[parseInt(em, 10) - 1]} ${ey}`;
  const periodStr   = startLabel === endLabel ? startLabel : `${startLabel} — ${endLabel}`;
  const yearStr     = sy === ey ? sy : `${sy}–${ey}`;

  // ── Helper: standard page header ──────────────────────────────────────────
  function drawHeader(title, subtitle) {
    doc.setFillColor(239, 35, 60);
    doc.rect(0, 0, pageW, 3, 'F');
    let y = 17;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.setTextColor(15, 15, 15);
    doc.text('VibeFinance', margin, y);
    doc.setFontSize(13);
    doc.setTextColor(239, 35, 60);
    doc.text(title, pageW - margin, y, { align: 'right' });
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(subtitle, margin, y);
    y += 5;
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Usuário: ${userName}`, margin, y);
    doc.text(`Gerado em: ${nowStr}`, pageW - margin, y, { align: 'right' });
    y += 5;
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    return y + 8;
  }

  function sectionLabel(text, y) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    doc.text(text, margin, y);
    return y + 5;
  }

  function emptyNote(text, y) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(160, 160, 160);
    doc.text(text, margin, y + 8);
  }

  // ── Page 1: Cover ─────────────────────────────────────────────────────────
  doc.setFillColor(15, 15, 15);
  doc.rect(0, 0, pageW, pageH, 'F');

  doc.setFillColor(239, 35, 60);
  doc.rect(0, 0, pageW, 4, 'F');
  doc.rect(0, pageH - 4, pageW, 4, 'F');
  doc.rect(0, 0, 6, pageH, 'F');

  const cy = pageH / 2 - 22;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(52);
  doc.setTextColor(255, 255, 255);
  doc.text('VIBE', pageW / 2, cy, { align: 'center' });
  doc.setTextColor(239, 35, 60);
  doc.text('FINANCE', pageW / 2, cy + 20, { align: 'center' });

  doc.setDrawColor(239, 35, 60);
  doc.setLineWidth(0.6);
  doc.line(margin * 2, cy + 26, pageW - margin * 2, cy + 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(14);
  doc.setTextColor(180, 180, 180);
  doc.text('RELATÓRIO ANUAL', pageW / 2, cy + 36, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(113, 113, 122);
  doc.text(periodStr, pageW / 2, cy + 47, { align: 'center' });

  doc.setFontSize(8);
  doc.setTextColor(70, 70, 70);
  doc.text(`Gerado em ${nowStr}  •  ${userName}`, pageW / 2, pageH - 16, { align: 'center' });

  // ── Page 2: Annual Summary ────────────────────────────────────────────────
  doc.addPage();
  let y = drawHeader(`Resumo ${yearStr}`, `Relatório Financeiro Anual — ${periodStr}`);

  y = sectionLabel('RESUMO DO PERÍODO', y);

  const summaryCards = [
    { label: 'RECEITAS',      value: `R$ ${brl(totalIncome)}`,   accent: [16, 185, 129],  bg: [240, 253, 244] },
    { label: 'DESPESAS',      value: `R$ ${brl(totalExpense)}`,  accent: [239, 35, 60],   bg: [255, 242, 244] },
    { label: 'SALDO LÍQUIDO', value: `R$ ${brl(netBalance)}`,    accent: netBalance >= 0 ? [59, 130, 246] : [239, 35, 60], bg: netBalance >= 0 ? [239, 246, 255] : [255, 242, 244] },
    { label: 'TRANSAÇÕES',    value: String(filtered.length),    accent: [107, 114, 128], bg: [248, 250, 252] },
  ];
  const gap   = 3;
  const cardW = (pageW - margin * 2 - gap * 3) / 4;
  const cardH = 20;
  summaryCards.forEach((card, i) => {
    const cx = margin + i * (cardW + gap);
    doc.setFillColor(...card.bg);
    doc.roundedRect(cx, y, cardW, cardH, 2, 2, 'F');
    doc.setFillColor(...card.accent);
    doc.rect(cx, y, 2.5, cardH, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.setTextColor(120, 120, 120);
    doc.text(card.label, cx + 5, y + 6);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...card.accent);
    doc.text(card.value, cx + 5, y + 14.5);
  });
  y += cardH + 6;

  // Highlights row
  const highlights = [
    bestMonth  && { label: 'MELHOR MÊS',        value: `${MONTH_NAMES[bestMonth.month]} ${bestMonth.year} — R$ ${brl(bestMonth.balance)}`,   accent: [16, 185, 129], bg: [240, 253, 244] },
    worstMonth && { label: 'MAIOR GASTO',        value: `${MONTH_NAMES[worstMonth.month]} ${worstMonth.year} — R$ ${brl(worstMonth.expense)}`, accent: [239, 35, 60],  bg: [255, 242, 244] },
    subsTotal > 0    && { label: 'TOTAL ASSINATURAS',   value: `R$ ${brl(subsTotal)}`,   accent: [107, 114, 128], bg: [248, 250, 252] },
    installTotal > 0 && { label: 'TOTAL PARCELAMENTOS', value: `R$ ${brl(installTotal)}`, accent: [107, 114, 128], bg: [248, 250, 252] },
  ].filter(Boolean);

  if (highlights.length > 0) {
    const hGap = 3;
    const hW   = (pageW - margin * 2 - hGap * (highlights.length - 1)) / highlights.length;
    const hH   = 14;
    highlights.forEach((h, i) => {
      const cx = margin + i * (hW + hGap);
      doc.setFillColor(...h.bg);
      doc.roundedRect(cx, y, hW, hH, 2, 2, 'F');
      doc.setFillColor(...h.accent);
      doc.rect(cx, y, 2.5, hH, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.setTextColor(120, 120, 120);
      doc.text(h.label, cx + 5, y + 4.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...h.accent);
      doc.text(h.value, cx + 5, y + 10.5);
    });
    y += hH + 7;
  }

  // Monthly evolution table
  y = sectionLabel('EVOLUÇÃO MENSAL', y);
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [['Mês', 'Receitas', 'Despesas', 'Saldo']],
    body: monthly.map((m) => [
      `${MONTH_NAMES[m.month]} ${m.year}`,
      `R$ ${brl(m.income)}`,
      `R$ ${brl(m.expense)}`,
      `R$ ${brl(m.balance)}`,
    ]),
    foot: [['TOTAL', `R$ ${brl(totalIncome)}`, `R$ ${brl(totalExpense)}`, `R$ ${brl(netBalance)}`]],
    styles: { font: 'helvetica', fontSize: 8.5, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: [30, 30, 30], lineColor: [225, 225, 225], lineWidth: 0.2 },
    headStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 } },
    footStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
    alternateRowStyles: { fillColor: [250, 251, 252] },
    columnStyles: {
      0: { cellWidth: 44 },
      1: { cellWidth: 'auto', halign: 'right' },
      2: { cellWidth: 'auto', halign: 'right' },
      3: { cellWidth: 'auto', halign: 'right' },
    },
    didParseCell(data) {
      if (data.section !== 'body' || data.column.index !== 3) return;
      const m = monthly[data.row.index];
      if (m) data.cell.styles.textColor = m.balance >= 0 ? [16, 185, 129] : [239, 35, 60];
    },
  });

  // ── Pages 3+: Quarterly Details ───────────────────────────────────────────
  for (const q of quarters) {
    doc.addPage();
    y = drawHeader(`${q.label} — ${yearStr}`, `Detalhamento Trimestral — ${periodStr}`);
    y = sectionLabel(`TRANSAÇÕES — ${q.label.toUpperCase()}`, y);

    if (q.txs.length === 0) {
      emptyNote('Nenhuma transação neste trimestre.', y);
    } else {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
        body: q.txs.map((t) => [
          formatDate(t.date),
          t.title,
          CATEGORY_LABELS[t.category] ?? t.category,
          t.type === 'income' ? 'Receita' : 'Despesa',
          (t.type === 'income' ? '+ ' : '- ') + 'R$ ' + brl(t.amount),
        ]),
        foot: [['', '', '', 'Subtotal', `R$ ${brl(q.income - q.expense)}`]],
        styles: { font: 'helvetica', fontSize: 8, cellPadding: { top: 3, bottom: 3, left: 4, right: 4 }, textColor: [30, 30, 30], lineColor: [225, 225, 225], lineWidth: 0.2 },
        headStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 7.5 },
        footStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
        alternateRowStyles: { fillColor: [250, 251, 252] },
        columnStyles: {
          0: { cellWidth: 22 },
          1: { cellWidth: 'auto' },
          2: { cellWidth: 28 },
          3: { cellWidth: 20 },
          4: { cellWidth: 33, halign: 'right' },
        },
        didParseCell(data) {
          if (data.section !== 'body') return;
          if (data.column.index === 3 || data.column.index === 4) {
            const t = q.txs[data.row.index];
            if (t) data.cell.styles.textColor = t.type === 'income' ? [16, 185, 129] : [239, 35, 60];
          }
        },
      });
    }
  }

  // ── Category Analysis ──────────────────────────────────────────────────────
  doc.addPage();
  y = drawHeader('Categorias', `Análise por Categoria — ${periodStr}`);
  y = sectionLabel('GASTOS POR CATEGORIA', y);

  if (catRows.length === 0) {
    emptyNote('Nenhuma despesa registrada no período.', y);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Categoria', 'Total Gasto', '% do Total']],
      body: catRows.map((row, i) => [
        String(i + 1),
        row.label,
        `R$ ${brl(row.val)}`,
        totalExpense > 0 ? `${((row.val / totalExpense) * 100).toFixed(1)}%` : '0%',
      ]),
      styles: { font: 'helvetica', fontSize: 9, cellPadding: { top: 4, bottom: 4, left: 4, right: 4 }, textColor: [30, 30, 30], lineColor: [225, 225, 225], lineWidth: 0.2 },
      headStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 12, halign: 'center' },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 45, halign: 'right', textColor: [239, 35, 60], fontStyle: 'bold' },
        3: { cellWidth: 30, halign: 'right' },
      },
    });
    y = doc.lastAutoTable.finalY + 10;

    // Horizontal bar chart per category
    const maxVal = catRows[0].val;
    const chartW = pageW - margin * 2;
    const barH = 6, barGap = 4;
    catRows.slice(0, 8).forEach((row, i) => {
      const barY    = y + i * (barH + barGap);
      const filledW = maxVal > 0 ? (row.val / maxVal) * (chartW * 0.55) : 0;

      doc.setFillColor(235, 235, 235);
      doc.roundedRect(margin + 55, barY, chartW * 0.55, barH, 1, 1, 'F');
      if (filledW > 0) {
        doc.setFillColor(239, 35, 60);
        doc.roundedRect(margin + 55, barY, filledW, barH, 1, 1, 'F');
      }
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(60, 60, 60);
      doc.text(row.label, margin, barY + barH * 0.72);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.setTextColor(239, 35, 60);
      doc.text(`R$ ${brl(row.val)}`, margin + 55 + chartW * 0.55 + 3, barY + barH * 0.72);
    });
  }

  // ── Subscriptions ──────────────────────────────────────────────────────────
  doc.addPage();
  y = drawHeader('Assinaturas', `Assinaturas Ativas — ${periodStr}`);
  y = sectionLabel('ASSINATURAS', y);

  if (subscriptions.length === 0) {
    emptyNote('Nenhuma assinatura cadastrada.', y);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Assinatura', 'Valor', 'Ciclo', 'Próx. Cobrança', 'Total Est. no Período']],
      body: subscriptions.map((sub) => {
        const amt            = Number(sub.amount);
        const totalInPeriod  = sub.cycle === 'monthly' ? amt * months.length : amt;
        return [
          sub.name,
          `R$ ${brl(amt)}`,
          sub.cycle === 'monthly' ? 'Mensal' : 'Anual',
          sub.next_billing_date ? formatDate(sub.next_billing_date) : '—',
          `R$ ${brl(totalInPeriod)}`,
        ];
      }),
      foot: [['', '', '', 'TOTAL ESTIMADO', `R$ ${brl(subsTotal)}`]],
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }, textColor: [30, 30, 30], lineColor: [225, 225, 225], lineWidth: 0.2 },
      headStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 30, halign: 'right' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 40, halign: 'right', fontStyle: 'bold', textColor: [239, 35, 60] },
      },
    });
  }

  // ── Installments ───────────────────────────────────────────────────────────
  doc.addPage();
  y = drawHeader('Parcelamentos', `Parcelamentos — ${periodStr}`);
  y = sectionLabel('PARCELAMENTOS', y);

  if (installments.length === 0) {
    emptyNote('Nenhum parcelamento cadastrado.', y);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Nome', 'Valor Total', 'Parcelas', 'Pagas', 'Status']],
      body: installments.map((inst) => {
        const active = inst.paid_installments < inst.total_installments;
        return [
          inst.name,
          `R$ ${brl(inst.total_amount)}`,
          String(inst.total_installments),
          String(inst.paid_installments),
          active ? 'Em andamento' : 'Quitado',
        ];
      }),
      foot: [['', `R$ ${brl(installTotal)}`, '', '', '']],
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }, textColor: [30, 30, 30], lineColor: [225, 225, 225], lineWidth: 0.2 },
      headStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      footStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 22, halign: 'center' },
        3: { cellWidth: 22, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      },
      didParseCell(data) {
        if (data.section !== 'body' || data.column.index !== 4) return;
        const inst = installments[data.row.index];
        if (!inst) return;
        data.cell.styles.textColor = inst.paid_installments < inst.total_installments ? [239, 35, 60] : [16, 185, 129];
        data.cell.styles.fontStyle = 'bold';
      },
    });
  }

  // ── Goals ──────────────────────────────────────────────────────────────────
  doc.addPage();
  y = drawHeader('Metas', 'Metas Financeiras');
  y = sectionLabel('METAS FINANCEIRAS', y);

  if (goals.length === 0) {
    emptyNote('Nenhuma meta cadastrada.', y);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Meta', 'Objetivo', 'Atingido', '%', 'Status']],
      body: goals.map((g) => {
        const target  = Number(g.target_amount);
        const current = Number(g.current_amount ?? 0);
        const pct     = target > 0 ? Math.min((current / target) * 100, 100).toFixed(1) : '0.0';
        const done    = current >= target;
        return [
          g.name ?? '—',
          `R$ ${brl(target)}`,
          `R$ ${brl(current)}`,
          `${pct}%`,
          done ? '✓ Concluída' : 'Em andamento',
        ];
      }),
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }, textColor: [30, 30, 30], lineColor: [225, 225, 225], lineWidth: 0.2 },
      headStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 'auto' },
        1: { cellWidth: 35, halign: 'right' },
        2: { cellWidth: 35, halign: 'right' },
        3: { cellWidth: 18, halign: 'center' },
        4: { cellWidth: 32, halign: 'center' },
      },
      didParseCell(data) {
        if (data.section !== 'body' || data.column.index !== 4) return;
        const g = goals[data.row.index];
        if (!g) return;
        const done = Number(g.current_amount ?? 0) >= Number(g.target_amount);
        data.cell.styles.textColor = done ? [16, 185, 129] : [239, 35, 60];
        data.cell.styles.fontStyle = 'bold';
      },
    });
  }

  // ── Top 10 Transactions ────────────────────────────────────────────────────
  doc.addPage();
  y = drawHeader('Top 10', 'Maiores Transações do Período');
  y = sectionLabel('TOP 10 MAIORES TRANSAÇÕES', y);

  if (top10.length === 0) {
    emptyNote('Nenhuma transação no período.', y);
  } else {
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['#', 'Data', 'Descrição', 'Categoria', 'Tipo', 'Valor']],
      body: top10.map((t, i) => [
        String(i + 1),
        formatDate(t.date),
        t.title,
        CATEGORY_LABELS[t.category] ?? t.category,
        t.type === 'income' ? 'Receita' : 'Despesa',
        (t.type === 'income' ? '+ ' : '- ') + 'R$ ' + brl(t.amount),
      ]),
      styles: { font: 'helvetica', fontSize: 8.5, cellPadding: { top: 3.5, bottom: 3.5, left: 4, right: 4 }, textColor: [30, 30, 30], lineColor: [225, 225, 225], lineWidth: 0.2 },
      headStyles: { fillColor: [25, 25, 25], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 8 },
      alternateRowStyles: { fillColor: [250, 251, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 22 },
        2: { cellWidth: 'auto' },
        3: { cellWidth: 28 },
        4: { cellWidth: 20 },
        5: { cellWidth: 33, halign: 'right' },
      },
      didParseCell(data) {
        if (data.section !== 'body') return;
        if (data.column.index === 4 || data.column.index === 5) {
          const t = top10[data.row.index];
          if (t) data.cell.styles.textColor = t.type === 'income' ? [16, 185, 129] : [239, 35, 60];
        }
      },
    });
  }

  // ── Conclusions ───────────────────────────────────────────────────────────
  doc.addPage();
  y = drawHeader('Conclusões', `Resumo Executivo — ${periodStr}`);
  y = sectionLabel('ANÁLISE E CONCLUSÕES', y);

  const savingsRate      = totalIncome > 0 ? ((netBalance / totalIncome) * 100).toFixed(1) : '0.0';
  const avgMonthlyIncome = months.length > 0 ? totalIncome  / months.length : 0;
  const avgExpense       = months.length > 0 ? totalExpense / months.length : 0;
  const topCat           = catRows[0] ?? null;

  const insights = [
    netBalance >= 0
      ? `Você poupou R$ ${brl(netBalance)} no período (taxa de poupança: ${savingsRate}%)`
      : `Déficit de R$ ${brl(Math.abs(netBalance))} no período — despesas superaram receitas`,
    `Renda média mensal: R$ ${brl(avgMonthlyIncome)}`,
    `Gasto médio mensal: R$ ${brl(avgExpense)}`,
    topCat ? `Categoria com maior gasto: ${topCat.label} (R$ ${brl(topCat.val)})` : null,
    bestMonth  ? `Melhor mês: ${MONTH_NAMES[bestMonth.month]} ${bestMonth.year} (saldo R$ ${brl(bestMonth.balance)})` : null,
    worstMonth ? `Mês com maior gasto: ${MONTH_NAMES[worstMonth.month]} ${worstMonth.year} (R$ ${brl(worstMonth.expense)})` : null,
    subscriptions.length > 0 ? `${subscriptions.length} assinatura(s) ativa(s) — custo estimado no período: R$ ${brl(subsTotal)}` : null,
    installments.length > 0  ? `${installments.length} parcelamento(s) — total: R$ ${brl(installTotal)}` : null,
    goals.length > 0         ? `${goals.length} meta(s) financeira(s) cadastrada(s)` : null,
    `Total de transações no período: ${filtered.length}`,
  ].filter(Boolean);

  insights.forEach((insight, i) => {
    const iy = y + i * 10;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(margin, iy, pageW - margin * 2, 8, 2, 2, 'F');
    doc.setFillColor(239, 35, 60);
    doc.rect(margin, iy, 2.5, 8, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(40, 40, 40);
    doc.text(insight, margin + 6, iy + 5.5);
  });

  // ── Footer on all pages except cover ──────────────────────────────────────
  const pageCount = doc.internal.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    if (p === 1) continue; // cover has its own bottom bar
    const pH = doc.internal.pageSize.getHeight();
    const pW = doc.internal.pageSize.getWidth();
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.line(margin, pH - 14, pW - margin, pH - 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(170, 170, 170);
    doc.text('Gerado por VibeFinance • vibeFinance.app', margin, pH - 9);
    doc.text(`${nowStr} • Página ${p} de ${pageCount}`, pW - margin, pH - 9, { align: 'right' });
    doc.setFillColor(239, 35, 60);
    doc.rect(0, pH - 3, pW, 3, 'F');
  }

  const safeYear = normalizeFilename(yearStr);
  doc.save(`VibeFinance_Relatorio_Anual_${safeYear}.pdf`);
}
