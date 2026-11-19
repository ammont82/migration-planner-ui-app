/**
 * Generates PDF reports from an already-rendered HTML element.
 *
 * The caller (View layer) is responsible for rendering the React component
 * off-screen (e.g. via {@link OffScreenRenderer}). This service receives the
 * resulting `HTMLElement`, captures it as a canvas, and assembles a multi-page
 * PDF document.
 */

import html2canvas from "html2canvas-pro";
import jsPDF from "jspdf";

const PDF_CONFIG = {
  FILENAME: "Dashboard_Report.pdf",
  MARGIN: 10,
} as const;

const TOC_ITEMS = [
  "- Infrastructure summary",
  "- vCenter cluster details",
  "- ESXi host power states",
  "- VM power states",
  "- VM migration status",
  "- Operating system distribution",
  "- CPU & memory (VM distribution by CPU & memory size tier)",
  "- CPU & memory (VM distribution by vCPU count tier)",
  "- Disks (VM count by disk size tier)",
  "- Disks (Total disk size by tier)",
  "- Disks (VM count by disk type)",
  "- Clusters (VM distribution by cluster)",
  "- Clusters (Cluster distribution by data center)",
  "- Clusters (Cluster CPU over commitment)",
  "- Host distribution by model",
  "- Networks (VMs by network (may overlap))",
  "- Networks (VM distribution by NIC count)",
  "- Migration warnings",
  "- Errors",
] as const;

/**
 * Export blocks in dashboard order. Optional blocks (1 / 1a / 1b / 4a) are
 * skipped when missing so older layouts still paginate.
 */
export const PDF_EXPORT_BLOCK_ORDER = [
  "1",
  "1a",
  "1b",
  "2",
  "3",
  "4",
  "4a",
  "5",
] as const;

export interface PdfBlockBounds {
  top: number;
  bottom: number;
}

export interface PdfExportSegment {
  top: number;
  height: number;
}

/**
 * Build one PDF page per captured export block. The last segment extends to
 * the canvas bottom so trailing content is never clipped.
 */
export const buildPdfExportSegments = (
  blocksById: Partial<Record<string, PdfBlockBounds>>,
  imgHeight: number,
  padding: number,
): PdfExportSegment[] | null => {
  const ordered = PDF_EXPORT_BLOCK_ORDER.map((id) => blocksById[id]).filter(
    (block): block is PdfBlockBounds => Boolean(block),
  );

  if (ordered.length < 3) {
    return null;
  }

  return ordered.map((block, index) => {
    const isLast = index === ordered.length - 1;
    const top = Math.max(0, block.top - padding);
    const bottom = isLast
      ? imgHeight
      : Math.min(imgHeight, block.bottom + padding);
    return {
      top,
      height: Math.max(1, bottom - top),
    };
  });
};

/**
 * Split a capture segment across A4 pages so tall blocks stay readable
 * instead of being scaled to one page.
 */
export const splitSegmentForPageHeight = (
  segment: PdfExportSegment,
  imgHeight: number,
  pageHeightPx: number,
): PdfExportSegment[] => {
  const total = Math.max(1, Math.min(segment.height, imgHeight - segment.top));
  if (pageHeightPx <= 0 || total <= pageHeightPx) {
    return [{ top: segment.top, height: total }];
  }

  const slices: PdfExportSegment[] = [];
  let offset = 0;
  while (offset < total) {
    const height = Math.min(pageHeightPx, total - offset);
    slices.push({ top: segment.top + offset, height });
    offset += height;
  }
  return slices;
};

export interface PdfExtraPageItem {
  label: string;
  value: string;
}

export interface PdfExtraPage {
  title: string;
  items: PdfExtraPageItem[];
  footer?: string;
}

export interface PdfExportOptions {
  documentTitle?: string;
  /** Extra items appended to the table of contents on the cover page. */
  additionalTocItems?: string[];
  /**
   * Additional pages appended after the canvas-based report pages.
   * Each entry becomes one new PDF page rendered with native jsPDF text,
   * so it is guaranteed to start on a fresh page with no bleed.
   */
  extraPages?: PdfExtraPage[];
}

