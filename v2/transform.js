const fs = require('fs');
const file = 'g:\\ITR\\makeeazy-landing\\v2\\index.html';
let c = fs.readFileSync(file, 'utf8');

// Helper: find and replace between two markers (exclusive of markers)
function replaceBetween(start, end, replacement) {
  const i1 = c.indexOf(start);
  const i2 = c.indexOf(end, i1 + start.length);
  if (i1 >= 0 && i2 > i1) {
    c = c.substring(0, i1) + replacement + c.substring(i2);
    return true;
  }
  console.log('NOT FOUND:', start.substring(0, 40));
  return false;
}

// Helper: simple replace
function r(a, b) { 
  if (c.includes(a)) { c = c.split(a).join(b); }
  else { console.log('MISS:', a.substring(0, 50)); }
}

// ====== HERO SECTION ======
// Find the hero-deadline div and everything through hero-actions closing div
// Replace with inline form
const heroOldStart = '<div class="hero-deadline" id="deadlineCounter">';
const heroOldEnd = '</div>\r\n        <div class="hero-proof">';
const i1 = c.indexOf(heroOldStart);
const i2 = c.indexOf(heroOldEnd, i1);
if (i1 > 0 && i2 > i1) {
  const heroForm = `<form class="hero-form" id="heroForm">
          <div class="hero-form-row">
            <input type="text" name="heroName" placeholder="Your Name" required class="hero-input">
            <input type="tel" name="heroMobile" placeholder="Mobile Number" maxlength="10" required class="hero-input">
          </div>
          <div class="hero-form-row">
            <select name="heroNeed" required class="hero-select">
              <option value="" disabled selected>I need help with...</option>
              <option value="salaried">Salaried \u2014 Single Employer</option>
              <option value="multi-income">Salaried \u2014 Multiple Employers / Job Switch</option>
              <option value="capital-gains">Capital Gains / Investments</option>
              <option value="freelancer">Freelancer / Consultant</option>
              <option value="business">Business Income</option>
              <option value="nri">NRI Filing</option>
              <option value="notice">Tax Notice / Compliance</option>
              <option value="not-sure">Not Sure \u2014 Need Guidance</option>
            </select>
            <button type="submit" class="btn btn-primary hero-submit">Get Started \u2192</button>
          </div>
          <p class="hero-form-note">\uD83D\uDD12 Your details are safe with us.</p>
        </form>
        <div class="hero-proof">`;
  c = c.substring(0, i1) + heroForm + c.substring(i2 + heroOldEnd.length);
  console.log('HERO FORM: replaced');
} else {
  console.log('HERO FORM: not found', i1, i2);
}

// ====== SEO ======
r('MakeEazy \u2014 Expert-Assisted ITR Filing | Book Your Filing Appointment', 'Expert ITR Filing Service \u2014 AY 2026-27 | MakeEazy');
r('Stress-free ITR filing with qualified tax professionals. Salaried, multi-income, capital gains, NRI \u2014 expert-reviewed filing with transparent pricing. Book your appointment today.', 'Get your ITR filed by a qualified CA. Personalised expert filing for salaried, investors, freelancers, NRIs, and business owners. Book your expert appointment today.');
r('og:title" content="MakeEazy \u2014 Expert-Assisted ITR Filing"', 'og:title" content="Expert ITR Filing by Qualified CAs | MakeEazy"');
r('og:description" content="Stress-free ITR filing by qualified tax professionals. 5+ years trusted. Book your appointment today."', 'og:description" content="Get your ITR filed by a qualified CA. Personalised filing, 100% notice support. Book your expert appointment."');

// ====== NAV ======
r('      <a href="calculator">Tax Calculator</a>\r\n', '');
r('      <a href="smartupload">Smart Upload</a>\r\n', '');
r('<a href="#plans">Plans</a>', '<a href="#solutions">Solutions</a>');
r('<a href="#booking" class="btn btn-primary btn-sm">Book Expert Filing</a>', '<a href="https://api.whatsapp.com/send/?phone=919992819995&text=Hi%2C%20I%20need%20help%20filing%20my%20ITR%20for%20AY%202026-27&type=phone_number&app_absent=0" target="_blank" class="nav-phone">\u260E 999-281-9995</a>\n      <a href="#booking" class="btn btn-primary btn-sm scroll-to-booking">Book Your Expert</a>');

