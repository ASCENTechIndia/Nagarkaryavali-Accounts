const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const formatDate = (date) => {
  if (!date) return "";

  let d;

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

const BillRegisterPDFHelper = async ({ reportData, filters, corporationName, corporationLogo }) => {
  try {
    let { fromDate, toDate } = filters || {};

    fromDate = formatDate(fromDate);
    toDate = formatDate(toDate);

    if (!reportData || !reportData.length) {
      throw new Error("No data found for PDF");
    }

    const templatePath = path.resolve(__dirname, "../../templates/BillRegister.html");

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

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
        billAmountRaw: Number(row.BILLAMOUNT || 0),
        voucherNo: row.VOUCHERNO,
        voucherDate: formatDate(row.VOUCHERDATE),
        payment: formatNumber(payment),
        balance: formatNumber(row.BALANCESAMT),
      });

      group.subTotalRaw += payment;
    });
    const groupedData = Array.from(groupedMap.values()).map((g) => ({
      ...g,
      subTotal: formatNumber(g.subTotalRaw),
    }));

    let grandBillAmount = 0;
    let grandPayment = 0;

    groupedData.forEach((group) => {
      group.entries.forEach((entry) => {
        const billAmt = Number(String(entry.billAmountRaw || 0).replace(/,/g, ""));

        grandBillAmount += isNaN(billAmt) ? 0 : billAmt;
      });

      grandPayment += group.subTotalRaw || 0;
    });

    let grandBalance = grandBillAmount - grandPayment;

    const html = template({
      corporationName,
      corporationLogo,
      fromDate,
      toDate,
      groupedData,
      grandBillAmount: formatNumber(grandBillAmount),
      grandPayment: formatNumber(grandPayment),
      grandBalance: formatNumber(grandBalance),
    });

    // const browser = await puppeteer.launch({
    //   headless: true,
    //   args: ["--no-sandbox", "--disable-setuid-sandbox"],
    // });

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
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: false, // Optional: Usually better for many-column registers
      printBackground: true,
      displayHeaderFooter: true,
      headerTemplate: `
    <div style="font-family: Arial, sans-serif; font-size: 9px; width: 100%; margin: 0 20px; padding-bottom: 5px; border-bottom: 0.5px solid #ccc; display: flex; flex-direction: column;">
      <div style="display: flex; justify-content: space-between; width: 100%;">
        <div style="width: 35%; font-size: 12px">अहिल्यानगर महानगरपालिका, अहिल्यानगर</div>
        <div style="width: 30%; text-align: center; font-weight: bold; font-size: 14px">
          Bill Register <br/> बिल रजिस्टर
        </div>
        <div style="width: 35%; text-align: right; font-size: 10px">
          Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      </div>
      <div style="text-align: right; width: 100%; margin-top: 5px; font-size: 10px">
        ${fromDate} To ${toDate}
      </div>
    </div>
  `,
      footerTemplate: `<div></div>`, // Empty footer
      margin: {
        top: "100px", // Give enough room for the custom header
        bottom: "40px",
        left: "20px",
        right: "20px",
      },
    });

    await page.close();
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
