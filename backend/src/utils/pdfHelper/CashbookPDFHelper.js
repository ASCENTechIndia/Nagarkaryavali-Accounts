// pdfHelper/CashbookPDFHelper.js
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const formatNumber = (n) => {
  const num = Number(n || 0);
  return num.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const CashbookPDFHelper = async ({ reportData, openingBalanceData, filters, ulbInfo }) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/Cashbook.html");
    const htmlFile = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlFile);

    // Separate receipt and payment rows for proper display
    const receiptRows = [];
    const paymentRows = [];
    
    // Track column-wise totals
    let totalReceiptCash = 0;
    let totalReceiptCheque = 0;
    let totalReceiptTransfer = 0;
    let totalReceiptOverall = 0;
    
    let totalPaymentAmount = 0;
    let totalPaymentTransfer = 0;
    let totalPaymentOverall = 0;
    
    // Counter for sequential numbering
    let receiptSrNo = 1;
    let paymentSrNo = 1;
    
    // Process each row from API response
    reportData.forEach((row) => {
      // Check if this row has receipt data
      const hasReceipt = row.RTransNo !== null && row.RTransNo !== undefined && row.RTransNo !== "";
      
      if (hasReceipt) {
        const receiptCash = row.RCashAmount || 0;
        const receiptCheque = row.RBankAmount || 0;  // Cheque amount
        const receiptTransfer = row.RTransferAmount || 0;
        const receiptTotal = receiptCash + receiptCheque + receiptTransfer;
        
        totalReceiptCash += receiptCash;
        totalReceiptCheque += receiptCheque;
        totalReceiptTransfer += receiptTransfer;
        totalReceiptOverall += receiptTotal;
        
        receiptRows.push({
          SR: receiptSrNo++,
          R_ZONE: row.RZone || "",
          R_DEPT: row.RDepartment || "",
          R_DOCNO: row.RDocNo || "",
          R_CODE: row.RAccNoWith0 || "",
          R_ACCNAME: row.RAccname || "",
          R_NARRATION: row.RNarration || "",
          R_CASH: formatNumber(receiptCash),
          R_CHEQUE_NO: row.RBankAmount,  
          R_CHEQUE_AMOUNT: formatNumber(receiptCheque),
          R_TRANSFER: formatNumber(receiptTransfer),
          R_TOTAL: formatNumber(receiptTotal),
        });
      }
      
      // Check if this row has payment data
      const hasPayment = row.PTransNo !== null && row.PTransNo !== undefined && row.PTransNo !== "";
      
      if (hasPayment) {
        const paymentAmount = row.PBankAmount || 0;
        const paymentTransfer = row.PTransferAmount || 0;
        // const paymentTotal = paymentAmount + paymentTransfer;
        const paymentTotal = row.PaymentTotal || 0;
        
        totalPaymentAmount += paymentAmount;
        totalPaymentTransfer += paymentTransfer;
        totalPaymentOverall += paymentTotal;
        
        paymentRows.push({
          SR: paymentSrNo++,
          P_DOCNO: row.PDocNo || "",
          P_CODE: row.PAccNowith0 || "",
          P_ACCNAME: row.PAccname || "",
          P_PARTY: row.PartyName || "",
          P_NARRATION: row.PNarration || "",
          P_CHQNO: row.PChqNo || "",
          P_AMOUNT: formatNumber(paymentAmount),
          P_TRANSFER: formatNumber(paymentTransfer),
          P_TOTAL: formatNumber(paymentTotal),
        });
      }
    });
    
    // Get opening balance from API response
    const openingBalance = openingBalanceData?.balance || 0;
    const openingDrCr = openingBalanceData?.drCr || "Cr.";
    
    // Calculate closing balance
    let closingBalance;
    if (openingDrCr === "Dr.") {
      // If opening is debit, treat as negative
      closingBalance = Math.abs(openingBalance) + totalReceiptOverall - totalPaymentOverall;
    } else {
      closingBalance = Math.abs(openingBalance) + totalReceiptOverall - totalPaymentOverall;
    }
    
    const absClosingBalance = Math.abs(closingBalance);
    const closingDrCr = closingBalance >= 0 ? "Cr." : "Dr.";
    
    // Combine rows for template (template expects combined rows)
    const maxRows = Math.max(receiptRows.length, paymentRows.length);
    const combinedRows = [];
    
    for (let i = 0; i < maxRows; i++) {
      const receiptRow = receiptRows[i] || {
        SR: "",
        R_ZONE: "",
        R_DEPT: "",
        R_DOCNO: "",
        R_CODE: "",
        R_ACCNAME: "",
        R_NARRATION: "",
        R_CASH: "",
        R_CHEQUE_NO: "",
        R_CHEQUE_AMOUNT: "",
        R_TRANSFER: "",
        R_TOTAL: ""
      };
      
      const paymentRow = paymentRows[i] || {
        SR: "",
        P_DOCNO: "",
        P_CODE: "",
        P_ACCNAME: "",
        P_PARTY: "",
        P_NARRATION: "",
        P_CHQNO: "",
        P_AMOUNT: "",
        P_TRANSFER: "",
        P_TOTAL: ""
      };
      
      combinedRows.push({
        ...receiptRow,
        ...paymentRow
      });
    }
    
    // Format date for display
    const formattedDate = filters.date;

    const batchSize = 10;

    const batches = [];

    for (let i = 0; i < combinedRows.length; i += batchSize) {
      batches.push(
        combinedRows.slice(i, i + batchSize)
      );
    }
    
    const html = template({
      logo: ulbInfo.ULBLOGO,
      corporationName: ulbInfo.ABC_MUNICIPAL_TEXT,
      fromDate: formattedDate,
      // rows: combinedRows,
      batches,
      opening: formatNumber(openingBalance),
      // Receipt totals - column wise
      totalReceiptCash: formatNumber(totalReceiptCash),
      totalReceiptCheque: formatNumber(totalReceiptCheque),
      totalReceiptTransfer: formatNumber(totalReceiptTransfer),
      totalReceipt: formatNumber(totalReceiptOverall),
      // Payment totals - column wise
      totalPaymentAmount: formatNumber(totalPaymentAmount),
      totalPaymentTransfer: formatNumber(totalPaymentTransfer),
      totalPayment: formatNumber(totalPaymentOverall),
      closing: formatNumber(absClosingBalance),
      closingDrCr: closingDrCr
    });

    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );

    const launchOptions = {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    };

    if (fs.existsSync(chromePath)) {
      launchOptions.executablePath = chromePath;
    }

    const browser = await puppeteer.launch(launchOptions);
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "domcontentloaded" });
    
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "5mm",
        right: "5mm",
      },
    });
    
    await page.close();
    await browser.close();
    
    const dir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    const fileName = `Cashbook_${Date.now()}.pdf`;
    const filePath = path.join(dir, fileName);
    
    fs.writeFileSync(filePath, pdfBuffer);
    
    return { fileName, filePath };
  } catch (err) {
    console.error("PDF Error:", err);
    throw err;
  }
};

module.exports = { CashbookPDFHelper };