// ====== HERO COPY ======
r('AY 2026\u201327 Filing Now Open', 'AY 2026\u201327 Filing Season');
r('Stress-Free ITR Filing<br>\r\n          with <span class="accent">Expert Support</span>', 'Get Your ITR Filed by a<br>\r\n          <span class="accent">Qualified CA</span> \u2014 Before<br>\r\n          the July 31 Deadline');
r('Expert-assisted filing for salaried professionals, multi-income earners, investors, traders, business owners, and NRIs. Clear packages. Qualified tax professionals. Zero confusion.', 'Every return personally reviewed, optimised, and filed by our team of qualified Chartered Accountants. No chatbots. No auto-fill software. Just expert care.');

// Hero proof chips
r('Expert-Assisted Review', 'CA-Led Filing');
r('Transparent Pricing', '4.9\u2605 Client Rating');
r('5+ Years Trusted', '100% Notice Support');

// ====== TRUST STRIP ======
r('<div class="trust-strip-inner">', '<p class="trust-heading">Trusted by Professionals Across India</p>\n    <div class="trust-strip-inner">');
r('Tax Expert-Assisted Filing', 'Expert-Led Filing');
r('Secure Document Handling', 'Secure & Confidential');

// ====== STATS ======
r('<div class="stat-number" data-count="1200">0</div>\r\n        <div class="stat-label">Returns Filed</div>', '<div class="stat-number">24<span class="stat-pct">hrs</span></div>\r\n        <div class="stat-label">Avg. Turnaround</div>');

// ====== PERSONA SECTION ======
r('id="who-its-for"', 'id="solutions"');
r('Who This Is For', 'Expert Filing Solutions');
r('Built for People Who Want It Done Right', 'Expert Filing Solutions for Every Situation');

// Use indexOf-based replacement for persona subtitle (curly quotes may differ)
let psi = c.indexOf('Whether your case is simple');
if (psi > 0) {
  let pse = c.indexOf('</p>', psi);
  let oldSub = c.substring(psi, pse);
  c = c.replace(oldSub, "Whether it\u2019s a straightforward salary return or a complex multi-income filing \u2014 our CAs have handled it.");
  console.log('FIXED: persona subtitle');
}

// Card 1: Salaried
r('Salaried Professionals', 'Salaried Professional');
r('You have a single job but still feel unsure about deductions, HRA, and which regime saves more.', "Not sure if you\u2019re claiming all eligible deductions?");
r('Our experts review your Form 16, optimise deductions, and file under the best regime for you.', 'Our expert reviews your Form 16, AIS, and 26AS \u2014 identifying every saving opportunity and ensuring accurate regime selection.');

// Card 2: Multi-Income -> Investor/Trader (keep emoji change later)
r('Multi-Income Earners', 'Investor / Trader');
r('Multiple Form 16s, rental income, dividends, or other additional sources creating confusion about which ITR form to file.', 'Capital gains from stocks, mutual funds, or F&amp;O giving you anxiety?');
r('Our Multi-Income Pro package consolidates all income sources, reconciles AIS/26AS, and handles ITR-1 or ITR-2 filing.', 'Accurate gain computation, loss set-off, correct schedule filing, and STT credit \u2014 handled by an expert who understands markets.');

// Card 3: Investors -> Freelancer (file uses raw & not &amp;)
let ci3 = c.indexOf('Investors &amp; Traders');
if (ci3 > 0) {
  c = c.replace('Investors &amp; Traders', 'Freelancer / Consultant');
} else {
  ci3 = c.indexOf('Investors & Traders');
  if (ci3 > 0) c = c.replace('Investors & Traders', 'Freelancer / Consultant');
}
let cp3 = c.indexOf('Capital gains from stocks, mutual funds, F');
if (cp3 > 0) {
  let cp3e = c.indexOf('</p>', cp3);
  let old3 = c.substring(cp3, cp3e);
  c = c.replace(old3, 'Juggling multiple income sources with no bookkeeping?');
}
r('Our capital gains experts handle ITR-2/ITR-3 with proper schedule CG, loss set-off, and carry-forward.', 'We reconcile your incomes, check presumptive taxation eligibility, and file clean \u2014 keeping you safe from scrutiny.');

