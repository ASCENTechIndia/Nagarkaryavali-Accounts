// const fs = require("fs");
// const path = require("path");
// const puppeteer = require("puppeteer");
// const Handlebars = require("handlebars");
// const { PDFDocument } = require("pdf-lib");

// const formatAmount = (v) => Number(v || 0).toFixed(2);

// const formatDateDMY = (dateStr) => {
//   const d = new Date(dateStr);
//   const dd = String(d.getDate()).padStart(2, "0");
//   const mm = String(d.getMonth() + 1).padStart(2, "0");
//   const yyyy = d.getFullYear();
//   return `${dd}-${mm}-${yyyy}`;
// };

// const imageToBase64 = (imgPath) => {
//   const file = fs.readFileSync(imgPath);
//   const ext = path.extname(imgPath).replace(".", "");
//   return `data:image/${ext};base64,${file.toString("base64")}`;
// };

// const generateVasuliChalanPDF = async ({
//   rows = [],
//   fromDate,
//   toDate,
//   corporationName = "Municipal Corporation",
// }) => {
//   if (!rows.length) throw new Error("No data for PDF");

//   const templatePath = path.resolve(
//     __dirname,
//     "../../templates/vasuli-chalan-report.html"
//   );

//   const templateHtml = fs.readFileSync(templatePath, "utf8");
//   const template = Handlebars.compile(templateHtml);

//   // ✅ LOGO (same as daily collection)
//   const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
//   const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

//   // totals
//   const totals = rows.reduce(
//     (acc, r) => {
//       acc.cpTax += Number(r.cpTax || 0);
//       acc.eduTax += Number(r.eduTax || 0);
//       acc.chequeDishonour += Number(r.chequeDishonour || 0);
//       acc.finalAmount += Number(r.finalAmount || 0);
//       return acc;
//     },
//     { cpTax: 0, eduTax: 0, chequeDishonour: 0, finalAmount: 0 }
//   );

//   const html = template({
//     corporationName,
//     fromDate: formatDateDMY(fromDate),
//     toDate: formatDateDMY(toDate),
//     logo,

//     rows: rows.map((r, i) => ({
//       srNo: i + 1,
//       challanNo: r.challanNo,
//       cpTax: formatAmount(r.cpTax),
//       eduTax: formatAmount(r.eduTax),
//       chequeDishonour: formatAmount(r.chequeDishonour),
//       finalAmount: formatAmount(r.finalAmount),
//     })),

//     totals: {
//       cpTax: formatAmount(totals.cpTax),
//       eduTax: formatAmount(totals.eduTax),
//       chequeDishonour: formatAmount(totals.chequeDishonour),
//       finalAmount: formatAmount(totals.finalAmount),
//     },

//     printDate: new Date().toLocaleString("en-IN"),
//   });

//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   });

//   const page = await browser.newPage();
//   await page.setContent(html, { waitUntil: "domcontentloaded" });

//   const pdfBuffer = await page.pdf({
//     format: "A4",
//     printBackground: true,
//   });

//   await browser.close();

//   const finalPdf = await PDFDocument.create();
//   const tempPdf = await PDFDocument.load(pdfBuffer);
//   const pages = await finalPdf.copyPages(tempPdf, tempPdf.getPageIndices());
//   pages.forEach((p) => finalPdf.addPage(p));

//   const outputDir = path.resolve(__dirname, "../../../public/pdf/vasuli-chalan");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//   const fileName = `VasuliChalan_${Date.now()}.pdf`;
//   const outputPath = path.join(outputDir, fileName);

//   fs.writeFileSync(outputPath, await finalPdf.save());

//   return {
//     fileName,
//     url: `/pdf/vasuli-chalan/${fileName}`,
//   };
// };

// module.exports = { generateVasuliChalanPDF };


// const fs = require("fs");
// const path = require("path");
// const puppeteer = require("puppeteer");
// const Handlebars = require("handlebars");
// const { PDFDocument } = require("pdf-lib");

// const formatAmount = (v) => Number(v || 0).toFixed(2);

