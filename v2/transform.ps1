# V2 Transform Script - applies all changes to copied V1 index.html
$file = "g:\ITR\makeeazy-landing\v2\index.html"
$c = [System.IO.File]::ReadAllText($file)

# 1. SEO Meta
$c = $c -replace 'MakeEazy — Expert-Assisted ITR Filing \| Book Your Filing Appointment', 'Expert ITR Filing Service — AY 2026-27 | MakeEazy'
$c = $c -replace 'Stress-free ITR filing with qualified tax professionals\. Salaried, multi-income, capital gains, NRI — expert-reviewed filing with transparent pricing\. Book your appointment today\.', 'Get your ITR filed by a qualified CA. Personalised expert filing for salaried, investors, freelancers, NRIs, and business owners. Book your expert appointment today.'
$c = $c -replace 'og:title" content="MakeEazy — Expert-Assisted ITR Filing"', 'og:title" content="Expert ITR Filing by Qualified CAs | MakeEazy"'
$c = $c -replace 'og:description" content="Stress-free ITR filing by qualified tax professionals\. 5\+ years trusted\. Book your appointment today\."', 'og:description" content="Get your ITR filed by a qualified CA. Personalised filing, 100% notice support. Book your expert appointment."'

# 2. Nav - remove Smart Upload and Tax Calculator links
$c = $c -replace '      <a href="calculator">Tax Calculator</a>\r?\n', ''
$c = $c -replace '      <a href="smartupload">Smart Upload</a>\r?\n', ''
$c = $c -replace '<a href="#plans">Plans</a>', '<a href="#solutions">Solutions</a>'
$c = $c -replace '<a href="#booking" class="btn btn-primary btn-sm">Book Expert Filing</a>', '<a href="https://api.whatsapp.com/send/?phone=919992819995&text=Hi%2C%20I%20need%20help%20filing%20my%20ITR%20for%20AY%202026-27&type=phone_number&app_absent=0" target="_blank" class="nav-phone">&#128222; 999-281-9995</a>
      <a href="#booking" class="btn btn-primary btn-sm scroll-to-booking">Book Your Expert</a>'

# 3. Hero - headline
$c = $c -replace 'AY 2026–27 Filing Now Open', 'AY 2026–27 Filing Season · <strong id="daysLeft2"></strong> days to July 31'
$c = $c -replace '          Stress-Free ITR Filing<br>\r?\n          with <span class="accent">Expert Support</span>', '          Get Your ITR Filed by a<br>
          <span class="accent">Qualified CA</span> — Before<br>
          the July 31 Deadline'
$c = $c -replace 'Expert-assisted filing for salaried professionals, multi-income earners, investors, traders, business owners, and NRIs\. Clear packages\. Qualified tax professionals\. Zero confusion\.', 'Every return personally reviewed, optimised, and filed by our team of qualified Chartered Accountants. No chatbots. No auto-fill software. Just expert care.'

# 4. Replace hero buttons with inline form
$old_hero_actions = @'
        <div class="hero-deadline" id="deadlineCounter">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          <span>July 31 deadline — <strong id="daysLeft"></strong> days left</span>
        </div>
        <div class="hero-actions">
'@
$new_hero_form_start = @'
        <form class="hero-form" id="heroForm">
          <div class="hero-form-row">
            <input type="text" name="heroName" placeholder="Your Name" required class="hero-input">
            <input type="tel" name="heroMobile" placeholder="Mobile Number" maxlength="10" required class="hero-input">
          </div>
          <div class="hero-form-row">
            <select name="heroNeed" required class="hero-select">
              <option value="" disabled selected>I need help with...</option>
              <option value="salaried">Salaried — Single Employer</option>
              <option value="multi-income">Salaried — Multiple Employers / Job Switch</option>
              <option value="capital-gains">Capital Gains / Investments</option>
              <option value="freelancer">Freelancer / Consultant</option>
              <option value="business">Business Income</option>
              <option value="nri">NRI Filing</option>
              <option value="notice">Tax Notice / Compliance</option>
              <option value="not-sure">Not Sure — Need Guidance</option>
            </select>
            <button type="submit" class="btn btn-primary hero-submit">Get Started →</button>
          </div>
          <p class="hero-form-note">🔒 Your details are safe with us.</p>
        </form>
        <div class="hero-actions" style="display:none;">
