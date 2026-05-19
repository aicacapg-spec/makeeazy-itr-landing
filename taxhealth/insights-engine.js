/**
 * MakeEazy Insights Engine v4
 * Regime-aware, what-if analysis, conversion-optimized.
 * Each insight: Fact → Urgency → CTA hook
 */

function generateInsights(inputs, result) {
    const insights = [];
    const rec = result.recommendation;
    const bestRegime = rec === 'old' ? result.old : result.new;
    const isOldBetter = rec === 'old';
    const isNewBetter = rec === 'new';
    const fmtR = n => {
        const num = Math.round(Number(n) || 0);
        if (num >= 10000000) return 'Rs. ' + (num / 10000000).toFixed(2) + ' Cr';
        if (num >= 100000) return 'Rs. ' + (num / 100000).toFixed(2) + ' L';
        return 'Rs. ' + num.toLocaleString('en-IN');
    };

    // Helper: what-if marginal impact (recomputes tax with modified input)
    function whatIf(overrides) {
        const modified = Object.assign({}, inputs, overrides);
        const modResult = computeTax(modified);
        // Compare best regime tax
        const currentBest = bestRegime.roundedTax;
        const modOld = modResult.old.roundedTax;
        const modNew = modResult.new.roundedTax;
        const modBest = Math.min(modOld, modNew);
        return Math.max(0, currentBest - modBest);
    }

    // Helper: what-if for OLD regime only
    function whatIfOld(overrides) {
        const modified = Object.assign({}, inputs, overrides);
        const modResult = computeTax(modified);
        return Math.max(0, result.old.roundedTax - modResult.old.roundedTax);
    }

    // ═══════════════════════════════════════
    // CATEGORY A: REGIME & STRUCTURE
    // ═══════════════════════════════════════

    // 1. REGIME RECOMMENDATION
    var isBusiness = (inputs.businessType && inputs.businessType !== 'none');
    if (result.savings !== 0) {
        var regimeDetail = rec === 'new'
            ? 'New Regime offers lower tax by ' + fmtR(result.absSavings) + ' for your profile.'
            : 'Old Regime saves ' + fmtR(result.absSavings) + ' thanks to your deductions and exemptions.';
        if (isBusiness) {
            regimeDetail += ' Note: Business/profession taxpayers have continuity implications when switching regimes. Review with a professional before opting out.';
        }
        insights.push({
            id: 'regime', type: 'info',
            title: rec === 'new' ? 'New Regime is Better for You' : 'Old Regime is Better for You',
            detail: regimeDetail,
            impact: result.absSavings,
            priority: result.absSavings > 20000 ? 'high' : 'medium'
        });
    } else {
        insights.push({
            id: 'regime', type: 'good',
            title: 'Both Regimes Result in Same Tax',
            detail: 'Your profile balances equally under both regimes.',
            impact: 0, priority: 'low'
        });
    }

    // 2. EFFECTIVE TAX RATE
    var grossIncome = (parseFloat(inputs.basicSalary) || 0) + (parseFloat(inputs.hra) || 0) +
        (parseFloat(inputs.specialAllowance) || 0) + (parseFloat(inputs.da) || 0) +
        (parseFloat(inputs.lta) || 0) + (parseFloat(inputs.interestIncome) || 0) +
        (parseFloat(inputs.otherIncome) || 0) + (parseFloat(inputs.familyPension) || 0);
    if (grossIncome > 0) {
        var effRate = ((bestRegime.roundedTax / grossIncome) * 100).toFixed(1);
        insights.push({
            id: 'eff_rate', type: 'info',
            title: 'Your Effective Tax Rate: ' + effRate + '%',
            detail: 'This is the actual percentage of your gross income going to tax. There may be room to optimise this further with professional guidance.',
            impact: 0, priority: 'low'
        });
    }

    // 3. REBATE u/s 87A
    if (bestRegime.rebate > 0) {
        var rebateDetail = 'You qualify for a rebate of ' + fmtR(bestRegime.rebate) + ' under Section 87A, reducing your tax liability significantly.';
        // CG + rebate conflict check
        var hasCG = (parseFloat(inputs.stcgEquity) || 0) + (parseFloat(inputs.ltcgEquity) || 0) + (parseFloat(inputs.ltcgOther) || 0);
        if (hasCG > 0) {
            rebateDetail += ' However, capital gains taxed at special rates are not covered by this rebate and may still attract tax.';
        }
        insights.push({
            id: 'rebate_87a', type: hasCG > 0 ? 'risk' : 'good',
            title: hasCG > 0 ? 'Rebate Applied — But Capital Gains May Still Attract Tax' : 'Tax Rebate u/s 87A Applied',
            detail: rebateDetail,
            impact: 0, priority: hasCG > 0 ? 'high' : 'low'
        });
    }

    // ═══════════════════════════════════════
    // CATEGORY B: WHAT-IF ANALYSIS
    // ═══════════════════════════════════════

    var sec80C = parseFloat(inputs.sec80C) || 0;
    var sec80CCD1B = parseFloat(inputs.sec80CCD1B) || 0;
    var hiSelf = parseFloat(inputs.healthInsSelf) || 0;
    var hiParents = parseFloat(inputs.healthInsParents) || 0;
    var hraRec = parseFloat(inputs.hra) || 0;
    var rentP = parseFloat(inputs.rentPaid) || 0;
    var empNPS = parseFloat(inputs.employerNPS) || 0;
    var interestInc = parseFloat(inputs.interestIncome) || 0;
    var sec80TTA = parseFloat(inputs.sec80TTA) || 0;
    var homeLoanSOP = parseFloat(inputs.homeLoanSOP) || 0;
    var sec80E = parseFloat(inputs.sec80E) || 0;
    var sec80G = parseFloat(inputs.sec80G) || 0;

    // 4. 80C WHAT-IF
    if (sec80C < TAX.LIMIT_80C) {
        var gap80C = TAX.LIMIT_80C - sec80C;
        var saving80C = whatIf({ sec80C: String(TAX.LIMIT_80C) });
        var savingOld80C = whatIfOld({ sec80C: String(TAX.LIMIT_80C) });
        if (saving80C > 0) {
            insights.push({
                id: '80c_gap', type: 'opportunity',
                title: 'Section 80C — Save ' + fmtR(saving80C) + ' More',
                detail: 'You have used ' + fmtR(sec80C) + ' of ' + fmtR(TAX.LIMIT_80C) + ' limit. Investing ' + fmtR(gap80C) + ' more can reduce your tax. Speak to our CA to find the right instrument for your risk profile.',
                impact: saving80C, priority: saving80C > 10000 ? 'high' : 'medium'
            });
        } else if (savingOld80C > 0 && isNewBetter) {
            insights.push({
                id: '80c_dead', type: 'risk',
                title: 'Section 80C — Review Needed',
                detail: 'Additional 80C investment of ' + fmtR(gap80C) + ' would save ' + fmtR(savingOld80C) + ' under Old Regime, but New Regime is already ' + fmtR(result.absSavings) + ' cheaper. Evaluate as a financial product, not just a tax tool. Our advisors can help you decide.',
                impact: 0, priority: 'medium'
            });
        }
    } else {
        // 5. 80C MAXED
        insights.push({
            id: '80c_maxed', type: 'good',
            title: 'Section 80C Fully Utilised',
            detail: 'You have maximised your 80C limit of ' + fmtR(TAX.LIMIT_80C) + '.' + (isNewBetter ? ' Under your recommended New Regime, this does not reduce tax but remains a good financial habit.' : ' This is actively saving you tax under Old Regime.'),
            impact: 0, priority: 'low'
        });
    }

    // 6. NPS 80CCD(1B) WHAT-IF
    if (sec80CCD1B < TAX.LIMIT_80CCD1B) {
        var gapNPS = TAX.LIMIT_80CCD1B - sec80CCD1B;
        var savingNPS = whatIf({ sec80CCD1B: String(TAX.LIMIT_80CCD1B) });
        var savingNPSOld = whatIfOld({ sec80CCD1B: String(TAX.LIMIT_80CCD1B) });
        if (savingNPS > 0) {
            insights.push({
                id: 'nps_gap', type: 'opportunity',
                title: 'NPS (80CCD1B) — Save ' + fmtR(savingNPS) + ' More',
                detail: 'Investing ' + fmtR(gapNPS) + ' in NPS gives an additional deduction under Old Regime. NPS also builds your retirement corpus.',
                impact: savingNPS, priority: savingNPS > 10000 ? 'high' : 'medium'
            });
        } else if (savingNPSOld > 0 && isNewBetter) {
            insights.push({
                id: 'nps_dead', type: 'info',
                title: 'NPS (80CCD1B) — No Tax Benefit Under New Regime',
                detail: 'Self NPS contribution of ' + fmtR(gapNPS) + ' would save ' + fmtR(savingNPSOld) + ' only under Old Regime. However, NPS offers retirement benefits beyond tax savings.',
                impact: 0, priority: 'low'
            });
        }
    }

    // 7. HEALTH INSURANCE SELF (80D)
    if (hiSelf === 0) {
        var savingHI = whatIf({ healthInsSelf: '25000' });
        if (savingHI > 0) {
            insights.push({
                id: '80d_self', type: 'opportunity',
                title: 'Health Insurance — Save ' + fmtR(savingHI) + ' + Protect Your Family',
                detail: 'A health insurance premium of Rs. 25,000 gives you tax savings and essential financial protection. This is both a tax benefit and a safety net.',
                impact: savingHI, priority: 'high'
            });
        } else {
            insights.push({
                id: '80d_self_dead', type: 'info',
                title: 'Health Insurance — No Tax Benefit Under Current Regime',
                detail: 'Health insurance premium does not reduce tax under New Regime, but it remains essential for financial protection. Do not skip it.',
                impact: 0, priority: 'low'
            });
        }
    }

    // 8. HEALTH INSURANCE PARENTS (80D)
    if (hiSelf > 0 && hiParents === 0) {
        var savingHIP = whatIf({ healthInsParents: '25000' });
        if (savingHIP > 0) {
            insights.push({
                id: '80d_parents', type: 'opportunity',
                title: 'Parents Health Insurance — Additional ' + fmtR(savingHIP) + ' Saving',
                detail: 'Paying health insurance for parents gives a separate deduction up to Rs. 25,000 (Rs. 50,000 if senior). Covers your parents and saves tax.',
                impact: savingHIP, priority: 'medium'
            });
        }
    }

    // 9. 80TTA/TTB
    if (interestInc > 0 && sec80TTA === 0) {
        var ttaLimit = (inputs.ageCategory === 'senior' || inputs.ageCategory === 'superSenior') ? TAX.LIMIT_80TTB : TAX.LIMIT_80TTA;
        var savingTTA = whatIf({ sec80TTA: String(Math.min(interestInc, ttaLimit)) });
        if (savingTTA > 0) {
            insights.push({
                id: '80tta', type: 'opportunity',
                title: 'Savings Interest Deduction — Save ' + fmtR(savingTTA),
                detail: 'Your interest income of ' + fmtR(interestInc) + ' qualifies for deduction up to ' + fmtR(ttaLimit) + ' under Section 80TTA/TTB.',
                impact: savingTTA, priority: 'medium'
            });
        }
    }

    // 10. 80E EDUCATION LOAN
    if (sec80E > 0) {
        insights.push({
            id: '80e_claimed', type: 'good',
            title: 'Education Loan Interest Deduction Claimed',
            detail: 'You have claimed ' + fmtR(sec80E) + ' as education loan interest. This deduction has no upper limit. Keep your lender certificate ready for filing.',
            impact: 0, priority: 'low'
        });
    }

    // 11. 80G DONATIONS
    if (sec80G > 0) {
        insights.push({
            id: '80g_claimed', type: 'good',
            title: 'Section 80G Donation Deduction Active',
            detail: 'Your donation qualifies for deduction. Ensure you have the donation receipt. Note: cash donations above Rs. 2,000 are not deductible.',
            impact: 0, priority: 'low'
        });
    }

    // 12. HRA WHAT-IF
    if (hraRec > 0 && rentP === 0 && isOldBetter) {
        var savingHRA = whatIf({ rentPaid: String(Math.round(hraRec * 0.8)) });
        if (savingHRA > 0) {
            insights.push({
                id: 'hra_unclaimed', type: 'opportunity',
                title: 'HRA Exemption — Save Up to ' + fmtR(savingHRA),
                detail: 'You receive HRA of ' + fmtR(hraRec) + ' but have not declared rent. If you pay rent, this exemption can significantly reduce your tax under Old Regime.',
                impact: savingHRA, priority: 'high'
            });
        }
    } else if (hraRec > 0 && rentP === 0 && isNewBetter) {
        insights.push({
            id: 'hra_new', type: 'info',
            title: 'HRA Exemption — Not Applicable Under New Regime',
            detail: 'HRA exemption is an Old Regime benefit. Under your recommended New Regime, rent payments do not reduce tax.',
            impact: 0, priority: 'low'
        });
    }

    // ═══════════════════════════════════════
    // CATEGORY C: BOTH REGIMES
    // ═══════════════════════════════════════

    // 13. EMPLOYER NPS 80CCD(2) — works in BOTH regimes
    if (empNPS === 0) {
        var basicDA = (parseFloat(inputs.basicSalary) || 0) + (parseFloat(inputs.da) || 0);
        var potentialNPS = Math.round(basicDA * 0.10);
        if (potentialNPS > 0) {
            var savingEmpNPS = whatIf({ employerNPS: String(potentialNPS) });
            if (savingEmpNPS > 0) {
                insights.push({
                    id: 'emp_nps', type: 'opportunity',
                    title: 'Employer NPS — Save ' + fmtR(savingEmpNPS) + ' (Works in Both Regimes)',
                    detail: 'If your employer contributes to NPS, up to ' + fmtR(potentialNPS) + ' is tax-free under BOTH Old and New Regime. Talk to your HR department.',
                    impact: savingEmpNPS, priority: 'high'
                });
            }
        }
    } else {
        insights.push({
            id: 'emp_nps_good', type: 'good',
            title: 'Employer NPS Contribution Active',
            detail: 'Your employer contributes ' + fmtR(empNPS) + ' to NPS. This is one of the best tax benefits — available under both regimes.',
            impact: 0, priority: 'low'
        });
    }

    // 14. HOME LOAN
    if (homeLoanSOP > 0) {
        insights.push({
            id: 'home_loan', type: 'good',
            title: 'Home Loan Interest Deduction Claimed',
            detail: 'You have claimed ' + fmtR(homeLoanSOP) + ' as home loan interest on self-occupied property.',
            impact: 0, priority: 'low'
        });
    }

    // ═══════════════════════════════════════
    // CATEGORY D: RISK ALERTS
    // ═══════════════════════════════════════

    // 15. LTCG > EXEMPTION
    var ltcgEq = parseFloat(inputs.ltcgEquity) || 0;
    if (ltcgEq > TAX.CG_LTCG_EQUITY_EXEMPT) {
        var ltcgTax = Math.round((ltcgEq - TAX.CG_LTCG_EQUITY_EXEMPT) * TAX.CG_LTCG_EQUITY_RATE);
        insights.push({
            id: 'ltcg_breach', type: 'risk',
            title: 'Capital Gains Exceed Exemption Limit',
            detail: 'Your LTCG of ' + fmtR(ltcgEq) + ' exceeds the ' + fmtR(TAX.CG_LTCG_EQUITY_EXEMPT) + ' exemption. Approximately ' + fmtR(ltcgTax) + ' in tax applies at 12.5%. Capital gains need careful reporting — incorrect filing can trigger scrutiny.',
            impact: ltcgTax, priority: 'high'
        });
    }

    // 16. SURCHARGE ZONE
    var totalTaxable = bestRegime.taxableTotal || 0;
    if (totalTaxable > 4500000 && totalTaxable < 5500000) {
        insights.push({
            id: 'surcharge_zone', type: 'risk',
            title: 'Income Near Surcharge Threshold',
            detail: 'Your income is near Rs. 50 lakh. Crossing this threshold triggers 10% surcharge on tax. Small changes can significantly increase your tax. Professional planning recommended.',
            impact: 0, priority: 'high'
        });
    }

    // 17. RENT DOCUMENTATION RISK
    if (hraRec > 0 && rentP > 100000 && isOldBetter) {
        insights.push({
            id: 'rent_risk', type: 'risk',
            title: 'Rent Documentation Required',
            detail: 'Your annual rent exceeds Rs. 1 lakh. You must maintain rent receipts, agreement, and landlord PAN. Claiming HRA without proper documentation can result in the entire exemption being denied during assessment. We verify all documents before filing.',
            impact: 0, priority: 'high'
        });
    }

    // 18. ADVANCE TAX RISK
    var nonSalaryIncome = interestInc + (parseFloat(inputs.otherIncome) || 0) +
        (parseFloat(inputs.stcgEquity) || 0) + (parseFloat(inputs.ltcgEquity) || 0) +
        (parseFloat(inputs.ltcgOther) || 0) + (parseFloat(inputs.stcgOther) || 0);
    var isSenior = inputs.ageCategory === 'senior' || inputs.ageCategory === 'superSenior';
    if (nonSalaryIncome > 50000 && bestRegime.roundedTax > 10000 && !(isSenior && !isBusiness)) {
        insights.push({
            id: 'advance_tax', type: 'risk',
            title: 'Advance Tax May Be Required',
            detail: 'Your non-salary income of ' + fmtR(nonSalaryIncome) + ' may require advance tax payments if estimated tax exceeds Rs. 10,000 after TDS. Missing deadlines attracts interest under Section 234B and 234C.',
            impact: 0, priority: 'medium'
        });
    }

    // 19. CG + REBATE CONFLICT (FY 2025-26 specific)
    var totalCG = (parseFloat(inputs.stcgEquity) || 0) + (parseFloat(inputs.ltcgEquity) || 0) + (parseFloat(inputs.ltcgOther) || 0);
    if (totalCG > 0 && bestRegime.rebate > 0) {
        insights.push({
            id: 'cg_rebate', type: 'risk',
            title: 'Capital Gains May Not Be Covered by Rebate',
            detail: 'Your rebate reduces tax on regular income, but capital gains taxed at special rates may still attract tax. This is a common filing mistake — our team ensures correct computation.',
            impact: 0, priority: 'high'
        });
    }

    // 20. DOCUMENTATION RISK (always show if deductions claimed)
    var totalDed = sec80C + sec80CCD1B + hiSelf + hiParents + sec80E + sec80G + (parseFloat(inputs.sec80TTA) || 0);
    if (totalDed > 0 && isOldBetter) {
        insights.push({
            id: 'doc_risk', type: 'risk',
            title: 'Ensure Your Deduction Claims Are Supported',
            detail: 'You have claimed ' + fmtR(totalDed) + ' in deductions. Incorrect or unsupported claims can lead to notices under Section 143(1) or trigger scrutiny. Our CA team verifies every claim before submission.',
            impact: 0, priority: 'medium'
        });
    }

    // ═══════════════════════════════════════
    // SCORING — Simple, not frightening, but creates mild concern
    // ═══════════════════════════════════════
    var rawScore = 55; // Neutral base

    // Regime decision (15 pts max)
    if (result.savings !== 0) {
        rawScore += result.absSavings > 25000 ? 12 : result.absSavings > 5000 ? 8 : 4;
    }

    // Tax efficiency — based on missed savings vs income (25 pts max)
    var missedSavings = insights.filter(function(i) { return i.type === 'opportunity'; })
        .reduce(function(s, i) { return s + (i.impact || 0); }, 0);
    if (grossIncome > 0) {
        var missedPct = (missedSavings / grossIncome) * 100;
        if (missedPct < 0.5) rawScore += 25;
        else if (missedPct < 2) rawScore += 18;
        else if (missedPct < 5) rawScore += 10;
        else if (missedPct < 10) rawScore += 4;
        // else +0
    } else {
        rawScore += 12; // no income data, neutral
    }

    // Positive actions (15 pts max)
    var goodCount = insights.filter(function(i) { return i.type === 'good'; }).length;
    rawScore += Math.min(goodCount * 5, 15);

    // Risk flags — deduct directly from total (no cap!)
    insights.forEach(function(i) {
        if (i.type === 'risk') {
            rawScore -= i.priority === 'high' ? 8 : i.priority === 'medium' ? 5 : 3;
        }
    });

    var score = Math.max(25, Math.min(92, rawScore));

    var band;
    if (score <= 40) band = 'Needs Improvement';
    else if (score <= 60) band = 'Needs Attention';
    else if (score <= 80) band = 'Good';
    else band = 'Excellent';

    // Sort: risks first, then opportunities (by impact desc), then info, then good
    var typeOrder = { risk: 0, opportunity: 1, info: 2, good: 3 };
    insights.sort(function(a, b) {
        if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
        return (b.impact || 0) - (a.impact || 0);
    });

    var totalPotentialSavings = insights
        .filter(function(i) { return i.type === 'opportunity'; })
        .reduce(function(sum, i) { return sum + (i.impact || 0); }, 0);

    return {
        insights: insights,
        score: score,
        band: band,
        totalPotentialSavings: totalPotentialSavings,
        effectiveTaxRate: grossIncome > 0 ? ((bestRegime.roundedTax / grossIncome) * 100).toFixed(1) : '0',
        missedSavings: missedSavings,
        counts: {
            risk: insights.filter(function(i) { return i.type === 'risk'; }).length,
            opportunity: insights.filter(function(i) { return i.type === 'opportunity'; }).length,
            good: insights.filter(function(i) { return i.type === 'good'; }).length,
            info: insights.filter(function(i) { return i.type === 'info'; }).length,
            total: insights.length
        }
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateInsights };
}
