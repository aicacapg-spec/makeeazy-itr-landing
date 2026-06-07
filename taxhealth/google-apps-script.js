// MakeEazy Tax Optimizer - Google Apps Script v8
// Backend: data capture + PDF upload + WhatsApp bot + analytics + email delivery
// Run setup() first to initialize sheets and grant permissions

// ====== RUN THIS FIRST ======
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create TaxOptimizer sheet with 31 columns
  var taxSheet = getOrCreateSheet('TaxOptimizer');
  Logger.log('TaxOptimizer sheet ready: ' + taxSheet.getName());
  
  // Create Reports sheet  
  var repSheet = getOrCreateSheet('Reports');
  Logger.log('Reports sheet ready: ' + repSheet.getName());
  
  // Create UserInputs sheet
  var inputsSheet = getOrCreateSheet('UserInputs');
  Logger.log('UserInputs sheet ready: ' + inputsSheet.getName());
  
  // Create Analytics sheet
  var analyticsSheet = getOrCreateSheet('Analytics');
  Logger.log('Analytics sheet ready: ' + analyticsSheet.getName());
  
  // Test Drive access
  var folders = DriveApp.getFoldersByName('MakeEazy Tax Reports');
  if (folders.hasNext()) {
    Logger.log('Reports folder exists');
  } else {
    var folder = DriveApp.createFolder('MakeEazy Tax Reports');
    Logger.log('Created reports folder: ' + folder.getUrl());
  }
  
  Logger.log('Setup complete! All permissions granted. Now deploy as web app.');
}

// ====== WEB APP HANDLERS ======

function doPost(e) {
  try {
    var data;
    
    // Try multiple parsing strategies for robustness
    try {
      if (e.postData && e.postData.contents) {
        data = JSON.parse(e.postData.contents);
      }
    } catch (p1) {
      Logger.log('Parse attempt 1 failed: ' + p1.message);
    }
    
    if (!data) {
      try {
        if (e.parameter && e.parameter.payload) {
          data = JSON.parse(e.parameter.payload);
        }
      } catch (p2) {
        Logger.log('Parse attempt 2 failed: ' + p2.message);
      }
    }
    
    // sendBeacon with FormData may put data in e.parameters
    if (!data && e.parameters) {
      try {
        var keys = Object.keys(e.parameters);
        if (keys.length === 1) {
          data = JSON.parse(keys[0]);
        }
      } catch (p3) {
        Logger.log('Parse attempt 3 failed: ' + p3.message);
      }
    }
    
    if (!data) {
      Logger.log('All parse attempts failed. postData type: ' + (e.postData ? e.postData.type : 'none'));
      Logger.log('postData contents (first 500): ' + (e.postData ? String(e.postData.contents).substring(0, 500) : 'none'));
      return jsonError('Could not parse request data');
    }
    
    var action = data.action || 'storeData';
    Logger.log('Action: ' + action + ', PAN: ' + (data.pan || 'N/A'));
    
    if (action === 'submitLead') {
      return handleLeadSubmission(data);
    } else {
      return handleDataStore(data);
    }
    
  } catch (err) {
    Logger.log('doPost error: ' + err.message + ' | Stack: ' + err.stack);
    return jsonError(err.message);
  }
}

