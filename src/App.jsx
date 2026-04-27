import { useState, useRef, useCallback } from "react";

const ROSELLE_LOGO = "data:image/png;base64,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AIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACIJCcAAIBIcgIAAIgkJwAAgEhyAgAAiCQnAACASHICAACI9P+DisiRkw6kVAAAAABJRU5ErkJggg==";

const loadScript = (src) => new Promise((resolve, reject) => {
  if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
  const s = document.createElement("script");
  s.src = src; s.onload = resolve; s.onerror = reject;
  document.head.appendChild(s);
});

const loadLibs = async () => {
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js");
  await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js");
};

const readAsDataURL = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(file); });
const readAsArrayBuffer = (file) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(file); });

const STEPS = ["Property info", "Notes", "Upload files", "Extra PDFs", "Arrange order", "Generate PDF"];

const inp = { width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-background-primary)", boxSizing: "border-box", fontFamily: "var(--font-sans)", outline: "none" };
const lbl = { display: "block", fontSize: "12px", fontWeight: "500", color: "var(--color-text-secondary)", marginBottom: "6px" };

const DropZone = ({ icon, text, onClick, onDrop }) => {
  const [over, setOver] = useState(false);
  return (
    <div
      onClick={onClick}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); if (onDrop) onDrop(e.dataTransfer.files); }}
      style={{ padding: "28px", border: `1px dashed ${over ? "#185FA5" : "var(--color-border-secondary)"}`, borderRadius: 10, cursor: "pointer", textAlign: "center", background: over ? "var(--color-background-info)" : "var(--color-background-secondary)", transition: "all 0.15s" }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <p style={{ fontSize: 13, margin: 0, color: "var(--color-text-secondary)" }}>{text}</p>
      <p style={{ fontSize: 11, margin: "6px 0 0", color: "var(--color-text-tertiary)" }}>or drag &amp; drop here</p>
    </div>
  );
};

