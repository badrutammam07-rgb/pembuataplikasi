import JSZip from "jszip";

/**
 * Utility to bundle generated code and project metadata into a clean downloadable ZIP archive.
 */
export async function exportProjectToZip(
  code: string,
  projectName: string = "ghighais-brain-app"
): Promise<void> {
  try {
    const zip = new JSZip();

    // 1. Add primary index.html
    const formattedCode = code && code.trim().length > 0 ? code : "<!DOCTYPE html>\n<html><body><h1>Ghighais Brain App</h1></body></html>";
    zip.file("index.html", formattedCode);

    // 2. Add README.md with instructions
    const readmeContent = `# ${projectName}

Dihasilkan secara otomatis oleh **Ghighais Brain** (AI Web Generator & Studio).

## Cara Menjalankan
1. Ekstrak file zip ini ke folder pilihan Anda.
2. Buka file \`index.html\` langsung di browser favorit Anda (Chrome, Edge, Firefox, Safari).
3. Atau jalankan server lokal:
   \`\`\`bash
   npx serve .
   # atau
   python -m http.server 8000
   \`\`\`

## Dukungan & Lisensi
Support by Ghighais Development.
`;
    zip.file("README.md", readmeContent);

    // 3. Add standard .gitignore
    const gitignoreContent = `# Dependency and environment files
node_modules/
dist/
build/
.env
.env.local
.DS_Store
Thumbs.db
`;
    zip.file(".gitignore", gitignoreContent);

    // 4. Generate ZIP blob
    const content = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 9 },
    });

    // 5. Trigger download via browser anchor
    const cleanFileName = `${projectName.replace(/[^a-zA-Z0-9_-]/g, "_")}.zip`;
    const downloadUrl = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = cleanFileName;
    document.body.appendChild(link);
    link.click();

    // Clean up DOM and memory
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(downloadUrl);
    }, 200);
  } catch (error) {
    console.error("Gagal mengekspor file ZIP:", error);
    alert("Terjadi kesalahan saat memproses file ZIP. Silakan coba lagi.");
  }
}
