const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

//get financial Year
const getFinancialYear = (dateInput= new Date()) => {
  const date = new Date(dateInput);

  const year = date.getFullYear();
  const month = date.getMonth() + 1; // JS month is 0-based

  if (month >= 4) {
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};

// Convert image to base64
const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

const generatePdf = async ({  master,
    usage,
    pavti,
    amenities,
    rv,
    printDate}) =>{
        // console.log("data",master,usage,pavti,amenities,rv)
  const templatePath = path.join(__dirname, "../../templates/AssessCertiPdf.html");
  const htmlTemplate = fs.readFileSync(templatePath, "utf8");
Handlebars.registerHelper("inr", value =>
  Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
);

  const template = Handlebars.compile(htmlTemplate);
   const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
    const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";
   
    //to calculate totals
    const calculateUsageTotals = (master = []) => {
  return master.reduce(
    (acc, u) => {
      acc.area += Number(u.resident_area || 0);
      acc.builtup +=Number(u.builtup_area || 0);
      acc.totalArea += Number(u.total_area || 0);
      acc.rate += Number(u.room_lettingrate || 0);
      acc.monthly += Number(u.mnthlyrent || 0);
      acc.yearly += Number(u.yearlyrent || 0);
      return acc;
    },
    {
      area: 0,
      builtup:0,
      totalArea:0,
      rate: 0,
      monthly: 0,
      yearly: 0,
    }
  );
};
const calculateUsageSummary = (usage = []) => {
  const summary = {};
  let grandYearly = 0;
  let grandTotal = 0;

  usage.forEach(u => {
    const key = u.subtype || "NA";

    if (!summary[key]) {
      summary[key] = {
        subtype: key,
        yearlyrent: 0,
        total: 0,
      };
    }

    summary[key].yearlyrent += Number(u.yearlyrent || 0);
    summary[key].total += Number(u.total || 0);

    grandYearly += Number(u.yearlyrent || 0);
    grandTotal += Number(u.total || 0);
  });

  return {
    rows: Object.values(summary),
    grandYearly,
    grandTotal,
  };
};

  const html = template({  master,
    usage,logo,usageSummary:calculateUsageSummary(usage),
    pavti,usageTotals:calculateUsageTotals(master),
    amenities,financialYear:getFinancialYear(),
    rv,corporationName: "Nashik Municipal Corporation",
    printDate});

    const chromePath = path.resolve(
      __dirname,
      "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
    );
    const browser = await puppeteer.launch({
      headless: true,executablePath:chromePath,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
      const page = await browser.newPage();

  await page.setContent(html, { waitUntil: "networkidle0" });

  const pdfBuffer = await page.pdf({
    format: "A4",landscape:true,
    printBackground: true,
    margin: { top: "10mm", bottom: "10mm" }
  });

  await browser.close();

  const fileName = `AssessmentCertificate_${Date.now()}.pdf`;
  const outputPath = path.join(__dirname, "../../../public/pdf", fileName);
  fs.writeFileSync(outputPath, pdfBuffer);

  return { fileName, outputPath };
};

module.exports=generatePdf