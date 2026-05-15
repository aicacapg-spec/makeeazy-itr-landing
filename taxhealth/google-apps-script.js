// MakeEazy Tax Optimizer - Google Apps Script v4
// Auto-generates PDF via Spreadsheet export. Only needs Sheets + Drive permissions.

function doPost(e) {
  try {
    var data;
    if (e.parameter && e.parameter.payload) {
      data = JSON.parse(e.parameter.payload);
    } else {
      data = JSON.parse(e.postData.contents);
    }
    
    // Handle email fallback
    if (data.type === 'email_fallback') {
      var sheet = getOrCreateSheet('TaxOptimizer');
      updateEmailForPan(sheet, data.pan, data.email);
      return ok({ type: 'email_updated' });
    }
    
    // ── Store lead data ──
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
      '' // PDF URL - filled below
    ];
    sheet.appendRow(row);
    var dataRow = sheet.getLastRow();
    
    // ── Auto-generate PDF ──
    var pdfUrl = '';
    if (data.reportData) {
      try {
        var rd = JSON.parse(data.reportData);
        pdfUrl = generatePdfReport(data.pan, data.name, data, rd);
        
        // Update PDF URL in TaxOptimizer sheet (column 16)
        sheet.getRange(dataRow, 16).setValue(pdfUrl);
        
        // Add to Reports sheet
        var reportsSheet = getOrCreateSheet('Reports');
        reportsSheet.appendRow([
          new Date().toISOString(),
          data.name || '',
          data.pan || '',
          pdfUrl,
          data.regime || '',
          data.score || 0,
          'Ready'
        ]);
      } catch (pdfErr) {
        Logger.log('PDF generation error: ' + pdfErr.message);
        sheet.getRange(dataRow, 16).setValue('Error: ' + pdfErr.message);
      }
    }
    
    return ok({ row: dataRow, pdfUrl: pdfUrl });
    
  } catch (err) {
    return error(err.message);
  }
}

function doGet(e) {
  var action = (e.parameter || {}).action;
  var pan = (e.parameter || {}).pan;
  
  if (action === 'lookup' && pan) return lookupByPan(pan);
  if (action === 'regenerate' && pan) return regeneratePdf(pan);
  
  return ok({ message: 'MakeEazy Tax Optimizer API v4' });
}

// ═══════════════════════════════════════════════════
// PDF GENERATION — Temp Sheet → Export as PDF → Drive
// No DocumentApp needed! Uses only Sheets + Drive.
// ═══════════════════════════════════════════════════