'@
$c = $c.Replace($old_hero_actions, $new_hero_form_start)

# 5. Update hero proof chips
$c = $c -replace 'Expert-Assisted Review', 'CA-Led Filing'
$c = $c -replace 'Transparent Pricing', '4.9★ Client Rating'  
$c = $c -replace '5\+ Years Trusted', '100% Notice Support'

# 6. Trust strip - add heading
$c = $c -replace '<div class="trust-strip-inner">', '<p class="trust-heading">Trusted by Professionals Across India</p>
    <div class="trust-strip-inner">'
$c = $c -replace 'Tax Expert-Assisted Filing', 'Expert-Led Filing'
$c = $c -replace 'Secure Document Handling', 'Secure &amp; Confidential'

# 7. Stats - replace Returns Filed with Turnaround
$c = $c -replace '        <div class="stat-number" data-count="1200">0</div>\r?\n        <div class="stat-label">Returns Filed</div>', '        <div class="stat-number">24<span class="stat-pct">hrs</span></div>
        <div class="stat-label">Avg. Turnaround</div>'

# 8. Persona section - update header and id
$c = $c -replace 'id="who-its-for"', 'id="solutions"'
$c = $c -replace '<span class="section-label">Who This Is For</span>', '<span class="section-label">Expert Filing Solutions</span>'
$c = $c -replace 'Built for People Who Want It Done Right', 'Expert Filing Solutions for Every Situation'
$c = $c -replace "Whether your case is simple or slightly complex — MakeEazy's experts handle it so you don't have to\.", "Whether it's a straightforward salary return or a complex multi-income filing — our CAs have handled it."

# 9. Update persona cards content
$c = $c -replace '<h3 class="persona-title">Salaried Professionals</h3>', '<h3 class="persona-title">Salaried Professional</h3>'
$c = $c -replace 'You have a single job but still feel unsure about deductions, HRA, and which regime saves more\.', "Not sure if you're claiming all eligible deductions?"
$c = $c -replace "Our experts review your Form 16, optimise deductions, and file under the best regime for you\.", 'Our expert reviews your Form 16, AIS, and 26AS — identifying every saving opportunity and ensuring accurate regime selection.'

$c = $c -replace '<h3 class="persona-title">Multi-Income Earners</h3>', '<h3 class="persona-title">Investor / Trader</h3>'
$c = $c -replace 'Multiple Form 16s, rental income, dividends, or other additional sources creating confusion about which ITR form to file\.', 'Capital gains from stocks, mutual funds, or F&amp;O giving you anxiety?'
$c = $c -replace "Our Multi-Income Pro package consolidates all income sources, reconciles AIS/26AS, and handles ITR-1 or ITR-2 filing\.", 'Accurate gain computation, loss set-off, correct schedule filing, and STT credit — handled by an expert who understands markets.'
$c = $c -replace '📋', '📊'

$c = $c -replace '<h3 class="persona-title">Investors &amp; Traders</h3>', '<h3 class="persona-title">Freelancer / Consultant</h3>'
$c = $c -replace 'Capital gains from stocks, mutual funds, F&amp;O — terrified of incorrect reporting or missing a disclosure\.', 'Juggling multiple income sources with no bookkeeping?'
$c = $c -replace "Our capital gains experts handle ITR-2/ITR-3 with proper schedule CG, loss set-off, and carry-forward\.", 'We reconcile your incomes, check presumptive taxation eligibility, and file clean — keeping you safe from scrutiny.'
$c = $c -replace '📈', '💻'

$c = $c -replace '<h3 class="persona-title">Peace-of-Mind Seekers</h3>', '<h3 class="persona-title">Got a Tax Notice?</h3>'
$c = $c -replace 'You could file yourself but want the assurance that a qualified expert has reviewed everything\.', "Received a notice you didn't expect?"
$c = $c -replace "Get expert-reviewed filing with a summary you actually understand, plus 100% notice support if needed\.", 'We diagnose, respond, and resolve on time and make you compliant.'

# 10. Change persona CTAs
$c = $c -replace 'class="btn btn-primary btn-sm scroll-to-booking">Book Expert Filing</a>', 'class="btn btn-navy btn-sm scroll-to-booking">Speak to an Expert</a>'

