/**
 * MakeEazy Tax Optimizer — App Controller
 * Handles screen transitions, form parsing, computation, and WhatsApp gate.
 */

// ── State ──
let currentScreen = 1;
let selectedType = '';
let uploadedFiles = [];
let extractedData = {};
let taxResult = null;
let insightResult = null;

// ── Screen Navigation ──
function showScreen(num) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById('screen' + num);
    if (el) el.classList.add('active');
    currentScreen = num;

    // Update steps
    document.querySelectorAll('.step-item').forEach((s, i) => {
        s.classList.remove('active', 'done');
        if (i + 1 < num) s.classList.add('done');
        if (i + 1 === num) s.classList.add('active');
    });

    // Progress
    const pcts = { 1: 5, 2: 25, 3: 50, 4: 75, 5: 100 };
    document.getElementById('progressFill').style.width = (pcts[num] || 5) + '%';

    // Back button
    document.getElementById('backBtn').style.display = num > 1 ? '' : 'none';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function goBack() {
    if (currentScreen === 3 && selectedType === 'salary') showScreen(2);
    else if (currentScreen > 1) showScreen(currentScreen - 1);
}

// ── Screen 1: Type Selection ──
function selectType(type, el) {
    selectedType = type;
    document.querySelectorAll('.type-card').forEach(c => c.classList.remove('selected'));
    el.classList.add('selected');

    setTimeout(() => {
        if (type === 'salary') {
            showScreen(2);
        } else {
            // Non-salary: go straight to calculator form
            if (type === 'business' || type === 'freelancer') {
                expandBusinessSection();
            }
            showScreen(3);
        }
    }, 300);
}

function expandBusinessSection() {
    const header = document.querySelector('#businessSection .calc-section-header');
    const body = document.querySelector('#businessSection .calc-section-body');
    if (header && body) {
        header.classList.remove('collapsed');
        body.classList.remove('collapsed');
    }
    if (selectedType === 'freelancer') {
        const bt = document.getElementById('businessType');
        if (bt) bt.value = '44ADA';
    }
}

// ── Screen 2: File Upload ──
function handleFiles(fileList) {
    for (const file of fileList) {
        if (file.size > 10 * 1024 * 1024) {
            toast('File too large (max 10MB)', 'error');
            continue;
        }
        const ext = file.name.split('.').pop().toLowerCase();
        if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
            toast('Unsupported format. Use PDF, JPG, or PNG.', 'error');
            continue;
        }
        uploadedFiles.push(file);
    }
    renderFileList();
}

function renderFileList() {
    const el = document.getElementById('fileList');
    if (!uploadedFiles.length) { el.innerHTML = ''; document.getElementById('uploadActions').style.display = 'none'; return; }
    document.getElementById('uploadActions').style.display = '';
    el.innerHTML = uploadedFiles.map((f, i) => `
        <div class="file-card">
            <span class="file-icon">${f.name.toLowerCase().endsWith('.pdf') ? '📄' : '🖼️'}</span>
            <div class="file-info">
                <div class="file-name">${f.name}</div>
                <div class="file-meta">${(f.size / 1024).toFixed(0)} KB</div>
            </div>
            <button class="file-remove" onclick="removeFile(${i})">✕</button>
        </div>
    `).join('');
}

function removeFile(i) { uploadedFiles.splice(i, 1); renderFileList(); }
function addMoreFiles() { document.getElementById('fileInput').click(); }
function skipUpload() { showScreen(3); }

// ── Drag & Drop ──
const dz = document.getElementById('uploadZone');
if (dz) {
    dz.addEventListener('dragover', e => { e.preventDefault(); dz.classList.add('dragover'); });
    dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
    dz.addEventListener('drop', e => { e.preventDefault(); dz.classList.remove('dragover'); handleFiles(e.dataTransfer.files); });
}

