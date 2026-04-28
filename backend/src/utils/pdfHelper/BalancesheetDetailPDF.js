const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");
const Handlebars = require("handlebars");

// FORMAT NUMBER (DISPLAY ONLY)
const formatNumber = (num) => {
  if (num === null || num === undefined) return "";
  const n = Math.abs(Number(num)); // display positive
  if (n === 0) return "0";
  return Math.round(n).toLocaleString("en-IN"); // no decimal
};

const generateDetailPDF = async ({ data }) => {
  try {
    const templatePath = path.resolve(__dirname, "../../templates/BalancesheetDetail.html");
    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    let rows = [];

    let currentId = null;
    let currentDesc = "";

    let groupCurr = 0;
    let groupPrev = 0;

    data.forEach((row, index) => {
      const curr = Number(row.CURRENTYEAR || 0);
      const prev = Number(row.PREVIOUSYEAR || 0);
      const desc = (row.DESCRIPTION || "").trim();

      // 🔴 NEW GROUP
      if (currentId !== row.ID) {
        if (currentId !== null) {
          rows.push({
            isTotal: true,
            label: `एकूण ${currentDesc}`,
            CURRENTYEAR: formatNumber(groupCurr),
            PREVIOUSYEAR: formatNumber(groupPrev),
          });
        }

        currentId = row.ID;
        currentDesc = desc;

        groupCurr = 0;
        groupPrev = 0;
      }

      groupCurr += curr;
      groupPrev += prev;

      rows.push({
        isTotal: false,
        code: row.SCHCODE,
        name: row.SCHEDULENAME,
        CURRENTYEAR: formatNumber(curr),
        PREVIOUSYEAR: formatNumber(prev),
      });

      // LAST ROW
      if (index === data.length - 1) {
        rows.push({
          isTotal: true,
          label: `एकूण ${currentDesc}`,
          CURRENTYEAR: formatNumber(groupCurr),
          PREVIOUSYEAR: formatNumber(groupPrev),
        });
      }
    });

    console.log("FINAL ROWS LENGTH:", rows.length);

    const html = template({
      rows,
      printDate: new Date().toLocaleString("en-GB"),
    });
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: "networkidle0" });

    const fileName = `BalanceSheet_Detail_${Date.now()}.pdf`;
    const filePath = path.resolve("public/pdf", fileName);

    await page.pdf({
      path: filePath,
      format: "A4",
      printBackground: true,
      margin: {
        top: "40px", // 🔼 increase top space
        bottom: "40px", // 🔽 increase bottom space
        left: "20px",
        right: "20px",
      },
      displayHeaderFooter: true,

      headerTemplate: `<div></div>`, // keep empty

      footerTemplate: `
    <div style="
      width: 100%;
      font-size: 10px;
      padding: 0 20px;
      text-align: right;
    ">
      Print Date : ${new Date().toLocaleString("en-GB")}
    </div>
  `,
    });

    await browser.close();

    return { fileName, filePath };
  } catch (err) {
    console.error("DETAIL PDF ERROR:", err);
    throw err;
  }
};
module.exports = { generateDetailPDF };