# Add 2 more persona cards (NRI + Business Owner) before the closing </div> of persona-grid
$extra_cards = @'
      <div class="persona-card fade-up">
        <div class="persona-emoji">🌍</div>
        <h3 class="persona-title">NRI</h3>
        <p class="persona-problem">Worried about double taxation on your Indian income?</p>
        <p class="persona-solution">DTAA treaty claims, foreign asset schedules, ESOP/RSU taxation, and full compliance — handled end to end.</p>
        <a href="#booking" class="btn btn-navy btn-sm scroll-to-booking">Speak to an Expert</a>
      </div>
      <div class="persona-card fade-up">
        <div class="persona-emoji">🏢</div>
        <h3 class="persona-title">Business Owner</h3>
        <p class="persona-problem">Books, GST, TDS, and ITR — too many loose ends?</p>
        <p class="persona-solution">Complete reconciliation of your books of accounts with income tax and GST returns. File with confidence.</p>
        <a href="#booking" class="btn btn-navy btn-sm scroll-to-booking">Speak to an Expert</a>
      </div>
    </div>
'@
$c = $c -replace '    </div>\r?\n  </div>\r?\n</section>\r?\n\r?\n<!-- ════════ HOW IT WORKS', ($extra_cards + "`r`n  </div>`r`n</section>`r`n`r`n<!-- ════════ HOW IT WORKS")

# 11. How It Works - Step 2 copy
$c = $c -replace 'Upload Form 16, capital gains statement, and other essentials via our secure channel\.', "Share your documents via WhatsApp or our secure upload link. Don't have everything? Our expert will tell you exactly what's needed."

# 12. Remove "Book Your Appointment Now" CTA after steps
$c = $c -replace '    <div class="text-center fade-up" style="margin-top:48px;">\r?\n      <a href="#booking" class="btn btn-primary btn-lg scroll-to-booking">Book Your Appointment Now</a>\r?\n    </div>\r?\n', ''

# 13. Replace entire PLANS section with Tax Profiler
$plans_start = '<!-- ════════ PLANS ════════ -->'
$plans_end = '<!-- ════════ WHY MAKEEAZY ════════ -->'
$profiler = @'
<!-- ════════ TAX PROFILER LEAD MAGNET ════════ -->
<section class="profiler-section section" id="tax-profiler">
  <div class="container">
    <div class="profiler-card fade-up">
      <div class="profiler-content">
        <span class="section-label">Free Tool</span>
        <h2 class="profiler-title">Not ready to book? Start with your Free Tax Profile.</h2>
        <p class="profiler-desc">Understand your tax situation before you commit. Our Tax Profiler analyses your documents and generates a detailed report — completely free.</p>
      </div>
      <form class="profiler-form" id="profilerForm">
        <input type="text" name="profilerName" placeholder="Your Name" required class="form-input">
        <input type="email" name="profilerEmail" placeholder="Email Address" required class="form-input">
        <input type="tel" name="profilerPhone" placeholder="Mobile Number" maxlength="10" required class="form-input">
        <button type="submit" class="btn btn-primary" style="width:100%;">Get My Tax Profile →</button>
        <p class="profiler-note">📊 Upload your documents and get an instant analysis of your income, deductions, and filing requirements.</p>
      </form>
    </div>
  </div>
</section>

<!-- ════════ WHY MAKEEAZY ════════ -->
'@
$idx1 = $c.IndexOf($plans_start)
$idx2 = $c.IndexOf($plans_end)
if ($idx1 -gt 0 -and $idx2 -gt $idx1) {
    $c = $c.Substring(0, $idx1) + $profiler + $c.Substring($idx2 + $plans_end.Length)
}

# 14. Merge Why MakeEazy - update content to 4 cards (Notice Guarantee first)
$c = $c -replace 'Why Smart Filers Choose MakeEazy', 'Your Return. Our Expert Team.'
$c = $c -replace 'Not just another filing platform\. A premium, expert-led service built for people who value their time and their money\.', "Every return at MakeEazy is handled by our team of qualified Chartered Accountants — registered with ICAI, experienced in complex filings, and personally assigned to your case."

# 15. Remove Trust & Credibility section entirely
$trust_start = '<!-- ════════ TRUST & CREDIBILITY ════════ -->'
$trust_end_marker = '<!-- ════════ TESTIMONIALS ════════ -->'
$idx3 = $c.IndexOf($trust_start)
$idx4 = $c.IndexOf($trust_end_marker)
if ($idx3 -gt 0 -and $idx4 -gt $idx3) {
    $c = $c.Substring(0, $idx3) + "`r`n" + $c.Substring($idx4)
}

