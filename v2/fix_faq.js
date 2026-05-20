const fs = require('fs');
const f = 'g:/ITR/makeeazy-landing/v2/index.html';
let c = fs.readFileSync(f, 'utf8');

// Fix FAQ plan mention
let i = c.indexOf('which plan applies');
if (i > 0) {
  // Find the faq-question div containing this text
  let lineStart = c.lastIndexOf('\n', i) + 1;
  let lineEnd = c.indexOf('\n', i);
  let nextLineEnd = c.indexOf('\n', lineEnd + 1);
  let oldBlock = c.substring(lineStart, nextLineEnd);
  
  // Replace with updated copy
  let newBlock = oldBlock
    .replace(/which plan applies to me\?/, 'what kind of filing I need?')
    .replace(/the right plan/, 'the right approach');
  
  c = c.replace(oldBlock, newBlock);
  console.log('FAQ updated');
} else {
  console.log('FAQ plan text not found');
}

fs.writeFileSync(f, c, 'utf8');
