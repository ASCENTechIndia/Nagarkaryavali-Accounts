const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");
const Handlebars = require("handlebars");

const imageToBase64 = (imgPath) => {
  try {
    const file = fs.readFileSync(imgPath);
    const ext = path.extname(imgPath).replace(".", "");
    return `data:image/${ext};base64,${file.toString("base64")}`;
  } catch {
    return "";
  }
};

const formatNumber = (num) => {
  return Number(num || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Department → Account Code Mapping
 * Based on the reference PDF structure
 */
const DEPARTMENT_ACCOUNT_MAP = {
  // Departments 1-4 (top section)
  "खुला भूखंड कर विभाग": [
    "91111170001", "31615210003", "94311400001", "91011900002",
    "81111400002", "94713130001", "97111710001", "94811400001",
    "98138110001", "98238120001", "91915800001",
  ],
  "मालमत्ता कर विभाग": [
    "91111110001", "91015210001", "31615210002", "91011400003",
    "91011900001", "81111400003", "94713310002", "97111710002",
    "34011190001", "34011190002", "91015210004", "94311400002",
    "94811400002", "98138110002", "98238120002", "91047500001",
    "91915890002",
  ],
  "किरकोळ वसुली विभाग": [
    "45114240001", "98938190004", "43015590001", "44011310001",
    "45414290001", "54315200001", "45415210001",
  ],
  "मार्केट विभाग": [
    "45114240001", "41015430001", "44015210001", "98938190004",
    "99038900001", "44019900001", "45014100002", "4419900001",
    "91915890001", "44015800002", "45114200001", "92011200001",
  ],

  // Rebate
  "रिबेट (मालमत्ता कर)": [
    "91028290001", "91028290004", "91028290003",
  ],

  // Departments 5-28
  "छ. शाहुमहाराज रुग्णालय व सु. गृह": ["41215200001"],
  "शाहीर अमर शेख दवाखाना": ["41215200002"],
  "मो. युसुफ आयु.दवाखाना": ["41215210001"],
  "चेतनदास मेहता रूग्णालय": ["41215200003"],
  "पिंप्राळा प्राथमिक आरोग्य केंद्र": ["41215200004"],
  "कै.डि.बी.जैन रुग्ण. सुतीकागृह": ["41215200005"],
  "कै.नानीबाई अग्रवाल दवाखाना": ["41215200006"],
  "मुलतानी दवाखाना": ["41215200007"],
  "पंडीत दिनदयाल दवाखाना": ["41215210003"],
  "शव वाहीका व रुग्णवाहिका": ["41215200009"],
  "अर्थ विभाग (इतर किरकोळ)": [
    "45414210002", "11116100001", "1015200001", "3219200001",
    "4319900001", "3515720001", "13015890001", "3247100001",
    "7613100001", "03116200001",
  ],
  "नगर रचना": [
    "11115540001", "11115550001", "11115570001", "81215210001",
    "11115720001",
  ],
  "आरोग्य विभाग/अन्न भेसळ प्रतीबंधक": [
    "62015430001", "62919000001", "13015890001", "34119900001",
    "1015200001", "4319900001", "11116100001",
  ],
  "मटन मार्केट": ["44315430001"],
  "अतिक्रमण विभाग": ["01015200001", "13015890001"],
  "फायर": ["81219000001", "01015200001"],
  "नक्कल फी (जन्म-मृत्यु)": [
    "64015720001", "64015720002", "64015720003", "64015720004",
    "64015720005",
  ],
  "साने गुरुजी ग्रंथालय": [
    "52115200001", "52113100001", "01015200001",
  ],
  "नाट्यगृह भाडे + सागरपार्क भाडे": ["45414300001", "45414300002"],
  "नविन नळ कने. (मा. कर वि.) (सर्वसाधारण चलन)": [
    "91015710001", "31615440001", "31615440002", "31015450001",
    "32019900001", "91037190001",
  ],
  "आस्थापना": ["01015200001"],
  "अभिलेखा": ["03515720001", "01815790001", "01015200001"],
  "दैनंदिन बाजार शुल्क": ["44015200001"],
  "घरकुल सेवा शुल्क": ["45414210001"],

  // Departments 29-40
  "पर्यावरण विभाग": ["55119900001", "13015890001"],
  "मालमत्ता कर विभाग इतर (सर्वसाधारण चलन)": [
    "31615210001", "91015720001", "45015620001", "91015890003",
    "91015200002", "21015890001", "32019900001", "4319900001",
  ],
  "सार्व. बांधकाम": ["01015200001", "04319900001", "11116100001"],
  "किरकोळ वसुली इतर": ["01015200001"],
  "वाहनतळ": ["25015160001"],
  "पाणीपुवाठा विभाग इतर": ["11116100001", "01015200001", "04319900001"],
  "नगर रचना इतर": ["01015200001"],
  "TDR (T.P.)": ["11115690001"],
  "प्रिमियम चार्जेस (T.P.)": ["11119900001"],
  "जाहिरात": [
    "45915170001", "45014100001", "92015430001", "98938190004",
    "13015890001",
  ],
  "विवाह नोंदणी": ["64015470001", "64015830001"],
  "मिळकत व्यवस्थापन": ["01015200001"],

  // Extra
  "मोठा निवासी (150 चौ.मी.)": ["91037190002"],

  // Fire section
  "अग्निशमन वार्षिक फी": ["81215210002"],
  "अग्निशमन ना-हरकत दाखला शुल्क": ["81215210003"],
  "अग्निशमन ना-हरकत दाखला नुतनीकरण": ["81215210004"],
  "तात्पुरता दाखला शुल्क": ["81215210005"],
  "आग विझविण्याचा दाखला शुल्क/फी": ["81215210006"],
  "स्टँडबाय ड्युटी": ["81215210007"],
  "मनपा हद्दीबाहेर अग्निशमन दलाची मदत (फायर/रेस्क्यु वर्दी)": ["81215210008"],
  "अग्निशमन प्रशिक्षण शुल्क": ["81215210009"],
};

/**
 * Calculate sum for a set of account codes from transaction data.
 * Only sums rows where accno is in the mapped account codes.
 */
function calculateMappedSum(transactions, accountCodes) {
  const codeSet = new Set(accountCodes.map((c) => String(c).trim()));

  return transactions.reduce((sum, t) => {
    const acc = String(t.ACCNO || t.accno || "").trim();
    if (codeSet.has(acc)) {
      return sum + Number(t.AMOUNT || t.amount || 0);
    }
    return sum;
  }, 0);
}

/**
 * Calculate total for a department based on mapped account codes.
 * Returns formatted number and array of mapped codes (for display).
 */
function getDepartmentTotal(transactions, deptName) {
  const mappedCodes = DEPARTMENT_ACCOUNT_MAP[deptName] || [];
  const total = calculateMappedSum(transactions, mappedCodes);
  return {
    total,
    mappedCodes,
  };
}

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
};

const RptConsolidateReportPDFHelper = async ({
  transactions,
  filters,
  ulbInfo,
}) => {
  try {
    const templatePath = path.resolve(
      __dirname,
      "../../templates/RptConsolidateReport.html"
    );

    const templateHtml = fs.readFileSync(templatePath, "utf8");
    const template = Handlebars.compile(templateHtml);

    const logoPath = path.resolve(__dirname, "../../assets/logo.png");
    const logo = imageToBase64(logoPath);

    // ============================================
    // CALCULATE ALL DEPARTMENT TOTALS
    // ============================================

    // Top 4 departments
    const dept1 = getDepartmentTotal(transactions, "खुला भूखंड कर विभाग");
    const dept2 = getDepartmentTotal(transactions, "मालमत्ता कर विभाग");
    const dept3 = getDepartmentTotal(transactions, "किरकोळ वसुली विभाग");
    const dept4 = getDepartmentTotal(transactions, "मार्केट विभाग");

    const amount1 = dept1.total;
    const amount2 = dept2.total;
    const amount3 = dept3.total;
    const amount4 = dept4.total;

    const total1to4 = amount1 + amount2 + amount3 + amount4;

    // "एकूण २" - from data (could be a specific subtotal; using 0 or derived)
    // Based on reference: एकूण २ = 183531.00 (departments 5-40 total)
    // We'll compute it after departments 5-40

    // Rebate
    const rebateData = getDepartmentTotal(transactions, "रिबेट (मालमत्ता कर)");
    const rebate = rebateData.total;

    // एकूण ३ = total1to4 + एकूण २ (will set after)
    // कुल/एकूण ४ = एकूण ३ - रिबेट (based on reference: 4415449 - 108541 = 4306908)

    // Departments 5-28
    const dept5 = getDepartmentTotal(transactions, "छ. शाहुमहाराज रुग्णालय व सु. गृह");
    const dept6 = getDepartmentTotal(transactions, "शाहीर अमर शेख दवाखाना");
    const dept7 = getDepartmentTotal(transactions, "मो. युसुफ आयु.दवाखाना");
    const dept8 = getDepartmentTotal(transactions, "चेतनदास मेहता रूग्णालय");
    const dept9 = getDepartmentTotal(transactions, "पिंप्राळा प्राथमिक आरोग्य केंद्र");
    const dept10 = getDepartmentTotal(transactions, "कै.डि.बी.जैन रुग्ण. सुतीकागृह");
    const dept11 = getDepartmentTotal(transactions, "कै.नानीबाई अग्रवाल दवाखाना");
    const dept12 = getDepartmentTotal(transactions, "मुलतानी दवाखाना");
    const dept13 = getDepartmentTotal(transactions, "पंडीत दिनदयाल दवाखाना");
    const dept14 = getDepartmentTotal(transactions, "शव वाहीका व रुग्णवाहिका");
    const dept15 = getDepartmentTotal(transactions, "अर्थ विभाग (इतर किरकोळ)");
    const dept16 = getDepartmentTotal(transactions, "नगर रचना");
    const dept17 = getDepartmentTotal(transactions, "आरोग्य विभाग/अन्न भेसळ प्रतीबंधक");
    const dept18 = getDepartmentTotal(transactions, "मटन मार्केट");
    const dept19 = getDepartmentTotal(transactions, "अतिक्रमण विभाग");
    const dept20 = getDepartmentTotal(transactions, "फायर");
    const dept21 = getDepartmentTotal(transactions, "नक्कल फी (जन्म-मृत्यु)");
    const dept22 = getDepartmentTotal(transactions, "साने गुरुजी ग्रंथालय");
    const dept23 = getDepartmentTotal(transactions, "नाट्यगृह भाडे + सागरपार्क भाडे");
    const dept24 = getDepartmentTotal(transactions, "नविन नळ कने. (मा. कर वि.) (सर्वसाधारण चलन)");
    const dept25 = getDepartmentTotal(transactions, "आस्थापना");
    const dept26 = getDepartmentTotal(transactions, "अभिलेखा");
    const dept27 = getDepartmentTotal(transactions, "दैनंदिन बाजार शुल्क");
    const dept28 = getDepartmentTotal(transactions, "घरकुल सेवा शुल्क");

    const total5to28 =
      dept5.total + dept6.total + dept7.total + dept8.total +
      dept9.total + dept10.total + dept11.total + dept12.total +
      dept13.total + dept14.total + dept15.total + dept16.total +
      dept17.total + dept18.total + dept19.total + dept20.total +
      dept21.total + dept22.total + dept23.total + dept24.total +
      dept25.total + dept26.total + dept27.total + dept28.total;

    // Departments 29-40
    const dept29 = getDepartmentTotal(transactions, "पर्यावरण विभाग");
    const dept30 = getDepartmentTotal(transactions, "मालमत्ता कर विभाग इतर (सर्वसाधारण चलन)");
    const dept31 = getDepartmentTotal(transactions, "सार्व. बांधकाम");
    const dept32 = getDepartmentTotal(transactions, "किरकोळ वसुली इतर");
    const dept33 = getDepartmentTotal(transactions, "वाहनतळ");
    const dept34 = getDepartmentTotal(transactions, "पाणीपुवाठा विभाग इतर");
    const dept35 = getDepartmentTotal(transactions, "नगर रचना इतर");
    const dept36 = getDepartmentTotal(transactions, "TDR (T.P.)");
    const dept37 = getDepartmentTotal(transactions, "प्रिमियम चार्जेस (T.P.)");
    const dept38 = getDepartmentTotal(transactions, "जाहिरात");
    const dept39 = getDepartmentTotal(transactions, "विवाह नोंदणी");
    const dept40 = getDepartmentTotal(transactions, "मिळकत व्यवस्थापन");

    const total29to40 =
      dept29.total + dept30.total + dept31.total + dept32.total +
      dept33.total + dept34.total + dept35.total + dept36.total +
      dept37.total + dept38.total + dept39.total + dept40.total;

    const totalGroup2 = total5to28 + total29to40;

    // "एकूण २" and "एकूण ३" logic from reference:
    // एकूण २ = 183531.00 = total5to28 + total29to40 (totalGroup2)
    // एकूण ३ = 4415449.00 = total1to4 + एकूण २ = 4231918 + 183531 = 4415449
    const total2 = totalGroup2;
    const total3 = total1to4 + total2;
    const grandTotal4 = total3 - rebate;

    // Extra row
    const deptExtra1 = getDepartmentTotal(transactions, "मोठा निवासी (150 चौ.मी.)");
    const amountExtra1 = deptExtra1.total;

    // Fire section
    const fire1 = getDepartmentTotal(transactions, "अग्निशमन वार्षिक फी");
    const fire2 = getDepartmentTotal(transactions, "अग्निशमन ना-हरकत दाखला शुल्क");
    const fire3 = getDepartmentTotal(transactions, "अग्निशमन ना-हरकत दाखला नुतनीकरण");
    const fire4 = getDepartmentTotal(transactions, "तात्पुरता दाखला शुल्क");
    const fire5 = getDepartmentTotal(transactions, "आग विझविण्याचा दाखला शुल्क/फी");
    const fire6 = getDepartmentTotal(transactions, "स्टँडबाय ड्युटी");
    const fire7 = getDepartmentTotal(transactions, "मनपा हद्दीबाहेर अग्निशमन दलाची मदत (फायर/रेस्क्यु वर्दी)");
    const fire8 = getDepartmentTotal(transactions, "अग्निशमन प्रशिक्षण शुल्क");

    const fireTotal =
      fire1.total + fire2.total + fire3.total + fire4.total +
      fire5.total + fire6.total + fire7.total + fire8.total;

    const formatDateDisplay = (dateStr) => {
      if (!dateStr) return "";
      const d = new Date(dateStr);
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    const html = template({
      corporationLogo: ulbInfo?.ULBLOGO || logo,
      corporationName: ulbInfo?.ABC_MUNICIPAL_TEXT,
      fromDate: formatDateDisplay(filters.fromDate),

      amount1: formatNumber(amount1),
      amount2: formatNumber(amount2),
      amount3: formatNumber(amount3),
      amount4: formatNumber(amount4),
      total1to4: formatNumber(total1to4),
      total2: formatNumber(total2),
      total3: formatNumber(total3),
      rebate: formatNumber(rebate),
      grandTotal4: formatNumber(grandTotal4),
      amountInWords1: numberToMarathiWords(grandTotal4),

      amount5: formatNumber(dept5.total),
      amount6: formatNumber(dept6.total),
      amount7: formatNumber(dept7.total),
      amount8: formatNumber(dept8.total),
      amount9: formatNumber(dept9.total),
      amount10: formatNumber(dept10.total),
      amount11: formatNumber(dept11.total),
      amount12: formatNumber(dept12.total),
      amount13: formatNumber(dept13.total),
      amount14: formatNumber(dept14.total),
      amount15: formatNumber(dept15.total),
      amount16: formatNumber(dept16.total),
      amount17: formatNumber(dept17.total),
      amount18: formatNumber(dept18.total),
      amount19: formatNumber(dept19.total),
      amount20: formatNumber(dept20.total),
      amount21: formatNumber(dept21.total),
      amount22: formatNumber(dept22.total),
      amount23: formatNumber(dept23.total),
      amount24: formatNumber(dept24.total),
      amount25: formatNumber(dept25.total),
      amount26: formatNumber(dept26.total),
      amount27: formatNumber(dept27.total),
      amount28: formatNumber(dept28.total),
      total5to28: formatNumber(total5to28),

      amount29: formatNumber(dept29.total),
      amount30: formatNumber(dept30.total),
      amount31: formatNumber(dept31.total),
      amount32: formatNumber(dept32.total),
      amount33: formatNumber(dept33.total),
      amount34: formatNumber(dept34.total),
      amount35: formatNumber(dept35.total),
      amount36: formatNumber(dept36.total),
      amount37: formatNumber(dept37.total),
      amount38: formatNumber(dept38.total),
      amount39: formatNumber(dept39.total),
      amount40: formatNumber(dept40.total),
      total29to40: formatNumber(total29to40),
      totalGroup2: formatNumber(totalGroup2),

      amountExtra1: formatNumber(amountExtra1),

      fireAmount1: formatNumber(fire1.total),
      fireAmount2: formatNumber(fire2.total),
      fireAmount3: formatNumber(fire3.total),
      fireAmount4: formatNumber(fire4.total),
      fireAmount5: formatNumber(fire5.total),
      fireAmount6: formatNumber(fire6.total),
      fireAmount7: formatNumber(fire7.total),
      fireAmount8: formatNumber(fire8.total),
      fireTotal: formatNumber(fireTotal),
      fireAmountInWords: numberToMarathiWords(fireTotal),
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

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    await page.setContent(html, {
      waitUntil: "domcontentloaded",
      timeout: 0,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "5mm", right: "5mm", bottom: "5mm", left: "5mm" },
    });

    await page.close();
    await browser.close();

    const outputDir = path.resolve(__dirname, "../../../public/pdf");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const fileName = `Consolidate_Challan_${Date.now()}.pdf`;
    const filePath = path.join(outputDir, fileName);

    fs.writeFileSync(filePath, pdfBuffer);

    return { fileName, filePath };
  } catch (error) {
    console.error("Consolidate Challan PDF Error:", error);
    throw error;
  }
};

module.exports = {
  RptConsolidateReportPDFHelper,
};