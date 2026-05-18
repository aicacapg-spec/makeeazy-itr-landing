// MakeEazy Tax Optimizer - Google Apps Script v6
// Clean backend: data capture + PDF upload from client
// Run setup() first to initialize sheets and grant permissions

// ====== RUN THIS FIRST ======
function setup() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create TaxOptimizer sheet with 29 columns
  var taxSheet = getOrCreateSheet('TaxOptimizer');
  Logger.log('TaxOptimizer sheet ready: ' + taxSheet.getName());
  
  // Create Reports sheet  
  var repSheet = getOrCreateSheet('Reports');
  Logger.log('Reports sheet ready: ' + repSheet.getName());
  
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
  var action = (e.parameter || {}).action;
  var pan = (e.parameter || {}).pan;
  
  if (action === 'lookup' && pan) return lookupByPan(pan);
  
  return jsonResponse({ message: 'MakeEazy Tax Optimizer API v6' });
}

// ====== DATA STORE (initial — no lead contact yet) ======

function handleDataStore(data) {
  var sheet = getOrCreateSheet('TaxOptimizer');
  var row = buildRow(data);
  sheet.appendRow(row);
  var rowNum = sheet.getLastRow();
  Logger.log('Data stored: row ' + rowNum + ', PAN: ' + (data.pan || 'N/A'));
  return jsonResponse({ row: rowNum, status: 'stored' });
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
  
  // Build the full row with lead data + PDF URL
  var row = buildRow(data);
  row[23] = pdfUrl; // Column 24: PDF Report URL (0-indexed = 23)
  
  if (existingRow > 0) {
    // Update existing row
    sheet.getRange(existingRow, 1, 1, row.length).setValues([row]);
    Logger.log('Updated row ' + existingRow + ' with lead data');
  } else {
    // Append new row
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
      'Delivered'
    ]);
  }
  
  return jsonResponse({ row: existingRow, pdfUrl: pdfUrl, status: 'lead_captured' });
}

// ====== BUILD ROW (29 columns) ======

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
    data.referrer || ''                                            // 29. Referrer
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
  
  var ts = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd_HHmmss');
  var fileName = 'TaxReport_' + (pan || 'UNKNOWN') + '_' + ts + '.pdf';
  
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
        'UTM Source', 'UTM Medium', 'UTM Campaign', 'Device', 'Referrer'
      ]);
      sheet.getRange(1, 1, 1, 29).setFontWeight('bold').setBackground('#32509F').setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
    } else if (name === 'Reports') {
      sheet.appendRow([
        'Timestamp', 'Name', 'PAN', 'WhatsApp', 'Email', 'PDF URL', 'Regime', 'Score', 'Status'
      ]);
      sheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#32509F').setFontColor('#FFFFFF');
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
      return jsonResponse({
        found: true,
        row: i + 1,
        pan: data[i][1],
        name: data[i][2],
        score: data[i][14],
        pdfUrl: data[i][23]
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
