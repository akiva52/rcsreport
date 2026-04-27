import { useState, useRef, useCallback } from "react";
import React from "react";

// ── Error boundary ──────────────────────────────────────────────────────────
class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null }; }
  static getDerivedStateFromError(e) { return { err: e }; }
  render() {
    if (this.state.err) return (
      <div style={{ padding: 24, fontFamily: "monospace", background: "#fff0f0", border: "2px solid red", borderRadius: 8, margin: 16 }}>
        <h3 style={{ color: "red", margin: "0 0 8px" }}>Error — screenshot this</h3>
        <pre style={{ fontSize: 11, whiteSpace: "pre-wrap" }}>{this.state.err.toString()}</pre>
      </div>
    );
    return this.props.children;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────────────
const readAsDataURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
const readAsArrayBuffer = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(f); });
const loadScript = src => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
  const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
});

const DOLLAR_COLS = new Set([2, 3, 4, 5, 6]); // C,D,E,F,G — Cost, Total, Quote, New cost, Variance
const STEPS = ["Property info", "Notes", "Upload files", "Extra PDFs", "Arrange order", "Generate PDF"];

const inp = { width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-background-primary)", boxSizing: "border-box", fontFamily: "var(--font-sans)", outline: "none" };
const lbl = { display: "block", fontSize: "12px", fontWeight: "500", color: "var(--color-text-secondary)", marginBottom: "6px" };

// ── DropZone ─────────────────────────────────────────────────────────────────
function DropZone({ icon, text, onClick, onDrop }) {
  const [over, setOver] = useState(false);
  return (
    <div onClick={onClick}
      onDragOver={e => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); onDrop && onDrop(e.dataTransfer.files); }}
      style={{ padding: "28px", border: `1px dashed ${over ? "#185FA5" : "var(--color-border-secondary)"}`, borderRadius: 10, cursor: "pointer", textAlign: "center", background: over ? "var(--color-background-info)" : "var(--color-background-secondary)", transition: "all 0.15s" }}>
      <div style={{ fontSize: 28, marginBottom: 6 }}>{icon}</div>
      <p style={{ fontSize: 13, margin: "0 0 4px", color: "var(--color-text-secondary)" }}>{text}</p>
      <p style={{ fontSize: 11, margin: 0, color: "var(--color-text-tertiary)" }}>or drag & drop here</p>
    </div>
  );
}