export default function App() {
  const [step, setStep] = useState(0);
  const [logo, setLogo] = useState(null);
  const [info, setInfo] = useState({
    propertyName: "", address: "",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  });
  const [genNotes, setGenNotes] = useState([]);
  const [eqNotes, setEqNotes] = useState([]);
  const [notesDocName, setNotesDocName] = useState("");
  const [notesDocContent, setNotesDocContent] = useState("");
  const [excelData, setExcelData] = useState(null);
  const [excelFileName, setExcelFileName] = useState("");
  const [pptSlides, setPptSlides] = useState([]);
  const [pptFileName, setPptFileName] = useState("");
  const [extraPdfs, setExtraPdfs] = useState([]);
  const [sections, setSections] = useState([
    { id: "cover",  label: "Cover page",                   icon: "📄", color: "#3a3937", desc: "Auto-generated · 1 page" },
    { id: "notes",  label: "Clarifications & Notes",        icon: "📝", color: "#185FA5", desc: "" },
    { id: "excel",  label: "Reserve Schedule (Excel)",      icon: "📊", color: "#639922", desc: "Not uploaded yet" },
    { id: "photos", label: "Product Photos (PowerPoint)",   icon: "🖼️", color: "#854F0B", desc: "Not uploaded yet" },
  ]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [done, setDone] = useState(false);

  const logoRef = useRef(); const excelRef = useRef();
  const pptRef = useRef(); const pdfRef = useRef(); const wordRef = useRef();

  const handleLogo = useCallback(async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setLogo(await readAsDataURL(file));
  }, []);

  const handleWordDoc = useCallback(async (file) => {
    if (!file) return;
    setNotesDocName(file.name);
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
      const ab = await readAsArrayBuffer(file);
      // Use convertToHtml to get bold info
      const result = await window.mammoth.convertToHtml({ arrayBuffer: ab });
      const html = result.value;
      // Parse html to extract lines with bold flag
      const parser = new DOMParser();
      const htmlDoc = parser.parseFromString(html, "text/html");
      const lines = [];
      htmlDoc.body.childNodes.forEach(node => {
        const text = node.textContent?.trim();
        if (!text) return;
        const isBold = node.querySelector && (node.querySelector("strong") || node.nodeName === "STRONG");
        // Check if entire paragraph is bold
        const fullBold = isBold && node.textContent === node.querySelector?.("strong")?.textContent;
        lines.push({ text, __bold: !!fullBold });
      });
      setGenNotes(lines);
      setSections(p => p.map(s => s.id === "notes" ? { ...s, desc: `${file.name} · ${lines.length} lines` } : s));
    } catch (err) {
      alert("Could not read Word doc: " + err.message);
    }
  }, []);

  const handleExcel = useCallback(async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setExcelFileName(file.name);
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      const ab = await readAsArrayBuffer(file);
      const wb = XLSX.read(ab);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }).filter(r => r.some(c => c !== ""));
      setExcelData({ rows });
      setSections(p => p.map(s => s.id === "excel" ? { ...s, desc: `${file.name} · ${rows.length} rows` } : s));
    } catch (err) { alert("Could not read Excel: " + err.message); }
  }, []);

  const handlePPT = useCallback(async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setPptFileName(file.name);
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
      const ab = await readAsArrayBuffer(file);
      const zip = await window.JSZip.loadAsync(ab);
      const mediaFiles = Object.keys(zip.files)
        .filter(f => f.startsWith("ppt/media/") && /\.(png|jpg|jpeg)$/i.test(f))
        .sort();
      const slides = await Promise.all(mediaFiles.map(async path => {
        const blob = await zip.files[path].async("blob");
        return { dataUrl: await readAsDataURL(blob), name: path.split("/").pop() };
      }));
      setPptSlides(slides);
      setSections(p => p.map(s => s.id === "photos" ? { ...s, desc: `${slides.length} photos · ${Math.ceil(slides.length / 2)} pages` } : s));
    } catch (err) { alert("Could not read PowerPoint: " + err.message); }
  }, []);

  const handleExtraPdfs = useCallback(async (files) => {
    const arr = Array.from(files).filter(f => f.name.endsWith(".pdf"));
    const loaded = await Promise.all(arr.map(async f => {
      const id = "pdf_" + Date.now() + "_" + Math.random().toString(36).slice(2);
      return { id, name: f.name, arrayBuffer: await readAsArrayBuffer(f) };
    }));
    setExtraPdfs(p => [...p, ...loaded]);
    setSections(p => [...p, ...loaded.map(f => ({ id: f.id, label: f.name, icon: "📎", color: "#C04B00", desc: "Extra PDF", isPdf: true, pdfData: f.arrayBuffer }))]);
  }, []);

  const removeExtraPdf = (id) => {
    setExtraPdfs(p => p.filter(f => f.id !== id));
    setSections(p => p.filter(s => s.id !== id));
  };

  // Drag and drop
  const onDragStart = i => setDragIdx(i);
  const onDragOver = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const onDrop = i => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...sections]; const [moved] = next.splice(dragIdx, 1); next.splice(i, 0, moved);
    setSections(next); setDragIdx(null); setDragOverIdx(null);
  };

  const generatePDF = useCallback(async () => {
    setGenerating(true); setDone(false); setGenStatus("Loading libraries...");
    try {
      await loadLibs();
      const { jsPDF } = window.jspdf;
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;

      const doc = new jsPDF({ unit: "mm", format: "letter" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const M = 18; const CW = W - M * 2;

      const sectionPageMap = {};
      let firstPage = true;

      for (const sec of sections) {
        if (sec.isPdf) continue;

        if (sec.id === "cover") {
          setGenStatus("Building cover page...");
          if (!firstPage) doc.addPage(); firstPage = false;
          sectionPageMap["cover"] = doc.internal.getCurrentPageInfo().pageNumber;

          // Full dark background
          doc.setFillColor(89, 83, 85);
          doc.rect(0, 0, W, H, "F");

          // Subtle geometric lines - clean placement
          doc.setDrawColor(160, 156, 150); doc.setLineWidth(0.12);
          doc.rect(M - 8, 110, 62, 55);
          doc.rect(M + 6, 122, 42, 38);
          doc.rect(W - M - 65, H - 130, 58, 50);
          doc.rect(W - M - 50, H - 118, 38, 34);

          // Slim header band with logo — 24mm tall
          const hdrH = 24;
          doc.setFillColor(89, 83, 85);
          doc.rect(0, 0, W, hdrH, "F");
          // Header bottom border
          doc.setDrawColor(160, 156, 150); doc.setLineWidth(0.25);
          doc.line(0, hdrH, W, hdrH);

          // Logo in header
          try {
              const useLogo = logo || ROSELLE_LOGO;
              const fmt = useLogo.startsWith("data:image/png") ? "PNG" : "JPEG";
              const lH = hdrH - 6;
              const lW = lH * 1.75;
              doc.addImage(useLogo, fmt, 8, 3, lW, lH);
            } catch (e) { console.warn("Logo error", e); }

          // Content starts below header
          const startY = hdrH + 22;

          // Report label
          doc.setFont("helvetica", "normal"); doc.setFontSize(7.5); doc.setTextColor(136, 135, 128);
          doc.text("RESERVE REVIEW & ADVISORY REPORT", W / 2, startY, { align: "center" });

          // Main title
          doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.setTextColor(241, 239, 232);
          doc.text("PCNA & Capital Reserve Advisory", W / 2, startY + 14, { align: "center" });

          // Short divider
          doc.setDrawColor(136, 135, 128); doc.setLineWidth(0.3);
          doc.line(W/2 - 16, startY + 20, W/2 + 16, startY + 20);

          // Subtitle
          doc.setFont("helvetica", "normal"); doc.setFontSize(8.5); doc.setTextColor(180, 178, 169);
          doc.text("Property Condition Needs Assessment", W / 2, startY + 28, { align: "center" });
          doc.text("Replacement Reserve Schedule", W / 2, startY + 35, { align: "center" });

          // Property card box
          const cardY = startY + 46;
          const cardH = 38;
          doc.setDrawColor(160, 156, 150); doc.setLineWidth(0.2);
          doc.setFillColor(0, 0, 0, 0.1);
          doc.roundedRect(M, cardY, CW, cardH, 1, 1, "S");

          let ry = cardY + 9;
          [["PROPERTY", info.propertyName || "—", true], ["LOCATION", info.address || "—", false], ["DATE", info.date, false]].forEach(([k, v, bold]) => {
            doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(136, 135, 128);
            doc.text(k, M + 6, ry);
            doc.setFont("helvetica", bold ? "bold" : "normal");
            doc.setFontSize(bold ? 10.5 : 9.5);
            doc.setTextColor(bold ? 241 : 210, bold ? 239 : 207, bold ? 232 : 205);
            const lines = doc.splitTextToSize(v, CW - 36);
            doc.text(lines, M + 30, ry);
            ry += 11;
          });

          // Footer divider
          const ftY = H - 26;
          doc.setDrawColor(160, 156, 150); doc.setLineWidth(0.2);
          doc.line(0, ftY, W, ftY);

          // Prepared by footer
          doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(136, 135, 128);
          doc.text("Prepared by", W / 2, ftY + 7, { align: "center" });
          doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(241, 239, 232);
          doc.text("Roselle Creative Solutions", W / 2, ftY + 15, { align: "center" });
          doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(136, 135, 128);
          doc.text("Akiva Jurkanski  ·  akiva@rosellecs.com  ·  732.606.3529", W / 2, ftY + 22, { align: "center" });

        } else if (sec.id === "notes") {
          const vg = genNotes.filter(n => n.trim());
          const ve = eqNotes.filter(n => n.trim());
          if (!vg.length && !ve.length) continue;
          setGenStatus("Building notes page...");
          doc.addPage();
          sectionPageMap["notes"] = doc.internal.getCurrentPageInfo().pageNumber;

          doc.setFillColor(85, 82, 80); doc.rect(0, 0, W, 22, "F");
          doc.setTextColor(241, 239, 232); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
          doc.text("Clarifications & Property Notes", W / 2, 14, { align: "center" });

          let y = 32;
          // Render notes: bold lines = section headers, others = bullet points
          const allNotes = [...vg, ...ve];
          allNotes.forEach(line => {
            if (y > H - 28) { doc.addPage(); y = 28;
              doc.setFillColor(89, 83, 85); doc.rect(0, 0, W, 22, "F");
              doc.setTextColor(241, 239, 232); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
              doc.text("Clarifications & Property Notes", W / 2, 14, { align: "center" });
            }
            const isBold = line.__bold;
            if (isBold) {
              y += 4;
              doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(44, 44, 42);
              doc.text(line.text || line, M, y); y += 2;
              doc.setDrawColor(89, 83, 85); doc.setLineWidth(0.4);
              doc.line(M, y, W - M, y); y += 7;
            } else {
              doc.setFont("helvetica", "normal"); doc.setFontSize(9.5); doc.setTextColor(60, 58, 56);
              const txt = (line.text || line).replace(/^[•\-\s]+/, "");
              const lines = doc.splitTextToSize("• " + txt, CW);
              doc.text(lines, M, y); y += lines.length * 5.5 + 3;
            }
          });

        } else if (sec.id === "excel") {
          if (!excelData?.rows?.length) continue;
          setGenStatus("Building spreadsheet...");
          doc.addPage();
          sectionPageMap["excel"] = doc.internal.getCurrentPageInfo().pageNumber;

          doc.setFillColor(89, 83, 85); doc.rect(0, 0, W, 22, "F");
          doc.setTextColor(241, 239, 232); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
          doc.text("Replacement Reserve Schedule", W / 2, 14, { align: "center" });

          const dataRows = excelData.rows.slice(1);
          const sectionHeaderIndices = new Set();
          dataRows.forEach((row, i) => {
            const nonEmpty = row.filter(c => c !== null && c !== undefined && c !== "");
            if (nonEmpty.length === 1 && row[0]) sectionHeaderIndices.add(i);
          });
          doc.autoTable({
            head: [excelData.rows[0].map(c => String(c ?? ""))],
            body: dataRows.map(row => row.map(c => { if (c === "" || c == null) return ""; if (typeof c === "number") return c.toLocaleString("en-US"); return String(c); })),
            startY: 26, margin: { left: M, right: M, bottom: 20 },
            styles: { fontSize: 6.5, cellPadding: 1.8, overflow: "linebreak", textColor: [44, 44, 42] },
            headStyles: { fillColor: [89, 83, 85], textColor: [241, 239, 232], fontStyle: "bold", fontSize: 7 },
            alternateRowStyles: { fillColor: [245, 244, 240] },
            didParseCell: (data) => {
              if (data.section === "body" && sectionHeaderIndices.has(data.row.index)) {
                data.cell.styles.fillColor = [89, 83, 85];
                data.cell.styles.textColor = [241, 239, 232];
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.fontSize = 7.5;
              }
            },
          });

        } else if (sec.id === "photos") {
          if (!pptSlides.length) continue;
          setGenStatus(`Building photo pages... (${pptSlides.length} photos)`);
          const hdrH2 = 16;
          const slotH = (H - hdrH2 - 6) / 2;
          const imgH = slotH - 2;

          for (let i = 0; i < pptSlides.length; i++) {
            if (i % 2 === 0) {
              doc.addPage();
              if (i === 0) sectionPageMap["photos"] = doc.internal.getCurrentPageInfo().pageNumber;
              doc.setFillColor(89, 83, 85); doc.rect(0, 0, W, hdrH2, "F");
              doc.setTextColor(241, 239, 232); doc.setFont("helvetica", "bold"); doc.setFontSize(9);
              doc.text("Supporting Documentation — Product Photos", W / 2, 10.5, { align: "center" });
            }
            const slot = i % 2;
            const yImg = hdrH2 + 2 + slot * slotH;
            try {
              const fmt = pptSlides[i].dataUrl.startsWith("data:image/png") ? "PNG" : "JPEG";
              doc.addImage(pptSlides[i].dataUrl, fmt, M, yImg, CW, imgH, undefined, "FAST");
            } catch {
              doc.setFillColor(220, 218, 210); doc.rect(M, yImg, CW, imgH, "F");
              doc.setTextColor(136, 135, 128); doc.setFontSize(9);
              doc.text(pptSlides[i].name, M + 4, yImg + 10);
            }
          }
        }
      }

      // Assemble with pdf-lib
      setGenStatus("Merging all sections...");
      const mainBytes = doc.output("arraybuffer");
      const finalDoc = await PDFDocument.create();
      const mainDoc = await PDFDocument.load(mainBytes);

      // Build jsPDF page ranges
      const jsPDFPageCount = mainDoc.getPageCount();
      const sectionIds = Object.keys(sectionPageMap);
      const pageRanges = {};
      sectionIds.forEach((id, i) => {
        const start = sectionPageMap[id] - 1;
        const nextId = sectionIds[i + 1];
        const end = nextId ? sectionPageMap[nextId] - 2 : jsPDFPageCount - 1;
        pageRanges[id] = { start, end };
      });

      const coverPageIndices = new Set();
      let totalAdded = 0;

      for (const sec of sections) {
        if (sec.isPdf) {
          const extDoc = await PDFDocument.load(sec.pdfData);
          const count = extDoc.getPageCount();
          const copied = await finalDoc.copyPages(extDoc, [...Array(count).keys()]);
          copied.forEach(p => { finalDoc.addPage(p); totalAdded++; });
        } else {
          const range = pageRanges[sec.id];
          if (!range) continue;
          const idxs = [];
          for (let i = range.start; i <= range.end; i++) idxs.push(i);
          if (!idxs.length) continue;
          const copied = await finalDoc.copyPages(mainDoc, idxs);
          copied.forEach((p, pi) => {
            finalDoc.addPage(p);
            if (sec.id === "cover" && pi === 0) coverPageIndices.add(totalAdded);
            totalAdded++;
          });
        }
      }

      // Footers & page numbers
      setGenStatus("Adding footers and page numbers...");
      const font = await finalDoc.embedFont(StandardFonts.Helvetica);
      const pages = finalDoc.getPages();
      const nonCoverTotal = pages.length - coverPageIndices.size;
      let pageNum = 0;

      pages.forEach((page, i) => {
        if (coverPageIndices.has(i)) return;
        pageNum++;
        const { width, height } = page.getSize();
        const mPt = M * 2.835;
        const lineY = 24;
        page.drawLine({ start: { x: mPt, y: lineY }, end: { x: width - mPt, y: lineY }, thickness: 0.4, color: rgb(0.53, 0.53, 0.5) });
        const leftText = "Roselle Creative Solutions";
        const rightText = `Page ${pageNum} of ${nonCoverTotal}`;
        const fs = 7;
        page.drawText(leftText, { x: width / 2 - font.widthOfTextAtSize(leftText, fs) / 2, y: 14, size: fs, font, color: rgb(0.53, 0.53, 0.5) });
        page.drawText(rightText, { x: width - mPt - font.widthOfTextAtSize(rightText, fs), y: 14, size: fs, font, color: rgb(0.53, 0.53, 0.5) });
      });

      setGenStatus("Saving...");
      const bytes = await finalDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `${(info.propertyName || "Report").replace(/\s+/g, "_")}_PCNA_Report.pdf`;
      a.click(); URL.revokeObjectURL(url);
      setDone(true); setGenStatus("Done!");
    } catch (err) {
      console.error(err); alert("Error: " + err.message);
    } finally { setGenerating(false); }
  }, [sections, info, genNotes, eqNotes, excelData, pptSlides, logo]);

  const canNext = () => step === 0 ? info.propertyName.trim() && info.address.trim() : true;
  const secDesc = (sec) => {
    if (sec.id === "notes") return `${genNotes.filter(n=>n.trim()).length} general · ${eqNotes.filter(n=>n.trim()).length} equipment notes`;
    if (sec.id === "excel") return excelData ? `${excelFileName} · ${excelData.rows.length} rows` : "Not uploaded";
    if (sec.id === "photos") return pptSlides.length ? `${pptSlides.length} photos · ${Math.ceil(pptSlides.length/2)} pages` : "Not uploaded";
    return sec.desc || "";
  };

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 900, margin: "0 auto" }}>
      <style>{`.rb{transition:opacity .15s,transform .1s}.rb:hover:not(:disabled){opacity:.87}.rb:active:not(:disabled){transform:scale(.98)}`}</style>

      {/* Top bar */}
      <div style={{ background: "#2C2C2A", padding: "13px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", borderRadius: "12px 12px 0 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {logo
            ? <img src={logo} style={{ height: 28, borderRadius: 4, objectFit: "contain" }} alt="logo" />
            : <div style={{ width: 30, height: 30, background: "#444441", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}><span style={{ color: "#F1EFE8", fontSize: 11, fontWeight: 600 }}>RC</span></div>}
          <span style={{ color: "#F1EFE8", fontSize: 14, fontWeight: 500 }}>Roselle Creative Solutions — Report Builder</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ height: 4, width: 110, background: "#444441", borderRadius: 2, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${((step + 1) / STEPS.length) * 100}%`, background: "#B5D4F4", borderRadius: 2, transition: "width 0.3s" }} />
          </div>
          <span style={{ color: "#888780", fontSize: 12 }}>{step + 1} / {STEPS.length}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", border: "0.5px solid var(--color-border-tertiary)", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden", minHeight: 580 }}>

        {/* Sidebar */}
        <div style={{ background: "var(--color-background-secondary)", borderRight: "0.5px solid var(--color-border-tertiary)", padding: "22px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-tertiary)", margin: "0 0 14px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Steps</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {STEPS.map((s, i) => {
              const active = i === step, done2 = i < step;
              return (
                <div key={i} onClick={() => done2 && setStep(i)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: active ? "var(--color-background-info)" : "transparent", cursor: done2 ? "pointer" : "default" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: active ? "#185FA5" : done2 ? "#3B6D11" : "var(--color-background-tertiary)", border: active || done2 ? "none" : "0.5px solid var(--color-border-secondary)" }}>
                    {done2 ? <svg width="11" height="11" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#C0DD97" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
                      : <span style={{ color: active ? "#E6F1FB" : "var(--color-text-tertiary)", fontSize: 10, fontWeight: 600 }}>{i + 1}</span>}
                  </div>
                  <span style={{ fontSize: 13, fontWeight: active ? 500 : 400, color: active ? "var(--color-text-info)" : done2 ? "var(--color-text-success)" : "var(--color-text-secondary)" }}>{s}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 28, paddingTop: 20, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
            <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-tertiary)", margin: "0 0 10px", letterSpacing: "0.08em", textTransform: "uppercase" }}>This report</p>
            {[["Property", info.propertyName || "—"], ["Excel", excelData ? "✓ uploaded" : "not yet"], ["PowerPoint", pptSlides.length ? `${pptSlides.length} slides` : "not yet"], ["Notes doc", notesDocName || "none"], ["Extra PDFs", extraPdfs.length ? `${extraPdfs.length} file(s)` : "none"]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{k}: </span>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ padding: "28px 32px", background: "var(--color-background-primary)", overflowY: "auto", maxHeight: "90vh" }}>

          {/* STEP 0 */}
          {step === 0 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Property information</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>These details appear on the cover page</p>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Logo</label>
                {logo
                  ? <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "#2C2C2A" }}>
                      <img src={logo} style={{ height: 30, objectFit: "contain" }} alt="logo" />
                      <button onClick={() => logoRef.current.click()} style={{ fontSize: 12, color: "#B4B2A9", background: "none", border: "none", cursor: "pointer" }}>Change logo</button>
                    </div>
                  : <DropZone icon="🖼️" text="Click to upload logo (PNG recommended)" onClick={() => logoRef.current.click()} />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div><label style={lbl}>Property name *</label><input style={inp} placeholder="e.g. Yardley Rehabilitation Center" value={info.propertyName} onChange={e => setInfo(p => ({ ...p, propertyName: e.target.value }))} /></div>
                <div><label style={lbl}>Report date</label><input style={inp} value={info.date} onChange={e => setInfo(p => ({ ...p, date: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={lbl}>Property address *</label><input style={inp} placeholder="e.g. 1480 Oxford Valley Rd, Yardley, PA 19067" value={info.address} onChange={e => setInfo(p => ({ ...p, address: e.target.value }))} /></div>
              <div>
                <label style={lbl}>Prepared by</label>
                <input style={{ ...inp, background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)" }} value="Roselle Creative Solutions" readOnly />
              </div>
            </div>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Notes & clarifications</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>Upload your Word document — the text will be pulled in automatically. Skip this step if you have no notes.</p>
              <input ref={wordRef} type="file" accept=".docx,.doc" style={{ display: "none" }} onChange={e => handleWordDoc(e.target.files[0])} />
              {!notesDocName
                ? <DropZone icon="📝" text="Click to upload your Word notes document (.docx)" onClick={() => wordRef.current.click()} onDrop={files => handleWordDoc(files[0])} />
                : <div style={{ padding: "16px 20px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, background: "var(--color-background-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>📝</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{notesDocName}</p>
                          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>{genNotes.length} lines extracted</p>
                        </div>
                      </div>
                      <button onClick={() => { setNotesDocName(""); setNotesDocContent(""); setGenNotes([]); wordRef.current.value = ""; }} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                    </div>
                    <div style={{ maxHeight: 200, overflowY: "auto", padding: "10px 14px", background: "var(--color-background-primary)", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)" }}>
                      {genNotes.slice(0, 20).map((line, i) => (
                        <p key={i} style={{ fontSize: 12, color: line.__bold ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: line.__bold ? 600 : 400, margin: "0 0 6px", lineHeight: 1.5 }}>{line.__bold ? "" : "• "}{line.text || line}</p>
                      ))}
                      {genNotes.length > 20 && <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>…and {genNotes.length - 20} more lines</p>}
                    </div>
                  </div>}
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Upload files</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>Upload your Excel spreadsheet and PowerPoint photo deck</p>
              <input ref={excelRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: "none" }} onChange={handleExcel} />
              <input ref={pptRef} type="file" accept=".pptx" style={{ display: "none" }} onChange={handlePPT} />

              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Excel file — pricing spreadsheet</label>
                {!excelData
                  ? <DropZone icon="📊" text="Click to upload .xlsx / .xls / .csv" onClick={() => excelRef.current.click()} onDrop={files => { const f = files[0]; if (f) { const e = { target: { files } }; handleExcel(e); } }} />
                  : <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, background: "var(--color-background-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>📊</span>
                        <div><p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{excelFileName}</p><p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>{excelData.rows.length} rows</p></div>
                      </div>
                      <div style={{ display: "flex", gap: 10 }}>
                        <button onClick={() => excelRef.current.click()} style={{ fontSize: 12, color: "var(--color-text-info)", background: "none", border: "none", cursor: "pointer" }}>Replace</button>
                        <button onClick={() => { setExcelData(null); setExcelFileName(""); setSections(p => p.map(s => s.id === "excel" ? { ...s, desc: "Not uploaded yet" } : s)); }} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                      </div>
                    </div>}
              </div>

              <div>
                <label style={lbl}>PowerPoint — product photos (images extracted automatically)</label>
                {!pptSlides.length
                  ? <DropZone icon="🖼️" text="Click to upload .pptx — your screenshots are pulled out automatically" onClick={() => pptRef.current.click()} onDrop={files => { const f = files[0]; if (f) handlePPT({ target: { files } }); }} />
                  : <div style={{ padding: "12px 16px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, background: "var(--color-background-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>🖼️</span>
                          <div><p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{pptFileName}</p><p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>{pptSlides.length} photos extracted · {Math.ceil(pptSlides.length / 2)} pages · 2 per page</p></div>
                        </div>
                        <button onClick={() => { setPptSlides([]); setPptFileName(""); setSections(p => p.map(s => s.id === "photos" ? { ...s, desc: "Not uploaded yet" } : s)); pptRef.current.value = ""; }} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                      </div>
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2, maxHeight: 60 }}>
                        {pptSlides.slice(0, 10).map((s, i) => <img key={i} src={s.dataUrl} alt="" style={{ height: 50, width: 70, objectFit: "cover", borderRadius: 4, flexShrink: 0, border: "0.5px solid var(--color-border-tertiary)" }} />)}
                        {pptSlides.length > 10 && <div style={{ height: 50, width: 70, borderRadius: 4, background: "var(--color-background-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>+{pptSlides.length - 10}</span></div>}
                      </div>
                    </div>}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Extra pages</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>Upload contractor quotes, letters, inspection docs — their original formatting is kept. Skip this step if none.</p>
              <input ref={pdfRef} type="file" accept=".pdf" multiple style={{ display: "none" }} onChange={e => handleExtraPdfs(e.target.files)} />
              <button className="rb" onClick={() => pdfRef.current.click()} style={{ padding: "10px 20px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, cursor: "pointer", marginBottom: 16, color: "var(--color-text-primary)" }}>+ Upload PDF(s)</button>
              {!extraPdfs.length
                ? <DropZone icon="📎" text="Or click above to add PDFs — you can skip this step" onClick={() => pdfRef.current.click()} onDrop={files => handleExtraPdfs(files)} />
                : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {extraPdfs.map((f, i) => (
                      <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, background: "var(--color-background-secondary)" }}>
                        <span style={{ fontSize: 20 }}>📎</span>
                        <p style={{ fontSize: 13, fontWeight: 500, margin: 0, flex: 1 }}>{f.name}</p>
                        <button onClick={() => removeExtraPdf(f.id)} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                      </div>
                    ))}
                  </div>}
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Arrange page order</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>Drag sections into the order you want them in the final PDF</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {sections.map((sec, i) => (
                  <div key={sec.id} draggable onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e, i)} onDrop={() => onDrop(i)} onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: dragOverIdx === i ? "2px solid #185FA5" : "0.5px solid var(--color-border-tertiary)", borderRadius: 10, background: dragIdx === i ? "var(--color-background-info)" : "var(--color-background-primary)", opacity: dragIdx === i ? 0.65 : 1, cursor: "grab", transform: dragOverIdx === i && dragIdx !== i ? "scale(1.01)" : "scale(1)", transition: "border-color 0.1s, transform 0.1s" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: 3, flexShrink: 0, opacity: 0.4 }}>
                      {[0,1,2].map(j => <div key={j} style={{ width: 14, height: 1.5, background: "var(--color-text-secondary)", borderRadius: 1 }} />)}
                    </div>
                    <div style={{ width: 30, height: 30, background: sec.color, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <span style={{ fontSize: 14 }}>{sec.icon}</span>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{sec.label}</p>
                      <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>{secDesc(sec)}</p>
                    </div>
                    <span style={{ fontSize: 11, color: "var(--color-text-tertiary)", background: "var(--color-background-secondary)", padding: "3px 8px", borderRadius: 4, flexShrink: 0 }}>{i + 1}</span>
                  </div>
                ))}
              </div>
              <div style={{ padding: "12px 16px", background: "var(--color-background-secondary)", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "var(--color-text-secondary)", fontStyle: "italic" }}>Roselle Creative Solutions · Page 1 of —</span>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>Footer preview · no footer on cover</span>
              </div>
            </div>
          )}

          {/* STEP 5 */}
          {step === 5 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Generate report</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 20px" }}>Everything is ready — click to build your PDF</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {[["Property", info.propertyName || "—"], ["Address", info.address || "—"], ["Date", info.date], ["Notes doc", notesDocName || "Not uploaded"], ["Excel", excelData ? `${excelData.rows.length} rows · ${excelFileName}` : "Not uploaded"], ["Photos", pptSlides.length ? `${pptSlides.length} photos` : "Not uploaded"], ["Extra PDFs", extraPdfs.length ? `${extraPdfs.length} file(s)` : "None"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "9px 14px", background: "var(--color-background-secondary)", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", gap: 12 }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)", flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                  </div>
                ))}
              </div>
              {done && <div style={{ padding: "12px 16px", background: "var(--color-background-success)", border: "0.5px solid var(--color-border-success)", borderRadius: 8, marginBottom: 14, fontSize: 13, color: "var(--color-text-success)", display: "flex", alignItems: "center", gap: 8 }}>
                <svg width="14" height="14" viewBox="0 0 14 14"><circle cx="7" cy="7" r="7" fill="#3B6D11"/><polyline points="3.5,7 6,9.5 10.5,4.5" stroke="#C0DD97" strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                PDF downloaded! Check your downloads folder.
              </div>}
              {generating && genStatus && <div style={{ padding: "10px 14px", background: "var(--color-background-info)", border: "0.5px solid var(--color-border-info)", borderRadius: 8, marginBottom: 14, fontSize: 13, color: "var(--color-text-info)" }}>⏳ {genStatus}</div>}
              <button className="rb" onClick={generatePDF} disabled={generating} style={{ width: "100%", padding: "15px", background: generating ? "#888780" : "#2C2C2A", color: "#F1EFE8", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: generating ? "not-allowed" : "pointer" }}>
                {generating ? "Generating PDF…" : "⬇ Generate & Download PDF"}
              </button>
              {generating && <p style={{ fontSize: 12, color: "var(--color-text-tertiary)", textAlign: "center", marginTop: 10 }}>This may take a minute for large photo sets…</p>}
            </div>
          )}

          {/* Nav */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
            <button className="rb" onClick={() => setStep(s => s - 1)} disabled={step === 0} style={{ padding: "9px 20px", background: "none", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, cursor: step === 0 ? "not-allowed" : "pointer", color: step === 0 ? "var(--color-text-tertiary)" : "var(--color-text-primary)", opacity: step === 0 ? 0.4 : 1 }}>← Back</button>
            {step < STEPS.length - 1 && <button className="rb" onClick={() => { setStep(s => s + 1); setDone(false); }} disabled={!canNext()} style={{ padding: "9px 22px", background: canNext() ? "#2C2C2A" : "var(--color-background-secondary)", color: canNext() ? "#F1EFE8" : "var(--color-text-tertiary)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: canNext() ? "pointer" : "not-allowed" }}>Next — {STEPS[step + 1]} →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