function doGet(e) {
  e = e || { parameter: {} };
  var action = (e.parameter || {}).action || '';
  var pan = (e.parameter || {}).pan || '';
  var message = (e.parameter || {}).message || '';
  var name = (e.parameter || {}).name || '';
  var phone = (e.parameter || {}).phone || '';
  
  // ====== WHATSAPP BOT — main endpoint for n8n ======
  // Called by n8n with: ?action=whatsapp&message=<raw message>&name=<lead name>&phone=<phone>
  // Extracts PAN from message, looks up report, returns formatted WhatsApp response
  if (action === 'whatsapp') {
    try { message = decodeURIComponent(message); } catch(err) {}
    try { name = decodeURIComponent(name); } catch(err) {}
    return handleWhatsAppRequest(message, name, phone);
  }
  
  // ====== TEST endpoint ======
  if (action === 'test') {
    try { message = decodeURIComponent(message); } catch(err) {}
    return jsonResponse({
      message: "✅ Apps Script v7 is working!\n\nYou sent: " + (message || 'empty') + "\n\n— MakeEazy Test",
      lead_attributes: { loop: "false", name: "", phone: "", email: "" },
      last_response: true
    });
  }
  
  // ====== ANALYTICS endpoint ======
  if (action === 'analytics') {
    return handleAnalytics(e.parameter);
  }
  
  // ====== RAW LOOKUP (returns data JSON, not formatted) ======
  if (action === 'lookup' && pan) return lookupByPan(pan);
  
  return jsonResponse({ message: 'MakeEazy Tax Optimizer API v8', actions: ['whatsapp', 'lookup', 'test', 'analytics'] });
}

// ====== WHATSAPP BOT HANDLER ======

function handleWhatsAppRequest(message, leadName, phone) {
  // Step 1: Extract PAN from message using regex
  var panMatch = (message || '').toUpperCase().match(/[A-Z]{5}[0-9]{4}[A-Z]/);
  
  if (!panMatch) {
    // No PAN found in message — ask for it
    return jsonResponse({
      found: false,
      action: 'no_pan',
      message: "👋 Hi" + (leadName ? " " + leadName : "") + "!\n\n" +
               "I couldn't find a PAN number in your message.\n\n" +
               "Please send your *PAN number* (e.g., ABCPD1234F) and I'll look up your Tax Health Report.\n\n" +
               "Don't have a report yet? Generate your free report here:\n" +
               "🔗 https://itr.makeeazy.in/taxhealth/\n\n" +
               "— MakeEazy Consultants",
      lead_attributes: {
        loop: "true",
        name: leadName || "",
        phone: phone || "",
        email: ""
      },
      last_response: false
    });
  }
  
  var extractedPan = panMatch[0];
  
  // Step 2: Extract name from message if not provided by EasySocial
  var extractedName = leadName || '';
  if (!extractedName || extractedName === 'Undefined') {
    var nameMatch = (message || '').match(/Name[:\s]+([A-Za-z\s]+?)(?:\s*PAN|\s*$)/i);
    if (nameMatch) {
      extractedName = nameMatch[1].trim();
    }
  }
  
  // Step 3: Look up PAN in Google Sheet
  var sheet = getOrCreateSheet('TaxOptimizer');
  var data = sheet.getDataRange().getValues();
  var reportData = null;
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]).toUpperCase() === extractedPan) {
      var pdfUrl = data[i][23] || '';
      var downloadUrl = pdfUrl;
      if (pdfUrl && pdfUrl.indexOf('drive.google.com') > -1) {
        var match = pdfUrl.match(/\/d\/([^\/]+)/);
        if (match) {
          downloadUrl = 'https://drive.google.com/uc?export=download&id=' + match[1];
        }
      }
      reportData = {
        pan: data[i][1],
        name: data[i][2],
        mobile: data[i][3],
        email: data[i][4],
        score: Number(data[i][14]) || 0,
        band: data[i][15] || '',
        regime: data[i][16] || '',
        oldTax: Number(data[i][17]) || 0,
        newTax: Number(data[i][18]) || 0,
        regimeSavings: Number(data[i][19]) || 0,
        totalSavings: Number(data[i][21]) || 0,
        pdfUrl: pdfUrl,
        downloadUrl: downloadUrl
      };
      break;
    }
  }
  
  // Step 4: Format response
  if (!reportData) {
    // PAN not found in database
    return jsonResponse({
      found: false,
      action: 'not_found',
      pan: extractedPan,
      message: "👋 Hi" + (extractedName ? " " + extractedName : "") + "!\n\n" +
               "📊 I looked up PAN: *" + extractedPan + "* but no Tax Health Report was found.\n\n" +
               "Generate your *FREE Tax Health Report* now:\n" +
               "🔗 https://itr.makeeazy.in/taxhealth/\n\n" +
               "✅ Takes just 2 minutes\n" +
               "✅ Upload Form 16 or enter details manually\n" +
               "✅ Get your Tax Health Score + savings opportunities\n\n" +
               "Once generated, send us your PAN again and we'll deliver your report instantly! 📄\n\n" +
               "— MakeEazy Consultants\n" +
               "📞 9992819995 | 🌐 makeeazy.in",
      lead_attributes: {
        loop: "false",
        name: extractedName || "",
        phone: phone || "",
        email: ""
      },
      last_response: true
    });
  }
  
  // Report found — format the beautiful WhatsApp message
  var displayName = reportData.name || extractedName || 'there';
  var score = reportData.score;
  var scoreEmoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴';
  var scoreBand = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Attention' : 'Critical';
  
  var msg = "📊 *Tax Health Report*\n" +
            "━━━━━━━━━━━━━━━━━━\n\n" +
            "👤 *" + displayName + "*\n" +
            "🆔 PAN: " + reportData.pan + "\n\n" +
            scoreEmoji + " *Tax Health Score: " + score + "/100*\n" +
            "📋 Status: *" + scoreBand + "*\n\n" +
            "💰 *Regime Analysis:*\n" +
            "   Old Regime Tax: ₹" + formatINR(reportData.oldTax) + "\n" +
            "   New Regime Tax: ₹" + formatINR(reportData.newTax) + "\n" +
            "   💵 Savings: ₹" + formatINR(reportData.regimeSavings) + "\n" +
            "   ✅ Recommended: *" + (reportData.regime || 'New') + " Regime*\n";
  
  if (reportData.totalSavings > 0) {
    msg += "\n🎯 *Total Potential Savings: ₹" + formatINR(reportData.totalSavings) + "*\n";
  }
  
  if (reportData.pdfUrl) {
    msg += "\n📄 *Download Full Report:*\n" + reportData.pdfUrl + "\n";
  }
  
  msg += "\n━━━━━━━━━━━━━━━━━━\n" +
         "Want expert help filing your ITR?\n" +
         "Visit: https://desk.makeeazy.in\n\n" +
         "— *MakeEazy Consultants*\n" +
         "📞 9992819995 | 🌐 makeeazy.in";
  
  return jsonResponse({
    found: true,
    action: 'report_sent',
    pan: reportData.pan,
    score: score,
    message: msg,
    lead_attributes: {
      loop: "false",
      name: displayName,
      phone: phone || reportData.mobile || "",
      email: reportData.email || ""
    },
    last_response: true
  });
}

