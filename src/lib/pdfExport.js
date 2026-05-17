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
