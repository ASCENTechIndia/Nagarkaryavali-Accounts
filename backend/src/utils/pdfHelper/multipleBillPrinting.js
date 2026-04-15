
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
require("dotenv").config();
const renderPage1 = require("../../modules/Transaction/ReceiptCollection/pdf/renderer.page1");

const BG_PAGE1 = path.resolve("templates/nmc-template.jpg");
const BG_PAGE2 = path.resolve("templates/nmcback.jpg");

const FONT_REG  = path.resolve("public/fonts/NotoSansDevanagari-Regular.ttf");
const FONT_BOLD = path.resolve("public/fonts/NotoSansDevanagari-Bold.ttf");

const PAGE_WIDTH = 996;
const PAGE_HEIGHT = 1600;

let PAGE1_IMAGE_BUFFER = null;
let PAGE2_IMAGE_BUFFER = null;
let FONT_REG_BUFFER = null;
let FONT_BOLD_BUFFER = null;

function loadResources() {
  if (!PAGE1_IMAGE_BUFFER) {
    PAGE1_IMAGE_BUFFER = fs.readFileSync(BG_PAGE1);
  }
  if (!PAGE2_IMAGE_BUFFER) {
    PAGE2_IMAGE_BUFFER = fs.readFileSync(BG_PAGE2);
  }
  if (!FONT_REG_BUFFER) {
    FONT_REG_BUFFER = fs.readFileSync(FONT_REG);
  }
  if (!FONT_BOLD_BUFFER) {
    FONT_BOLD_BUFFER = fs.readFileSync(FONT_BOLD);
  }
}

loadResources();

async function generateMultiplePropertyTaxPDF(billsData, outputPath) {
  return new Promise((resolve, reject) => {
    try {
      console.time("PDF Generation Total");
      
      const doc = new PDFDocument({
        size: [PAGE_WIDTH, PAGE_HEIGHT],
        margin: 0,
        bufferPages: true,
      });

      const stream = fs.createWriteStream(outputPath);
      doc.pipe(stream);

      doc.registerFont("dev", FONT_REG_BUFFER);
      doc.registerFont("devBold", FONT_BOLD_BUFFER);

      console.log(`Generating PDF for ${billsData.length} bills...`);

      const processBillsInBatch = async (startIndex = 0) => {
        const BATCH_SIZE = 5;
        const endIndex = Math.min(startIndex + BATCH_SIZE, billsData.length);
        
        for (let i = startIndex; i < endIndex; i++) {
          const data = billsData[i];
          
          if (i !== 0) {
            doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 0 });
          }

          doc.image(PAGE1_IMAGE_BUFFER, 0, 0, {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
          });

         await renderPage1(doc, data);



          doc.addPage({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: 0 });
          doc.image(PAGE2_IMAGE_BUFFER, 0, 0, {
            width: PAGE_WIDTH,
            height: PAGE_HEIGHT,
          });
          
          console.log(`Processed bill ${i + 1}/${billsData.length}`);
        }

        if (endIndex < billsData.length) {
          setImmediate(() => processBillsInBatch(endIndex));
        } else {
          console.timeEnd("PDF Generation Total");
          doc.end();
        }
      };

      processBillsInBatch();

      stream.on("finish", () => {
        console.log(`PDF generation finished: ${outputPath}, Size: ${stream.bytesWritten} bytes`);
        resolve(true);
      });

      stream.on("error", (err) => {
        console.error("Stream error:", err);
        reject(err);
      });

      doc.on("error", (err) => {
        console.error("PDFDocument error:", err);
        reject(err);
      });

    } catch (err) {
      console.error("PDF generation error:", err);
      reject(err);
    }
  });
}

module.exports = {
  generateMultiplePropertyTaxPDF,
};