// const imageToBase64 = (imgPath) => {
//   const file = fs.readFileSync(imgPath);
//   const ext = path.extname(imgPath).replace(".", "");
//   return `data:image/${ext};base64,${file.toString("base64")}`;
// };

// const sum = (rows, key) =>
//   formatAmount(rows.reduce((t, r) => t + Number(r[key] || 0), 0));

// // Existing function for regular report
// const generateVasuliChalanPDF = async ({
//   rows = [],
//   fromDate,
//   toDate,
//   prabhagId,
//   collCenterId,
//   paymentMode,
//   corporationName,
// }) => {
//   if (!rows.length) throw new Error("NO_DATA");

//   const templatePath = path.resolve(
//     __dirname,
//     "../../templates/vasuli-chalan-report.html"
//   );

//   const templateHtml = fs.readFileSync(templatePath, "utf8");
//   const template = Handlebars.compile(templateHtml);

//   const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
//   const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

//   // Get filter labels for display
//   const getFilterLabel = async (id, type) => {
//     // You might want to fetch these from database or pass them as parameters
//     return id ? `ID: ${id}` : "-- All --";
//   };

//   const mappedRows = rows.map((r, i) => ({
//     srNo: i + 1,
//     challanNo: r.var_chalan_number,
//     date: r.dat_chalan_chalandate ? new Date(r.dat_chalan_chalandate).toLocaleDateString() : "-",
    
//     bcptax: formatAmount(r.bcptax),
//     bspecialwatertax: formatAmount(r.bspecialwatertax),
//     bcleaning: formatAmount(r.bcleaning),
//     bspledutax: formatAmount(r.bspledutax),
//     btreetax: formatAmount(r.btreetax),
//     belectric: formatAmount(r.belectric),
//     bwaterbenifittax: formatAmount(r.bwaterbenifittax),

//     ccptax: formatAmount(r.ccptax),
//     cspledutax: formatAmount(r.cspledutax),
//     ctreetax: formatAmount(r.ctreetax),
//     celectric: formatAmount(r.celectric),
//     cwaterbenifittax: formatAmount(r.cwaterbenifittax),
//     cdrenejtax: formatAmount(r.cdrenejtax),
//     croadtax: formatAmount(r.croadtax),

//     finalamt: formatAmount(r.finalamt),
//   }));

//   const totals = {
//     bcptax: sum(rows, "bcptax"),
//     bspecialwatertax: sum(rows, "bspecialwatertax"),
//     bcleaning: sum(rows, "bcleaning"),
//     bspledutax: sum(rows, "bspledutax"),
//     btreetax: sum(rows, "btreetax"),
//     belectric: sum(rows, "belectric"),
//     bwaterbenifittax: sum(rows, "bwaterbenifittax"),

//     ccptax: sum(rows, "ccptax"),
//     cspledutax: sum(rows, "cspledutax"),
//     ctreetax: sum(rows, "ctreetax"),
//     celectric: sum(rows, "celectric"),
//     cwaterbenifittax: sum(rows, "cwaterbenifittax"),
//     cdrenejtax: sum(rows, "cdrenejtax"),
//     croadtax: sum(rows, "croadtax"),

//     finalamt: sum(rows, "finalamt"),
//   };

//   const html = template({
//     corporationName,
//     fromDate,
//     toDate,
//     prabhagFilter: prabhagId ? `Prabhag: ${prabhagId}` : "-- All --",
//     centerFilter: collCenterId ? `Center: ${collCenterId}` : "-- All --",
//     modeFilter: paymentMode ? `Mode: ${paymentMode}` : "-- All --",
//     logo,
//     rows: mappedRows,
//     totals,
//     printDate: new Date().toLocaleString("en-IN"),
//   });

//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   });

//   const page = await browser.newPage();
//   await page.setContent(html, { waitUntil: "domcontentloaded" });

//   const pdfBuffer = await page.pdf({
//     format: "A4",
//     landscape: true,
//     printBackground: true,
//   });

//   await browser.close();

