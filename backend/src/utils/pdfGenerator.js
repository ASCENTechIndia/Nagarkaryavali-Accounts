// const fs = require('fs');
// const path = require('path');
// const puppeteer = require('puppeteer');
// const Handlebars = require('handlebars');
// const QRCode = require('qrcode');

// class PDFGenerator {
//   constructor() {
//     // Use default Chrome installation
//     this.chromePath = process.platform === 'win32' 
//       ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
//       : process.platform === 'darwin'
//       ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
//       : '/usr/bin/google-chrome';
//   }

//   async generatePropertyTaxBill(data) {
//     let browser;
//     try {
//       // Load images
//       const logo = await this.loadImage('mbmc_logo.png');
//       const signature = await this.loadImage('signature.png');
      
//       // Generate QR Code
//       const qrCode = await this.generateQRCode(data.bills[0]);

//       // Prepare template data
//       const templateData = {
//         logo,
//         signature,
//         qrCode,
//         ...data,
//         currentDate: new Date().toLocaleDateString('en-GB'),
//         currentDateTime: new Date().toLocaleString('en-GB')
//       };

//       // Load and compile template
//       const templatePath = path.join(__dirname, '../templates/propertyTaxBill.html');
//       const templateSource = fs.readFileSync(templatePath, 'utf8');
//       const template = Handlebars.compile(templateSource);
//       const html = template(templateData);

//       // Create PDF directory if not exists
//       const pdfDir = path.join(__dirname, '../public/pdf');
//       if (!fs.existsSync(pdfDir)) {
//         fs.mkdirSync(pdfDir, { recursive: true });
//       }

//       // Launch Puppeteer
//       browser = await puppeteer.launch({
//         headless: 'new',
//         executablePath: this.chromePath,
//         args: ['--no-sandbox', '--disable-setuid-sandbox'],
//       });

//       const page = await browser.newPage();
//       await page.setContent(html, {
//         waitUntil: 'networkidle0',
//         timeout: 30000
//       });

//       // Generate PDF
//       const pdfBuffer = await page.pdf({
//         format: 'A4',
//         printBackground: true,
//         margin: {
//           top: '10mm',
//           right: '10mm',
//           bottom: '10mm',
//           left: '10mm'
//         }
//       });

//       await browser.close();

//       // Save PDF to file
//       const fileName = `PropertyTaxBill_${Date.now()}.pdf`;
//       const filePath = path.join(pdfDir, fileName);
      
//       fs.writeFileSync(filePath, pdfBuffer);

//       return {
//         fileName,
//         filePath,
//         url: `/pdf/${fileName}`
//       };

//     } catch (error) {
//       console.error('PDF Generation Error:', error);
//       if (browser) await browser.close();
//       throw error;
//     }
//   }

//   async loadImage(imageName) {
//     try {
//       const imagePath = path.join(__dirname, '../assets/images', imageName);
//       if (fs.existsSync(imagePath)) {
//         const imageBuffer = fs.readFileSync(imagePath);
//         const base64Image = imageBuffer.toString('base64');
        
//         // Determine MIME type from file extension
//         const ext = path.extname(imageName).toLowerCase();
//         let mimeType = 'image/png';
//         if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
//         else if (ext === '.gif') mimeType = 'image/gif';
        
//         return `data:${mimeType};base64,${base64Image}`;
//       }
      
//       // If image not found, use a placeholder or return null
//       console.warn(`Image not found: ${imageName}`);
//       return null;
//     } catch (error) {
//       console.error(`Error loading image ${imageName}:`, error);
//       return null;
//     }
//   }

//   async generateQRCode(billData) {
//     try {
//       const qrData = JSON.stringify({
//         billNumber: billData.billNumber,
//         ownerName: billData.ownerName,
//         propertyAddress: billData.propertyAddress,
//         totalAmount: billData.totalAmount || billData.grandTotal,
//         date: new Date().toISOString(),
//         verificationUrl: 'https://mbmc.gov.in/verify'
//       });

//       const qrCodeBase64 = await QRCode.toDataURL(qrData, {
//         width: 100,
//         margin: 1,
//         color: {
//           dark: '#000000',
//           light: '#FFFFFF'
//         }
//       });

//       return qrCodeBase64;
//     } catch (error) {
//       console.error('QR Code Generation Error:', error);
//       return null;
//     }
//   }
// }

