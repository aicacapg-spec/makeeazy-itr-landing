/**
 * MakeEazy Tax Optimization Report — PDF Generator v3
 * Premium branded PDF using jsPDF. Dynamic pages, no blanks.
 * Uses Rs. for currency (jsPDF default fonts lack ₹ glyph).
 */

function generateReportPDF(taxResult, insightResult, inputs, pan) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const W = 210, H = 297;
    const M = 16;
    const CW = W - M * 2;

    // MakeEazy brand colors
    const NAVY = [50, 80, 159];
    const NAVY_DARK = [26, 45, 107];
    const ORANGE = [247, 127, 0];
    const GREEN = [22, 163, 74];
    const RED = [220, 38, 38];
    const AMBER = [217, 119, 6];
    const GRAY = [100, 116, 139];
    const DARK = [26, 45, 94];
    const WHITE = [255, 255, 255];
    const LIGHT_BG = [248, 249, 252];
    const BORDER = [220, 225, 235];

    // Track total pages for footer
    let totalPages = 0;
    const pageFooters = [];

    // Currency formatter — Rs. instead of ₹ (jsPDF default fonts lack ₹ glyph)
    const fmt = n => {
        const num = Math.round(Number(n) || 0);
        if (num >= 10000000) return 'Rs. ' + (num / 10000000).toFixed(2) + ' Cr';
        if (num >= 100000) return 'Rs. ' + (num / 100000).toFixed(2) + ' L';
        return 'Rs. ' + num.toLocaleString('en-IN');
    };

    const rec = taxResult.recommendation;
    const bestLabel = rec === 'old' ? 'Old Regime' : rec === 'new' ? 'New Regime' : 'Either Regime';
    const userName = inputs.name || inputs.personalInfo?.name || 'Taxpayer';
    const score = Number(insightResult.score || 0);
    const band = insightResult.band || '';
    let y;

    // ── Helpers ──
    function addLogo(xPos, yPos, w) {
        try {
            if (typeof MAKEEAZY_LOGO !== 'undefined') {
                doc.addImage(MAKEEAZY_LOGO, 'PNG', xPos, yPos, w, w * 0.28);
            }
        } catch (e) { /* logo not loaded */ }
    }

    function registerFooter(pageNum) {
        pageFooters.push(pageNum);
    }

    function drawAllFooters() {
        totalPages = pageFooters.length;
        for (let i = 0; i < pageFooters.length; i++) {
            doc.setPage(i + 1);
            doc.setFontSize(7);
            doc.setTextColor(...GRAY);
            doc.text('www.makeeazy.in  |  +91-9992819995', M, H - 8);
            doc.text('Page ' + (i + 1) + ' of ' + totalPages, W - M, H - 8, { align: 'right' });
            doc.setDrawColor(...ORANGE);
            doc.setLineWidth(1.5);
            doc.line(0, H - 3, W, H - 3);
        }
    }

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

    function drawInfoRow(label, value, xL, xR, yPos) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...GRAY);
        doc.text(label, xL, yPos);
        doc.setTextColor(...DARK);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text(String(value), xR, yPos, { align: 'right' });
    }

    function needsNewPage(requiredSpace) {
        return y + requiredSpace > H - 20;
    }

    // ════════════════════════════════════════
    // PAGE 1: COVER
    // ════════════════════════════════════════
    doc.setFillColor(...NAVY);
    doc.rect(0, 0, W, 90, 'F');
    doc.setFillColor(...ORANGE);
    doc.rect(0, 90, W, 3, 'F');

    addLogo(W / 2 - 25, 14, 50);

    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text('Tax Optimization Report', W / 2, 56, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('FY 2025-26  |  AY 2026-27', W / 2, 66, { align: 'center' });
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...WHITE);
    doc.text('Prepared exclusively for', W / 2, 80, { align: 'center' });

    // Taxpayer details card
    y = 105;
    doc.setFillColor(...LIGHT_BG);
    doc.roundedRect(M, y, CW, 42, 3, 3, 'F');
    doc.setDrawColor(...BORDER);
    doc.roundedRect(M, y, CW, 42, 3, 3, 'S');

    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(userName, M + 10, y + 14);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...GRAY);
    doc.text('PAN: ' + (pan || 'N/A'), M + 10, y + 24);
    var incType = inputs.incomeType || inputs._incomeType || 'Salaried';
    doc.text('Income Source: ' + incType.charAt(0).toUpperCase() + incType.slice(1), M + 10, y + 32);
    doc.text('Generated: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), CW + M - 6, y + 14, { align: 'right' });

    // Tax Health Score
    y = 160;
    var scoreColor = score > 60 ? GREEN : score > 40 ? AMBER : RED;
    doc.setFillColor(...scoreColor);
    doc.roundedRect(M, y, CW, 30, 3, 3, 'F');
    doc.setTextColor(...WHITE);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Tax Health Score: ' + score + ' / 100', W / 2, y + 13, { align: 'center' });
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
    y += 12;

    var overviewItems = [
        ['Old Regime Tax', fmt(taxResult.old.roundedTax)],
        ['New Regime Tax', fmt(taxResult.new.roundedTax)],
        ['Recommended Regime', bestLabel],
        ['Regime Savings', fmt(taxResult.absSavings)],
        ['Insights Found', String(insightResult.counts.total)],
        ['Potential Additional Savings', fmt(insightResult.totalPotentialSavings)]
    ];

    for (var i = 0; i < overviewItems.length; i++) {
        drawInfoRow(overviewItems[i][0], overviewItems[i][1], M + 6, CW + M - 6, y);
        y += 9;
    }

    registerFooter(1);

    // ════════════════════════════════════════
    // PAGE 2: REGIME COMPARISON
    // ════════════════════════════════════════
    doc.addPage();
    sectionHeader('Regime Comparison');
    y = 26;

    var colL = M;
    var colR = W / 2 + 3;
    var colW = CW / 2 - 3;

    function drawRegimeBox(x, label, result, highlight) {
        var boxY = y;
        doc.setFillColor(highlight ? 245 : 250, highlight ? 248 : 250, highlight ? 255 : 252);
        doc.roundedRect(x, boxY, colW, 120, 3, 3, 'F');
        if (highlight) {
            doc.setDrawColor(...NAVY);
            doc.setLineWidth(0.6);
        } else {
            doc.setDrawColor(...BORDER);
            doc.setLineWidth(0.3);
        }
        doc.roundedRect(x, boxY, colW, 120, 3, 3, 'S');

        var ly = boxY + 10;
        doc.setTextColor(...NAVY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(label, x + colW / 2, ly, { align: 'center' });
        ly += 4;
        doc.setDrawColor(highlight ? ORANGE[0] : 220, highlight ? ORANGE[1] : 225, highlight ? ORANGE[2] : 235);
        doc.setLineWidth(0.5);
        doc.line(x + 10, ly, x + colW - 10, ly);
        ly += 10;

        doc.setFontSize(20);
        doc.setTextColor(highlight ? DARK[0] : GRAY[0], highlight ? DARK[1] : GRAY[1], highlight ? DARK[2] : GRAY[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(fmt(result.roundedTax), x + colW / 2, ly, { align: 'center' });
        ly += 12;

        var rows = [
            ['Gross Income', fmt(result.grossSalary || 0)],
            ['Std Deduction', fmt(result.stdDeduction || 0)],
            ['Net Income', fmt(result.normalIncome || 0)],
            ['Ch. VI-A Ded.', fmt(result.totalDeductions || 0)],
            ['Taxable Income', fmt(result.taxableTotal || 0)],
            ['Tax on Income', fmt(result.normalTax || 0)],
            ['Rebate u/s 87A', fmt(result.rebate || 0)],
            ['Surcharge', fmt(result.netSurcharge || 0)],
            ['Cess (4%)', fmt(result.cess || 0)]
        ];

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        for (var r = 0; r < rows.length; r++) {
            doc.setTextColor(...GRAY);
            doc.text(rows[r][0], x + 6, ly);
            doc.setTextColor(...DARK);
            doc.text(rows[r][1], x + colW - 6, ly, { align: 'right' });
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

    // Verdict bar — brand colors
    doc.setFillColor(...NAVY);
    doc.roundedRect(M, y, CW, 22, 3, 3, 'F');
    doc.setFillColor(...ORANGE);
    doc.roundedRect(M, y + 22, CW, 3, 0, 0, 'F');
    if (rec === 'same') {
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Both regimes result in the same tax liability', W / 2, y + 14, { align: 'center' });
    } else {
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.text('Recommended:', W / 2 - 30, y + 10, { align: 'right' });
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text(bestLabel, W / 2 - 26, y + 10);
        doc.setTextColor(...ORANGE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('You save ' + fmt(taxResult.absSavings), W / 2, y + 20, { align: 'center' });
    }

    registerFooter(2);

    // ════════════════════════════════════════
    // PAGE 3: INSIGHTS (dynamic — may span pages)
    // ════════════════════════════════════════
    var insights = insightResult.insights || [];
    if (insights.length > 0) {
        doc.addPage();
        sectionHeader('Tax Insights & Findings');
        y = 26;

        var typeBadge = { risk: 'RISK', opportunity: 'OPPORTUNITY', good: 'HEALTHY' };
        var typeColors = { risk: RED, opportunity: AMBER, good: GREEN };
        var typeBg = { risk: [254, 242, 242], opportunity: [255, 251, 235], good: [240, 253, 244] };
        var insightPageNum = 3;

        for (var i = 0; i < insights.length; i++) {
            var ins = insights[i];
            var col = typeColors[ins.type] || GRAY;
            var bg = typeBg[ins.type] || LIGHT_BG;
            var badge = typeBadge[ins.type] || 'INFO';

            // Measure title wrapping (leave room for badge + impact)
            var titleText = ins.title || '';
            var titleMaxW = CW - 50;
            if (ins.impact > 0) titleMaxW -= 30;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            var titleLines = doc.splitTextToSize(titleText, titleMaxW);
            var titleH = titleLines.length * 4.5;

            // Measure detail wrapping
            var detail = ins.detail || '';
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            var detailLines = doc.splitTextToSize(detail, CW - 20);
            var showDetailLines = Math.min(detailLines.length, 4);
            var detailH = showDetailLines * 4;

            var boxH = 8 + titleH + 3 + detailH + 6;

            if (needsNewPage(boxH + 8)) {
                registerFooter(insightPageNum);
                insightPageNum++;
                doc.addPage();
                sectionHeader('Tax Insights (cont.)');
                y = 26;
            }

            // Card background
            doc.setFillColor(...bg);
            doc.roundedRect(M, y, CW, boxH, 3, 3, 'F');
            doc.setDrawColor(col[0], col[1], col[2]);
            doc.setLineWidth(0.3);
            doc.line(M, y, M, y + boxH); // left accent line

            // Badge
            doc.setFillColor(...col);
            doc.roundedRect(M + 6, y + 4, 24, 5.5, 1.5, 1.5, 'F');
            doc.setTextColor(...WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            doc.text(badge, M + 18, y + 8, { align: 'center' });

            // Title (properly wrapped)
            doc.setTextColor(...DARK);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            var tyPos = y + 8;
            for (var tl = 0; tl < titleLines.length; tl++) {
                doc.text(titleLines[tl], M + 34, tyPos + (tl * 4.5));
            }

            // Impact on right (first line of title)
            if (ins.impact > 0) {
                doc.setTextColor(...col);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text(fmt(ins.impact), CW + M - 6, y + 8, { align: 'right' });
            }

            // Detail (properly wrapped, up to 4 lines)
            if (detail) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7.5);
                doc.setTextColor(...GRAY);
                var dyPos = tyPos + titleH + 2;
                for (var dl = 0; dl < showDetailLines; dl++) {
                    doc.text(detailLines[dl], M + 8, dyPos + (dl * 4));
                }
            }

            y += boxH + 5;
        }

        // Total potential savings bar
        if (insightResult.totalPotentialSavings > 0 && !needsNewPage(24)) {
            y += 6;
            doc.setFillColor(...GREEN);
            doc.roundedRect(M, y, CW, 16, 3, 3, 'F');
            doc.setTextColor(...WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Total Potential Savings: ' + fmt(insightResult.totalPotentialSavings), W / 2, y + 11, { align: 'center' });
        }

        registerFooter(insightPageNum);
    }

    // ════════════════════════════════════════
    // PAGE: RECOMMENDATIONS (only if there are opportunities)
    // ════════════════════════════════════════
    var opportunities = (insightResult.insights || [])
        .filter(function(i) { return i.type === 'opportunity'; })
        .sort(function(a, b) { return (b.impact || 0) - (a.impact || 0); });

    if (opportunities.length > 0) {
        doc.addPage();
        sectionHeader('Recommended Actions');
        y = 26;
        var recPageNum = pageFooters.length + 1;

        for (var i = 0; i < Math.min(opportunities.length, 6); i++) {
            var opp = opportunities[i];

            // Measure title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            var recTitleLines = doc.splitTextToSize(opp.title || '', CW - 40);
            var recTitleH = recTitleLines.length * 5;

            // Measure detail
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            var recDetailLines = doc.splitTextToSize(opp.detail || '', CW - 32);
            var showRecDetail = Math.min(recDetailLines.length, 3);
            var recDetailH = showRecDetail * 4.5;

            var recBoxH = 8 + recTitleH + 3 + recDetailH + 8;

            if (needsNewPage(recBoxH + 8)) {
                registerFooter(recPageNum);
                recPageNum++;
                doc.addPage();
                sectionHeader('Recommendations (cont.)');
                y = 26;
            }

            // Card bg
            doc.setFillColor(...LIGHT_BG);
            doc.roundedRect(M, y, CW, recBoxH, 3, 3, 'F');
            doc.setDrawColor(...ORANGE);
            doc.setLineWidth(0.4);
            doc.line(M, y, M, y + recBoxH); // orange left accent

            // Rank circle
            doc.setFillColor(...ORANGE);
            doc.circle(M + 12, y + 12, 6, 'F');
            doc.setTextColor(...WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.text(String(i + 1), M + 12, y + 14.5, { align: 'center' });

            // Title (wrapped)
            doc.setTextColor(...DARK);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            var rtyPos = y + 10;
            for (var rtl = 0; rtl < recTitleLines.length; rtl++) {
                doc.text(recTitleLines[rtl], M + 24, rtyPos + (rtl * 5));
            }

            // Save amount on right
            if (opp.impact > 0) {
                doc.setTextColor(...GREEN);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(10);
                doc.text('Save ' + fmt(opp.impact), CW + M - 6, y + 10, { align: 'right' });
            }

            // Detail (wrapped)
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(...GRAY);
            var rdyPos = rtyPos + recTitleH + 2;
            for (var rdl = 0; rdl < showRecDetail; rdl++) {
                doc.text(recDetailLines[rdl], M + 24, rdyPos + (rdl * 4.5));
            }

            y += recBoxH + 6;
        }

        // Total savings bar
        if (insightResult.totalPotentialSavings > 0 && !needsNewPage(24)) {
            y += 6;
            doc.setFillColor(...GREEN);
            doc.roundedRect(M, y, CW, 16, 3, 3, 'F');
            doc.setTextColor(...WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(12);
            doc.text('Total Potential Savings: ' + fmt(insightResult.totalPotentialSavings), W / 2, y + 11, { align: 'center' });
        }

        registerFooter(recPageNum);
    } else if (insights.length > 0) {
        // No opportunities — show "well optimised" message at the bottom
        // Add it to the last insight page if there's space
        var lastInsightPage = doc.internal.getNumberOfPages();
        doc.setPage(lastInsightPage);
        if (!needsNewPage(40)) {
            y += 10;
            doc.setFillColor(...GREEN);
            doc.roundedRect(M, y, CW, 26, 3, 3, 'F');
            doc.setTextColor(...WHITE);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(14);
            doc.text('Your tax profile is well optimised!', W / 2, y + 12, { align: 'center' });
            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('No major improvement areas identified. Keep it up.', W / 2, y + 21, { align: 'center' });
        }
    }

    // ════════════════════════════════════════
    // LAST PAGE: NEXT STEPS (always present)
    // ════════════════════════════════════════
    doc.addPage();
    sectionHeader('Next Steps');
    y = 34;

    doc.setTextColor(...DARK);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Need Help With Your Tax Filing?', W / 2, y, { align: 'center' });
    y += 20;

    var ctas = [
        {
            title: 'Talk to a Tax Expert',
            desc: 'Free 15-minute consultation with our CA team to discuss your specific tax situation and filing strategy.',
            action: 'Book at calendly.com/makeeazy/support'
        },
        {
            title: 'WhatsApp Us',
            desc: 'Quick answers to any tax questions. Our experts typically respond within minutes during business hours.',
            action: 'Message us at wa.me/919992819995'
        },
        {
            title: 'Get Your ITR Filed',
            desc: 'Accurate, compliant ITR filing backed by Chartered Accountants. We handle documentation to submission.',
            action: 'Visit makeeazy.in'
        }
    ];

    for (var i = 0; i < ctas.length; i++) {
        doc.setFillColor(...LIGHT_BG);
        doc.roundedRect(M, y, CW, 34, 3, 3, 'F');
        doc.setDrawColor(...BORDER);
        doc.roundedRect(M, y, CW, 34, 3, 3, 'S');

        // Number circle
        doc.setFillColor(...NAVY);
        doc.circle(M + 12, y + 13, 6, 'F');
        doc.setTextColor(...WHITE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(String(i + 1), M + 12, y + 15.5, { align: 'center' });

        // Title
        doc.setTextColor(...NAVY);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(ctas[i].title, M + 24, y + 12);

        // Description
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(...GRAY);
        var ctaDl = doc.splitTextToSize(ctas[i].desc, CW - 32);
        doc.text(ctaDl.slice(0, 2).join(' '), M + 24, y + 20);

        // Action link
        doc.setTextColor(...ORANGE);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text(ctas[i].action, M + 24, y + 29);

        y += 40;
    }

    // Disclaimer
    y += 10;
    doc.setFontSize(6.5);
    doc.setTextColor(...GRAY);
    doc.setFont('helvetica', 'normal');
    var disclaimer = [
        'Disclaimer: This report is generated based on the information provided by you. It is for informational purposes only',
        'and does not constitute tax advice. Please consult a qualified Chartered Accountant for personalised tax planning.',
        'Tax laws are subject to change. For professional assistance, visit www.makeeazy.in or call +91-9992819995.'
    ];
    for (var d = 0; d < disclaimer.length; d++) {
        doc.text(disclaimer[d], W / 2, y, { align: 'center' });
        y += 4;
    }

    registerFooter(pageFooters.length + 1);

    // Draw all footers with correct total page count
    drawAllFooters();

    return doc;
}

/**
 * Generate PDF and return as base64 data URI string
 */
function generateReportBase64(taxResult, insightResult, inputs, pan) {
    var doc = generateReportPDF(taxResult, insightResult, inputs, pan);
    return doc.output('datauristring').split(',')[1];
}
