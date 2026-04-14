// import fs from "fs";
// import path from "path";
// import puppeteer from "puppeteer";
// import Handlebars from "handlebars";
// import { PDFDocument } from "pdf-lib";
// import { fileURLToPath } from "url";
// import numberToWords from "number-to-words";



// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const imageToBase64 = (imgPath) => {
//   const file = fs.readFileSync(imgPath);
//   const ext = path.extname(imgPath).replace(".", "");
//   return `data:image/${ext};base64,${file.toString("base64")}`;
// };

// const amountInMarathiWords = (amount) => {
//   if (!amount) return "";

//   const num = Math.floor(Number(amount));
//   if (isNaN(num)) return "";

//   const map = {
//     zero: "शून्य",
//     one: "एक",
//     two: "दोन",
//     three: "तीन",
//     four: "चार",
//     five: "पाच",
//     six: "सहा",
//     seven: "सात",
//     eight: "आठ",
//     nine: "नऊ",
//     ten: "दहा",
//     eleven: "अकरा",
//     twelve: "बारा",
//     thirteen: "तेरा",
//     fourteen: "चौदा",
//     fifteen: "पंधरा",
//     sixteen: "सोळा",
//     seventeen: "सतरा",
//     eighteen: "अठरा",
//     nineteen: "एकोणीस",
//     twenty: "वीस",
//     thirty: "तीस",
//     forty: "चाळीस",
//     fifty: "पन्नास",
//     sixty: "साठ",
//     seventy: "सत्तर",
//     eighty: "ऐंशी",
//     ninety: "नव्वद",
//     hundred: "शंभर",
//     thousand: "हजार",
//     lakh: "लाख",
//     crore: "कोटी",
//     million: "दशलक्ष",
//     and: "",
//   };

//   const english = numberToWords.toWords(num);

// const marathi = english
//   .toLowerCase()
//   .replace(/,/g, "")   // remove commas
//   .replace(/-/g, " ")  // replace hyphens
//   .split(" ")          // ✅ SPLIT INTO ARRAY
//   .map((w) => map[w] || w)
//   .join(" ")
//   .replace(/\s+/g, " ")
//   .trim();


//   return `${marathi} रुपये`;
// };


// const formatNumber = (n) => {
//   if (n === null || n === undefined || n === "") return "0.00";
//   const num = Number(n);
//   return isNaN(num) ? "0.00" : num.toFixed(2);
// };

// const sumByKey = (rows, key) => {
//   return rows.reduce((acc, r) => acc + Number(r[key] || 0), 0);
// };

// export const generateChallanPDF = async ({
//   fromDate,
//   toDate,
//   wardName,
//   collectionCenter,
//   financialYear,
//   challanNo,
//   paymentType,
//   receiptCount,

//   rows = [],

//   // ✅ these are from API challanData
//   balanceAdvance,
//   rebateAmount,
//   shastiDiscount,
//   finalTotal,
//   finalTotalWords,
// }) => {
//   try {
//     if (!rows || rows.length === 0) {
//       // Still allow PDF even if table is empty (because your finalamt may exist)
//       rows = [];
//     }

//     // ✅ Template Path
//     const templatePath = path.resolve(
//       __dirname,
//       "../../templates/challan-report.html"
//     );

//     if (!fs.existsSync(templatePath)) {
//       throw new Error(`Template not found at: ${templatePath}`);
//     }

//     const templateHtml = fs.readFileSync(templatePath, "utf8");
//     const template = Handlebars.compile(templateHtml);

//     // ✅ Logo Base64
//     const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");

//     let logo = "";
//     if (fs.existsSync(logoPath)) {
//       logo = imageToBase64(logoPath);
//     } else {
//       logo = "https://via.placeholder.com/80";
//     }

//     // ✅ Table Totals
//     const tableTotalArrears = sumByKey(rows, "arrears");
//     const tableTotalCurrent = sumByKey(rows, "current");
//     const tableTotal = sumByKey(rows, "total");

//     const now = new Date();
//     const printDate = now.toLocaleDateString("en-GB");
//     const printTime = now.toLocaleTimeString("en-IN", { hour12: true });

//     // ✅ Bind Template Data
//     const templateData = {
//       logo,
//       fromDate,
//       toDate,
//       financialYear: financialYear || "2025-2026",
//       challanNo: challanNo || "",

//       wardName: wardName || "-",
//       collectionCenter: collectionCenter || "-",
//       receiptCount: receiptCount ?? 0,
//       paymentType: paymentType || "-",

//       rows: rows.map((r) => ({
//         taxName: r.taxName || "",
//         codeNo: r.codeNo || "",
//         arrears: formatNumber(r.arrears),
//         current: formatNumber(r.current),
//         total: formatNumber(r.total),
//       })),

//       tableTotalArrears: formatNumber(tableTotalArrears),
//       tableTotalCurrent: formatNumber(tableTotalCurrent),
//       tableTotal: formatNumber(tableTotal),

//       grandTotalArrears: formatNumber(tableTotalArrears),
//       grandTotalCurrent: formatNumber(tableTotalCurrent),
//       grandTotal: formatNumber(tableTotal),

//       // ✅ These should come from challanData (important!)
//       balanceAdvance: formatNumber(balanceAdvance || 0),
//       rebateAmount: formatNumber(rebateAmount || 0),
//       shastiDiscount: formatNumber(shastiDiscount || 0),
//       finalTotal: formatNumber(finalTotal || tableTotal),
//       finalTotalWords: amountInMarathiWords(finalTotal || tableTotal),

//       printDate,
//       printTime,
//     };

//     const html = template(templateData);

