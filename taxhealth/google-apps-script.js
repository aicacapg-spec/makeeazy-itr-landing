// MakeEazy Tax Optimizer - Google Apps Script v5
// Run setup() first to initialize sheets and grant permissions

// ====== RUN THIS FIRST ======
function setup() {
  // This function triggers all permission requests at once
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create TaxOptimizer sheet
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
  
  // Test SpreadsheetApp.create (needed for PDF export)
  var testSS = SpreadsheetApp.create('_MakeEazy_PermTest');
  var testFile = DriveApp.getFileById(testSS.getId());
  var testPdf = testFile.getAs('application/pdf');
  testFile.setTrashed(true);
  Logger.log('PDF export test: OK (' + testPdf.getBytes().length + ' bytes)');
  
  Logger.log('Setup complete! All permissions granted. Now deploy as web app.');
}

// ====== WEB APP HANDLERS ======

function doPost(e) {
  try {
    var data;
    if (e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else {
      data = JSON.parse(e.postData.contents);
    }
    
    // Handle email update
    if (data.type === 'email_fallback') {
      var s = getOrCreateSheet('TaxOptimizer');
      updateEmailForPan(s, data.pan, data.email);
      return jsonResponse({ type: 'email_updated' });
    }
    
    // Store lead data
    var sheet = getOrCreateSheet('TaxOptimizer');
    var row = [
      new Date().toISOString(),
      data.pan || '',
      data.name || '',
      data.mobile || '',
      data.email || '',
      data.incomeType || '',
      data.score || 0,
      data.band || '',
      data.insightCount || 0,
      data.totalSavings || 0,
      data.regime || '',
      data.regimeSavings || 0,
      data.oldTax || 0,
      data.newTax || 0,
      data.reportData || '',
      ''
    ];
    sheet.appendRow(row);
    var dataRow = sheet.getLastRow();
    
    // Auto-generate PDF
    var pdfUrl = '';
    if (data.reportData) {
      try {
        var rd = JSON.parse(data.reportData);
        pdfUrl = buildPdf(data.pan, data.name, data, rd);
        sheet.getRange(dataRow, 16).setValue(pdfUrl);
        
        var repSheet = getOrCreateSheet('Reports');
        repSheet.appendRow([
          new Date().toISOString(),
          data.name || '',
          data.pan || '',
          pdfUrl,
          data.regime || '',
          data.score || 0,
          'Ready'
        ]);
      } catch (pdfErr) {
        Logger.log('PDF error: ' + pdfErr.message);
        sheet.getRange(dataRow, 16).setValue('Error: ' + pdfErr.message);
      }
    }
    
    return jsonResponse({ row: dataRow, pdfUrl: pdfUrl });
    
  } catch (err) {
    return jsonError(err.message);
  }
}

function doGet(e) {
  var action = (e.parameter || {}).action;
  var pan = (e.parameter || {}).pan;
  
  if (action === 'lookup' && pan) return lookupByPan(pan);
  if (action === 'regenerate' && pan) return regeneratePdf(pan);
  
  return jsonResponse({ message: 'MakeEazy Tax Optimizer API v5' });
}

// ====== PDF GENERATION ======

function buildPdf(pan, name, summary, reportData) {
  var tax = reportData.taxResult || {};
  var ins = reportData.insights || {};
  var inputs = reportData.inputs || {};
  var oldTax = tax.old || {};
  var newTax = tax.new || {};
  var rec = tax.recommendation || 'new';
  var score = Number(ins.score || summary.score || 0);
  var band = ins.band || summary.band || '';
  var insights = ins.insights || [];
  var bestLabel = (rec === 'old') ? 'Old Regime' : 'New Regime';
  
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var ts = ss.insertSheet('_PDF_' + Date.now());
  
  try {
    ts.setColumnWidth(1, 25);
    ts.setColumnWidth(2, 200);
    ts.setColumnWidth(3, 150);
    ts.setColumnWidth(4, 150);
    ts.setColumnWidth(5, 25);
    
    var r = 1;
    
    // Colors
    var NV = '#32509F';
    var OR = '#F77F00';
    var GR = '#16a34a';
    var RD = '#dc2626';
    var GY = '#64748b';
    var WH = '#FFFFFF';
    var LT = '#F0F4FF';
    
    // Header
    ts.getRange(r, 1, 1, 5).merge().setValue('MAKEEAZY').setBackground(NV)
      .setFontColor(WH).setFontSize(22).setFontWeight('bold').setHorizontalAlignment('center');
    ts.setRowHeight(r, 45);
    r = r + 1;
    
    ts.getRange(r, 1, 1, 5).merge().setValue('Tax Optimization Report').setBackground(NV)
      .setFontColor(OR).setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');
    r = r + 1;
    
    ts.getRange(r, 1, 1, 5).merge().setValue('FY 2025-26  |  AY 2026-27').setBackground(NV)
      .setFontColor('#94A3B8').setFontSize(9).setHorizontalAlignment('center');
    r = r + 2;
    
    // User info
    var info = [
      ['Taxpayer', name || 'Not provided'],
      ['PAN', pan],
      ['Income Source', inputs._incomeType || inputs.incomeType || 'Salaried'],
      ['Report Date', Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy')]
    ];
    for (var i = 0; i < info.length; i++) {
      ts.getRange(r, 2).setValue(info[i][0]).setFontColor(GY).setFontSize(9);
      ts.getRange(r, 3, 1, 2).merge().setValue(info[i][1]).setFontColor(NV).setFontSize(10).setFontWeight('bold');
      r = r + 1;
    }
    r = r + 1;
    
    // Score bar
    var sc = score > 80 ? GR : (score > 60 ? OR : RD);
    ts.getRange(r, 2, 1, 3).merge()
      .setValue('TAX HEALTH SCORE:  ' + score + '/100  -  ' + band)
      .setFontSize(14).setFontWeight('bold').setFontColor(WH).setBackground(sc)
      .setHorizontalAlignment('center');
    ts.setRowHeight(r, 35);
    r = r + 2;
    
    // Regime comparison header
    ts.getRange(r, 2, 1, 3).merge().setValue('Regime Comparison')
      .setFontSize(13).setFontWeight('bold').setFontColor(NV);
    r = r + 1;
    
    // Table header
    ts.getRange(r, 2).setValue('').setBackground(NV).setFontColor(WH).setFontWeight('bold').setFontSize(9);
    ts.getRange(r, 3).setValue('Old Regime').setBackground(NV).setFontColor(WH).setFontWeight('bold').setFontSize(9).setHorizontalAlignment('right');
    ts.getRange(r, 4).setValue('New Regime').setBackground(NV).setFontColor(WH).setFontWeight('bold').setFontSize(9).setHorizontalAlignment('right');
    r = r + 1;
    
    // Table rows
    var trows = [
      ['Gross Income', fmtNum(oldTax.grossSalary), fmtNum(newTax.grossSalary)],
      ['Standard Deduction', fmtNum(oldTax.stdDeduction), fmtNum(newTax.stdDeduction)],
      ['Net Income', fmtNum(oldTax.normalIncome), fmtNum(newTax.normalIncome)],
      ['Deductions (Ch VI-A)', fmtNum(oldTax.totalDeductions), fmtNum(newTax.totalDeductions)],
      ['Taxable Income', fmtNum(oldTax.taxableTotal), fmtNum(newTax.taxableTotal)],
      ['Tax on Income', fmtNum(oldTax.normalTax), fmtNum(newTax.normalTax)],
      ['Rebate u/s 87A', fmtNum(oldTax.rebate), fmtNum(newTax.rebate)],
      ['Health and Edu Cess', fmtNum(oldTax.cess), fmtNum(newTax.cess)],
      ['TOTAL TAX', fmtNum(oldTax.roundedTax), fmtNum(newTax.roundedTax)]
    ];
    
    for (var i = 0; i < trows.length; i++) {
      var bg = (i % 2 === 0) ? WH : LT;
      var fw = (i === trows.length - 1) ? 'bold' : 'normal';
      ts.getRange(r, 2).setValue(trows[i][0]).setFontSize(9).setFontColor(NV).setBackground(bg).setFontWeight(fw);
      var oldBg = (rec === 'old') ? '#F0FDF4' : bg;
      var newBg = (rec === 'new') ? '#F0FDF4' : bg;
      ts.getRange(r, 3).setValue(trows[i][1]).setFontSize(9).setFontColor(NV).setBackground(oldBg).setFontWeight(fw).setHorizontalAlignment('right');
      ts.getRange(r, 4).setValue(trows[i][2]).setFontSize(9).setFontColor(NV).setBackground(newBg).setFontWeight(fw).setHorizontalAlignment('right');
      r = r + 1;
    }
    r = r + 1;
    
    // Savings bar
    ts.getRange(r, 2, 1, 3).merge()
      .setValue(bestLabel + ' saves you ' + fmtNum(tax.absSavings))
      .setFontSize(13).setFontWeight('bold').setFontColor(WH).setBackground(GR)
      .setHorizontalAlignment('center');
    ts.setRowHeight(r, 32);
    r = r + 2;
    
    // Insights
    if (insights.length > 0) {
      ts.getRange(r, 2, 1, 3).merge().setValue('Tax Insights')
        .setFontSize(13).setFontWeight('bold').setFontColor(NV);
      r = r + 1;
      
      for (var i = 0; i < insights.length; i++) {
        var insight = insights[i];
        var tl = 'INFO';
        var tc = GY;
        if (insight.type === 'risk') { tl = 'RISK'; tc = RD; }
        if (insight.type === 'opportunity') { tl = 'OPPORTUNITY'; tc = OR; }
        if (insight.type === 'good') { tl = 'HEALTHY'; tc = GR; }
        
        var impactStr = (insight.impact > 0) ? ('  -  Impact: ' + fmtNum(insight.impact)) : '';
        ts.getRange(r, 2, 1, 3).merge()
          .setValue('[' + tl + '] ' + insight.title + impactStr)
          .setFontSize(10).setFontWeight('bold').setFontColor(tc);
        r = r + 1;
        
        if (insight.detail) {
          ts.getRange(r, 2, 1, 3).merge()
            .setValue('    ' + insight.detail)
            .setFontSize(8).setFontColor(GY).setWrap(true);
          r = r + 1;
        }
        r = r + 1;
      }
      
      if (ins.totalPotentialSavings > 0) {
        ts.getRange(r, 2, 1, 3).merge()
          .setValue('Total Potential Savings: ' + fmtNum(ins.totalPotentialSavings))
          .setFontSize(12).setFontWeight('bold').setFontColor(GR).setHorizontalAlignment('center');
        r = r + 1;
      }
      r = r + 1;
    }
    
    // Next steps
    ts.getRange(r, 2, 1, 3).merge().setValue('Next Steps')
      .setFontSize(13).setFontWeight('bold').setFontColor(NV);
    r = r + 1;
    
    var steps = [
      '1. Talk to a Tax Expert - Free 15-min consultation',
      '2. WhatsApp Us - wa.me/919992819995',
      '3. Get Your ITR Filed - CA-backed filing at makeeazy.in'
    ];
    for (var s = 0; s < steps.length; s++) {
      ts.getRange(r, 2, 1, 3).merge().setValue(steps[s]).setFontSize(9).setFontColor(NV);
      r = r + 1;
    }
    r = r + 1;
    
    // Footer
    ts.getRange(r, 2, 1, 3).merge()
      .setValue('Disclaimer: For informational purposes only. Consult a qualified CA.')
      .setFontSize(7).setFontColor(GY).setHorizontalAlignment('center');
    r = r + 1;
    ts.getRange(r, 2, 1, 3).merge()
      .setValue('Generated by MakeEazy  |  www.makeeazy.in  |  +91-9992819995')
      .setFontSize(8).setFontColor(NV).setFontWeight('bold').setHorizontalAlignment('center');
    
    // Export as PDF
    SpreadsheetApp.flush();
    
    var tempSS = SpreadsheetApp.create('_TempReport_' + pan);
    var copied = ts.copyTo(tempSS);
    var sheets = tempSS.getSheets();
    for (var i = 0; i < sheets.length; i++) {
      if (sheets[i].getName() !== copied.getName()) {
        tempSS.deleteSheet(sheets[i]);
      }
    }
    
    var tempFile = DriveApp.getFileById(tempSS.getId());
    var pdfBlob = tempFile.getAs('application/pdf');
    pdfBlob.setName('TaxReport_' + pan + '_' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd_HHmm') + '.pdf');
    
    var folder = getReportsFolder();
    var pdfFile = folder.createFile(pdfBlob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    tempFile.setTrashed(true);
    
    return pdfFile.getUrl();
    
  } finally {
    ss.deleteSheet(ts);
  }
}

// ====== HELPERS ======

function fmtNum(n) {
  var num = Math.round(Number(n) || 0);
  return 'Rs.' + num.toLocaleString('en-IN');
}

function getReportsFolder() {
  var folders = DriveApp.getFoldersByName('MakeEazy Tax Reports');
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder('MakeEazy Tax Reports');
}

function regeneratePdf(pan) {
  var sheet = getOrCreateSheet('TaxOptimizer');
  var data = sheet.getDataRange().getValues();
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === pan) {
      var rdStr = data[i][14];
      if (!rdStr) return jsonError('No report data for PAN: ' + pan);
      
      var rd = JSON.parse(rdStr);
      var pdfUrl = buildPdf(pan, data[i][2], {
        score: data[i][6], band: data[i][7], regime: data[i][10]
      }, rd);
      
      sheet.getRange(i + 1, 16).setValue(pdfUrl);
      
      var repSheet = getOrCreateSheet('Reports');
      repSheet.appendRow([
        new Date().toISOString(), data[i][2] || '', pan, pdfUrl,
        data[i][10] || '', data[i][6] || 0, 'Ready'
      ]);
      
      return jsonResponse({ status: 'regenerated', pdfUrl: pdfUrl });
    }
  }
  return jsonError('PAN not found: ' + pan);
}

function lookupByPan(pan) {
  var sheet = getOrCreateSheet('TaxOptimizer');
  var data = sheet.getDataRange().getValues();
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === pan) {
      var pdfUrl = '';
      if (data[i][15]) {
        pdfUrl = data[i][15].toString();
      }
      if (!pdfUrl || pdfUrl.indexOf('http') !== 0) {
        try {
          var rep = getOrCreateSheet('Reports');
          var rd = rep.getDataRange().getValues();
          for (var j = rd.length - 1; j >= 1; j--) {
            if (rd[j][2] === pan) { pdfUrl = rd[j][3]; break; }
          }
        } catch(ex) {}
      }
      
      var reportData = null;
      if (data[i][14]) {
        try { reportData = JSON.parse(data[i][14]); } catch(ex) {}
      }
      
      return jsonResponse({
        status: 'found', row: i + 1,
        pan: data[i][1], name: data[i][2],
        score: data[i][6], band: data[i][7],
        regime: data[i][10], pdfUrl: pdfUrl,
        reportData: reportData
      });
    }
  }
  
  return jsonResponse({ status: 'not_found' });
}

