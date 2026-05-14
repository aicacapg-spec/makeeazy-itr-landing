/**
 * MakeEazy Insights Engine
 * Generates real, computed insights using marginal impact analysis.
 * Each insight shows exact ₹ amount by running the tax engine with/without the factor.
 */

// Depends on tax-engine.js being loaded first (computeTax, TAX, fmt)

/**
 * Generate all applicable insights for the given inputs and tax result.
 * @param {Object} inputs - The raw form inputs object
 * @param {Object} result - Output from computeTax(inputs)
 * @returns {Object} { insights: Array, score: Number, band: String, totalSavings: Number }
 */
function generateInsights(inputs, result) {
    const insights = [];
    const rec = result.recommendation; // 'old' | 'new' | 'same'
    const bestRegime = rec === 'old' ? result.old : result.new;

    // 1. REGIME COMPARISON — always first
    if (result.savings !== 0) {
        insights.push({
            id: 'regime',
            type: result.absSavings > 5000 ? 'risk' : 'opportunity',
            title: rec === 'new' ? 'New Regime is better for you' : 'Old Regime is better for you',
            detail: result.regimeLabel + '. ' +
                    (rec === 'new'
                        ? 'Your deduction usage doesn\'t offset the lower New Regime slab rates.'
                        : 'Your deductions under Old Regime reduce your taxable income significantly.'),
            impact: result.absSavings,
            priority: result.absSavings > 20000 ? 'high' : 'medium'
        });
    } else {
        insights.push({
            id: 'regime',
            type: 'good',
            title: 'Both regimes result in the same tax',
            detail: 'Your profile balances out equally under both regimes. You can choose either with no difference.',
            impact: 0,
            priority: 'low'
        });
    }

    // Helper: compute marginal impact of a change
    function marginalImpact(overrides) {
        const modified = { ...inputs, ...overrides };
        const modResult = computeTax(modified);
        const currentBestTax = bestRegime.roundedTax;
        const modBestTax = rec === 'old' ? modResult.old.roundedTax : modResult.new.roundedTax;
        return currentBestTax - modBestTax; // positive = savings from the change
    }

    // 2. 80C GAP
    const current80C = Math.min(parseFloat(inputs.sec80C) || 0, TAX.LIMIT_80C);
    if (current80C < TAX.LIMIT_80C) {
        const gap = TAX.LIMIT_80C - current80C;
        const saving = marginalImpact({ sec80C: TAX.LIMIT_80C });
        if (saving > 0) {
            insights.push({
                id: '80c_gap',
                type: 'opportunity',
                title: '80C Deduction Room Available',
                detail: `You've claimed ${fmt(current80C)} of the ${fmt(TAX.LIMIT_80C)} limit. ` +
                        `Investing ${fmt(gap)} more in PPF, ELSS, or life insurance ` +
                        `could save you ${fmt(saving)} in tax.`,
                impact: saving,
                priority: saving > 10000 ? 'high' : 'medium'
            });
        }
    } else {
        insights.push({
            id: '80c_maxed',
            type: 'good',
            title: 'Section 80C Fully Utilised',
            detail: `You've invested the maximum ${fmt(TAX.LIMIT_80C)} under 80C. Well done.`,
            impact: 0,
            priority: 'low'
        });
    }

    // 3. NPS (80CCD1B) MISSED
    const currentNPS = parseFloat(inputs.sec80CCD1B) || 0;
    if (currentNPS < TAX.LIMIT_80CCD1B) {
        const saving = marginalImpact({ sec80CCD1B: TAX.LIMIT_80CCD1B });
        if (saving > 0) {
            insights.push({
                id: 'nps_missed',
                type: 'opportunity',
                title: 'NPS Investment Can Save More Tax',
                detail: `Investing ${fmt(TAX.LIMIT_80CCD1B - currentNPS)} in NPS under Section 80CCD(1B) ` +
                        `could save you an additional ${fmt(saving)}.`,
                impact: saving,
                priority: saving > 5000 ? 'high' : 'medium'
            });
        }
    }

    // 4. HEALTH INSURANCE (80D) GAP
    const hiSelf    = parseFloat(inputs.healthInsSelf) || 0;
    const hiParents = parseFloat(inputs.healthInsParents) || 0;
    if (hiSelf === 0 && hiParents === 0) {
        const selfLimit = (inputs.selfSenior80D === 'yes') ? TAX.LIMIT_80D_SENIOR : TAX.LIMIT_80D_REGULAR;
        const saving = marginalImpact({ healthInsSelf: selfLimit });
        if (saving > 0) {
            insights.push({
                id: '80d_gap',
                type: 'opportunity',
                title: 'Health Insurance Premium Deduction Available',
                detail: `You haven't claimed any health insurance premium deduction. ` +
                        `Premiums up to ${fmt(selfLimit)} for self/family (and more for parents) ` +
                        `can save you ${fmt(saving)} in tax under Section 80D.`,
                impact: saving,
                priority: 'medium'
            });
        }
    }

    // 5. HRA OPTIMISATION
    const hraRec = parseFloat(inputs.hra) || 0;
    const rentP  = parseFloat(inputs.rentPaid) || 0;
    if (hraRec > 0 && rentP === 0) {
        // Estimate: if they paid rent = 40% of basic+DA
        const estRent = (parseFloat(inputs.basicSalary) || 0) * 0.4 * 12 / 12;
        const saving = marginalImpact({ rentPaid: estRent > 0 ? estRent : hraRec * 0.8 });
        if (saving > 0) {
            insights.push({
                id: 'hra_unclaimed',
                type: 'opportunity',
                title: 'HRA Exemption Not Claimed',
                detail: `You receive HRA of ${fmt(hraRec)} but haven't declared rent paid. ` +
                        `If you pay rent, claiming HRA exemption could save you up to ${fmt(saving)}.`,
                impact: saving,
                priority: 'high'
            });
        }
    }

    // 6. HOME LOAN INTEREST
    const sopInterest = parseFloat(inputs.homeLoanSOP) || 0;
    const hasSOP = inputs.hasSOP === 'yes' || inputs.hasSOP === true;
    if (!hasSOP || sopInterest === 0) {
        const saving = marginalImpact({ hasSOP: 'yes', homeLoanSOP: TAX.LIMIT_SOP_INTEREST });
        if (saving > 0 && saving < 100000) { // sanity check
            insights.push({
                id: 'home_loan',
                type: 'opportunity',
                title: 'Home Loan Interest Deduction',
                detail: `Self-occupied property home loan interest up to ${fmt(TAX.LIMIT_SOP_INTEREST)} ` +
                        `is deductible. If you have a home loan, this could save you ${fmt(saving)}.`,
                impact: saving,
                priority: saving > 20000 ? 'high' : 'medium'
            });
        }
    }

    // 7. 80TTA/TTB NOT CLAIMED
    const interest = parseFloat(inputs.interestIncome) || 0;
    const claimed80TTA = parseFloat(inputs.sec80TTA) || 0;
    const age = inputs.ageCategory || 'regular';
    if (interest > 0 && claimed80TTA === 0) {
        const limit = (age === 'senior' || age === 'superSenior') ? TAX.LIMIT_80TTB : TAX.LIMIT_80TTA;
        const saving = marginalImpact({ sec80TTA: Math.min(interest, limit) });
        if (saving > 0) {
            insights.push({
                id: '80tta_unused',
                type: 'opportunity',
                title: `Section 80TTA${(age === 'senior' || age === 'superSenior') ? '/80TTB' : ''} Available`,
                detail: `You have interest income of ${fmt(interest)} but haven't claimed ` +
                        `the savings account interest deduction up to ${fmt(limit)}. ` +
                        `This could save ${fmt(saving)}.`,
                impact: saving,
                priority: 'low'
            });
        }
    }

    // 8. EMPLOYER NPS BENEFIT
    const empNPS = parseFloat(inputs.employerNPS) || 0;
    const basicSal = parseFloat(inputs.basicSalary) || 0;
    if (empNPS === 0 && basicSal > 0) {
        const potentialNPS = basicSal * 0.14;
        const saving = marginalImpact({ employerNPS: potentialNPS });
        if (saving > 0) {
            insights.push({
                id: 'employer_nps',
                type: 'opportunity',
                title: 'Employer NPS Contribution Benefit',
                detail: `If your employer contributes to NPS (up to 14% of Basic + DA), ` +
                        `it's tax-free in both regimes. This could save you ${fmt(saving)}.`,
                impact: saving,
                priority: 'medium'
            });
        }
    }

    // 9. MULTIPLE FORM 16 RISK
    if (inputs._multipleForm16) {
        insights.push({
            id: 'multi_f16',
            type: 'risk',
            title: 'Multiple Employers Detected',
            detail: 'Having multiple Form 16s means each employer computed TDS independently. ' +
                    'The combined income may fall in a higher slab, resulting in TDS shortfall. ' +
                    'Verify your advance tax requirement.',
            impact: 0,
            priority: 'high'
        });
    }

    // 10. CAPITAL GAINS REVIEW
    const totalCG = (parseFloat(inputs.stcgEquity) || 0) + (parseFloat(inputs.ltcgEquity) || 0) +
                    (parseFloat(inputs.stcgOther) || 0) + (parseFloat(inputs.ltcgOther) || 0);
    if (totalCG > 0) {
        const ltcgEq = parseFloat(inputs.ltcgEquity) || 0;
        if (ltcgEq > TAX.CG_LTCG_EQUITY_EXEMPT) {
            insights.push({
                id: 'ltcg_threshold',
                type: 'risk',
                title: 'LTCG Exceeds Exemption Limit',
                detail: `Your equity LTCG of ${fmt(ltcgEq)} exceeds the ${fmt(TAX.CG_LTCG_EQUITY_EXEMPT)} ` +
                        `exemption. Tax of ${fmt(result.new.taxLTCGEquity)} applies at 12.5%.`,
                impact: result.new.taxLTCGEquity,
                priority: 'medium'
            });
        }
    }

    // 11. SURCHARGE ZONE ALERT
    const taxableIncome = bestRegime.taxableTotal;
    if (taxableIncome > 4500000 && taxableIncome <= 5500000) {
        insights.push({
            id: 'surcharge_zone',
            type: 'risk',
            title: 'Near Surcharge Threshold',
            detail: `Your income is near the ₹50L surcharge threshold. ` +
                    `Small changes in taxable income could trigger 10% surcharge. ` +
                    `Marginal relief may apply.`,
            impact: 0,
            priority: 'medium'
        });
    }

    // 12. STANDARD DEDUCTION (always good)
    insights.push({
        id: 'std_ded',
        type: 'good',
        title: 'Standard Deduction Applied',
        detail: rec === 'new'
            ? `Standard deduction of ${fmt(TAX.STD_DED_NEW)} applied under New Regime.`
            : `Standard deduction of ${fmt(TAX.STD_DED_OLD)} applied under Old Regime.`,
        impact: 0,
        priority: 'low'
    });

    // ========== SCORING ==========
    const weights = { risk: -15, opportunity: -10, good: 10 };
    let rawScore = 70; // base
    for (const i of insights) {
        rawScore += weights[i.type] || 0;
        // High-impact opportunities/risks shift score more
        if (i.priority === 'high') rawScore += (i.type === 'good' ? 5 : -5);
    }
    const score = Math.max(15, Math.min(95, rawScore));

    let band;
    if (score <= 40) band = 'Critical';
    else if (score <= 60) band = 'Needs Attention';
    else if (score <= 80) band = 'Good';
    else band = 'Excellent';

    // Sort: risks first, then opportunities (by impact desc), then good
    const typeOrder = { risk: 0, opportunity: 1, good: 2 };
    insights.sort((a, b) => {
        if (typeOrder[a.type] !== typeOrder[b.type]) return typeOrder[a.type] - typeOrder[b.type];
        return (b.impact || 0) - (a.impact || 0);
    });

    const totalPotentialSavings = insights
        .filter(i => i.type === 'opportunity')
        .reduce((sum, i) => sum + (i.impact || 0), 0);

    return {
        insights,
        score,
        band,
        totalPotentialSavings,
        counts: {
            risk: insights.filter(i => i.type === 'risk').length,
            opportunity: insights.filter(i => i.type === 'opportunity').length,
            good: insights.filter(i => i.type === 'good').length,
            total: insights.length
        }
    };
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { generateInsights };
}