// ====== FORMAT INR (Indian number format) ======
function formatINR(num) {
  if (!num || num === 0) return '0';
  num = Math.round(num);
  var str = num.toString();
  var lastThree = str.substring(str.length - 3);
  var otherNumbers = str.substring(0, str.length - 3);
  if (otherNumbers !== '') {
    lastThree = ',' + lastThree;
  }
  return otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + lastThree;
}

// ====== DATA STORE (initial — no lead contact yet) ======

function handleDataStore(data) {
  var sheet = getOrCreateSheet('TaxOptimizer');
  var existingRow = findRowByPan(sheet, data.pan);
  var row = buildRow(data);
  
  // Log user inputs for every submission
  logUserInputs(data);
  
  if (existingRow > 0) {
    // Get current attempt count and increment
    var currentData = sheet.getRange(existingRow, 1, 1, 31).getValues()[0];
    var attempts = (Number(currentData[30]) || 0) + 1;
    row[0] = currentData[0]; // Keep original timestamp
    row[29] = new Date().toISOString(); // Update last_updated
    row[30] = attempts;
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    Logger.log('Updated existing row ' + existingRow + ' for PAN: ' + (data.pan || 'N/A') + ' (attempt ' + attempts + ')');
    return jsonResponse({ row: existingRow, status: 'updated', attempts: attempts });
  } else {
    row[29] = new Date().toISOString();
    row[30] = 1;
    sheet.appendRow(row);
    var rowNum = sheet.getLastRow();
    Logger.log('New data stored: row ' + rowNum + ', PAN: ' + (data.pan || 'N/A'));
    return jsonResponse({ row: rowNum, status: 'stored' });
  }
}

