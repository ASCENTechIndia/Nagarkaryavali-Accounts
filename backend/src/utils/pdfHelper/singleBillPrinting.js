const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
// PAGE-1 renderer (already created by you)
const  renderPage1  = require("../../modules/Transaction/ReceiptCollection/pdf/renderer.page1");

// ================= CONFIG =================

// Page-1 background
const BG_PAGE1 = path.resolve("templates/nmc-template.jpg");

// Page-2 background (ONLY IMAGE – no overlay)
const BG_PAGE2 = path.resolve("templates/nmcback.jpg");

// Fonts (MANDATORY)
const FONT_REG  = path.resolve("public/fonts/NotoSansDevanagari-Regular.ttf");
const FONT_BOLD = path.resolve("public/fonts/NotoSansDevanagari-Bold.ttf");

// Exact image size
const PAGE_WIDTH = 996;
const PAGE_HEIGHT = 1600;

// ================= MAIN FUNCTION =================

async function generatePropertyTaxPDF(data, outputPath) {
  const doc = new PDFDocument({
    size: [PAGE_WIDTH, PAGE_HEIGHT],
    margin: 0,
  });

  doc.pipe(fs.createWriteStream(outputPath));

  /* ================= FONTS ================= */
  doc.registerFont("dev", FONT_REG);
  doc.registerFont("devBold", FONT_BOLD);

  /* =================================================
     PAGE 1 – PROPERTY TAX RECEIPT (WITH DATA)
  ================================================= */

  // Background (NO scaling)
  doc.image(BG_PAGE1, 0, 0, {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  });

  // Render Page-1 content
  await renderPage1(doc, data);

  /* =================================================
     PAGE 2 – ONLY BACKGROUND IMAGE
     (NO TEXT, NO OVERLAY)
  ================================================= */

  doc.addPage({
    size: [PAGE_WIDTH, PAGE_HEIGHT],
    margin: 0,
  });

  doc.image(BG_PAGE2, 0, 0, {
    width: PAGE_WIDTH,
    height: PAGE_HEIGHT,
  });

  /* ================= END ================= */

  doc.end();
}

module.exports = {
  generatePropertyTaxPDF,
};