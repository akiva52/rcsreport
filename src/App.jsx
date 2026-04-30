import { useState, useEffect, useCallback } from "react";

const LOGO = "data:image/png;base64,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";

// ─── THEME ───────────────────────────────────────────────────────────────────
const C = {
  bg:"#07090f", panel:"#0d1119", card:"#111620", border:"#1a2235",
  border2:"#222e44", text:"#e8edf8", muted:"#4b5675", sub:"#7a8499",
  blue:"#4f8ef7", amber:"#f0a430", teal:"#3abfa8",
  green:"#4caf76", red:"#e05c5c", purple:"#a78bfa",
};
const STAGES = [
  {id:"pre",      label:"Pre-Inspection",    short:"PRE",  color:C.blue},
  {id:"walk",     label:"Walk w/ Inspector", short:"WALK", color:C.amber},
  {id:"pcna",     label:"PCNA Review",       short:"PCNA", color:"#e05c8a"},
  {id:"revised",  label:"Revised PCNA",      short:"REV",  color:C.teal},
  {id:"complete", label:"Complete",           short:"DONE", color:C.green},
];
const STAGE_IDS = STAGES.map(s=>s.id);
const VISIT_TYPES = ["Pre-Inspection","PCNA Inspection","Follow-up Visit","2nd Pre-Inspection"];
const EXPENSE_CATS = ["Mileage","Tolls","Gas","Hotel","Flight","Parking","Food"];
const CAT_COLORS = {Mileage:C.blue,Tolls:"#e05c8a",Gas:C.amber,Hotel:C.purple,Flight:C.teal,Parking:C.sub,Food:C.green};

// ─── UTILS ────────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,10);
const today = () => new Date().toISOString().split("T")[0];
const fmt = n => "$"+Number(n||0).toLocaleString("en-US",{minimumFractionDigits:2,maximumFractionDigits:2});
const fmtDate = iso => { if(!iso) return "—"; const d=new Date(iso+"T12:00:00"); return d.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"}); };
const fmtShort = iso => { if(!iso) return "—"; const d=new Date(iso+"T12:00:00"); return d.toLocaleDateString("en-US",{month:"short",day:"numeric"}); };

function calcTieredFee(saved, extraTier=false) {
  // Standard: 5% on 1st $100k, 4% on 2nd, 3% on 3rd, 2% beyond
  // Extra tier clients: same but 1% kicks in above $400k instead of staying at 2%
  const tiers = extraTier
    ? [[100000,.05],[100000,.04],[100000,.03],[100000,.02],[Infinity,.01]]
    : [[100000,.05],[100000,.04],[100000,.03],[Infinity,.02]];
  let fee=0,rem=saved;
  for(const [cap,rate] of tiers){
    if(rem<=0) break; const c=Math.min(rem,cap); fee+=c*rate; rem-=c;
  }
  return fee;
}
function genInvNum(invoices) {
  const yr=new Date().getFullYear();
  const nums=invoices.filter(i=>i.number?.startsWith(`RCS-${yr}-`)).map(i=>parseInt(i.number.split("-")[2])||0);
  return `RCS-${yr}-${String(Math.max(0,...nums)+1).padStart(3,"0")}`;
}

// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPA_URL = "https://tzgdxzajsshjmgdisza.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6Z2R4emFqc3NoaGptZ2Rpc3phIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc1NTAxNzIsImV4cCI6MjA5MzEyNjE3Mn0.RbBKgRhYG72TvofEIt0G97h2NN6o0KBdJ8FH9RaJy_4";

async function supaFetch(path, method="GET", body=null) {
  const opts = {
    method,
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": "Bearer " + SUPA_KEY,
      "Content-Type": "application/json",
      "Prefer": method==="POST"?"return=representation":"",
    },
  };
  if(body) opts.body = JSON.stringify(body);
  const res = await fetch(SUPA_URL + "/rest/v1/" + path, opts);
  if(!res.ok) { const t=await res.text(); throw new Error(t); }
  const text = await res.text();
  return text ? JSON.parse(text) : [];
}

// ─── STORAGE ──────────────────────────────────────────────────────────────────
const EMPTY = {buildings:[],visits:[],pcna:[],expenses:[],invoices:[]};
function useData() {
  const [data,setRaw] = useState(EMPTY);
  const [loaded,setLoaded] = useState(false);
  const [syncing,setSyncing] = useState(false);

  async function loadAll() {
    try {
      const [buildings,visits,pcna,expenses,invoices] = await Promise.all([
        supaFetch("rcs_buildings?order=created_at.desc"),
        supaFetch("rcs_visits?order=date.asc"),
        supaFetch("rcs_pcna"),
        supaFetch("rcs_expenses"),
        supaFetch("rcs_invoices?order=created_at.desc"),
      ]);
      setRaw({
        buildings: buildings.map(b=>{...b, customFee:b.custom_fee, akivaPct:b.akiva_pct, akivaRate:b.akiva_rate, mileRate:b.mile_rate, createdAt:b.created_at}),
        visits: visits.map(v=>{...v, buildingId:v.building_id}),
        pcna: pcna.map(p=>{...p, buildingId:p.building_id, origRR:p.orig_rr, revRR:p.rev_rr, origMM:p.orig_mm, revMM:p.rev_mm}),
        expenses: expenses.map(e=>{...e, buildingId:e.building_id}),
        invoices: invoices.map(i=>{...i, buildingId:i.building_id, visitTotal:i.visit_total, expTotal:i.exp_total, savingsFee:i.savings_fee, akivaTotal:i.akiva_total, visitCount:i.visit_count, dateSent:i.date_sent, dateReceived:i.date_received}),
      });
    } catch(e) {
      console.error("Load error:", e);
    }
    setLoaded(true);
  }

  useEffect(()=>{ loadAll(); },[]);

  const set = useCallback(fn=>{
    setRaw(prev=>{
      const next=typeof fn==="function"?fn(prev):fn;
      return next;
    });
  },[]);

  return [data,set,loaded,syncing,loadAll];
}

