const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// ================= FORMAT =================
const formatAmount = (n) => {
  return Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatDate = (d) => {
  if (!d) return "";
  return new Date(d).toLocaleDateString("en-GB");
};

// ================= MAIN =================
const CounterVoucherGeneration = async ({
  header,
  details,
  corporationName,
  corporationLogo,
}) => {
  try {
    if (!header || Object.keys(header).length === 0) {
      throw new Error("Header data missing");
    }
    const templatePath = path.resolve(
      __dirname,
      "../../templates/CounterVoucherGeneration.html",
    );

    const htmlFile = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlFile);

    const now = new Date();

    // ================= MAIN TABLE =================
    const totalNet = Number(header.AMT || 0);
    const totalPaid = Number(header.CRAMT || 0);
    const totalBalance = Number(header.BALAMT || 0);
    const rows = [
      {
        sr: 1,
        glcode: header.DRGLCODE || "",
        accname: header.DRACCNO || "",
        narration: header.CRACNAME || "Testing",

        total: formatAmount(header.GROSSAMOUNT || header.AMT),
        deduction: formatAmount(
          (header.GROSSAMOUNT || 0) - (header.CRAMT || 0),
        ),

        paid: formatAmount(header.CRAMT || header.AMT),
        balance: formatAmount(header.BALAMT || 0),
      },
    ];

    // ================= SECOND TABLE =================
    const detailRows = [
      {
        sr: 1,
        glcode: header.DRGLCODE || "",
        accname: header.DRACCNO || "",
        narration: header.CRACNAME || "",

        amount: formatAmount(header.CRAMT || header.AMT),
        total: formatAmount(header.GROSSAMOUNT || header.AMT),
      },
    ];

    // ================= TEMPLATE DATA =================
    const html = template({
      corporationName,
      logo: corporationLogo,

      // LEFT SIDE
      zone: header.ZONEENAME || "",
      deptname: header.DEPTNAME || "",
      manualno: header.MANUALNO || "",
      systembillno: header.SYSTEMBILLNO || "",

      // RIGHT SIDE
      date: now.toLocaleDateString("en-GB"),
      time: now.toLocaleTimeString(),

      refno: header.REFNO || "",
      transno: header.TRANSNO || "",
      transdate: formatDate(header.TRANSDATE),

      // PARTY
      username: header.USERNAME || "",
      partyname: header.PARTYNAME || "",

      glcode: header.DRGLCODE || "",
      // BANK
      chqno: header.CHQNO || "",
      bankname: header.BANKNAME || "",

      // TEXT
      narration: header.NARRATION || "",

      // TABLES
      rows,
      detailRows,

      // TOTALS
      totalNet: formatAmount(totalNet),
      totalPaid: formatAmount(totalPaid),
      totalBalance: formatAmount(totalBalance),

      // OPTIONAL
      grossamount: formatAmount(header.GROSSAMOUNT),
      amountWords: formatAmount(totalNet), // (can upgrade later)
    });

    // ================= PDF =================
    // const browser = await getBrowser();
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
    
    page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: {
        top: "10mm",
        bottom: "10mm",
        left: "10mm",
        right: "10mm",
      },
    });

    await browser.close();

    // ================= SAVE =================
    const dir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const fileName = `CounterVoucher_${Date.now()}.pdf`;
    const filePath = path.join(dir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };
  } catch (err) {
    console.error("Counter Voucher PDF Error:", err);
    throw err;
  }
};

module.exports = {
  CounterVoucherGeneration,
};