function generatePdfReport(pan, name, summary, reportData) {
  var tax = reportData.taxResult || {};
  var ins = reportData.insights || {};
  var inputs = reportData.inputs || {};
  var oldTax = tax.old || {};
  var newTax = tax.new || {};
  var rec = tax.recommendation || 'new';
  var score = ins.score || summary.score || 0;
  var band = ins.band || summary.band || '';
  var insights = ins.insights || [];
  var bestLabel = rec === 'old' ? 'Old Regime' : 'New Regime';
  
  // Create temp sheet for PDF
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tempSheet = ss.insertSheet('_TempPDF_' + Date.now());
  
  try {
    // ── Build report layout in sheet cells ──
    tempSheet.setColumnWidth(1, 30);
    tempSheet.setColumnWidth(2, 200);
    tempSheet.setColumnWidth(3, 150);
    tempSheet.setColumnWidth(4, 150);
    tempSheet.setColumnWidth(5, 30);
    
    var r = 1;
    var NAVY = '#32509F';
    var ORANGE = '#F77F00';
    var GREEN = '#16a34a';
    var RED = '#dc2626';
    var GRAY = '#64748b';
    var WHITE = '#FFFFFF';
    var LIGHT = '#F0F4FF';
    
    // ── HEADER BAR ──
    tempSheet.getRange(r, 1, 1, 5).merge().setValue('MAKEEAZY').setBackground(NAVY)
      .setFontColor(WHITE).setFontSize(22).setFontWeight('bold').setHorizontalAlignment('center');
    tempSheet.setRowHeight(r, 45);
    r++;
    
    tempSheet.getRange(r, 1, 1, 5).merge().setValue('Tax Optimization Report').setBackground(NAVY)
      .setFontColor(ORANGE).setFontSize(14).setFontWeight('bold').setHorizontalAlignment('center');
    r++;
    
    tempSheet.getRange(r, 1, 1, 5).merge().setValue('FY 2025-26  |  AY 2026-27').setBackground(NAVY)
      .setFontColor('#94A3B8').setFontSize(9).setHorizontalAlignment('center');
    r++; r++;
    
    // ── USER INFO ──
    var infoData = [
      ['Taxpayer', name || 'Not provided'],
      ['PAN', pan],
      ['Income Source', inputs._incomeType || inputs.incomeType || 'Salaried'],
      ['Report Date', Utilities.formatDate(new Date(), 'Asia/Kolkata', 'dd MMM yyyy')]
    ];
    for (var i = 0; i < infoData.length; i++) {
      tempSheet.getRange(r, 2).setValue(infoData[i][0]).setFontColor(GRAY).setFontSize(9);
      tempSheet.getRange(r, 3, 1, 2).merge().setValue(infoData[i][1]).setFontColor(NAVY).setFontSize(10).setFontWeight('bold');
      r++;
    }
    r++;
    
    // ── TAX HEALTH SCORE ──
    var scoreColor = score > 80 ? GREEN : score > 60 ? ORANGE : RED;
    tempSheet.getRange(r, 2, 1, 3).merge()
      .setValue('TAX HEALTH SCORE:  ' + score + '/100  —  ' + band)
      .setFontSize(14).setFontWeight('bold').setFontColor(WHITE).setBackground(scoreColor)
      .setHorizontalAlignment('center');
    tempSheet.setRowHeight(r, 35);
    r++; r++;
    
    // ── REGIME COMPARISON TABLE ──
    tempSheet.getRange(r, 2, 1, 3).merge().setValue('📊 Regime Comparison')
      .setFontSize(13).setFontWeight('bold').setFontColor(NAVY);
    r++;
    
    // Table headers
    var headers = ['', 'Old Regime', 'New Regime'];
    tempSheet.getRange(r, 2).setValue(headers[0]).setBackground(NAVY).setFontColor(WHITE).setFontWeight('bold').setFontSize(9);
    tempSheet.getRange(r, 3).setValue(headers[1]).setBackground(NAVY).setFontColor(WHITE).setFontWeight('bold').setFontSize(9).setHorizontalAlignment('right');
    tempSheet.getRange(r, 4).setValue(headers[2]).setBackground(NAVY).setFontColor(WHITE).setFontWeight('bold').setFontSize(9).setHorizontalAlignment('right');
    r++;
    
    var rows = [
      ['Gross Income', fmt(oldTax.grossSalary), fmt(newTax.grossSalary)],
      ['Standard Deduction', fmt(oldTax.stdDeduction), fmt(newTax.stdDeduction)],
      ['Net Income', fmt(oldTax.normalIncome), fmt(newTax.normalIncome)],
      ['Deductions (Ch VI-A)', fmt(oldTax.totalDeductions), fmt(newTax.totalDeductions)],
      ['Taxable Income', fmt(oldTax.taxableTotal), fmt(newTax.taxableTotal)],
      ['Tax on Income', fmt(oldTax.normalTax), fmt(newTax.normalTax)],
      ['Rebate u/s 87A', fmt(oldTax.rebate), fmt(newTax.rebate)],
      ['Health & Edu Cess', fmt(oldTax.cess), fmt(newTax.cess)],
      ['TOTAL TAX', fmt(oldTax.roundedTax), fmt(newTax.roundedTax)]
    ];
    
    for (var i = 0; i < rows.length; i++) {
      var bgColor = i % 2 === 0 ? WHITE : LIGHT;
      var fw = (i === rows.length - 1) ? 'bold' : 'normal';
      tempSheet.getRange(r, 2).setValue(rows[i][0]).setFontSize(9).setFontColor(NAVY).setBackground(bgColor).setFontWeight(fw);
      tempSheet.getRange(r, 3).setValue(rows[i][1]).setFontSize(9).setFontColor(NAVY).setBackground(bgColor).setFontWeight(fw).setHorizontalAlignment('right');
      
      tempSheet.getRange(r, 3).setBackground(rec === 'old' ? '#F0FDF4' : bgColor);
      tempSheet.getRange(r, 4).setValue(rows[i][2]).setFontSize(9).setFontColor(NAVY).setBackground(rec === 'new' ? '#F0FDF4' : bgColor).setFontWeight(fw).setHorizontalAlignment('right');
      r++;
    }
    r++;
    
    // ── SAVINGS ──
    var savingsText = bestLabel + ' saves you ' + fmt(tax.absSavings);
    tempSheet.getRange(r, 2, 1, 3).merge().setValue(savingsText)
      .setFontSize(13).setFontWeight('bold').setFontColor(WHITE).setBackground(GREEN)
      .setHorizontalAlignment('center');
    tempSheet.setRowHeight(r, 32);
    r++; r++;
    
    // ── INSIGHTS ──
    if (insights.length > 0) {
      tempSheet.getRange(r, 2, 1, 3).merge().setValue('💡 Tax Insights & Findings')
        .setFontSize(13).setFontWeight('bold').setFontColor(NAVY);
      r++;
      
      var typeLabel = { risk: '⚠️ RISK', opportunity: '💰 OPPORTUNITY', good: '✅ HEALTHY' };
      var typeColor = { risk: RED, opportunity: ORANGE, good: GREEN };
      
      for (var i = 0; i < insights.length; i++) {
        var insight = insights[i];
        var iLabel = typeLabel[insight.type] || 'ℹ️ INFO';
        var iColor = typeColor[insight.type] || GRAY;
        
        tempSheet.getRange(r, 2, 1, 3).merge()
          .setValue(iLabel + '  ' + insight.title + (insight.impact > 0 ? '  —  Impact: ' + fmt(insight.impact) : ''))
          .setFontSize(10).setFontWeight('bold').setFontColor(iColor);
        r++;
        
        if (insight.detail) {
          tempSheet.getRange(r, 2, 1, 3).merge()
            .setValue('    ' + insight.detail)
            .setFontSize(8).setFontColor(GRAY).setWrap(true);
          r++;
        }
        r++;
      }
      
      if (ins.totalPotentialSavings > 0) {
        tempSheet.getRange(r, 2, 1, 3).merge()
          .setValue('Total Potential Additional Savings: ' + fmt(ins.totalPotentialSavings))
          .setFontSize(12).setFontWeight('bold').setFontColor(GREEN).setHorizontalAlignment('center');
        r++;
      }
      r++;
    }
    
    // ── NEXT STEPS ──
    tempSheet.getRange(r, 2, 1, 3).merge().setValue('📞 Next Steps')
      .setFontSize(13).setFontWeight('bold').setFontColor(NAVY);
    r++;
    
    var steps = [
      '1. Talk to a Tax Expert  —  Free 15-min consultation',
      '2. WhatsApp Us  —  wa.me/919992819995',
      '3. Get Your ITR Filed  —  CA-backed filing at makeeazy.in'
    ];
    for (var s = 0; s < steps.length; s++) {
      tempSheet.getRange(r, 2, 1, 3).merge().setValue(steps[s])
        .setFontSize(9).setFontColor(NAVY);
      r++;
    }
    r++;
    
    // ── FOOTER ──
    tempSheet.getRange(r, 2, 1, 3).merge()
      .setValue('Disclaimer: For informational purposes only. Consult a qualified CA for personalised tax planning.')
      .setFontSize(7).setFontColor(GRAY).setHorizontalAlignment('center');
    r++;
    tempSheet.getRange(r, 2, 1, 3).merge()
      .setValue('Generated by MakeEazy  |  www.makeeazy.in  |  +91-9992819995')
      .setFontSize(8).setFontColor(NAVY).setFontWeight('bold').setHorizontalAlignment('center');
    
    // Export as PDF - copy sheet to temp spreadsheet, export, delete
    SpreadsheetApp.flush();
    
    // Create a new temp spreadsheet with only this sheet
    var tempSS = SpreadsheetApp.create('_TempReport_' + pan);
    var destSheet = tempSheet.copyTo(tempSS);
    // Remove the default blank sheet
    var defaultSheet = tempSS.getSheets()[0];
    if (defaultSheet.getName() !== destSheet.getName()) {
      tempSS.deleteSheet(defaultSheet);
    }
    
    // Get PDF blob from the temp spreadsheet file
    var tempFile = DriveApp.getFileById(tempSS.getId());
    var pdfBlob = tempFile.getAs('application/pdf');
    pdfBlob.setName('TaxReport_' + pan + '_' + Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyyMMdd_HHmm') + '.pdf');
    
    // Save PDF to reports folder
    var folder = getReportsFolder();
    var pdfFile = folder.createFile(pdfBlob);
    pdfFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    // Cleanup: delete temp spreadsheet
    tempFile.setTrashed(true);
    
    return pdfFile.getUrl();
    
  } finally {
    // Always clean up temp sheet from main spreadsheet
    ss.deleteSheet(tempSheet);
  }
}

function getReportsFolder() {
  var folderName = 'MakeEazy Tax Reports';
  var folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) return folders.next();
  return DriveApp.createFolder(folderName);
}

