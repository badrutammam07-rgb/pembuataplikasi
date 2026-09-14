import { AppConfig, LayoutEditorState } from "../types";

export const DEFAULT_CUSTOM_TEXTS: Record<string, string> = {
  // Navigation & Branding
  brand_title: "Ghighais Brain",
  brand_subtitle: "AI Web Generator & Studio",
  brand_badge: "AI Coder Engine",
  
  // Navigation Buttons
  btn_export_zip: "Download ZIP",
  btn_push_github: "Push ke GitHub",
  btn_reset_all_project: "Reset Proyek (Awal)",
  btn_admin_direct: "Buka Halaman Admin",
  btn_view_split: "Split 3 Kolom",
  btn_view_tabs: "Mode Tab",
  
  // Prompt Panel Texts
  panel_prompt_title: "Instruksi & Prompt AI",
  panel_prompt_desc: "Tulis prompt aplikasi web yang ingin Anda buat atau kembangkan.",
  prompt_input_placeholder: "Ketik ide aplikasi Anda... (Contoh: Buatkan dashboard keuangan modern dengan dark mode, grafik pengeluaran dan tabel transaksi)",
  btn_submit_prompt: "Generate dengan AI",
  btn_new_chat: "Mulai Chat Baru",
  prompt_suggestion_label: "Inspirasi Cepat:",
  
  // Progress Bar Texts
  progress_analyzing: "Menganalisis prompt & instruksi arsitektur...",
  progress_designing: "Menyusun skema antarmuka, tata letak & palet warna...",
  progress_coding: "Menulis kode HTML5, CSS Tailwind, dan JavaScript...",
  progress_optimizing: "Memvalidasi sintaks, script event, dan kebersihan kode...",
  progress_completed: "Selesai 100%! Aplikasi siap dijalankan di preview.",
  
  // Coding Panel Texts
  panel_coding_title: "Editor & Inspeksi Kode",
  panel_coding_desc: "Kode HTML/CSS/JS standalone siap jalan dan otomatis sinkron.",
  btn_copy_code: "Salin Kode",
  btn_code_copied: "Berhasil Disalin!",
  btn_format_code: "Rapikan Format",
  btn_manual_run: "Jalankan Kode Manual",
  btn_reset_template: "Muat Ulang Starter",
  
  // Preview Panel Texts
  panel_preview_title: "Live Interactive Preview",
  preview_device_desktop: "Desktop",
  preview_device_tablet: "Tablet",
  preview_device_mobile: "Mobile",
  btn_reload_preview: "Refresh Preview",
  btn_open_fullscreen: "Layar Penuh",
  
  // Visual Layout Editor in Preview
  layout_editor_title: "Visual Layout & Posisi",
  label_logo_position: "Posisi Logo:",
  label_logo_size: "Ukuran Logo:",
  label_header_align: "Tata Letak Header:",
  label_header_style: "Gaya Header:",
  pos_left: "Kiri",
  pos_center: "Tengah",
  pos_right: "Kanan",
  pos_between: "Space Between",
  style_glass: "Glassmorphism",
  style_solid: "Solid Gelap",
  style_transparent: "Transparan",
  style_bordered: "Bordered Glow",
  size_small: "Kecil",
  size_normal: "Sedang",
  size_large: "Besar",
  
  // Error & Auto Fix Texts
  error_banner_title: "Terdeteksi Kendala pada Script Aplikasi",
  btn_auto_fix: "Perbaiki Otomatis (Auto Fix)",
  btn_auto_fix_loading: "Memperbaiki Kode secara Otomatis...",
  btn_dismiss_error: "Abaikan",
  
  // Admin Page Texts
  admin_title: "Halaman Admin Tersembunyi (Ghighais Brain)",
  admin_subtitle: "Kustomisasi logo, identitas brand, dan semua teks tombol di seluruh aplikasi tanpa login.",
  admin_tab_logo: "Kustomisasi Logo & Brand",
  admin_tab_texts: "Kustomisasi Semua Teks & Tombol",
  admin_tab_footer: "Footer Permanen & Hak Cipta",
  admin_tab_ai: "Pengaturan Model AI",
  btn_admin_save: "Simpan Perubahan",
  btn_admin_reset_defaults: "Kembalikan ke Default Pabrik",
  btn_admin_close: "Tutup Halaman Admin",
  admin_save_success: "Pengaturan berhasil disimpan ke sistem!",
  label_permanent_footer_text: "Teks Footer Permanen (Hak Cipta / Brand Guard):",
  desc_permanent_footer_text: "Teks ini terkunci permanen untuk semua user saat membuat aplikasi, tetapi dapat Anda sesuaikan selaku Admin.",
  
  // GitHub Modal Texts
  github_modal_title: "Push Proyek ke Repository GitHub",
  github_modal_desc: "Simpan hasil coding aplikasi web Anda langsung ke repository GitHub.",
  github_token_label: "Personal Access Token (PAT):",
  github_repo_label: "Nama Repository Baru / Eksisting:",
  github_branch_label: "Nama Branch:",
  github_commit_label: "Pesan Commit:",
  github_private_label: "Jadikan Private Repository",
  btn_github_submit: "Push Kode ke GitHub Sekarang",
  btn_github_cancel: "Batal",
};