// ─── SHARED UI ────────────────────────────────────────────────────────────────
function Btn({children,onClick,color=C.blue,variant="solid",sm,full,style={}}){
  const p=sm?"5px 12px":"10px 18px";
  const fs=sm?12:13;
  const base={border:"none",borderRadius:8,fontFamily:"inherit",cursor:"pointer",fontWeight:700,fontSize:fs,padding:p,transition:"opacity .15s",width:full?"100%":undefined,...style};
  if(variant==="solid") return <button style={{...base,background:color,color:"#fff"}} onClick={onClick} onMouseEnter={e=>e.currentTarget.style.opacity=".82"} onMouseLeave={e=>e.currentTarget.style.opacity="1"}>{children}</button>;
  if(variant==="ghost") return <button style={{...base,background:color+"18",border:`1px solid ${color}40`,color}} onClick={onClick}>{children}</button>;
  return <button style={{...base,background:"transparent",border:`1px solid ${C.border2}`,color:C.muted}} onClick={onClick}>{children}</button>;
}
function Card({children,style={},onClick}){ return <div onClick={onClick} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:12,...style}}>{children}</div>; }
function Lbl({children}){ return <div style={{fontSize:10,color:C.muted,letterSpacing:1.2,fontWeight:700,marginBottom:4}}>{children}</div>; }
function StageBadge({stage}){ const s=STAGES.find(x=>x.id===stage)||STAGES[0]; return <span style={{fontSize:11,color:s.color,background:s.color+"20",borderRadius:6,padding:"2px 8px",fontWeight:700,whiteSpace:"nowrap"}}>{s.label}</span>; }
function ProgressBar({stage}){ const idx=STAGE_IDS.indexOf(stage); return <div style={{display:"flex",gap:3,marginTop:8}}>{STAGES.map((s,i)=><div key={s.id} style={{flex:1,height:3,borderRadius:2,background:i<=idx?s.color:C.border2}}/>)}</div>; }
function Input({value,onChange,placeholder,type="text",style={}}){
  return <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
    style={{width:"100%",background:C.card,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none",...style}}/>;
}
function Select({value,onChange,options}){
  return <select value={value} onChange={e=>onChange(e.target.value)}
    style={{width:"100%",background:C.card,border:`1px solid ${C.border2}`,borderRadius:8,padding:"10px 12px",color:C.text,fontSize:14,fontFamily:"inherit",boxSizing:"border-box",outline:"none"}}>
    {options.map(o=><option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
  </select>;
}
function Field({label,children}){ return <div style={{marginBottom:14}}><Lbl>{label}</Lbl>{children}</div>; }
function Sheet({open,onClose,title,children}){
  if(!open) return null;
  return(
    <div onClick={onClose} style={{position:"fixed",inset:0,background:"#000000bb",zIndex:300,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.panel,borderRadius:"20px 20px 0 0",width:"100%",maxHeight:"92vh",overflowY:"auto",paddingBottom:24}}>
        <div style={{padding:"12px 20px 14px",borderBottom:`1px solid ${C.border}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:C.panel,zIndex:1}}>
          <span style={{fontSize:16,fontWeight:700,color:C.text}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:C.muted,fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:"16px 20px"}}>{children}</div>
      </div>
    </div>
  );
}

// ─── BUILDING FORM ────────────────────────────────────────────────────────────
function BuildingForm({initial,onSave,onCancel}){
  const B=initial||{};
  const[name,setName]=useState(B.name||"");
  const[address,setAddress]=useState(B.address||"");
  const[client,setClient]=useState(B.client||"");
  const[rate,setRate]=useState(String(B.rate||2500));
  const[akivaPct,setAkivaPct]=useState(String(B.akivaPct||15));
  const[akivaRate,setAkivaRate]=useState(String(B.akivaRate||250));
  const[mileRate,setMileRate]=useState(String(B.mileRate||"0.85"));
  const[customFee,setCustomFee]=useState(B.customFee||false);
  function save(){
    if(!name.trim()) return;
    onSave({...B,id:B.id||uid(),name:name.trim(),address:address.trim(),client:client.trim(),
      rate:parseFloat(rate),akivaPct:parseFloat(akivaPct),akivaRate:parseFloat(akivaRate),
      mileRate:parseFloat(mileRate),customFee,stage:B.stage||"pre",createdAt:B.createdAt||today()});
  }
  return(
    <div>
      <Field label="BUILDING NAME *"><Input value={name} onChange={setName} placeholder="e.g. Oakwood Apartments"/></Field>
      <Field label="ADDRESS"><Input value={address} onChange={setAddress} placeholder="e.g. 1420 Oak St, Columbus OH"/></Field>
      <Field label="CLIENT / OWNER"><Input value={client} onChange={setClient} placeholder="e.g. Renew Housing LLC"/></Field>
      <Field label="DAILY VISIT RATE"><Select value={rate} onChange={setRate} options={[{value:"2250",label:"$2,250"},{value:"2500",label:"$2,500"},{value:"3000",label:"$3,000"}]}/></Field>
      <Field label="AKIVA SAVINGS %"><Select value={akivaPct} onChange={setAkivaPct} options={[{value:"15",label:"15%"},{value:"20",label:"20%"}]}/></Field>
      <Field label="AKIVA VISIT RATE"><Select value={akivaRate} onChange={setAkivaRate} options={[{value:"250",label:"$250 per visit"},{value:"500",label:"$500 per visit"}]}/></Field>
      <Field label="MILEAGE RATE ($/mile)"><Input value={mileRate} onChange={setMileRate} placeholder="0.85" type="number"/></Field>
      <div style={{marginBottom:18,display:"flex",alignItems:"center",gap:10}}>
        <input type="checkbox" id="cf" checked={customFee} onChange={e=>setCustomFee(e.target.checked)} style={{width:16,height:16,cursor:"pointer"}}/>
        <label htmlFor="cf" style={{fontSize:13,color:C.sub,cursor:"pointer"}}>Extra tier — fee goes to 1% above $400k</label>
      </div>
      <div style={{display:"flex",gap:10}}>
        <Btn variant="outline" onClick={onCancel} style={{flex:1}}>Cancel</Btn>
        <Btn onClick={save} style={{flex:2}}>Save Building</Btn>
      </div>
    </div>
  );
}

// ─── PIPELINE ─────────────────────────────────────────────────────────────────
function Pipeline({buildings,onUpdate,onSelect,onAdd}){
  const[filter,setFilter]=useState("all");
  const[sel,setSel]=useState(null);
  const selB=buildings.find(b=>b.id===sel);
  const filtered=filter==="all"?buildings:buildings.filter(b=>b.stage===filter);
  function advance(b){ const i=STAGE_IDS.indexOf(b.stage); if(i<4) onUpdate({...b,stage:STAGE_IDS[i+1]}); setSel(null); }
  function goBack(b){ const i=STAGE_IDS.indexOf(b.stage); if(i>0) onUpdate({...b,stage:STAGE_IDS[i-1]}); setSel(null); }
  return(
    <div style={{flex:1,overflowY:"auto",padding:14}}>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10,marginBottom:16,scrollbarWidth:"none"}}>
        {[{id:"all",label:`All (${buildings.length})`,color:C.sub},...STAGES.map(s=>({id:s.id,label:`${s.short} (${buildings.filter(b=>b.stage===s.id).length})`,color:s.color}))].map(f=>(
          <button key={f.id} onClick={()=>setFilter(f.id)} style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:`1px solid ${filter===f.id?f.color:C.border2}`,background:filter===f.id?f.color+"18":"transparent",color:filter===f.id?f.color:C.muted,fontSize:12,cursor:"pointer",whiteSpace:"nowrap",fontFamily:"inherit"}}>{f.label}</button>
        ))}
        <button onClick={onAdd} style={{flexShrink:0,padding:"6px 16px",borderRadius:20,border:"none",background:C.blue,color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit"}}>+ Add</button>
      </div>
      {buildings.length===0&&(
        <div style={{textAlign:"center",padding:"60px 20px"}}>
          <div style={{fontSize:40,marginBottom:12}}>🏢</div>
          <div style={{fontSize:16,color:C.text,fontWeight:700,marginBottom:8}}>No buildings yet</div>
          <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Add your first building to get started</div>
          <Btn onClick={onAdd}>+ Add Building</Btn>
        </div>
      )}
      {STAGES.map(stage=>{
        const cards=filtered.filter(b=>b.stage===stage.id);
        if(!cards.length) return null;
        return(
          <div key={stage.id} style={{marginBottom:24}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
              <div style={{width:3,height:18,borderRadius:2,background:stage.color}}/>
              <span style={{fontSize:12,fontWeight:700,color:stage.color,letterSpacing:1}}>{stage.label.toUpperCase()}</span>
              <span style={{fontSize:11,color:C.muted,background:stage.color+"20",borderRadius:8,padding:"1px 7px"}}>{cards.length}</span>
            </div>
            {cards.map(b=>(
              <Card key={b.id} onClick={()=>setSel(b.id)} style={{padding:"14px 16px",marginBottom:10,cursor:"pointer"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div style={{fontSize:14,fontWeight:700,color:C.text,flex:1,marginRight:10,lineHeight:1.3}}>{b.name}</div>
                  <div style={{fontSize:11,color:stage.color,background:stage.color+"18",borderRadius:5,padding:"2px 7px",flexShrink:0}}>{Math.round((STAGE_IDS.indexOf(b.stage)/4)*100)}%</div>
                </div>
                {b.address&&<div style={{fontSize:11,color:C.muted,marginTop:4}}>{b.address}</div>}
                {b.client&&<div style={{fontSize:11,color:C.sub,marginTop:2}}>👤 {b.client}</div>}
                <ProgressBar stage={b.stage}/>
              </Card>
            ))}
          </div>
        );
      })}
      <Sheet open={!!selB} title={selB?.name||""} onClose={()=>setSel(null)}>
        {selB&&<>
          {selB.address&&<div style={{fontSize:12,color:C.muted,marginBottom:12}}>{selB.address}</div>}
          {selB.client&&<Card style={{padding:"10px 14px",marginBottom:16}}><Lbl>CLIENT</Lbl><div style={{fontSize:14,color:C.text}}>{selB.client}</div></Card>}
          {STAGES.map((s,i)=>{const idx=STAGE_IDS.indexOf(selB.stage),done=i<idx,cur=i===idx;return(
            <div key={s.id} style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:done||cur?s.color:C.card,border:`2px solid ${done||cur?s.color:C.border2}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,color:done||cur?"#000":C.muted,flexShrink:0}}>{done?"✓":i+1}</div>
              <div style={{flex:1,fontSize:14,color:i>idx?C.muted:cur?s.color:C.sub,fontWeight:cur?700:400}}>{s.label}{cur&&<span style={{fontSize:10,background:s.color+"20",color:s.color,borderRadius:4,padding:"1px 6px",marginLeft:8}}>NOW</span>}</div>
            </div>
          );})}
          <div style={{display:"flex",gap:10,marginTop:16,marginBottom:10}}>
            {STAGE_IDS.indexOf(selB.stage)>0&&<Btn variant="outline" onClick={()=>goBack(selB)} style={{flex:1}}>← Back</Btn>}
            {STAGE_IDS.indexOf(selB.stage)<4&&<Btn onClick={()=>advance(selB)} style={{flex:2}}>Advance →</Btn>}
          </div>
          <Btn full variant="ghost" color={C.teal} onClick={()=>{onSelect(selB.id);setSel(null);}}>📁 View Full Detail</Btn>
        </>}
      </Sheet>
    </div>
  );
}

