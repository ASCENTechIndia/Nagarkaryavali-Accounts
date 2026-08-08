
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

const formatNumber = (amount) => {
  let num = Number(amount || 0);
  const isNegative = num < 0;
  num = Math.abs(num);

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let s = integerPart.toString();
  let result = "";

  if (s.length > 3) {
    result = "," + s.slice(-3);
    s = s.slice(0, -3);
  } else {
    result = s;
    s = "";
  }

  while (s.length > 2) {
    result = "," + s.slice(-2) + result;
    s = s.slice(0, -2);
  }

  if (s.length > 0) {
    result = s + result;
  }

  const decimalString = "." + decimalPart.toString().padStart(2, "0");
  result = result + decimalString;

  return isNegative ? "-" + result : result;
};

const numberToMarathiWords = (num) => {
  const units = [
    "",
    "एक",
    "दोन",
    "तीन",
    "चार",
    "पाच",
    "सहा",
    "सात",
    "आठ",
    "नऊ",
    "दहा",
    "अकरा",
    "बारा",
    "तेरा",
    "चौदा",
    "पंधरा",
    "सोळा",
    "सतरा",
    "अठरा",
    "एकोणीस",
    "वीस",
    "एकवीस",
    "बावीस",
    "तेवीस",
    "चोवीस",
    "पंचवीस",
    "सव्वीस",
    "सत्तावीस",
    "अठ्ठावीस",
    "एकोणतीस",
    "तीस",
    "एकतीस",
    "बत्तीस",
    "तेहेतीस",
    "चौतीस",
    "पस्तीस",
    "छत्तीस",
    "सदतीस",
    "अडतीस",
    "एकोणचाळीस",
    "चाळीस",
    "एकेचाळीस",
    "बेचाळीस",
    "त्रेचाळीस",
    "चव्वेचाळीस",
    "पंचेचाळीस",
    "सेहेचाळीस",
    "सत्तेचाळीस",
    "अठ्ठेचाळीस",
    "एकोणपन्नास",
    "पन्नास",
    "एकावन्न",
    "बावन्न",
    "त्रेपन्न",
    "चोपन्न",
    "पंचावन्न",
    "छप्पन्न",
    "सत्तावन्न",
    "अठ्ठावन्न",
    "एकोणसाठ",
    "साठ",
    "एकसष्ट",
    "बासष्ट",
    "त्रेसष्ट",
    "चौसष्ट",
    "पासष्ट",
    "सहासष्ट",
    "सत्तेसष्ट",
    "अडुसष्ट",
    "एकोणसत्तर",
    "सत्तर",
    "एकाहत्तर",
    "बहात्तर",
    "त्र्याहत्तर",
    "चौर्‍याहत्तर",
    "पंच्याहत्तर",
    "शहात्तर",
    "सत्त्याहत्तर",
    "अठ्ठ्याहत्तर",
    "एकोणऐंशी",
    "ऐंशी",
    "एक्याऐंशी",
    "ब्याऐंशी",
    "त्र्याऐंशी",
    "चौर्‍याऐंशी",
    "पंच्याऐंशी",
    "शहाऐंशी",
    "सत्त्याऐंशी",
    "अठ्ठ्याऐंशी",
    "एकोणनव्वद",
    "नव्वद",
    "एक्याण्णव",
    "ब्याण्णव",
    "त्र्याण्णव",
    "चौर्‍याण्णव",
    "पंच्याण्णव",
    "शहाण्णव",
    "सत्त्याण्णव",
    "अठ्ठ्याण्णव",
    "नव्व्याण्णव",
    "शंभर",
  ];

  const getWords = (n) => {
    if (n === 0) return "";
    if (n <= 100) return units[n];

    if (n < 1000) {
      return units[Math.floor(n / 100)] + "शे " + getWords(n % 100);
    }

    if (n < 100000) {
      return getWords(Math.floor(n / 1000)) + " हजार " + getWords(n % 1000);
    }

    if (n < 10000000) {
      return getWords(Math.floor(n / 100000)) + " लाख " + getWords(n % 100000);
    }

    return getWords(Math.floor(n / 10000000)) + " कोटी " + getWords(n % 10000000);
  };

  if (!num || num === 0) return "शून्य रुपये";

  return getWords(Math.floor(num)).trim() + " रुपये";
};

const formatDate = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-GB");
};