// ── Form 16 Parsing ──
async function startParsing() {
    if (!uploadedFiles.length) { toast('Upload at least one file', 'error'); return; }
    const btn = document.getElementById('parseBtn');
    btn.disabled = true; btn.textContent = 'Extracting...';

    try {
        extractedData = getEmptyExtractedData();
        let parsedCount = 0;

        for (const file of uploadedFiles) {
            const ext = file.name.split('.').pop().toLowerCase();
            let result;

            if (ext === 'pdf') {
                // Check if encrypted
                try {
                    const text = await extractPdfTextFromFile(file);
                    if (text.length < 50) {
                        result = await parseWithVision(file, ext);
                    } else {
                        result = await parseWithText(text, 'form16');
                    }
                } catch (err) {
                    if (err.message && (err.message.includes('password') || err.message.includes('encrypted'))) {
                        toast('This PDF is password-protected. Please upload an unprotected copy.', 'error');
                        continue;
                    }
                    result = await parseWithVision(file, ext);
                }
            } else {
                result = await parseWithVision(file, ext);
            }

            if (result) {
                mergeIntoExtracted(result);
                parsedCount++;
            }
        }

        if (parsedCount === 0) {
            toast('Could not extract data. Try manual entry.', 'error');
            btn.disabled = false; btn.textContent = 'Extract Data →';
            return;
        }

        if (uploadedFiles.length > 1) extractedData._multipleForm16 = true;

        // Fill calculator form with extracted data
        fillFormFromExtracted();
        showScreen(3);
        document.getElementById('feedbackBanner').style.display = '';
        document.getElementById('extractModal').classList.add('active');

    } catch (err) {
        console.error('Parse error:', err);
        toast('Extraction failed: ' + err.message, 'error');
    }
    btn.disabled = false; btn.textContent = 'Extract Data →';
}

function getEmptyExtractedData() {
    return {
        personalInfo: { name: '', pan: '', employerName: '' },
        salary: { basic: 0, hra: 0, da: 0, specialAllowances: 0, lta: 0, grossSalary: 0, professionalTax: 0 },
        otherIncome: { interestSavings: 0, interestFD: 0, dividend: 0, familyPension: 0 },
        houseProperty: { homeLoanInterestSOP: 0, rentalIncome: 0 },
        capitalGains: { stcgEquity: 0, ltcgEquity: 0, ltcgOther: 0, stcgOther: 0 },
        deductions: { sec80C: 0, sec80CCD1B: 0, sec80D_self: 0, sec80D_parents: 0, sec80E: 0, sec80G: 0, sec80TTA: 0, employerNPS: 0 },
        _multipleForm16: false
    };
}

function mergeIntoExtracted(result) {
    const d = extractedData;
    const n = v => parseFloat(v) || 0;
    if (result.personalInfo) {
        if (result.personalInfo.name) d.personalInfo.name = result.personalInfo.name;
        if (result.personalInfo.pan) d.personalInfo.pan = result.personalInfo.pan;
    }
    if (result.salary) {
        // For multiple Form 16s: ADD salary values
        if (d._multipleForm16 || d.salary.basic > 0) {
            d.salary.basic += n(result.salary.basic);
            d.salary.hra += n(result.salary.hra);
            d.salary.da += n(result.salary.da);
            d.salary.specialAllowances += n(result.salary.specialAllowances);
            d.salary.lta += n(result.salary.lta);
            d.salary.grossSalary += n(result.salary.grossSalary);
            d.salary.professionalTax += n(result.salary.professionalTax);
        } else {
            d.salary.basic = n(result.salary.basic);
            d.salary.hra = n(result.salary.hra);
            d.salary.da = n(result.salary.da);
            d.salary.specialAllowances = n(result.salary.specialAllowances);
            d.salary.lta = n(result.salary.lta);
            d.salary.grossSalary = n(result.salary.grossSalary);
            d.salary.professionalTax = n(result.salary.professionalTax);
        }
    }
    if (result.deductions) {
        d.deductions.sec80C = Math.max(d.deductions.sec80C, n(result.deductions.sec80C));
        d.deductions.sec80CCD1B = Math.max(d.deductions.sec80CCD1B, n(result.deductions.sec80CCD1B));
        d.deductions.sec80D_self = Math.max(d.deductions.sec80D_self, n(result.deductions.sec80D_self));
        d.deductions.sec80D_parents = Math.max(d.deductions.sec80D_parents, n(result.deductions.sec80D_parents));
        d.deductions.employerNPS = Math.max(d.deductions.employerNPS, n(result.deductions.sec80CCD2 || result.deductions.employerNPS));
    }
}