//   const finalPdf = await PDFDocument.create();
//   const tempPdf = await PDFDocument.load(pdfBuffer);
//   const pages = await finalPdf.copyPages(tempPdf, tempPdf.getPageIndices());
//   pages.forEach((p) => finalPdf.addPage(p));

//   const outputDir = path.resolve(__dirname, "../../../public/pdf/vasuli-chalan");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//   const fileName = `VasuliChalan_${Date.now()}.pdf`;
//   const outputPath = path.join(outputDir, fileName);

//   fs.writeFileSync(outputPath, await finalPdf.save());

//   return {
//     fileName,
//     url: `/pdf/vasuli-chalan/${fileName}`,
//   };
// };

// // New function for view only receipts
// const generateViewOnlyChallanPDF = async ({
//   challans = [],
//   date,
//   prabhagId,
//   collCenterId,
//   paymentMode,
//   corporationName,
// }) => {
//   if (!challans.length) throw new Error("NO_CHALLANS_FOUND");

//   const templatePath = path.resolve(
//     __dirname,
//     "../../templates/view-only-challan.html"
//   );

//   const templateHtml = fs.readFileSync(templatePath, "utf8");
//   const template = Handlebars.compile(templateHtml);

//   const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
//   const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

//   // Prepare data for each receipt
//   const receipts = challans.map((challan, index) => ({
//     // Receipt data
//     receiptNo: challan.var_chalan_number || `CH${index + 1}`,
//     receiptDate: new Date(challan.dat_chalan_chalandate).toLocaleDateString(),
    
//     // Owner/Property details
//     owner: challan.owner_name || "Not Available",
//     propno: challan.property_no || "Not Available",
//     address: challan.address || "Not Available",
//     occupantName: challan.occupant_name || "Not Available",
    
//     // Payment details
//     collectionCenter: challan.collection_center_name || "Not Available",
//     paymentMode: challan.payment_mode_name || "Not Available",
//     bankName: challan.var_bank_name || "Not Available",
//     instrumentNo: challan.var_instrument_no || "Not Available",
    
//     // Amount details
//     totalAmount: formatAmount(challan.num_total_amount),
//     amountInWords: challan.var_amount_in_words || "Not Available",
    
//     // Tax breakdown (adjust based on your actual schema)
//     generalTax: formatAmount(challan.general_tax),
//     treeTax: formatAmount(challan.tree_tax),
//     educationTax: formatAmount(challan.education_tax),
//     municipalEduTax: formatAmount(challan.municipal_edu_tax),
//     fireTax: formatAmount(challan.fire_tax),
//     sewageBenefitTax: formatAmount(challan.sewage_benefit_tax),
//     garbageCharge: formatAmount(challan.garbage_charge),
//     roadTax: formatAmount(challan.road_tax),
//     waterBenefitTax: formatAmount(challan.water_benefit_tax),
//     penalty: formatAmount(challan.penalty),
//     advanceAmount: formatAmount(challan.advance_amount),
    
//     // Financial breakdown
//     arrears: formatAmount(challan.arrears),
//     currentPart1: formatAmount(challan.current_part1),
//     currentPart2: formatAmount(challan.current_part2),
    
//     // Bill number (adjust based on your schema)
//     billno: challan.var_chalan_number || `BILL${index + 1}`
//   }));

//   const html = template({
//     corporationName,
//     date,
//     prabhagId,
//     collCenterId,
//     paymentMode,
//     logo,
//     receipts,
//     printDate: new Date().toLocaleString("en-IN"),
//     username: "System User" // You can get this from auth context
//   });

//   const browser = await puppeteer.launch({
//     headless: true,
//     args: ["--no-sandbox", "--disable-setuid-sandbox"],
//   });

//   const page = await browser.newPage();
//   await page.setContent(html, { waitUntil: "domcontentloaded" });

//   const pdfBuffer = await page.pdf({
//     format: "A4",
//     printBackground: true,
//   });

//   await browser.close();

//   const outputDir = path.resolve(__dirname, "../../../public/pdf/view-only-challans");
//   if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

//   const fileName = `ViewOnlyChallans_${Date.now()}.pdf`;
//   const outputPath = path.join(outputDir, fileName);

