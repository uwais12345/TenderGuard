import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

/**
 * Generate and download a professional procurement justification PDF report.
 * @param {Array} vendors - Top evaluated vendor objects
 * @param {string} requirements - The user's tender requirements text
 * @param {string} analysisSummary - The AI-generated summary
 */
export function generateProcurementPDF(vendors, requirements, analysisSummary) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const today = new Date().toLocaleDateString('en-IN', {
    year: 'numeric', month: 'long', day: 'numeric'
  });

  // ── HEADER BANNER ──
  doc.setFillColor(15, 23, 42); // dark navy
  doc.rect(0, 0, pageWidth, 38, 'F');

  doc.setTextColor(59, 130, 246); // blue
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('TenderGuard', 14, 16);

  doc.setFontSize(10);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('AI-Powered Procurement Justification Report', 14, 24);
  doc.text(`Generated: ${today}`, 14, 31);

  // ── AI ANALYSIS SUMMARY ──
  doc.setTextColor(30, 41, 59);
  doc.setFillColor(241, 245, 249);
  doc.rect(0, 42, pageWidth, 24, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('AI Evaluation Summary', 14, 50);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const summaryLines = doc.splitTextToSize(analysisSummary, pageWidth - 28);
  doc.text(summaryLines, 14, 57);

  // ── TENDER REQUIREMENTS ──
  let y = 72;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Tender Requirements', 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const reqLines = doc.splitTextToSize(requirements, pageWidth - 28);
  doc.text(reqLines, 14, y);
  y += reqLines.length * 5 + 8;

  // ── VENDOR EVALUATION TABLE ──
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Ranked Vendor Evaluation', 14, y);
  y += 6;

  autoTable(doc, {
    startY: y,
    head: [['Rank', 'Vendor', 'Match Score', 'Success Rate', 'Cost', 'Delivery', 'Compliance', 'Security', 'Experience']],
    body: vendors.map((v, i) => [
      ['🥇 1st', '🥈 2nd', '🥉 3rd'][i] || `${i + 1}th`,
      v.company_name,
      `${v.match_score ?? '—'}%`,
      `${v.success_rate ?? '—'}%`,
      `${v.cost_score ?? '—'}/100`,
      `${v.delivery_score ?? '—'}/100`,
      `${v.compliance_score ?? '—'}/100`,
      `${v.security_score ?? '—'}/100`,
      `${v.experience_score ?? '—'}/100`,
    ]),
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [241, 245, 249],
      fontStyle: 'bold',
      fontSize: 8,
    },
    bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── PER VENDOR DETAIL ──
  vendors.forEach((v, i) => {
    if (y > 250) { doc.addPage(); y = 20; }

    const rankLabels = ['🥇 1st Ranked Vendor', '🥈 2nd Ranked Vendor', '🥉 3rd Ranked Vendor'];
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(15, 23, 42);
    doc.text(`${rankLabels[i] || `#${i+1}`}: ${v.company_name}`, 14, y);
    y += 5;

    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    const histLines = doc.splitTextToSize(`Past History: ${v.past_history || 'N/A'}`, pageWidth - 28);
    doc.text(histLines, 14, y);
    y += histLines.length * 4.5 + 2;

    // Pros and cons as mini table
    autoTable(doc, {
      startY: y,
      head: [['✅ Strengths', '⚠️ Weaknesses']],
      body: [
        [
          (v.pros || []).map(p => `• ${p}`).join('\n'),
          (v.cons || []).map(c => `• ${c}`).join('\n'),
        ]
      ],
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 8 },
      bodyStyles: { fontSize: 8, valign: 'top', textColor: [30, 41, 59] },
      columnStyles: { 0: { cellWidth: 88 }, 1: { cellWidth: 88 } },
      margin: { left: 14, right: 14 },
    });

    y = doc.lastAutoTable.finalY + 8;
  });

  // ── FOOTER ──
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'This report was produced by TenderGuard AI — an automated government procurement evaluation system.',
    14,
    doc.internal.pageSize.getHeight() - 10
  );

  // ── SAVE ──
  doc.save(`TenderGuard_Procurement_Report_${today.replace(/ /g, '_')}.pdf`);
}
