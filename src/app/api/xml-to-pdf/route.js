import { NextResponse } from "next/server";
import SaxonJS from "saxon-js";
import puppeteer from "puppeteer";
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

    // SEF dosyasını yükle
    const sefPath = path.join(process.cwd(), "public", "stylesheet-ubl.sef.json");
    const xsltPath = path.join(process.cwd(), "public", "stylesheet-ubl.xslt");
    let htmlContent;

    try {
      // SEF dosyası varsa kullan
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
        // Ham XSLT kullan (fallback)
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

    // Puppeteer ile HTML'yi PDF'ye çevir
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" });
    // PDF oluşturma kısmını güncelle
const pdfBuffer = await page.pdf({
  format: "A4",
  printBackground: true,
  margin: {
    top: '20mm',
    right: '15mm',
    bottom: '20mm',
    left: '15mm'
  },
  displayHeaderFooter: false
});
    await browser.close();

    // PDF'i response olarak döndür
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