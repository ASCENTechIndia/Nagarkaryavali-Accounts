const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

/* ✅ Convert image to base64 */
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

/* ✅ Format Date to DD/MM/YYYY */
const formatDateDDMMYYYY = (date) => {
  if (!date) return null;

  let d;

  // Check if it's a Date object
  if (date instanceof Date) {
    d = date;
  } else if (typeof date === "string") {
    // Try to parse the string
    d = new Date(date);
    if (isNaN(d.getTime())) {
      // Try different formats
      const parts = date.split("-");
      if (parts.length === 3) {
        d = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        return null;
      }
    }
  } else {
    return null;
  }

  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
};

/* ✅ Format Date to DD-MM-YYYY */
const formatDateDDMMYYYYWithDash = (date) => {
  if (!date) return null;

  let d;

  if (date instanceof Date) {
    d = date;
  } else if (typeof date === "string") {
    d = new Date(date);
    if (isNaN(d.getTime())) {
      const parts = date.split("-");
      if (parts.length === 3) {
        d = new Date(parts[2], parts[1] - 1, parts[0]);
      } else {
        return null;
      }
    }
  } else {
    return null;
  }

  return `${String(d.getDate()).padStart(2, "0")}-${String(d.getMonth() + 1).padStart(2, "0")}-${d.getFullYear()}`;
};

/* ✅ Generate Mutation Report PDF */
const generateMutationReportPDF2 = async (mutationData, userId, userName, mutationTypeName, documents) => {
  let browser;

  try {
    /* ==============================
        ✅ Template Path
    ============================== */
    const templatePath = path.resolve(
      __dirname,
      "../../templates/transfer-application-report2.html",
    );

    if (!fs.existsSync(templatePath)) {
      throw new Error(`Template not found at: ${templatePath}`);
    }

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    /* ==============================
        ✅ Get Today's Date
    ============================== */
    const today = new Date();
    const currentDate = formatDateDDMMYYYY(today);

    const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

    const formattedDocuments = Array.isArray(documents) ? documents : [];

    /* ==============================
        ✅ Format Mutation Data
    ============================== */
    const formattedData = {
      corporationName: "Nashik Municipal Corporation",
      logo,
      currentDate: currentDate,
      mutationid: mutationData.mutationid || "",
      mutationno: mutationData.mutationno || "",
      mutationTypeName: mutationTypeName || "",
      inwarddate: mutationData.inwarddate
        ? formatDateDDMMYYYYWithDash(mutationData.inwarddate)
        : "",
      newownermobile: mutationData.newownermobile || "—",
      newowneremail: mutationData.newowneremail || "—",
      adharcardno: mutationData.adharcardno || "—",
      propno: mutationData.propno || "",
      oldname: mutationData.oldname || "",
      galano: mutationData.galano || "",
      address: mutationData.address || "",
      proparea: mutationData.proparea
        ? Number(mutationData.proparea).toFixed(2)
        : "0.00",
      transferfee: mutationData.transferfee
        ? Number(mutationData.transferfee).toLocaleString("en-IN")
        : "0.00",
      chaintransferfee: mutationData.chaintransferfee
        ? Number(mutationData.chaintransferfee).toLocaleString("en-IN")
        : "0.00",
      newownername: mutationData.newownername || "",
      userId: userId || "",
      userName: userName || "",
      documents: formattedDocuments
    };


    console.log("formated data", formattedData)

    /* ==============================
        ✅ Prepare HTML Content
    ============================== */
    const html = template(formattedData);

    /* ==============================
        ✅ Launch Browser
    ============================== */
    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe",
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

    /* ==============================
        ✅ Set HTML Content
    ============================== */
    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 30000,
    });

    /* ==============================
        ✅ Generate PDF
    ============================== */
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "12mm", bottom: "12mm", left: "12mm", right: "12mm" },
    });

    await page.close();
    await browser.close();

    /* ==============================
        ✅ Save PDF File
    ============================== */
    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `MutationReport_${mutationData.propno}_${Date.now()}.pdf`;
    const outputPath = path.join(outputDir, fileName);

    fs.writeFileSync(outputPath, pdfBuffer);

    return { fileName, outputPath };
  } catch (error) {
    console.error("❌ Mutation PDF generation error:", error);

    // Close browser if it exists
    if (browser) {
      try {
        await browser.close();
      } catch (closeError) {
        console.error("Error closing browser:", closeError);
      }
    }

    throw error;
  }
};

module.exports = {
  generateMutationReportPDF2,
  formatDateDDMMYYYY,
  formatDateDDMMYYYYWithDash,
};
