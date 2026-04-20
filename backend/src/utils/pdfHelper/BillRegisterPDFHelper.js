const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// ---------- Helpers ----------
const formatDate = (date) => {
  if (!date) return "";

  let d;

  // 🔥 Handle DD-MM-YYYY manually
  if (typeof date === "string" && date.includes("-")) {
    const [day, month, year] = date.split("-");
    d = new Date(`${year}-${month}-${day}`);
  } else {
    d = new Date(date);
  }

  if (isNaN(d)) return "";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  return `${day}-${month}-${year}`;
};

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN");
};

const imageToBase64 = (imgPath) => {
  try {
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return "";
  }
};

// ---------- MAIN HELPER ----------
const BillRegisterPDFHelper = async ({ reportData, filters }) => {
  try {
    let { fromDate, toDate } = filters || {};

    // ✅ format safely
    fromDate = formatDate(fromDate);
    toDate = formatDate(toDate);

    if (!reportData || !reportData.length) {
      throw new Error("No data found for PDF");
    }

    // 📄 Template
    const templatePath = path.resolve(__dirname, "../../templates/BillRegister.html");

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    // 🖼 Logo (optional)
    const logoPath = path.resolve(__dirname, "../../assets/logo.png");
    const logo = imageToBase64(logoPath);

    // =====================================================
    // 🔥 GROUPING LOGIC (VERY IMPORTANT)
    // =====================================================
    const groupedMap = new Map();

    reportData.forEach((row) => {
      const key = `${row.SERIALNO}_${row.BILLNO}`;

      if (!groupedMap.has(key)) {
        groupedMap.set(key, {
          srNo: row.SERIALNO,
          billNo: row.BILLNO,
          billDate: formatDate(row.BILLDATE),
          entries: [],
          subTotalRaw: 0,
        });
      }

      const group = groupedMap.get(key);

      // 🔥 SAFE PAYMENT PARSE (VERY IMPORTANT)
      let payment = 0;

      if (row.PAYMENTAMOUNT !== null && row.PAYMENTAMOUNT !== undefined) {
        payment = Number(String(row.PAYMENTAMOUNT).replace(/,/g, "").trim());
      }

      if (isNaN(payment)) payment = 0;

      group.entries.push({
        systemBillNo: row.SYSTEMBILLNO,
        systemDate: formatDate(row.SYSTEMBILLDATE),
        vendorName: row.VENDORNAME,
        remarks: row.REMARKS,
        billAmount: formatNumber(row.BILLAMOUNT),
        billAmountRaw: Number(row.BILLAMOUNT || 0), // ✅ ADD THIS
        voucherNo: row.VOUCHERNO,
        voucherDate: formatDate(row.VOUCHERDATE),
        payment: formatNumber(payment),
        balance: formatNumber(row.BALANCESAMT),
      });

      group.subTotalRaw += payment;
    });
    // ✅ FINAL FORMAT
    const groupedData = Array.from(groupedMap.values()).map((g) => ({
      ...g,
      subTotal: formatNumber(g.subTotalRaw),
    }));
    // =====================================================
    // 🔥 GRAND TOTAL
    // =====================================================
    let grandBillAmount = 0;
    let grandPayment = 0;

    groupedData.forEach((group) => {
      // 🔥 Sum ALL bill amounts (not just first row)
      group.entries.forEach((entry) => {
        const billAmt = Number(String(entry.billAmountRaw || 0).replace(/,/g, ""));

        grandBillAmount += isNaN(billAmt) ? 0 : billAmt;
      });

      // ✅ Payment already correct
      grandPayment += group.subTotalRaw || 0;
    });

    // ✅ FINAL BALANCE (IMPORTANT)
    let grandBalance = grandBillAmount - grandPayment;

    // =====================================================
    // 🧾 TEMPLATE DATA
    // =====================================================
    const html = template({
      corporationName: "अहिल्यानगर महानगरपालिका, अहिल्यानगर",
      fromDate,
      toDate,
      groupedData,
      grandBillAmount: formatNumber(grandBillAmount),
      grandPayment: formatNumber(grandPayment),
      grandBalance: formatNumber(grandBalance),
    });

    // =====================================================
    // 🚀 GENERATE PDF
    // =====================================================
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: false,
      printBackground: true,

      displayHeaderFooter: true,

      headerTemplate: `
    <div style="font-size:10px; width:100%; padding:0 20px;">
      <div style="float:right;">
        Page <span class="pageNumber"></span> of <span class="totalPages"></span>
      </div>
    </div>
  `,

      footerTemplate: `
    <div></div>
  `,

      margin: {
        top: "70px",
        bottom: "40px",
        left: "20px",
        right: "20px",
      },
    });

    await browser.close();

    // =====================================================
    // 💾 SAVE FILE
    // =====================================================
    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Bill_Register_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return {
      fileName,
      filePath,
    };
  } catch (error) {
    console.error("Bill Register PDF Error:", error);
    throw error;
  }
};

module.exports = {
  BillRegisterPDFHelper,
};
