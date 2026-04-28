const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// ================= NUMBER FORMAT =================
const formatNumber = (num) => {
  if (num === null || num === undefined) return "";

  const n = Math.abs(Number(num)); // ✅ ONLY FOR DISPLAY

  if (n === 0) return "0";

  return Math.round(n).toLocaleString("en-IN"); // ✅ NO DECIMAL
};

// ================= MAIN FUNCTION =================
const generateSummaryPDF = async ({ data }) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/BalancesheetSummary.html");

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    // ================= SPLIT DATA =================
    const liabilitiesData = data.filter((x) => x.TYPE?.trim() === "L");
    const assetsData = data.filter((x) => x.TYPE?.trim() === "A");

    // ================= PROCESS FUNCTION =================
    const processGroup = (inputData) => {
      let rows = [];

      let currentGroupId = null;
      let currentHeading = "";

      let groupTotalCurr = 0;
      let groupTotalPrev = 0;

      let grandCurr = 0;
      let grandPrev = 0;

      inputData.forEach((row, index) => {
        const desc = (row.DESCRIPTION || "").trim();
        const curr = Number(row.CURRENTYEAR || 0);
        const prev = Number(row.PREVIOUSYEAR || 0);

        // 🔹 NEW GROUP
        if (currentGroupId !== row.GROUPID) {
          if (currentGroupId !== null) {
            rows.push({
              isTotal: true,
              label: `एकूण ${currentHeading.trim()}`,
              CURRENTYEAR: formatNumber(groupTotalCurr),
              PREVIOUSYEAR: formatNumber(groupTotalPrev),
            });
          }

          currentGroupId = row.GROUPID;
          currentHeading = row.HEADING;

          groupTotalCurr = 0;
          groupTotalPrev = 0;
        }

        // accumulate
        groupTotalCurr += curr;
        groupTotalPrev += prev;

        grandCurr += curr;
        grandPrev += prev;

        // push normal row
        rows.push({
          isTotal: false,
          MCODE: row.MCODE === "0" ? "" : row.MCODE,
          DESCRIPTION: desc,
          SCHNO: row.SCHNO?.trim() || "",
          CURRENTYEAR: formatNumber(curr),
          PREVIOUSYEAR: formatNumber(prev),
        });

        // 🔹 LAST ROW
        if (index === inputData.length - 1) {
          rows.push({
            isTotal: true,
            label: `एकूण ${currentHeading.trim()}`,
            CURRENTYEAR: formatNumber(groupTotalCurr),
            PREVIOUSYEAR: formatNumber(groupTotalPrev),
          });
        }
      });

      return {
        rows,
        totalCurrent: formatNumber(grandCurr),
        totalPrevious: formatNumber(grandPrev),
      };
    };

    // ================= PROCESS BOTH =================
    const liabilities = processGroup(liabilitiesData);
    const assets = processGroup(assetsData);

    // ================= HTML =================
    const html = template({
      liabilities: liabilities.rows,
      assets: assets.rows,
      totalL: {
        current: liabilities.totalCurrent,
        previous: liabilities.totalPrevious,
      },
      totalA: {
        current: assets.totalCurrent,
        previous: assets.totalPrevious,
      },
      date: new Date().toLocaleDateString("en-GB"),
      printDate: new Date().toLocaleString("en-GB"),
    });

    // ================= PDF =================
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const fileName = `BalanceSheet_${Date.now()}.pdf`;
    const filePath = path.resolve("public/pdf", fileName);
    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    await browser.close();

    return { fileName, filePath };
  } catch (err) {
    console.error("PDF ERROR:", err);
    throw err;
  }
};
module.exports = { generateSummaryPDF };