# 16. Replace testimonials
$test_start = '<!-- ════════ TESTIMONIALS ════════ -->'
$test_end = '<!-- ════════ FAQ ════════ -->'
$new_testimonials = @'
<!-- ════════ TESTIMONIALS ════════ -->
<section class="testimonials-section section" id="testimonials">
  <div class="container">
    <div class="text-center fade-up">
      <span class="section-label">What Our Clients Say</span>
      <h2 class="section-title">Trusted by Professionals Like You</h2>
    </div>
    <div class="testimonial-grid">
      <div class="testimonial-card fade-up">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-text">"I was filing on my own for years, thinking I had it covered. The MakeEazy team found deductions I didn't even know I was eligible for. The entire process was prompt and stress-free — they handled everything and I just had to approve."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">AS</div>
          <div><div class="testimonial-name">Ananya Sharma</div><div class="testimonial-role">Marketing Manager, Bengaluru</div></div>
        </div>
      </div>
      <div class="testimonial-card fade-up">
        <div class="testimonial-stars">★★★★<span style="opacity:0.3">★</span></div>
        <p class="testimonial-text">"As a freelancer with income from multiple clients, reconciliation was always a headache. MakeEazy sorted through all my income streams, figured out the right approach, and filed it clean. First time I actually feel safe from scrutiny."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">KN</div>
          <div><div class="testimonial-name">Karthik Nair</div><div class="testimonial-role">Independent Consultant, Hyderabad</div></div>
        </div>
      </div>
      <div class="testimonial-card fade-up">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-text">"Living abroad, the last thing I wanted was tax complications back home. MakeEazy understood DTAA provisions, handled foreign asset disclosures properly, and made sure I wasn't paying tax twice. Saved me significant time and money."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">DM</div>
          <div><div class="testimonial-name">Deepak Mehta</div><div class="testimonial-role">Software Engineer, Dubai</div></div>
        </div>
      </div>
      <div class="testimonial-card fade-up">
        <div class="testimonial-stars">★★★★<span style="opacity:0.3">★</span></div>
        <p class="testimonial-text">"Running a business means dealing with GST, TDS, and income tax all at once. MakeEazy reconciled my books of accounts and filed everything correctly — no gaps, no mismatches. One less thing to worry about."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">SK</div>
          <div><div class="testimonial-name">Sneha Kulkarni</div><div class="testimonial-role">Founder, Retail Business, Pune</div></div>
        </div>
      </div>
      <div class="testimonial-card fade-up">
        <div class="testimonial-stars">★★★★★</div>
        <p class="testimonial-text">"What I appreciated most was the patience. They explained every section of my return in simple terms, answered all my questions without rushing, and filed well before the deadline. Very respectful and thorough."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">RI</div>
          <div><div class="testimonial-name">Ramesh Iyer</div><div class="testimonial-role">Retired, Chennai</div></div>
        </div>
      </div>
      <div class="testimonial-card fade-up">
        <div class="testimonial-stars">★★★★<span style="color:var(--orange)">½</span></div>
        <p class="testimonial-text">"I had my return filed elsewhere by someone who promised a big refund — without explaining what was being claimed. Months later, a notice arrived for a refund I wasn't entitled to. MakeEazy reviewed the case, explained where things went wrong, and resolved it with the department before it escalated. Learned the hard way — getting it filed right matters more than chasing a bigger refund."</p>
        <div class="testimonial-author">
          <div class="testimonial-avatar">VJ</div>
          <div><div class="testimonial-name">Vikram Joshi</div><div class="testimonial-role">Team Lead, Mumbai</div></div>
        </div>
      </div>
    </div>
  </div>
</section>

'@
$idx5 = $c.IndexOf($test_start)
$idx6 = $c.IndexOf($test_end)
if ($idx5 -gt 0 -and $idx6 -gt $idx5) {
    $c = $c.Substring(0, $idx5) + $new_testimonials + $c.Substring($idx6)
}

