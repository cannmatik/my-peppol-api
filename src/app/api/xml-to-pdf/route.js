import { NextResponse } from "next/server";
import SaxonJS from "saxonjs-he";
import puppeteer from "puppeteer-core";
import chromium from "@sparticuz/chromium";
import path from "path";
import fs from "fs/promises";

export async function POST(request) {
  try {
    // XML dosyasını request body'den al
    const formData = await request.formData();
    const xmlFile = formData.get("xml");
    if (!xmlFile) {
      return NextResponse.json({ error: "XML dosyası gerekli" }, { status: 400 });
    }

    // XML içeriğini oku
    const xmlContent = await xmlFile.text();

    // XML'den dosya adı için gerekli bilgileri çek
    let supplierId = "UNKNOWN";
    let invoiceId = "UNKNOWN";

    try {
      // Basit XML parsing ile ID'leri çek
      const invoiceIdMatch = xmlContent.match(/<cbc:ID>([^<]+)<\/cbc:ID>/);
      if (invoiceIdMatch) {
        invoiceId = invoiceIdMatch[1];
      }

      // Supplier ID'yi çek (BE0405746050)
      const supplierIdMatch = xmlContent.match(/<cac:AccountingSupplierParty>[\s\S]*?<cac:PartyIdentification>[\s\S]*?<cbc:ID>([^<]+)<\/cbc:ID>/);
      if (supplierIdMatch) {
        supplierId = supplierIdMatch[1];
      }
    } catch (parseError) {
      console.warn("XML parsing hatası, varsayılan dosya adı kullanılacak:", parseError.message);
    }

    // Dosya adını oluştur
    const fileName = `${supplierId}_${invoiceId}.pdf`;

    // SEF/XSLT yolları
    const sefPath = path.join(process.cwd(), "public", "stylesheet-ubl.sef.json");
    const xsltPath = path.join(process.cwd(), "public", "stylesheet-ubl.xslt");

    let htmlContent;
    try {
      const sefExists = await fs.access(sefPath).then(() => true).catch(() => false);
      if (sefExists) {
        ({ principalResult: htmlContent } = await SaxonJS.transform(
          {
            stylesheetLocation: sefPath,
            sourceText: xmlContent,
            destination: "serialized",
          },
          "async"
        ));
      } else {
        const xsltContent = await fs.readFile(xsltPath, "utf-8");
        ({ principalResult: htmlContent } = await SaxonJS.transform(
          {
            stylesheetText: xsltContent,
            sourceText: xmlContent,
            destination: "serialized",
          },
          "async"
        ));
      }
    } catch (transformError) {
      throw new Error(`XSLT dönüşüm hatası: ${transformError.message}`);
    }

    // Vercel için Chromium ayarları
    const isProduction = process.env.NODE_ENV === "production";

    let browser;
    if (isProduction) {
      browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
      });
    } else {
      browser = await puppeteer.launch({
        headless: true,
        executablePath:
          process.platform === "win32"
            ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
            : process.platform === "darwin"
            ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
            : "/usr/bin/google-chrome",
      });
    }

    const page = await browser.newPage();

    // XSLT'nin kendi CSS'ini koruyarak sadece credit satırı ekleyelim
    const optimizedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    /* XSLT'nin CSS'ine müdahale etmiyoruz, sadece credit için minimal stil */
    .credit {
      margin-top: 20px;
      font-size: 10px;
      color: #666;
      text-align: right;
      page-break-inside: avoid;
      border-top: 1px solid #ddd;
      padding-top: 8px;
    }
  </style>
</head>
<body>
  ${htmlContent}
  <div class="credit">Developed by Can Matik</div>
</body>
</html>
    `;

    await page.setContent(optimizedHtml, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "10mm", right: "10mm", bottom: "10mm", left: "10mm" },
      displayHeaderFooter: false,
      preferCSSPageSize: true,
    });

    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error) {
    console.error("Hata:", error);
    return NextResponse.json({ error: "Dönüşüm hatası: " + error.message }, { status: 500 });
  }
}