const formatTime = (date) => {
  if (!date) return "";
  return new Date(date).toLocaleTimeString("en-US");
};
const generateVoucherGenerationPrintPDF = async ({
  mainData,
  taxDetails,
  corporationName,
}) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/VoucherGenerationPrint.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    // -------- MAIN TABLE ROWS --------
    const rows = mainData.map((item, index) => {
      const grossAmount = Number(item.GROSSAMOUNT || 0);
      const payableAmount = Number(item.AMT || 0);
      const payAmount = Number(item.CRAMT || item.AMT || 0);
      const balanceAmount = Number(item.BALAMT || 0);

      return {
        srNo: index + 1,
        glcode: item.DRGLCODE || "",
        accname: item.DRACCNO || "",
        grossAmount: formatNumber(grossAmount),
        partyNetPayable: formatNumber(payableAmount),
        narration: item.CRACNAME || "",
        payableAmount: formatNumber(payAmount),
        balanceAmount: formatNumber(balanceAmount),
      };
    });

    // -------- TOTALS --------
    // Calculate totals from all rows
    const totalPartyNetPayable = mainData.reduce(
      (sum, item) => sum + Number(item.AMT || 0),
      0
    );

    const totalPayAmountWithDeduction = mainData.reduce(
      (sum, item) => sum + Number(item.CRAMT || item.AMT || 0),
      0
    );

    const totalBalanceAmount = mainData.reduce(
      (sum, item) => sum + Number(item.BALAMT || 0),
      0
    );

    // Total deduction from tax details
    const totalDeduction = taxDetails.reduce(
      (sum, row) => sum + Number(row.AMOUNT || 0),
      0
    );

    // निव्वळ देय रक्कम = एकूण देय रक्कम - वजाती
    const totalPayAmount = totalPayAmountWithDeduction - totalDeduction;

    // Use first row for header/party info
    const firstRow = mainData[0];

    // -------- DEDUCTION ROWS --------
    const deductionRows = taxDetails.map((row, index) => ({
      srNo: index + 1,
      accno: row.ACCNO || "",
      accname: row.ACCNAME || "",
      amount: formatNumber(row.AMOUNT || 0),
      payamt: "",
      payamtWithDeduction: "",
    }));

    const html = template({
      corporationName,
      header: "Payment Voucher Acknowledgement",

      printDate: formatDate(firstRow.TRANSDATE),
      printTime: formatTime(firstRow.TRANSDATE),

      zone: firstRow.ZONEENAME || "",
      department: firstRow.DEPTNAME || "",
      username: firstRow.USERNAME || "",

      manualNo: firstRow.MANUALNO || "",
      systemBillNo: firstRow.SYSTEMBILLNO || "",

      voucherNo: firstRow.PREVCHNO || "",
      transNo: firstRow.TRANSNO || "",
      voucherDate: formatDate(firstRow.VOUCHERDATE),

      party: `${firstRow.PARTYID} ${firstRow.PARTYNAME}`,

      rows,  // All rows from mainData

      narration: firstRow.NARRATION || "",

      chequeNo: firstRow.CHQNO || "",
      chequeDate: formatDate(firstRow.CHQDATE),

      bankName: firstRow.BANKNAME || "",
      paymode: firstRow.PAYMODE || "",

      grossAmount: formatNumber(
        mainData.reduce((sum, item) => sum + Number(item.GROSSAMOUNT || 0), 0)
      ),
      payableAmount: formatNumber(totalPartyNetPayable),
      balanceAmount: formatNumber(totalBalanceAmount),

      totalBalanceAmount: formatNumber(totalBalanceAmount),

      amountWords: numberToMarathiWords(totalPayAmountWithDeduction),

      deductionRows,

      totalDeduction: formatNumber(totalDeduction),
      totalPartyNetPayable: formatNumber(totalPartyNetPayable),

      totalPayAmount: formatNumber(totalPayAmount),
      totalPayAmountWithDeduction: formatNumber(totalPayAmountWithDeduction),

      finalAmount: formatNumber(totalPartyNetPayable),
      finalAmountWords: numberToMarathiWords(totalPayAmountWithDeduction),
      finalPayable: formatNumber(totalPartyNetPayable),
    });

    // -------- PUPPETEER --------
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

    await page.setContent(html, {
      waitUntil: "networkidle0",
    });

    const fileName = `VoucherGeneration_${Date.now()}.pdf`;
    const filePath = path.resolve("public/pdf", fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "10px",
        bottom: "10px",
        left: "10px",
        right: "10px",
      },
    });

    await browser.close();

    return {
      fileName,
      filePath,
    };
  } catch (err) {
    console.error("VOUCHER PDF ERROR:", err);
    throw err;
  }
};

module.exports = {
  generateVoucherGenerationPrintPDF,
};