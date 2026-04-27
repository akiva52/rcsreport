import { useState, useRef, useCallback } from "react";
import React from "react";

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

const readAsDataURL = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(f); });
const readAsArrayBuffer = f => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(f); });
const loadScript = src => new Promise((res, rej) => {
  if (document.querySelector(`script[src="${src}"]`)) { res(); return; }
  const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = rej;
  document.head.appendChild(s);
});

const STEPS = ["Property info", "Notes", "Upload files", "Extra PDFs", "Arrange order", "Generate PDF"];
const DOLLAR_COLS = new Set([2, 3, 4, 5, 6]);

const inp = { width: "100%", padding: "9px 12px", border: "0.5px solid var(--color-border-secondary)", borderRadius: "var(--border-radius-md)", fontSize: "14px", color: "var(--color-text-primary)", background: "var(--color-background-primary)", boxSizing: "border-box", fontFamily: "var(--font-sans)", outline: "none" };
const lbl = { display: "block", fontSize: "12px", fontWeight: "500", color: "var(--color-text-secondary)", marginBottom: "6px" };

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

function App() {
  const [step, setStep] = useState(0);
  const [logo, setLogo] = useState(null);
  const [info, setInfo] = useState({
    propertyName: "", address: "",
    date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
  });
  const [notesDocName, setNotesDocName] = useState("");
  const [noteLines, setNoteLines] = useState([]);
  const [excelData, setExcelData] = useState(null);
  const [excelFileName, setExcelFileName] = useState("");
  const [pptSlides, setPptSlides] = useState([]);
  const [pptFileName, setPptFileName] = useState("");
  const [extraPdfs, setExtraPdfs] = useState([]);
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

  const logoRef     = useRef();
  const excelRef    = useRef();
  const pptRef      = useRef();
  const pdfRef      = useRef();
  const wordRef     = useRef();
  const slidesRef   = useRef([]);
  const pdfBytesRef = useRef({});

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
      dom.body.querySelectorAll("p, h1, h2, h3, h4, h5, h6, li").forEach(node => {
        const text = node.textContent?.trim();
        if (!text) return;
        const isHeading = /^H[1-6]$/.test(node.nodeName);
        const strongLen = [...node.querySelectorAll("strong")].reduce((s, el) => s + el.textContent.length, 0);
        const allBold = isHeading || (strongLen >= text.length * 0.85);
        const segments = [];
        node.childNodes.forEach(child => {
          const t = child.textContent; if (!t) return;
          const bold = child.nodeName === "STRONG";
          if (segments.length && segments[segments.length-1].bold === bold) {
            segments[segments.length-1].text += t;
          } else segments.push({ text: t, bold });
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
      const sectionRows = new Set();
      rawRows.slice(1).forEach((row, i) => {
        const ne = row.filter(c => c !== null && c !== undefined && c !== "");
        if (ne.length === 1 && row[0]) sectionRows.add(i);
      });
      const rows = rawRows.map(row => row.map((c, ci) => {
        if (c === null || c === undefined || c === "") return "";
        if (typeof c === "number") {
          if (DOLLAR_COLS.has(ci)) return `$${c.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
          return Number.isInteger(c) ? c.toLocaleString("en-US") : c.toLocaleString("en-US");
        }
        return String(c);
      }));
      setExcelData({ rows, sectionRows });
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
      const slideXmls = Object.keys(zip.files)
        .filter(f => f.match(/^ppt\/slides\/slide[0-9]+\.xml$/))
        .sort((a, b) => parseInt(a.match(/(\d+)/)?.[1]||0) - parseInt(b.match(/(\d+)/)?.[1]||0));
      const slides = [];
      for (const slideXml of slideXmls) {
        const relsPath = slideXml.replace("slides/slide", "slides/_rels/slide").replace(".xml", ".xml.rels");
        if (!zip.files[relsPath]) continue;
        const relsXml = await zip.files[relsPath].async("string");
        const match = relsXml.match(/Target="\.\.\/media\/([^"]+\.(png|jpg|jpeg))"/i);
        if (!match) continue;
        const imgPath = `ppt/media/${match[1]}`;
        if (!zip.files[imgPath]) continue;
        const blob = await zip.files[imgPath].async("blob");
        slides.push({ name: match[1], dataUrl: await readAsDataURL(blob) });
      }
      if (slides.length === 0) {
        const media = Object.keys(zip.files)
          .filter(f => f.startsWith("ppt/media/") && /\.(png|jpg|jpeg)$/i.test(f))
          .sort((a,b) => parseInt(a.match(/(\d+)/)?.[1]||0) - parseInt(b.match(/(\d+)/)?.[1]||0));
        for (const p of media) {
          const blob = await zip.files[p].async("blob");
          slides.push({ name: p.split("/").pop(), dataUrl: await readAsDataURL(blob) });
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

  const onDragStart = i => setDragIdx(i);
  const onDragOver = (e, i) => { e.preventDefault(); setDragOverIdx(i); };
  const onDrop = i => {
    if (dragIdx === null || dragIdx === i) { setDragIdx(null); setDragOverIdx(null); return; }
    const next = [...sections]; const [m] = next.splice(dragIdx, 1); next.splice(i, 0, m);
    setSections(next); setDragIdx(null); setDragOverIdx(null);
  };

  const generatePDF = useCallback(async () => {
    setGenerating(true); setDone(false); setGenStatus("Loading libraries...");
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.5.31/jspdf.plugin.autotable.min.js");
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js");

      const { jsPDF } = window.jspdf;
      const { PDFDocument, rgb, StandardFonts } = window.PDFLib;
      const doc = new jsPDF({ unit: "mm", format: "letter" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const M = 14; const CW = W - M * 2;
      const DARK = [89, 83, 85];
      const WHITE = [241, 239, 232];

      const sectionPageMap = {};
      let firstPage = true;
      const coverPageNums = new Set();

      for (const sec of sections) {
        if (sec.isPdf) continue;

        // ── COVER ──
        if (sec.id === "cover") {
          setGenStatus("Building cover page...");
          if (!firstPage) doc.addPage(); firstPage = false;
          sectionPageMap["cover"] = doc.internal.getCurrentPageInfo().pageNumber;

          doc.setFillColor(...DARK); doc.rect(0, 0, W, H, "F");

          // Full-width logo header
          if (logo) {
            await new Promise(res => {
              const img = new Image();
              img.onload = () => {
                try {
                  const fmt = logo.startsWith("data:image/png") ? "PNG" : "JPEG";
                  const logoH = W * (img.height / img.width);
                  const capH = Math.min(logoH, 55);
                  const capW = capH * (img.width / img.height);
                  doc.addImage(logo, fmt, 0, 0, W, capH);
                  doc.setDrawColor(160,158,154); doc.setLineWidth(0.25);
                  doc.line(0, capH, W, capH);
                } catch(e) { console.warn(e); }
                res();
              };
              img.onerror = res;
              img.src = logo;
            });
          }

          const startY = logo ? 65 : 30;

          doc.setFont("helvetica", "normal"); doc.setFontSize(7.5);
          doc.setTextColor(200, 198, 192);
          doc.text("RESERVE REVIEW & ADVISORY REPORT", W/2, startY, { align: "center" });

          doc.setFont("helvetica", "bold"); doc.setFontSize(22);
          doc.setTextColor(...WHITE);
          doc.text("PCNA & Capital Reserve Advisory", W/2, startY+13, { align: "center" });

          doc.setDrawColor(160,158,154); doc.setLineWidth(0.3);
          doc.line(W/2-18, startY+18, W/2+18, startY+18);

          doc.setFont("helvetica", "normal"); doc.setFontSize(9);
          doc.setTextColor(215, 213, 207);
          doc.text("Property Condition Needs Assessment", W/2, startY+26, { align: "center" });
          doc.text("Replacement Reserve Schedule", W/2, startY+33, { align: "center" });

          const cY = startY + 44;
          doc.setDrawColor(160,158,154); doc.setLineWidth(0.2);
          doc.roundedRect(M, cY, CW, 40, 1, 1, "S");
          let ry = cY+10;
          [["PROPERTY", info.propertyName||"—", true],["LOCATION", info.address||"—", false],["DATE", info.date, false]].forEach(([k,v,bold]) => {
            doc.setFont("helvetica","normal"); doc.setFontSize(7); doc.setTextColor(200,198,192);
            doc.text(k, M+5, ry);
            doc.setFont("helvetica", bold?"bold":"normal"); doc.setFontSize(bold?10:9);
            doc.setTextColor(bold?241:220, bold?239:218, bold?232:214);
            doc.text(doc.splitTextToSize(v, CW-34), M+30, ry);
            ry += 12;
          });

          const fY = H-28;
          doc.setDrawColor(140,136,132); doc.setLineWidth(0.2);
          doc.line(M, fY, W-M, fY);
          doc.setFont("helvetica","italic"); doc.setFontSize(8); doc.setTextColor(200,198,192);
          doc.text("Prepared by", W/2, fY+8, { align: "center" });
          doc.setFont("helvetica","bold"); doc.setFontSize(13); doc.setTextColor(...WHITE);
          doc.text("Roselle Creative Solutions", W/2, fY+16, { align: "center" });
          doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(200,198,192);
          doc.text("Akiva Jurkanski  ·  akiva@rosellecs.com  ·  732.606.3529", W/2, fY+23, { align: "center" });

        // ── NOTES ──
        } else if (sec.id === "notes") {
          if (!noteLines.length) continue;
          setGenStatus("Building notes page...");
          doc.addPage();
          sectionPageMap["notes"] = doc.internal.getCurrentPageInfo().pageNumber;

          const drawHeader = () => {
            doc.setFillColor(...DARK); doc.rect(0, 0, W, 20, "F");
            doc.setTextColor(...WHITE); doc.setFont("helvetica","bold"); doc.setFontSize(11);
            doc.text("Clarifications & Property Notes", W/2, 13, { align: "center" });
          };
          drawHeader();
          let y = 28;

          noteLines.forEach(line => {
            const { text, allBold, segments } = line;
            if (y > H-22) { doc.addPage(); drawHeader(); y = 28; }

            if (allBold) {
              y += 2;
              doc.setFont("helvetica","bold"); doc.setFontSize(11); doc.setTextColor(20,20,20);
              doc.text(text, M, y); y += 2;
              doc.setDrawColor(...DARK); doc.setLineWidth(0.45);
              doc.line(M, y, W-M, y); y += 7;
            } else {
              const hasPartial = segments && segments.some(s => s.bold && s.text.trim());
              if (!hasPartial) {
                doc.setFont("helvetica","normal"); doc.setFontSize(9.5); doc.setTextColor(40,40,40);
                const clean = text.replace(/^[•\-\s]+/, "");
                const wrapped = doc.splitTextToSize("• "+clean, CW);
                if (y + wrapped.length*5.5 > H-22) { doc.addPage(); drawHeader(); y = 28; }
                doc.text(wrapped, M, y);
                y += wrapped.length*5.5 + 3;
              } else {
                doc.setFontSize(9.5); doc.setTextColor(40,40,40);
                doc.setFont("helvetica","normal");
                const bulletW = doc.getTextWidth("• ");
                doc.text("• ", M, y);
                let x = M + bulletW;
                segments.forEach(seg => {
                  if (!seg.text) return;
                  doc.setFont("helvetica", seg.bold?"bold":"normal");
                  seg.text.split(/(\s+)/).forEach(token => {
                    if (!token) return;
                    const tw = doc.getTextWidth(token);
                    if (x+tw > W-M && token.trim()) { y += 5.5; x = M+bulletW; if (y>H-22){doc.addPage();drawHeader();y=28;x=M+bulletW;} }
                    doc.text(token, x, y); x += tw;
                  });
                });
                y += 7;
              }
            }
          });

        // ── EXCEL ──
        } else if (sec.id === "excel") {
          if (!excelData) continue;
          setGenStatus("Building spreadsheet...");
          doc.addPage();
          sectionPageMap["excel"] = doc.internal.getCurrentPageInfo().pageNumber;
          doc.setFillColor(...DARK); doc.rect(0, 0, W, 20, "F");
          doc.setTextColor(...WHITE); doc.setFont("helvetica","bold"); doc.setFontSize(11);
          doc.text("Major Movable/Replacement Reserve Schedule", W/2, 13, { align: "center" });

          const { rows, sectionRows } = excelData;
          doc.autoTable({
            head: [rows[0]],
            body: rows.slice(1),
            startY: 22,
            margin: { left: M, right: M, bottom: 18 },
            styles: { fontSize: 8, cellPadding: { top:3, bottom:3, left:3, right:3 }, overflow: "linebreak", textColor: [30,30,30], lineColor: [210,208,200], lineWidth: 0.15 },
            headStyles: { fillColor: DARK, textColor: WHITE, fontStyle: "bold", fontSize: 8.5, cellPadding:{ top:4, bottom:4, left:3, right:3 } },
            alternateRowStyles: { fillColor: [247,246,243] },
            columnStyles: {
              0: { cellWidth: 52 },
              1: { halign: "right", cellWidth: 14 },
              2: { halign: "right", cellWidth: 22 },
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
                data.cell.styles.halign = "left";
              }
            },
          });

        // ── PHOTOS ──
        } else if (sec.id === "photos") {
          if (!slidesRef.current.length) continue;
          setGenStatus("Building photo pages...");
          const HDR = 14;
          const SLOT_H = (H - HDR - 8) / 2;
          const MAX_H = SLOT_H - 2;
          const GAP = 4;

          const compress = dataUrl => new Promise(res => {
            const img = new Image();
            img.onload = () => {
              const scale = Math.min(1, 1400/img.width, 900/img.height);
              const c = document.createElement("canvas");
              c.width = Math.round(img.width*scale); c.height = Math.round(img.height*scale);
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
              doc.setFillColor(...DARK); doc.rect(0, 0, W, HDR, "F");
              doc.setTextColor(...WHITE); doc.setFont("helvetica","bold"); doc.setFontSize(8);
              doc.text("Supporting Documentation — Product Photos", W/2, 9.5, { align: "center" });
            }
            const slot = i % 2;
            const slotY = HDR + 2 + slot*(SLOT_H+GAP);
            try {
              const { url, w: iW, h: iH } = await compress(slidesRef.current[i].dataUrl);
              const ratio = iW/iH;
              let dW = CW, dH = dW/ratio;
              if (dH > MAX_H) { dH = MAX_H; dW = dH*ratio; }
              doc.addImage(url, "JPEG", M+(CW-dW)/2, slotY+(MAX_H-dH)/2, dW, dH);
            } catch(e) {
              doc.setFillColor(220,218,210); doc.rect(M, slotY, CW, MAX_H, "F");
            }
          }
        }
      }

      // ── MERGE ──
      setGenStatus("Merging all sections...");
      const mainBytes = doc.output("arraybuffer");
      const finalDoc = await PDFDocument.create();
      const mainPDF = await PDFDocument.load(mainBytes);
      const totalMain = mainPDF.getPageCount();

      const secIds = Object.keys(sectionPageMap);
      const ranges = {};
      secIds.forEach((id, i) => {
        const start = sectionPageMap[id]-1;
        const next = secIds[i+1];
        ranges[id] = { start, end: next ? sectionPageMap[next]-2 : totalMain-1 };
      });

      let totalAdded = 0;
      for (const sec of sections) {
        if (sec.isPdf) {
          const bytes = pdfBytesRef.current[sec.id]; if (!bytes) continue;
          const ext = await PDFDocument.load(bytes);
          const copied = await finalDoc.copyPages(ext, [...Array(ext.getPageCount()).keys()]);
          copied.forEach(p => finalDoc.addPage(p));
          totalAdded += ext.getPageCount();
        } else {
          const range = ranges[sec.id]; if (!range) continue;
          const idxs = []; for (let i=range.start; i<=range.end; i++) idxs.push(i);
          if (!idxs.length) continue;
          const copied = await finalDoc.copyPages(mainPDF, idxs);
          copied.forEach((p, pi) => {
            finalDoc.addPage(p);
            if (sec.id === "cover" && pi === 0) coverPageNums.add(totalAdded);
            totalAdded++;
          });
        }
      }

      // ── FOOTERS ──
      setGenStatus("Adding footers...");
      const font = await finalDoc.embedFont(StandardFonts.Helvetica);
      const pages = finalDoc.getPages();
      const nonCover = pages.length - coverPageNums.size;
      let pageNum = 0;
      pages.forEach((pg, i) => {
        if (coverPageNums.has(i)) return;
        pageNum++;
        const { width, height } = pg.getSize();
        const mPt = M*2.835;
        pg.drawLine({ start:{x:mPt,y:22}, end:{x:width-mPt,y:22}, thickness:0.3, color:rgb(0.75,0.74,0.72) });
        const fs = 7;
        const pn = `Page ${pageNum} of ${nonCover}`;
        const co = "Roselle Creative Solutions";
        pg.drawText(pn, { x:mPt, y:14, size:fs, font, color:rgb(0.55,0.54,0.52) });
        pg.drawText(co, { x:width-mPt-font.widthOfTextAtSize(co,fs), y:14, size:fs, font, color:rgb(0.55,0.54,0.52) });
      });

      setGenStatus("Saving...");
      const bytes = await finalDoc.save();
      const blob = new Blob([bytes], { type:"application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href=url; a.download=`${(info.propertyName||"Report").replace(/\s+/g,"_")}_PCNA_Report.pdf`;
      a.click(); URL.revokeObjectURL(url);
      setDone(true); setGenStatus("Done!");
    } catch(err) {
      console.error(err); alert("Error: "+err.message);
    } finally { setGenerating(false); }
  }, [sections, info, logo, noteLines, excelData, pptSlides]);

  const canNext = () => step === 0 ? info.propertyName.trim() && info.address.trim() : true;
  const secDesc = sec => {
    if (sec.id === "notes")  return notesDocName ? `${notesDocName} · ${noteLines.length} lines` : "Not uploaded";
    if (sec.id === "excel")  return excelData ? `${excelFileName} · ${excelData.rows.length} rows` : "Not uploaded";
    if (sec.id === "photos") return pptSlides.length ? `${pptSlides.length} photos` : "Not uploaded";
    return sec.desc || "";
  };

  return (
    <div style={{ fontFamily:"var(--font-sans)", maxWidth:900, margin:"0 auto" }}>
      <style>{`.rb{transition:opacity .15s,transform .1s}.rb:hover:not(:disabled){opacity:.87}.rb:active:not(:disabled){transform:scale(.98)}`}</style>

      <div style={{ background:"#2C2C2A", padding:"13px 24px", display:"flex", alignItems:"center", justifyContent:"space-between", borderRadius:"12px 12px 0 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          {logo ? <img src={logo} style={{ height:28, borderRadius:4, objectFit:"contain" }} alt="logo" />
            : <div style={{ width:30, height:30, background:"#444441", borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center" }}><span style={{ color:"#F1EFE8", fontSize:11, fontWeight:600 }}>RC</span></div>}
          <span style={{ color:"#F1EFE8", fontSize:14, fontWeight:500 }}>Roselle Creative Solutions — Report Builder</span>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ height:4, width:110, background:"#444441", borderRadius:2, overflow:"hidden" }}>
            <div style={{ height:"100%", width:`${((step+1)/STEPS.length)*100}%`, background:"#B5D4F4", borderRadius:2, transition:"width 0.3s" }} />
          </div>
          <span style={{ color:"#888780", fontSize:12 }}>{step+1} / {STEPS.length}</span>
        </div>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"210px 1fr", border:"0.5px solid var(--color-border-tertiary)", borderTop:"none", borderRadius:"0 0 12px 12px", overflow:"hidden", minHeight:560 }}>

        <div style={{ background:"var(--color-background-secondary)", borderRight:"0.5px solid var(--color-border-tertiary)", padding:"22px 14px" }}>
          <p style={{ fontSize:10, fontWeight:600, color:"var(--color-text-tertiary)", margin:"0 0 14px", letterSpacing:"0.08em", textTransform:"uppercase" }}>Steps</p>
          <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
            {STEPS.map((s, i) => {
              const active=i===step, done2=i<step;
              return (
                <div key={i} onClick={() => done2 && setStep(i)}
                  style={{ display:"flex", alignItems:"center", gap:10, padding:"8px 10px", borderRadius:8, background:active?"var(--color-background-info)":"transparent", cursor:done2?"pointer":"default" }}>
                  <div style={{ width:22, height:22, borderRadius:"50%", flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", background:active?"#185FA5":done2?"#3B6D11":"var(--color-background-tertiary)", border:active||done2?"none":"0.5px solid var(--color-border-secondary)" }}>
                    {done2 ? <svg width="11" height="11" viewBox="0 0 12 12"><polyline points="2,6 5,9 10,3" stroke="#C0DD97" strokeWidth="1.8" fill="none" strokeLinecap="round"/></svg>
                      : <span style={{ color:active?"#E6F1FB":"var(--color-text-tertiary)", fontSize:10, fontWeight:600 }}>{i+1}</span>}
                  </div>
                  <span style={{ fontSize:13, fontWeight:active?500:400, color:active?"var(--color-text-info)":done2?"var(--color-text-success)":"var(--color-text-secondary)" }}>{s}</span>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop:28, paddingTop:20, borderTop:"0.5px solid var(--color-border-tertiary)" }}>
            <p style={{ fontSize:10, fontWeight:600, color:"var(--color-text-tertiary)", margin:"0 0 10px", letterSpacing:"0.08em", textTransform:"uppercase" }}>This report</p>
            {[["Property", info.propertyName||"—"],["Excel", excelData?"✓":"not yet"],["PowerPoint", pptSlides.length?`${pptSlides.length} slides`:"not yet"],["Notes", notesDocName||"none"],["Extra PDFs", extraPdfs.length?`${extraPdfs.length}`:"none"]].map(([k,v]) => (
              <div key={k} style={{ marginBottom:5 }}>
                <span style={{ fontSize:11, color:"var(--color-text-tertiary)" }}>{k}: </span>
                <span style={{ fontSize:11, color:"var(--color-text-secondary)", fontWeight:500 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding:"28px 32px", background:"var(--color-background-primary)", overflowY:"auto", maxHeight:"85vh", display:"flex", flexDirection:"column" }}>

          {step === 0 && (
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:18, fontWeight:500, margin:"0 0 4px" }}>Property information</h2>
              <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:"0 0 22px" }}>These details appear on the cover page</p>
              <input ref={logoRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handleLogo} />
              <div style={{ marginBottom:18 }}>
                <label style={lbl}>Logo <span style={{ color:"#185FA5", fontWeight:400 }}>— upload each session</span></label>
                {logo
                  ? <div style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", border:"0.5px solid var(--color-border-secondary)", borderRadius:8, background:"#2C2C2A" }}>
                      <img src={logo} style={{ height:30, objectFit:"contain" }} alt="logo" />
                      <button onClick={() => logoRef.current.click()} style={{ fontSize:12, color:"#B4B2A9", background:"none", border:"none", cursor:"pointer" }}>Change</button>
                    </div>
                  : <DropZone icon="🖼️" text="Click to upload logo (PNG)" onClick={() => logoRef.current.click()} onDrop={async files => { const f=files[0]; if(f) setLogo(await readAsDataURL(f)); }} />}
              </div>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
                <div><label style={lbl}>Property name *</label><input style={inp} placeholder="e.g. Yardley Rehabilitation Center" value={info.propertyName} onChange={e => setInfo(p=>({...p, propertyName:e.target.value}))} /></div>
                <div><label style={lbl}>Report date</label><input style={inp} value={info.date} onChange={e => setInfo(p=>({...p, date:e.target.value}))} /></div>
              </div>
              <div style={{ marginBottom:16 }}><label style={lbl}>Property address *</label><input style={inp} placeholder="e.g. 1480 Oxford Valley Rd, Yardley, PA 19067" value={info.address} onChange={e => setInfo(p=>({...p, address:e.target.value}))} /></div>
              <div><label style={lbl}>Prepared by</label><input style={{ ...inp, background:"var(--color-background-secondary)", color:"var(--color-text-tertiary)" }} value="Roselle Creative Solutions" readOnly /></div>
            </div>
          )}

          {step === 1 && (
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:18, fontWeight:500, margin:"0 0 4px" }}>Notes & clarifications</h2>
              <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:"0 0 22px" }}>Upload your Word document. Skip if no notes.</p>
              <input ref={wordRef} type="file" accept=".docx,.doc" style={{ display:"none" }} onChange={e => handleWordDoc(e.target.files[0])} />
              {!notesDocName
                ? <DropZone icon="📝" text="Click to upload Word notes document (.docx)" onClick={() => wordRef.current.click()} onDrop={files => handleWordDoc(files[0])} />
                : <div style={{ padding:"16px 20px", border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, background:"var(--color-background-secondary)" }}>
                    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:12 }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:22 }}>📝</span>
                        <div>
                          <p style={{ fontSize:13, fontWeight:500, margin:0 }}>{notesDocName}</p>
                          <p style={{ fontSize:11, color:"var(--color-text-tertiary)", margin:"2px 0 0" }}>{noteLines.length} lines extracted</p>
                        </div>
                      </div>
                      <button onClick={() => { setNotesDocName(""); setNoteLines([]); wordRef.current.value=""; }} style={{ fontSize:12, color:"var(--color-text-secondary)", background:"none", border:"none", cursor:"pointer" }}>Remove</button>
                    </div>
                    <div style={{ maxHeight:200, overflowY:"auto", padding:"10px 14px", background:"var(--color-background-primary)", borderRadius:8, border:"0.5px solid var(--color-border-tertiary)" }}>
                      {noteLines.slice(0,25).map((line,i) => (
                        <p key={i} style={{ fontSize:12, color:line.allBold?"var(--color-text-primary)":"var(--color-text-secondary)", fontWeight:line.allBold?600:400, margin:"0 0 5px", lineHeight:1.5 }}>
                          {line.allBold?"":"• "}{line.text}
                        </p>
                      ))}
                      {noteLines.length>25 && <p style={{ fontSize:11, color:"var(--color-text-tertiary)", margin:0 }}>…and {noteLines.length-25} more</p>}
                    </div>
                  </div>}
            </div>
          )}

          {step === 2 && (
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:18, fontWeight:500, margin:"0 0 4px" }}>Upload files</h2>
              <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:"0 0 22px" }}>Upload your Excel spreadsheet and PowerPoint photo deck</p>
              <input ref={excelRef} type="file" accept=".xlsx,.xls,.xlsm,.csv" style={{ display:"none" }} onChange={handleExcel} />
              <input ref={pptRef} type="file" accept=".pptx" style={{ display:"none" }} onChange={handlePPT} />
              <div style={{ marginBottom:20 }}>
                <label style={lbl}>Excel file</label>
                {!excelData
                  ? <DropZone icon="📊" text="Click to upload .xlsx / .xlsm / .csv" onClick={() => excelRef.current.click()} onDrop={files => handleExcel({ target:{ files } })} />
                  : <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 16px", border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, background:"var(--color-background-secondary)" }}>
                      <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                        <span style={{ fontSize:22 }}>📊</span>
                        <div><p style={{ fontSize:13, fontWeight:500, margin:0 }}>{excelFileName}</p><p style={{ fontSize:11, color:"var(--color-text-tertiary)", margin:"2px 0 0" }}>{excelData.rows.length} rows</p></div>
                      </div>
                      <button onClick={() => { setExcelData(null); setExcelFileName(""); excelRef.current.value=""; }} style={{ fontSize:12, color:"var(--color-text-secondary)", background:"none", border:"none", cursor:"pointer" }}>Remove</button>
                    </div>}
              </div>
              <div>
                <label style={lbl}>PowerPoint — photos extracted automatically</label>
                {!pptSlides.length
                  ? <DropZone icon="🖼️" text="Click to upload .pptx" onClick={() => pptRef.current.click()} onDrop={files => handlePPT({ target:{ files } })} />
                  : <div style={{ padding:"12px 16px", border:"0.5px solid var(--color-border-tertiary)", borderRadius:10, background:"var(--color-background-secondary)" }}>
                      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                          <span style={{ fontSize:22 }}>🖼️</span>
                          <div><p style={{ fontSize:13, fontWeight:500, margin:0 }}>{pptFileName}</p><p style={{ fontSize:11, color:"var(--color-text-tertiary)", margin:"2px 0 0" }}>{pptSlides.length} photos · {Math.ceil(pptSlides.length/2)} pages</p></div>
                        </div>
                        <button onClick={() => { setPptSlides([]); setPptFileName(""); slidesRef.current=[]; pptRef.current.value=""; }} style={{ fontSize:12, color:"var(--color-text-secondary)", background:"none", border:"none", cursor:"pointer" }}>Remove</button>
                      </div>
                      <div style={{ display:"flex", gap:5, overflowX:"auto" }}>
                        {slidesRef.current.slice(0,8).map((s,i) => <img key={i} src={s.dataUrl} alt="" style={{ height:44, width:62, objectFit:"cover", borderRadius:3, flexShrink:0 }} />)}
                        {pptSlides.length>8 && <div style={{ height:44, width:62, borderRadius:3, background:"var(--color-background-tertiary)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}><span style={{ fontSize:10, color:"var(--color-text-tertiary)" }}>+{pptSlides.length-8}</span></div>}
                      </div>
                    </div>}
              </div>
            </div>
          )}

          {step === 3 && (
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:18, fontWeight:500, margin:"0 0 4px" }}>Extra pages</h2>
              <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:"0 0 22px" }}>Upload contractor quotes, letters, inspection docs. Skip if none.</p>
              <input ref={pdfRef} type="file" accept=".pdf" multiple style={{ display:"none" }} onChange={e => handleExtraPdfs(e.target.files)} />
              <button className="rb" onClick={() => pdfRef.current.click()} style={{ padding:"10px 20px", background:"var(--color-background-secondary)", border:"0.5px solid var(--color-border-secondary)", borderRadius:8, fontSize:13, cursor:"pointer", marginBottom:16, color:"var(--color-text-primary)" }}>+ Upload PDF(s)</button>
              {!extraPdfs.length
                ? <DropZone icon="📎" text="Or drag & drop PDFs here" onClick={() => pdfRef.current.click()} onDrop={files => handleExtraPdfs(files)} />
                : <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                    {extraPdfs.map(f => (
                      <div key={f.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", border:"0.5px solid var(--color-border-tertiary)", borderRadius:8, background:"var(--color-background-secondary)" }}>
                        <span style={{ fontSize:20 }}>📎</span>
                        <p style={{ fontSize:13, fontWeight:500, margin:0, flex:1 }}>{f.name}</p>
                        <button onClick={() => removeExtraPdf(f.id)} style={{ fontSize:12, color:"var(--color-text-secondary)", background:"none", border:"none", cursor:"pointer" }}>Remove</button>
                      </div>
                    ))}
                  </div>}
            </div>
          )}

          {step === 4 && (
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:18, fontWeight:500, margin:"0 0 4px" }}>Arrange page order</h2>
              <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:"0 0 22px" }}>Drag sections into the order you want in the final PDF</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {sections.map((sec,i) => (
                  <div key={sec.id} draggable
                    onDragStart={() => onDragStart(i)} onDragOver={e => onDragOver(e,i)} onDrop={() => onDrop(i)} onDragEnd={() => { setDragIdx(null); setDragOverIdx(null); }}
                    style={{ display:"flex", alignItems:"center", gap:12, padding:"12px 14px", border:dragOverIdx===i?"2px solid #185FA5":"0.5px solid var(--color-border-tertiary)", borderRadius:10, background:dragIdx===i?"var(--color-background-info)":"var(--color-background-primary)", cursor:"grab", opacity:dragIdx===i?0.6:1, transition:"border-color 0.1s" }}>
                    <div style={{ display:"flex", flexDirection:"column", gap:3, flexShrink:0, opacity:0.4 }}>
                      {[0,1,2].map(j => <div key={j} style={{ width:14, height:1.5, background:"var(--color-text-secondary)", borderRadius:1 }} />)}
                    </div>
                    <div style={{ width:30, height:30, background:sec.color, borderRadius:6, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                      <span style={{ fontSize:14 }}>{sec.icon}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <p style={{ fontSize:13, fontWeight:500, margin:0 }}>{sec.label}</p>
                      <p style={{ fontSize:11, color:"var(--color-text-tertiary)", margin:"2px 0 0" }}>{secDesc(sec)}</p>
                    </div>
                    <span style={{ fontSize:11, color:"var(--color-text-tertiary)", background:"var(--color-background-secondary)", padding:"3px 8px", borderRadius:4, flexShrink:0 }}>{i+1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 5 && (
            <div style={{ flex:1 }}>
              <h2 style={{ fontSize:18, fontWeight:500, margin:"0 0 4px" }}>Generate report</h2>
              <p style={{ fontSize:13, color:"var(--color-text-secondary)", margin:"0 0 20px" }}>Everything ready — click to build your PDF</p>
              <div style={{ display:"flex", flexDirection:"column", gap:8, marginBottom:24 }}>
                {[["Property", info.propertyName||"—"],["Address", info.address||"—"],["Date", info.date],["Notes", notesDocName||"Not uploaded"],["Excel", excelData?`${excelData.rows.length} rows`:"Not uploaded"],["Photos", pptSlides.length?`${pptSlides.length}`:"Not uploaded"],["Extra PDFs", extraPdfs.length?`${extraPdfs.length} file(s)`:"None"]].map(([k,v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"9px 14px", background:"var(--color-background-secondary)", borderRadius:8, border:"0.5px solid var(--color-border-tertiary)", gap:12 }}>
                    <span style={{ fontSize:13, color:"var(--color-text-secondary)", flexShrink:0 }}>{k}</span>
                    <span style={{ fontSize:13, fontWeight:500, textAlign:"right", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>{v}</span>
                  </div>
                ))}
              </div>
              {done && <div style={{ padding:"12px 16px", background:"var(--color-background-success)", border:"0.5px solid var(--color-border-success)", borderRadius:8, marginBottom:14, fontSize:13, color:"var(--color-text-success)" }}>✓ PDF downloaded! Check your downloads folder.</div>}
              {generating && genStatus && <div style={{ padding:"10px 14px", background:"var(--color-background-info)", border:"0.5px solid var(--color-border-info)", borderRadius:8, marginBottom:14, fontSize:13, color:"var(--color-text-info)" }}>⏳ {genStatus}</div>}
              <button className="rb" onClick={generatePDF} disabled={generating} style={{ width:"100%", padding:"15px", background:generating?"#888780":"#2C2C2A", color:"#F1EFE8", border:"none", borderRadius:10, fontSize:15, fontWeight:500, cursor:generating?"not-allowed":"pointer" }}>
                {generating ? "Generating…" : "⬇ Generate & Download PDF"}
              </button>
            </div>
          )}

          <div style={{ display:"flex", justifyContent:"space-between", marginTop:28, paddingTop:20, borderTop:"0.5px solid var(--color-border-tertiary)", flexShrink:0 }}>
            <button className="rb" onClick={() => setStep(s=>s-1)} disabled={step===0} style={{ padding:"9px 20px", background:"none", border:"0.5px solid var(--color-border-secondary)", borderRadius:8, fontSize:13, cursor:step===0?"not-allowed":"pointer", color:step===0?"var(--color-text-tertiary)":"var(--color-text-primary)", opacity:step===0?0.4:1 }}>← Back</button>
            {step < STEPS.length-1 && <button className="rb" onClick={() => { setStep(s=>s+1); setDone(false); }} disabled={!canNext()} style={{ padding:"9px 22px", background:canNext()?"#2C2C2A":"var(--color-background-secondary)", color:canNext()?"#F1EFE8":"var(--color-text-tertiary)", border:"none", borderRadius:8, fontSize:13, fontWeight:500, cursor:canNext()?"pointer":"not-allowed" }}>Next — {STEPS[step+1]} →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WrappedApp() {
  return <ErrorBoundary><App /></ErrorBoundary>;
}