function fmt(n) {
  var num = Math.round(Number(n) || 0);
  if (num >= 10000000) return '\u20B9' + (num / 10000000).toFixed(2) + ' Cr';
  if (num >= 100000) return '\u20B9' + (num / 100000).toFixed(2) + ' L';
  return '\u20B9' + num.toLocaleString('en-IN');
}

// ── Regenerate PDF ──
function regeneratePdf(pan) {
  var sheet = getOrCreateSheet('TaxOptimizer');
  var data = sheet.getDataRange().getValues();
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === pan) {
      var reportDataStr = data[i][14];
      if (!reportDataStr) return error('No report data for PAN: ' + pan);
      
      var rd = JSON.parse(reportDataStr);
      var pdfUrl = generatePdfReport(pan, data[i][2], {
        score: data[i][6], band: data[i][7], regime: data[i][10]
      }, rd);
      
      sheet.getRange(i + 1, 16).setValue(pdfUrl);
      
      var reportsSheet = getOrCreateSheet('Reports');
      reportsSheet.appendRow([
        new Date().toISOString(), data[i][2] || '', pan, pdfUrl,
        data[i][10] || '', data[i][6] || 0, 'Ready'
      ]);
      
      return ok({ status: 'regenerated', pdfUrl: pdfUrl });
    }
  }
  return error('PAN not found: ' + pan);
}