//   fs.writeFileSync(outputPath, pdfBuffer);

//   return {
//     fileName,
//     url: `/pdf/view-only-challans/${fileName}`,
//   };
// };

// module.exports = { 
//   generateVasuliChalanPDF,
//   generateViewOnlyChallanPDF 
// };


const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const formatAmount = (v) => Number(v || 0).toFixed(2);

const imageToBase64 = (imgPath) => {
  const file = fs.readFileSync(imgPath);
  const ext = path.extname(imgPath).replace(".", "");
  return `data:image/${ext};base64,${file.toString("base64")}`;
};

// Register Handlebars helpers
Handlebars.registerHelper('divide', function(value, divisor) {
  if (typeof value === 'string') value = parseFloat(value);
  if (typeof divisor === 'string') divisor = parseFloat(divisor);
  return (value / divisor).toFixed(2);
});

Handlebars.registerHelper('ifEquals', function(arg1, arg2, options) {
  return (arg1 == arg2) ? options.fn(this) : options.inverse(this);
});

const generateViewOnlyChallanPDF = async ({
  challans = [],
  date,
  prabhagId,
  collCenterId,
  paymentMode,
  corporationName,
  isViewOnly = true, 
  fromDate = null,
  toDate = null,
  prabhagName = null,
  collectionCenterName = null,
  paymentModeName = null
}) => {
  if (!challans.length) throw new Error("NO_CHALLANS_FOUND");

  const templatePath = path.resolve(
    __dirname,
    "../../templates/view-only-challan.html" 
  );

  const templateHtml = fs.readFileSync(templatePath, "utf8");
  const template = Handlebars.compile(templateHtml);

  const logoPath = path.resolve(__dirname, "../../assets/NMC_Logo.jpeg");
  const logo = fs.existsSync(logoPath) ? imageToBase64(logoPath) : "";

  const formatDateDMY = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const receipts = challans.map((challan, index) => {
    const challanNo = challan.var_chalan_number || `CH${index + 1}`;
    const challanDate = challan.dat_chalan_chalandate ? 
      formatDateDMY(challan.dat_chalan_chalandate) : 
      (date ? formatDateDMY(date) : "-");
    
    const actualPrabhagName = prabhagName || challan.prabhag_name ;
    const actualCollectionCenterName = collectionCenterName || challan.collection_center_name || challan.zonename ;
    const actualPaymentModeName = paymentModeName || challan.payment_mode_name;
    
    const authorizedBy = challan.var_chalan_authby || "System";
    
    const arrearsGeneralTax = formatAmount(challan.bcptax || 0);
    const arrearsTreeTax = formatAmount(challan.btreetax || 0);
    const arrearsEducationTax = formatAmount(challan.bspledutax || 0);
    const arrearsGarbage = formatAmount(challan.bcleaning || 0);
    const arrearsWaterBenefit = formatAmount(challan.bwaterbenifittax || 0);
    const arrearsSpecialWater = formatAmount(challan.bspecialwatertax || 0);
    const arrearsElectric = formatAmount(challan.belectric || 0);
    const arrearsRoad = formatAmount(challan.broadtax || 0);
    const arrearsSevrej = formatAmount(challan.bdrenejtax || 0);
    const arrearsPenalty = formatAmount(challan.bpenalty || 0);
    const arrearsServiceCharges = formatAmount(challan.bservicecharges || 0);
    const arrearsMunicipalEducationTax = formatAmount(challan.bedutax || 0);
    const advanceArrears = formatAmount(challan.badvance || 0);
    const arearResidentialTax = formatAmount(challan.bbigrestax || 0);
    const arrearEmpTax = formatAmount(challan.bemptax || 0);
    const arrearIllegalFine = formatAmount(challan.billegalfine || 0);

    const currentGeneralTax = formatAmount(challan.ccptax || 0);
    const currentTreeTax = formatAmount(challan.ctreetax || 0);
    const currentEducationTax = formatAmount(challan.cspledutax || 0);
    const currentGarbage = formatAmount(challan.ccleaning || 0);
    const currentWaterBenefit = formatAmount(challan.cwaterbenifittax || 0);
    const currentSpecialWater = formatAmount(challan.cspecialwatertax || 0);
    const currentElectric = formatAmount(challan.celectric || 0);
    const currentRoadTax = formatAmount(challan.croadtax || 0);
    const currentSewageTax = formatAmount(challan.cdrenejtax || 0);
    const currentPenalty = formatAmount(challan.cpenalty || 0);
    const currentServiceCharges = formatAmount(challan.cservicecharges || 0);
    const currentMunicipalEducationTax = formatAmount(challan.cedutax || 0);
    const advanceCurrent = formatAmount(challan.cadvance || 0);
    const currentResidentialTax = formatAmount(challan.cbigrestax || 0)
    const currentEmpTax = formatAmount(challan.cemptax || 0);   
    const currentIllegalFine = formatAmount(challan.cillegalfine || 0);

    const totalArrears = formatAmount(
      parseFloat(arrearsGeneralTax) + 
      parseFloat(arrearsTreeTax) + 
      parseFloat(arrearsEducationTax) + 
      parseFloat(arrearsGarbage) + 
      parseFloat(arrearsWaterBenefit) + 
      parseFloat(arrearsSpecialWater) + 
      parseFloat(arrearsElectric) +
      parseFloat(arrearsPenalty) +
      parseFloat(arrearsServiceCharges) + 
      parseFloat(arrearsMunicipalEducationTax) +
      parseFloat(advanceArrears) + 
      parseFloat(arearResidentialTax) + 
      parseFloat(arrearEmpTax) +
      parseFloat(arrearIllegalFine)
    );
    
    const totalCurrent = formatAmount(
      parseFloat(currentGeneralTax) + 
      parseFloat(currentTreeTax) + 
      parseFloat(currentEducationTax) +
      parseFloat(currentGarbage) + 
      parseFloat(currentElectric) + 
      parseFloat(currentWaterBenefit) + 
      parseFloat(currentRoadTax) + 
      parseFloat(currentSewageTax) +
      parseFloat(currentPenalty) +
      parseFloat(currentServiceCharges) + 
      parseFloat(currentMunicipalEducationTax) +
      parseFloat(advanceCurrent) +
      parseFloat(currentResidentialTax) + 
      parseFloat(currentEmpTax)  + 
      parseFloat(currentIllegalFine) 
    );
    
    const generalTaxTotal = formatAmount(parseFloat(arrearsGeneralTax) + parseFloat(currentGeneralTax));
    const treeTaxTotal = formatAmount(parseFloat(arrearsTreeTax) + parseFloat(currentTreeTax));
    const educationTaxTotal = formatAmount(parseFloat(arrearsEducationTax) + parseFloat(currentEducationTax));
    const garbageTotal = formatAmount(parseFloat(arrearsGarbage) + parseFloat(currentGarbage));
    const waterBenefitTotal = formatAmount(parseFloat(arrearsWaterBenefit) + parseFloat(currentWaterBenefit));
    const specialWaterTotal = formatAmount(parseFloat(arrearsSpecialWater) + parseFloat(currentSpecialWater));
    const electricTotal = formatAmount(parseFloat(arrearsElectric) + parseFloat(currentElectric));
    const roadTaxTotal = formatAmount(parseFloat(arrearsRoad) + parseFloat(currentRoadTax));
    const sewageTotal = formatAmount(parseFloat(arrearsSevrej) + parseFloat(currentSewageTax));
    const penaltyTotal = formatAmount(parseFloat(arrearsPenalty) + parseFloat(currentPenalty));
    const serviceChargesTotal = formatAmount(parseFloat(arrearsServiceCharges) + parseFloat(currentServiceCharges));
    const municipalEducationTaxTotal = formatAmount(parseFloat(arrearsMunicipalEducationTax) + parseFloat(currentMunicipalEducationTax));
    const advanceTotal = formatAmount(parseFloat(advanceArrears) + parseFloat(advanceCurrent));
    const residentialTotal = formatAmount(parseFloat(arearResidentialTax) + parseFloat(currentResidentialTax))
    const empTotal = formatAmount(parseFloat(arrearEmpTax) + parseFloat(currentEmpTax))
    const illegalFineTotal = formatAmount(parseFloat(arrearIllegalFine) + parseFloat(currentIllegalFine))
    const finalAmount = formatAmount(challan.finalamt || 0);
    
    const amountInWords = generateAmountInWords(parseFloat(finalAmount));

    const endTotal = formatAmount(parseFloat(totalArrears)+parseFloat(totalCurrent))

    return {
      receiptNo: challanNo,
      receiptDate: challanDate,
      
      owner: actualPrabhagName, 
      propno: actualCollectionCenterName,  
      occupantName: actualPaymentModeName,
      
      collectionCenter: actualCollectionCenterName,
      paymentMode: actualPaymentModeName,
      bankName: actualPaymentModeName === "Cash" ? "रोख" : "बँक ऑफ महाराष्ट्र",
      instrumentNo: actualPaymentModeName === "Cash" ? "N/A" : `INSTR${challanNo.substring(challanNo.length - 4)}`,
      
      totalAmount: finalAmount,
      amountInWords: amountInWords,
      
      arrearsGeneralTax: arrearsGeneralTax,
      arrearsTreeTax: arrearsTreeTax,
      arrearsEducationTax: arrearsEducationTax,
      arrearsGarbage: arrearsGarbage,
      arrearsWaterBenefit: arrearsWaterBenefit,
      arrearsSpecialWater: arrearsSpecialWater,
      arrearsElectric: arrearsElectric,
      arrearsPenalty: arrearsPenalty,
      arrearsServiceCharges: arrearsServiceCharges,
      arrearsMunicipalEducationTax: arrearsMunicipalEducationTax,
      advanceArrears: advanceArrears,
      arrearsRoad: arrearsRoad,
      arrearsSevrej: arrearsSevrej,
      arearResidentialTax: arearResidentialTax,
      arrearEmpTax: arrearEmpTax,
      arrearIllegalFine: arrearIllegalFine,

      currentGeneralTax: currentGeneralTax,
      currentTreeTax: currentTreeTax,
      currentEducationTax: currentEducationTax,
      currentElectric: currentElectric,
      currentWaterBenefit: currentWaterBenefit,
      currentRoadTax: currentRoadTax,
      currentSewageTax: currentSewageTax,
      currentPenalty: currentPenalty,
      currentServiceCharges: currentServiceCharges,
      currentMunicipalEducationTax: currentMunicipalEducationTax,
      advanceCurrent: advanceCurrent,
      currentSpecialWater: currentSpecialWater,
      currentGarbage: currentGarbage,
      currentResidentialTax: currentResidentialTax,
      currentEmpTax: currentEmpTax,
      currentIllegalFine: currentIllegalFine,
      
      generalTaxTotal: generalTaxTotal,
      treeTaxTotal: treeTaxTotal,
      educationTaxTotal: educationTaxTotal,
      garbageTotal: garbageTotal,
      waterBenefitTotal: waterBenefitTotal,
      specialWaterTotal: specialWaterTotal,
      electricTotal: electricTotal,
      roadTaxTotal: roadTaxTotal,
      sewageTotal: sewageTotal,
      penaltyTotal: penaltyTotal,
      serviceChargesTotal: serviceChargesTotal,
      municipalEducationTaxTotal: municipalEducationTaxTotal,
      advanceTotal: advanceTotal,
      residentialTotal: residentialTotal,
      empTotal : empTotal,
      illegalFineTotal: illegalFineTotal,
      
      totalArrears: totalArrears,
      totalCurrent: totalCurrent,
      finalAmount: endTotal,
      
      billno: challanNo,
      
      username: authorizedBy,
      printDate: new Date().toLocaleString("en-IN"),
      
      receiptFromDate: fromDate,
      receiptToDate: toDate,
      
      prabhagName: actualPrabhagName,
      collectionCenterName: actualCollectionCenterName,
      paymentModeName: actualPaymentModeName
    };
  });

  const html = template({
    corporationName,
    date: date ? formatDateDMY(date) : 
          (fromDate && toDate ? `${formatDateDMY(fromDate)} to ${formatDateDMY(toDate)}` : "-"),
    prabhagId,
    collCenterId,
    paymentMode,
    prabhagName: prabhagName || "All Prabhags",
    collectionCenterName: collectionCenterName || "All Centers",
    paymentModeName: paymentModeName || "All Modes",
    logo,
    receipts: receipts, 
    isViewOnly: isViewOnly,
    fromDate: fromDate ? formatDateDMY(fromDate) : null,
    toDate: toDate ? formatDateDMY(toDate) : null,
    printDate: new Date().toLocaleString("en-IN"),
    username: challans[0]?.var_chalan_authby || "System User"
  });

   const chromePath = path.resolve(
       __dirname,
       "../../../node_modules/puppeteer/.cache/puppeteer/chrome/win64-135.0.7049.84/chrome-win64/chrome.exe"
     );
     const browser = await puppeteer.launch({
       headless: true,executablePath:chromePath,
       args: ["--no-sandbox", "--disable-setuid-sandbox"],
     });

  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "domcontentloaded" });
  
  const pdfOptions = {
    format: "A4",
    printBackground: true,
    margin: {
      top: '10mm',
      right: '5mm',
      bottom: '10mm',
      left: '5mm'
    }
  };

  const pdfBuffer = await page.pdf(pdfOptions);

  await browser.close();

  const outputDir = path.resolve(__dirname, "../../../public/pdf/challan-reports");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const fileName = `${isViewOnly ? 'ViewOnly' : 'ChallanReport'}_${Date.now()}.pdf`;
  const outputPath = path.join(outputDir, fileName);

  fs.writeFileSync(outputPath, pdfBuffer);

  return {
    fileName,
    url: `/pdf/challan-reports/${fileName}`,
  };
};

