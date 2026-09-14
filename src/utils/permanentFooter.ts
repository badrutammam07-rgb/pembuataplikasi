/**
 * Utilitas Enforcer Footer Permanen
 * Memastikan setiap kode aplikasi yang dihasilkan, diedit, diekspor ke ZIP,
 * atau di-push ke GitHub selalu memiliki footer permanen yang tidak bisa diubah ataupun
 * dihapus oleh user umum saat membuat aplikasi apapun.
 * 
 * Namun ADMIN memiliki wewenang khusus untuk merubah teks footer permanen
 * melalui panel Admin tersembunyi.
 */

export const DEFAULT_PERMANENT_FOOTER_TEXT = "SUPPORT BY GHIGHAIS DEVELOPMENT";
export const PERMANENT_FOOTER_TEXT = DEFAULT_PERMANENT_FOOTER_TEXT;

/**
 * Mengambil teks footer permanen aktif dari localStorage (diset oleh Admin)
 * atau fallback ke teks default.
 */
export function getActiveFooterText(): string {
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const saved = localStorage.getItem("ghighais_permanent_footer_text");
      if (saved && saved.trim()) return saved.trim();

      // Cek juga dari app config jika tersimpan
      const configStr = localStorage.getItem("ghighais_app_config");
      if (configStr) {
        const parsed = JSON.parse(configStr);
        if (parsed?.permanentFooterText && parsed.permanentFooterText.trim()) {
          return parsed.permanentFooterText.trim();
        }
      }
    }
  } catch (e) {
    console.warn("Error reading active footer text:", e);
  }
  return DEFAULT_PERMANENT_FOOTER_TEXT;
}

export function createPermanentFooterHtml(text: string): string {
  const safeText = text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return `<footer id="ghighais-permanent-footer" class="w-full border-t border-slate-800/80 py-4 px-4 text-center bg-slate-950 text-slate-400 font-sans text-xs tracking-wider select-none">
  <div class="max-w-6xl mx-auto flex items-center justify-center gap-2">
    <span class="font-semibold text-slate-300 tracking-wider">${safeText}</span>
  </div>
</footer>`;
}

export function createPermanentFooterScript(text: string): string {
  const jsonText = JSON.stringify(text);
  return `<script id="ghighais-footer-guard">
  (function() {
    const text = ${jsonText};
    function enforce() {
      let f = document.getElementById("ghighais-permanent-footer");
      if (!f) {
        f = document.createElement("footer");
        f.id = "ghighais-permanent-footer";
        document.body.appendChild(f);
      }
      f.className = "w-full border-t border-slate-800/80 py-4 px-4 text-center bg-slate-950 text-slate-400 font-sans text-xs tracking-wider select-none";
      f.innerHTML = '<div class="max-w-6xl mx-auto flex items-center justify-center gap-2"><span class="font-semibold text-slate-300 tracking-wider">' + text + '</span></div>';
    }
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", enforce);
    } else {
      enforce();
    }
    // Cegah penghapusan atau perubahan lewat DOM oleh user
    if (window.MutationObserver) {
      const observer = new MutationObserver(function() {
        const f = document.getElementById("ghighais-permanent-footer");
        if (!f || !f.innerText.includes(text)) {
          enforce();
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }
  })();
</script>`;
}

export const PERMANENT_FOOTER_HTML = createPermanentFooterHtml(DEFAULT_PERMANENT_FOOTER_TEXT);
export const PERMANENT_FOOTER_SCRIPT = createPermanentFooterScript(DEFAULT_PERMANENT_FOOTER_TEXT);

/**
 * Menyuntikkan atau memastikan footer permanen selalu ada di dalam kode HTML.
 * Jika user menghapus atau memodifikasi footer, fungsi ini akan mengembalikannya
 * menggunakan teks footer resmi (yang disetel oleh admin).
 */
export function ensurePermanentFooter(htmlCode: string, customFooterText?: string): string {
  if (!htmlCode || typeof htmlCode !== "string") return htmlCode;

  const activeText = customFooterText && customFooterText.trim()
    ? customFooterText.trim()
    : getActiveFooterText();

  const footerHtml = createPermanentFooterHtml(activeText);
  const footerScript = createPermanentFooterScript(activeText);

  let processed = htmlCode;

  // Hapus footer lama jika ada id ghighais-permanent-footer agar tidak duplikat
  processed = processed.replace(
    /<footer[^>]*id=["']ghighais-permanent-footer["'][^>]*>[\s\S]*?<\/footer>/gi,
    ""
  );

  // Hapus script guard lama jika ada agar tidak duplikat
  processed = processed.replace(
    /<script[^>]*id=["']ghighais-footer-guard["'][^>]*>[\s\S]*?<\/script>/gi,
    ""
  );

  // Cari tag penutup </body>
  const bodyCloseIndex = processed.lastIndexOf("</body>");
  if (bodyCloseIndex !== -1) {
    const beforeBody = processed.substring(0, bodyCloseIndex);
    const afterBody = processed.substring(bodyCloseIndex);
    return `${beforeBody}\n${footerHtml}\n${footerScript}\n${afterBody}`;
  }

  // Jika tidak ada </body>, tambahkan di bagian akhir
  return `${processed}\n${footerHtml}\n${footerScript}`;
}