// Card 4: Peace-of-Mind -> Notice
r('Peace-of-Mind Seekers', 'Got a Tax Notice?');
r('You could file yourself but want the assurance that a qualified expert has reviewed everything.', "Received a notice you didn\u2019t expect?");
r('Get expert-reviewed filing with a summary you actually understand, plus 100% notice support if needed.', 'We diagnose, respond, and resolve on time and make you compliant.');

// Change all persona CTAs
r('>Book Expert Filing</a>', '>Speak to an Expert</a>');

// Add NRI + Business cards before persona grid close
const pgClose = '    </div>\r\n  </div>\r\n</section>\r\n\r\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 HOW IT WORKS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->';
const newCards = `      <div class="persona-card fade-up">
        <div class="persona-emoji">\uD83C\uDF0D</div>
        <h3 class="persona-title">NRI</h3>
        <p class="persona-problem">Worried about double taxation on your Indian income?</p>
        <p class="persona-solution">DTAA treaty claims, foreign asset schedules, ESOP/RSU taxation, and full compliance \u2014 handled end to end.</p>
        <a href="#booking" class="btn btn-navy btn-sm scroll-to-booking">Speak to an Expert</a>
      </div>
      <div class="persona-card fade-up">
        <div class="persona-emoji">\uD83C\uDFE2</div>
        <h3 class="persona-title">Business Owner</h3>
        <p class="persona-problem">Books, GST, TDS, and ITR \u2014 too many loose ends?</p>
        <p class="persona-solution">Complete reconciliation of your books of accounts with income tax and GST returns. File with confidence.</p>
        <a href="#booking" class="btn btn-navy btn-sm scroll-to-booking">Speak to an Expert</a>
      </div>
    </div>\r\n  </div>\r\n</section>\r\n\r\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 HOW IT WORKS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->`;
r(pgClose, newCards);

// Make grid 6-col
r('class="persona-grid"', 'class="persona-grid persona-grid-6"');

// ====== HOW IT WORKS ======
r('Upload Form 16, capital gains statement, and other essentials via our secure channel.', "Share your documents via WhatsApp or our secure upload link. Don\u2019t have everything? Our expert will tell you exactly what\u2019s needed.");
r('    <div class="text-center fade-up" style="margin-top:48px;">\r\n      <a href="#booking" class="btn btn-primary btn-lg scroll-to-booking">Book Your Appointment Now</a>\r\n    </div>\r\n', '');

// ====== REPLACE PLANS WITH PROFILER ======
replaceBetween(
  '<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 PLANS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->',
  '<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 WHY MAKEEAZY \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->',
  `<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 TAX PROFILER LEAD MAGNET \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<section class="profiler-section section" id="tax-profiler">
  <div class="container">
    <div class="profiler-card fade-up">
      <div class="profiler-content">
        <span class="section-label">Free Tool</span>
        <h2 class="profiler-title">Not ready to book? Start with your Free Tax Profile.</h2>
        <p class="profiler-desc">Understand your tax situation before you commit. Our Tax Profiler analyses your documents and generates a detailed report \u2014 completely free.</p>
      </div>
      <form class="profiler-form" id="profilerForm">
        <input type="text" name="profilerName" placeholder="Your Name" required class="form-input">
        <input type="email" name="profilerEmail" placeholder="Email Address" required class="form-input">
        <input type="tel" name="profilerPhone" placeholder="Mobile Number" maxlength="10" required class="form-input">
        <button type="submit" class="btn btn-primary" style="width:100%;">Get My Tax Profile \u2192</button>
        <p class="profiler-note">\uD83D\uDCCA Upload your documents and get an instant analysis of your income, deductions, and filing requirements.</p>
      </form>
    </div>
  </div>
</section>\r\n\r\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 WHY MAKEEAZY \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->`
);

// ====== WHY MAKEEAZY ======
r('Why Smart Filers Choose MakeEazy', 'Your Return. Our Expert Team.');
r('Not just another filing platform. A premium, expert-led service built for people who value their time and their money.', "Every return at MakeEazy is handled by our team of qualified Chartered Accountants \u2014 registered with ICAI, experienced in complex filings, and personally assigned to your case.");