function fillFormFromExtracted() {
    const d = extractedData;
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };

    if (d.personalInfo.name) set('fullName', d.personalInfo.name);
    if (d.personalInfo.pan) set('panNumber', d.personalInfo.pan);
    set('basicSalary', d.salary.basic || d.salary.grossSalary);
    set('da', d.salary.da);
    set('hra', d.salary.hra);
    set('specialAllowance', d.salary.specialAllowances);
    set('lta', d.salary.lta);
    set('profTax', d.salary.professionalTax);
    set('employerNPS', d.deductions.employerNPS);
    set('interestIncome', (d.otherIncome.interestSavings || 0) + (d.otherIncome.interestFD || 0));
    set('sec80C', d.deductions.sec80C);
    set('sec80CCD1B', d.deductions.sec80CCD1B);
    set('healthInsSelf', d.deductions.sec80D_self);
    set('healthInsParents', d.deductions.sec80D_parents);
    set('homeLoanSOP', d.houseProperty.homeLoanInterestSOP);
    set('letOutRent', d.houseProperty.rentalIncome);

    markFilledInputs();
}

// ── PDF Text Extraction (PDF.js) ──
async function extractPdfTextFromFile(file) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
    let text = '';
    for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        text += content.items.map(it => it.str).join(' ') + '\n';
    }
    return text;
}

// ── AI Parsing (Groq — no "AI" shown to user) ──
const _gk = ['Z3NrX1pNSF', 'Y5N1JOVTRR', 'QjBFVFZzWE', '1MV0dkeWIz', 'RlkxMU5SS1', 'BvYmxTZ2w3', 'Y2dCdEZQbV', 'FDVlE='];
function _dk() { try { return atob(_gk.join('')); } catch(e) { return ''; } }

async function parseWithText(text, docType) {
    const prompt = buildForm16Prompt() + '\n\n--- DOCUMENT TEXT ---\n' + text.substring(0, 18000);
    const key = _dk();
    if (!key) { toast('Configuration error', 'error'); return null; }

    console.log('[Parse] Text mode, length:', text.length);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    
    try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.1,
                response_format: { type: 'json_object' }
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!r.ok) { console.error('[Parse] API error:', r.status); throw new Error('Processing failed (' + r.status + ')'); }
        const data = await r.json();
        const txt = data.choices?.[0]?.message?.content;
        if (!txt) return null;
        console.log('[Parse] Text result received');
        try { return JSON.parse(txt); } catch { const m = txt.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; }
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') { console.error('[Parse] Timeout after 30s'); toast('Processing timed out. Try manual entry.', 'error'); }
        else { console.error('[Parse] Error:', err.message); }
        return null;
    }
}

async function parseWithVision(file, ext) {
    const key = _dk();
    if (!key) return null;

    console.log('[Parse] Vision mode for:', file.name);
    let imageContents = [];
    if (ext === 'pdf') {
        const ab = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(ab) }).promise;
        const maxPages = Math.min(pdf.numPages, 3);
        console.log('[Parse] Rendering', maxPages, 'pages');
        for (let i = 1; i <= maxPages; i++) {
            const page = await pdf.getPage(i);
            const vp = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            canvas.width = vp.width; canvas.height = vp.height;
            await page.render({ canvasContext: canvas.getContext('2d'), viewport: vp }).promise;
            const b64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];
            imageContents.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${b64}` } });
            console.log('[Parse] Page', i, 'rendered, b64 length:', b64.length);
        }
    } else {
        const b64 = await fileToBase64(file);
        imageContents.push({ type: 'image_url', image_url: { url: `data:${file.type || 'image/jpeg'};base64,${b64}` } });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    
    try {
        const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
            body: JSON.stringify({
                model: 'meta-llama/llama-4-scout-17b-16e-instruct',
                messages: [{ role: 'user', content: [{ type: 'text', text: buildForm16Prompt() }, ...imageContents] }],
                temperature: 0.1, max_tokens: 4096,
                response_format: { type: 'json_object' }
            }),
            signal: controller.signal
        });
        clearTimeout(timeout);
        if (!r.ok) { console.error('[Parse] Vision API error:', r.status); throw new Error('Processing failed (' + r.status + ')'); }
        const data = await r.json();
        const txt = data.choices?.[0]?.message?.content;
        if (!txt) return null;
        console.log('[Parse] Vision result received');
        try { return JSON.parse(txt); } catch { const m = txt.match(/\{[\s\S]*\}/); return m ? JSON.parse(m[0]) : null; }
    } catch (err) {
        clearTimeout(timeout);
        if (err.name === 'AbortError') { console.error('[Parse] Vision timeout after 45s'); toast('Processing timed out. Try manual entry.', 'error'); }
        else { console.error('[Parse] Vision error:', err.message); }
        return null;
    }
}

function fileToBase64(file) {
    return new Promise((res, rej) => {
        const reader = new FileReader();
        reader.onload = () => res(reader.result.split(',')[1]);
        reader.onerror = rej;
        reader.readAsDataURL(file);
    });
}

function buildForm16Prompt() {
    return `Extract all financial data from this Form 16 (Part B) document.