interface BlockBoundary {
  top: number;
  bottom: number;
  height: number;
}

export class PdfExportService {
  /**
   * Generate a PDF from an already-rendered HTML element.
   *
   * @param container - The DOM element whose contents will be captured.
   *                    Must already be attached to the document (e.g. via a
   *                    React Portal) and fully rendered.
   */
  async generate(
    container: HTMLElement,
    options: PdfExportOptions = {},
  ): Promise<void> {
    await this.waitForImages(container);

    const blockBoundaries = this.collectBlockBoundaries(container);

    // Read the container's resolved background colour so page-fill in
    // createSliceCanvas matches the active theme (dark or light).
    const backgroundColor =
      window.getComputedStyle(container).backgroundColor || "#ffffff";

    const canvas = await html2canvas(container, {
      useCORS: true,
      backgroundColor,
    });

    const pdf = this.buildPdf(
      canvas,
      blockBoundaries,
      container.clientWidth,
      options.documentTitle,
      backgroundColor,
      options.additionalTocItems,
      options.extraPages,
    );
    this.downloadPdf(pdf, options.documentTitle);
  }

  // ---------------------------------------------------------------------------
  // Image loading
  // ---------------------------------------------------------------------------

  /**
   * Wait for all images inside the container to finish loading.
   */
  private async waitForImages(container: HTMLElement): Promise<void> {
    const images = Array.from(container.querySelectorAll("img"));
    if (images.length === 0) return;

    const imagePromises = images.map((img) => {
      if (img.complete) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const handleLoad = (): void => {
          img.removeEventListener("load", handleLoad);
          img.removeEventListener("error", handleError);
          resolve();
        };
        const handleError = (): void => {
          img.removeEventListener("load", handleLoad);
          img.removeEventListener("error", handleError);
          // Resolve even on error to not block PDF generation
          resolve();
        };

        img.addEventListener("load", handleLoad);
        img.addEventListener("error", handleError);
      });
    });

    await Promise.all(imagePromises);
  }

  // ---------------------------------------------------------------------------
  // Block boundary collection
  // ---------------------------------------------------------------------------

  private collectBlockBoundaries(container: HTMLElement): BlockBoundary[] {
    const containerRect = container.getBoundingClientRect();

    return Array.from(
      container.querySelectorAll<HTMLElement>(
        ".dashboard-card-print, .pf-v6-c-card",
      ),
    )
      .map((el) => {
        const r = el.getBoundingClientRect();
        const top = Math.max(0, r.top - containerRect.top);
        const bottom = Math.max(top, r.bottom - containerRect.top);
        const height = bottom - top;
        return { top, bottom, height };
      })
      .filter((b) => b.height > 4) // Ignore trivial blocks
      .sort((a, b) => a.top - b.top);
  }

  // ---------------------------------------------------------------------------
  // PDF assembly
  // ---------------------------------------------------------------------------

  private buildPdf(
    canvas: HTMLCanvasElement,
    domBlocks: BlockBoundary[],
    containerClientWidth: number,
    documentTitle?: string,
    backgroundColor = "#ffffff",
    additionalTocItems?: string[],
    extraPages?: PdfExtraPage[],
  ): jsPDF {
    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = PDF_CONFIG.MARGIN;

    const contentWidth = pageWidth - margin * 2;
    const contentHeight = pageHeight - margin * 2;

    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // Build cover page with TOC
    this.buildCoverPage(
      pdf,
      pageWidth,
      pageHeight,
      margin,
      documentTitle,
      additionalTocItems,
    );
    pdf.addPage();

    // Calculate scaling
    const scaleFactor = contentWidth / imgWidth;
    const pageHeightPx = contentHeight / scaleFactor;
    const domToCanvasScale = imgWidth / Math.max(1, containerClientWidth);

    const blocksPx = domBlocks.map((b) => ({
      top: b.top * domToCanvasScale,
      bottom: b.bottom * domToCanvasScale,
      height: b.height * domToCanvasScale,
    }));

    const BLEED_GUARD_PX = Math.max(0, Math.round(6 * domToCanvasScale));

    // Try custom segmentation based on data-export-block attributes
    const customSegments = this.buildCustomSegments(
      imgHeight,
      domToCanvasScale,
    );

    if (customSegments && customSegments.length > 0) {
      const pagedSegments = customSegments.flatMap((segment) =>
        splitSegmentForPageHeight(segment, imgHeight, pageHeightPx),
      );
      this.renderCustomSegments(
        pdf,
        canvas,
        pagedSegments,
        imgWidth,
        imgHeight,
        contentWidth,
        contentHeight,
        margin,
        backgroundColor,
      );
    } else {
      const sliceHeights = this.calculateSliceHeights(
        blocksPx,
        imgHeight,
        pageHeightPx,
        BLEED_GUARD_PX,
      );
      this.renderSlices(
        pdf,
        canvas,
        sliceHeights,
        imgWidth,
        imgHeight,
        contentWidth,
        contentHeight,
        margin,
        backgroundColor,
      );
    }

    // Append any extra pages (e.g. cluster sizing recommendations)
    if (extraPages && extraPages.length > 0) {
      this.addExtraPages(pdf, extraPages, pageWidth, pageHeight, margin);
    }

    // Add page numbers
    this.addPageNumbers(pdf, pageWidth, pageHeight);

    return pdf;
  }

  private buildCoverPage(
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number,
    margin: number,
    documentTitle?: string,
    additionalTocItems?: string[],
  ): void {
    pdf.setFillColor(255, 255, 255);
    pdf.rect(0, 0, pageWidth, pageHeight, "F");

    const contentWidth = pageWidth - margin * 2;
    pdf.setFontSize(18);
    const headerTitle =
      documentTitle && documentTitle.trim().length > 0
        ? documentTitle
        : "VMware Infrastructure Assessment Report";

    const titleLineHeight = 8;
    const titleLines = pdf.splitTextToSize(
      headerTitle,
      contentWidth,
    ) as string[];
    let titleY = margin + 8;
    for (const line of titleLines) {
      pdf.text(line, pageWidth / 2, titleY, { align: "center" });
      titleY += titleLineHeight;
    }

    pdf.setFontSize(11);
    const d = new Date();
    pdf.text(
      `Generated: ${d.toLocaleDateString()} ${d.toLocaleTimeString()}`,
      pageWidth / 2,
      titleY + 4,
      { align: "center" },
    );

    const tocStartY = titleY + 16;
    pdf.setFontSize(14);
    pdf.text("Table of contents", margin, tocStartY);

    const allTocItems: string[] = [...TOC_ITEMS, ...(additionalTocItems ?? [])];

    pdf.setFontSize(11);
    let tocY = tocStartY + 10;
    allTocItems.forEach((line) => {
      if (tocY > pageHeight - margin - 10) {
        pdf.addPage();
        tocY = margin;
      }
      pdf.text(line, margin, tocY);
      tocY += 7;
    });
  }

  private buildCustomSegments(
    imgHeight: number,
    domToCanvasScale: number,
  ): PdfExportSegment[] | null {
    const container = document.getElementById("hidden-container");
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();
    const SEGMENT_PADDING_PX = 12 * domToCanvasScale;
    const blocksById: Partial<Record<string, PdfBlockBounds>> = {};

    for (const id of PDF_EXPORT_BLOCK_ORDER) {
      const el = container.querySelector<HTMLElement>(
        `[data-export-block="${id}"]`,
      );
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const top = Math.max(0, r.top - containerRect.top) * domToCanvasScale;
      const bottom =
        Math.max(top, r.bottom - containerRect.top) * domToCanvasScale;
      blocksById[id] = { top, bottom };
    }

    return buildPdfExportSegments(blocksById, imgHeight, SEGMENT_PADDING_PX);
  }

  private calculateSliceHeights(
    blocksPx: BlockBoundary[],
    imgHeight: number,
    pageHeightPx: number,
    bleedGuardPx: number,
  ): number[] {
    const sliceHeights: number[] = [];

    if (blocksPx.length === 0) {
      let remaining = imgHeight;
      while (remaining > 0) {
        const h = Math.min(pageHeightPx, remaining);
        sliceHeights.push(h);
        remaining -= h;
      }
      return sliceHeights;
    }

    let y = 0;
    const MIN_ADVANCE = 32;
    const MAX_LOOP_GUARD = 2000;
    let guard = 0;

    while (y < imgHeight && guard++ < MAX_LOOP_GUARD) {
      const target = y + pageHeightPx;

      const eligibleBottoms = blocksPx
        .filter(
          (b) => b.top <= target - MIN_ADVANCE && b.bottom >= y + MIN_ADVANCE,
        )
        .map((b) => Math.round(b.bottom))
        .sort((a, b) => a - b);

      let cut: number;
      if (eligibleBottoms.length > 0) {
        const lastBottom = eligibleBottoms[eligibleBottoms.length - 1];
        const guarded = Math.max(y + MIN_ADVANCE, lastBottom - bleedGuardPx);
        cut = Math.min(imgHeight, guarded);
      } else {
        cut = Math.min(
          imgHeight,
          Math.max(y + MIN_ADVANCE, Math.round(target)),
        );
      }

      const height = Math.max(1, cut - y);
      sliceHeights.push(height);
      y += height;
    }

    return sliceHeights;
  }

  // ---------------------------------------------------------------------------
  // Rendering helpers
  // ---------------------------------------------------------------------------

  private renderCustomSegments(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    segments: PdfExportSegment[],
    imgWidth: number,
    imgHeight: number,
    contentWidth: number,
    contentHeight: number,
    margin: number,
    backgroundColor = "#ffffff",
  ): void {
    for (let i = 0; i < segments.length; i++) {
      const { top, height } = segments[i];
      const sliceHeightPx = Math.max(1, Math.min(height, imgHeight - top));

      const pageCanvas = this.createSliceCanvas(
        canvas,
        imgWidth,
        sliceHeightPx,
        top,
        backgroundColor,
      );

      this.addCanvasToPdf(
        pdf,
        pageCanvas,
        imgWidth,
        sliceHeightPx,
        contentWidth,
        contentHeight,
        margin,
      );

      if (i < segments.length - 1) {
        pdf.addPage();
      }
    }
  }

  private renderSlices(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    sliceHeights: number[],
    imgWidth: number,
    imgHeight: number,
    contentWidth: number,
    contentHeight: number,
    margin: number,
    backgroundColor = "#ffffff",
  ): void {
    let consumedPx = 0;

    for (let pageIndex = 0; pageIndex < sliceHeights.length; pageIndex++) {
      const sliceHeightPx = sliceHeights[pageIndex];

      const pageCanvas = this.createSliceCanvas(
        canvas,
        imgWidth,
        sliceHeightPx,
        consumedPx,
        backgroundColor,
      );

      this.addCanvasToPdf(
        pdf,
        pageCanvas,
        imgWidth,
        sliceHeightPx,
        contentWidth,
        contentHeight,
        margin,
      );

      consumedPx += sliceHeightPx;

      if (consumedPx < imgHeight) {
        pdf.addPage();
      }
    }
  }

  private createSliceCanvas(
    sourceCanvas: HTMLCanvasElement,
    width: number,
    height: number,
    offsetY: number,
    backgroundColor = "#ffffff",
  ): HTMLCanvasElement {
    const pageCanvas = document.createElement("canvas");
    pageCanvas.width = width;
    pageCanvas.height = height;

    const ctx = pageCanvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D context unavailable");

    // Fill with the container's actual background colour so the padding area
    // at the bottom of the last page matches the active theme.
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(sourceCanvas, 0, offsetY, width, height, 0, 0, width, height);

    return pageCanvas;
  }

  private addCanvasToPdf(
    pdf: jsPDF,
    canvas: HTMLCanvasElement,
    imgWidth: number,
    sliceHeightPx: number,
    contentWidth: number,
    contentHeight: number,
    margin: number,
  ): void {
    const imgData = canvas.toDataURL("image/png");
    const pageScale = Math.min(
      contentWidth / imgWidth,
      contentHeight / sliceHeightPx,
    );
    const renderWidthMm = imgWidth * pageScale;
    const renderHeightMm = sliceHeightPx * pageScale;

    pdf.addImage(
      imgData,
      "PNG",
      margin + (contentWidth - renderWidthMm) / 2,
      margin,
      renderWidthMm,
      renderHeightMm,
    );
  }

  private addExtraPages(
    pdf: jsPDF,
    extraPages: PdfExtraPage[],
    pageWidth: number,
    pageHeight: number,
    margin: number,
  ): void {
    const LABEL_COL_WIDTH = 68; // mm — enough for the longest label
    const VALUE_COL_X = margin + LABEL_COL_WIDTH;
    const VALUE_COL_WIDTH = pageWidth - margin - LABEL_COL_WIDTH;
    const LINE_HEIGHT = 7; // mm between rows

    for (const page of extraPages) {
      pdf.addPage();
      let y = margin + 8;

      // Title
      pdf.setFontSize(16);
      pdf.setFont("helvetica", "bold");
      pdf.text(page.title, margin, y);
      y += 10;

      // Accent line below title
      pdf.setDrawColor(0, 103, 187);
      pdf.setLineWidth(0.5);
      pdf.line(margin, y, pageWidth - margin, y);
      y += 10;

      pdf.setFontSize(11);

      for (const item of page.items) {
        // Label column (bold)
        pdf.setFont("helvetica", "bold");
        const labelLines = pdf.splitTextToSize(
          item.label,
          LABEL_COL_WIDTH - 4,
        ) as string[];
        pdf.text(labelLines, margin, y);

        // Value column (normal)
        pdf.setFont("helvetica", "normal");
        const valueLines = pdf.splitTextToSize(
          item.value,
          VALUE_COL_WIDTH,
        ) as string[];
        pdf.text(valueLines, VALUE_COL_X, y);

        y += LINE_HEIGHT * Math.max(labelLines.length, valueLines.length);

        if (y > pageHeight - margin - 25) {
          pdf.addPage();
          y = margin + 10;
        }
      }

      // Footer disclaimer
      if (page.footer) {
        y += 4;
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "bolditalic");
        const footerLines = pdf.splitTextToSize(
          page.footer,
          pageWidth - margin * 2,
        ) as string[];
        pdf.text(footerLines, margin, y);
        pdf.setFont("helvetica", "normal");
        pdf.setFontSize(11);
      }
    }
  }

  private addPageNumbers(
    pdf: jsPDF,
    pageWidth: number,
    pageHeight: number,
  ): void {
    const pdfWithPages = pdf as jsPDF & {
      getNumberOfPages?: () => number;
      internal?: { pages?: unknown[] };
    };
    const totalPagesFromMethod = pdfWithPages.getNumberOfPages?.();
    const totalPages =
      typeof totalPagesFromMethod === "number"
        ? totalPagesFromMethod
        : Array.isArray(pdfWithPages.internal?.pages)
          ? pdfWithPages.internal.pages.length
          : 1;

    pdf.setFontSize(9);
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth / 2, pageHeight - 6, {
        align: "center",
      });
    }
  }

  private downloadPdf(pdf: jsPDF, documentTitle?: string): void {
    const filename = documentTitle
      ? `${documentTitle.replace(/\.pdf$/i, "")}.pdf`
      : PDF_CONFIG.FILENAME;
    pdf.save(filename);
  }
}
