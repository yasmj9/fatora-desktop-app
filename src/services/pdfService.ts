import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { DocumentData } from "../types/documentData";
import { generateSafeFilename } from "../utils/documentTranslations";

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

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pdfWidth = pdf.internal.pageSize.getWidth(); // 210mm
    const pdfHeight = pdf.internal.pageSize.getHeight(); // 297mm

    const imgWidth = pdfWidth;
    const imgHeight = (canvas.height * pdfWidth) / canvas.width;

    if (imgHeight <= pdfHeight) {
      pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
    } else {
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
    }

    return pdf;
  },

  /**
   * Action: Enregistrer PDF (Saves file directly to computer with safe filename)
   */
  async downloadPdf(element: HTMLElement, documentData: DocumentData): Promise<string> {
    const pdf = await this.generatePdfFromElement(element);
    const filename = generateSafeFilename(
      documentData.documentNumber,
      documentData.client.name,
      "pdf"
    );
    pdf.save(filename);
    return filename;
  },

  /**
   * Action: Générer/Ouvrir PDF (Opens generated PDF blob in a new browser tab/window)
   */
  async openPdfInNewTab(element: HTMLElement): Promise<void> {
    const pdf = await this.generatePdfFromElement(element);
    const blob = pdf.output("blob");
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
  },

  /**
   * Action: Imprimer (Triggers clean print for the document)
   */
  async printDocument(element: HTMLElement): Promise<void> {
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
  },
};
