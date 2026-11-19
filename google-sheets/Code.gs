/**
 * little loaf by joc: website orders -> Google Sheet
 *
 * Paste this whole file into Extensions > Apps Script in the orders sheet,
 * then deploy it as a web app (steps in google-sheets-setup.md).
 * Every order placed on the website becomes a new row in the "Orders" tab.
 */

const SHEET_NAME = 'Orders';

const HEADERS = [
  'received',
  'name',
  'contact',
  'loaves',
  'estimated total',
  'pickup date',
  'notes',
  'classic sourdough',
  'cinnamon raisin',
  'jalapeño cheddar',
  'custom',
  'status',
];

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = getOrdersSheet_();

    sheet.appendRow([
      new Date(),
      clean_(data.name),
      clean_(data.contact),
      clean_(data.loaves),
      clean_(data.estimated_total),
      clean_(data.pickup_date),
      clean_(data.notes),
      Number(data.classic) || 0,
      Number(data.cinnamon_raisin) || 0,
      Number(data.jalapeno_cheddar) || 0,
      Number(data.custom) || 0,
      'new',
    ]);

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows this, so you can check it's deployed.
function doGet() {
  return ContentService.createTextOutput('little loaf order sheet is connected ♡');
}

function getOrdersSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.getRange(1, 1, 1, HEADERS.length)
      .setFontWeight('bold')
      .setBackground('#fbdce3');
    sheet.setFrozenRows(1);
    sheet.getRange('D:D').setWrap(true);
  }
  return sheet;
}

// Keep text short, and stop anything starting with = + - @ from running as a formula.
function clean_(value) {
  let text = String(value == null ? '' : value).slice(0, 1000);
  if (/^[=+\-@]/.test(text)) text = "'" + text;
  return text;
}