//     // ✅ Puppeteer PDF
//     const browser = await puppeteer.launch({
//       headless: true,
//       args: ["--no-sandbox", "--disable-setuid-sandbox"],
//     });

//     const page = await browser.newPage();
//     await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 0 });

//     const pdfBuffer = await page.pdf({
//       format: "A4",
//       landscape: false,
//       printBackground: true,
//       margin: {
//         top: "10mm",
//         bottom: "10mm",
//         left: "10mm",
//         right: "10mm",
//       },
//     });

//     await page.close();
//     await browser.close();

//     // ✅ Save in public/pdf
//     const finalPdf = await PDFDocument.create();
//     const tempPdf = await PDFDocument.load(pdfBuffer);

//     const pages = await finalPdf.copyPages(tempPdf, tempPdf.getPageIndices());
//     pages.forEach((p) => finalPdf.addPage(p));

//     const outputDir = path.resolve(__dirname, "../../../public/pdf");
//     if (!fs.existsSync(outputDir)) {
//       fs.mkdirSync(outputDir, { recursive: true });
//     }

//     const fileName = `Challan_Generation${Date.now()}.pdf`;
//     const outputPath = path.join(outputDir, fileName);

//     const finalBytes = await finalPdf.save();
//     fs.writeFileSync(outputPath, finalBytes);

//     return { fileName, outputPath };
//   } catch (error) {
//     console.error("❌ generateChallanPDF error:", error);
//     throw error;
//   }
// };


const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");
const { PDFDocument } = require("pdf-lib");
const numberToWords = require("number-to-words");

// ✅ CommonJS already has __dirname
// ❌ DO NOT use import.meta.url here

const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const amountInMarathiWords = (amount) => {
  if (!amount) return "";

  const num = Math.floor(Number(amount));
  if (isNaN(num)) return "";

  const map = {
    zero: "शून्य",
    one: "एक",
    two: "दोन",
    three: "तीन",
    four: "चार",
    five: "पाच",
    six: "सहा",
    seven: "सात",
    eight: "आठ",
    nine: "नऊ",
    ten: "दहा",
    eleven: "अकरा",
    twelve: "बारा",
    thirteen: "तेरा",
    fourteen: "चौदा",
    fifteen: "पंधरा",
    sixteen: "सोळा",
    seventeen: "सतरा",
    eighteen: "अठरा",
    nineteen: "एकोणीस",
    twenty: "वीस",
    thirty: "तीस",
    forty: "चाळीस",
    fifty: "पन्नास",
    sixty: "साठ",
    seventy: "सत्तर",
    eighty: "ऐंशी",
    ninety: "नव्वद",
    hundred: "शंभर",
    thousand: "हजार",
    lakh: "लाख",
    crore: "कोटी",
    million: "दशलक्ष",
    and: "",
  };

  const english = numberToWords.toWords(num);

  const marathi = english
    .toLowerCase()
    .replace(/,/g, "")
    .replace(/-/g, " ")
    .split(" ")
    .map((w) => map[w] || w)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  return `${marathi} रुपये`;
};

const formatNumber = (n) => {
  if (n === null || n === undefined || n === "") return "0.00";
  const num = Number(n);
  return isNaN(num) ? "0.00" : num.toFixed(2);
};

const sumByKey = (rows, key) => {
  return rows.reduce((acc, r) => acc + Number(r[key] || 0), 0);
};

const generateChallanPDF = async ({
  fromDate,
  toDate,
  wardName,
  collectionCenter,
  financialYear,
  challanNo,
  paymentType,
  receiptCount,
  rows = [],
  balanceAdvance,
  rebateAmount,
  shastiDiscount,
  finalTotal,
}) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/challan-report.html"
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath)
      ? imageToBase64(logoPath)
      : "https://via.placeholder.com/80";

    const tableTotalArrears = sumByKey(rows, "arrears");
    const tableTotalCurrent = sumByKey(rows, "current");
    const tableTotal = sumByKey(rows, "total");

    const now = new Date();

    const templateData = {
      logo,
      fromDate,
      toDate,
      financialYear: financialYear || "2025-2026",
      challanNo: challanNo || "",
      wardName: wardName || "-",
      collectionCenter: collectionCenter || "-",
      receiptCount: receiptCount ?? 0,
      paymentType: paymentType || "-",
      rows: rows.map((r) => ({
        taxName: r.taxName || "",
        codeNo: r.codeNo || "",
        arrears: formatNumber(r.arrears),
        current: formatNumber(r.current),
        total: formatNumber(r.total),
      })),
      tableTotalArrears: formatNumber(tableTotalArrears),
      tableTotalCurrent: formatNumber(tableTotalCurrent),
      tableTotal: formatNumber(tableTotal),
      balanceAdvance: formatNumber(balanceAdvance || 0),
      rebateAmount: formatNumber(rebateAmount || 0),
      shastiDiscount: formatNumber(shastiDiscount || 0),
      finalTotal: formatNumber(finalTotal || tableTotal),
      finalTotalWords: amountInMarathiWords(finalTotal || tableTotal),
      printDate: now.toLocaleDateString("en-GB"),
      printTime: now.toLocaleTimeString("en-IN", { hour12: true }),
    };

    const html = template(templateData);

    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "10mm", right: "10mm" },
    });

    await browser.close();

    const finalPdf = await PDFDocument.create();
    const tempPdf = await PDFDocument.load(pdfBuffer);
    const pages = await finalPdf.copyPages(tempPdf, tempPdf.getPageIndices());
    pages.forEach((p) => finalPdf.addPage(p));

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `Challan_Generation${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, await finalPdf.save());

    return { fileName, outputPath };
  } catch (err) {
    console.error("❌ generateChallanPDF error:", err);
    throw err;
  }
};

module.exports = { generateChallanPDF };
