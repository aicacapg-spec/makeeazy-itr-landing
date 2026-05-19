/**
 * MakeEazy Tax Optimization Report â€” PDF Generator v3
 * Premium branded PDF using jsPDF. Dynamic pages, no blanks.
 * Uses Rs. for currency (jsPDF default fonts lack â‚¹ glyph).
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

    // Currency formatter â€” Rs. instead of â‚¹ (jsPDF default fonts lack â‚¹ glyph)
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

    // â”€â”€ Helpers â”€â”€
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PAGE 1: COVER
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PAGE 2: REGIME COMPARISON
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
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

    // Verdict bar â€” brand colors
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

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PAGE 3: KEY FINDINGS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    var insights = insightResult.insights || [];
    if (insights.length > 0) {
        doc.addPage();
        sectionHeader('Key Findings');
        y = 26;
        var typeBadge = { risk: 'ATTENTION', opportunity: 'OPPORTUNITY', good: 'VERIFIED', info: 'INFO' };
        var typeColors = { risk: RED, opportunity: AMBER, good: GREEN, info: NAVY };
        var typeBg = { risk: [254,242,242], opportunity: [255,251,235], good: [240,253,244], info: [240,244,255] };
        var pgNum = 3;

        for (var i = 0; i < insights.length; i++) {
            var ins = insights[i];
            var col = typeColors[ins.type] || GRAY;
            var bg = typeBg[ins.type] || LIGHT_BG;
            var badge = typeBadge[ins.type] || 'INFO';
            doc.setFont('helvetica','bold'); doc.setFontSize(9);
            var tmw = CW - 48; if (ins.impact > 0) tmw -= 32;
            var tLines = doc.splitTextToSize(ins.title || '', tmw);
            var tH = tLines.length * 4.5;
            doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
            var dLines = doc.splitTextToSize(ins.detail || '', CW - 18);
            var sD = Math.min(dLines.length, 5);
            var dH = sD * 3.8;
            var bH = 7 + tH + 2 + dH + 5;
            if (needsNewPage(bH + 6)) { registerFooter(pgNum); pgNum++; doc.addPage(); sectionHeader('Key Findings (cont.)'); y = 26; }
            doc.setFillColor(...bg); doc.roundedRect(M, y, CW, bH, 2, 2, 'F');
            doc.setDrawColor(...col); doc.setLineWidth(0.5); doc.line(M, y+1, M, y+bH-1);
            doc.setFillColor(...col); doc.roundedRect(M+5, y+3.5, 22, 5, 1.5, 1.5, 'F');
            doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(5);
            doc.text(badge, M+16, y+7, {align:'center'});
            doc.setTextColor(...DARK); doc.setFont('helvetica','bold'); doc.setFontSize(9);
            for (var tl=0; tl<tLines.length; tl++) doc.text(tLines[tl], M+30, y+7+(tl*4.5));
            if (ins.impact > 0) { doc.setTextColor(...col); doc.setFont('helvetica','bold'); doc.setFontSize(9); doc.text(fmt(ins.impact), CW+M-5, y+7, {align:'right'}); }
            doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...GRAY);
            var dY = y + 7 + tH + 1;
            for (var dl=0; dl<sD; dl++) doc.text(dLines[dl], M+7, dY+(dl*3.8));
            y += bH + 4;
        }
        if (insightResult.totalPotentialSavings > 0 && !needsNewPage(20)) {
            y += 4; doc.setFillColor(...GREEN); doc.roundedRect(M, y, CW, 14, 3, 3, 'F');
            doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(11);
            doc.text('Total Potential Savings: ' + fmt(insightResult.totalPotentialSavings), W/2, y+9.5, {align:'center'});
        }
        registerFooter(pgNum);
    }

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // PAGE 4: HOW MAKEEAZY CAN HELP
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    doc.addPage();
    sectionHeader('How MakeEazy Can Help');
    y = 28;
    doc.setTextColor(...DARK); doc.setFont('helvetica','bold'); doc.setFontSize(14);
    doc.text('Areas Where Professional Guidance Adds Value', W/2, y, {align:'center'});
    y += 12;
    var ctaCards = [];
    var td = (parseFloat(inputs.sec80C)||0) + (parseFloat(inputs.sec80CCD1B)||0) + (parseFloat(inputs.healthInsSelf)||0);
    var hCG = (parseFloat(inputs.stcgEquity)||0) + (parseFloat(inputs.ltcgEquity)||0) + (parseFloat(inputs.ltcgOther)||0);
    var hBiz = inputs.businessType && inputs.businessType !== 'none';
    var gI = (parseFloat(inputs.basicSalary)||0) + (parseFloat(inputs.hra)||0) + (parseFloat(inputs.specialAllowance)||0);
    if (td > 0) ctaCards.push({ic:'!',cl:AMBER,t:'Deduction Verification',d:'Incorrect or unsupported deductions in ITR can lead to notices under Section 143(1) or trigger scrutiny. Our CA team verifies every claim and ensures proper documentation before filing.'});
    if (hCG > 0) ctaCards.push({ic:'!',cl:RED,t:'Capital Gains - Needs Attention for Filing',d:'Capital gains require careful reporting with correct asset classification, holding periods, and exemption claims. Incorrect filing can trigger scrutiny. Let our experts handle this.'});
    if (hBiz) ctaCards.push({ic:'?',cl:NAVY,t:'Business Due Diligence',d:'Get a comprehensive review of your business tax compliance and discover how to transform your business efficiency with MakeEazy.'});
    if (gI > 1000000) ctaCards.push({ic:'i',cl:NAVY,t:'Income Tax Department Data Matching',d:'The Income Tax Department cross-checks your filed returns against their data records. Our team ensures your reported income, TDS credits, and deductions match before you file.'});
    ctaCards.push({ic:'+',cl:GREEN,t:'Get Your ITR Filed by MakeEazy',d:'Accurate, compliant filing backed by Chartered Accountants. We handle everything from document collection to submission.'});
    for (var ci=0; ci<ctaCards.length; ci++) {
        var c = ctaCards[ci];
        doc.setFont('helvetica','normal'); doc.setFontSize(8);
        var cDesc = doc.splitTextToSize(c.d, CW-30);
        var cH = 10 + Math.min(cDesc.length, 4)*4 + 6;
        if (needsNewPage(cH+6)) break;
        doc.setFillColor(...LIGHT_BG); doc.roundedRect(M, y, CW, cH, 3, 3, 'F');
        doc.setDrawColor(...c.cl); doc.setLineWidth(0.5); doc.line(M, y+1, M, y+cH-1);
        doc.setFillColor(...c.cl); doc.circle(M+10, y+10, 5, 'F');
        doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(10);
        doc.text(c.ic, M+10, y+12.5, {align:'center'});
        doc.setTextColor(...DARK); doc.setFont('helvetica','bold'); doc.setFontSize(10);
        doc.text(c.t, M+22, y+10);
        doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...GRAY);
        for (var cd=0; cd<Math.min(cDesc.length,4); cd++) doc.text(cDesc[cd], M+22, y+18+(cd*4));
        y += cH + 5;
    }
    registerFooter(pageFooters.length + 1);

    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    // LAST PAGE: NEXT STEPS
    // â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
    doc.addPage();
    sectionHeader('Next Steps');
    y = 32;
    doc.setTextColor(...DARK); doc.setFont('helvetica','bold'); doc.setFontSize(16);
    doc.text('Ready to File With Confidence?', W/2, y, {align:'center'});
    y += 16;
    var nSteps = [
        {t:'Talk to a Tax Expert',d:'Free 15-minute consultation with our CA team to review your report and plan your filing strategy.',a:'Book at calendly.com/makeeazy/support'},
        {t:'WhatsApp Us',d:'Quick answers to any tax questions. Our experts typically respond within minutes during business hours.',a:'Message us at wa.me/919992819995'},
        {t:'Get Your ITR Filed',d:'Accurate, CA-backed ITR filing. We handle documentation, verification, and submission end-to-end.',a:'Visit makeeazy.in'}
    ];
    for (var si=0; si<nSteps.length; si++) {
        doc.setFillColor(...LIGHT_BG); doc.roundedRect(M, y, CW, 32, 3, 3, 'F');
        doc.setDrawColor(...BORDER); doc.roundedRect(M, y, CW, 32, 3, 3, 'S');
        doc.setFillColor(...NAVY); doc.circle(M+12, y+12, 6, 'F');
        doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(11);
        doc.text(String(si+1), M+12, y+14.5, {align:'center'});
        doc.setTextColor(...NAVY); doc.setFont('helvetica','bold'); doc.setFontSize(11);
        doc.text(nSteps[si].t, M+24, y+11);
        doc.setFont('helvetica','normal'); doc.setFontSize(8); doc.setTextColor(...GRAY);
        doc.text(nSteps[si].d, M+24, y+19);
        doc.setTextColor(...ORANGE); doc.setFont('helvetica','bold'); doc.setFontSize(8);
        doc.text(nSteps[si].a, M+24, y+27);
        y += 38;
    }
    // Professional service advisory
    y += 6;
    doc.setFillColor(...NAVY); doc.roundedRect(M, y, CW, 20, 3, 3, 'F');
    doc.setTextColor(...WHITE); doc.setFont('helvetica','bold'); doc.setFontSize(9);
    doc.text('Income Tax 2025 rules are now applicable.', W/2, y+8, {align:'center'});
    doc.setFont('helvetica','normal'); doc.setFontSize(7.5);
    doc.text('Be mindful and use a professional service rather than DIY or unreliable alternatives.', W/2, y+15, {align:'center'});
    // Disclaimer
    y += 28;
    doc.setFontSize(6.5); doc.setTextColor(...GRAY); doc.setFont('helvetica','normal');
    var disc = ['Disclaimer: This report is generated based on the information provided by you. It is for informational purposes only','and does not constitute tax advice. Please consult a qualified Chartered Accountant for personalised tax planning.','Tax laws are subject to change. For professional assistance, visit www.makeeazy.in or call +91-9992819995.'];
    for (var d=0; d<disc.length; d++) { doc.text(disc[d], W/2, y, {align:'center'}); y += 4; }
    registerFooter(pageFooters.length + 1);
    drawAllFooters();
    return doc;
}

function generateReportBase64(taxResult, insightResult, inputs, pan) {
    var doc = generateReportPDF(taxResult, insightResult, inputs, pan);
    return doc.output('datauristring').split(',')[1];
}