function generateAmountInWords(amount) {
  if (amount === 0) return "शून्य रुपये फक्त";
  
  const units = ['', 'एक', 'दोन', 'तीन', 'चार', 'पाच', 'सहा', 'सात', 'आठ', 'नऊ'];
  const teens = ['दहा', 'अकरा', 'बारा', 'तेरा', 'चौदा', 'पंधरा', 'सोळा', 'सतरा', 'अठरा', 'एकोणीस'];
  const tens = ['', '', 'वीस', 'तीस', 'चाळीस', 'पन्नास', 'साठ', 'सत्तर', 'ऐंशी', 'नव्वद'];
  const hundreds = ['', 'शे', 'दोनशे', 'तीनशे', 'चारशे', 'पाचशे', 'सहाशे', 'सातशे', 'आठशे', 'नऊशे'];
  
  let num = Math.floor(amount);
  let words = '';
  
  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    words += (crores > 9 ? generateAmountInWords(crores) : units[crores]) + ' कोटी ';
    num %= 10000000;
  }
  
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    words += (lakhs > 9 ? generateAmountInWords(lakhs) : units[lakhs]) + ' लाख ';
    num %= 100000;
  }
  
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    words += (thousands > 9 ? generateAmountInWords(thousands) : units[thousands]) + ' हजार ';
    num %= 1000;
  }
  
  if (num >= 100) {
    const hundred = Math.floor(num / 100);
    words += hundreds[hundred] + ' ';
    num %= 100;
  }
  
  if (num >= 20) {
    const ten = Math.floor(num / 10);
    words += tens[ten] + ' ';
    num %= 10;
  } else if (num >= 10) {
    words += teens[num - 10] + ' ';
    num = 0;
  }
  
  if (num > 0) {
    words += units[num] + ' ';
  }
  
  const paisa = Math.round((amount - Math.floor(amount)) * 100);
  if (paisa > 0) {
    words += `आणि ${paisa} पैसे `;
  }
  
  return words.trim() + ' रुपये फक्त';
}

module.exports = { 
  generateViewOnlyChallanPDF 
};