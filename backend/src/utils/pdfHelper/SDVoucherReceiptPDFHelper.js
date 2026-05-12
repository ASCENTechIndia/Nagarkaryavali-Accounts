// ================= PDF HELPER =================

const puppeteer = require("puppeteer");

const fs = require("fs");

const path = require("path");

const Handlebars = require("handlebars");

// ================= IMAGE BASE64 =================

const imageToBase64 = (imgPath) => {

  try {

    if (!imgPath) return "";

    if (imgPath.startsWith("data:image")) {
      return imgPath;
    }

    const file =
      fs.readFileSync(imgPath);

    const ext =
      path.extname(imgPath)
        .replace(".", "");

    return `data:image/${ext};base64,${file.toString("base64")}`;

  } catch {

    return "";
  }
};

// ================= FORMAT =================

const formatDate = (date) => {

  if (!date) return "";

  return new Date(date)
    .toLocaleDateString("en-GB");
};

const formatNumber = (num) => {

  return Number(num || 0)
    .toLocaleString("en-IN", {

      minimumFractionDigits: 2,

      maximumFractionDigits: 2,
    });
};

// ================= MAIN =================

const SDVoucherReceiptPDFHelper =
  async ({

    rows,

    referenceInfo,

    ulbInfo,
  }) => {

    try {

      const templatePath =
        path.resolve(
          __dirname,
          "../../templates/SDVoucherReceipt.html"
        );

      const htmlTemplate =
        fs.readFileSync(
          templatePath,
          "utf8"
        );

      const template =
        Handlebars.compile(
          htmlTemplate
        );

      // ================= LOGO =================

      const logo =
        imageToBase64(
          ulbInfo?.ULBLOGO
        );

      const row =
        rows[0];

      // ================= TOTALS =================

      const totalDebit =
        rows.reduce(
          (sum, item) =>
            sum +
            Number(item.AMT || 0),
          0
        );

      const totalCredit =
        rows.reduce(
          (sum, item) =>
            sum +
            Number(item.CRAMT || 0),
          0
        );

      const netAmount =
        totalDebit -
        totalCredit;

      // ================= HTML =================

      const html = template({

        logo,

        corporationName:
          ulbInfo?.ABC_MUNICIPAL_TEXT || "",

        currentDate:
          formatDate(new Date()),

        currentTime:
          new Date()
            .toLocaleTimeString(),

        voucherNo:
          row.REFNO,

        voucherDate:
          formatDate(
            row.TRANSDATE
          ),

        partyCode:
          row.PARTYID,

        partyName:
          row.PARTYNAME,

        partyPan:
          row.PANCARD,

        narration:
          row.NARRATION,

        zone:
          row.ZONEENAME,

        department:
          row.DEPTNAME,

        username:
          row.USERNAME,

        rows:
          rows.map(
            (item, index) => ({

              srNo:
                index + 1,

              drAccNo:
                item.DRACCNO,

              drAccName:
                item.DRACNAME,

              amount:
                formatNumber(
                  item.AMT
                ),

              crAmount:
                formatNumber(
                  item.CRAMT
                ),

              netAmount:
                formatNumber(
                  Number(item.AMT || 0) -
                  Number(item.CRAMT || 0)
                ),
            })
          ),

        totalDebit:
          formatNumber(
            totalDebit
          ),

        totalCredit:
          formatNumber(
            totalCredit
          ),

        netAmount:
          formatNumber(
            netAmount
          ),

        receiptNo:
          referenceInfo?.RECNO || "",

        receiptDate:
          formatDate(
            referenceInfo?.RECTRNSDATE
          ),
      });

      // ================= CHROME PATH =================

      let chromePath = null;

      const possiblePaths = [

        path.resolve(
          __dirname,
          "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
        ),
      ];

      for (const possiblePath of possiblePaths) {

        if (fs.existsSync(possiblePath)) {

          chromePath =
            possiblePath;

          break;
        }
      }

      // ================= PUPPETEER =================

      const launchOptions = {

        headless: true,

        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
        ],
      };

      if (chromePath) {

        launchOptions.executablePath =
          chromePath;
      }

      const browser =
        await puppeteer.launch(
          launchOptions
        );

      const page =
        await browser.newPage();

      await page.setContent(html, {

        waitUntil:
          "networkidle0",

        timeout: 30000,
      });

      // ================= OUTPUT =================

      const outputDir =
        path.resolve(
          __dirname,
          "../../../public/pdf"
        );

      if (!fs.existsSync(outputDir)) {

        fs.mkdirSync(
          outputDir,
          {
            recursive: true,
          }
        );
      }

      const fileName =
        `SDVoucherReceipt_${Date.now()}.pdf`;

      const filePath =
        path.join(
          outputDir,
          fileName
        );

      // ================= PDF =================

      await page.pdf({

        path: filePath,

        format: "A4",

        printBackground: true,

        margin: {

          top: "20px",

          bottom: "20px",

          left: "15px",

          right: "15px",
        },
      });

      await page.close();

      await browser.close();

      return {

        fileName,

        filePath,
      };

    } catch (err) {

      console.error(
        "PDF ERROR:",
        err
      );

      throw err;
    }
  };

module.exports = {
  SDVoucherReceiptPDFHelper,
};