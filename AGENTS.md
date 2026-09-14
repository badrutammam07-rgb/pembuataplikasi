# ATURAN UTAMA GENERASI APLIKASI

Setiap kali user memberikan perintah untuk membuat/mengupdate aplikasi, AI WAJIB mengecek apakah input mengandung URL GitHub Repository (`github.com/username/repo`).

---

## MODE 1: UPDATE APLIKASI EKSISTING (Jika Ada URL GitHub)
**Trigger**: User menyertakan link `github.com/username/repo` (atau secara eksplisit meminta "single file").
**Output Wajib**: SINGLE-FILE APPLICATION (`index.html` only).

### Constraint Ketat:
1. HANYA generate kode lengkap untuk `index.html`.
2. DILARANG keras membuat file terpisah (`.js`, `.css`, `.ts`, `package.json`, `README.md`).
3. Semua CSS harus inline `<style>` atau via CDN (Tailwind CSS: `<script src="https://cdn.tailwindcss.com"></script>` atau Unpkg).
4. Semua JS harus inline `<script>`. Tidak boleh ada import file lokal.
5. Semua aset/gambar gunakan URL absolut atau Base64.
6. Kode harus siap copy-paste langsung menimpa `index.html` existing.
7. Berikan output dalam SATU code block HTML lengkap.

---

## MODE 2: APLIKASI BARU (Jika TIDAK Ada URL GitHub)
**Trigger**: User tidak menyertakan link GitHub repo (atau secara eksplisit meminta "multi file / full project").
**Output Wajib**: FULL PROJECT STRUCTURE (Modern Architecture).

### Constraint Ketat:
1. Gunakan stack modern (React + Vite + TypeScript + Tailwind).
2. Generate struktur folder lengkap: `src/components/`, `src/pages/`, `src/utils/`, `public/`.
3. Sertakan file konfigurasi: `package.json`, `vite.config.ts`, `tsconfig.json`, `.gitignore`.
4. Pisahkan komponen ke file `.tsx`/`.jsx` terpisah.
5. Berikan instruksi setup: `npm install`, `npm run dev`, `npm run build`.
6. Jelaskan cara deploy ke GitHub Pages/Vercel/Netlify.

---

## CATATAN PENTING UNTUK KEDUA MODE:
- Jika user menyebutkan **"single file"** secara eksplisit meski ada URL → Tetap ikuti **Mode 1**.
- Jika user menyebutkan **"multi file / full project"** meski TANPA URL → Tetap ikuti **Mode 2**.
- **Selalu konfirmasi mode yang dipilih sebelum generate**:
  `🔍 Terdeteksi [URL ADA/TIDAK ADA] → Menggunakan Mode [UPDATE EXISTING / NEW PROJECT]`
