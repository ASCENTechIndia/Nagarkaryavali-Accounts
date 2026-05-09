const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

// =======================
// FORMAT HELPERS
// =======================
const formatDate = (d) =>
  d ? new Date(d).toLocaleDateString("en-GB") : "";

const formatNumber = (n) =>
  Number(n || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
  });

const getValueOrAll = (val) => {
  if (val === undefined || val === null || val === "" || val === "-1") {
    return "All";
  }
  return val;
};

// =======================
// GROUPING
// =======================
const groupByParty = (rows) => {
  const map = {};
  rows.forEach((r) => {
    if (!map[r.PARTYNAME]) map[r.PARTYNAME] = [];
    map[r.PARTYNAME].push(r);
  });

  return Object.keys(map).map((k) => ({
    party: k,
    records: map[k],
  }));
};

// =======================
// MAIN HELPER
// =======================
const GovtTaxRegisterSummaryPDFHelper = async ({
  reportData,
  filters,
  corporationName,
  corporationLogo,
}) => {
  try {
    if (!reportData || !reportData.length) {
      throw new Error("No data found for PDF");
    }

    // =======================
    // FILTER FORMAT (IMPORTANT FIX)
    // =======================
    const filterData = {
      deductionHead:
        filters.majorName || getValueOrAll(filters.majorCode),

      bank:
        filters.bankName ||
        (filters.bankAcc
          ? `${filters.bankGl || ""}-${filters.bankAcc}`
          : "All"),

      vendor:
        filters.partyName || getValueOrAll(filters.partyId),

      fromDate: formatDate(filters.fromDate),
      toDate: formatDate(filters.toDate),
    };

    // =======================
    // GROUP DATA
    // =======================
    const groups = groupByParty(reportData);

    const formattedGroups = groups.map((g) => {
      const rows = g.records.map((r) => ({
        date: formatDate(r.TRANSDT),
        name: r.TDSNAME,
        amount: formatNumber(r.TAXAMT),
        rawAmount: Number(r.TAXAMT || 0), // keep raw for summation
      }));

      const total = rows.reduce((sum, r) => sum + r.rawAmount, 0);

      return {
        party: g.party,
        rows,
        total: formatNumber(total),
      };
    });


    // =======================
    // LOAD TEMPLATE
    // =======================
    const templatePath = path.resolve(
      __dirname,
      "../../templates/GovtTaxRegisterSummary.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const html = template({
      corporationName,
      corporationLogo,

      filters: filterData, // ✅ FIXED (NO RAW FILTERS)

      groups: formattedGroups,

      currentDate: formatDate(new Date()),
      currentTime: new Date().toLocaleTimeString(),
    });

    // =======================
    // LAUNCH BROWSER
    // =======================
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

    // =======================
    // GENERATE PDF
    // =======================
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
    });

    await page.close();
    await browser.close();

    // =======================
    // SAVE FILE
    // =======================
    const outputDir = path.resolve(__dirname, "../../../public/pdf");

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `GovtTaxSummary_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return {
      fileName,
      filePath,
    };
  } catch (error) {
    console.error("GovtTaxRegisterSummary PDF Error:", error);
    throw error;
  }
};

module.exports = {
  GovtTaxRegisterSummaryPDFHelper,
};