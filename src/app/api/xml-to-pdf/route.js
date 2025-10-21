import { NextResponse } from "next/server";
import SaxonJS from "saxon-js";
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

    // HTML: sadece kredi satırı ekliyoruz
    const optimizedHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: Arial, sans-serif;
      font-size: 12px;
      line-height: 1.3;
      color: #000;
      background: #fff;
      margin: 0;
      padding: 15px;
    }
    .container { width: 100%; max-width: 100%; }
    table { width: 100%; border-collapse: collapse; margin: 5px 0; font-size: 11px; }
    th, td { padding: 3px 5px; border: 1px solid #ddd; vertical-align: top; }
    h1, h2, h3, h4 { margin: 8px 0 5px 0; padding: 0; line-height: 1.1; }
    h1 { font-size: 18px; }
    h2 { font-size: 16px; }
    h3 { font-size: 14px; }
    h4 { font-size: 12px; }
    p, div { margin: 2px 0; padding: 0; }
    .credit {
      margin-top: 16px;
      font-size: 10px;
      color: #666;
      text-align: right;
      page-break-inside: avoid;
    }
  </style>
</head>
<body>
  <div class="container">
    ${htmlContent}
    <div class="credit">Developed by Can Matik</div>
  </div>
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
        "Content-Disposition": "attachment; filename=output.pdf",
      },
    });
  } catch (error) {
    console.error("Hata:", error);
    return NextResponse.json({ error: "Dönüşüm hatası: " + error.message }, { status: 500 });
  }
}