// module.exports = new PDFGenerator();

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const Handlebars = require('handlebars');
const QRCode = require('qrcode');

class PDFGenerator {
  constructor() {
    this.chromePath = this.getChromePath();
  }

  getChromePath() {
    if (process.env.PUPPETEER_EXECUTABLE_PATH) {
      return process.env.PUPPETEER_EXECUTABLE_PATH;
    }
    
    if (process.platform === 'win32') {
      const possiblePaths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        process.env.LOCALAPPDATA + '\\Google\\Chrome\\Application\\chrome.exe'
      ];
      
      for (const p of possiblePaths) {
        if (fs.existsSync(p)) return p;
      }
    } else if (process.platform === 'darwin') {
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    } else {
      return '/usr/bin/google-chrome';
    }
    
    // If no Chrome found, puppeteer will use its bundled version
    return undefined;
  }

  async generatePropertyTaxBill(data) {
    let browser;
    try {
      console.log('🚀 Starting PDF generation process...');
      
      // Load images with better error handling
      console.log('🖼️ Loading images...');
      const logo = await this.loadImage('mbmc_logo.png');
      const signature = await this.loadImage('signature.png');
      
      console.log('✅ Images loaded - Logo:', !!logo, 'Signature:', !!signature);
      
      // Generate QR Code
      console.log('🔳 Generating QR code...');
      const qrCode = await this.generateQRCode(data.bills[0]);
      console.log('✅ QR code generated:', !!qrCode);

      // Prepare template data - Use the templateData from billData
      const bill = data.bills[0];
      const templateData = bill.templateData || {};
      
      // Add QR code to template data
      templateData.qrCode = qrCode;
      
      // Add current date/time if not present
      if (!templateData.currentDate) {
        templateData.currentDate = new Date().toLocaleDateString('en-GB');
      }
      if (!templateData.currentDateTime) {
        templateData.currentDateTime = new Date().toLocaleString('en-GB');
      }
      
      // Add logo and signature if needed by template
      templateData.logo = logo;
      templateData.signature = signature;
      
      // Load and compile template
      console.log('📄 Loading HTML template...');
      const templatePath = path.join(__dirname, '../templates/propertyTaxBill.html');
      
      if (!fs.existsSync(templatePath)) {
        throw new Error(`Template file not found at: ${templatePath}`);
      }
      
      console.log('✅ Template found at:', templatePath);
      
      const templateSource = fs.readFileSync(templatePath, 'utf8');
      const template = Handlebars.compile(templateSource);
      const html = template(templateData);
      
      console.log('✅ HTML compiled, length:', html.length, 'characters');

      // Create PDF directory if not exists - Try multiple paths
      const pdfDirs = [
        path.join(__dirname, '../public/pdf'),
        path.join(__dirname, '../../public/pdf'),
        path.join(process.cwd(), 'public/pdf'),
        path.join(process.cwd(), 'src/public/pdf')
      ];
      
      let pdfDir = null;
      for (const dir of pdfDirs) {
        if (fs.existsSync(dir)) {
          pdfDir = dir;
          console.log('📁 Using existing PDF directory:', pdfDir);
          break;
        }
      }
      
      if (!pdfDir) {
        // Create the first directory
        pdfDir = pdfDirs[0];
        fs.mkdirSync(pdfDir, { recursive: true });
        console.log('📁 Created new PDF directory:', pdfDir);
      }

      // Launch Puppeteer with better configuration
      console.log('🌐 Launching Puppeteer browser...');
      
      const puppeteerOptions = {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--disable-software-rasterizer'
        ],
        timeout: 120000
      };

      if (this.chromePath && fs.existsSync(this.chromePath)) {
        puppeteerOptions.executablePath = this.chromePath;
        console.log('🖥️ Using Chrome at:', this.chromePath);
      } else {
        console.log('🔧 Using Puppeteer bundled Chrome');
      }

      browser = await puppeteer.launch(puppeteerOptions);
      console.log('✅ Puppeteer browser launched successfully');

      const page = await browser.newPage();
      console.log('📄 New page created');
      
      page.setDefaultNavigationTimeout(120000);
      page.setDefaultTimeout(120000);
      
      console.log('📝 Setting page content...');
      await page.setContent(html, {
        waitUntil: 'load',
        timeout: 60000
      });
      console.log('✅ Page content set successfully');

      console.log('⏳ Waiting for page to stabilize...');
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Generate PDF with proper settings
      console.log('📄 Generating PDF...');
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm'
        },
        displayHeaderFooter: false,
        preferCSSPageSize: true
      });

      console.log('✅ PDF generated successfully, size:', pdfBuffer.length, 'bytes');
      
      await browser.close();
      console.log('✅ Browser closed');

      // Save PDF to file
      const fileName = `PropertyTaxBill_${Date.now()}.pdf`;
      const filePath = path.join(pdfDir, fileName);
      
      fs.writeFileSync(filePath, pdfBuffer);
      console.log('💾 PDF saved to:', filePath);
      
      // Verify file was saved
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        console.log('✅ File verified, size:', stats.size, 'bytes');
      } else {
        console.error('❌ File was not saved!');
      }

      return {
        fileName,
        filePath,
        url: `/pdf/${fileName}`,
        size: pdfBuffer.length
      };

    } catch (error) {
      console.error('❌ PDF Generation Error:', error.message);
      console.error('Stack trace:', error.stack);
      
      if (browser) {
        try {
          await browser.close();
          console.log('✅ Browser closed after error');
        } catch (closeError) {
          console.error('❌ Error closing browser:', closeError.message);
        }
      }
      
      throw new Error(`Failed to generate PDF: ${error.message}`);
    }
  }

  async loadImage(imageName) {
    try {
      const possiblePaths = [
        path.join(__dirname, '../assets/images', imageName),
        path.join(__dirname, '../../assets/images', imageName),
        path.join(__dirname, 'assets/images', imageName),
        path.join(process.cwd(), 'assets/images', imageName),
        path.join(process.cwd(), 'src/assets/images', imageName)
      ];
      
      let imagePath = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          imagePath = possiblePath;
          console.log(`✅ Found image at: ${possiblePath}`);
          break;
        }
      }
      
      if (!imagePath) {
        console.warn(`⚠️ Image not found: ${imageName}. Creating placeholder...`);
        
        if (imageName === 'mbmc_logo.png') {
          return 'data:image/svg+xml;base64,' + Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
              <rect width="100" height="100" fill="#083c76"/>
              <circle cx="50" cy="50" r="40" fill="white"/>
              <text x="50" y="40" text-anchor="middle" fill="#083c76" font-family="Arial" font-size="14" font-weight="bold">MBMC</text>
              <text x="50" y="60" text-anchor="middle" fill="#083c76" font-family="Arial" font-size="10">LOGO</text>
            </svg>`
          ).toString('base64');
        } else if (imageName === 'signature.png') {
          return 'data:image/svg+xml;base64,' + Buffer.from(
            `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
              <rect width="200" height="80" fill="#f8f8f8" stroke="#ccc" stroke-width="1"/>
              <line x1="30" y1="40" x2="170" y2="40" stroke="#666" stroke-width="2" stroke-dasharray="5,5"/>
              <text x="100" y="25" text-anchor="middle" fill="#333" font-family="Arial" font-size="12">Authorized Signature</text>
            </svg>`
          ).toString('base64');
        }
        
        return 'data:image/svg+xml;base64,' + Buffer.from(
          `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
            <rect width="100" height="100" fill="#f0f0f0"/>
            <text x="50" y="50" text-anchor="middle" fill="#666" font-family="Arial" font-size="12">${imageName}</text>
          </svg>`
        ).toString('base64');
      }
      
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const ext = path.extname(imageName).toLowerCase();
      let mimeType = 'image/png';
      if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
      else if (ext === '.gif') mimeType = 'image/gif';
      
      return `data:${mimeType};base64,${base64Image}`;
    } catch (error) {
      console.error(`❌ Error loading image ${imageName}:`, error.message);
      return null;
    }
  }

  async generateQRCode(billData) {
    try {
      if (!billData) return null;
      
      const qrData = JSON.stringify({
        billNumber: billData.billNumber || 'N/A',
        ownerName: billData.ownerName || 'N/A',
        totalAmount: billData.totalAmount || '0.00',
        date: new Date().toISOString()
      });

      const qrCodeBase64 = await QRCode.toDataURL(qrData, {
        width: 150,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return qrCodeBase64;
    } catch (error) {
      console.error('❌ QR Code Generation Error:', error.message);
      return null;
    }
  }
}

module.exports = new PDFGenerator();
