import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { DocumentData } from "../types/documentData";
import { generateSafeFilename } from "../utils/documentTranslations";
import { loggerService } from "./loggerService";

export const pdfService = {
  /**
   * Captures an A4 DOM container and converts it into a jsPDF instance.
   */
  async generatePdfFromElement(element: HTMLElement): Promise<jsPDF> {
    const canvas = await html2canvas(element, {
      scale: 2, // High resolution for sharp text and crisp logos
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      onclone: (clonedDoc) => {
        // Helper to convert any modern color (oklch, oklab, color(srgb...), etc.) into valid sRGB hex/rgb
        const colorCanvas = clonedDoc.createElement("canvas");
        colorCanvas.width = 1;
        colorCanvas.height = 1;
        const colorCtx = colorCanvas.getContext("2d");

        const convertColor = (val: string): string => {
          if (!val || (!val.includes("oklch") && !val.includes("oklab") && !val.includes("color("))) {
            return val;
          }
          if (!colorCtx) return "#1e293b";
          try {
            return val.replace(/(?:oklch|oklab|color)\([^)]+\)/gi, (match) => {
              colorCtx.fillStyle = "#ffffff";
              colorCtx.fillStyle = match;
              return colorCtx.fillStyle || match;
            });
          } catch {
            return val;
          }
        };

        // Sanitize modern colors in inline styles
        const allElements = clonedDoc.querySelectorAll("*");
        allElements.forEach((el) => {
          const htmlEl = el as HTMLElement;
          if (htmlEl.style) {
            for (let i = 0; i < htmlEl.style.length; i++) {
              const prop = htmlEl.style[i];
              const val = htmlEl.style.getPropertyValue(prop);
              if (val && (val.includes("oklch") || val.includes("oklab") || val.includes("color("))) {
                htmlEl.style.setProperty(prop, convertColor(val));
              }
            }
          }
        });

        // Sanitize modern colors in style tags and stylesheets
        const styleTags = clonedDoc.querySelectorAll("style");
        styleTags.forEach((tag) => {
          if (tag.textContent && (tag.textContent.includes("oklch") || tag.textContent.includes("oklab") || tag.textContent.includes("color("))) {
            tag.textContent = convertColor(tag.textContent);
          }
        });

        try {
          const styleSheets = clonedDoc.styleSheets;
          for (let i = 0; i < styleSheets.length; i++) {
            try {
              const rules = styleSheets[i].cssRules;
              for (let j = 0; j < rules.length; j++) {
                const rule = rules[j] as CSSStyleRule;
                if (rule.style) {
                  for (let k = 0; k < rule.style.length; k++) {
                    const prop = rule.style[k];
                    const val = rule.style.getPropertyValue(prop);
                    if (val && (val.includes("oklch") || val.includes("oklab") || val.includes("color("))) {
                      rule.style.setProperty(prop, convertColor(val));
                    }
                  }
                }
              }
            } catch {
              // Ignore cross-origin stylesheet access errors
            }
          }
        } catch {
          // Ignore
        }
      },
    });

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    // Calculate exact pixel height per A4 page based on canvas width and 210x297 aspect ratio
    const pageHeightPx = (canvas.width * pdfHeight) / pdfWidth;
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

    for (let p = 0; p < totalPages; p++) {
      if (p > 0) {
        pdf.addPage();
      }

      const sourceY = p * pageHeightPx;
      const sliceHeightPx = Math.min(pageHeightPx, canvas.height - sourceY);

      // Create a dedicated high-resolution canvas for this specific A4 page
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageHeightPx;
      const pctx = pageCanvas.getContext("2d");

      if (pctx) {
        pctx.fillStyle = "#ffffff";
        pctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        pctx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sliceHeightPx,
          0,
          0,
          canvas.width,
          sliceHeightPx
        );
      }

      const pageImgData = pageCanvas.toDataURL("image/png");
      pdf.addImage(pageImgData, "PNG", 0, 0, pdfWidth, pdfHeight);

      // Add page numbering (e.g. "1/2", "2/2", "1/1") in the bottom-right corner of each page
      pdf.setFontSize(8);
      pdf.setFont("helvetica", "normal");
      pdf.setTextColor(100, 116, 139);
      const pageText = `${p + 1}/${totalPages}`;
      pdf.text(pageText, pdfWidth - 10, pdfHeight - 2.5, { align: "right" });
    }

    return pdf;
  },

  /**
   * Action: Enregistrer PDF (Prompts user with 'Save As' file picker dialog or browser save)
   */
  async downloadPdf(element: HTMLElement, documentData: DocumentData): Promise<string> {
    try {
      loggerService.logAction("PDF", `Génération du PDF pour ${documentData.documentNumber}`);
      const pdf = await this.generatePdfFromElement(element);
      const filename = generateSafeFilename(
        documentData.documentNumber,
        documentData.client.name,
        "pdf"
      );

      // Check if showSaveFilePicker API is supported (Desktop / Chromium / WebView2 / Tauri)
      if (typeof window !== "undefined" && "showSaveFilePicker" in window) {
        try {
          const handle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [
              {
                description: "Document PDF (*.pdf)",
                accept: { "application/pdf": [".pdf"] },
              },
            ],
          });
          const writable = await handle.createWritable();
          const blob = pdf.output("blob");
          await writable.write(blob);
          await writable.close();

          loggerService.logSuccess("PDF", `PDF enregistré avec succès : ${filename}`);
          return filename;
        } catch (err: any) {
          if (err.name === "AbortError") {
            loggerService.logInfo("PDF", "Enregistrement du PDF annulé par l'utilisateur.");
            return filename;
          }
          loggerService.logWarn("PDF", "Diaporama de sauvegarde non pris en charge, utilisation du mode de secours.", String(err));
        }
      }

      // Fallback if showSaveFilePicker is cancelled or not supported
      pdf.save(filename);
      loggerService.logSuccess("PDF", `PDF téléchargé dans le dossier de téléchargements : ${filename}`);
      return filename;
    } catch (err: any) {
      loggerService.logError("PDF", `Échec de génération PDF pour ${documentData.documentNumber}`, err?.stack || String(err));
      throw err;
    }
  },

  /**
   * Action: Générer/Ouvrir PDF (Opens generated PDF blob in a new browser tab/window)
   */
  async openPdfInNewTab(element: HTMLElement): Promise<void> {
    try {
      loggerService.logAction("PDF", "Ouverture de l'aperçu PDF dans une nouvelle fenêtre");
      const pdf = await this.generatePdfFromElement(element);
      const blob = pdf.output("blob");
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank");
      loggerService.logSuccess("PDF", "Aperçu PDF ouvert avec succès.");
    } catch (err: any) {
      loggerService.logError("PDF", "Échec lors de l'ouverture de l'aperçu PDF", err?.stack || String(err));
      throw err;
    }
  },

  /**
   * Action: Imprimer (Triggers clean print for the document)
   */
  async printDocument(element: HTMLElement): Promise<void> {
    try {
      loggerService.logAction("PDF", "Lancement de la fenêtre d'impression du document");
      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        window.print();
        return;
      }

      const isRtl = element.getAttribute("dir") === "rtl";

      const htmlContent = `
        <!DOCTYPE html>
        <html lang="${isRtl ? "ar" : "fr"}" dir="${isRtl ? "rtl" : "ltr"}">
          <head>
            <title>Impression Facture</title>
            <meta charset="utf-8" />
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @media print {
                body { margin: 0; padding: 0; background: white; }
                @page { size: A4; margin: 8mm; }
              }
            </style>
          </head>
          <body class="bg-white p-4 font-sans">
            <div style="max-width: 800px; margin: 0 auto;">
              ${element.outerHTML}
            </div>
            <script>
              setTimeout(() => {
                window.print();
                setTimeout(() => window.close(), 500);
              }, 600);
            </script>
          </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      loggerService.logSuccess("PDF", "Impression envoyée avec succès à l'imprimante.");
    } catch (err: any) {
      loggerService.logError("PDF", "Erreur lors de l'impression du document", err?.stack || String(err));
      throw err;
    }
  },
};
