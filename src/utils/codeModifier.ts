import { LayoutEditorState } from "../types";

/**
 * Safely updates header and logo styling/classes in HTML code without creating errors.
 * Uses DOMParser to guarantee valid HTML structure.
 */
export function updateLayoutInHtml(
  htmlCode: string,
  layout: LayoutEditorState
): string {
  if (!htmlCode) return htmlCode;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlCode, "text/html");

    // 1. Locate or create Header container
    let header = doc.getElementById("app-header") || doc.querySelector("header");
    let headerContainer =
      doc.getElementById("header-container") ||
      (header ? header.querySelector("div") : null);

    // 2. Locate or create Logo element
    let logo = doc.getElementById("app-logo") || doc.querySelector(".app-logo");

    // Apply Header Styling
    if (header) {
      // Remove old background / style classes
      header.classList.remove(
        "bg-slate-900/70",
        "bg-slate-900/80",
        "bg-slate-900",
        "bg-slate-950",
        "bg-transparent",
        "backdrop-blur-md",
        "backdrop-blur-sm",
        "border-b",
        "border-b-2",
        "border-indigo-500/60",
        "border-indigo-500/30",
        "border-slate-800/80",
        "border-slate-800",
        "bg-gradient-to-r"
      );

      switch (layout.headerStyle) {
        case "glass":
          header.classList.add("bg-slate-900/70", "backdrop-blur-md", "border-b", "border-slate-800/80");
          break;
        case "solid":
          header.classList.add("bg-slate-900", "border-b", "border-slate-800");
          break;
        case "transparent":
          header.classList.add("bg-transparent");
          break;
        case "bordered":
          header.classList.add("bg-slate-900/90", "border-b-2", "border-indigo-500/60");
          break;
        case "gradient":
          header.classList.add("bg-gradient-to-r", "from-slate-900", "via-indigo-950/70", "to-slate-900", "border-b", "border-indigo-500/30");
          break;
      }
    }

    // Apply Header Alignment & Container
    if (headerContainer) {
      headerContainer.classList.remove("justify-between", "justify-center", "justify-start", "justify-end", "flex-col", "flex-row");

      switch (layout.headerAlign) {
        case "center":
          headerContainer.classList.add("justify-center", "gap-8");
          break;
        case "left":
          headerContainer.classList.add("justify-start", "gap-6");
          break;
        case "right":
          headerContainer.classList.add("justify-end", "gap-6");
          break;
        case "between":
        default:
          headerContainer.classList.add("justify-between");
          break;
      }
    }

    // Apply Logo Positioning & Sizing
    if (logo) {
      logo.classList.remove(
        "order-first",
        "order-last",
        "order-none",
        "mx-auto",
        "mr-auto",
        "ml-auto",
        "self-center",
        "self-start",
        "self-end"
      );

      // Find inner logo icon box (e.g. w-10 h-10)
      const iconBox = logo.querySelector("div") || logo.querySelector("svg")?.parentElement;
      if (iconBox) {
        iconBox.classList.remove(
          "w-8", "h-8",
          "w-10", "h-10",
          "w-12", "h-12",
          "w-14", "h-14",
          "w-16", "h-16"
        );

        switch (layout.logoSize) {
          case "sm":
            iconBox.classList.add("w-8", "h-8");
            break;
          case "lg":
            iconBox.classList.add("w-14", "h-14");
            break;
          case "xl":
            iconBox.classList.add("w-16", "h-16");
            break;
          case "md":
          default:
            iconBox.classList.add("w-10", "h-10");
            break;
        }
      }

      switch (layout.logoPosition) {
        case "center":
          logo.classList.add("mx-auto", "justify-center");
          break;
        case "right":
          logo.classList.add("order-last", "ml-auto");
          break;
        case "left":
        default:
          logo.classList.add("order-first", "mr-auto");
          break;
      }
    }

    // Inject our onerror reporter if not present to ensure Auto Fix works reliably
    if (!doc.head.querySelector("script[data-ghighais-reporter]")) {
      const errorReporterScript = doc.createElement("script");
      errorReporterScript.setAttribute("data-ghighais-reporter", "true");
      errorReporterScript.textContent = `
        window.addEventListener('error', function(e) {
          if (window.parent) {
            window.parent.postMessage({
              type: 'APP_ERROR',
              message: e.message || 'Script runtime error',
              line: e.lineno,
              col: e.colno,
              stack: e.error ? e.error.stack : ''
            }, '*');
          }
        });
      `;
      doc.head.appendChild(errorReporterScript);
    }

    // Serialize back to clean HTML with DOCTYPE
    const htmlOutput = "<!DOCTYPE html>\n" + doc.documentElement.outerHTML;
    return htmlOutput;
  } catch (err) {
    console.error("Layout modifier error:", err);
    return htmlCode;
  }
}