# 17. Final CTA
$c = $c -replace "Your Return Doesn't Need More Confusion\.", 'Your ITR Deserves Expert Attention.'
$c = $c -replace 'Book an assisted filing appointment and get expert clarity\. Let a qualified professional handle your ITR — accurately, on time, and with zero stress\.', 'Book an appointment with a qualified CA. Get clarity, accuracy, and complete peace of mind — before the deadline.'
$c = $c -replace '>Book Expert Filing Appointment<', '>Book Your Expert Appointment<'
$c = $c -replace '>WhatsApp an Expert<', '>💬 Chat with a Tax Expert<'
$c = $c -replace 'Limited expert slots available during peak filing season\. Book early to avoid delays\.', 'Expert availability is limited during peak filing season. Book early.'

# 18. Booking form - update CTA and dropdown
$c = $c -replace '>Book Expert Filing Appointment<', '>Book Your Expert Appointment<'
$c = $c -replace '>Book Expert Filing<', '>Book Now<'

# 19. WhatsApp links
$c = $c -replace 'href="#" class="btn btn-secondary whatsapp-link"', 'href="https://api.whatsapp.com/send/?phone=919992819995&text=Hi%2C%20I%20need%20help%20filing%20my%20ITR%20for%20AY%202026-27&type=phone_number&app_absent=0" target="_blank" class="btn btn-secondary whatsapp-link"'
$c = $c -replace 'href="#" class="whatsapp-link"', 'href="https://api.whatsapp.com/send/?phone=919992819995&text=Hi%2C%20I%20need%20help%20filing%20my%20ITR%20for%20AY%202026-27&type=phone_number&app_absent=0" target="_blank" class="whatsapp-link"'
$c = $c -replace 'href="#" class="whatsapp-float"', 'href="https://api.whatsapp.com/send/?phone=919992819995&text=Hi%2C%20I%20need%20help%20filing%20my%20ITR%20for%20AY%202026-27&type=phone_number&app_absent=0" target="_blank" class="whatsapp-float"'

# 20. Footer - update links
$c = $c -replace '<a href="#plans">Filing Plans</a>', '<a href="#solutions">Solutions</a>'

# 21. Sticky CTA
$c = $c -replace '>Book Expert Filing<', '>Book Now<'

# 22. Add exit intent popup + schema before </body>
$exit_popup = @'

<!-- ════════ EXIT INTENT POPUP ════════ -->
<div class="exit-popup-overlay" id="exitPopup">
  <div class="exit-popup">
    <button class="exit-popup-close" id="exitPopupClose">×</button>
    <h3 class="exit-popup-title">Not ready to book? No problem.</h3>
    <p class="exit-popup-sub">Schedule a quick call with a tax expert at your convenience.</p>
    <form class="exit-popup-form" id="exitForm">
      <input type="text" name="exitName" placeholder="Your Name" required class="form-input">
      <input type="email" name="exitEmail" placeholder="Email Address" required class="form-input">
      <input type="tel" name="exitPhone" placeholder="Mobile Number" maxlength="10" required class="form-input">
      <select name="exitTime" required class="form-select">
        <option value="" disabled selected>Preferred call time</option>
        <option value="morning">Morning (10am–12pm)</option>
        <option value="afternoon">Afternoon (12pm–4pm)</option>
        <option value="evening">Evening (4pm–7pm)</option>
        <option value="weekend">Weekend</option>
      </select>
      <button type="submit" class="btn btn-primary" style="width:100%;">Schedule My Call →</button>
      <p style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:8px;">🔒 Your details are safe with us.</p>
    </form>
  </div>
</div>

<!-- FAQ Schema -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {"@type":"Question","name":"Who should book an assisted filing appointment?","acceptedAnswer":{"@type":"Answer","text":"Anyone who wants their ITR filed correctly without the stress of doing it themselves."}},
    {"@type":"Question","name":"How long does the entire process take?","acceptedAnswer":{"@type":"Answer","text":"Most salaried filings are completed within 24-48 hours after receiving documents."}},
    {"@type":"Question","name":"How is this different from self-filing?","acceptedAnswer":{"@type":"Answer","text":"With MakeEazy, a qualified expert handles everything — forms, schedules, reconciliation, and filing."}}
  ]
}
</script>
'@
$c = $c -replace '</body>', ($exit_popup + "`r`n</body>")

# Write output
[System.IO.File]::WriteAllText($file, $c)
Write-Output "V2 transform complete! File size: $($c.Length) bytes"
