/**
 * MakeEazy Tax Optimization Report — PDF Generator v5 (Premium Redesign)
 * Beautiful, readable, premium-feel PDF using jsPDF.
 * Uses Rs. for currency (jsPDF default fonts lack ₹ glyph).
 *
 * PAGES:
 *   1. Tax Health Dashboard (Hero)
 *   2. Regime Comparison
 *   3+ Smart Insights (auto-paginated)
 *   N-1. Why Professional Filing Matters
 *   N.   Get Started
 */

function generateReportPDF(taxResult, insightResult, inputs, pan) {
    var jsPDF = window.jspdf.jsPDF;
    var doc = new jsPDF({ unit: 'mm', format: 'a4' });
    var W = 210, H = 297;
    var M = 18;            // increased margin for breathing room
    var CW = W - M * 2;   // content width

    // ── Brand Colors ──
    var NAVY      = [50, 80, 159];
    var NAVY_DARK = [26, 45, 107];
    var NAVY_DEEP = [18, 32, 78];
    var ORANGE    = [247, 127, 0];
    var ORANGE_LT = [255, 200, 120];
    var GREEN     = [22, 163, 74];
    var GREEN_LT  = [236, 253, 243];
    var RED       = [220, 38, 38];
    var RED_LT    = [254, 242, 242];
    var AMBER     = [217, 119, 6];
    var AMBER_LT  = [255, 251, 235];
    var GRAY      = [100, 116, 139];
    var GRAY_LT   = [148, 163, 184];
    var DARK      = [26, 45, 94];
    var WHITE     = [255, 255, 255];
    var LIGHT_BG  = [248, 249, 252];
    var CARD_BG   = [245, 247, 252];
    var BORDER    = [220, 225, 235];
    var BORDER_LT = [232, 236, 244];

    // ── Footer tracking ──
    var totalPages = 0;
    var pageFooters = [];

    // ── Currency formatter — Rs. (no ₹ in default jsPDF fonts) ──
    var fmt = function (n) {
        var num = Math.round(Number(n) || 0);
        if (num >= 10000000) return 'Rs. ' + (num / 10000000).toFixed(2) + ' Cr';
        if (num >= 100000)   return 'Rs. ' + (num / 100000).toFixed(2) + ' L';
        return 'Rs. ' + num.toLocaleString('en-IN');
    };

    // ── Derived values ──
    var rec       = taxResult.recommendation;
    var bestLabel = rec === 'old' ? 'Old Regime' : rec === 'new' ? 'New Regime' : 'Either Regime';
    var userName  = inputs.name || (inputs.personalInfo && inputs.personalInfo.name) || 'Taxpayer';
    var score     = Number(insightResult.score || 0);
    var band      = insightResult.band || '';
    var y;  // running vertical cursor

    // ════════════════════════════════════════
    // HELPERS
    // ════════════════════════════════════════

    /** Add MakeEazy logo image */
    function addLogo(xPos, yPos, w) {
        try {
            if (typeof MAKEEAZY_LOGO !== 'undefined') {
                doc.addImage(MAKEEAZY_LOGO, 'PNG', xPos, yPos, w, w * 0.28);
            }
        } catch (e) { /* logo not loaded */ }
    }

    /** Register a page for footer rendering */
    function registerFooter(pageNum) {
        pageFooters.push(pageNum);
    }

    /** Draw footers on every page (called once at the end) */
    function drawAllFooters() {
        totalPages = pageFooters.length;
        for (var i = 0; i < pageFooters.length; i++) {
            doc.setPage(i + 1);
            // Subtle gray separator
            doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
            doc.setLineWidth(0.3);
            doc.line(M, H - 12, W - M, H - 12);
            // Left: branded name
            doc.setFontSize(7);
            doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
            doc.setFont('helvetica', 'bold');
            doc.text('makeeazy.in', M, H - 7);
            // Center: confidential
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.setFontSize(6.5);
            doc.text('Confidential  |  Prepared for ' + userName, W / 2, H - 7, { align: 'center' });
            // Right: page number
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);
            doc.text(String(i + 1) + ' / ' + totalPages, W - M, H - 7, { align: 'right' });
            // Bottom orange accent
            doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
            doc.rect(0, H - 2.5, W, 2.5, 'F');
        }
    }

    /** Draw a simulated gradient header (3-band navy gradient) */
    function drawGradientHeader(height) {
        var bands = 4;
        var bandH = height / bands;
        for (var b = 0; b < bands; b++) {
            var t = b / (bands - 1);
            var r = Math.round(NAVY_DEEP[0] + (NAVY[0] - NAVY_DEEP[0]) * (1 - t * 0.6));
            var g = Math.round(NAVY_DEEP[1] + (NAVY[1] - NAVY_DEEP[1]) * (1 - t * 0.6));
            var bl = Math.round(NAVY_DEEP[2] + (NAVY[2] - NAVY_DEEP[2]) * (1 - t * 0.6));
            doc.setFillColor(r, g, bl);
            doc.rect(0, b * bandH, W, bandH + 0.5, 'F');
        }
        // Orange accent line below
        doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
        doc.rect(0, height, W, 2.5, 'F');
    }

    /** Section header bar with logo and right-aligned title */
    function sectionHeader(text) {
        doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.rect(0, 0, W, 17, 'F');
        doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
        doc.rect(0, 17, W, 2.5, 'F');
        addLogo(M, 3.5, 30);
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text(text, W - M, 11.5, { align: 'right' });
    }

    /** Draw a decorative section divider with centered label */
    function drawSectionDivider(yPos, label) {
        doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
        doc.setLineWidth(0.3);
        if (label) {
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            var tw = doc.getTextWidth(label) + 10;
            doc.line(M, yPos, W / 2 - tw / 2, yPos);
            doc.line(W / 2 + tw / 2, yPos, W - M, yPos);
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.text(label, W / 2, yPos + 1, { align: 'center' });
        } else {
            doc.line(M, yPos, W - M, yPos);
        }
    }

    /** Draw section title with orange underline accent */
    function drawSectionTitle(title, yPos) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text(title, M, yPos);
        doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
        doc.setLineWidth(0.8);
        doc.line(M, yPos + 2, M + 44, yPos + 2);
        return yPos + 9;
    }

    /** Check whether we need a new page for the given vertical space */
    function needsNewPage(requiredSpace) {
        return y + requiredSpace > H - 16;
    }

    /** Sanitize text — replace Unicode chars unsupported in Helvetica with ASCII */
    function sanitizeText(str) {
        return String(str || '')
            .replace(/[\u2014\u2015]/g, ' - ')     // em-dash → " - "
            .replace(/[\u2013]/g, '-')               // en-dash → "-"
            .replace(/[\u2018\u2019\u201A]/g, "'")   // smart single quotes
            .replace(/[\u201C\u201D\u201E]/g, '"')   // smart double quotes
            .replace(/[\u2026]/g, '...')             // ellipsis → "..."
            .replace(/[\u2192\u2794\u279C\u279E]/g, '>>')  // arrows → ">>"
            .replace(/[\u2022\u2023\u25CF]/g, '*')   // bullets → "*"
            .replace(/[\u25B6\u25BA]/g, '>')         // triangles → ">"
            .replace(/[\u20B9]/g, 'Rs.')             // rupee sign → "Rs."
            .replace(/[\u001A\uFFFD]/g, '')          // SUB and replacement chars → remove
            .replace(/[^\x20-\x7E\n\r\t]/g, '');    // strip any remaining non-ASCII
    }

    /** Safe text split — wraps and truncates with ellipsis at maxLines */
    function safeText(text, maxWidth, maxLines) {
        var lines = doc.splitTextToSize(sanitizeText(text), maxWidth);
        if (maxLines && lines.length > maxLines) {
            lines = lines.slice(0, maxLines);
            var last = lines[maxLines - 1];
            if (last.length > 3) last = last.substring(0, last.length - 3) + '...';
            lines[maxLines - 1] = last;
        }
        return lines;
    }


    // ════════════════════════════════════════════════════════════════
    // PAGE 1: TAX HEALTH DASHBOARD (HERO)
    // ════════════════════════════════════════════════════════════════

    // --- 1a. Premium hero header (solid navy) ---
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(0, 0, W, 92, 'F');
    doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.rect(0, 92, W, 2.5, 'F');

    addLogo(W / 2 - 24, 15, 48);

    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Tax Optimization Report', W / 2, 54, { align: 'center' });

    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(ORANGE_LT[0], ORANGE_LT[1], ORANGE_LT[2]);
    doc.text('FY 2025-26  |  AY 2026-27', W / 2, 64, { align: 'center' });

    doc.setFontSize(9);
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.text('Prepared exclusively for', W / 2, 78, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text(userName.toUpperCase(), W / 2, 87, { align: 'center' });

    // --- 1b. Taxpayer info card ---
    y = 103;
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.roundedRect(M, y, CW, 38, 3, 3, 'F');
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, 38, 3, 3, 'S');
    // Orange left accent
    doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.rect(M, y + 3, 2.5, 32, 'F');

    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(userName.toUpperCase(), M + 12, y + 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text('PAN: ' + (pan || 'N/A'), M + 12, y + 22);
    var incType = inputs.incomeType || inputs._incomeType || 'Salaried';
    doc.text('Income Source: ' + incType.charAt(0).toUpperCase() + incType.slice(1), M + 12, y + 29);

    doc.setTextColor(GRAY_LT[0], GRAY_LT[1], GRAY_LT[2]);
    doc.setFontSize(8);
    doc.text(
        'Generated: ' + new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
        CW + M - 6, y + 13, { align: 'right' }
    );

    // Gross Income on right
    var grossSalary = (parseFloat(inputs.basicSalary) || 0) + (parseFloat(inputs.hra) || 0) + (parseFloat(inputs.specialAllowance) || 0) + (parseFloat(inputs.da) || 0) + (parseFloat(inputs.lta) || 0);
    if (grossSalary > 0) {
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(fmt(grossSalary), CW + M - 6, y + 26, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.text('Gross Salary', CW + M - 6, y + 32, { align: 'right' });
    }

    // --- 1c. Tax Health Score band ---
    y = 148;
    var scoreColor = score > 60 ? GREEN : score > 40 ? AMBER : RED;
    doc.setFillColor(scoreColor[0], scoreColor[1], scoreColor[2]);
    doc.roundedRect(M, y, CW, 34, 3, 3, 'F');

    // Score bar background (simulated opacity with lighter color blend)
    var barX = M + 12;
    var barW = CW - 24;
    var barY = y + 20;
    var barH = 5;
    // Simulate 25% white on scoreColor => blend toward scoreColor
    var barBgR = Math.round(scoreColor[0] * 0.75 + 255 * 0.25);
    var barBgG = Math.round(scoreColor[1] * 0.75 + 255 * 0.25);
    var barBgB = Math.round(scoreColor[2] * 0.75 + 255 * 0.25);
    doc.setFillColor(barBgR, barBgG, barBgB);
    doc.roundedRect(barX, barY, barW, barH, 2, 2, 'F');

    // Score bar fill (simulated 60% white on scoreColor)
    var fillW = Math.max(8, barW * (score / 100));
    var barFillR = Math.round(scoreColor[0] * 0.4 + 255 * 0.6);
    var barFillG = Math.round(scoreColor[1] * 0.4 + 255 * 0.6);
    var barFillB = Math.round(scoreColor[2] * 0.4 + 255 * 0.6);
    doc.setFillColor(barFillR, barFillG, barFillB);
    doc.roundedRect(barX, barY, fillW, barH, 2, 2, 'F');


    // Score text
    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(17);
    doc.text('Tax Health Score: ' + score + ' / 100', W / 2, y + 14, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(band.toUpperCase(), W / 2, y + 31, { align: 'center' });

    // --- 1d. Human-readable summary ---
    y = 188;
    var totalPotSavings = Number(insightResult.totalPotentialSavings || 0);
    var absSavings      = Number(taxResult.absSavings || 0);
    var summaryLine;
    if (totalPotSavings === 0 && absSavings === 0) {
        summaryLine = 'Your tax profile is well-optimised. Professional verification ensures safe, compliant filing.';
    } else {
        summaryLine = 'MakeEazy identified ' + fmt(totalPotSavings) + ' of additional savings and a regime saving of ' + fmt(absSavings) + ' for your profile.';
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    var summaryLines = doc.splitTextToSize(summaryLine, CW - 10);
    for (var sl = 0; sl < summaryLines.length; sl++) {
        doc.text(summaryLines[sl], W / 2, y + (sl * 4.5), { align: 'center' });
    }
    y += summaryLines.length * 4.5 + 5;

    // --- 1e. Three metric cards ---
    var cardW = (CW - 12) / 3;
    var cardH = 30;
    var cardY = y;

    // Helper to draw a metric card
    function drawMetricCard(x, label, value, accentColor) {
        doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
        doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'F');
        doc.setDrawColor(BORDER_LT[0], BORDER_LT[1], BORDER_LT[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, cardY, cardW, cardH, 3, 3, 'S');
        // Accent top line
        doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
        doc.rect(x + 6, cardY, cardW - 12, 1.5, 'F');
        // Label
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.text(label, x + cardW / 2, cardY + 11, { align: 'center' });
        // Value
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
        var valLines = safeText(value, cardW - 8, 2);
        for (var vl = 0; vl < valLines.length; vl++) {
            doc.text(valLines[vl], x + cardW / 2, cardY + 20 + (vl * 5), { align: 'center' });
        }
    }

    drawMetricCard(M, 'Recommended Regime', bestLabel, NAVY);
    drawMetricCard(M + cardW + 6, 'Total Savings Possible', fmt(totalPotSavings + absSavings), GREEN);
    var filingRisk  = insightResult.filingRiskLevel || 'Standard';
    var riskColor   = filingRisk === 'Standard' ? GREEN : filingRisk === 'Needs Review' ? AMBER : RED;
    drawMetricCard(M + (cardW + 6) * 2, 'Filing Risk Level', filingRisk, riskColor);

    y = cardY + cardH + 8;

    // --- 1f. Top 3 Action Points ---
    y = drawSectionTitle('Opportunities Worth Exploring', y);

    var topActions = insightResult.topActions || [];
    if (topActions.length === 0) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.text('Your tax profile is well-optimised. File with confidence.', M + 6, y);
        y += 10;
    } else {
        var maxActions = Math.min(topActions.length, 3);
        for (var ai = 0; ai < maxActions; ai++) {
            var action = topActions[ai];
            var actionText  = action.action || action.title || action;
            var actionSave  = action.savings || action.saving || action.impact || 0;

            // Numbered circle
            doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
            doc.circle(M + 6, y + 1, 3.5, 'F');
            doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7);
            doc.text(String(ai + 1), M + 6, y + 2.5, { align: 'center' });

            // Action text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            var actionLines = safeText(actionText, CW - 56, 2);
            for (var ali = 0; ali < actionLines.length; ali++) {
                doc.text(actionLines[ali], M + 14, y + 1.5 + (ali * 4.5));
            }

            // Savings — softer "up to" language
            if (actionSave > 0) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(8);
                doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
                doc.text('up to ' + fmt(actionSave), CW + M - 4, y + 1.5, { align: 'right' });
            }
            y += Math.max(actionLines.length * 4.5, 5) + 4;

            // Separator between actions
            if (ai < maxActions - 1) {
                doc.setDrawColor(BORDER_LT[0], BORDER_LT[1], BORDER_LT[2]);
                doc.setLineWidth(0.2);
                doc.line(M + 14, y - 2, W - M, y - 2);
            }
        }
        // Qualifier footnote
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(6.5);
        doc.setTextColor(GRAY_LT[0], GRAY_LT[1], GRAY_LT[2]);
        doc.text('* Savings are indicative and subject to document verification by our CA team.', M + 14, y + 1);
        y += 6;
    }

    // --- 1g. Urgency bar ---
    y += 2;
    if (!needsNewPage(18)) {
        doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]);
        doc.roundedRect(M, y, CW, 14, 3, 3, 'F');
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text('File before July 31, 2026 — avoid penalties and portal congestion.', W / 2, y + 9, { align: 'center' });
    }

    registerFooter(1);


    // ════════════════════════════════════════════════════════════════
    // PAGE 2: REGIME COMPARISON
    // ════════════════════════════════════════════════════════════════
    doc.addPage();
    sectionHeader('Regime Comparison');
    y = 28;

    var colL = M;
    var colR = W / 2 + 4;
    var colW = CW / 2 - 4;

    function drawRegimeBox(x, label, tagline, result, highlight) {
        var boxY = y;
        var rows = [
            ['Gross Total Income',   fmt(result.grossSalary || 0)],
            ['Less: Std Deduction',  fmt(result.stdDeduction || 0)],
            ['Less: Ch VI-A Ded.',   fmt(result.totalDeductions || 0)],
            ['Taxable Income',       fmt(result.taxableTotal || 0)],
            ['Tax on Income',        fmt(result.normalTax || 0)],
            ['Rebate u/s 87A',       fmt(result.rebate || 0)],
            ['Surcharge',            fmt(result.netSurcharge || 0)],
            ['Cess (4%)',            fmt(result.cess || 0)]
        ];
        var rowH = 8;
        var boxH = 18 + 14 + rows.length * rowH + 14 + 6;

        // Card background
        doc.setFillColor(highlight ? 244 : 250, highlight ? 247 : 250, highlight ? 255 : 252);
        doc.roundedRect(x, boxY, colW, boxH, 3, 3, 'F');
        if (highlight) {
            doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
            doc.setLineWidth(0.8);
        } else {
            doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
            doc.setLineWidth(0.3);
        }
        doc.roundedRect(x, boxY, colW, boxH, 3, 3, 'S');

        // Top accent
        if (highlight) {
            doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
            doc.rect(x + 6, boxY, colW - 12, 2, 'F');
        }

        var ly = boxY + 12;
        // Regime name
        doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(label, x + colW / 2, ly, { align: 'center' });
        ly += 6;
        // Tagline
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.text(tagline, x + colW / 2, ly, { align: 'center' });
        ly += 5;
        // Separator
        doc.setDrawColor(highlight ? ORANGE[0] : BORDER[0], highlight ? ORANGE[1] : BORDER[1], highlight ? ORANGE[2] : BORDER[2]);
        doc.setLineWidth(0.4);
        doc.line(x + 8, ly, x + colW - 8, ly);
        ly += 8;

        // Total tax — hero number
        doc.setFontSize(20);
        doc.setTextColor(highlight ? DARK[0] : GRAY[0], highlight ? DARK[1] : GRAY[1], highlight ? DARK[2] : GRAY[2]);
        doc.setFont('helvetica', 'bold');
        doc.text(fmt(result.roundedTax), x + colW / 2, ly, { align: 'center' });
        // Subtle underline under the amount
        if (highlight) {
            doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
            doc.setLineWidth(0.5);
            var taxTextW = doc.getTextWidth(fmt(result.roundedTax));
            doc.line(x + colW / 2 - taxTextW / 2, ly + 2, x + colW / 2 + taxTextW / 2, ly + 2);
        }
        ly += 12;

        // Detail rows with alternating backgrounds
        for (var r = 0; r < rows.length; r++) {
            if (r % 2 === 0) {
                doc.setFillColor(highlight ? 238 : 246, highlight ? 242 : 248, highlight ? 252 : 252);
                doc.rect(x + 3, ly - 3.5, colW - 6, rowH, 'F');
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            doc.text(rows[r][0], x + 8, ly);
            doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.text(rows[r][1], x + colW - 8, ly, { align: 'right' });
            ly += rowH;
        }

        // RECOMMENDED badge
        if (highlight) {
            ly += 2;
            doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
            doc.roundedRect(x + 8, ly, colW - 16, 8, 2, 2, 'F');
            doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(7.5);
            doc.text('RECOMMENDED', x + colW / 2, ly + 5.5, { align: 'center' });
        }

        return boxH;
    }

    var boxH1 = drawRegimeBox(colL, 'Old Regime', 'Best with: HRA, home loan, 80C', taxResult.old, rec === 'old');
    var boxH2 = drawRegimeBox(colR, 'New Regime', 'Best with: simpler filing, fewer deductions', taxResult.new, rec === 'new' || rec === 'same');
    y += Math.max(boxH1, boxH2) + 8;

    // Verdict bar — redesigned with checkmark + two-column layout
    var verdictH = 32;
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.roundedRect(M, y, CW, verdictH, 3, 3, 'F');
    doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.rect(M, y + verdictH - 2, CW, 2, 'F');

    if (rec === 'same') {
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text('Both regimes result in the same tax liability', W / 2, y + 17, { align: 'center' });
    } else {
        // Left: Green checkmark circle + regime name
        var vChkX = M + 18;
        var vChkY = y + verdictH / 2;
        doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.circle(vChkX, vChkY, 7, 'F');
        doc.setDrawColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setLineWidth(1.3);
        doc.line(vChkX - 3, vChkY, vChkX - 0.5, vChkY + 3);
        doc.line(vChkX - 0.5, vChkY + 3, vChkX + 4, vChkY - 3);
        // "RECOMMENDED" label
        doc.setTextColor(GRAY_LT[0], GRAY_LT[1], GRAY_LT[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.text('RECOMMENDED', M + 30, y + 11);
        // Regime name large
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.text(bestLabel.toUpperCase(), M + 30, y + 23);
        // Right: Savings amount
        doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(15);
        doc.text(fmt(taxResult.absSavings), W - M - 6, y + 17, { align: 'right' });
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('savings vs other regime', W - M - 6, y + 24, { align: 'right' });
    }
    y += verdictH + 6;

    // Advisory note inside a subtle card
    doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
    doc.roundedRect(M, y, CW, 14, 2, 2, 'F');
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(7);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    var advisoryNote = 'Amounts are indicative based on information provided. Final regime selection should be confirmed after document verification by a qualified professional.';
    var advLines = safeText(advisoryNote, CW - 14, 3);
    for (var aN = 0; aN < advLines.length; aN++) {
        doc.text(advLines[aN], W / 2, y + 5 + (aN * 3.2), { align: 'center' });
    }

    registerFooter(2);


    // ════════════════════════════════════════════════════════════════
    // PAGE 3+: SMART INSIGHTS (auto-paginated)
    // ════════════════════════════════════════════════════════════════
    var insights = insightResult.insights || [];
    var pgNum = 3;

    if (insights.length > 0) {
        doc.addPage();
        sectionHeader('Smart Insights');
        y = 26;

        var typeBadge  = { risk: 'RISK', opportunity: 'OPPORTUNITY', good: 'VERIFIED', info: 'INFO' };
        var typeColors = { risk: RED, opportunity: GREEN, good: GREEN, info: NAVY };
        var typeBg     = {
            risk:        RED_LT,
            opportunity: GREEN_LT,
            good:        [236, 253, 243],
            info:        [240, 244, 255]
        };

        // Group insights by type for section headers
        var lastType = '';

        for (var ii = 0; ii < insights.length; ii++) {
            var ins   = insights[ii];
            var col   = typeColors[ins.type] || GRAY;
            var bg    = typeBg[ins.type] || LIGHT_BG;
            var badge = typeBadge[ins.type] || 'INFO';

            // Group label when type changes
            var groupLabel = '';
            if (ins.type !== lastType) {
                lastType = ins.type;
                if (ins.type === 'risk') groupLabel = 'ATTENTION REQUIRED';
                else if (ins.type === 'opportunity') groupLabel = 'SAVINGS OPPORTUNITIES';
                else if (ins.type === 'good') groupLabel = 'VERIFIED & GOOD';
                else if (ins.type === 'info') groupLabel = 'INFORMATION';
            }

            // Measure title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            var titleMaxW = CW - 40;
            if (ins.impact > 0) titleMaxW -= 30;
            var tLines = safeText(ins.title || '', titleMaxW, 2);
            var tH = tLines.length * 4.5;

            // Measure detail
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            var dLines = safeText(ins.detail || '', CW - 18, 4);
            var dH = dLines.length * 4;

            // CTA — pre-measure for accurate card height
            var ctaText = ins.ctaLine || '';
            var ctaRendered = [];
            if (ctaText) {
                var cleanCtaPre = ctaText.replace(/^[\u2192\u2794\u279C\u2023\u25B6\u25BA\u2013\u2014\u001A\u279E\uFFFD]\s*/g, '').trim();
                if (cleanCtaPre) {
                    doc.setFont('helvetica', 'bold');
                    doc.setFontSize(7.5);
                    ctaRendered = safeText('-> ' + cleanCtaPre, CW - 16, 2);
                }
            }
            var ctaH = ctaRendered.length > 0 ? (ctaRendered.length * 4 + 2) : 0;

            var bH = 8 + tH + 3 + dH + ctaH + 5;
            var groupH = groupLabel ? 10 : 0;

            // Page break check
            if (needsNewPage(bH + groupH + 3)) {
                registerFooter(pgNum);
                pgNum++;
                doc.addPage();
                sectionHeader('Smart Insights (cont.)');
                y = 26;
            }

            // Group label with colored background band
            if (groupLabel) {
                var bandBg = ins.type === 'risk' ? [254, 238, 238] :
                             ins.type === 'opportunity' ? [232, 250, 238] :
                             ins.type === 'good' ? [232, 250, 238] : [236, 240, 255];
                doc.setFillColor(bandBg[0], bandBg[1], bandBg[2]);
                doc.roundedRect(M, y, CW, 8, 1.5, 1.5, 'F');
                doc.setFillColor(col[0], col[1], col[2]);
                doc.rect(M, y + 1, 2.5, 6, 'F');
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7);
                doc.setTextColor(col[0], col[1], col[2]);
                doc.text(groupLabel, M + 7, y + 5.5);
                doc.setDrawColor(col[0], col[1], col[2]);
                doc.setLineWidth(0.3);
                var glW = doc.getTextWidth(groupLabel);
                doc.line(M + glW + 11, y + 4, W - M - 2, y + 4);
                y += groupH;
            }

            // Card background with subtle border
            doc.setFillColor(bg[0], bg[1], bg[2]);
            doc.roundedRect(M, y, CW, bH, 2.5, 2.5, 'F');
            doc.setDrawColor(BORDER_LT[0], BORDER_LT[1], BORDER_LT[2]);
            doc.setLineWidth(0.25);
            doc.roundedRect(M, y, CW, bH, 2.5, 2.5, 'S');

            // Left accent border
            doc.setFillColor(col[0], col[1], col[2]);
            doc.rect(M, y + 2, 2, bH - 4, 'F');

            // Badge
            doc.setFillColor(col[0], col[1], col[2]);
            var badgeW = Math.max(doc.getTextWidth(badge) + 6, 18);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(5.5);
            badgeW = doc.getTextWidth(badge) + 8;
            doc.roundedRect(M + 6, y + 3.5, badgeW, 5.5, 1.5, 1.5, 'F');
            doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
            doc.text(badge, M + 6 + badgeW / 2, y + 7.5, { align: 'center' });

            // Title
            doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(9);
            var titleX = M + 8 + badgeW + 4;
            for (var tl = 0; tl < tLines.length; tl++) {
                doc.text(tLines[tl], titleX, y + 7.5 + (tl * 4.5));
            }

            // Impact amount
            if (ins.impact > 0) {
                doc.setTextColor(col[0], col[1], col[2]);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(9);
                doc.text(fmt(ins.impact), CW + M - 6, y + 7.5, { align: 'right' });
            }

            // Detail lines
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
            var dY = y + 8 + tH + 2;
            for (var dl = 0; dl < dLines.length; dl++) {
                doc.text(dLines[dl], M + 8, dY + (dl * 4));
            }

            // CTA line(s) — with clickable desk.makeeazy.in links
            if (ctaRendered.length > 0) {
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(7.5);
                doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
                for (var cl = 0; cl < ctaRendered.length; cl++) {
                    var ctaLineY = dY + dLines.length * 4 + 2 + (cl * 4);
                    doc.text(ctaRendered[cl], M + 8, ctaLineY);
                    // Make desk.makeeazy.in clickable with underline
                    var ctaLower = ctaRendered[cl].toLowerCase();
                    if (ctaLower.indexOf('desk.makeeazy.in') !== -1) {
                        var deskIdx = ctaLower.indexOf('desk.makeeazy.in');
                        var deskPre = ctaRendered[cl].substring(0, deskIdx);
                        var deskPreW = doc.getTextWidth(deskPre);
                        var deskLinkW = doc.getTextWidth('desk.makeeazy.in');
                        doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
                        doc.setLineWidth(0.3);
                        doc.line(M + 8 + deskPreW, ctaLineY + 1, M + 8 + deskPreW + deskLinkW, ctaLineY + 1);
                        doc.link(M + 8 + deskPreW, ctaLineY - 3, deskLinkW, 5, { url: 'https://desk.makeeazy.in' });
                    }
                    // Make wa.me clickable with underline
                    if (ctaLower.indexOf('wa.me') !== -1) {
                        var waIdx = ctaLower.indexOf('wa.me');
                        var waPre = ctaRendered[cl].substring(0, waIdx);
                        var waEnd = ctaRendered[cl].indexOf(' ', waIdx);
                        if (waEnd === -1) waEnd = ctaRendered[cl].length;
                        var waLinkTxt = ctaRendered[cl].substring(waIdx, waEnd);
                        var waPreW = doc.getTextWidth(waPre);
                        var waLinkW = doc.getTextWidth(waLinkTxt);
                        doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
                        doc.setLineWidth(0.3);
                        doc.line(M + 8 + waPreW, ctaLineY + 1, M + 8 + waPreW + waLinkW, ctaLineY + 1);
                        doc.link(M + 8 + waPreW, ctaLineY - 3, waLinkW, 5, { url: 'https://wa.me/919992819995' });
                    }
                }
            }

            y += bH + 3;
        }

        // Premium savings summary card with breakdown
        if (insightResult.totalPotentialSavings > 0) {
            var savCardH = 52;
            if (needsNewPage(savCardH + 10)) {
                registerFooter(pgNum);
                pgNum++;
                doc.addPage();
                sectionHeader('Smart Insights — Summary');
                y = 28;
            }
            y += 5;
            // Outer card with border
            doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
            doc.roundedRect(M, y, CW, savCardH, 3, 3, 'F');
            doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
            doc.setLineWidth(0.6);
            doc.roundedRect(M, y, CW, savCardH, 3, 3, 'S');
            // Green top accent
            doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
            doc.rect(M + 6, y, CW - 12, 2, 'F');
            // Title
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(10);
            doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
            doc.text('YOUR SAVINGS POTENTIAL', M + 10, y + 10);
            // Breakdown rows
            var brkY = y + 18;
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8.5);
            doc.setTextColor(DARK[0], DARK[1], DARK[2]);
            doc.text('Regime Savings', M + 10, brkY);
            doc.setFont('helvetica', 'bold');
            doc.text(fmt(taxResult.absSavings || 0), M + CW - 10, brkY, { align: 'right' });
            brkY += 6;
            doc.setFont('helvetica', 'normal');
            doc.text('Tax-Saving Opportunities', M + 10, brkY);
            doc.setFont('helvetica', 'bold');
            doc.text(fmt(insightResult.totalPotentialSavings), M + CW - 10, brkY, { align: 'right' });
            brkY += 4;
            // Divider
            doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
            doc.setLineWidth(0.3);
            doc.line(M + 10, brkY, M + CW - 10, brkY);
            brkY += 5;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(11);
            doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
            doc.text('Total Potential Savings', M + 10, brkY);
            var totalSav = (taxResult.absSavings || 0) + insightResult.totalPotentialSavings;
            doc.text(fmt(totalSav), M + CW - 10, brkY, { align: 'right' });
            // Embedded CTA
            brkY += 7;
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(8);
            doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
            doc.text('-> Claim these savings — start at desk.makeeazy.in', M + 10, brkY);
            var claimLinkX = M + 10 + doc.getTextWidth('-> Claim these savings — start at ');
            var claimLinkW = doc.getTextWidth('desk.makeeazy.in');
            doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
            doc.setLineWidth(0.3);
            doc.line(claimLinkX, brkY + 1, claimLinkX + claimLinkW, brkY + 1);
            doc.link(claimLinkX, brkY - 3, claimLinkW, 5, { url: 'https://desk.makeeazy.in' });
            // Disclaimer
            brkY += 5;
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(6);
            doc.setTextColor(GRAY_LT[0], GRAY_LT[1], GRAY_LT[2]);
            doc.text('* Subject to document verification by our CA team', M + 10, brkY);
        }

        registerFooter(pgNum);
        pgNum++;
    } else {
        pgNum = 3;
    }


    // ════════════════════════════════════════════════════════════════
    // PAGE N-1: WHY PROFESSIONAL FILING MATTERS
    // ════════════════════════════════════════════════════════════════
    doc.addPage();
    sectionHeader('Why Professional Filing Matters');
    y = 28;

    // Page title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.text('ITR Filing Is Not Form-Filling', W / 2, y, { align: 'center' });
    y += 5;
    doc.setFontSize(10);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.setFont('helvetica', 'normal');
    doc.text('It is a legal declaration to the Government of India', W / 2, y, { align: 'center' });
    y += 3;
    doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setLineWidth(0.8);
    doc.line(W / 2 - 35, y, W / 2 + 35, y);
    y += 8;

    // --- Block 1: Risk facts as individual mini-cards ---
    var riskFacts = [
        { title: '40+ Data Sources Tracked',     desc: 'IT Department cross-references banks, brokers, registrars, and employers against your return' },
        { title: 'Notices Up to 8 Years Later',   desc: 'One wrong filing year can trigger scrutiny on all 3 most recent years' },
        { title: 'Inflated Claims Flagged',        desc: 'Fake refund rackets exposed -- IT Dept flags suspicious claims for manual scrutiny' },
        { title: 'Zero Tolerance for Mismatches',  desc: 'Even a Rs. 500 interest mismatch can hold processing of your entire return' }
    ];

    for (var rfi = 0; rfi < riskFacts.length; rfi++) {
        var rf = riskFacts[rfi];
        var rfH = 14;
        doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
        doc.roundedRect(M, y, CW, rfH, 2.5, 2.5, 'F');
        doc.setDrawColor(RED[0], RED[1], RED[2]);
        doc.setLineWidth(0.25);
        doc.roundedRect(M, y, CW, rfH, 2.5, 2.5, 'S');
        // Red left accent
        doc.setFillColor(RED[0], RED[1], RED[2]);
        doc.rect(M, y + 2, 2.5, rfH - 4, 'F');
        // Warning triangle icon
        doc.setFillColor(RED[0], RED[1], RED[2]);
        doc.triangle(M + 11, y + 3.5, M + 8, y + 9.5, M + 14, y + 9.5, 'F');
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6);
        doc.text('!', M + 11, y + 8.5, { align: 'center' });
        // Title bold
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text(rf.title, M + 19, y + 5.5);
        // Description
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
        doc.text(sanitizeText(rf.desc), M + 19, y + 11);
        y += rfH + 2.5;
    }
    y += 3;

    // --- Block 2: How MakeEazy Protects You (4-step process) ---
    var stepData = [
        { num: '1', label: 'VERIFY',   desc: 'We reconcile your data with IT Department records — zero mismatches' },
        { num: '2', label: 'OPTIMIZE', desc: 'CA reviews every deduction, exemption, and regime choice for maximum legal savings' },
        { num: '3', label: 'FILE',     desc: 'We handle the portal — no OTP stress, no last-minute errors, no rejections' },
        { num: '4', label: 'PROTECT',  desc: 'Notice support included — we stand behind every return we file' }
    ];
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.text('How MakeEazy Protects You', M + 2, y + 4);
    doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.setLineWidth(0.3);
    var gpW = doc.getTextWidth('How MakeEazy Protects You');
    doc.line(M + gpW + 6, y + 3, W - M, y + 3);
    y += 10;

    for (var si = 0; si < stepData.length; si++) {
        var step = stepData[si];
        var stepH = 16;
        // Card
        doc.setFillColor(GREEN_LT[0], GREEN_LT[1], GREEN_LT[2]);
        doc.roundedRect(M, y, CW, stepH, 2.5, 2.5, 'F');
        doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setLineWidth(0.25);
        doc.roundedRect(M, y, CW, stepH, 2.5, 2.5, 'S');
        // Green left accent
        doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.rect(M, y + 2, 2, stepH - 4, 'F');
        // Number circle
        doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.circle(M + 12, y + stepH / 2, 4.5, 'F');
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(step.num, M + 12, y + stepH / 2 + 1.5, { align: 'center' });
        // Label
        doc.setTextColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(step.label, M + 22, y + 6);
        // Description
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        var stepDesc = safeText(step.desc, CW - 30, 2);
        for (var sdl = 0; sdl < stepDesc.length; sdl++) {
            doc.text(stepDesc[sdl], M + 22, y + 11 + (sdl * 3.5));
        }
        y += stepH + 3;
    }
    y += 3;

    // --- Block 3: What You Get With MakeEazy ---
    var hasBusiness = inputs.businessType && inputs.businessType !== 'none';
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.text('What You Get With MakeEazy', M + 2, y + 4);
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setLineWidth(0.3);
    var wyW = doc.getTextWidth('What You Get With MakeEazy');
    doc.line(M + wyW + 6, y + 3, W - M, y + 3);
    y += 10;

    var whatYouGet = [
        'Personal CA assigned to review your case — not automated software',
        'Every number verified against IT Department records before filing',
        'Complete documentation and audit trail for each deduction claimed',
        'Notice support for up to 3 years — we are accountable for your return'
    ];
    if (hasBusiness) whatYouGet.push('Business income review — turnover classification, GST-ITR reconciliation');

    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    var wygH = 8 + whatYouGet.length * 5.5 + 4;
    doc.roundedRect(M, y, CW, wygH, 3, 3, 'F');
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, wygH, 3, 3, 'S');
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(M, y + 3, 2.5, wygH - 6, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    var wygY = y + 7;
    for (var wi = 0; wi < whatYouGet.length; wi++) {
        // Draw green tick
        doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setLineWidth(0.6);
        doc.line(M + 8, wygY - 1, M + 9.5, wygY + 1.5);
        doc.line(M + 9.5, wygY + 1.5, M + 12, wygY - 2);
        var wygLines = safeText(whatYouGet[wi], CW - 22, 2);
        for (var wl = 0; wl < wygLines.length; wl++) {
            doc.text(wygLines[wl], M + 15, wygY + (wl * 3.5));
        }
        wygY += 5.5;
    }
    y += wygH + 6;

    // --- Bottom declaration block ---
    if (!needsNewPage(24)) {
        doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.roundedRect(M, y, CW, 20, 3, 3, 'F');
        doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text('Your ITR is a legal declaration. Every number you sign is your responsibility.', W / 2, y + 8, { align: 'center' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text('A CA-led team ensures every number is verified, documented, and defensible.', W / 2, y + 15, { align: 'center' });
        y += 26;
    }

    // --- Documents Checklist ---
    if (!needsNewPage(48)) {
        y += 2;
        y = drawSectionTitle('Just Share These — We Handle Everything Else', y);

        doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
        doc.roundedRect(M, y, CW, 28, 3, 3, 'F');
        doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(M, y, CW, 28, 3, 3, 'S');

        var leftDocs  = ['Form 16', 'Bank statements', 'Home loan certificate', 'Rent receipts + agreement'];
        var rightDocs = ['80C investment proofs', 'Health insurance receipts', 'Capital gains statement', 'Business P&L details'];
        var halfW = CW / 2;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        var docY = y + 6;
        for (var di = 0; di < 4; di++) {
            doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
            doc.setLineWidth(0.4);
            doc.rect(M + 6, docY - 3, 3, 3, 'S');
            doc.text(leftDocs[di], M + 12, docY);
            doc.rect(M + halfW + 4, docY - 3, 3, 3, 'S');
            doc.text(rightDocs[di], M + halfW + 10, docY);
            docY += 5.5;
        }

        y += 32;
        doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('-> Upload on desk.makeeazy.in — your assigned CA takes it from here.', M + 6, y);
        var uploadLinkX = M + 6 + doc.getTextWidth('-> Upload on ');
        var uploadLinkW = doc.getTextWidth('desk.makeeazy.in');
        doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
        doc.setLineWidth(0.3);
        doc.line(uploadLinkX, y + 1, uploadLinkX + uploadLinkW, y + 1);
        doc.link(uploadLinkX, y - 4, uploadLinkW, 6, { url: 'https://desk.makeeazy.in' });
    }

    registerFooter(pgNum);
    pgNum++;


    // ════════════════════════════════════════════════════════════════
    // PAGE N: GET STARTED
    // ════════════════════════════════════════════════════════════════
    doc.addPage();
    sectionHeader('Get Started');
    y = 30;

    // Title
    doc.setTextColor(DARK[0], DARK[1], DARK[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('We found real opportunities.', W / 2, y, { align: 'center' });
    y += 7;
    doc.setFontSize(13);
    doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.text('Take the next step.', W / 2, y, { align: 'center' });
    y += 12;

    // --- CTA Card 1: Create Your Account (PRIMARY) ---
    var ctaCardH1 = 40;
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.roundedRect(M, y, CW, ctaCardH1, 3, 3, 'F');
    doc.setDrawColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(M, y, CW, ctaCardH1, 3, 3, 'S');
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.rect(M + 6, y, CW - 12, 1.5, 'F');

    // Drawn user/account icon in circle
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.circle(M + 14, y + 14, 7, 'F');
    // Head
    doc.setDrawColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.circle(M + 14, y + 11.5, 2, 'F');
    // Body arc (shoulders)
    doc.setLineWidth(1);
    doc.line(M + 10.5, y + 18, M + 12, y + 15.5);
    doc.line(M + 17.5, y + 18, M + 16, y + 15.5);

    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Create Your Account', M + 26, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    var cta1Lines = safeText('Upload documents securely, track your filing status, get real-time updates from your assigned professional.', CW - 34, 2);
    for (var c1l = 0; c1l < cta1Lines.length; c1l++) {
        doc.text(cta1Lines[c1l], M + 26, y + 20 + (c1l * 4));
    }
    var linkY1 = y + 20 + cta1Lines.length * 4 + 3;
    doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('desk.makeeazy.in', M + 26, linkY1);
    var lw1 = doc.getTextWidth('desk.makeeazy.in');
    doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setLineWidth(0.3);
    doc.line(M + 26, linkY1 + 1, M + 26 + lw1, linkY1 + 1);
    doc.link(M + 26, linkY1 - 4, lw1, 6, { url: 'https://desk.makeeazy.in' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text('(Click to create your free account)', M + 26 + lw1 + 3, linkY1);
    y += ctaCardH1 + 6;

    // --- CTA Card 2: WhatsApp ---
    var ctaCardH2 = 38;
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.roundedRect(M, y, CW, ctaCardH2, 3, 3, 'F');
    doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(M, y, CW, ctaCardH2, 3, 3, 'S');
    doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.rect(M + 6, y, CW - 12, 1.5, 'F');

    // Drawn chat bubble icon in circle
    doc.setFillColor(GREEN[0], GREEN[1], GREEN[2]);
    doc.circle(M + 14, y + 14, 7, 'F');
    // Chat bubble shape
    doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.roundedRect(M + 10, y + 10, 8, 5, 1.5, 1.5, 'F');
    // Bubble tail
    doc.triangle(M + 12, y + 15, M + 14, y + 18, M + 15, y + 15, 'F');

    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('WhatsApp Us', M + 26, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text('Share documents instantly, ask questions, get quick support from our team.', M + 26, y + 20);
    // Pre-filled message link
    var linkY2 = y + 27;
    doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('wa.me/919992819995', M + 26, linkY2);
    var lw2 = doc.getTextWidth('wa.me/919992819995');
    doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setLineWidth(0.3);
    doc.line(M + 26, linkY2 + 1, M + 26 + lw2, linkY2 + 1);
    doc.link(M + 26, linkY2 - 4, lw2, 6, { url: 'https://wa.me/919992819995?text=Hello%2C%20I%20need%20tax%20filing%20support' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text('(Click to message us directly)', M + 26 + lw2 + 3, linkY2);
    y += ctaCardH2 + 6;

    // --- CTA Card 3: Contact ---
    var ctaCardH3 = 38;
    doc.setFillColor(CARD_BG[0], CARD_BG[1], CARD_BG[2]);
    doc.roundedRect(M, y, CW, ctaCardH3, 3, 3, 'F');
    doc.setDrawColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.setLineWidth(0.8);
    doc.roundedRect(M, y, CW, ctaCardH3, 3, 3, 'S');
    doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.rect(M + 6, y, CW - 12, 1.5, 'F');

    // Drawn envelope icon in circle
    doc.setFillColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.circle(M + 14, y + 14, 7, 'F');
    // Envelope shape
    doc.setFillColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.rect(M + 10, y + 11, 8, 5.5, 'F');
    // Envelope flap (V shape)
    doc.setDrawColor(AMBER[0], AMBER[1], AMBER[2]);
    doc.setLineWidth(0.7);
    doc.line(M + 10, y + 11, M + 14, y + 14.5);
    doc.line(M + 18, y + 11, M + 14, y + 14.5);

    doc.setTextColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('Reach Us Directly', M + 26, y + 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text('Email us or call our tax team for personalised assistance.', M + 26, y + 20);
    // Email
    var linkY3 = y + 27;
    doc.setTextColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('contact@makeeazy.in', M + 26, linkY3);
    var lwEmail = doc.getTextWidth('contact@makeeazy.in');
    doc.setDrawColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.setLineWidth(0.3);
    doc.line(M + 26, linkY3 + 1, M + 26 + lwEmail, linkY3 + 1);
    doc.link(M + 26, linkY3 - 4, lwEmail, 6, { url: 'mailto:contact@makeeazy.in' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.text('  |  +91-9992819995', M + 26 + lwEmail, linkY3);
    y += ctaCardH3 + 8;

    // --- Professional service block ---
    var psBlockH = 44;
    doc.setFillColor(NAVY[0], NAVY[1], NAVY[2]);
    doc.roundedRect(M, y, CW, psBlockH, 3, 3, 'F');
    // Orange top accent
    doc.setFillColor(ORANGE[0], ORANGE[1], ORANGE[2]);
    doc.rect(M + 10, y, CW - 20, 1.5, 'F');

    doc.setTextColor(WHITE[0], WHITE[1], WHITE[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('Real professionals. Real verification. Real accountability.', W / 2, y + 10, { align: 'center' });

    var checkItems = [
        'CA-led team — not automated software',
        'Every document verified before filing',
        'IT Department data reconciliation — zero mismatches',
        'Notice support — we stand behind every return we file',
        'Your return, your declaration — we make sure it is defensible'
    ];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    // Two-column layout
    var chkY = y + 17;
    var chkHalf = Math.ceil(checkItems.length / 2);
    for (var chi = 0; chi < checkItems.length; chi++) {
        var chkX = chi < chkHalf ? M + 14 : M + CW / 2 + 4;
        var chkYi = chi < chkHalf ? chkY + (chi * 5.5) : chkY + ((chi - chkHalf) * 5.5);
        // Draw green checkmark
        doc.setDrawColor(GREEN[0], GREEN[1], GREEN[2]);
        doc.setLineWidth(0.7);
        doc.line(chkX, chkYi - 1, chkX + 1.5, chkYi + 1.5);
        doc.line(chkX + 1.5, chkYi + 1.5, chkX + 4, chkYi - 2);
        doc.text(checkItems[chi], chkX + 6, chkYi);
    }
    y += psBlockH + 8;

    // --- Urgency countdown card ---
    var deadlineDate = new Date(2026, 6, 31);
    var todayDate = new Date();
    var daysLeft = Math.ceil((deadlineDate - todayDate) / (1000 * 60 * 60 * 24));
    if (daysLeft > 0 && daysLeft <= 120 && !needsNewPage(22)) {
        var urgH = 18;
        doc.setFillColor(RED_LT[0], RED_LT[1], RED_LT[2]);
        doc.roundedRect(M, y, CW, urgH, 3, 3, 'F');
        doc.setDrawColor(RED[0], RED[1], RED[2]);
        doc.setLineWidth(0.6);
        doc.roundedRect(M, y, CW, urgH, 3, 3, 'S');
        // Drawn clock icon
        doc.setFillColor(RED[0], RED[1], RED[2]);
        doc.circle(M + 15, y + urgH / 2, 5, 'F');
        doc.setDrawColor(WHITE[0], WHITE[1], WHITE[2]);
        doc.setLineWidth(0.7);
        doc.line(M + 15, y + urgH / 2, M + 15, y + urgH / 2 - 3);
        doc.line(M + 15, y + urgH / 2, M + 17, y + urgH / 2 + 0.5);
        // Countdown text
        doc.setTextColor(RED[0], RED[1], RED[2]);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('Only ' + daysLeft + ' days left to file!', M + 24, y + 7.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(DARK[0], DARK[1], DARK[2]);
        doc.text('Filing deadline: July 31, 2026 — Start now to avoid last-minute portal congestion.', M + 24, y + 14);
        y += urgH + 6;
    }

    // --- Disclaimer box ---
    doc.setFillColor(LIGHT_BG[0], LIGHT_BG[1], LIGHT_BG[2]);
    doc.roundedRect(M, y, CW, 22, 2, 2, 'F');
    doc.setDrawColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.setLineWidth(0.3);
    doc.roundedRect(M, y, CW, 22, 2, 2, 'S');

    doc.setFontSize(6.5);
    doc.setTextColor(GRAY[0], GRAY[1], GRAY[2]);
    doc.setFont('helvetica', 'normal');
    var disclaimerLines = [
        'This report is generated based on information provided by you on the MakeEazy Tax Health tool.',
        'Figures are indicative and may change after verification of Form 16 and supporting documents.',
        'This is not a substitute for personalised tax advice. Consult a qualified professional before filing.',
        'For professional assistance, visit desk.makeeazy.in or call +91-9992819995.'
    ];
    for (var dli = 0; dli < disclaimerLines.length; dli++) {
        doc.text(disclaimerLines[dli], W / 2, y + 5 + (dli * 4), { align: 'center' });
    }

    registerFooter(pgNum);

    // ── Render all footers ──
    drawAllFooters();

    return doc;
}


/**
 * Generate a base64-encoded PDF string (used for email / download).
 */
function generateReportBase64(taxResult, insightResult, inputs, pan) {
    var doc = generateReportPDF(taxResult, insightResult, inputs, pan);
    return doc.output('datauristring').split(',')[1];
}