// ─── BUILDINGS LIST ───────────────────────────────────────────────────────────
function BuildingsList({buildings,onSelect,onAdd,onUpdate,onDelete}){
  const[search,setSearch]=useState("");
  const[editB,setEditB]=useState(null);
  const filtered=buildings.filter(b=>[b.name,b.address,b.client].join(" ").toLowerCase().includes(search.toLowerCase()));
  return(
    <div style={{flex:1,overflowY:"auto",padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div><div style={{fontSize:20,fontWeight:700,color:C.text}}>All Buildings</div><div style={{fontSize:12,color:C.muted,marginTop:2}}>{buildings.length} total · {buildings.filter(b=>b.stage==="complete").length} complete</div></div>
        <Btn onClick={onAdd}>+ Add</Btn>
      </div>
      <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"9px 14px",marginBottom:14,display:"flex",alignItems:"center",gap:8}}>
        <span style={{color:C.muted}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search buildings..." style={{border:"none",background:"transparent",color:C.text,fontSize:13,fontFamily:"inherit",outline:"none",flex:1}}/>
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted}}>No buildings found</div>}
      {filtered.map(b=>(
        <Card key={b.id} style={{padding:"14px 16px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",cursor:"pointer"}} onClick={()=>onSelect(b.id)}>
            <div style={{flex:1,marginRight:10}}>
              <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:3}}>{b.name}</div>
              {b.address&&<div style={{fontSize:11,color:C.muted}}>{b.address}</div>}
              {b.client&&<div style={{fontSize:11,color:C.sub,marginTop:2}}>👤 {b.client}</div>}
            </div>
            <StageBadge stage={b.stage}/>
          </div>
          <div style={{display:"flex",gap:8,marginTop:12}}>
            <Btn sm variant="ghost" color={C.blue} onClick={()=>onSelect(b.id)}>📁 Detail</Btn>
            <Btn sm variant="ghost" color={C.amber} onClick={()=>setEditB(b)}>✏️ Edit</Btn>
            <Btn sm variant="ghost" color={C.red} onClick={()=>{if(confirm(`Delete ${b.name}?`))onDelete(b.id);}}>🗑 Delete</Btn>
          </div>
        </Card>
      ))}
      <Sheet open={!!editB} title="Edit Building" onClose={()=>setEditB(null)}>
        {editB&&<BuildingForm initial={editB} onSave={b=>{onUpdate(b);setEditB(null);}} onCancel={()=>setEditB(null)}/>}
      </Sheet>
    </div>
  );
}

// ─── VISIT FORM ───────────────────────────────────────────────────────────────
function VisitForm({buildingId,defaultRate,onSave,onCancel}){
  const[type,setType]=useState(VISIT_TYPES[0]);
  const[date,setDate]=useState(today());
  const[rate,setRate]=useState(String(defaultRate||2500));
  return(
    <div>
      <Field label="VISIT TYPE"><Select value={type} onChange={setType} options={VISIT_TYPES}/></Field>
      <Field label="DATE"><Input type="date" value={date} onChange={setDate}/></Field>
      <Field label="DAILY RATE"><Select value={rate} onChange={setRate} options={[{value:"2250",label:"$2,250"},{value:"2500",label:"$2,500"},{value:"3000",label:"$3,000"}]}/></Field>
      <div style={{display:"flex",gap:10}}>
        <Btn variant="outline" onClick={onCancel} style={{flex:1}}>Cancel</Btn>
        <Btn onClick={()=>onSave({id:uid(),buildingId,type,date,rate:parseFloat(rate)})} style={{flex:2}}>Add Visit</Btn>
      </div>
    </div>
  );
}

// ─── EXPENSE FORM ─────────────────────────────────────────────────────────────
function ExpenseForm({buildingId,onSave,onCancel}){
  const[cat,setCat]=useState("Mileage");
  const[detail,setDetail]=useState("");
  const[amount,setAmount]=useState("");
  return(
    <div>
      <Field label="CATEGORY"><Select value={cat} onChange={setCat} options={EXPENSE_CATS}/></Field>
      <Field label="AMOUNT ($)"><Input value={amount} onChange={setAmount} placeholder="0.00" type="number"/></Field>
      <Field label="NOTES (optional)"><Input value={detail} onChange={setDetail} placeholder="e.g. 2 nights, I-76/I-77"/></Field>
      <div style={{display:"flex",gap:10}}>
        <Btn variant="outline" onClick={onCancel} style={{flex:1}}>Cancel</Btn>
        <Btn color={C.teal} onClick={()=>{
          const amt=parseFloat(amount||0);
          if(!amt) return;
          onSave({id:uid(),buildingId,cat,detail,amount:amt});
        }} style={{flex:2}}>Add Expense</Btn>
      </div>
    </div>
  );
}

// ─── PCNA TAB ─────────────────────────────────────────────────────────────────
function PCNATab({pcna,onSave,customFee}){
  const[origRR,setOrigRR]=useState(String(pcna.origRR||""));
  const[revRR,setRevRR]=useState(String(pcna.revRR||""));
  const[origMM,setOrigMM]=useState(String(pcna.origMM||""));
  const[revMM,setRevMM]=useState(String(pcna.revMM||""));
  const savedRR=Math.max(0,(parseFloat(origRR)||0)-(parseFloat(revRR)||0));
  const savedMM=Math.max(0,(parseFloat(origMM)||0)-(parseFloat(revMM)||0));
  const totalSaved=savedRR+savedMM;
  const fee=calcTieredFee(totalSaved,customFee);
  return(
    <div>
      <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:14}}>PCNA Numbers</div>
      {[["REPLACEMENT RESERVES",origRR,setOrigRR,revRR,setRevRR,savedRR],["MAJOR MOVABLES",origMM,setOrigMM,revMM,setRevMM,savedMM]].map(([lbl,orig,setO,rev,setR,saved])=>(
        <Card key={lbl} style={{padding:14,marginBottom:12}}>
          <div style={{fontSize:11,fontWeight:700,color:C.sub,letterSpacing:1,marginBottom:12}}>{lbl}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><Lbl>ORIGINAL</Lbl><Input value={orig} onChange={setO} placeholder="0" type="number"/></div>
            <div><Lbl>REVISED</Lbl><Input value={rev} onChange={setR} placeholder="0" type="number"/></div>
          </div>
          <div style={{background:C.panel,borderRadius:8,padding:"10px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <span style={{fontSize:12,color:C.muted}}>Savings</span>
            <span style={{fontSize:18,fontWeight:800,color:C.green}}>{fmt(saved)}</span>
          </div>
        </Card>
      ))}
      <Card style={{padding:14,marginBottom:12,border:`1px solid ${C.green}40`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:14,fontWeight:700,color:C.text}}>Total Saved</span>
          <span style={{fontSize:24,fontWeight:800,color:C.green}}>{fmt(totalSaved)}</span>
        </div>
      </Card>
      <Card style={{padding:14,marginBottom:16,border:`1px solid ${C.amber}40`}}>
        <Lbl>ADVISORY FEE {customFee?"(5/4/3/2/1% tiered)":"(5/4/3/2% tiered)"}</Lbl>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontSize:13,color:C.sub}}>On {fmt(totalSaved)} saved</span>
          <span style={{fontSize:22,fontWeight:800,color:C.amber}}>{fmt(fee)}</span>
        </div>
      </Card>
      <Btn full onClick={()=>onSave({...pcna,origRR:parseFloat(origRR)||0,revRR:parseFloat(revRR)||0,origMM:parseFloat(origMM)||0,revMM:parseFloat(revMM)||0})}>💾 Save PCNA Numbers</Btn>
    </div>
  );
}