Return a JSON object with this exact structure:
{
  "personalInfo": { "name": "", "pan": "", "employerName": "" },
  "salary": { "basic": 0, "hra": 0, "da": 0, "specialAllowances": 0, "lta": 0, "grossSalary": 0, "professionalTax": 0 },
  "otherIncome": { "interestSavings": 0, "interestFD": 0, "dividend": 0 },
  "houseProperty": { "homeLoanInterestSOP": 0, "rentalIncome": 0 },
  "capitalGains": { "stcgEquity": 0, "ltcgEquity": 0, "ltcgOther": 0, "stcgOther": 0 },
  "deductions": { "sec80C": 0, "sec80CCD1B": 0, "sec80CCD2": 0, "sec80D_self": 0, "sec80D_parents": 0, "sec80E": 0, "sec80G": 0, "sec80TTA": 0 }
}
Rules:
- All amounts in INR (no commas, no symbols)
- Use 0 for missing/unknown values
- Extract PAN exactly as shown
- "basic" = Basic Salary from Part B
- "grossSalary" = Total Gross Salary (sum of all heads)
- Map 80C deductions: PPF + ELSS + LIC + EPF + tuition = sec80C
- Map employer NPS to sec80CCD2`;
}

// ── Screen 3: Calculator Form Helpers ──
function toggleSection(header) {
    header.classList.toggle('collapsed');
    const body = header.nextElementSibling;
    if (body) body.classList.toggle('collapsed');
}

function markFilledInputs() {
    document.querySelectorAll('#screen3 input[type=number]').forEach(inp => {
        inp.classList.toggle('has-value', (parseFloat(inp.value) || 0) > 0);
    });
    // Update section check marks
    document.querySelectorAll('.calc-section').forEach(sec => {
        const header = sec.querySelector('.calc-section-header');
        const inputs = sec.querySelectorAll('input[type=number]');
        let hasVal = false;
        inputs.forEach(inp => { if ((parseFloat(inp.value) || 0) > 0) hasVal = true; });
        header.classList.toggle('has-values', hasVal);
    });
}

document.addEventListener('input', e => {
    if (e.target.type === 'number') markFilledInputs();
});

// Business type toggles
const bizType = document.getElementById('businessType');
const presRate = document.getElementById('presumptiveRate');
if (bizType) bizType.addEventListener('change', function() {
    if (this.value === '44ADA') presRate.value = '50';
    else if (this.value === '44AD') presRate.value = '8';
});
if (presRate) presRate.addEventListener('change', function() {
    document.getElementById('customRateGroup').style.display = this.value === 'custom' ? '' : 'none';
});

// ── Screen 4: Computation ──
function collectFormInputs() {
    const g = id => { const el = document.getElementById(id); return el ? el.value : '0'; };
    return {
        ageCategory: g('ageCategory'), residentialStatus: g('residentialStatus'),
        cityType: g('cityType'), employerType: g('employerType'),
        basicSalary: g('basicSalary'), da: g('da'), hra: g('hra'), rentPaid: g('rentPaid'),
        lta: g('lta'), specialAllowance: g('specialAllowance'), profTax: g('profTax'),
        employerNPS: g('employerNPS'),
        interestIncome: g('interestIncome'), otherIncome: g('otherIncome'),
        agriIncome: g('agriIncome'), familyPension: g('familyPension'),
        hasSOP: g('hasSOP'), homeLoanSOP: g('homeLoanSOP'),
        letOutRent: g('letOutRent'), municipalTax: g('municipalTax'), homeLoanLetOut: g('homeLoanLetOut'),
        stcgEquity: g('stcgEquity'), stcgOther: g('stcgOther'),
        ltcgEquity: g('ltcgEquity'), ltcgOther: g('ltcgOther'),
        businessType: g('businessType'), businessTurnover: g('businessTurnover'),
        presumptiveRate: g('presumptiveRate'), customRate: g('customRate'),
        sec80C: g('sec80C'), sec80CCD1B: g('sec80CCD1B'),
        healthInsSelf: g('healthInsSelf'), healthInsParents: g('healthInsParents'),
        selfSenior80D: g('selfSenior80D'), parentsSenior80D: g('parentsSenior80D'),
        preventiveSelf: g('preventiveSelf'), preventiveParents: g('preventiveParents'),
        medExpSenior: g('medExpSenior'),
        sec80E: g('sec80E'), sec80G: g('sec80G'), donationType: g('donationType'),
        sec80GG: g('sec80GG'), sec80TTA: g('sec80TTA'),
        sec80DD: g('sec80DD'), sec80U: g('sec80U'), sec80DDB: g('sec80DDB'),
        _multipleForm16: extractedData._multipleForm16 || false
    };
}

async function runComputation() {
    // Validate Name
    const fullName = (document.getElementById('fullName').value || '').trim();
    if (!fullName || fullName.length < 2) {
        toast('Please enter your full name', 'error');
        document.getElementById('fullName').focus();
        return;
    }

    // Validate PAN
    const pan = document.getElementById('panNumber').value.trim().toUpperCase();
    if (!pan || !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)) {
        toast('Please enter a valid PAN number', 'error');
        document.getElementById('panNumber').focus();
        return;
    }

    showScreen(4);

    const inputs = collectFormInputs();
    inputs.pan = pan;
    inputs.name = fullName;
    inputs.incomeType = selectedType;

    // Animated steps
    const steps = ['pStep1', 'pStep2', 'pStep3', 'pStep4', 'pStep5'];
    for (let i = 0; i < steps.length; i++) {
        await delay(600);
        const el = document.getElementById(steps[i]);
        el.classList.add('active');
        el.querySelector('.p-icon').textContent = '⏳';
        if (i > 0) {
            const prev = document.getElementById(steps[i - 1]);
            prev.classList.remove('active');
            prev.classList.add('done');
            prev.querySelector('.p-icon').textContent = '✅';
        }
    }

    // Run tax engine
    taxResult = computeTax(inputs);

    // Run insights
    insightResult = generateInsights(inputs, taxResult);

    await delay(500);
    const last = document.getElementById(steps[steps.length - 1]);
    last.classList.remove('active'); last.classList.add('done');
    last.querySelector('.p-icon').textContent = '✅';

    // Store initial data to Google Sheets (without lead contact yet)
    storeReport(pan, inputs, taxResult, insightResult);

    await delay(400);

    // Update gate screen with real data
    updateGateScreen(pan);
    showScreen(5);
}

function updateGateScreen(pan) {
    if (!insightResult || !taxResult) return;
    const f = n => 'Rs. ' + Math.round(Number(n) || 0).toLocaleString('en-IN');

    const blurOld = document.getElementById('blurOldTax');
    const blurNew = document.getElementById('blurNewTax');
    const blurVerdict = document.getElementById('blurVerdict');
    if (blurOld) blurOld.textContent = f(taxResult.old.roundedTax);
    if (blurNew) blurNew.textContent = f(taxResult.new.roundedTax);
    if (blurVerdict) blurVerdict.textContent = (taxResult.recommendation === 'same')
        ? 'Both regimes result in equal tax'
        : taxResult.regimeLabel || ('Saves you ' + f(taxResult.absSavings));

    const findingsEl = document.getElementById('blurFindings');
    if (findingsEl && insightResult.insights.length) {
        findingsEl.innerHTML = insightResult.insights.slice(0, 3).map(ins => {
            const dotClass = ins.type === 'risk' ? 'risk' : ins.type === 'opportunity' ? 'opp' : 'good';
            return `<div class="finding-row"><span class="f-dot ${dotClass}"></span><span>${ins.title}</span></div>`;
        }).join('');
    }

    document.getElementById('insightCount').textContent =
        `${insightResult.counts.total} personalised insights found`;
    document.getElementById('insightBadges').innerHTML = [
        insightResult.counts.risk > 0 ? `<span class="insight-badge risk">⚠️ ${insightResult.counts.risk} risk${insightResult.counts.risk > 1 ? 's' : ''}</span>` : '',
        insightResult.counts.opportunity > 0 ? `<span class="insight-badge opportunity">💡 ${insightResult.counts.opportunity} opportunit${insightResult.counts.opportunity > 1 ? 'ies' : 'y'}</span>` : '',
        insightResult.counts.good > 0 ? `<span class="insight-badge good">✅ ${insightResult.counts.good} healthy</span>` : ''
    ].filter(Boolean).join('');

    if (insightResult.totalPotentialSavings > 0) {
        document.getElementById('savingsTeaser').textContent =
            `💰 ${f(insightResult.totalPotentialSavings)} in potential savings identified`;
        document.getElementById('savingsTeaser').style.display = '';
    } else {
        document.getElementById('savingsTeaser').style.display = 'none';
    }
}

// ── Lead Gate Validation ──
function validateLeadForm() {
    const wa = (document.getElementById('whatsappNumber').value || '').trim();
    const email = (document.getElementById('leadEmail').value || '').trim();
    const valid = wa.length === 10 && /^[6-9]\d{9}$/.test(wa) && email.includes('@') && email.includes('.');
    document.getElementById('getReportBtn').disabled = !valid;
}

async function submitLeadAndGetReport() {
    const wa = (document.getElementById('whatsappNumber').value || '').trim();
    const email = (document.getElementById('leadEmail').value || '').trim();
    const pan = document.getElementById('panNumber').value.trim().toUpperCase();
    const name = (document.getElementById('fullName').value || '').trim();

    if (wa.length !== 10 || !/^[6-9]\d{9}$/.test(wa)) {
        toast('Enter a valid 10-digit WhatsApp number', 'error'); return;
    }
    if (!email.includes('@')) { toast('Enter a valid email', 'error'); return; }

    const btn = document.getElementById('getReportBtn');
    btn.disabled = true;
    btn.textContent = 'Generating your report...';

    try {
        // Generate PDF client-side
        const inputs = collectFormInputs();
        inputs.pan = pan;
        inputs.name = name;
        inputs.incomeType = selectedType;
        const pdfBase64 = generateReportBase64(taxResult, insightResult, inputs, pan);
        console.log('[PDF] Generated, size:', Math.round(pdfBase64.length / 1024), 'KB');

        // Upload PDF + lead data to Apps Script
        const leadPayload = {
            action: 'submitLead',
            pan, name, mobile: wa, email,
            incomeType: selectedType,
            grossIncome: Number(inputs.basicSalary || 0) + Number(inputs.da || 0) + Number(inputs.hra || 0) + Number(inputs.specialAllowance || 0) + Number(inputs.lta || 0),
            basicSalary: inputs.basicSalary || 0,
            hra: inputs.hra || 0,
            specialAllowance: inputs.specialAllowance || 0,
            sec80C: inputs.sec80C || 0,
            healthIns: (Number(inputs.healthInsSelf) || 0) + (Number(inputs.healthInsParents) || 0),
            homeLoan: inputs.homeLoanSOP || 0,
            otherInputs: JSON.stringify(inputs),
            score: insightResult.score,
            band: insightResult.band,
            regime: taxResult.recommendation,
            oldTax: taxResult.old.roundedTax,
            newTax: taxResult.new.roundedTax,
            regimeSavings: taxResult.absSavings,
            insightCount: insightResult.counts.total,
            totalSavings: insightResult.totalPotentialSavings,
            reportData: JSON.stringify({ inputs, taxResult, insights: insightResult }),
            pdfBase64: pdfBase64,
            utmSource: _utm.source,
            utmMedium: _utm.medium,
            utmCampaign: _utm.campaign,
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            referrer: document.referrer || 'Direct'
        };

        // Use fetch POST (not sendBeacon — allows larger payloads)
        fetch(SHEETS_URL, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(leadPayload)
        }).then(() => console.log('[Sheets] Lead + PDF submitted'))
          .catch(e => console.error('[Sheets] Submit error:', e));

        // Open WhatsApp with pre-filled message
        const msg = encodeURIComponent(`I need my Tax Optimization Report.`);
        window.open(`https://wa.me/919992819995?text=${msg}`, '_blank');

        btn.innerHTML = '✅ Report Sent!';
        toast('Report sent! Check WhatsApp for your PDF.', 'success');

    } catch (err) {
        console.error('[Lead] Error:', err);
        toast('Something went wrong. Please try again.', 'error');
        btn.disabled = false;
        btn.textContent = 'Get My Report on WhatsApp';
    }
}