// ── Main App ─────────────────────────────────────────────────────────────────
function App() {
  const [step, setStep] = useState(0);
  const [logo, setLogo] = useState(null);
  const [info, setInfo] = useState({
    propertyName: "", address: "",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  });
  const [notesDocName, setNotesDocName] = useState("");
  const [noteLines, setNoteLines] = useState([]); // [{text, allBold, segments:[{text,bold}]}]
  const [excelData, setExcelData] = useState(null);   // {rows, dollarCols, sectionRows}
  const [excelFileName, setExcelFileName] = useState("");
  const [pptSlides, setPptSlides] = useState([]);     // [{name}] — metadata only
  const [pptFileName, setPptFileName] = useState("");
  const [extraPdfs, setExtraPdfs] = useState([]);     // [{id, name}]
  const [sections, setSections] = useState([
    { id: "cover",  label: "Cover page",                  icon: "📄", color: "#3a3937" },
    { id: "notes",  label: "Clarifications & Notes",       icon: "📝", color: "#185FA5" },
    { id: "excel",  label: "Reserve Schedule (Excel)",     icon: "📊", color: "#639922" },
    { id: "photos", label: "Product Photos (PowerPoint)",  icon: "🖼️", color: "#854F0B" },
  ]);
  const [dragIdx, setDragIdx] = useState(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState("");
  const [done, setDone] = useState(false);

  // Binary data lives in refs — never in React state
  const logoRef       = useRef();
  const excelRef      = useRef();
  const pptRef        = useRef();
  const pdfRef        = useRef();
  const wordRef       = useRef();
  const slidesRef     = useRef([]); // [{dataUrl, name}]
  const pdfBytesRef   = useRef({}); // id → ArrayBuffer

  // ── File handlers ─────────────────────────────────────────────────────────
  const handleLogo = useCallback(async e => {
    const f = e.target.files[0]; if (!f) return;
    setLogo(await readAsDataURL(f));
  }, []);

  const handleWordDoc = useCallback(async file => {
    if (!file) return;
    setNotesDocName(file.name);
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js");
      const ab = await readAsArrayBuffer(file);
      const result = await window.mammoth.convertToHtml({ arrayBuffer: ab });
      const dom = new DOMParser().parseFromString(result.value, "text/html");
      const lines = [];
      dom.body.querySelectorAll("p,h1,h2,h3,h4,h5").forEach(node => {
        const text = node.textContent?.trim();
        if (!text) return;
        const strongs = [...node.querySelectorAll("strong")];
        const boldLen = strongs.reduce((s, el) => s + el.textContent.length, 0);
        const allBold = boldLen >= text.replace(/\s+/g, "").length * 0.85;
        const segments = [];
        node.childNodes.forEach(child => {
          const t = child.textContent;
          if (!t) return;
          const bold = child.nodeName === "STRONG" || child.parentNode?.nodeName === "STRONG";
          if (segments.length && segments[segments.length - 1].bold === bold) {
            segments[segments.length - 1].text += t;
          } else {
            segments.push({ text: t, bold });
          }
        });
        lines.push({ text, allBold, segments });
      });
      setNoteLines(lines);
      setSections(p => p.map(s => s.id === "notes" ? { ...s, desc: `${file.name} · ${lines.length} lines` } : s));
    } catch (err) { alert("Could not read Word doc: " + err.message); }
  }, []);

  const handleExcel = useCallback(async e => {
    const file = e.target.files[0]; if (!file) return;
    setExcelFileName(file.name);
    try {
      const XLSX = await import("https://cdn.sheetjs.com/xlsx-0.20.1/package/xlsx.mjs");
      const ab = await readAsArrayBuffer(file);
      const wb = XLSX.read(ab);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rawRows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

      // Detect dollar-formatted columns from actual cell formats
      const dollarCols = new Set();
      for (const key of Object.keys(ws)) {
        if (key.startsWith("!")) continue;
        const cell = ws[key];
        if (cell?.z && cell.z.includes("$")) {
          const col = key.replace(/[0-9]/g, "");
          const colIdx = col.split("").reduce((n, c) => n * 26 + c.charCodeAt(0) - 64, 0) - 1;
          dollarCols.add(colIdx);
        }
      }

      // Detect section header rows
      const sectionRows = new Set();
      rawRows.slice(1).forEach((row, i) => {
        const nonEmpty = row.filter(c => c !== null && c !== undefined && c !== "");
        if (nonEmpty.length === 1 && row[0]) sectionRows.add(i);
      });

      // Format cells
      const rows = rawRows.map((row, ri) => row.map((c, ci) => {
        if (c === null || c === undefined || c === "") return "";
        if (typeof c === "number") {
          if (dollarCols.has(ci)) return `$${c.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          return c.toLocaleString("en-US");
        }
        return String(c);
      }));

      setExcelData({ rows, dollarCols, sectionRows });
      setSections(p => p.map(s => s.id === "excel" ? { ...s, desc: `${file.name} · ${rows.length} rows` } : s));
    } catch (err) { alert("Could not read Excel: " + err.message); }
  }, []);

  const handlePPT = useCallback(async e => {
    const file = e.target.files[0]; if (!file) return;
    setPptFileName(file.name);
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js");
      const ab = await readAsArrayBuffer(file);
      const zip = await window.JSZip.loadAsync(ab);
      // Get slide XML files to determine correct order
      const slideXmls = Object.keys(zip.files)
        .filter(f => f.match(/^ppt\/slides\/slide[0-9]+\.xml$/))
        .sort((a, b) => {
          const na = parseInt(a.match(/slide([0-9]+)/)?.[1] || 0);
          const nb = parseInt(b.match(/slide([0-9]+)/)?.[1] || 0);
          return na - nb;
        });

      // For each slide XML, find its image
      const slides = [];
      for (const slideXml of slideXmls) {
        const slideNum = slideXml.match(/slide([0-9]+)/)?.[1];
        // Look for the corresponding image in media
        const mediaFiles = Object.keys(zip.files)
          .filter(f => f.startsWith("ppt/media/") && /\.(png|jpg|jpeg)$/i.test(f))
          .sort();

        // Try to find image by slide relationship
        const relsPath = slideXml.replace("slides/slide", "slides/_rels/slide").replace(".xml", ".xml.rels");
        let imageFile = null;
        if (zip.files[relsPath]) {
          const relsXml = await zip.files[relsPath].async("string");
          const match = relsXml.match(/Target="\.\.\/media\/([^"]+)"/);
          if (match) imageFile = `ppt/media/${match[1]}`;
        }
        if (!imageFile) continue;
        if (!zip.files[imageFile]) continue;
        const blob = await zip.files[imageFile].async("blob");
        const dataUrl = await readAsDataURL(blob);
        slides.push({ name: imageFile.split("/").pop(), dataUrl });
      }

      // Fallback: if relationship parsing got nothing, just use all media in order
      if (slides.length === 0) {
        const mediaFiles = Object.keys(zip.files)
          .filter(f => f.startsWith("ppt/media/") && /\.(png|jpg|jpeg)$/i.test(f))
          .sort((a, b) => {
            const na = parseInt(a.match(/(\d+)/)?.[1] || 0);
            const nb = parseInt(b.match(/(\d+)/)?.[1] || 0);
            return na - nb;
          });
        for (const path of mediaFiles) {
          const blob = await zip.files[path].async("blob");
          const dataUrl = await readAsDataURL(blob);
          slides.push({ name: path.split("/").pop(), dataUrl });
        }
      }

      slidesRef.current = slides;
      setPptSlides(slides.map(s => ({ name: s.name })));
      setSections(p => p.map(s => s.id === "photos" ? { ...s, desc: `${file.name} · ${slides.length} photos` } : s));
    } catch (err) { alert("Could not read PowerPoint: " + err.message); }
  }, []);

  const handleExtraPdfs = useCallback(async files => {
    const arr = Array.from(files).filter(f => f.name.toLowerCase().endsWith(".pdf"));
    for (const f of arr) {
      const id = "pdf_" + Date.now() + "_" + Math.random().toString(36).slice(2);
      pdfBytesRef.current[id] = await readAsArrayBuffer(f);
      setExtraPdfs(p => [...p, { id, name: f.name }]);
      setSections(p => [...p, { id, label: f.name, icon: "📎", color: "#C04B00", desc: "Extra PDF", isPdf: true }]);
    }
  }, []);

  const removeExtraPdf = id => {
    delete pdfBytesRef.current[id];
    setExtraPdfs(p => p.filter(f => f.id !== id));
    setSections(p => p.filter(s => s.id !== id));
  };

  // ── Drag to reorder ───────────────────────────────────────────────────────
  const onDragStart = i => setDragIdx(i);
  const onDragOver = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const onDrop = i => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...sections]; const [m] = next.splice(dragIdx, 1); next.splice(i, 0, m);
    setSections(next); setDragIdx(null); setDragOverIdx(null);
  };

  // ── PDF Generation ────────────────────────────────────────────────────────
  const generatePDF = useCallback(async () => {
    setGenerating(true); setDone(false); setGenStatus("Loading libraries...");
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js");

      const { jsPDF } = window.jspdf;
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const doc = new jsPDF({ unit: "mm", format: "letter" });
      const W = doc.internal.pageSize.getWidth();   // 215.9mm
      const H = doc.internal.pageSize.getHeight();  // 279.4mm
      const M = 14; const CW = W - M * 2;

      const DARK = [89, 83, 85];
      const WHITE = [241, 239, 232];
      const LGRAY = [200, 198, 192];

      const darkHeader = (title, fontSize = 11) => {
        doc.setFillColor(...DARK); doc.rect(0, 0, W, 20, "F");
        doc.setTextColor(...WHITE); doc.setFont("helvetica", "bold"); doc.setFontSize(fontSize);
        doc.text(title, W / 2, 13, { align: "center" });
        doc.setTextColor(0, 0, 0);
      };

      const sectionPageMap = {};
      let firstPage = true;

      for (const sec of sections) {
        if (sec.isPdf) continue;

        // ── COVER PAGE ──────────────────────────────────────────────────────
        if (sec.id === "cover") {
          setGenStatus("Building cover page...");
          if (!firstPage) doc.addPage(); firstPage = false;
          sectionPageMap["cover"] = doc.internal.getCurrentPageInfo().pageNumber;

          // Dark background
          doc.setFillColor(...DARK); doc.rect(0, 0, W, H, "F");

          // Header band — 22mm tall
          const HDR = 22;
          doc.setFillColor(...DARK); doc.rect(0, 0, W, HDR, "F");
          doc.setDrawColor(...LGRAY); doc.setLineWidth(0.3);
          doc.line(0, HDR, W, HDR);

          // Logo
          if (logo) {
            try {
              const fmt = logo.startsWith("data:image/png") ? "PNG" : "JPEG";
              const lH = HDR - 5;
              const lW = lH * (1050 / 600); // logo aspect ratio
              doc.addImage(logo, fmt, 6, 3, lW, lH);
            } catch (e) { console.warn("logo err", e); }
          }

          // Title area
          const tY = HDR + 20;
          doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
          doc.setTextColor(...LGRAY);
          doc.text("RESERVE REVIEW & ADVISORY REPORT", W / 2, tY, { align: "center" });

          doc.setFont("helvetica", "bold"); doc.setFontSize(22);
          doc.setTextColor(...WHITE);
          doc.text("PCNA & Capital Reserve Advisory", W / 2, tY + 13, { align: "center" });

          doc.setDrawColor(...LGRAY); doc.setLineWidth(0.3);
          doc.line(W / 2 - 18, tY + 18, W / 2 + 18, tY + 18);

          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          doc.setTextColor(215, 213, 207);
          doc.text("Property Condition Needs Assessment", W / 2, tY + 26, { align: "center" });
          doc.text("Replacement Reserve Schedule", W / 2, tY + 33, { align: "center" });

          // Property info card
          const cY = tY + 44;
          doc.setDrawColor(160, 158, 154); doc.setLineWidth(0.2);
          doc.roundedRect(M, cY, CW, 40, 1, 1, "S");

          const rows2 = [["PROPERTY", info.propertyName || "—", true], ["LOCATION", info.address || "—", false], ["DATE", info.date, false]];
          let ry = cY + 10;
          rows2.forEach(([k, v, bold]) => {
            doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(...LGRAY);
            doc.text(k, M + 5, ry);
            doc.setFont("helvetica", bold ? "bold" : "normal");
            doc.setFontSize(bold ? 10 : 9);
            doc.setTextColor(bold ? 241 : 220, bold ? 239 : 218, bold ? 232 : 214);
            doc.text(doc.splitTextToSize(v, CW - 34), M + 30, ry);
            ry += 12;
          });

          // Footer
          const fY = H - 28;
          doc.setDrawColor(140, 136, 132); doc.setLineWidth(0.2);
          doc.line(M, fY, W - M, fY);
          doc.setFont("helvetica", "italic"); doc.setFontSize(8); doc.setTextColor(...LGRAY);
          doc.text("Prepared by", W / 2, fY + 8, { align: "center" });
          doc.setFont("helvetica", "bold"); doc.setFontSize(13); doc.setTextColor(...WHITE);
          doc.text("Roselle Creative Solutions", W / 2, fY + 16, { align: "center" });
          doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...LGRAY);
          doc.text("Akiva Jurkanski  ·  akiva@rosellecs.com  ·  732.606.3529", W / 2, fY + 23, { align: "center" });

        // ── NOTES PAGE ──────────────────────────────────────────────────────
        } else if (sec.id === "notes") {
          if (!noteLines.length) continue;
          setGenStatus("Building notes page...");
          doc.addPage();
          sectionPageMap["notes"] = doc.internal.getCurrentPageInfo().pageNumber;
          darkHeader("Clarifications & Property Notes");

          let y = 28;
          const newNotesPage = () => {
            doc.addPage(); y = 28; darkHeader("Clarifications & Property Notes");
          };

          noteLines.forEach(line => {
            if (y > H - 22) newNotesPage();
            const { text, allBold, segments } = line;

            if (allBold) {
              // Section header — bold + underline
              y += 3;
              doc.setFont("helvetica", "bold"); doc.setFontSize(11); doc.setTextColor(25, 25, 25);
              doc.text(text, M, y); y += 2;
              doc.setDrawColor(...DARK); doc.setLineWidth(0.4);
              doc.line(M, y, W - M, y); y += 7;
            } else {
              // Bullet point — may have partial bold
              const hasPartialBold = segments && segments.some(s => s.bold && s.text.trim());
              doc.setFontSize(9.5); doc.setTextColor(45, 45, 45);

              if (!hasPartialBold) {
                // Simple bullet
                doc.setFont("helvetica", "normal");
                const clean = text.replace(/^[•\-\s]+/, "");
                const wrapped = doc.splitTextToSize("• " + clean, CW);
                if (y + wrapped.length * 5.5 > H - 22) newNotesPage();
                doc.text(wrapped, M, y);
                y += wrapped.length * 5.5 + 3;
              } else {
                // Inline bold — render segment by segment
                doc.setFont("helvetica", "normal");
                doc.text("• ", M, y);
                let x = M + doc.getTextWidth("• ");
                const lineH = 5.5;
                segments.forEach(seg => {
                  if (!seg.text) return;
                  doc.setFont("helvetica", seg.bold ? "bold" : "normal");
                  // Word wrap within segment
                  seg.text.split(/(\s+)/).forEach(token => {
                    if (!token) return;
                    const tw = doc.getTextWidth(token);
                    if (x + tw > W - M && token.trim()) {
                      y += lineH; x = M + doc.getTextWidth("  ");
                      if (y > H - 22) { newNotesPage(); x = M + doc.getTextWidth("  "); }
                    }
                    doc.text(token, x, y); x += tw;
                  });
                });
                y += lineH + 3;
              }
            }
          });

        // ── EXCEL PAGE ──────────────────────────────────────────────────────
        } else if (sec.id === "excel") {
          if (!excelData) continue;
          setGenStatus("Building spreadsheet...");
          doc.addPage();
          sectionPageMap["excel"] = doc.internal.getCurrentPageInfo().pageNumber;
          darkHeader("Replacement Reserve Schedule");

          const { rows, sectionRows } = excelData;
          const head = [rows[0]];
          const body = rows.slice(1);

          doc.autoTable({
            head, body,
            startY: 22,
            margin: { left: M, right: M, bottom: 18 },
            tableWidth: CW,
            styles: {
              fontSize: 8.5,
              cellPadding: { top: 3, bottom: 3, left: 4, right: 4 },
              overflow: "linebreak",
              textColor: [30, 30, 30],
              lineColor: [210, 208, 200],
              lineWidth: 0.15,
            },
            headStyles: {
              fillColor: DARK,
              textColor: WHITE,
              fontStyle: "bold",
              fontSize: 9,
              cellPadding: { top: 4, bottom: 4, left: 4, right: 4 },
            },
            alternateRowStyles: { fillColor: [247, 246, 243] },
            columnStyles: {
              0: { cellWidth: 54 },
              1: { halign: "right", cellWidth: 16 },
              2: { halign: "right", cellWidth: 24 },
              3: { halign: "right", cellWidth: 20 },
              4: { halign: "right", cellWidth: 18 },
              5: { halign: "right", cellWidth: 22 },
              6: { halign: "right", cellWidth: 22 },
              7: { cellWidth: "auto" },
            },
            didParseCell: data => {
              if (data.section === "body" && sectionRows.has(data.row.index)) {
                data.cell.styles.fillColor = DARK;
                data.cell.styles.textColor = WHITE;
                data.cell.styles.fontStyle = "bold";
                data.cell.styles.fontSize = 9;
                data.cell.styles.halign = "left";
              }
            },
          });

        // ── PHOTO PAGES ──────────────────────────────────────────────────────
        } else if (sec.id === "photos") {
          if (!slidesRef.current.length) continue;
          setGenStatus(`Building photo pages...`);

          const HDR2 = 14;
          const SLOT_H = (H - HDR2 - 8) / 2;
          const MAX_W = CW;
          const MAX_H = SLOT_H - 3;
          const GAP = 2;

          // Image compressor
          const compress = dataUrl => new Promise(res => {
            const img = new Image();
            img.onload = () => {
              const scale = Math.min(1, 1400 / img.width, 1000 / img.height);
              const c = document.createElement("canvas");
              c.width = Math.round(img.width * scale);
              c.height = Math.round(img.height * scale);
              c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
              res({ url: c.toDataURL("image/jpeg", 0.72), w: img.width, h: img.height });
            };
            img.onerror = () => res({ url: dataUrl, w: 4, h: 3 });
            img.src = dataUrl;
          });

          for (let i = 0; i < slidesRef.current.length; i++) {
            if (i % 2 === 0) {
              doc.addPage();
              if (i === 0) sectionPageMap["photos"] = doc.internal.getCurrentPageInfo().pageNumber;
              doc.setFillColor(...DARK); doc.rect(0, 0, W, HDR2, "F");
              doc.setTextColor(...WHITE); doc.setFont("helvetica", "bold"); doc.setFontSize(8);
              doc.text("Supporting Documentation — Product Photos", W / 2, 9.5, { align: "center" });
            }
            const slot = i % 2;
            const slotY = HDR2 + 2 + slot * (SLOT_H + GAP);
            const slide = slidesRef.current[i];
            try {
              const { url, w: iW, h: iH } = await compress(slide.dataUrl);
              const ratio = iW / iH;
              let dW = MAX_W;
              let dH = dW / ratio;
              if (dH > MAX_H) { dH = MAX_H; dW = dH * ratio; }
              const xOff = M + (MAX_W - dW) / 2;
              const yOff = slotY + (MAX_H - dH) / 2;
              doc.addImage(url, "JPEG", xOff, yOff, dW, dH);
            } catch (e) {
              doc.setFillColor(220, 218, 210); doc.rect(M, slotY, MAX_W, MAX_H, "F");
            }
          }
        }
      }

      // ── MERGE WITH EXTRA PDFs ─────────────────────────────────────────────
      setGenStatus("Merging all sections...");
      const mainBytes = doc.output("arraybuffer");
      const finalDoc = await PDFDocument.create();
      const mainPDF = await PDFDocument.load(mainBytes);
      const totalMain = mainPDF.getPageCount();

      // Figure out page ranges per section
      const secIds = Object.keys(sectionPageMap);
      const ranges = {};
      secIds.forEach((id, i) => {
        const start = sectionPageMap[id] - 1;
        const next = secIds[i + 1];
        const end = next ? sectionPageMap[next] - 2 : totalMain - 1;
        ranges[id] = { start, end };
      });

      const coverPages = new Set();
      let totalAdded = 0;

      for (const sec of sections) {
        if (sec.isPdf) {
          const bytes = pdfBytesRef.current[sec.id];
          if (!bytes) continue;
          const extPDF = await PDFDocument.load(bytes);
          const count = extPDF.getPageCount();
          const copied = await finalDoc.copyPages(extPDF, [...Array(count).keys()]);
          copied.forEach(p => finalDoc.addPage(p));
          totalAdded += count;
        } else {
          const range = ranges[sec.id];
          if (!range) continue;
          const idxs = [];
          for (let i = range.start; i <= range.end; i++) idxs.push(i);
          if (!idxs.length) continue;
          const copied = await finalDoc.copyPages(mainPDF, idxs);
          copied.forEach((p, pi) => {
            finalDoc.addPage(p);
            if (sec.id === "cover" && pi === 0) coverPages.add(totalAdded);
            totalAdded++;
          });
        }
      }

      // ── FOOTERS ───────────────────────────────────────────────────────────
      setGenStatus("Adding footers...");
      const font = await finalDoc.embedFont(StandardFonts.Helvetica);
      const pages = finalDoc.getPages();
      const nonCover = pages.length - coverPages.size;
      let pageNum = 0;

      pages.forEach((pg, i) => {
        if (coverPages.has(i)) return;
        pageNum++;
        const { width, height } = pg.getSize();
        const mPt = M * 2.835;
        const lineY = 22;
        pg.drawLine({ start: { x: mPt, y: lineY }, end: { x: width - mPt, y: lineY }, thickness: 0.35, color: rgb(0.75, 0.74, 0.72) });
        const fs = 7;
        const pnText = `Page ${pageNum} of ${nonCover}`;
        const coText = "Roselle Creative Solutions";
        pg.drawText(pnText, { x: mPt, y: 14, size: fs, font, color: rgb(0.55, 0.54, 0.52) });
        pg.drawText(coText, { x: width - mPt - font.widthOfTextAtSize(coText, fs), y: 14, size: fs, font, color: rgb(0.55, 0.54, 0.52) });
      });

      // ── SAVE ──────────────────────────────────────────────────────────────
      setGenStatus("Saving PDF...");
      const bytes = await finalDoc.save();
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${(info.propertyName || "Report").replace(/\s+/g, "_")}_PCNA_Report.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setDone(true); setGenStatus("Done!");
    } catch (err) {
      console.error(err); alert("Error generating PDF: " + err.message);
    } finally { setGenerating(false); }
  }, [sections, info, logo, noteLines, excelData, pptSlides]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const canNext = () => step === 0 ? info.propertyName.trim() && info.address.trim() : true;
  const secDesc = sec => {
    if (sec.id === "notes")  return notesDocName ? `${notesDocName} · ${noteLines.length} lines` : "Not uploaded";
    if (sec.id === "excel")  return excelData ? `${excelFileName} · ${excelData.rows.length} rows` : "Not uploaded";
    if (sec.id === "photos") return pptSlides.length ? `${pptSlides.length} photos` : "Not uploaded";
    return sec.desc || "";
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
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
      <div style={{ display: "grid", gridTemplateColumns: "210px 1fr", border: "0.5px solid var(--color-border-tertiary)", borderTop: "none", borderRadius: "0 0 12px 12px", overflow: "hidden", minHeight: 560 }}>

        {/* Sidebar */}
        <div style={{ background: "var(--color-background-secondary)", borderRight: "0.5px solid var(--color-border-tertiary)", padding: "22px 14px" }}>
          <p style={{ fontSize: 10, fontWeight: 600, color: "var(--color-text-tertiary)", margin: "0 0 14px", letterSpacing: "0.08em", textTransform: "uppercase" }}>Steps</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {STEPS.map((s, i) => {
              const active = i === step, done2 = i < step;
              return (
                <div key={i} onClick={() => done2 && setStep(i)}
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8, background: active ? "var(--color-background-info)" : "transparent", cursor: done2 ? "pointer" : "default" }}>
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
            {[["Property", info.propertyName || "—"], ["Excel", excelData ? "✓" : "not yet"], ["PowerPoint", pptSlides.length ? `${pptSlides.length} slides` : "not yet"], ["Notes", notesDocName || "none"], ["Extra PDFs", extraPdfs.length ? `${extraPdfs.length}` : "none"]].map(([k, v]) => (
              <div key={k} style={{ marginBottom: 5 }}>
                <span style={{ fontSize: 11, color: "var(--color-text-tertiary)" }}>{k}: </span>
                <span style={{ fontSize: 11, color: "var(--color-text-secondary)", fontWeight: 500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Main content — scrollable so Next button is always visible */}
        <div style={{ padding: "28px 32px", background: "var(--color-background-primary)", overflowY: "auto", maxHeight: "85vh", display: "flex", flexDirection: "column" }}>

          {/* ── STEP 0: Property info ── */}
          {step === 0 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Property information</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>These details appear on the cover page</p>
              <input ref={logoRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handleLogo} />
              <div style={{ marginBottom: 18 }}>
                <label style={lbl}>Logo <span style={{ color: "#185FA5", fontWeight: 400 }}>— upload each session, appears on cover page</span></label>
                {logo
                  ? <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, background: "#2C2C2A" }}>
                      <img src={logo} style={{ height: 30, objectFit: "contain" }} alt="logo" />
                      <button onClick={() => logoRef.current.click()} style={{ fontSize: 12, color: "#B4B2A9", background: "none", border: "none", cursor: "pointer" }}>Change</button>
                    </div>
                  : <DropZone icon="🖼️" text="Click to upload logo (PNG)" onClick={() => logoRef.current.click()} onDrop={async files => { const f = files[0]; if (f) setLogo(await readAsDataURL(f)); }} />}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
                <div><label style={lbl}>Property name *</label><input style={inp} placeholder="e.g. Yardley Rehabilitation Center" value={info.propertyName} onChange={e => setInfo(p => ({ ...p, propertyName: e.target.value }))} /></div>
                <div><label style={lbl}>Report date</label><input style={inp} value={info.date} onChange={e => setInfo(p => ({ ...p, date: e.target.value }))} /></div>
              </div>
              <div style={{ marginBottom: 16 }}><label style={lbl}>Property address *</label><input style={inp} placeholder="e.g. 1480 Oxford Valley Rd, Yardley, PA 19067" value={info.address} onChange={e => setInfo(p => ({ ...p, address: e.target.value }))} /></div>
              <div><label style={lbl}>Prepared by</label><input style={{ ...inp, background: "var(--color-background-secondary)", color: "var(--color-text-tertiary)" }} value="Roselle Creative Solutions" readOnly /></div>
            </div>
          )}

          {/* ── STEP 1: Notes ── */}
          {step === 1 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Notes & clarifications</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>Upload your Word document. Skip this step if no notes.</p>
              <input ref={wordRef} type="file" accept=".docx,.doc" style={{ display: "none" }} onChange={e => handleWordDoc(e.target.files[0])} />
              {!notesDocName
                ? <DropZone icon="📝" text="Click to upload Word notes document (.docx)" onClick={() => wordRef.current.click()} onDrop={files => handleWordDoc(files[0])} />
                : <div style={{ padding: "16px 20px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, background: "var(--color-background-secondary)" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>📝</span>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{notesDocName}</p>
                          <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>{noteLines.length} lines extracted</p>
                        </div>
                      </div>
                      <button onClick={() => { setNotesDocName(""); setNoteLines([]); wordRef.current.value = ""; }} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                    </div>
                    <div style={{ maxHeight: 200, overflowY: "auto", padding: "10px 14px", background: "var(--color-background-primary)", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)" }}>
                      {noteLines.slice(0, 25).map((line, i) => (
                        <p key={i} style={{ fontSize: 12, color: line.allBold ? "var(--color-text-primary)" : "var(--color-text-secondary)", fontWeight: line.allBold ? 600 : 400, margin: "0 0 6px", lineHeight: 1.5 }}>
                          {line.allBold ? "" : "• "}{line.text}
                        </p>
                      ))}
                      {noteLines.length > 25 && <p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: 0 }}>…and {noteLines.length - 25} more</p>}
                    </div>
                  </div>}
            </div>
          )}

          {/* ── STEP 2: Upload files ── */}
          {step === 2 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Upload files</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>Upload your Excel spreadsheet and PowerPoint photo deck</p>
              <input ref={excelRef} type="file" accept=".xlsx,.xls,.xlsm,.csv" style={{ display: "none" }} onChange={handleExcel} />
              <input ref={pptRef} type="file" accept=".pptx" style={{ display: "none" }} onChange={handlePPT} />
              <div style={{ marginBottom: 20 }}>
                <label style={lbl}>Excel file — pricing spreadsheet</label>
                {!excelData
                  ? <DropZone icon="📊" text="Click to upload .xlsx / .xlsm / .csv" onClick={() => excelRef.current.click()} onDrop={files => handleExcel({ target: { files } })} />
                  : <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, background: "var(--color-background-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 22 }}>📊</span>
                        <div><p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{excelFileName}</p><p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>{excelData.rows.length} rows</p></div>
                      </div>
                      <button onClick={() => { setExcelData(null); setExcelFileName(""); excelRef.current.value = ""; }} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                    </div>}
              </div>
              <div>
                <label style={lbl}>PowerPoint — product photos (images extracted automatically)</label>
                {!pptSlides.length
                  ? <DropZone icon="🖼️" text="Click to upload .pptx" onClick={() => pptRef.current.click()} onDrop={files => handlePPT({ target: { files } })} />
                  : <div style={{ padding: "12px 16px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 10, background: "var(--color-background-secondary)" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontSize: 22 }}>🖼️</span>
                          <div><p style={{ fontSize: 13, fontWeight: 500, margin: 0 }}>{pptFileName}</p><p style={{ fontSize: 11, color: "var(--color-text-tertiary)", margin: "2px 0 0" }}>{pptSlides.length} photos · {Math.ceil(pptSlides.length / 2)} pages</p></div>
                        </div>
                        <button onClick={() => { setPptSlides([]); setPptFileName(""); slidesRef.current = []; pptRef.current.value = ""; }} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                      </div>
                      <div style={{ display: "flex", gap: 5, overflowX: "auto" }}>
                        {slidesRef.current.slice(0, 8).map((s, i) => <img key={i} src={s.dataUrl} alt="" style={{ height: 44, width: 62, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />)}
                        {pptSlides.length > 8 && <div style={{ height: 44, width: 62, borderRadius: 3, background: "var(--color-background-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><span style={{ fontSize: 10, color: "var(--color-text-tertiary)" }}>+{pptSlides.length - 8}</span></div>}
                      </div>
                    </div>}
              </div>
            </div>
          )}

          {/* ── STEP 3: Extra PDFs ── */}
          {step === 3 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Extra pages</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>Upload contractor quotes, letters, inspection docs. Skip if none.</p>
              <input ref={pdfRef} type="file" accept=".pdf" multiple style={{ display: "none" }} onChange={e => handleExtraPdfs(e.target.files)} />
              <button className="rb" onClick={() => pdfRef.current.click()} style={{ padding: "10px 20px", background: "var(--color-background-secondary)", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, cursor: "pointer", marginBottom: 16, color: "var(--color-text-primary)" }}>+ Upload PDF(s)</button>
              {!extraPdfs.length
                ? <DropZone icon="📎" text="Or drag & drop PDFs here" onClick={() => pdfRef.current.click()} onDrop={files => handleExtraPdfs(files)} />
                : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {extraPdfs.map((f) => (
                      <div key={f.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: "0.5px solid var(--color-border-tertiary)", borderRadius: 8, background: "var(--color-background-secondary)" }}>
                        <span style={{ fontSize: 20 }}>📎</span>
                        <p style={{ fontSize: 13, fontWeight: 500, margin: 0, flex: 1 }}>{f.name}</p>
                        <button onClick={() => removeExtraPdf(f.id)} style={{ fontSize: 12, color: "var(--color-text-secondary)", background: "none", border: "none", cursor: "pointer" }}>Remove</button>
                      </div>
                    ))}
                  </div>}
            </div>
          )}

          {/* ── STEP 4: Arrange order ── */}
          {step === 4 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Arrange page order</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 22px" }}>Drag sections into the order you want them in the final PDF</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
                {sections.map((sec, i) => (
                  <div key={sec.id} draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={e => onDragOver(e, i)}
                    onDrop={() => onDrop(i)}
                    onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", border: dragOverIdx === i ? "2px solid #185FA5" : "0.5px solid var(--color-border-tertiary)", borderRadius: 10, background: dragIdx === i ? "var(--color-background-info)" : "var(--color-background-primary)", cursor: "grab", opacity: dragIdx === i ? 0.6 : 1, transition: "border-color 0.1s" }}>
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
            </div>
          )}

          {/* ── STEP 5: Generate ── */}
          {step === 5 && (
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 18, fontWeight: 500, margin: "0 0 4px" }}>Generate report</h2>
              <p style={{ fontSize: 13, color: "var(--color-text-secondary)", margin: "0 0 20px" }}>Everything is ready — click to build your PDF</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 24 }}>
                {[["Property", info.propertyName || "—"], ["Address", info.address || "—"], ["Date", info.date], ["Notes", notesDocName || "Not uploaded"], ["Excel", excelData ? `${excelData.rows.length} rows` : "Not uploaded"], ["Photos", pptSlides.length ? `${pptSlides.length}` : "Not uploaded"], ["Extra PDFs", extraPdfs.length ? `${extraPdfs.length} file(s)` : "None"]].map(([k, v]) => (
                  <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 14px", background: "var(--color-background-secondary)", borderRadius: 8, border: "0.5px solid var(--color-border-tertiary)", gap: 12 }}>
                    <span style={{ fontSize: 13, color: "var(--color-text-secondary)", flexShrink: 0 }}>{k}</span>
                    <span style={{ fontSize: 13, fontWeight: 500, textAlign: "right", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{v}</span>
                  </div>
                ))}
              </div>
              {done && <div style={{ padding: "12px 16px", background: "var(--color-background-success)", border: "0.5px solid var(--color-border-success)", borderRadius: 8, marginBottom: 14, fontSize: 13, color: "var(--color-text-success)" }}>✓ PDF downloaded! Check your downloads folder.</div>}
              {generating && genStatus && <div style={{ padding: "10px 14px", background: "var(--color-background-info)", border: "0.5px solid var(--color-border-info)", borderRadius: 8, marginBottom: 14, fontSize: 13, color: "var(--color-text-info)" }}>⏳ {genStatus}</div>}
              <button className="rb" onClick={generatePDF} disabled={generating} style={{ width: "100%", padding: "15px", background: generating ? "#888780" : "#2C2C2A", color: "#F1EFE8", border: "none", borderRadius: 10, fontSize: 15, fontWeight: 500, cursor: generating ? "not-allowed" : "pointer" }}>
                {generating ? "Generating…" : "⬇ Generate & Download PDF"}
              </button>
            </div>
          )}

          {/* Nav buttons */}
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 28, paddingTop: 20, borderTop: "0.5px solid var(--color-border-tertiary)", flexShrink: 0 }}>
            <button className="rb" onClick={() => setStep(s => s - 1)} disabled={step === 0} style={{ padding: "9px 20px", background: "none", border: "0.5px solid var(--color-border-secondary)", borderRadius: 8, fontSize: 13, cursor: step === 0 ? "not-allowed" : "pointer", color: step === 0 ? "var(--color-text-tertiary)" : "var(--color-text-primary)", opacity: step === 0 ? 0.4 : 1 }}>← Back</button>
            {step < STEPS.length - 1 && <button className="rb" onClick={() => { setStep(s => s + 1); setDone(false); }} disabled={!canNext()} style={{ padding: "9px 22px", background: canNext() ? "#2C2C2A" : "var(--color-background-secondary)", color: canNext() ? "#F1EFE8" : "var(--color-text-tertiary)", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: canNext() ? "pointer" : "not-allowed" }}>Next — {STEPS[step + 1]} →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WrappedApp() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}
ENDOFFILE
echo "done - $(wc -l < /home/claude/App.jsx) lines"
