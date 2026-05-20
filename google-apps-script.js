/**
 * MakeEazy Landing Page V2 — Google Apps Script Backend
 * ─────────────────────────────────────────────────────
 * SETUP:
 * 1. Open your Google Spreadsheet
 * 2. Go to Extensions > Apps Script
 * 3. Replace all code with this file
 * 4. Create these tabs in your spreadsheet:
 *    - "Leads" (columns: Timestamp, Source, Name, Mobile, Need, Message, UTM_Source, UTM_Medium, UTM_Campaign, Page_URL)
 *    - "Analytics" (columns: Timestamp, Event, Data, Page_URL, User_Agent)
 *    - "Videos" (columns: title, video_url, thumbnail_url)
 * 5. Deploy > New Deployment > Web App > Execute as "Me" > Access "Anyone"
 * 6. Copy the deployment URL and paste it as SHEET_URL in script.js
 *
 * VIDEOS TAB — MVP DATA (paste these rows):
 * title                                    | video_url                                          | thumbnail_url
 * How to File ITR Online in 2026           | https://www.youtube.com/watch?v=dQw4w9WgXcQ        | (leave blank — auto-generated)
 * Old vs New Tax Regime – Which Saves More?| https://www.youtube.com/watch?v=dQw4w9WgXcQ        |
 * 5 Deductions Salaried Employees Miss     | https://www.youtube.com/watch?v=dQw4w9WgXcQ        |
 * Capital Gains Tax Explained Simply       | https://www.youtube.com/watch?v=dQw4w9WgXcQ        |
 * How MakeEazy Files Your ITR              | https://www.youtube.com/watch?v=dQw4w9WgXcQ        |
 * Got a Tax Notice? Don't Panic!           | https://www.youtube.com/watch?v=dQw4w9WgXcQ        |
 */

// ══════════════════════════════════════════
// CONFIGURATION
// ══════════════════════════════════════════
var CONFIG = {
  LEADS_SHEET: 'Leads',
  ANALYTICS_SHEET: 'Analytics',
  VIDEOS_SHEET: 'Videos'
};

// ══════════════════════════════════════════
// doGet — Handle GET requests (videos, health check)
// ══════════════════════════════════════════
function doGet(e) {
  var action = (e && e.parameter && e.parameter.action) || '';

  if (action === 'get_videos') {
    return getVideos();
  }

  // Health check
  return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
}

// ══════════════════════════════════════════
// doPost — Handle POST requests (leads, analytics)
// ══════════════════════════════════════════
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || payload.type || '';

    switch (action) {
      case 'lead':
      case 'hero_callback':
      case 'final_callback':
      case 'tax_report':
        return saveLead(payload);

      case 'track':
      case 'page_view':
      case 'interaction':
        return saveAnalytics(payload);

      default:
        // Try to detect if it has lead-like data
        if (payload.name && payload.mobile) {
          return saveLead(payload);
        }
        return saveAnalytics(payload);
    }
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.message });
  }
}

// ══════════════════════════════════════════
// LEADS — Save to Leads tab
// ══════════════════════════════════════════
function saveLead(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.LEADS_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.LEADS_SHEET);
    sheet.appendRow([
      'Timestamp', 'Source', 'Name', 'Mobile', 'Need',
      'Message', 'UTM_Source', 'UTM_Medium', 'UTM_Campaign', 'Page_URL'
    ]);
    // Bold header
    sheet.getRange(1, 1, 1, 10).setFontWeight('bold');
  }

  sheet.appendRow([
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    data.action || data.source || data.type || 'unknown',
    data.name || '',
    data.mobile || data.phone || '',
    data.need || data.service || '',
    data.message || data.notes || '',
    data.utm_source || '',
    data.utm_medium || '',
    data.utm_campaign || '',
    data.page_url || data.url || ''
  ]);

  return jsonResponse({ status: 'ok', type: 'lead_saved' });
}

// ══════════════════════════════════════════
// ANALYTICS — Save to Analytics tab
// ══════════════════════════════════════════
function saveAnalytics(data) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.ANALYTICS_SHEET);

  if (!sheet) {
    sheet = ss.insertSheet(CONFIG.ANALYTICS_SHEET);
    sheet.appendRow(['Timestamp', 'Event', 'Data', 'Page_URL', 'User_Agent']);
    sheet.getRange(1, 1, 1, 5).setFontWeight('bold');
  }

  // Flatten data object to string for storage
  var dataStr = '';
  try {
    var clone = JSON.parse(JSON.stringify(data));
    delete clone.action;
    delete clone.type;
    delete clone.page_url;
    delete clone.user_agent;
    dataStr = JSON.stringify(clone);
  } catch (e) {
    dataStr = String(data);
  }

  sheet.appendRow([
    new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }),
    data.action || data.event || data.type || 'unknown',
    dataStr,
    data.page_url || data.url || '',
    data.user_agent || ''
  ]);

  return jsonResponse({ status: 'ok', type: 'analytics_saved' });
}

// ══════════════════════════════════════════
// VIDEOS — Read from Videos tab
// ══════════════════════════════════════════
function getVideos() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CONFIG.VIDEOS_SHEET);

  if (!sheet) {
    // Create Videos sheet with MVP data if it doesn't exist
    sheet = ss.insertSheet(CONFIG.VIDEOS_SHEET);
    sheet.appendRow(['title', 'video_url', 'thumbnail_url']);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');

    // MVP dummy data
    var mvpVideos = [
      ['How to File ITR Online in 2026', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', ''],
      ['Old vs New Tax Regime – Which Saves More?', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', ''],
      ['5 Deductions Salaried Employees Miss', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', ''],
      ['Capital Gains Tax Explained Simply', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', ''],
      ['How MakeEazy Files Your ITR', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', ''],
      ['Got a Tax Notice? Don\'t Panic!', 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', '']
    ];
    sheet.getRange(2, 1, mvpVideos.length, 3).setValues(mvpVideos);
  }

  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return jsonResponse([]); // Only header, no videos
  }

  var headers = data[0];
  var videos = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    // Skip empty rows
    if (!row[0] && !row[1]) continue;

    var video = {};
    for (var j = 0; j < headers.length; j++) {
      video[headers[j]] = row[j] || '';
    }
    videos.push(video);
  }

  return jsonResponse(videos);
}

// ══════════════════════════════════════════
// HELPER — JSON response with CORS
// ══════════════════════════════════════════
function jsonResponse(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}