// ── Google Sheets Storage ──
const SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxmyCpynk0YIVCnLydz_j2UNla5B4wgydVzV_AaRgFpnItvuCiKfsG3YfVxUEiHN3A_/exec';

async function storeReport(pan, inputs, taxRes, insightRes) {
    if (!SHEETS_URL) return;
    try {
        const payload = {
            action: 'storeData',
            pan, name: inputs.name || '',
            mobile: '', email: '',
            incomeType: selectedType,
            grossIncome: Number(inputs.basicSalary || 0) + Number(inputs.da || 0) + Number(inputs.hra || 0) + Number(inputs.specialAllowance || 0) + Number(inputs.lta || 0),
            basicSalary: inputs.basicSalary || 0,
            hra: inputs.hra || 0,
            specialAllowance: inputs.specialAllowance || 0,
            sec80C: inputs.sec80C || 0,
            healthIns: (Number(inputs.healthInsSelf) || 0) + (Number(inputs.healthInsParents) || 0),
            homeLoan: inputs.homeLoanSOP || 0,
            otherInputs: JSON.stringify(inputs),
            score: insightRes.score, band: insightRes.band,
            regime: taxRes.recommendation,
            oldTax: taxRes.old.roundedTax, newTax: taxRes.new.roundedTax,
            regimeSavings: taxRes.absSavings,
            insightCount: insightRes.counts.total,
            totalSavings: insightRes.totalPotentialSavings,
            reportData: JSON.stringify({ inputs, taxResult: taxRes, insights: insightRes }),
            utmSource: _utm.source, utmMedium: _utm.medium, utmCampaign: _utm.campaign,
            device: /Mobi|Android/i.test(navigator.userAgent) ? 'Mobile' : 'Desktop',
            referrer: document.referrer || 'Direct'
        };
        // Use fetch instead of sendBeacon for reliable delivery
        fetch(SHEETS_URL, {
            method: 'POST', mode: 'no-cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify(payload)
        }).then(() => console.log('[Sheets] Data stored for PAN:', pan))
          .catch(e => console.error('[Sheets] Store error:', e));
    } catch (e) { console.error('[Sheets] Store error:', e); }
}

// ── Modal ──
function closeModal(id) {
    document.getElementById(id).classList.remove('active');
}

// ── Utilities ──
function toast(msg, type = 'info') {
    const ex = document.querySelector('.toast'); if (ex) ex.remove();
    const t = document.createElement('div');
    t.className = 'toast ' + type; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 300); }, 3000);
}

function delay(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── UTM Tracking ──
const _utm = (function() {
    const p = new URLSearchParams(window.location.search);
    return {
        source: p.get('utm_source') || '',
        medium: p.get('utm_medium') || '',
        campaign: p.get('utm_campaign') || ''
    };
})();

// ── Init ──
showScreen(1);
