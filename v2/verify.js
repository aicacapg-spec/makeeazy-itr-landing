const c=require('fs').readFileSync('g:/ITR/makeeazy-landing/v2/index.html','utf8');
const checks = [
  ['Hero form', c.includes('heroForm')],
  ['Qualified CA headline', c.includes('Qualified CA')],
  ['6 persona titles', (c.match(/persona-title/g)||[]).length === 6],
  ['Salaried card', c.includes('Salaried Professional')],
  ['Investor card', c.includes('Investor / Trader')],
  ['Freelancer card', c.includes('Freelancer / Consultant')],
  ['NRI card', c.includes('>NRI<')],
  ['Business card', c.includes('Business Owner')],
  ['Notice card', c.includes('Got a Tax Notice')],
  ['Tax Profiler', c.includes('profilerForm')],
  ['No pricing', !c.includes('plan-price')],
  ['Testimonials (6)', (c.match(/testimonial-card/g)||[]).length === 6],
  ['Exit popup', c.includes('exitPopup')],
  ['WhatsApp link', c.includes('919992819995')],
  ['Trust heading', c.includes('Trusted by Professionals Across India')],
  ['Final CTA updated', c.includes('Your ITR Deserves Expert Attention')],
  ['Booking button updated', c.includes('Book Your Expert Appointment')],
];
checks.forEach(([name, pass]) => console.log(pass ? 'PASS' : 'FAIL', '-', name));
console.log('Total:', checks.filter(x=>x[1]).length + '/' + checks.length);
