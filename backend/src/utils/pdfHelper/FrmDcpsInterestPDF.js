
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

const formatNumber = (value) => {
  if (value === null || value === undefined || value === "") return "0.00";

  const num = Number(value);
  return Number.isFinite(num) ? num.toFixed(2) : "0.00";
};

const formatSalMonthYear = (value) => {
  if (!value) return "";

  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  if (value instanceof Date && !isNaN(value)) {
    return `${months[value.getMonth()]} ${value.getFullYear()}`;
  }

  const str = String(value).trim();

  const namedMonth = str.match(/([A-Za-z]{3,})\s+\d{1,2}[,\s]+\d{4}/);
  if (namedMonth) {
    const m = months.find(
      (mm) => mm.toLowerCase() === namedMonth[1].slice(0, 3).toLowerCase()
    );
    const yearMatch = str.match(/(\d{4})/);
    if (m && yearMatch) return `${m} ${yearMatch[1]}`;
  }

  const dayFirst = str.match(/\d{1,2}\s+([A-Za-z]{3,})\s+(\d{4})/);
  if (dayFirst) {
    const m = months.find(
      (mm) => mm.toLowerCase() === dayFirst[1].slice(0, 3).toLowerCase()
    );
    if (m) return `${m} ${dayFirst[2]}`;
  }

  const isoMatch = str.match(/^(\d{4})-(\d{1,2})/);
  if (isoMatch) {
    const monthIdx = Number(isoMatch[2]) - 1;
    if (monthIdx >= 0 && monthIdx < 12) {
      return `${months[monthIdx]} ${isoMatch[1]}`;
    }
  }

  const d = new Date(str);
  if (!isNaN(d)) {
    return `${months[d.getMonth()]} ${d.getFullYear()}`;
  }

  return str;
};


const generateDcpsInterestPDF = async ({ data }) => {
  let browser;

  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/FrmDcpsInterestReport.html"
    );

    const htmlTemplate = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(htmlTemplate);

    const records = Array.isArray(data) ? data : [];

    const rows = records.map((item, index) => {
      const openingBalance = Number(item.OPENING_BALANCE) || 0;
      const employeeContribution =
        Number(item.EMPLOYEE_CONTRIBUTION) || 0;
      const ulbContribution = Number(item.ULB_CONTRIBUTION) || 0;

      const total =
        openingBalance +
        employeeContribution +
        ulbContribution;

      const interestRate = Number(item.INTEREST_PERCENTAGE) || 0;

      const interestAmount =
        item.INTEREST_AMOUNT !== null &&
        item.INTEREST_AMOUNT !== undefined
          ? Number(item.INTEREST_AMOUNT) || 0
          : (total * interestRate) / 100 / 12;

      return {
        srNo: index + 1,
        employeeName: item.EMPLOYEE_NAME || "",
        //salDate: item.SALARY_DATE || "",
        salDate: formatSalMonthYear(item.SALARY_DATE),
        dcpsNo: item.DCPS_NUMBER || "",
        //calculatedBalance: formatNumber(CALCULATED_AMOUNT),
        //calculatedBalance: formatNumber(item.CALCULATED_AMOUNT),
        openingBalance: formatNumber(openingBalance),
        employeeContribution: formatNumber(employeeContribution),
        ulbContribution: formatNumber(ulbContribution),
        total: formatNumber(total),
        interestAmount: formatNumber(interestAmount),
        interestRate: `${interestRate.toFixed(2)}%`,
      };
    });

    const totals = rows.reduce(
      (acc, row) => {
        //acc.calculatedBalance += Number(row.calculatedBalance);
        acc.openingBalance += Number(row.openingBalance);
        acc.employeeContribution += Number(row.employeeContribution);
        acc.ulbContribution += Number(row.ulbContribution);
        acc.total += Number(row.total);
        acc.interestAmount += Number(row.interestAmount);
        return acc;
      },
      {
        //calculatedBalance: 0,
        openingBalance: 0,
        employeeContribution: 0,
        ulbContribution: 0,
        total: 0,
        interestAmount: 0,
      }
    );

    const html = template({
      rows,
      totals: {
        //calculatedBalance: formatNumber(totals.calculatedBalance),
        openingBalance: formatNumber(totals.openingBalance),
        employeeContribution: formatNumber(totals.employeeContribution),
        ulbContribution: formatNumber(totals.ulbContribution),
        total: formatNumber(totals.total),
        interestAmount: formatNumber(totals.interestAmount),
      },
      year: records[0]?.YEAR || "",
      dcpsNo: records[0]?.DCPS_NUMBER || "",
      printDate: new Date().toLocaleDateString("en-GB"),
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

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0" });

    const outputDir = path.resolve("public/pdf");
    fs.mkdirSync(outputDir, { recursive: true });

    const fileName = `DcpsInterestReport_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: {
        top: "20px",
        bottom: "20px",
        left: "20px",
        right: "20px",
      },
    });

    return { fileName, filePath };
  } catch (err) {
    console.error("DCPS INTEREST PDF ERROR:", err);
    throw err;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

module.exports = { generateDcpsInterestPDF };