// ====== LEAD SUBMISSION (with WhatsApp + Email + PDF) ======

function handleLeadSubmission(data) {
  var sheet = getOrCreateSheet('TaxOptimizer');
  
  // Try to find existing row by PAN and update it
  var existingRow = findRowByPan(sheet, data.pan);
  
  var pdfUrl = '';
  
  // Save PDF to Drive if provided
  if (data.pdfBase64) {
    try {
      pdfUrl = savePdfToDrive(data.pan, data.name, data.pdfBase64);
      Logger.log('PDF saved: ' + pdfUrl);
    } catch (pdfErr) {
      Logger.log('PDF save error: ' + pdfErr.message);
      pdfUrl = 'Error: ' + pdfErr.message;
    }
  }
  
  // Log user inputs for every submission
  logUserInputs(data);
  
  // Build the full row with lead data + PDF URL
  var row = buildRow(data);
  row[23] = pdfUrl; // Column 24: PDF Report URL (0-indexed = 23)
  
  if (existingRow > 0) {
    // Preserve original timestamp and increment attempt count
    var currentData = sheet.getRange(existingRow, 1, 1, 31).getValues()[0];
    var attempts = (Number(currentData[30]) || 0) + 1;
    row[0] = currentData[0]; // Keep original timestamp
    row[29] = new Date().toISOString(); // Update last_updated
    row[30] = attempts;
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    Logger.log('Updated row ' + existingRow + ' with lead data (attempt ' + attempts + ')');
  } else {
    // New row
    row[29] = new Date().toISOString();
    row[30] = 1;
    sheet.appendRow(row);
    existingRow = sheet.getLastRow();
    Logger.log('New lead row: ' + existingRow);
  }
  
  // Also log to Reports sheet
  if (pdfUrl && !pdfUrl.startsWith('Error')) {
    var repSheet = getOrCreateSheet('Reports');
    repSheet.appendRow([
      new Date().toISOString(),
      data.name || '',
      data.pan || '',
      data.mobile || '',
      data.email || '',
      pdfUrl,
      data.regime || '',
      data.score || 0,
      'Delivered',
      '',   // Contacted
      '',   // Assigned CA
      '',   // Filing Status
      ''    // Revenue
    ]);
  }
  
  // Send email with report
  sendReportEmail(
    data.email,
    data.name,
    data.pan,
    Number(data.score) || 0,
    data.regime || '',
    Number(data.regimeSavings) || 0,
    pdfUrl,
    Number(data.totalSavings) || 0
  );
  
  return jsonResponse({ row: existingRow, pdfUrl: pdfUrl, status: 'lead_captured' });
}

// ====== BUILD ROW (31 columns) ======