export const DEFAULT_LAYOUT_STATE: LayoutEditorState = {
  logoPosition: "left",
  logoSize: "md",
  headerAlign: "between",
  headerStyle: "glass",
  headerPadding: "normal",
};

export const LOGO_PRESETS = [
  {
    id: "brain_neon",
    name: "Brain Quantum",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full text-indigo-400"><path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z"/><path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z"/><path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4"/><path d="M17.599 6.5a3 3 0 0 0 .399-1.375"/><path d="M6.003 5.125A3 3 0 0 0 6.401 6.5"/><path d="M3.477 10.896a4 4 0 0 1 .585-.396"/><path d="M19.938 10.5a4 4 0 0 1 .585.396"/><path d="M6 18a4 4 0 0 1-1.967-.516"/><path d="M19.967 17.484A4 4 0 0 1 18 18"/></svg>`,
  },
  {
    id: "cyber_chip",
    name: "Cyber Core",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full text-cyan-400"><rect width="16" height="16" x="4" y="4" rx="2"/><rect width="6" height="6" x="9" y="9" rx="1"/><path d="M15 2v2"/><path d="M15 20v2"/><path d="M2 15h2"/><path d="M2 9h2"/><path d="M20 15h2"/><path d="M20 9h2"/><path d="M9 2v2"/><path d="M9 20v2"/></svg>`,
  },
  {
    id: "flame_ai",
    name: "Neural Pulse",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full text-amber-400"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>`,
  },
  {
    id: "infinity_spark",
    name: "Infinity Spark",
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-full h-full text-purple-400"><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/></svg>`,
  },
];

export const DEFAULT_APP_CONFIG: AppConfig = {
  logoUrl: "",
  logoType: "preset",
  logoPreset: "brain_neon",
  logoScale: 1,
  logoFit: "contain",
  logoOffsetX: 0,
  logoOffsetY: 0,
  logoRotate: 0,
  appTitle: "Ghighais Brain",
  appSubtitle: "AI Web Generator & Studio",
  permanentFooterText: "SUPPORT BY GHIGHAIS DEVELOPMENT",
  loginLogoUrl: "/ghighais-logo.jpg",
  loginLogoType: "default",
  customTexts: DEFAULT_CUSTOM_TEXTS,
  qwenModel: "AI Coder Engine (Free Tier)",
  qwenApiKey: "",
};

export const DEFAULT_STARTER_CODE = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ghighais Brain - Generated App</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }
    .floating-card { animation: float 4s ease-in-out infinite; }
  </style>
