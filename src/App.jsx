import { useState, useRef, useCallback } from "react";

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
  const [genNotes, setGenNotes] = useState([""]);
  const [eqNotes, setEqNotes] = useState([""]);
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
  const pptRef = useRef(); const pdfRef = useRef();

  const handleLogo = useCallback(async (e) => {
    const file = e.target.files[0]; if (!file) return;
    setLogo(await readAsDataURL(file));
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

          // Subtle geometric lines
          doc.setDrawColor(180, 178, 169); doc.setLineWidth(0.12);
          [[M - 8, H*0.42, 68, 64], [M + 8, H*0.44+8, 46, 46], [W-M-72, H*0.72, 72, 56], [W-M-54, H*0.74+8, 50, 38]].forEach(([x, y, w, h]) => {
            doc.rect(x, y, w, h);
          });

          // Slim header band with logo — 24mm tall
          const hdrH = 24;
          doc.setFillColor(89, 83, 85);
          doc.rect(0, 0, W, hdrH, "F");
          // Header bottom border
          doc.setDrawColor(160, 156, 150); doc.setLineWidth(0.25);
          doc.line(0, hdrH, W, hdrH);

          // Logo in header
          if (logo) {
            try {
              const fmt = logo.startsWith("data:image/png") ? "PNG" : "JPEG";
              // Logo aspect ratio 1050/600 = 1.75 — fit inside header height with padding
              const lH = hdrH - 6; // 18mm tall
              const lW = lH * 1.75;
              doc.addImage(logo, fmt, 8, 3, lW, lH);
            } catch (e) { console.warn("Logo error", e); }
          }

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
          const writeNotes = (title, items) => {
            doc.setFont("helvetica", "bold"); doc.setFontSize(12); doc.setTextColor(44, 44, 42);
            doc.text(title, M, y); y += 3;
            doc.setDrawColor(136, 135, 128); doc.line(M, y, W - M, y); y += 8;
            doc.setFont("helvetica", "normal"); doc.setFontSize(10); doc.setTextColor(60, 58, 56);
            items.forEach(n => {
              const lines = doc.splitTextToSize("• " + n, CW);
              if (y + lines.length * 5 + 4 > H - 22) { doc.addPage(); y = 22; }
              doc.text(lines, M, y); y += lines.length * 5 + 4;
            });
            y += 8;
          };
          if (vg.length) writeNotes("Notes", vg);
          if (ve.length) writeNotes("Equipment Clarification / Replacement Reserves", ve);

        } else if (sec.id === "excel") {
          if (!excelData?.rows?.length) continue;
          setGenStatus("Building spreadsheet...");
          doc.addPage();
          sectionPageMap["excel"] = doc.internal.getCurrentPageInfo().pageNumber;

          doc.setFillColor(85, 82, 80); doc.rect(0, 0, W, 22, "F");
          doc.setTextColor(241, 239, 232); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
          doc.text("Replacement Reserve Schedule", W / 2, 14, { align: "center" });

          doc.autoTable({
            head: [excelData.rows[0].map(c => String(c ?? ""))],
            body: excelData.rows.slice(1).map(row => row.map(c => { if (c === "" || c == null) return ""; if (typeof c === "number") return c.toLocaleString("en-US"); return String(c); })),
            startY: 26, margin: { left: M, right: M, bottom: 20 },
            styles: { fontSize: 6.5, cellPadding: 1.5, overflow: "linebreak", textColor: [44, 44, 42] },
            headStyles: { fillColor: [85, 82, 80], textColor: [241, 239, 232], fontStyle: "bold", fontSize: 7 },
            alternateRowStyles: { fillColor: [245, 244, 240] },
          });

        } else if (sec.id === "photos") {
          if (!pptSlides.length) continue;
          setGenStatus(`Building photo pages... (${pptSlides.length} photos)`);
          const hdrH = 22; const ftH = 20; const avail = H - hdrH - ftH - 12;
          const slotH = avail / 2; const imgH = slotH - 6;

          for (let i = 0; i < pptSlides.length; i++) {
            if (i % 2 === 0) {
              doc.addPage();
              if (i === 0) sectionPageMap["photos"] = doc.internal.getCurrentPageInfo().pageNumber;
              doc.setFillColor(85, 82, 80); doc.rect(0, 0, W, hdrH, "F");
              doc.setTextColor(241, 239, 232); doc.setFont("helvetica", "bold"); doc.setFontSize(12);
              doc.text("Supporting Documentation — Product Photos", W / 2, 14, { align: "center" });
            }
            const slot = i % 2;
            const yImg = hdrH + 4 + slot * slotH;
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
            {[["Property", info.propertyName || "—"], ["Excel", excelData ? "✓ uploaded" : "not yet"], ["PowerPoint", pptSlides.length ? `${pptSlides.length} slides` : "not yet"], ["Extra PDFs", extraPdfs.length ? `${extraPdfs.length} file(s)` : "none"]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{k}: </span>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main */}
        <div style={{ padding: "28px 32px", background: "var(--color-background-primary)" }}>

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
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>Leave blank to skip this section entirely</p>
              <div style={{ marginBottom: 24 }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 10px" }}>General notes</p>
                {genNotes.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input style={inp} placeholder={`Note ${i + 1}…`} value={n} onChange={e => setGenNotes(p => p.map((v, j) => j === i ? e.target.value : v))} />
                    {genNotes.length > 1 && <button onClick={() => setGenNotes(p => p.filter((_, j) => j !== i))} style={{ padding: "0 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-secondary)" }}>×</button>}
                  </div>
                ))}
                <button onClick={() => setGenNotes(p => [...p, ""])} style={{ fontSize: 13, color: "var(--color-text-info)", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>+ Add note</button>
              </div>
              <div style={{ paddingTop: 20, borderTop: "0.5px solid var(--color-border-tertiary)" }}>
                <p style={{ fontSize: 13, fontWeight: 500, margin: "0 0 10px" }}>Equipment clarifications / replacement reserves</p>
                {eqNotes.map((n, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                    <input style={inp} placeholder={`Equipment note ${i + 1}…`} value={n} onChange={e => setEqNotes(p => p.map((v, j) => j === i ? e.target.value : v))} />
                    {eqNotes.length > 1 && <button onClick={() => setEqNotes(p => p.filter((_, j) => j !== i))} style={{ padding: "0 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "none", cursor: "pointer", fontSize: 18, color: "var(--color-text-secondary)" }}>×</button>}
                  </div>
                ))}
                <button onClick={() => setEqNotes(p => [...p, ""])} style={{ fontSize: 13, color: "var(--color-text-info)", background: "none", border: "none", cursor: "pointer", padding: "4px 0" }}>+ Add equipment note</button>
              </div>
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
                      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
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
                {[["Property", info.propertyName || "—"], ["Address", info.address || "—"], ["Date", info.date], ["General notes", genNotes.filter(n=>n.trim()).length + " item(s)"], ["Equipment notes", eqNotes.filter(n=>n.trim()).length + " item(s)"], ["Excel", excelData ? `${excelData.rows.length} rows · ${excelFileName}` : "Not uploaded"], ["Photos", pptSlides.length ? `${pptSlides.length} photos` : "Not uploaded"], ["Extra PDFs", extraPdfs.length ? `${extraPdfs.length} file(s)` : "None"]].map(([k, v]) => (
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