function buildRow(data) {
  return [
    new Date().toISOString(),                                    // 1. Timestamp
    data.pan || '',                                               // 2. PAN
    data.name || '',                                              // 3. Full Name
    data.mobile || '',                                            // 4. WhatsApp Number
    data.email || '',                                             // 5. Email
    data.incomeType || '',                                        // 6. Income Type
    Number(data.grossIncome) || 0,                                // 7. Gross Income
    Number(data.basicSalary) || 0,                                // 8. Basic Salary
    Number(data.hra) || 0,                                        // 9. HRA
    Number(data.specialAllowance) || 0,                           // 10. Special Allowance
    Number(data.sec80C) || 0,                                     // 11. 80C Deductions
    Number(data.healthIns) || 0,                                  // 12. Health Insurance
    Number(data.homeLoan) || 0,                                   // 13. Home Loan Interest
    data.otherInputs || '',                                       // 14. Other Inputs JSON
    Number(data.score) || 0,                                      // 15. Tax Health Score
    data.band || '',                                              // 16. Score Band
    data.regime || '',                                            // 17. Recommended Regime
    Number(data.oldTax) || 0,                                     // 18. Old Regime Tax
    Number(data.newTax) || 0,                                     // 19. New Regime Tax
    Number(data.regimeSavings) || 0,                              // 20. Regime Savings
    Number(data.insightCount) || 0,                               // 21. Insight Count
    Number(data.totalSavings) || 0,                               // 22. Total Potential Savings
    data.reportData || '',                                        // 23. Report Data JSON
    '',                                                           // 24. PDF Report URL (filled later for leads)
    data.utmSource || '',                                         // 25. UTM Source
    data.utmMedium || '',                                         // 26. UTM Medium
    data.utmCampaign || '',                                       // 27. UTM Campaign
    data.device || '',                                            // 28. Device
    data.referrer || '',                                           // 29. Referrer
    data.lastUpdated || new Date().toISOString(),                  // 30. Last Updated
    Number(data.attemptCount) || 1                                 // 31. Attempt Count
  ];
}

// ====== PDF SAVE TO DRIVE ======