</head>
<body class="bg-slate-950 text-slate-100 min-h-screen flex flex-col font-sans selection:bg-indigo-500 selection:text-white antialiased">
  
  <!-- Header Aplikasi (Posisi & Tata Letak Dapat Diubah Langsung) -->
  <header id="app-header" class="w-full border-b border-slate-800/80 bg-slate-900/70 backdrop-blur-md px-6 py-4 transition-all duration-300">
    <div id="header-container" class="max-w-6xl mx-auto flex items-center justify-between">
      <!-- Logo Aplikasi -->
      <div id="app-logo" class="flex items-center gap-3 select-none cursor-pointer transition-all duration-200">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/30">
          <i data-lucide="cpu" class="w-6 h-6"></i>
        </div>
        <div>
          <span class="text-xl font-bold bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent">Ghighais Studio</span>
          <span class="block text-[10px] text-indigo-400 font-medium tracking-wider uppercase">Bertenaga AI Coder</span>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <span class="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5 shadow-sm">
          <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span>Sistem Aktif</span>
        </span>
        <button onclick="toggleThemeHint()" class="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors">
          <i data-lucide="sparkles" class="w-4 h-4"></i>
        </button>
      </div>
    </div>
  </header>

  <!-- Konten Aplikasi Interaktif -->
  <main class="flex-1 max-w-6xl w-full mx-auto px-6 py-10 flex flex-col">
    <!-- Hero Section -->
    <div class="text-center max-w-3xl mx-auto mb-10">
      <div class="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-medium mb-4 shadow-sm">
        <i data-lucide="zap" class="w-3.5 h-3.5 text-indigo-400"></i>
        <span>Live Web Preview Siap Digunakan</span>
      </div>
      <h1 class="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-4">
        Solusi Web Cerdas & Interaktif
      </h1>
      <p class="text-slate-400 text-base md:text-lg leading-relaxed">
        Ketik prompt apapun di panel kiri untuk menghasilkan web app kustom. Gunakan alat tata letak di atas untuk memindahkan posisi logo atau header secara visual tanpa error!
      </p>
    </div>

    <!-- Interactive Counter & Task Widget -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full mb-10">
      <!-- Kartu 1: Kalkulator / Counter -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2 text-indigo-400">
            <i data-lucide="activity" class="w-5 h-5"></i>
            <h3 class="font-semibold text-white">Interaksi Pengunjung</h3>
          </div>
          <span id="counter-badge" class="text-xs px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono">Count: 0</span>
        </div>
        <p class="text-xs text-slate-400 mb-6">Uji respon logika JavaScript real-time pada aplikasi ini.</p>
        
        <div class="flex items-center justify-center gap-4 py-4 bg-slate-950/60 rounded-xl border border-slate-800/60 mb-6">
          <button onclick="decrementCounter()" class="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-lg flex items-center justify-center transition-transform active:scale-95">-</button>
          <span id="counter-val" class="text-4xl font-extrabold text-white font-mono min-w-[3rem] text-center">0</span>
          <button onclick="incrementCounter()" class="w-10 h-10 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-lg flex items-center justify-center transition-transform active:scale-95 shadow-md shadow-indigo-600/30">+</button>
        </div>

        <div class="flex gap-2">
          <button onclick="resetCounter()" class="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors text-center">
            Reset Nilai
          </button>
        </div>
      </div>

      <!-- Kartu 2: Catatan / Fitur Cepat -->
      <div class="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-2 text-purple-400 mb-2">
            <i data-lucide="list-todo" class="w-5 h-5"></i>
            <h3 class="font-semibold text-white">Fitur Quick Action</h3>
          </div>
          <p class="text-xs text-slate-400 mb-4">Tambahkan item catatan ke daftar instan.</p>
          
          <div class="flex gap-2 mb-4">
            <input id="todo-input" type="text" placeholder="Tulis aktivitas baru..." class="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-purple-500" onkeydown="if(event.key==='Enter') addTodo()">
            <button onclick="addTodo()" class="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-semibold shadow-md shadow-purple-600/25 transition-all">Tambah</button>
          </div>

          <ul id="todo-list" class="space-y-2 text-xs max-h-36 overflow-y-auto pr-1">
            <li class="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <span class="flex items-center gap-2 text-slate-300">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-400"></i>
                <span>Tampilan terhubung dengan AI Engine</span>
              </span>
            </li>
            <li class="p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <span class="flex items-center gap-2 text-slate-300">
                <i data-lucide="check-circle-2" class="w-3.5 h-3.5 text-emerald-400"></i>
                <span>Editor posisi visual aktif</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Alert status dialog -->
    <div id="alert-banner" class="hidden max-w-xl mx-auto p-4 rounded-xl bg-indigo-950/90 border border-indigo-500/50 text-indigo-200 text-xs text-center">
      <span id="alert-text">Status interaktif diperbarui!</span>
    </div>
  </main>

  <footer id="ghighais-permanent-footer" class="w-full border-t border-slate-800/80 py-4 px-4 text-center bg-slate-950 text-slate-400 font-sans text-xs tracking-wider select-none">
    <div class="max-w-6xl mx-auto flex items-center justify-center gap-2">
      <span class="font-semibold text-slate-300 tracking-wider">SUPPORT BY GHIGHAIS DEVELOPMENT</span>
    </div>
  </footer>

  <script id="ghighais-footer-guard">
    (function() {
      const text = "SUPPORT BY GHIGHAIS DEVELOPMENT";
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
      if (window.MutationObserver) {
        new MutationObserver(function() {
          const f = document.getElementById("ghighais-permanent-footer");
          if (!f || !f.innerText.includes(text)) {
            enforce();
          }
        }).observe(document.documentElement, { childList: true, subtree: true });
      }
    })();
  </script>

  <script>
    // Inisialisasi ikon Lucide
    lucide.createIcons();

    let count = 0;
    function incrementCounter() {
      count++;
      updateCounterUI();
    }
    function decrementCounter() {
      if (count > 0) count--;
      updateCounterUI();
    }
    function resetCounter() {
      count = 0;
      updateCounterUI();
    }
    function updateCounterUI() {
      document.getElementById('counter-val').textContent = count;
      document.getElementById('counter-badge').textContent = 'Count: ' + count;
    }

    function addTodo() {
      const input = document.getElementById('todo-input');
      const text = input.value.trim();
      if (!text) return;
      
      const list = document.getElementById('todo-list');
      const li = document.createElement('li');
      li.className = 'p-2 rounded-lg bg-slate-950/70 border border-slate-800/80 flex items-center justify-between animate-fadeIn';
      li.innerHTML = '<span class="flex items-center gap-2 text-slate-300"><i data-lucide="circle" class="w-3.5 h-3.5 text-indigo-400"></i><span>' + escapeHtml(text) + '</span></span><button onclick="this.parentElement.remove()" class="text-slate-500 hover:text-red-400 text-xs">✕</button>';
      list.appendChild(li);
      input.value = '';
      lucide.createIcons();
    }

    function toggleThemeHint() {
      const banner = document.getElementById('alert-banner');
      banner.classList.remove('hidden');
      document.getElementById('alert-text').textContent = '✨ Mode interaksi prima! Waktu saat ini: ' + new Date().toLocaleTimeString();
      setTimeout(() => banner.classList.add('hidden'), 3500);
    }

    function escapeHtml(str) {
      return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    }

    // Tangkap error secara cerdas dan kirimkan ke parent window untuk Auto Fix
    window.onerror = function(message, source, lineno, colno, error) {
      if (window.parent) {
        window.parent.postMessage({
          type: 'APP_ERROR',
          message: message,
          line: lineno,
          col: colno,
          stack: error ? error.stack : ''
        }, '*');
      }
      return false;
    };
  </script>
</body>
</html>`;
