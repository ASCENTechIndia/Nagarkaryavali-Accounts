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

  if (!num || num === 0) return "शून्य रुपये";

  return getWords(Math.floor(num)).trim() + " रुपये";
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
        netAmountInWords:
          numberToMarathiWords(
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