function savePdfToDrive(pan, name, base64Data) {
  var folders = DriveApp.getFoldersByName('MakeEazy Tax Reports');
  var folder;
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder('MakeEazy Tax Reports');
  }
  
  var safeName = (name || '').replace(/[^a-zA-Z]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  var fileName = 'MakeEazy_TaxHealth_' + (pan || 'UNKNOWN') + '_' + (safeName || 'User') + '.pdf';
  
  var decoded = Utilities.base64Decode(base64Data);
  var blob = Utilities.newBlob(decoded, 'application/pdf', fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return file.getUrl();
}

// ====== HELPERS ======

function findRowByPan(sheet, pan) {
  if (!pan) return -1;
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]).toUpperCase() === pan.toUpperCase()) {
      return i + 1; // 1-indexed
    }
  }
  return -1;
}

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (name === 'TaxOptimizer') {
      sheet.appendRow([
        'Timestamp', 'PAN', 'Full Name', 'WhatsApp', 'Email',
        'Income Type', 'Gross Income', 'Basic Salary', 'HRA', 'Special Allowance',
        '80C Deductions', 'Health Insurance', 'Home Loan Interest', 'Other Inputs JSON',
        'Tax Health Score', 'Score Band', 'Recommended Regime',
        'Old Regime Tax', 'New Regime Tax', 'Regime Savings',
        'Insight Count', 'Total Potential Savings', 'Report Data JSON',
        'PDF Report URL',
        'UTM Source', 'UTM Medium', 'UTM Campaign', 'Device', 'Referrer',
        'Last Updated', 'Attempt Count'
      ]);
      sheet.getRange(1, 1, 1, 31).setFontWeight('bold').setBackground('#32509F').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    } else if (name === 'Reports') {
      sheet.appendRow([
        'Timestamp', 'Name', 'PAN', 'WhatsApp', 'Email', 'PDF URL', 'Regime', 'Score', 'Status',
        'Contacted', 'Assigned CA', 'Filing Status', 'Revenue'
      ]);
      sheet.getRange(1, 1, 1, 13).setFontWeight('bold').setBackground('#32509F').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    } else if (name === 'UserInputs') {
      sheet.appendRow([
        'Timestamp', 'PAN', 'Income Type', 'Basic Salary', 'DA', 'HRA', 'Rent Paid',
        'City Type', 'Age Category', 'LTA', 'Special Allowance', 'Prof Tax',
        'Employer NPS', 'Interest Income', 'Other Income', 'Agri Income', 'Family Pension',
        'Has SOP', 'Home Loan SOP', 'Rental Income', 'Municipal Tax', 'Home Loan LetOut',
        'STCG Equity', 'STCG Other', 'LTCG Equity', 'LTCG Other',
        'Business Type', 'Turnover', 'Presumptive Rate',
        '80C', '80CCD1B', '80D Self', '80D Parents', '80E', '80G', '80GG', '80TTA',
        '80DD', '80U', '80DDB', 'Form16 Uploaded'
      ]);
      sheet.getRange(1, 1, 1, 41).setFontWeight('bold').setBackground('#32509F').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    } else if (name === 'Analytics') {
      sheet.appendRow([
        'Timestamp', 'Event', 'PAN', 'Device', 'Source', 'Medium', 'Campaign', 'Content', 'Referrer', 'Extra'
      ]);
      sheet.getRange(1, 1, 1, 10).setFontWeight('bold').setBackground('#32509F').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function lookupByPan(pan) {
  var sheet = getOrCreateSheet('TaxOptimizer');
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (String(data[i][1]).toUpperCase() === pan.toUpperCase()) {
      var pdfUrl = data[i][23] || '';
      // Convert Drive view URL to direct download URL
      var downloadUrl = pdfUrl;
      if (pdfUrl && pdfUrl.indexOf('drive.google.com') > -1) {
        var match = pdfUrl.match(/\/d\/([^\/]+)/);
        if (match) {
          downloadUrl = 'https://drive.google.com/uc?export=download&id=' + match[1];
        }
      }
      return jsonResponse({
        found: true,
        row: i + 1,
        pan: data[i][1],
        name: data[i][2],
        mobile: data[i][3],
        email: data[i][4],
        score: data[i][14],
        regime: data[i][16],
        oldTax: data[i][17],
        newTax: data[i][18],
        regimeSavings: data[i][19],
        totalSavings: data[i][21],
        pdfUrl: pdfUrl,
        downloadUrl: downloadUrl
      });
    }
  }
  return jsonResponse({ found: false });
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ====== LOG USER INPUTS ======

function logUserInputs(data) {
  var sheet = getOrCreateSheet('UserInputs');
  var inputs = {};
  try { inputs = JSON.parse(data.otherInputs || '{}'); } catch(e) {}
  sheet.appendRow([
    new Date().toISOString(),
    data.pan || '',
    data.incomeType || '',
    Number(inputs.basicSalary) || 0,
    Number(inputs.da) || 0,
    Number(inputs.hra) || 0,
    Number(inputs.rentPaid) || 0,
    inputs.cityType || '',
    inputs.ageCategory || '',
    Number(inputs.lta) || 0,
    Number(inputs.specialAllowance) || 0,
    Number(inputs.profTax) || 0,
    Number(inputs.employerNPS) || 0,
    Number(inputs.interestIncome) || 0,
    Number(inputs.otherIncome) || 0,
    Number(inputs.agriIncome) || 0,
    Number(inputs.familyPension) || 0,
    inputs.hasSOP || 'no',
    Number(inputs.homeLoanSOP) || 0,
    Number(inputs.letOutRent) || 0,
    Number(inputs.municipalTax) || 0,
    Number(inputs.homeLoanLetOut) || 0,
    Number(inputs.stcgEquity) || 0,
    Number(inputs.stcgOther) || 0,
    Number(inputs.ltcgEquity) || 0,
    Number(inputs.ltcgOther) || 0,
    inputs.businessType || 'none',
    Number(inputs.businessTurnover) || 0,
    inputs.presumptiveRate || '',
    Number(inputs.sec80C) || 0,
    Number(inputs.sec80CCD1B) || 0,
    Number(inputs.healthInsSelf) || 0,
    Number(inputs.healthInsParents) || 0,
    Number(inputs.sec80E) || 0,
    Number(inputs.sec80G) || 0,
    Number(inputs.sec80GG) || 0,
    Number(inputs.sec80TTA) || 0,
    inputs.sec80DD || '0',
    inputs.sec80U || '0',
    Number(inputs.sec80DDB) || 0,
    data.formUploaded || 'No'
  ]);
}

// ====== ANALYTICS HANDLER ======

function handleAnalytics(params) {
  try {
    var sheet = getOrCreateSheet('Analytics');
    sheet.appendRow([
      new Date().toISOString(),
      decodeURIComponent(params.event || ''),
      decodeURIComponent(params.pan || ''),
      decodeURIComponent(params.device || ''),
      decodeURIComponent(params.source || ''),
      decodeURIComponent(params.medium || ''),
      decodeURIComponent(params.campaign || ''),
      decodeURIComponent(params.content || ''),
      decodeURIComponent(params.referrer || ''),
      decodeURIComponent(params.extra || '')
    ]);
  } catch(e) {
    Logger.log('Analytics error: ' + e.message);
  }
  return jsonResponse({ status: 'tracked' });
}

// ====== EMAIL DELIVERY ======

function sendReportEmail(email, name, pan, score, regime, savings, pdfUrl, totalSavings) {
  if (!email || !email.includes('@')) return;
  
  var displayName = name || 'there';
  var scoreEmoji = score >= 80 ? '🟢' : score >= 60 ? '🟡' : score >= 40 ? '🟠' : '🔴';
  var scoreBand = score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Needs Attention' : 'Critical';
  
  var htmlBody = '<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="margin:0;padding:0;font-family:Arial,Helvetica,sans-serif;background:#f5f5f5">' +
    '<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#ffffff">' +
    
    // Header
    '<tr><td style="background:#1a2b5f;padding:28px 32px;text-align:center">' +
    '<div style="font-size:24px;font-weight:bold;color:#ffffff;letter-spacing:1px">MakeEazy</div>' +
    '<div style="font-size:12px;color:#a0b0d0;margin-top:4px">Tax Optimization Report</div>' +
    '</td></tr>' +
    
    // Orange accent line
    '<tr><td style="background:#FF6B35;height:4px"></td></tr>' +
    
    // Greeting
    '<tr><td style="padding:32px 32px 16px">' +
    '<div style="font-size:20px;font-weight:bold;color:#1a2b5f">Hi ' + displayName + ',</div>' +
    '<div style="font-size:15px;color:#555;margin-top:8px;line-height:1.6">Your Tax Health Report for FY 2025-26 has been generated. Here are your key findings:</div>' +
    '</td></tr>' +
    
    // Score Card
    '<tr><td style="padding:0 32px 20px"><table width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #e8e8e8;border-radius:12px;overflow:hidden">' +
    '<tr><td style="padding:20px;text-align:center;background:#f8f9fc">' +
    '<div style="font-size:14px;color:#888;font-weight:600">TAX HEALTH SCORE</div>' +
    '<div style="font-size:42px;font-weight:800;color:#1a2b5f;margin:8px 0">' + scoreEmoji + ' ' + score + '/100</div>' +
    '<div style="font-size:14px;font-weight:700;color:#555">' + scoreBand + '</div>' +
    '</td></tr>' +
    '<tr><td style="padding:16px 20px;background:#ffffff">' +
    '<table width="100%"><tr>' +
    '<td style="font-size:13px;color:#888">Recommended Regime</td>' +
    '<td style="font-size:13px;font-weight:700;color:#1a2b5f;text-align:right">' + (regime || 'New') + ' Regime</td>' +
    '</tr>' +
    (savings > 0 ? '<tr><td style="font-size:13px;color:#888;padding-top:8px">Regime Savings</td><td style="font-size:13px;font-weight:700;color:#22c55e;text-align:right">Rs. ' + formatINR(savings) + '</td></tr>' : '') +
    (totalSavings > 0 ? '<tr><td style="font-size:13px;color:#888;padding-top:8px">Total Potential Savings</td><td style="font-size:14px;font-weight:800;color:#FF6B35;text-align:right">Rs. ' + formatINR(totalSavings) + '</td></tr>' : '') +
    '</table></td></tr></table></td></tr>' +
    
    // PDF Download
    (pdfUrl ? '<tr><td style="padding:0 32px 24px;text-align:center">' +
    '<a href="' + pdfUrl + '" style="display:inline-block;background:#1a2b5f;color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:8px;font-size:15px;font-weight:700">📄 Download Full Report (PDF)</a>' +
    '</td></tr>' : '') +
    
    // Divider
    '<tr><td style="padding:0 32px"><div style="border-top:1px solid #eee"></div></td></tr>' +
    
    // CTA Section
    '<tr><td style="padding:24px 32px">' +
    '<div style="font-size:18px;font-weight:800;color:#1a2b5f;margin-bottom:12px">What happens next?</div>' +
    '<div style="font-size:14px;color:#555;line-height:1.7;margin-bottom:20px">' +
    'Your report has identified real savings opportunities. Our CA-led team can help you claim every rupee — from regime optimization to missed deductions.' +
    '</div>' +
    
    // 3 Steps
    '<table width="100%" cellpadding="0" cellspacing="0">' +
    '<tr><td style="padding:10px 0"><table><tr>' +
    '<td style="background:#FF6B35;color:#fff;font-weight:bold;width:28px;height:28px;text-align:center;border-radius:50%;font-size:14px;vertical-align:middle">1</td>' +
    '<td style="padding-left:12px;font-size:13px;color:#333"><strong>Create your account</strong> — Upload documents securely</td>' +
    '</tr></table></td></tr>' +
    '<tr><td style="padding:10px 0"><table><tr>' +
    '<td style="background:#FF6B35;color:#fff;font-weight:bold;width:28px;height:28px;text-align:center;border-radius:50%;font-size:14px;vertical-align:middle">2</td>' +
    '<td style="padding-left:12px;font-size:13px;color:#333"><strong>Get assigned a CA</strong> — Your dedicated professional reviews everything</td>' +
    '</tr></table></td></tr>' +
    '<tr><td style="padding:10px 0"><table><tr>' +
    '<td style="background:#FF6B35;color:#fff;font-weight:bold;width:28px;height:28px;text-align:center;border-radius:50%;font-size:14px;vertical-align:middle">3</td>' +
    '<td style="padding-left:12px;font-size:13px;color:#333"><strong>File with confidence</strong> — Optimised filing + 3 years notice support</td>' +
    '</tr></table></td></tr>' +
    '</table>' +
    '</td></tr>' +
    
    // Primary CTA Button
    '<tr><td style="padding:8px 32px 32px;text-align:center">' +
    '<a href="https://desk.makeeazy.in" style="display:inline-block;background:#FF6B35;color:#ffffff;text-decoration:none;padding:16px 40px;border-radius:8px;font-size:16px;font-weight:800;letter-spacing:0.5px">Create Your Free Account →</a>' +
    '<div style="font-size:12px;color:#999;margin-top:10px">No payment required to get started</div>' +
    '</td></tr>' +
    
    // Footer
    '<tr><td style="background:#f8f9fc;padding:24px 32px;border-top:1px solid #eee">' +
    '<table width="100%"><tr>' +
    '<td style="font-size:12px;color:#888;line-height:1.6">' +
    '<strong style="color:#1a2b5f">MakeEazy Consultants</strong><br>' +
    'Professional Tax Filing & Advisory<br>' +
    '<a href="https://makeeazy.in" style="color:#FF6B35;text-decoration:none">makeeazy.in</a> · ' +
    '<a href="https://wa.me/919992819995" style="color:#FF6B35;text-decoration:none">WhatsApp</a> · ' +
    '+91-9992819995' +
    '</td>' +
    '<td style="text-align:right;vertical-align:top">' +
    '<a href="https://desk.makeeazy.in" style="color:#FF6B35;text-decoration:none;font-size:12px;font-weight:700">desk.makeeazy.in</a>' +
    '</td></tr></table></td></tr>' +
    
    '</table></body></html>';
  
  try {
    MailApp.sendEmail({
      to: email,
      subject: displayName + ', your Tax Health Report is ready (' + scoreEmoji + ' Score: ' + score + '/100)',
      htmlBody: htmlBody
    });
    Logger.log('Email sent to: ' + email);
  } catch(emailErr) {
    Logger.log('Email send error: ' + emailErr.message);
  }
}
