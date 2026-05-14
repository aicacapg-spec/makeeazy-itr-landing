/**
 * MakeEazy Tax Engine — FY 2025-26 (AY 2026-27)
 * Extracted from calculator v12.1 (CA-audited)
 * Pure computation — no DOM dependency
 */

// ===================== CONSTANTS =====================
const TAX = {
    // Old regime slabs by age
    OLD_SLABS: {
        regular: [{l:250000,r:0},{l:500000,r:0.05},{l:1000000,r:0.20},{l:Infinity,r:0.30}],
        senior:  [{l:300000,r:0},{l:500000,r:0.05},{l:1000000,r:0.20},{l:Infinity,r:0.30}],
        superSenior:[{l:500000,r:0},{l:1000000,r:0.20},{l:Infinity,r:0.30}]
    },
    // New regime slabs (FY 2025-26, Budget 2025)
    NEW_SLABS: [
        {l:400000,r:0},{l:800000,r:0.05},{l:1200000,r:0.10},{l:1600000,r:0.15},
        {l:2000000,r:0.20},{l:2400000,r:0.25},{l:Infinity,r:0.30}
    ],
    // Exemption limits
    EXEMPT_OLD: {regular:250000, senior:300000, superSenior:500000},
    EXEMPT_NEW: 400000,
    // Rebate 87A
    REBATE_OLD_LIMIT: 500000,
    REBATE_OLD_MAX: 12500,
    REBATE_NEW_LIMIT: 1200000,
    REBATE_NEW_MAX: 60000,
    // Standard deduction
    STD_DED_OLD: 50000,
    STD_DED_NEW: 75000,
    // Section limits
    LIMIT_80C: 150000,
    LIMIT_80CCD1B: 50000,
    LIMIT_80D_REGULAR: 25000,
    LIMIT_80D_SENIOR: 50000,
    LIMIT_PREVENTIVE: 5000,
    LIMIT_80TTA: 10000,
    LIMIT_80TTB: 50000,
    LIMIT_80DDB_REGULAR: 40000,
    LIMIT_80DDB_SENIOR: 100000,
    LIMIT_80GG_MONTHLY: 5000,
    LIMIT_SOP_INTEREST: 200000,
    LIMIT_HP_LOSS_SETOFF: 200000,
    LIMIT_GRATUITY: 2000000,
    LIMIT_LEAVE_ENCASH: 2500000,
    LIMIT_PROF_TAX: 2500,
    LIMIT_FAMILY_PENSION_OLD: 15000,
    LIMIT_FAMILY_PENSION_NEW: 25000,
    // Employer NPS caps (% of basic+DA)
    NPS_CAP_GOVT: 0.14,
    NPS_CAP_PRIVATE: 0.14, // Budget 2025: harmonized to 14% for all employers
    // Capital gains
    CG_STCG_EQUITY_RATE: 0.20,   // 111A
    CG_LTCG_EQUITY_RATE: 0.125,  // 112A
    CG_LTCG_OTHER_RATE: 0.125,   // 112
    CG_LTCG_EQUITY_EXEMPT: 125000, // ₹1.25L exempt
    // Surcharge thresholds
    SURCHARGE_OLD: [
        {limit:5000000, rate:0}, {limit:10000000, rate:0.10},
        {limit:20000000, rate:0.15}, {limit:50000000, rate:0.25},
        {limit:Infinity, rate:0.37}
    ],
    SURCHARGE_NEW: [
        {limit:5000000, rate:0}, {limit:10000000, rate:0.10},
        {limit:20000000, rate:0.15}, {limit:Infinity, rate:0.25}
    ],
    CESS_RATE: 0.04
};

// ===================== HELPER FUNCTIONS =====================
function v(val) { return Math.max(0, parseFloat(val) || 0); }
function fmt(n) { return '₹' + Math.round(n).toLocaleString('en-IN'); }
function round10(n) { return Math.round(n / 10) * 10; } // Sec 288B

// Slab tax engine
function calcSlabTax(income, slabs) {
    let tax = 0, prev = 0;
    const breakdown = [];
    for (const slab of slabs) {
        if (income <= prev) break;
        const taxable = Math.min(income, slab.l) - prev;
        const t = taxable * slab.r;
        tax += t;
        if (taxable > 0) {
            breakdown.push({from: prev, to: Math.min(income, slab.l), rate: slab.r, tax: t});
        }
        prev = slab.l;
    }
    return {tax, breakdown};
}

