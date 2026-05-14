/**
 * MakeEazy Tax Optimization Report — PDF Generator v2
 * Generates a branded 5-page PDF using jsPDF with actual MakeEazy logo.
 * Returns base64 string for storage/download.
 */

function generateReportPDF(taxResult, insightResult, inputs, pan) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const M = 16; // margin
    const CW = W - M * 2; // content width
    const NAVY = [50, 80, 159];
    const ORANGE = [247, 127, 0];
    const GREEN = [22, 163, 74];
    const RED = [220, 38, 38];
    const AMBER = [217, 119, 6];
    const GRAY = [100, 116, 139];
    const DARK = [26, 45, 94];
    const WHITE = [255, 255, 255];

    const f = n => {
        const num = Math.round(Number(n) || 0);
        return '\u20B9' + num.toLocaleString('en-IN');
    };
    const rec = taxResult.recommendation;
    const bestLabel = rec === 'old' ? 'Old Regime' : rec === 'new' ? 'New Regime' : 'Either Regime';
    const name = inputs.name || inputs.personalInfo?.name || 'Taxpayer';
    let y;

    // Helper: add logo to page
    function addLogo(xPos, yPos, w) {
        try {
            if (typeof MAKEEAZY_LOGO !== 'undefined') {
                doc.addImage(MAKEEAZY_LOGO, 'PNG', xPos, yPos, w, w * 0.35);
            }
        } catch(e) { /* logo not loaded, skip */ }
    }

    // Helper: page footer
    function addFooter(pageNum) {
        doc.setFontSize(7);
        doc.setTextColor(...GRAY);
        doc.text('www.makeeazy.in  |  +91-9992819995', M, H - 8);
        doc.text('Page ' + pageNum + ' of 5', W - M, H - 8, { align: 'right' });
        // Bottom accent line
        doc.setDrawColor(...ORANGE);
        doc.setLineWidth(1.5);
        doc.line(0, H - 3, W, H - 3);
    }

    // Helper: section header bar
    function sectionHeader(text) {
        doc.setFillColor(...NAVY);
        doc.rect(0, 0, W, 16, 'F');
        doc.setFillColor(...ORANGE);
        doc.rect(0, 16, W, 2, 'F');
        addLogo(M, 3, 30);
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(text, W - M, 11, { align: 'right' });
    }

    // ════════════ PAGE 1: COVER ════════════
    // Navy header
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 90, 'F');
    // Orange accent
    doc.setFillColor(...ORANGE);
    doc.rect(0, 90, W, 3, 'F');

    // Logo
    addLogo(W/2 - 25, 15, 50);

    // Title
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('Tax Optimization Report', W / 2, 58, { align: 'center' });
    doc.setFontSize(13);
    doc.setFont('helvetica', 'normal');
    doc.text('FY 2025-26  |  AY 2026-27', W / 2, 68, { align: 'center' });

    // Prepared for badge
    doc.setFillColor(255, 255, 255, 40);
    doc.setFontSize(9);
    doc.text('Prepared exclusively for', W / 2, 80, { align: 'center' });

    // Details card
    y = 105;
    doc.setFillColor(248, 249, 252);
    doc.roundedRect(M, y, CW, 42, 3, 3, 'F');
    doc.setDrawColor(220, 225, 235);
    doc.roundedRect(M, y, CW, 42, 3, 3, 'S');

    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(name, M + 10, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text('PAN: ' + pan, M + 10, y + 24);
    const incType = inputs.incomeType || inputs._incomeType || 'Salaried';
    doc.text('Income Source: ' + incType.charAt(0).toUpperCase() + incType.slice(1), M + 10, y + 32);
    doc.text('Generated: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), CW + M - 6, y + 14, { align: 'right' });

    // Tax Health Score
    y = 160;
    const score = insightResult.score;
    const band = insightResult.band;
    const scoreColor = score > 80 ? GREEN : score > 60 ? AMBER : RED;

    doc.setFillColor(...scoreColor);
    doc.roundedRect(M, y, CW, 30, 3, 3, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Tax Health Score: ' + score + '/100', W / 2, y + 14, { align: 'center' });
    doc.setFontSize(11);
    doc.text(band, W / 2, y + 24, { align: 'center' });

    // Quick overview
    y = 205;
    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Report Overview', M, y);
    y += 3;
    doc.setDrawColor(...ORANGE);
    doc.setLineWidth(0.8);
    doc.line(M, y, M + 35, y);
    y += 10;

    const overviewData = [
        ['Old Regime Tax', f(taxResult.old.roundedTax)],
        ['New Regime Tax', f(taxResult.new.roundedTax)],
        ['Recommended Regime', bestLabel],
        ['Regime Savings', f(taxResult.absSavings)],
        ['Insights Found', String(insightResult.counts.total)],
        ['Total Potential Savings', f(insightResult.totalPotentialSavings)],
    ];
    for (const [label, value] of overviewData) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...GRAY);
        doc.text(label, M + 6, y);
        doc.setTextColor(...DARK);
        doc.setFont('helvetica', 'bold');
        doc.text(value, CW + M - 6, y, { align: 'right' });
        y += 8;
    }

    addFooter(1);

    // ════════════ PAGE 2: REGIME COMPARISON ════════════
    doc.addPage();
    sectionHeader('Regime Comparison');
    y = 26;

    const colL = M;
    const colR = W / 2 + 3;
    const colW = CW / 2 - 3;

    function drawRegimeBox(x, label, result, highlight) {
        const boxY = y;
        doc.setFillColor(highlight ? 245 : 250, highlight ? 248 : 250, highlight ? 255 : 252);
        doc.roundedRect(x, boxY, colW, 120, 3, 3, 'F');
        if (highlight) {
            doc.setDrawColor(...NAVY);
            doc.setLineWidth(0.6);
            doc.roundedRect(x, boxY, colW, 120, 3, 3, 'S');
        } else {
            doc.setDrawColor(220, 225, 235);
            doc.roundedRect(x, boxY, colW, 120, 3, 3, 'S');
        }

        let ly = boxY + 10;
        doc.setTextColor(...NAVY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(label, x + colW / 2, ly, { align: 'center' });
        ly += 4;
        doc.setDrawColor(...(highlight ? ORANGE : [220,225,235]));
        doc.setLineWidth(0.5);
        doc.line(x + 10, ly, x + colW - 10, ly);
        ly += 10;

        doc.setFontSize(20);
        doc.setTextColor(...(highlight ? NAVY : GRAY));
        doc.text(f(result.roundedTax), x + colW / 2, ly, { align: 'center' });
        ly += 12;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        const rows = [
            ['Gross Income', f(result.grossSalary || 0)],
            ['Std Deduction', f(result.stdDeduction || 0)],
            ['Net Income', f(result.normalIncome || 0)],
            ['Ch. VI-A Deductions', f(result.totalDeductions || 0)],
            ['Taxable Income', f(result.taxableTotal || 0)],
            ['Tax on Income', f(result.normalTax || 0)],
            ['Rebate u/s 87A', f(result.rebate || 0)],
            ['Surcharge', f(result.netSurcharge || 0)],
            ['Health & Edu Cess', f(result.cess || 0)],
        ];
        for (const [k, v] of rows) {
            doc.setTextColor(...GRAY);
            doc.text(k, x + 6, ly);
            doc.setTextColor(...DARK);
            doc.text(v, x + colW - 6, ly, { align: 'right' });
            ly += 7;
        }

        if (highlight) {
            doc.setFillColor(...GREEN);
            doc.roundedRect(x + 6, ly + 1, colW - 12, 7, 2, 2, 'F');
            doc.setTextColor(...WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text('RECOMMENDED', x + colW / 2, ly + 6, { align: 'center' });
        }
    }

    drawRegimeBox(colL, 'Old Regime', taxResult.old, rec === 'old');
    drawRegimeBox(colR, 'New Regime', taxResult.new, rec === 'new' || rec === 'same');

    y += 130;

    // Verdict
    const verdictColor = rec === 'same' ? GRAY : GREEN;
    doc.setFillColor(verdictColor[0], verdictColor[1], verdictColor[2], 15);
    doc.roundedRect(M, y, CW, 18, 3, 3, 'F');
    doc.setDrawColor(...verdictColor);
    doc.setLineWidth(0.4);
    doc.roundedRect(M, y, CW, 18, 3, 3, 'S');
    doc.setTextColor(...verdictColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    const verdictText = rec === 'same'
        ? 'Both regimes result in the same tax liability.'
        : taxResult.regimeLabel || (bestLabel + ' saves you ' + f(taxResult.absSavings));
    doc.text(verdictText, W / 2, y + 11, { align: 'center' });

    addFooter(2);

    // ════════════ PAGE 3: INSIGHTS ════════════
    doc.addPage();
    sectionHeader('Tax Insights & Findings');
    y = 26;

    const typeBadge = { risk: 'RISK', opportunity: 'OPPORTUNITY', good: 'HEALTHY' };
    const typeColors = { risk: RED, opportunity: AMBER, good: GREEN };
    const typeBg = { risk: [254, 242, 242], opportunity: [255, 251, 235], good: [240, 253, 244] };

    for (const ins of insightResult.insights) {
        if (y > H - 45) { doc.addPage(); sectionHeader('Tax Insights (cont.)'); y = 26; }

        const col = typeColors[ins.type] || GRAY;
        const bg = typeBg[ins.type] || [248, 249, 252];
        const badge = typeBadge[ins.type] || 'INFO';
        const hasImpact = ins.impact > 0;
        const boxH = 26;

        doc.setFillColor(...bg);
        doc.roundedRect(M, y, CW, boxH, 2, 2, 'F');

        // Badge
        doc.setFillColor(...col);
        doc.roundedRect(M + 4, y + 3, 24, 5, 1.5, 1.5, 'F');
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5.5);
        doc.text(badge, M + 16, y + 6.5, { align: 'center' });

        // Title
        doc.setTextColor(...DARK);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(ins.title, M + 32, y + 8);

        // Impact badge on right
        if (hasImpact) {
            doc.setTextColor(...col);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.text(f(ins.impact), CW + M - 4, y + 8, { align: 'right' });
        }

        // Detail text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(...GRAY);
        const detailLines = doc.splitTextToSize(ins.detail || '', CW - 14);
        doc.text(detailLines.slice(0, 2).join(' '), M + 4, y + 17);

        y += boxH + 4;
    }

    addFooter(3);

    // ════════════ PAGE 4: RECOMMENDATIONS ════════════
    doc.addPage();
    sectionHeader('Recommended Actions');
    y = 26;

    const opportunities = insightResult.insights
        .filter(i => i.type === 'opportunity')
        .sort((a, b) => (b.impact || 0) - (a.impact || 0));

    if (opportunities.length === 0) {
        y += 30;
        doc.setTextColor(...GREEN);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text('Your tax profile is well optimised!', W / 2, y, { align: 'center' });
        y += 12;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...GRAY);
        doc.text('No major improvement areas identified. Keep it up.', W / 2, y, { align: 'center' });
    } else {
        let rank = 1;
        for (const opp of opportunities.slice(0, 6)) {
            if (y > H - 50) { doc.addPage(); sectionHeader('Recommendations (cont.)'); y = 26; }

            doc.setFillColor(248, 249, 252);
            doc.roundedRect(M, y, CW, 28, 2, 2, 'F');

            // Rank
            doc.setFillColor(...ORANGE);
            doc.circle(M + 9, y + 11, 5, 'F');
            doc.setTextColor(...WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(String(rank), M + 9, y + 13.5, { align: 'center' });

            // Title
            doc.setTextColor(...DARK);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.text(opp.title, M + 20, y + 10);

            // Detail
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.setTextColor(...GRAY);
            const dl = doc.splitTextToSize(opp.detail || '', CW - 28);
            doc.text(dl[0] || '', M + 20, y + 18);

            // Save amount
            if (opp.impact > 0) {
                doc.setTextColor(...GREEN);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text('Save ' + f(opp.impact), CW + M - 4, y + 10, { align: 'right' });
            }

            y += 32;
            rank++;
        }

        // Total savings bar
        if (insightResult.totalPotentialSavings > 0) {
            y += 8;
            doc.setFillColor(...GREEN);
            doc.roundedRect(M, y, CW, 16, 3, 3, 'F');
            doc.setTextColor(...WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Total Potential Savings: ' + f(insightResult.totalPotentialSavings), W / 2, y + 11, { align: 'center' });
        }
    }

    addFooter(4);

    // ════════════ PAGE 5: NEXT STEPS ════════════
    doc.addPage();
    sectionHeader('Next Steps');
    y = 30;

    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Need Help With Your Tax Filing?', W / 2, y, { align: 'center' });
    y += 16;

    const ctas = [
        { title: 'Talk to a Tax Expert', desc: 'Free 15-minute consultation with our CA team to discuss your specific tax situation and filing strategy.', action: 'Book at calendly.com/makeeazy/support' },
        { title: 'WhatsApp Us', desc: 'Quick answers to any tax questions. Our experts typically respond within minutes during business hours.', action: 'Message us at wa.me/919992819995' },
        { title: 'Get Your ITR Filed', desc: 'Accurate, compliant ITR filing by our CA-backed team. We handle everything from documentation to submission.', action: 'Visit makeeazy.in' },
    ];

    for (let i = 0; i < ctas.length; i++) {
        doc.setFillColor(248, 249, 252);
        doc.roundedRect(M, y, CW, 32, 3, 3, 'F');
        doc.setDrawColor(220, 225, 235);
        doc.roundedRect(M, y, CW, 32, 3, 3, 'S');

        // Number
        doc.setFillColor(...NAVY);
        doc.circle(M + 10, y + 12, 5, 'F');
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(String(i + 1), M + 10, y + 14.5, { align: 'center' });

        // Title
        doc.setTextColor(...NAVY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(ctas[i].title, M + 22, y + 10);

        // Desc
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        const dl = doc.splitTextToSize(ctas[i].desc, CW - 28);
        doc.text(dl.slice(0, 2).join(' '), M + 22, y + 18);

        // Action
        doc.setTextColor(...ORANGE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(ctas[i].action, M + 22, y + 28);

        y += 38;
    }

    // Disclaimer
    y += 10;
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    const disclaimer = [
        'Disclaimer: This report is generated based on the information provided by you. It is for informational purposes only and does not constitute tax advice.',
        'Please consult a qualified Chartered Accountant for personalised tax planning. Tax laws are subject to change. MakeEazy is not responsible for decisions',
        'made based on this report. For professional assistance, visit www.makeeazy.in or call +91-9992819995.',
    ];
    for (const line of disclaimer) {
        doc.text(line, W / 2, y, { align: 'center' });
        y += 4;
    }

    addFooter(5);

    return doc;
}

/**
 * Generate PDF and return as base64 string
 */
function generateReportBase64(taxResult, insightResult, inputs, pan) {
    const doc = generateReportPDF(taxResult, insightResult, inputs, pan);
    return doc.output('datauristring').split(',')[1];
}