function updateEmailForPan(sheet, pan, email) {
  var data = sheet.getDataRange().getValues();
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === pan) {
      sheet.getRange(i + 1, 5).setValue(email);
      return;
    }
  }
}

// ====== SHEET MANAGEMENT ======

function getOrCreateSheet(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    sheet = ss.insertSheet(name);
    
    if (name === 'TaxOptimizer') {
      var h = [
        'Timestamp', 'PAN', 'Name', 'Mobile', 'Email',
        'Income Type', 'Tax Health Score', 'Score Band',
        'Insight Count', 'Total Savings', 'Recommended Regime',
        'Regime Savings', 'Old Regime Tax', 'New Regime Tax',
        'Report Data (JSON)', 'PDF Report URL'
      ];
      sheet.getRange(1, 1, 1, h.length).setValues([h]);
      var hr = sheet.getRange(1, 1, 1, h.length);
      hr.setFontWeight('bold');
      hr.setBackground('#32509F');
      hr.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(16, 300);
    }
    
    if (name === 'Reports') {
      var h = [
        'Timestamp', 'Name', 'PAN', 'PDF Report Link',
        'Regime', 'Score', 'Status'
      ];
      sheet.getRange(1, 1, 1, h.length).setValues([h]);
      var hr = sheet.getRange(1, 1, 1, h.length);
      hr.setFontWeight('bold');
      hr.setBackground('#32509F');
      hr.setFontColor('#FFFFFF');
      sheet.setFrozenRows(1);
      sheet.setColumnWidth(4, 350);
    }
  }
  
  return sheet;
}

// ====== RESPONSE HELPERS ======

function jsonResponse(obj) {
  obj.status = obj.status || 'ok';
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jsonError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