// Surcharge rate for given total income
function getSurchargeRate(totalIncome, brackets) {
    for (const b of brackets) {
        if (totalIncome <= b.limit) return b.rate;
    }
    return brackets[brackets.length - 1].rate;
}

// ===================== MAIN COMPUTATION =====================
/**
 * Compute tax for both regimes from a flat inputs object.
 * @param {Object} inp - All income/deduction fields
 * @returns {Object} { old, new, savings, recommendation, regimeLabel, inputSummary }
 */
function computeTax(inp) {
    const age       = inp.ageCategory || 'regular';
    const cityType  = inp.cityType || 'metro';
    const employerType = inp.employerType || 'private';
    const residentialStatus = inp.residentialStatus || 'ROR';

    // ---- SALARY COMPUTATION ----
    const basic          = v(inp.basicSalary);
    const da             = v(inp.da);
    const hraReceived    = v(inp.hra);
    const rentPaid       = v(inp.rentPaid);
    const ltaExempt      = v(inp.lta);
    const specialAllow   = v(inp.specialAllowance);
    const gratuityExempt = Math.min(v(inp.gratuityExempt), TAX.LIMIT_GRATUITY);
    const leaveExempt    = Math.min(v(inp.leaveEncashExempt), TAX.LIMIT_LEAVE_ENCASH);
    const profTax        = Math.min(v(inp.profTax), TAX.LIMIT_PROF_TAX);
    const employerNPS    = v(inp.employerNPS);

    // Employer NPS cap
    const salaryForNPS = basic + da;
    const npsCap = employerType === 'government' ? TAX.NPS_CAP_GOVT : TAX.NPS_CAP_PRIVATE;
    const validEmployerNPS = Math.min(employerNPS, salaryForNPS * npsCap);

    // HRA Exemption (Old regime only)
    const salaryForHRA = basic + da;
    let hraExempt = 0;
    if (hraReceived > 0 && rentPaid > 0) {
        const metroPercent = cityType === 'metro' ? 0.50 : 0.40;
        hraExempt = Math.max(0, Math.min(
            hraReceived,
            salaryForHRA * metroPercent,
            Math.max(0, rentPaid - salaryForHRA * 0.10)
        ));
    }

    // Gross Salary
    const grossSalary = basic + da + hraReceived + ltaExempt + specialAllow;

    // Net Salary under each regime
    const salaryIncomeOld = grossSalary - hraExempt - ltaExempt - profTax - TAX.STD_DED_OLD;
    const salaryIncomeNew = grossSalary - TAX.STD_DED_NEW;

    // ---- OTHER INCOME ----
    const interestIncome = v(inp.interestIncome);
    const otherIncome    = v(inp.otherIncome);
    const agriIncome     = v(inp.agriIncome);

    // ---- HOUSE PROPERTY ----
    const hasSOP         = inp.hasSOP === 'yes' || inp.hasSOP === true;
    const homeLoanSOP    = v(inp.homeLoanSOP);
    const letOutRent     = v(inp.letOutRent);
    const municipalTax   = v(inp.municipalTax);
    const homeLoanLetOut = v(inp.homeLoanLetOut);

    const sopLoss = hasSOP ? -Math.min(homeLoanSOP, TAX.LIMIT_SOP_INTEREST) : 0;
    const nav = Math.max(0, letOutRent - municipalTax);
    const stdDedHP = nav * 0.30;
    const letOutIncome = nav - stdDedHP - homeLoanLetOut;
    const housePropertyIncome = sopLoss + letOutIncome;
    const hpForSetOff = Math.max(-TAX.LIMIT_HP_LOSS_SETOFF, housePropertyIncome);

    // ---- CAPITAL GAINS ----
    const stcgEquity = v(inp.stcgEquity);
    const stcgOther  = v(inp.stcgOther);
    const ltcgEquity = v(inp.ltcgEquity);
    const ltcgOther  = v(inp.ltcgOther);
    const ltcgEquityTaxable = Math.max(0, ltcgEquity - TAX.CG_LTCG_EQUITY_EXEMPT);

    // ---- BUSINESS INCOME ----
    const bizType = inp.businessType || 'none';
    let businessIncome = 0;
    if (bizType !== 'none') {
        const turnover = v(inp.businessTurnover);
        let rate;
        const rateSelect = inp.presumptiveRate || '8';
        if (rateSelect === 'custom') {
            rate = Math.max(bizType === '44ADA' ? 50 : 8, v(inp.customRate));
        } else {
            rate = parseFloat(rateSelect);
        }
        businessIncome = turnover * rate / 100;
    }

    // ---- DEDUCTIONS (OLD REGIME) ----
    const sec80C     = Math.min(v(inp.sec80C), TAX.LIMIT_80C);
    const sec80CCD1B = Math.min(v(inp.sec80CCD1B), TAX.LIMIT_80CCD1B);

    const selfSenior   = inp.selfSenior80D === 'yes' || inp.selfSenior80D === true;
    const parentsSenior = inp.parentsSenior80D === 'yes' || inp.parentsSenior80D === true;
    const maxSelfLimit   = selfSenior ? TAX.LIMIT_80D_SENIOR : TAX.LIMIT_80D_REGULAR;
    const maxParentsLimit = parentsSenior ? TAX.LIMIT_80D_SENIOR : TAX.LIMIT_80D_REGULAR;

    const hiSelf     = v(inp.healthInsSelf);
    const pcSelf     = Math.min(v(inp.preventiveSelf), TAX.LIMIT_PREVENTIVE);
    const hiParents  = v(inp.healthInsParents);
    const pcParents  = Math.min(v(inp.preventiveParents), TAX.LIMIT_PREVENTIVE);
    const medExpSr   = v(inp.medExpSenior);

    const total80DSelf    = Math.min(hiSelf + pcSelf, maxSelfLimit);
    const total80DParents = Math.min(hiParents + pcParents + (parentsSenior ? medExpSr : 0), maxParentsLimit);
    const total80D        = total80DSelf + total80DParents;

    const sec80E  = v(inp.sec80E);
    const donationType = inp.donationType || '100';
    const donationAmt  = v(inp.sec80G);
    const sec80G  = donationType === '100' ? donationAmt : donationAmt * 0.50;
    const sec80GGRent = v(inp.sec80GG);
    const sec80TTA_val = v(inp.sec80TTA);
    const ttaLimit = (age === 'senior' || age === 'superSenior') ? TAX.LIMIT_80TTB : TAX.LIMIT_80TTA;
    const sec80TTA = Math.min(sec80TTA_val, ttaLimit);
    const sec80DD  = parseFloat(inp.sec80DD || '0');
    const sec80U   = parseFloat(inp.sec80U || '0');
    const sec80DDB_val = v(inp.sec80DDB);
    const ddbLimit = (age === 'senior' || age === 'superSenior') ? TAX.LIMIT_80DDB_SENIOR : TAX.LIMIT_80DDB_REGULAR;
    const sec80DDB = Math.min(sec80DDB_val, ddbLimit);
    const famPension = v(inp.familyPension);

    // ========== COMPUTE FOR BOTH REGIMES ==========
    function computeRegime(isOld) {
        const label = isOld ? 'Old' : 'New';
        const slabs = isOld ? TAX.OLD_SLABS[age] : TAX.NEW_SLABS;
        const surchargeSlabs = isOld ? TAX.SURCHARGE_OLD : TAX.SURCHARGE_NEW;

        const salaryIncome = isOld ? Math.max(0, salaryIncomeOld) : Math.max(0, salaryIncomeNew);
        const hpIncome = isOld ? hpForSetOff : Math.max(0, letOutIncome);

        const famPensionCap = isOld ? TAX.LIMIT_FAMILY_PENSION_OLD : TAX.LIMIT_FAMILY_PENSION_NEW;
        const famPensionDeduction = Math.min(famPension / 3, famPensionCap);

        const normalIncome = salaryIncome + interestIncome + otherIncome + hpIncome + businessIncome + stcgOther + famPension;

        // Deductions
        let totalDeductions = 0;
        if (isOld) {
            let gg80 = 0;
            if (sec80GGRent > 0 && hraReceived === 0) {
                const ati = Math.max(0, normalIncome - sec80C - sec80CCD1B);
                gg80 = Math.min(TAX.LIMIT_80GG_MONTHLY * 12, ati * 0.25, Math.max(0, sec80GGRent - ati * 0.10));
            }
            totalDeductions = sec80C + sec80CCD1B + total80D + sec80E + sec80G + gg80 + sec80TTA + sec80DD + sec80U + sec80DDB + validEmployerNPS + famPensionDeduction;
        } else {
            totalDeductions = validEmployerNPS + famPensionDeduction;
        }

        totalDeductions = Math.min(totalDeductions, Math.max(0, normalIncome));
        const taxableNormal = Math.max(0, normalIncome - totalDeductions);
        const totalTaxableIncome = taxableNormal + stcgEquity + ltcgEquityTaxable + ltcgOther;

        // ---- TAX ON NORMAL INCOME ----
        let normalTaxResult = calcSlabTax(taxableNormal, slabs);
        let normalTax = normalTaxResult.tax;

        // ---- AGRICULTURAL INCOME PARTIAL INTEGRATION (Old Regime Only) ----
        let agriTaxAdjustment = 0;
        if (isOld && agriIncome > 5000 && taxableNormal > TAX.EXEMPT_OLD[age]) {
            const taxWithAgri = calcSlabTax(taxableNormal + agriIncome, slabs).tax;
            const taxOnAgriExempt = calcSlabTax(TAX.EXEMPT_OLD[age] + agriIncome, slabs).tax;
            normalTax = taxWithAgri - taxOnAgriExempt;
            agriTaxAdjustment = normalTax - normalTaxResult.tax;
        }

        // ---- REBATE u/s 87A ----
        let rebate = 0;
        const isResident = (residentialStatus === 'ROR' || residentialStatus === 'RNOR');

        if (isResident) {
            if (isOld) {
                if (totalTaxableIncome <= TAX.REBATE_OLD_LIMIT) {
                    rebate = Math.min(normalTax, TAX.REBATE_OLD_MAX);
                }
            } else {
                if (totalTaxableIncome <= TAX.REBATE_NEW_LIMIT) {
                    rebate = Math.min(normalTax, TAX.REBATE_NEW_MAX);
                } else {
                    const taxAtLimit = calcSlabTax(TAX.REBATE_NEW_LIMIT, TAX.NEW_SLABS).tax;
                    const breakEven = TAX.REBATE_NEW_LIMIT + taxAtLimit;
                    if (totalTaxableIncome <= breakEven) {
                        const marginalTax = totalTaxableIncome - TAX.REBATE_NEW_LIMIT;
                        if (normalTax > marginalTax) {
                            rebate = normalTax - marginalTax;
                        }
                    }
                }
            }
        }

        const normalTaxAfterRebate = Math.max(0, normalTax - rebate);

        // ---- TAX ON CAPITAL GAINS (Special Rates) ----
        const taxSTCGEquity = stcgEquity * TAX.CG_STCG_EQUITY_RATE;
        const taxLTCGEquity = ltcgEquityTaxable * TAX.CG_LTCG_EQUITY_RATE;
        const taxLTCGOther  = ltcgOther * TAX.CG_LTCG_OTHER_RATE;
        const totalCGTax    = taxSTCGEquity + taxLTCGEquity + taxLTCGOther;
        const totalTaxBeforeSurcharge = normalTaxAfterRebate + totalCGTax;

        // ---- SURCHARGE ----
        const baseSurchargeRate = getSurchargeRate(totalTaxableIncome, surchargeSlabs);
        const surchargeNormal   = normalTaxAfterRebate * baseSurchargeRate;
        const cgSurchargeRate   = Math.min(baseSurchargeRate, 0.15);
        const surchargeSTCGEquity = taxSTCGEquity * cgSurchargeRate;
        const surchargeLTCGEquity = taxLTCGEquity * cgSurchargeRate;
        const surchargeLTCGOther  = taxLTCGOther * cgSurchargeRate;
        const totalSurcharge = surchargeNormal + surchargeSTCGEquity + surchargeLTCGEquity + surchargeLTCGOther;

        // ---- MARGINAL RELIEF ON SURCHARGE ----
        let marginalRelief = 0;
        if (totalSurcharge > 0) {
            for (let i = 1; i < surchargeSlabs.length; i++) {
                const threshold = surchargeSlabs[i-1].limit;
                const prevRate  = surchargeSlabs[i-1].rate;
                const currRate  = surchargeSlabs[i].rate;

                if (totalTaxableIncome > threshold && currRate > prevRate) {
                    const cgTotal = stcgEquity + ltcgEquityTaxable + ltcgOther;
                    const normalAtThreshold = Math.max(0, threshold - cgTotal);
                    const normalTaxAtThr = calcSlabTax(Math.min(normalAtThreshold, taxableNormal), slabs).tax;

                    let rebateAtThr = 0;
                    const normalTaxableAtThr = Math.min(taxableNormal, normalAtThreshold);
                    if (isOld && normalTaxableAtThr <= TAX.REBATE_OLD_LIMIT) {
                        rebateAtThr = Math.min(normalTaxAtThr, TAX.REBATE_OLD_MAX);
                    } else if (!isOld && normalTaxableAtThr <= TAX.REBATE_NEW_LIMIT) {
                        rebateAtThr = normalTaxAtThr;
                    }
                    const normalTaxAtThrAfterRebate = Math.max(0, normalTaxAtThr - rebateAtThr);

                    const cgTaxAtThr = totalCGTax;
                    const totalTaxAtThr = normalTaxAtThrAfterRebate + cgTaxAtThr;
                    const surchargeAtThr = totalTaxAtThr * prevRate;
                    const totalAtThreshold = totalTaxAtThr + surchargeAtThr;
                    const currentTotal = totalTaxBeforeSurcharge + totalSurcharge;
                    const excessIncome = totalTaxableIncome - threshold;
                    const reliefNeeded = currentTotal - (totalAtThreshold + excessIncome);

                    if (reliefNeeded > 0) {
                        marginalRelief = Math.max(marginalRelief, reliefNeeded);
                    }
                }
            }
        }

        const netSurcharge = Math.max(0, totalSurcharge - marginalRelief);

        // ---- CESS ----
        const cess = (totalTaxBeforeSurcharge + netSurcharge) * TAX.CESS_RATE;

        // ---- TOTAL TAX ----
        const totalTax = totalTaxBeforeSurcharge + netSurcharge + cess;
        const roundedTax = round10(totalTax);

        return {
            label,
            salaryIncome: isOld ? salaryIncomeOld : salaryIncomeNew,
            grossSalary,
            hraExempt: isOld ? hraExempt : 0,
            ltaExempt: isOld ? ltaExempt : 0,
            stdDeduction: isOld ? TAX.STD_DED_OLD : TAX.STD_DED_NEW,
            profTax: isOld ? profTax : 0,
            interestIncome, otherIncome,
            housePropertyIncome: hpIncome,
            businessIncome, stcgOther,
            familyPension: famPension,
            normalIncome: Math.max(0, isOld ? salaryIncomeOld : salaryIncomeNew) + interestIncome + otherIncome + hpIncome + businessIncome + stcgOther + famPension,
            totalDeductions, validEmployerNPS, famPensionDeduction,
            taxableNormal, taxableTotal: totalTaxableIncome,
            agriTaxAdjustment: agriTaxAdjustment || 0,
            stcgEquity, ltcgEquityTaxable, ltcgOther,
            normalTax, rebate, normalTaxAfterRebate,
            taxSTCGEquity, taxLTCGEquity, taxLTCGOther, totalCGTax,
            totalTaxBeforeSurcharge,
            baseSurchargeRate, totalSurcharge, marginalRelief, netSurcharge,
            cess, totalTax, roundedTax,
            slabBreakdown: normalTaxResult.breakdown
        };
    }

    const oldResult = computeRegime(true);
    const newResult = computeRegime(false);

    // ========== COMPARISON ==========
    const savings = oldResult.roundedTax - newResult.roundedTax;
    let recommendation, regimeLabel;
    if (savings > 0) {
        recommendation = 'new';
        regimeLabel = `New Regime saves you ${fmt(savings)}`;
    } else if (savings < 0) {
        recommendation = 'old';
        regimeLabel = `Old Regime saves you ${fmt(-savings)}`;
    } else {
        recommendation = 'same';
        regimeLabel = 'Both regimes result in the same tax liability.';
    }

    return {
        old: oldResult,
        new: newResult,
        savings,           // positive = new is better
        absSavings: Math.abs(savings),
        recommendation,    // 'new' | 'old' | 'same'
        regimeLabel,
        inputSummary: {
            grossSalary, age, cityType, employerType, residentialStatus,
            sec80C, sec80CCD1B, total80D, sec80E, sec80G, sec80TTA,
            hraExempt, validEmployerNPS, businessIncome,
            stcgEquity, ltcgEquity, ltcgOther
        }
    };
}

// ===================== EXPORTS =====================
// Works in both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TAX, computeTax, calcSlabTax, getSurchargeRate, fmt, round10 };
}