// ====== REMOVE TRUST & CREDIBILITY ======
replaceBetween(
  '<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 TRUST & CREDIBILITY \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->',
  '<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 TESTIMONIALS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->',
  '\r\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 TESTIMONIALS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->'
);

// ====== REPLACE TESTIMONIALS ======
replaceBetween(
  '<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 TESTIMONIALS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->',
  '<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 FAQ \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->',
  `<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 TESTIMONIALS \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->
<section class="testimonials-section section" id="testimonials">
  <div class="container">
    <div class="text-center fade-up">
      <span class="section-label">What Our Clients Say</span>
      <h2 class="section-title">Trusted by Professionals Like You</h2>
    </div>
    <div class="testimonial-grid">
      <div class="testimonial-card fade-up"><div class="testimonial-stars">\u2605\u2605\u2605\u2605\u2605</div><p class="testimonial-text">"I was filing on my own for years, thinking I had it covered. The MakeEazy team found deductions I didn\u2019t even know I was eligible for. The entire process was prompt and stress-free \u2014 they handled everything and I just had to approve."</p><div class="testimonial-author"><div class="testimonial-avatar">AS</div><div><div class="testimonial-name">Ananya Sharma</div><div class="testimonial-role">Marketing Manager, Bengaluru</div></div></div></div>
      <div class="testimonial-card fade-up"><div class="testimonial-stars">\u2605\u2605\u2605\u2605<span style="opacity:0.25">\u2605</span></div><p class="testimonial-text">"As a freelancer with income from multiple clients, reconciliation was always a headache. MakeEazy sorted through all my income streams, figured out the right approach, and filed it clean. First time I actually feel safe from scrutiny."</p><div class="testimonial-author"><div class="testimonial-avatar">KN</div><div><div class="testimonial-name">Karthik Nair</div><div class="testimonial-role">Independent Consultant, Hyderabad</div></div></div></div>
      <div class="testimonial-card fade-up"><div class="testimonial-stars">\u2605\u2605\u2605\u2605\u2605</div><p class="testimonial-text">"Living abroad, the last thing I wanted was tax complications back home. MakeEazy understood DTAA provisions, handled foreign asset disclosures properly, and made sure I wasn\u2019t paying tax twice. Saved me significant time and money."</p><div class="testimonial-author"><div class="testimonial-avatar">DM</div><div><div class="testimonial-name">Deepak Mehta</div><div class="testimonial-role">Software Engineer, Dubai</div></div></div></div>
      <div class="testimonial-card fade-up"><div class="testimonial-stars">\u2605\u2605\u2605\u2605<span style="opacity:0.25">\u2605</span></div><p class="testimonial-text">"Running a business means dealing with GST, TDS, and income tax all at once. MakeEazy reconciled my books of accounts and filed everything correctly \u2014 no gaps, no mismatches. One less thing to worry about."</p><div class="testimonial-author"><div class="testimonial-avatar">SK</div><div><div class="testimonial-name">Sneha Kulkarni</div><div class="testimonial-role">Founder, Retail Business, Pune</div></div></div></div>
      <div class="testimonial-card fade-up"><div class="testimonial-stars">\u2605\u2605\u2605\u2605\u2605</div><p class="testimonial-text">"What I appreciated most was the patience. They explained every section of my return in simple terms, answered all my questions without rushing, and filed well before the deadline. Very respectful and thorough."</p><div class="testimonial-author"><div class="testimonial-avatar">RI</div><div><div class="testimonial-name">Ramesh Iyer</div><div class="testimonial-role">Retired, Chennai</div></div></div></div>
      <div class="testimonial-card fade-up"><div class="testimonial-stars">\u2605\u2605\u2605\u2605<span style="color:var(--orange)">\u00BD</span></div><p class="testimonial-text">"I had my return filed elsewhere by someone who promised a big refund \u2014 without explaining what was being claimed. Months later, a notice arrived for a refund I wasn\u2019t entitled to. MakeEazy reviewed the case, explained where things went wrong, and resolved it with the department before it escalated. Learned the hard way \u2014 getting it filed right matters more than chasing a bigger refund."</p><div class="testimonial-author"><div class="testimonial-avatar">VJ</div><div><div class="testimonial-name">Vikram Joshi</div><div class="testimonial-role">Team Lead, Mumbai</div></div></div></div>
    </div>
  </div>
</section>\r\n\r\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 FAQ \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->`
);