// ─── INVOICE PREVIEW ──────────────────────────────────────────────────────────
function InvoicePDF({building,visits,expenses,pcna,allInvoices,onSend}){
  const savedRR=Math.max(0,(pcna.origRR||0)-(pcna.revRR||0));
  const savedMM=Math.max(0,(pcna.origMM||0)-(pcna.revMM||0));
  const totalSaved=savedRR+savedMM;
  const visitTotal=visits.reduce((a,v)=>a+v.rate,0);
  const expTotal=expenses.reduce((a,e)=>a+e.amount,0);
  const savingsFee=calcTieredFee(totalSaved,building.customFee);
  const grandTotal=visitTotal+expTotal+savingsFee;
  const akivaVisit=visits.length*building.akivaRate;
  const akivaSavings=savingsFee*(building.akivaPct/100);
  const akivaTotal=akivaVisit+akivaSavings;
  const invNum=genInvNum(allInvoices);
  const[dateSent,setDateSent]=useState(today());

  const tdStyle=(bold,right)=>({padding:"8px 10px",fontSize:13,fontWeight:bold?700:500,color:"#111",textAlign:right?"right":"left",border:"1px solid #e5e7eb"});
  const thStyle={padding:"6px 10px",fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1.2,textAlign:"right",background:"#f9fafb",border:"1px solid #e5e7eb"};

  function printInvoice(){
    const el=document.getElementById("rcs-invoice-print");
    const win=window.open("","_blank");
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${invNum}</title><style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Helvetica Neue',Arial,sans-serif;background:#fff;padding:0;}-webkit-print-color-adjust:exact;print-color-adjust:exact;}table{border-collapse:collapse;}@media print{.no-print{display:none!important;}}</style></head><body>${el.innerHTML}</body></html>`);
    win.document.close();
    win.focus();
    setTimeout(()=>win.print(),600);
  }

  return(
    <div>
      <div id="rcs-invoice-print" style={{background:"#fff",borderRadius:8,padding:20,color:"#111",fontFamily:"'Helvetica Neue',Arial,sans-serif"}}>
        {/* Letterhead */}
        <div style={{background:"#595355",padding:"0 20px",display:"flex",justifyContent:"space-between",alignItems:"center",height:64,overflow:"hidden",marginBottom:0,borderRadius:"6px 6px 0 0"}}>
          <div style={{height:64,overflow:"hidden",display:"flex",alignItems:"center"}}>
            <img src={LOGO} alt="RCS" style={{height:180,marginLeft:-55,marginTop:5}}/>
          </div>
          <div style={{textAlign:"right",lineHeight:2}}>
            <div style={{fontSize:10,color:"#c8c7c7",letterSpacing:0.4}}>79 Roselle Court · Lakewood, NJ 08701</div>
            <div style={{fontSize:10,color:"#c8c7c7",letterSpacing:0.4}}>Office@rosellecs.com · 732-496-6029</div>
          </div>
        </div>

        {/* Invoice meta */}
        <div style={{padding:"14px 16px",borderBottom:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"flex-end",background:"#fafafa"}}>
          <div style={{fontSize:22,fontWeight:800,color:"#111"}}>INVOICE</div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:14,fontWeight:700,color:"#111"}}>{invNum}</div>
            <div style={{fontSize:11,color:"#9ca3af",marginTop:2}}>Issued: {fmtDate(dateSent)}</div>
          </div>
        </div>

        {/* Bill To */}
        <div style={{padding:"16px 16px 14px",borderBottom:"1px solid #e5e7eb"}}>
          <div style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#9ca3af",marginBottom:8}}>BILL TO</div>
          <div style={{fontSize:16,fontWeight:700,color:"#111"}}>{building.client||"Client"}</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:3}}>{building.name}</div>
          {building.address&&<div style={{fontSize:11,color:"#9ca3af",marginTop:3}}>{building.address}</div>}
        </div>

        <div style={{padding:"0 16px"}}>
          {/* Column headers */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 110px 90px",padding:"10px 0",borderBottom:"2px solid #111",marginTop:14}}>
            {["DESCRIPTION","DATE","AMOUNT"].map((h,i)=><div key={h} style={{fontSize:10,fontWeight:700,letterSpacing:2,color:"#9ca3af",textAlign:i>0?"right":"left"}}>{h}</div>)}
          </div>

          {/* Daily Fees */}
          <div style={{borderBottom:"1px solid #e5e7eb"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1.5,padding:"10px 0 4px"}}>DAILY FEES</div>
            {visits.map((v,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 110px 90px",padding:"7px 0",borderTop:"1px solid #f3f4f6"}}>
                <div style={{fontSize:13,color:"#111",fontWeight:500}}>{v.type}</div>
                <div style={{fontSize:11,color:"#9ca3af",textAlign:"right"}}>{fmtShort(v.date)}</div>
                <div style={{fontSize:13,color:"#111",fontWeight:600,textAlign:"right"}}>{fmt(v.rate)}</div>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 110px 90px",padding:"6px 0 10px"}}>
              <div/><div style={{fontSize:11,color:"#9ca3af",textAlign:"right"}}>Subtotal</div>
              <div style={{fontSize:13,color:"#6b7280",fontWeight:600,textAlign:"right"}}>{fmt(visitTotal)}</div>
            </div>
          </div>

          {/* Expenses */}
          {expenses.length>0&&<div style={{borderBottom:"1px solid #e5e7eb"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1.5,padding:"10px 0 4px"}}>REIMBURSABLE EXPENSES</div>
            {expenses.map((e,i)=>(
              <div key={i} style={{display:"grid",gridTemplateColumns:"1fr 110px 90px",padding:"7px 0",borderTop:"1px solid #f3f4f6"}}>
                <div><div style={{fontSize:13,color:"#111",fontWeight:500}}>{e.cat}</div>{e.detail&&<div style={{fontSize:10,color:"#9ca3af",marginTop:1}}>{e.detail}</div>}</div>
                <div/><div style={{fontSize:13,color:"#111",fontWeight:600,textAlign:"right"}}>{fmt(e.amount)}</div>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 110px 90px",padding:"6px 0 10px"}}>
              <div/><div style={{fontSize:11,color:"#9ca3af",textAlign:"right"}}>Subtotal</div>
              <div style={{fontSize:13,color:"#6b7280",fontWeight:600,textAlign:"right"}}>{fmt(expTotal)}</div>
            </div>
          </div>}

          {/* PCNA */}
          <div style={{borderBottom:"1px solid #e5e7eb"}}>
            <div style={{fontSize:10,fontWeight:700,color:"#6b7280",letterSpacing:1.5,padding:"10px 0 8px"}}>PCNA SAVINGS FEE</div>
            {[["Replacement Reserves",pcna.origRR||0,pcna.revRR||0,savedRR],["Major Movables",pcna.origMM||0,pcna.revMM||0,savedMM]].map(([lbl,orig,rev,saved])=>(
              <div key={lbl} style={{marginBottom:10}}>
                <div style={{fontSize:11,fontWeight:600,color:"#374151",marginBottom:5}}>{lbl}</div>
                <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead><tr>{["Original","Revised","Savings"].map(h=><th key={h} style={thStyle}>{h}</th>)}</tr></thead>
                  <tbody><tr>{[fmt(orig),fmt(rev),fmt(saved)].map((v,i)=><td key={i} style={tdStyle(i===2,true)}>{v}</td>)}</tr></tbody>
                </table>
              </div>
            ))}
            <div style={{display:"grid",gridTemplateColumns:"1fr 90px",padding:"6px 0",borderTop:"1px solid #f3f4f6"}}>
              <div style={{fontSize:12,color:"#6b7280"}}>Total Client Savings</div>
              <div style={{fontSize:13,fontWeight:600,color:"#374151",textAlign:"right"}}>{fmt(totalSaved)}</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 90px",padding:"7px 0 14px",borderTop:"1px solid #f3f4f6"}}>
              <div style={{fontSize:14,fontWeight:700,color:"#111"}}>Advisory Fee</div>
              <div style={{fontSize:14,fontWeight:700,color:"#111",textAlign:"right"}}>{fmt(savingsFee)}</div>
            </div>
          </div>
        </div>

        {/* Total */}
        <div style={{margin:"16px 16px 14px",background:"#111",padding:"16px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderRadius:6}}>
          <div style={{fontSize:11,color:"#777",letterSpacing:2,fontWeight:700}}>TOTAL DUE</div>
          <div style={{fontSize:28,fontWeight:800,color:"#fff"}}>{fmt(grandTotal)}</div>
        </div>

        {/* Footer */}
        <div style={{borderTop:"1px solid #e5e7eb",padding:"12px 16px",textAlign:"center"}}>
          <div style={{fontSize:11,color:"#9ca3af"}}>Thank you for your business.</div>
        </div>
      </div>

      {/* Print / Email PDF */}
      <button onClick={printInvoice} className="no-print" style={{width:"100%",padding:"13px 0",marginTop:16,marginBottom:4,borderRadius:8,border:"none",background:"#111",color:"#fff",fontSize:14,fontWeight:700,cursor:"pointer",fontFamily:"inherit",letterSpacing:0.5}}>
        📧 Print / Save as PDF to Email
      </button>

      {/* Akiva internal */}
      <Card style={{padding:14,border:`1px solid ${C.purple}30`,marginTop:16,marginBottom:16}}>
        <Lbl>AKIVA — INTERNAL (not on invoice)</Lbl>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.sub,marginBottom:4}}>
          <span>Visit fee ({visits.length} × {fmt(building.akivaRate)})</span>
          <span style={{color:C.purple}}>{fmt(akivaVisit)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:C.sub,marginBottom:8}}>
          <span>Savings fee ({building.akivaPct}% of {fmt(savingsFee)})</span>
          <span style={{color:C.purple}}>{fmt(akivaSavings)}</span>
        </div>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:700,borderTop:`1px solid ${C.border}`,paddingTop:8}}>
          <span style={{color:C.text}}>Akiva Total</span>
          <span style={{color:C.purple}}>{fmt(akivaTotal)}</span>
        </div>
      </Card>

      <Field label="DATE SENT"><Input type="date" value={dateSent} onChange={setDateSent}/></Field>
      <Btn full onClick={()=>onSend({id:uid(),buildingId:building.id,number:invNum,dateSent,dateReceived:"",status:"Pending",total:grandTotal,visitTotal,expTotal,savingsFee,akivaTotal,visitCount:visits.length})}>📤 Send Invoice</Btn>
    </div>
  );
}

// ─── RECEIPT VIEW ─────────────────────────────────────────────────────────────
function ReceiptView({invoice,building}){
  return(
    <div style={{background:"#fff",borderRadius:8,padding:20,color:"#111",fontFamily:"'Helvetica Neue',Arial,sans-serif"}}>
      <div style={{background:"#595355",padding:"0 20px",display:"flex",justifyContent:"space-between",alignItems:"center",height:64,overflow:"hidden",borderRadius:"6px 6px 0 0"}}>
        <div style={{height:64,overflow:"hidden",display:"flex",alignItems:"center"}}>
          <img src={LOGO} alt="RCS" style={{height:180,marginLeft:-55,marginTop:5}}/>
        </div>
        <div style={{textAlign:"right",lineHeight:2}}>
          <div style={{fontSize:10,color:"#c8c7c7"}}>79 Roselle Court · Lakewood, NJ 08701</div>
          <div style={{fontSize:10,color:"#c8c7c7"}}>Office@rosellecs.com · 732-496-6029</div>
        </div>
      </div>
      <div style={{padding:"14px 16px",borderBottom:"1px solid #e5e7eb",display:"flex",justifyContent:"space-between",alignItems:"center",background:"#fafafa"}}>
        <div style={{fontSize:22,fontWeight:800,color:"#111"}}>RECEIPT</div>
        <div style={{fontSize:11,color:"#9ca3af"}}>Payment Confirmation</div>
      </div>
      <div style={{padding:"16px"}}>
        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:18}}>
          <tbody>
            {[["RECEIPT FOR",invoice.number],["DATE PAID",fmtDate(invoice.dateReceived)],["PAID BY",building?.client],["PROPERTY",building?.name]].map(([l,v])=>(
              <tr key={l} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"9px 0",fontSize:10,fontWeight:700,color:"#9ca3af",letterSpacing:1,width:"38%"}}>{l}</td>
                <td style={{padding:"9px 0",fontSize:13,fontWeight:600,color:"#111"}}>{v}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <table style={{width:"100%",borderCollapse:"collapse",marginBottom:16}}>
          <thead><tr style={{borderBottom:"2px solid #111"}}>{["DESCRIPTION","AMOUNT"].map((h,i)=><th key={h} style={{padding:"8px 0",fontSize:10,fontWeight:700,letterSpacing:2,color:"#9ca3af",textAlign:i===0?"left":"right"}}>{h}</th>)}</tr></thead>
          <tbody>
            {[["Daily Fees",invoice.visitTotal],["Reimbursable Expenses",invoice.expTotal],["PCNA Advisory Fee",invoice.savingsFee]].filter(([,v])=>v).map(([l,v])=>(
              <tr key={l} style={{borderBottom:"1px solid #f3f4f6"}}>
                <td style={{padding:"10px 0",fontSize:13,color:"#374151"}}>{l}</td>
                <td style={{padding:"10px 0",fontSize:13,color:"#111",fontWeight:600,textAlign:"right"}}>{fmt(v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div style={{background:"#111",padding:"14px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",borderRadius:6,marginBottom:14}}>
          <span style={{fontSize:11,color:"#777",fontWeight:700,letterSpacing:2}}>AMOUNT RECEIVED</span>
          <span style={{fontSize:26,fontWeight:800,color:"#fff"}}>{fmt(invoice.total)}</span>
        </div>
        <div style={{textAlign:"center",fontSize:11,color:"#9ca3af"}}>Thank you for your business.</div>
      </div>
    </div>
  );
}

// ─── BUILDING DETAIL ──────────────────────────────────────────────────────────
function Detail({building,visits,pcna,expenses,invoices,allInvoices,onUpdate,onAddVisit,onDelVisit,onSavePCNA,onAddExp,onDelExp,onAddInv,onUpdateInv,onDelInv}){
  const[tab,setTab]=useState("visits");
  const[showVisit,setShowVisit]=useState(false);
  const[showExp,setShowExp]=useState(false);
  const[showInv,setShowInv]=useState(false);
  const[showReceipt,setShowReceipt]=useState(null);
  const bPCNA=pcna||{buildingId:building.id,origRR:0,revRR:0,origMM:0,revMM:0};
  const savedRR=Math.max(0,(bPCNA.origRR||0)-(bPCNA.revRR||0));
  const savedMM=Math.max(0,(bPCNA.origMM||0)-(bPCNA.revMM||0));
  const totalSaved=savedRR+savedMM;
  const savingsFee=calcTieredFee(totalSaved,building.customFee);
  const visitTotal=visits.reduce((a,v)=>a+v.rate,0);
  const expTotal=expenses.reduce((a,e)=>a+e.amount,0);
  const invoiceTotal=visitTotal+expTotal+savingsFee;
  return(
    <div style={{flex:1,overflowY:"auto",padding:14}}>
      <Card style={{padding:16,marginBottom:14}}>
        <div style={{fontSize:18,fontWeight:700,color:C.text,lineHeight:1.3}}>{building.name}</div>
        {building.address&&<div style={{fontSize:11,color:C.muted,marginTop:3}}>{building.address}</div>}
        {building.client&&<div style={{fontSize:12,color:C.sub,marginTop:4}}>👤 {building.client}</div>}
        <div style={{display:"flex",gap:20,marginTop:12,flexWrap:"wrap"}}>
          <div><Lbl>STAGE</Lbl><StageBadge stage={building.stage}/></div>
          <div><Lbl>DAILY RATE</Lbl><div style={{fontSize:16,fontWeight:700,color:C.amber}}>{fmt(building.rate)}</div></div>
          <div><Lbl>AKIVA</Lbl><div style={{fontSize:14,fontWeight:700,color:C.purple}}>{building.akivaPct}% / {fmt(building.akivaRate)}</div></div>
        </div>
        {building.customFee&&<div style={{marginTop:8,fontSize:11,color:"#e05c8a",background:"#e05c8a18",borderRadius:6,padding:"3px 8px",display:"inline-block"}}>★ 1% extra tier enabled</div>}
      </Card>
      <div style={{display:"flex",background:C.panel,borderRadius:10,padding:4,marginBottom:14,border:`1px solid ${C.border}`}}>
        {[["visits","Visits"],["pcna","PCNA"],["expenses","Expenses"],["invoice","Invoice"]].map(([id,lbl])=>(
          <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"8px 4px",borderRadius:7,border:"none",background:tab===id?C.blue:"transparent",color:tab===id?"#fff":C.muted,fontSize:12,fontWeight:700,cursor:"pointer",fontFamily:"inherit",transition:"all .15s"}}>{lbl}</button>
        ))}
      </div>

      {tab==="visits"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:15,fontWeight:700,color:C.text}}>Visit Log</span>
          <Btn sm onClick={()=>setShowVisit(true)}>+ Add Visit</Btn>
        </div>
        {visits.length===0&&<div style={{textAlign:"center",padding:30,color:C.muted,fontSize:13}}>No visits logged yet</div>}
        {visits.map(v=>(
          <Card key={v.id} style={{padding:"13px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div><div style={{fontSize:14,fontWeight:700,color:C.text}}>{v.type}</div><div style={{fontSize:11,color:C.muted,marginTop:3}}>{fmtDate(v.date)}</div></div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:16,fontWeight:700,color:C.amber}}>{fmt(v.rate)}</div>
                <button onClick={()=>{if(confirm("Delete visit?"))onDelVisit(v.id);}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
              </div>
            </div>
          </Card>
        ))}
        {visits.length>0&&<div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontSize:13,color:C.muted}}>Visit Total</span>
          <span style={{fontSize:18,fontWeight:800,color:C.amber}}>{fmt(visitTotal)}</span>
        </div>}
        <Sheet open={showVisit} title="Add Visit" onClose={()=>setShowVisit(false)}>
          <VisitForm buildingId={building.id} defaultRate={building.rate} onSave={v=>{onAddVisit(v);setShowVisit(false);}} onCancel={()=>setShowVisit(false)}/>
        </Sheet>
      </div>}

      {tab==="pcna"&&<PCNATab pcna={bPCNA} onSave={onSavePCNA} customFee={building.customFee}/>}

      {tab==="expenses"&&<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <span style={{fontSize:15,fontWeight:700,color:C.text}}>Expense Log</span>
          <Btn sm color={C.teal} onClick={()=>setShowExp(true)}>+ Add</Btn>
        </div>
        {expenses.length===0&&<div style={{textAlign:"center",padding:30,color:C.muted,fontSize:13}}>No expenses logged yet</div>}
        {expenses.map(e=>{const col=CAT_COLORS[e.cat]||C.sub;return(
          <Card key={e.id} style={{padding:"13px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:700,color:col,background:col+"18",borderRadius:5,padding:"2px 8px"}}>{e.cat}</span>
                  <span style={{fontSize:11,color:C.muted}}>{fmtShort(e.date)}</span>
                </div>
                {e.detail&&<div style={{fontSize:12,color:C.sub}}>{e.detail}</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{fontSize:16,fontWeight:700,color:C.text}}>{fmt(e.amount)}</div>
                <button onClick={()=>{if(confirm("Delete expense?"))onDelExp(e.id);}} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16}}>✕</button>
              </div>
            </div>
          </Card>
        );})}
        {expenses.length>0&&<div style={{background:C.panel,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",display:"flex",justifyContent:"space-between",marginTop:4}}>
          <span style={{fontSize:13,color:C.muted}}>Expense Total</span>
          <span style={{fontSize:18,fontWeight:800,color:C.teal}}>{fmt(expTotal)}</span>
        </div>}
        <Sheet open={showExp} title="Add Expense" onClose={()=>setShowExp(false)}>
          <ExpenseForm buildingId={building.id} onSave={e=>{onAddExp(e);setShowExp(false);}} onCancel={()=>setShowExp(false)}/>
        </Sheet>
      </div>}

      {tab==="invoice"&&<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {[[C.amber,"VISIT FEES",fmt(visitTotal)],[C.teal,"EXPENSES",fmt(expTotal)],[C.green,"SAVINGS FEE",fmt(savingsFee)],[C.blue,"TOTAL DUE",fmt(invoiceTotal)]].map(([col,lbl,val])=>(
            <div key={lbl} style={{background:C.card,border:`1px solid ${col}30`,borderRadius:10,padding:12}}>
              <div style={{fontSize:9,color:C.muted,letterSpacing:1}}>{lbl}</div>
              <div style={{fontSize:16,fontWeight:800,color:col,marginTop:4}}>{val}</div>
            </div>
          ))}
        </div>
        <Btn full onClick={()=>setShowInv(true)} style={{marginBottom:16}}>📄 Generate Invoice</Btn>
        {invoices.length>0&&<div>
          <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:10}}>Past Invoices</div>
          {invoices.map(inv=>{const sc=inv.status==="Paid"?C.green:inv.status==="Overdue"?C.red:C.amber;return(
            <Card key={inv.id} style={{padding:"13px 16px",marginBottom:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                <div style={{fontSize:12,color:C.blue,fontFamily:"monospace"}}>{inv.number}</div>
                <div style={{fontSize:11,fontWeight:700,color:sc,background:sc+"20",borderRadius:6,padding:"2px 8px"}}>{inv.status}</div>
              </div>
              <div style={{fontSize:18,fontWeight:800,color:C.text}}>{fmt(inv.total)}</div>
              <div style={{fontSize:11,color:C.muted,marginTop:2}}>Sent: {fmtDate(inv.dateSent)}{inv.dateReceived&&` · Paid: ${fmtDate(inv.dateReceived)}`}</div>
              <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
                <Btn sm variant="ghost" color={C.blue} onClick={()=>setShowInv(true)}>👁 View</Btn>
                {inv.status!=="Paid"&&<Btn sm variant="ghost" color={C.green} onClick={()=>onUpdateInv({...inv,status:"Paid",dateReceived:today()})}>✓ Mark Paid</Btn>}
                {inv.status==="Pending"&&<Btn sm variant="ghost" color={C.red} onClick={()=>onUpdateInv({...inv,status:"Overdue"})}>Overdue</Btn>}
                {inv.status==="Paid"&&<Btn sm variant="ghost" color={C.teal} onClick={()=>setShowReceipt(inv)}>📄 Receipt</Btn>}
                <Btn sm variant="ghost" color={C.red} onClick={()=>{if(confirm("Delete this invoice?"))onDelInv(inv.id);}}>🗑 Delete</Btn>
              </div>
            </Card>
          );})}
        </div>}
        <Sheet open={showInv} title="Invoice Preview" onClose={()=>setShowInv(false)}>
          <InvoicePDF building={building} visits={visits} expenses={expenses} pcna={bPCNA} allInvoices={allInvoices} onSend={inv=>{onAddInv(inv);setShowInv(false);}}/>
        </Sheet>
        <Sheet open={!!showReceipt} title="Receipt" onClose={()=>setShowReceipt(null)}>
          {showReceipt&&<ReceiptView invoice={showReceipt} building={building}/>}
        </Sheet>
      </div>}
    </div>
  );
}

// ─── BILLING ──────────────────────────────────────────────────────────────────
function Billing({buildings,invoices,onUpdateInv}){
  const[showReceipt,setShowReceipt]=useState(null);
  const yr=new Date().getFullYear();
  const yrInv=invoices.filter(i=>i.number?.startsWith(`RCS-${yr}-`));
  const totalBilled=yrInv.reduce((a,i)=>a+i.total,0);
  const totalCollected=yrInv.filter(i=>i.status==="Paid").reduce((a,i)=>a+i.total,0);
  const totalOut=totalBilled-totalCollected;
  const totalVisitFees=yrInv.reduce((a,i)=>a+(i.visitTotal||0),0);
  const totalSavingsFees=yrInv.reduce((a,i)=>a+(i.savingsFee||0),0);
  const akiwaOwed=yrInv.reduce((a,i)=>a+(i.akivaTotal||0),0);
  const akivaPaid=yrInv.filter(i=>i.status==="Paid").reduce((a,i)=>a+(i.akivaTotal||0),0);
  return(
    <div style={{flex:1,overflowY:"auto",padding:14}}>
      <div style={{fontSize:20,fontWeight:700,color:C.text,marginBottom:14}}>Billing & Payments</div>
      <Card style={{padding:14,marginBottom:14}}>
        <div style={{fontSize:11,color:C.muted,letterSpacing:1,marginBottom:12}}>{yr} SUMMARY</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
          {[[C.blue,"TOTAL BILLED",totalBilled],[C.green,"COLLECTED",totalCollected],[C.red,"OUTSTANDING",totalOut],[C.amber,"VISIT FEES",totalVisitFees],[C.teal,"SAVINGS FEES",totalSavingsFees]].map(([col,lbl,val])=>(
            <div key={lbl} style={{background:C.panel,borderRadius:8,padding:"10px 12px"}}>
              <div style={{fontSize:9,color:C.muted,letterSpacing:1}}>{lbl}</div>
              <div style={{fontSize:16,fontWeight:800,color:col,marginTop:3}}>{fmt(val)}</div>
            </div>
          ))}
        </div>
      </Card>
      <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:10}}>All Invoices</div>
      {invoices.length===0&&<div style={{textAlign:"center",padding:30,color:C.muted,fontSize:13}}>No invoices yet — generate one from a building's detail page</div>}
      {invoices.slice().reverse().map(inv=>{
        const sc=inv.status==="Paid"?C.green:inv.status==="Overdue"?C.red:C.amber;
        const b=buildings.find(x=>x.id===inv.buildingId);
        return(
          <Card key={inv.id} style={{padding:"14px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:4}}>
              <div style={{fontSize:12,color:C.blue,fontFamily:"monospace"}}>{inv.number}</div>
              <div style={{fontSize:11,fontWeight:700,color:sc,background:sc+"20",borderRadius:6,padding:"2px 8px"}}>{inv.status}</div>
            </div>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>{b?.name||"Unknown"}</div>
            <div style={{fontSize:11,color:C.sub}}>{b?.client}</div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:8}}>
              <div style={{fontSize:11,color:C.muted}}>Sent: {fmtDate(inv.dateSent)}{inv.dateReceived&&` · Paid: ${fmtDate(inv.dateReceived)}`}</div>
              <div style={{fontSize:18,fontWeight:800,color:C.text}}>{fmt(inv.total)}</div>
            </div>
            <div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>
              {inv.status!=="Paid"&&<Btn sm variant="ghost" color={C.green} onClick={()=>onUpdateInv({...inv,status:"Paid",dateReceived:today()})}>✓ Mark Paid</Btn>}
              {inv.status==="Pending"&&<Btn sm variant="ghost" color={C.red} onClick={()=>onUpdateInv({...inv,status:"Overdue"})}>Overdue</Btn>}
              {inv.status==="Paid"&&<Btn sm variant="ghost" color={C.teal} onClick={()=>setShowReceipt(inv)}>📄 Receipt</Btn>}
              <Btn sm variant="ghost" color={C.red} onClick={()=>{if(confirm("Delete this invoice?"))onUpdateInv({...inv,_deleted:true});}}>🗑 Delete</Btn>
            </div>
          </Card>
        );
      })}
      <div style={{fontSize:14,fontWeight:700,color:C.purple,marginBottom:10,marginTop:8}}>Akiva — Internal</div>
      <Card style={{padding:14,border:`1px solid ${C.purple}30`,marginBottom:10}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:14}}>
          <div><Lbl>TOTAL OWED</Lbl><div style={{fontSize:22,fontWeight:800,color:C.purple}}>{fmt(akiwaOwed)}</div></div>
          <div style={{textAlign:"right"}}><Lbl>PAID OUT</Lbl><div style={{fontSize:22,fontWeight:800,color:C.green}}>{fmt(akivaPaid)}</div></div>
        </div>
        {invoices.slice().reverse().filter(i=>i.akivaTotal).map(inv=>{
          const b=buildings.find(x=>x.id===inv.buildingId);
          const sc=inv.status==="Paid"?C.green:C.amber;
          return(
            <div key={inv.id} style={{borderTop:`1px solid ${C.border}`,paddingTop:10,marginTop:10}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <div style={{fontSize:13,fontWeight:600,color:C.text}}>{b?.name}</div>
                <div style={{fontSize:11,color:sc,background:sc+"20",borderRadius:6,padding:"2px 8px"}}>{inv.status}</div>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                <span style={{fontSize:12,color:C.sub}}>{inv.number}</span>
                <span style={{fontSize:14,fontWeight:700,color:C.purple}}>{fmt(inv.akivaTotal)}</span>
              </div>
            </div>
          );
        })}
      </Card>
      <Sheet open={!!showReceipt} title="Receipt" onClose={()=>setShowReceipt(null)}>
        {showReceipt&&<ReceiptView invoice={showReceipt} building={buildings.find(b=>b.id===showReceipt.buildingId)}/>}
      </Sheet>
    </div>
  );
}

// ─── EXPENSES OVERVIEW ────────────────────────────────────────────────────────
function ExpensesOverview({expenses,buildings}){
  const[filter,setFilter]=useState("all");
  const filtered=filter==="all"?expenses:expenses.filter(e=>e.cat===filter);
  const total=expenses.reduce((a,e)=>a+e.amount,0);
  const bycat=expenses.reduce((a,e)=>{a[e.cat]=(a[e.cat]||0)+e.amount;return a;},{});
  return(
    <div style={{flex:1,overflowY:"auto",padding:14}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div style={{fontSize:20,fontWeight:700,color:C.text}}>Expenses</div>
        <div style={{background:C.teal+"20",border:`1px solid ${C.teal}40`,borderRadius:10,padding:"8px 14px",textAlign:"right"}}>
          <div style={{fontSize:9,color:C.teal,letterSpacing:1}}>YTD TOTAL</div>
          <div style={{fontSize:18,fontWeight:800,color:C.teal}}>{fmt(total)}</div>
        </div>
      </div>
      <div style={{display:"flex",gap:8,overflowX:"auto",paddingBottom:10,marginBottom:14,scrollbarWidth:"none"}}>
        <button onClick={()=>setFilter("all")} style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:`1px solid ${filter==="all"?C.teal:C.border2}`,background:filter==="all"?C.teal+"18":"transparent",color:filter==="all"?C.teal:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>All</button>
        {EXPENSE_CATS.filter(c=>bycat[c]).map(c=>{const col=CAT_COLORS[c]||C.sub;return(
          <button key={c} onClick={()=>setFilter(c)} style={{flexShrink:0,padding:"6px 14px",borderRadius:20,border:`1px solid ${filter===c?col:C.border2}`,background:filter===c?col+"18":"transparent",color:filter===c?col:C.muted,fontSize:12,cursor:"pointer",fontFamily:"inherit"}}>{c}</button>
        );})}
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:40,color:C.muted}}>No expenses recorded yet</div>}
      {filtered.slice().sort((a,b)=>(b.date||"").localeCompare(a.date||"")).map(e=>{
        const b=buildings.find(x=>x.id===e.buildingId);
        const col=CAT_COLORS[e.cat]||C.sub;
        return(
          <Card key={e.id} style={{padding:"13px 16px",marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                  <span style={{fontSize:11,fontWeight:700,color:col,background:col+"18",borderRadius:5,padding:"2px 8px"}}>{e.cat}</span>
                  <span style={{fontSize:11,color:C.muted}}>{fmtShort(e.date)}</span>
                </div>
                {b&&<div style={{fontSize:12,fontWeight:600,color:C.text}}>{b.name}</div>}
                {e.detail&&<div style={{fontSize:11,color:C.sub,marginTop:2}}>{e.detail}</div>}
              </div>
              <div style={{display:"flex",alignItems:"center",gap:10,marginLeft:10}}>
                <div style={{fontSize:16,fontWeight:700,color:C.text}}>{fmt(e.amount)}</div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}

// ─── APP SHELL ────────────────────────────────────────────────────────────────
const NAV=[
  {id:"pipeline",icon:"▦",label:"Pipeline"},
  {id:"buildings",icon:"🏢",label:"Buildings"},
  {id:"detail",icon:"📁",label:"Detail"},
  {id:"billing",icon:"💰",label:"Billing"},
  {id:"expenses",icon:"💸",label:"Expenses"},
];

export default function App(){
  const[data,setData,loaded]=useData();
  const[tab,setTab]=useState("pipeline");
  const[selectedId,setSelectedId]=useState(null);
  const[showAdd,setShowAdd]=useState(false);
  const selBuilding=data.buildings.find(b=>b.id===selectedId);
  async function upd(b){
    await supaFetch(`rcs_buildings?id=eq.${b.id}`,"PATCH",{name:b.name,address:b.address,client:b.client,rate:b.rate,akiva_pct:b.akivaPct,akiva_rate:b.akivaRate,mile_rate:b.mileRate,custom_fee:b.customFee,stage:b.stage});
    reload();
  }
  async function addB(b){
    await supaFetch("rcs_buildings","POST",{id:b.id,name:b.name,address:b.address,client:b.client,rate:b.rate,akiva_pct:b.akivaPct,akiva_rate:b.akivaRate,mile_rate:b.mileRate,custom_fee:b.customFee,stage:b.stage,created_at:b.createdAt});
    reload();
  }
  async function delB(id){
    await Promise.all([
      supaFetch(`rcs_buildings?id=eq.${id}`,"DELETE"),
      supaFetch(`rcs_visits?building_id=eq.${id}`,"DELETE"),
      supaFetch(`rcs_pcna?building_id=eq.${id}`,"DELETE"),
      supaFetch(`rcs_expenses?building_id=eq.${id}`,"DELETE"),
    ]);
    reload();
  }
  async function addV(v){
    await supaFetch("rcs_visits","POST",{id:v.id,building_id:v.buildingId,type:v.type,date:v.date,rate:v.rate});
    reload();
  }
  async function delV(id){
    await supaFetch(`rcs_visits?id=eq.${id}`,"DELETE");
    reload();
  }
  async function savePCNA(p){
    const existing=data.pcna.find(x=>x.buildingId===p.buildingId);
    if(existing){
      await supaFetch(`rcs_pcna?building_id=eq.${p.buildingId}`,"PATCH",{orig_rr:p.origRR,rev_rr:p.revRR,orig_mm:p.origMM,rev_mm:p.revMM});
    } else {
      await supaFetch("rcs_pcna","POST",{id:uid(),building_id:p.buildingId,orig_rr:p.origRR,rev_rr:p.revRR,orig_mm:p.origMM,rev_mm:p.revMM});
    }
    reload();
  }
  async function addE(e){
    await supaFetch("rcs_expenses","POST",{id:e.id,building_id:e.buildingId,cat:e.cat,detail:e.detail,amount:e.amount});
    reload();
  }
  async function delE(id){
    await supaFetch(`rcs_expenses?id=eq.${id}`,"DELETE");
    reload();
  }
  async function addInv(inv){
    await supaFetch("rcs_invoices","POST",{id:inv.id,building_id:inv.buildingId,number:inv.number,date_sent:inv.dateSent,date_received:inv.dateReceived||null,status:inv.status,total:inv.total,visit_total:inv.visitTotal,exp_total:inv.expTotal,savings_fee:inv.savingsFee,akiva_total:inv.akivaTotal,visit_count:inv.visitCount});
    reload();
  }
  async function updInv(inv){
    await supaFetch(`rcs_invoices?id=eq.${inv.id}`,"PATCH",{status:inv.status,date_received:inv.dateReceived||null});
    reload();
  }
  async function delInv(id){
    await supaFetch(`rcs_invoices?id=eq.${id}`,"DELETE");
    reload();
  }
  function goDetail(id){setSelectedId(id);setTab("detail");}
  if(!loaded) return <div style={{height:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",color:C.muted,fontSize:14}}>Loading...</div>;
  return(
    <div style={{height:"100vh",background:C.bg,display:"flex",flexDirection:"column",fontFamily:"system-ui,sans-serif",color:C.text,overflow:"hidden"}}>
      <div style={{background:C.panel,borderBottom:`1px solid ${C.border}`,padding:"12px 16px",flexShrink:0}}>
        <div style={{fontSize:15,fontWeight:800,color:C.text,letterSpacing:1}}>ROSELLE CREATIVE SOLUTIONS</div>
        <div style={{fontSize:10,color:C.muted,letterSpacing:1,marginTop:1}}>INSPECTION TRACKER · {data.buildings.length} BUILDINGS · {data.buildings.filter(b=>b.stage==="complete").length} COMPLETE · <span style={{color:C.teal}}>☁ CLOUD SYNC ON</span></div>
      </div>
      <div style={{flex:1,display:"flex",overflow:"hidden",position:"relative"}}>
        {tab==="pipeline"&&<Pipeline buildings={data.buildings} onUpdate={upd} onSelect={goDetail} onAdd={()=>setShowAdd(true)}/>}
        {tab==="buildings"&&<BuildingsList buildings={data.buildings} onSelect={goDetail} onAdd={()=>setShowAdd(true)} onUpdate={upd} onDelete={delB}/>}
        {tab==="detail"&&!selBuilding&&(
          <div style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:30,textAlign:"center"}}>
            <div style={{fontSize:40,marginBottom:12}}>📁</div>
            <div style={{fontSize:16,color:C.text,fontWeight:700,marginBottom:8}}>No building selected</div>
            <div style={{fontSize:13,color:C.muted,marginBottom:20}}>Tap a building from Pipeline or Buildings</div>
            <Btn variant="ghost" color={C.blue} onClick={()=>setTab("buildings")}>Go to Buildings</Btn>
          </div>
        )}
        {tab==="detail"&&selBuilding&&(
          <Detail
            building={selBuilding}
            visits={data.visits.filter(v=>v.buildingId===selectedId)}
            pcna={data.pcna.find(p=>p.buildingId===selectedId)}
            expenses={data.expenses.filter(e=>e.buildingId===selectedId)}
            invoices={data.invoices.filter(i=>i.buildingId===selectedId)}
            allInvoices={data.invoices}
            onUpdate={upd} onAddVisit={addV} onDelVisit={delV} onSavePCNA={savePCNA}
            onAddExp={addE} onDelExp={delE} onAddInv={addInv} onUpdateInv={updInv} onDelInv={delInv}
          />
        )}
        {tab==="billing"&&<Billing buildings={data.buildings} invoices={data.invoices} onUpdateInv={updInv}/>}
        {tab==="expenses"&&<ExpensesOverview expenses={data.expenses} buildings={data.buildings}/>}
      </div>
      <div style={{background:C.panel,borderTop:`1px solid ${C.border}`,display:"flex",flexShrink:0,paddingBottom:"env(safe-area-inset-bottom)"}}>
        {NAV.map(n=>(
          <button key={n.id} onClick={()=>setTab(n.id)} style={{flex:1,padding:"10px 4px 8px",border:"none",background:"transparent",color:tab===n.id?C.blue:C.muted,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,fontFamily:"inherit",transition:"color .15s"}}>
            <span style={{fontSize:20}}>{n.icon}</span>
            <span style={{fontSize:10,fontWeight:tab===n.id?700:400}}>{n.label}</span>
            {tab===n.id&&<div style={{width:20,height:2,background:C.blue,borderRadius:1}}/>}
          </button>
        ))}
      </div>
      <Sheet open={showAdd} title="Add New Building" onClose={()=>setShowAdd(false)}>
        <BuildingForm onSave={b=>{addB(b);setShowAdd(false);}} onCancel={()=>setShowAdd(false)}/>
      </Sheet>
    </div>
  );
}