// ── Lookup ──
function lookupByPan(pan) {
  var sheet = getOrCreateSheet('TaxOptimizer');
  var data = sheet.getDataRange().getValues();
  
  for (var i = data.length - 1; i >= 1; i--) {
    if (data[i][1] === pan) {
      var pdfUrl = data[i][15] || '';
      
      if (!pdfUrl || pdfUrl.toString().indexOf('http') !== 0) {
        try {
          var reports = getOrCreateSheet('Reports');
          var rData = reports.getDataRange().getValues();
          for (var j = rData.length - 1; j >= 1; j--) {
            if (rData[j][2] === pan) { pdfUrl = rData[j][3]; break; }
          }
        } catch(e) {}
      }
      
      var reportData = data[i][14] ? JSON.parse(data[i][14]) : null;
      return ok({
        status: 'found', row: i + 1,
        pan: data[i][1], name: data[i][2],
        score: data[i][6], band: data[i][7],
        regime: data[i][10], pdfUrl: pdfUrl,
        reportData: reportData
      });
    }
  }
  
  return ok({ status: 'not_found' });
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

// ── Sheet Management ──
function getOrCreateSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    
    if (sheetName === 'TaxOptimizer') {
      var headers = [
        'Timestamp', 'PAN', 'Name', 'Mobile', 'Email',
        'Income Type', 'Tax Health Score', 'Score Band',
        'Insight Count', 'Total Savings', 'Recommended Regime',
        'Regime Savings', 'Old Regime Tax', 'New Regime Tax',
        'Report Data (JSON)', 'PDF Report URL'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeader(sheet, headers.length);
      sheet.setColumnWidth(16, 300);
    }
    
    if (sheetName === 'Reports') {
      var headers = [
        'Timestamp', 'Name', 'PAN', 'PDF Report Link',
        'Regime', 'Score', 'Status'
      ];
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      formatHeader(sheet, headers.length);
      sheet.setColumnWidth(4, 350);
    }
  }
  
  return sheet;
}

function formatHeader(sheet, colCount) {
  var headerRange = sheet.getRange(1, 1, 1, colCount);
  headerRange.setFontWeight('bold');
  headerRange.setBackground('#32509F');
  headerRange.setFontColor('#FFFFFF');
  sheet.setFrozenRows(1);
}

// ── Response Helpers ──
function ok(data) {
  return ContentService.createTextOutput(JSON.stringify(Object.assign({ status: 'ok' }, data)))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