// ====== FINAL CTA ======
let fcta = c.indexOf('Your Return Doesn');
if (fcta > 0) {
  let fctaE = c.indexOf('</h2>', fcta);
  let oldFcta = c.substring(fcta, fctaE);
  c = c.replace(oldFcta, 'Your ITR Deserves Expert Attention.');
}
let fctaSub = c.indexOf('Book an assisted filing appointment');
if (fctaSub > 0) {
  let fctaSubE = c.indexOf('</p>', fctaSub);
  let oldSub2 = c.substring(fctaSub, fctaSubE);
  c = c.replace(oldSub2, 'Book an appointment with a qualified CA. Get clarity, accuracy, and complete peace of mind \u2014 before the deadline.');
}
let fctaNote = c.indexOf('Limited expert slots');
if (fctaNote > 0) {
  let fctaNoteE = c.indexOf('</p>', fctaNote);
  let oldNote = c.substring(fctaNote, fctaNoteE);
  c = c.replace(oldNote, 'Expert availability is limited during peak filing season. Book early.');
}

// ====== WHATSAPP LINKS ======
r('href="#" class="btn btn-secondary whatsapp-link"', 'href="https://api.whatsapp.com/send/?phone=919992819995&text=Hi%2C%20I%20need%20help%20filing%20my%20ITR%20for%20AY%202026-27&type=phone_number&app_absent=0" target="_blank" class="btn btn-secondary whatsapp-link"');
r('href="#" class="whatsapp-link"', 'href="https://api.whatsapp.com/send/?phone=919992819995&text=Hi%2C%20I%20need%20help%20filing%20my%20ITR%20for%20AY%202026-27&type=phone_number&app_absent=0" target="_blank" class="whatsapp-link"');
r('href="#" class="whatsapp-float"', 'href="https://api.whatsapp.com/send/?phone=919992819995&text=Hi%2C%20I%20need%20help%20filing%20my%20ITR%20for%20AY%202026-27&type=phone_number&app_absent=0" target="_blank" class="whatsapp-float"');

// ====== FOOTER ======
r('<a href="#plans">Filing Plans</a>', '<a href="#solutions">Solutions</a>');

// ====== STICKY CTA ======
c = c.replace('>Book Expert Filing<', '>Book Now<');

// ====== EXIT POPUP ======
const exitPopup = `\r\n<!-- \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 EXIT INTENT POPUP \u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550 -->\r\n<div class="exit-popup-overlay" id="exitPopup">\r\n  <div class="exit-popup">\r\n    <button class="exit-popup-close" id="exitPopupClose">\u00D7</button>\r\n    <h3 class="exit-popup-title">Not ready to book? No problem.</h3>\r\n    <p class="exit-popup-sub">Schedule a quick call with a tax expert at your convenience.</p>\r\n    <form class="exit-popup-form" id="exitForm">\r\n      <input type="text" name="exitName" placeholder="Your Name" required class="form-input">\r\n      <input type="email" name="exitEmail" placeholder="Email Address" required class="form-input">\r\n      <input type="tel" name="exitPhone" placeholder="Mobile Number" maxlength="10" required class="form-input">\r\n      <select name="exitTime" required class="form-select">\r\n        <option value="" disabled selected>Preferred call time</option>\r\n        <option value="morning">Morning (10am\u201312pm)</option>\r\n        <option value="afternoon">Afternoon (12pm\u20134pm)</option>\r\n        <option value="evening">Evening (4pm\u20137pm)</option>\r\n        <option value="weekend">Weekend</option>\r\n      </select>\r\n      <button type="submit" class="btn btn-primary" style="width:100%;">Schedule My Call \u2192</button>\r\n      <p style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:8px;">\uD83D\uDD12 Your details are safe with us.</p>\r\n    </form>\r\n  </div>\r\n</div>\r\n`;
r('</body>', exitPopup + '</body>');

fs.writeFileSync(file, c, 'utf8');
console.log('V2 transform complete! Size:', c.length, 'bytes');
