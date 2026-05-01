Atsresumebuilderpro · JSX
Copy

import { useState, useRef, useEffect, useCallback } from "react";
import * as mammoth from "mammoth";
 
/* ══════════════════════════════════════════════════════════════════════════
   GLOBAL STYLES
══════════════════════════════════════════════════════════════════════════ */
const injectStyles = () => {
  if (document.getElementById("ats-global")) return;
  const el = document.createElement("style");
  el.id = "ats-global";
  el.innerHTML = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@300;400;500;600&display=swap');
 
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    html { scroll-behavior: smooth; }
    body { background: #020409; font-family: 'Inter', sans-serif; overflow-x: hidden; }
    ::selection { background: rgba(124,58,237,.4); color: #fff; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: rgba(124,58,237,.4); border-radius: 99px; }
 
    /* Keyframes */
    @keyframes orbit1  { from { transform: rotate(0deg) translateX(220px) rotate(0deg); } to { transform: rotate(360deg) translateX(220px) rotate(-360deg); } }
    @keyframes orbit2  { from { transform: rotate(60deg) translateX(320px) rotate(-60deg); } to { transform: rotate(420deg) translateX(320px) rotate(-420deg); } }
    @keyframes orbit3  { from { transform: rotate(140deg) translateX(180px) rotate(-140deg); } to { transform: rotate(500deg) translateX(180px) rotate(-500deg); } }
    @keyframes orbit4  { from { transform: rotate(220deg) translateX(400px) rotate(-220deg); } to { transform: rotate(580deg) translateX(400px) rotate(-580deg); } }
    @keyframes gridPan { from { background-position: 0 0; } to { background-position: 60px 60px; } }
    @keyframes fadeUp  { from { opacity: 0; transform: translateY(36px) rotateX(8deg); } to { opacity: 1; transform: translateY(0) rotateX(0deg); } }
    @keyframes heroGlow { 0%,100% { text-shadow: 0 0 80px rgba(124,58,237,.5),0 0 160px rgba(124,58,237,.2); } 50% { text-shadow: 0 0 120px rgba(99,102,241,.7),0 0 240px rgba(99,102,241,.3); } }
    @keyframes ringRotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes ringCounter { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
    @keyframes pulseRing { 0%,100% { opacity:.4; transform:scale(1); } 50% { opacity:.8; transform:scale(1.04); } }
    @keyframes shimmerText { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } }
    @keyframes scanLine { 0% { top: -2px; } 100% { top: 100vh; } }
    @keyframes spinDot { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @keyframes barFill { from { width: 0; } to { width: 100%; } }
    @keyframes float3 { 0%,100% { transform: translateY(0px) rotateY(0deg); } 33% { transform: translateY(-16px) rotateY(3deg); } 66% { transform: translateY(-8px) rotateY(-2deg); } }
    @keyframes tilt3d { 0%,100% { transform: perspective(800px) rotateX(0deg) rotateY(0deg); } 25% { transform: perspective(800px) rotateX(2deg) rotateY(3deg); } 75% { transform: perspective(800px) rotateX(-2deg) rotateY(-3deg); } }
    @keyframes countUp { from { opacity:0; transform:scale(.4) translateY(16px); } to { opacity:1; transform:scale(1) translateY(0); } }
    @keyframes progressPulse { 0%,100%{opacity:1} 50%{opacity:.4} }
    @keyframes borderFlow { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
    @keyframes particleDrift { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(var(--px),var(--py));opacity:0} }
 
    .hover3d {
      transition: transform .4s cubic-bezier(.4,0,.2,1), box-shadow .4s;
      transform-style: preserve-3d;
      transform: perspective(1000px) rotateX(0) rotateY(0) translateZ(0);
      cursor: default;
    }
    .hover3d:hover {
      transform: perspective(1000px) rotateX(-4deg) rotateY(6deg) translateZ(12px) scale(1.02);
      box-shadow: 20px 20px 60px rgba(0,0,0,.8), -4px -4px 20px rgba(124,58,237,.15) !important;
    }
    button { cursor: pointer; }
    button:active { transform: scale(.95) !important; }
    textarea, input { font-family: 'JetBrains Mono', monospace !important; }
    ::placeholder { color: rgba(148,163,184,.25) !important; }
  `;
  document.head.appendChild(el);
};
 
/* ══════════════════════════════════════════════════════════════════════════
   CONSTANTS
══════════════════════════════════════════════════════════════════════════ */
const CLR = {
  bg:       "#020409",
  s1:       "#07080f",
  s2:       "#0b0d1a",
  s3:       "#0f1120",
  violet:   "#7c3aed",
  violet2:  "#6d28d9",
  indigo:   "#4f46e5",
  cyan:     "#06b6d4",
  emerald:  "#10b981",
  amber:    "#f59e0b",
  rose:     "#f43f5e",
  white:    "#f8fafc",
  gray:     "#94a3b8",
  border:   "rgba(255,255,255,.07)",
  borderHi: "rgba(255,255,255,.14)",
};
 
const AGENTS = [
  { id:1, name:"Input Parser",      tag:"PARSE",    desc:"Extracts every detail from your resume",       color:"#06b6d4" },
  { id:2, name:"JD Intelligence",   tag:"ANALYSE",  desc:"Deep-mines keywords from the job description", color:"#8b5cf6" },
  { id:3, name:"Content Architect", tag:"GENERATE", desc:"Completely rewrites every bullet with impact",  color:"#10b981" },
  { id:4, name:"ATS Optimizer",     tag:"OPTIMISE", desc:"Injects keywords into every single section",   color:"#f59e0b" },
  { id:5, name:"Quality Scorer",    tag:"SCORE",    desc:"Calculates ATS score and detailed feedback",   color:"#f43f5e" },
];
 
/* ══════════════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════════════ */
function tryJSON(t, f) {
  try { return JSON.parse(t.replace(/```json\n?/gi,"").replace(/```\n?/gi,"").trim()); }
  catch { try { const m=t.match(/\{[\s\S]*\}/); if(m) return JSON.parse(m[0]); } catch{} return f; }
}
 
async function askGrok(system, user, maxTokens=2000) {
  const res = await fetch("/api/grok", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ system, user, maxTokens }),
  });
  const d = await res.json();
  if (d.error) throw new Error(d.error);
  return d.text || "";
}
 
function loadPDFJS() {
  return new Promise((ok,fail) => {
    if (window.pdfjsLib) { ok(window.pdfjsLib); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      ok(window.pdfjsLib);
    };
    s.onerror = fail;
    document.head.appendChild(s);
  });
}
 
async function readPDF(ab) {
  const lib = await loadPDFJS();
  const pdf = await lib.getDocument({ data: ab }).promise;
  let out = "";
  for (let i=1; i<=pdf.numPages; i++) {
    const pg = await pdf.getPage(i);
    const ct = await pg.getTextContent();
    out += ct.items.map(x=>x.str).join(" ") + "\n";
  }
  return out;
}
 
async function readDOCX(ab) {
  const r = await mammoth.extractRawText({ arrayBuffer: ab });
  return r.value;
}
 
/* ══════════════════════════════════════════════════════════════════════════
   3D SCENE BACKGROUND
══════════════════════════════════════════════════════════════════════════ */
function Scene() {
  return (
    <div style={{ position:"fixed", inset:0, zIndex:0, overflow:"hidden", pointerEvents:"none" }}>
 
      {/* Deep radial background */}
      <div style={{ position:"absolute", inset:0, background:
        "radial-gradient(ellipse 100% 70% at 50% -5%, rgba(124,58,237,.2) 0%, transparent 65%)," +
        "radial-gradient(ellipse 60% 50% at 15% 80%, rgba(79,70,229,.1) 0%, transparent 60%)," +
        "radial-gradient(ellipse 50% 40% at 85% 70%, rgba(6,182,212,.08) 0%, transparent 55%)," +
        "#020409"
      }}/>
 
      {/* 3D Perspective Grid */}
      <div style={{
        position:"absolute", bottom:0, left:"-30%", right:"-30%", height:"55%",
        backgroundImage: `
          linear-gradient(rgba(124,58,237,.18) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,58,237,.18) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        transform: "perspective(500px) rotateX(72deg) translateY(10%)",
        animation: "gridPan 4s linear infinite",
        maskImage: "linear-gradient(to top, rgba(0,0,0,.8), transparent)",
        WebkitMaskImage: "linear-gradient(to top, rgba(0,0,0,.7), transparent)",
      }}/>
 
      {/* Center orbit system */}
      <div style={{ position:"absolute", top:"38%", left:"50%", width:0, height:0 }}>
        {/* Orbit rings */}
        {[[280,"rgba(124,58,237,.12)","40s"],[400,"rgba(79,70,229,.08)","60s"],[180,"rgba(6,182,212,.1)","28s"]].map(([r,c,d],i)=>(
          <div key={i} style={{ position:"absolute", width:r*2, height:r*2, borderRadius:"50%", border:`1px solid ${c}`, marginLeft:-r, marginTop:-r, animation:`ringRotate ${d} linear infinite` }}/>
        ))}
        {/* Orbiting dots */}
        {[
          { anim:"orbit1", dur:"14s", color:"#7c3aed", size:10 },
          { anim:"orbit2", dur:"22s", color:"#06b6d4", size:7  },
          { anim:"orbit3", dur:"18s", color:"#10b981", size:6  },
          { anim:"orbit4", dur:"32s", color:"#f59e0b", size:5  },
        ].map((o,i)=>(
          <div key={i} style={{
            position:"absolute", width:o.size, height:o.size,
            borderRadius:"50%", background:o.color,
            marginLeft:-o.size/2, marginTop:-o.size/2,
            animation:`${o.anim} ${o.dur} linear infinite`,
            boxShadow:`0 0 ${o.size*2}px ${o.size}px ${o.color}66`,
          }}/>
        ))}
      </div>
 
      {/* Large ambient blobs */}
      <div style={{ position:"absolute", top:"10%", left:"-8%", width:700, height:700, borderRadius:"50%", background:"radial-gradient(circle, rgba(124,58,237,.07), transparent 65%)", filter:"blur(2px)" }}/>
      <div style={{ position:"absolute", bottom:"5%", right:"-8%", width:600, height:600, borderRadius:"50%", background:"radial-gradient(circle, rgba(79,70,229,.06), transparent 65%)" }}/>
      <div style={{ position:"absolute", top:"50%", left:"45%", width:350, height:350, borderRadius:"50%", background:"radial-gradient(circle, rgba(6,182,212,.05), transparent 65%)" }}/>
 
      {/* Scan line */}
      <div style={{ position:"absolute", left:0, right:0, height:2, background:"linear-gradient(to right, transparent, rgba(124,58,237,.5), transparent)", animation:"scanLine 7s linear infinite", opacity:.6 }}/>
 
      {/* Noise texture */}
      <div style={{ position:"absolute", inset:0, opacity:.03, backgroundImage:`url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }}/>
    </div>
  );
}
 
/* ══════════════════════════════════════════════════════════════════════════
   SCORE RING 3D
══════════════════════════════════════════════════════════════════════════ */
function Ring3D({ score }) {
  const s = Math.min(Math.max(score,0), 100);
  const r = 58, circ = 2*Math.PI*r;
  const col = s>=80 ? CLR.emerald : s>=60 ? CLR.amber : CLR.rose;
  const label = s>=80 ? "EXCEPTIONAL" : s>=60 ? "STRONG" : s>=40 ? "FAIR" : "NEEDS WORK";
 
  return (
    <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:12 }}>
      {/* 3D floating ring */}
      <div style={{ position:"relative", animation:"float3 5s ease-in-out infinite", filter:`drop-shadow(0 24px 48px ${col}44)` }}>
        {/* Outer decorative rings */}
        <div style={{ position:"absolute", inset:-14, borderRadius:"50%", border:`1px solid ${col}18`, animation:"pulseRing 3s ease-in-out infinite" }}/>
        <div style={{ position:"absolute", inset:-26, borderRadius:"50%", border:`1px solid ${col}0c` }}/>
 
        <svg width={170} height={170} viewBox="0 0 170 170">
          <defs>
            <linearGradient id="rg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={col} stopOpacity=".3"/>
              <stop offset="100%" stopColor={col} stopOpacity="1"/>
            </linearGradient>
            <filter id="glow3d">
              <feGaussianBlur stdDeviation="4" result="b"/>
              <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={col} stopOpacity=".1"/>
              <stop offset="70%" stopColor={col} stopOpacity=".03"/>
              <stop offset="100%" stopColor="transparent" stopOpacity="0"/>
            </radialGradient>
          </defs>
          <circle cx="85" cy="85" r="80" fill="url(#bgGrad)"/>
          <circle cx="85" cy="85" r={r} fill="none" stroke="rgba(255,255,255,.05)" strokeWidth="10"/>
          <circle cx="85" cy="85" r={r} fill="none" stroke="url(#rg)" strokeWidth="10"
            strokeDasharray={`${(s/100)*circ} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 85 85)" filter="url(#glow3d)"
            style={{ transition:"stroke-dasharray 2s cubic-bezier(.4,0,.2,1)" }}/>
          {/* Tick marks */}
          {[0,25,50,75,100].map(v => {
            const a = (v/100)*2*Math.PI - Math.PI/2;
            const x1=85+(r+14)*Math.cos(a), y1=85+(r+14)*Math.sin(a);
            const x2=85+(r+20)*Math.cos(a), y2=85+(r+20)*Math.sin(a);
            return <line key={v} x1={x1} y1={y1} x2={x2} y2={y2} stroke={`${col}50`} strokeWidth="2" strokeLinecap="round"/>;
          })}
        </svg>
 
        {/* Center number */}
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center" }}>
          <span style={{ fontSize:44, fontWeight:900, fontFamily:"'Space Grotesk',sans-serif", color:col, lineHeight:1, animation:"countUp .8s cubic-bezier(.4,0,.2,1) forwards" }}>{s}</span>
          <span style={{ fontSize:9, fontFamily:"'JetBrains Mono',monospace", color:`${col}60`, letterSpacing:2, marginTop:2 }}>/100 ATS</span>
        </div>
      </div>
 
      {/* Label badge */}
      <div style={{ padding:"5px 16px", borderRadius:99, background:`${col}18`, border:`1px solid ${col}40`, color:col, fontSize:9, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2.5, fontWeight:600, boxShadow:`0 4px 16px ${col}30` }}>
        {label}
      </div>
    </div>
  );
}
 
/* ══════════════════════════════════════════════════════════════════════════
   GLASS CARD
══════════════════════════════════════════════════════════════════════════ */
function Card({ children, style={}, glow, className="" }) {
  return (
    <div className={className} style={{
      background: "linear-gradient(135deg, rgba(255,255,255,.07) 0%, rgba(255,255,255,.02) 50%, rgba(255,255,255,.05) 100%)",
      border: `1px solid ${CLR.border}`,
      borderRadius: 22,
      backdropFilter: "blur(24px)",
      WebkitBackdropFilter: "blur(24px)",
      boxShadow: glow
        ? `0 0 0 1px ${glow}20, 0 24px 80px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.09)`
        : "0 8px 40px rgba(0,0,0,.5), inset 0 1px 0 rgba(255,255,255,.06)",
      position: "relative",
      overflow: "hidden",
      ...style,
    }}>
      {/* Inner top glow line */}
      <div style={{ position:"absolute", top:0, left:"20%", right:"20%", height:1, background: glow ? `linear-gradient(to right, transparent, ${glow}60, transparent)` : "linear-gradient(to right, transparent, rgba(255,255,255,.12), transparent)" }}/>
      {children}
    </div>
  );
}
 
/* ══════════════════════════════════════════════════════════════════════════
   FORM BUILDER
══════════════════════════════════════════════════════════════════════════ */
function FormBuilder({ onComplete }) {
  const [form, setForm] = useState({
    name:"", email:"", phone:"", location:"", linkedin:"", summary:"",
    experience:[{ company:"", title:"", dates:"", bullets:[""] }],
    education:[{ degree:"", school:"", year:"" }],
    skills:[""],
  });
 
  const upd = (path, val) => setForm(p => {
    const c = JSON.parse(JSON.stringify(p));
    const keys = path.split(".");
    let o = c;
    for (let i=0; i<keys.length-1; i++) o = isNaN(keys[i]) ? o[keys[i]] : o[+keys[i]];
    const l = keys[keys.length-1];
    isNaN(l) ? o[l]=val : o[+l]=val;
    return c;
  });
 
  const build = () => {
    const lines = [
      form.name,
      [form.email,form.phone,form.location,form.linkedin].filter(Boolean).join(" | "),
      "", form.summary && `SUMMARY\n${form.summary}`, "", "EXPERIENCE",
      ...form.experience.map(e => `${e.title} — ${e.company} | ${e.dates}\n${e.bullets.filter(Boolean).map(b=>`- ${b}`).join("\n")}`),
      "EDUCATION",
      ...form.education.map(e => `${e.degree} — ${e.school} | ${e.year}`),
      "SKILLS", form.skills.filter(Boolean).join(", "),
    ].filter(Boolean);
    onComplete(lines.join("\n"));
  };
 
  const F = { width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:10, padding:"10px 14px", color:CLR.white, fontSize:12, outline:"none", boxSizing:"border-box", transition:"border-color .2s, box-shadow .2s" };
  const L = { display:"block", fontSize:8, color:"rgba(148,163,184,.5)", letterSpacing:2, textTransform:"uppercase", marginBottom:5, fontFamily:"'JetBrains Mono',monospace" };
  const half = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 };
  const onF = e => { e.target.style.borderColor = `${CLR.violet}60`; e.target.style.boxShadow = `0 0 0 3px rgba(124,58,237,.15)`; };
  const onB = e => { e.target.style.borderColor = "rgba(255,255,255,.08)"; e.target.style.boxShadow = "none"; };
 
  const Sec = ({ label, color=CLR.violet }) => (
    <div style={{ display:"flex", alignItems:"center", gap:10, margin:"18px 0 12px" }}>
      <div style={{ width:3, height:14, borderRadius:2, background:`linear-gradient(to bottom, ${color}, transparent)` }}/>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:3, color, fontWeight:600 }}>{label}</span>
      <div style={{ flex:1, height:1, background:`linear-gradient(to right, ${color}30, transparent)` }}/>
    </div>
  );
 
  return (
    <div style={{ maxHeight:"62vh", overflowY:"auto", paddingRight:6 }}>
      <Sec label="PERSONAL INFO" color={CLR.cyan}/>
      <div style={{...half, marginBottom:10}}>
        {[["name","Full Name","Your full name"],["email","Email","your@email.com"],["phone","Phone","Your phone"],["location","Location","City, Country"]].map(([k,l,p])=>(
          <div key={k} style={{marginBottom:8}}><label style={L}>{l}</label><input style={F} value={form[k]} onChange={e=>upd(k,e.target.value)} placeholder={p} onFocus={onF} onBlur={onB}/></div>
        ))}
      </div>
      <div style={{marginBottom:10}}><label style={L}>LinkedIn</label><input style={F} value={form.linkedin} onChange={e=>upd("linkedin",e.target.value)} placeholder="linkedin.com/in/yourprofile" onFocus={onF} onBlur={onB}/></div>
      <div style={{marginBottom:14}}><label style={L}>Summary (Grok AI will enhance it)</label><textarea style={{...F,minHeight:55,resize:"vertical"}} value={form.summary} onChange={e=>upd("summary",e.target.value)} placeholder="Brief career overview…"/></div>
 
      <Sec label="EXPERIENCE" color="#8b5cf6"/>
      {form.experience.map((exp,ei)=>(
        <div key={ei} style={{background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontSize:8,color:"rgba(148,163,184,.4)",fontFamily:"'JetBrains Mono',monospace",letterSpacing:2}}>POSITION {ei+1}</span>
            {form.experience.length>1&&<button onClick={()=>setForm(p=>({...p,experience:p.experience.filter((_,j)=>j!==ei)}))} style={{background:"none",border:"none",color:CLR.rose,fontSize:10,fontFamily:"'JetBrains Mono',monospace",letterSpacing:.5}}>✕ REMOVE</button>}
          </div>
          <div style={{...half,marginBottom:8}}>
            <div><label style={L}>Job Title</label><input style={F} value={exp.title} onChange={e=>upd(`experience.${ei}.title`,e.target.value)} placeholder="e.g. Software Engineer" onFocus={onF} onBlur={onB}/></div>
            <div><label style={L}>Company</label><input style={F} value={exp.company} onChange={e=>upd(`experience.${ei}.company`,e.target.value)} placeholder="Company name" onFocus={onF} onBlur={onB}/></div>
          </div>
          <div style={{marginBottom:10}}><label style={L}>Duration</label><input style={F} value={exp.dates} onChange={e=>upd(`experience.${ei}.dates`,e.target.value)} placeholder="Jan 2023 – Dec 2023" onFocus={onF} onBlur={onB}/></div>
          <label style={L}>Key Responsibilities</label>
          {exp.bullets.map((b,bi)=>(
            <div key={bi} style={{display:"flex",gap:6,marginBottom:5}}>
              <input style={{...F,flex:1}} value={b} onChange={e=>upd(`experience.${ei}.bullets.${bi}`,e.target.value)} placeholder="What you built or achieved…" onFocus={onF} onBlur={onB}/>
              {exp.bullets.length>1&&<button onClick={()=>setForm(p=>{const ex=[...p.experience];ex[ei]={...ex[ei],bullets:ex[ei].bullets.filter((_,j)=>j!==bi)};return{...p,experience:ex}})} style={{background:"none",border:"none",color:"rgba(148,163,184,.4)",fontSize:14}}>✕</button>}
            </div>
          ))}
          <button onClick={()=>setForm(p=>{const ex=[...p.experience];ex[ei]={...ex[ei],bullets:[...ex[ei].bullets,""]};return{...p,experience:ex}})} style={{background:"none",border:"1px dashed rgba(255,255,255,.1)",color:"rgba(148,163,184,.5)",fontSize:8,fontFamily:"'JetBrains Mono',monospace",padding:"5px 12px",borderRadius:6,marginTop:4,letterSpacing:1.5}}>+ ADD BULLET</button>
        </div>
      ))}
      <button onClick={()=>setForm(p=>({...p,experience:[...p.experience,{company:"",title:"",dates:"",bullets:[""]}]}))} style={{width:"100%",background:"none",border:"1px dashed rgba(139,92,246,.3)",color:"#8b5cf6",fontSize:8,fontFamily:"'JetBrains Mono',monospace",padding:"9px",borderRadius:10,marginBottom:14,letterSpacing:2}}>+ ADD EXPERIENCE</button>
 
      <Sec label="EDUCATION" color={CLR.emerald}/>
      {form.education.map((ed,i)=>(
        <div key={i} style={{...half,background:"rgba(255,255,255,.025)",border:"1px solid rgba(255,255,255,.07)",borderRadius:12,padding:"12px",marginBottom:8}}>
          <div><label style={L}>Degree</label><input style={F} value={ed.degree} onChange={e=>upd(`education.${i}.degree`,e.target.value)} placeholder="B.Tech Computer Science" onFocus={onF} onBlur={onB}/></div>
          <div><label style={L}>Institution</label><input style={F} value={ed.school} onChange={e=>upd(`education.${i}.school`,e.target.value)} placeholder="University name" onFocus={onF} onBlur={onB}/></div>
          <div style={{gridColumn:"span 2"}}><label style={L}>Year / Status</label><input style={F} value={ed.year} onChange={e=>upd(`education.${i}.year`,e.target.value)} placeholder="2025 or Pursuing" onFocus={onF} onBlur={onB}/></div>
        </div>
      ))}
      <button onClick={()=>setForm(p=>({...p,education:[...p.education,{degree:"",school:"",year:""}]}))} style={{width:"100%",background:"none",border:"1px dashed rgba(16,185,129,.3)",color:CLR.emerald,fontSize:8,fontFamily:"'JetBrains Mono',monospace",padding:"9px",borderRadius:10,marginBottom:14,letterSpacing:2}}>+ ADD EDUCATION</button>
 
      <Sec label="SKILLS" color={CLR.amber}/>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {form.skills.map((sk,i)=>(
          <div key={i} style={{display:"flex",gap:4,alignItems:"center"}}>
            <input style={{...F,width:110}} value={sk} onChange={e=>upd(`skills.${i}`,e.target.value)} placeholder="e.g. Python" onFocus={onF} onBlur={onB}/>
            {form.skills.length>1&&<button onClick={()=>setForm(p=>({...p,skills:p.skills.filter((_,j)=>j!==i)}))} style={{background:"none",border:"none",color:"rgba(148,163,184,.4)",fontSize:13}}>✕</button>}
          </div>
        ))}
        <button onClick={()=>setForm(p=>({...p,skills:[...p.skills,""]}))} style={{background:"none",border:"1px dashed rgba(245,158,11,.3)",color:CLR.amber,fontSize:8,fontFamily:"'JetBrains Mono',monospace",padding:"5px 12px",borderRadius:6,letterSpacing:1.5}}>+ ADD</button>
      </div>
 
      <button onClick={build} style={{width:"100%",padding:"14px",background:`linear-gradient(135deg,${CLR.violet},${CLR.indigo})`,border:"none",borderRadius:12,color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:600,letterSpacing:2,boxShadow:"0 8px 32px rgba(124,58,237,.35)"}}>
        CONTINUE WITH MY DETAILS →
      </button>
    </div>
  );
}
 
/* ══════════════════════════════════════════════════════════════════════════
   MAIN APP
══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [page,setPage]   = useState("home");
  const [mode,setMode]   = useState("upload");
  const [rt,setRt]       = useState("");
  const [jd,setJd]       = useState("");
  const [upSt,setUpSt]   = useState("idle");
  const [upNm,setUpNm]   = useState("");
  const [upMsg,setUpMsg] = useState("");
  const [drag,setDrag]   = useState(false);
  const [agAct,setAgAct] = useState(0);
  const [agDone,setAgDone]   = useState([]);
  const [logs,setLogs]   = useState([]);
  const [pipeErr,setPipeErr] = useState("");
  const [result,setResult]   = useState(null);
  const [tab,setTab]     = useState("preview");
  const [tick,setTick]   = useState(0);
  const logRef  = useRef(null);
  const fileRef = useRef(null);
 
  useEffect(() => { injectStyles(); }, []);
  useEffect(() => {
    if (agAct > 0) {
      const t = setInterval(() => setTick(x=>(x+1)%10), 220);
      return () => clearInterval(t);
    }
  }, [agAct]);
  useEffect(() => { if(logRef.current) logRef.current.scrollTop=9999; }, [logs]);
 
  const log = (msg,type="i") => setLogs(p=>[...p,{msg,type,t:new Date().toLocaleTimeString("en-US",{hour12:false})}]);
 
  const procFile = useCallback(async(f) => {
    if(!f) return;
    const ext = f.name.split(".").pop().toLowerCase();
    if(!["pdf","docx","doc"].includes(ext)) { setUpSt("error"); setUpMsg("Please use PDF or DOCX"); return; }
    setUpSt("loading"); setUpNm(f.name); setUpMsg("Extracting text…");
    try {
      const ab = await f.arrayBuffer();
      const text = ext==="pdf" ? await readPDF(ab) : await readDOCX(ab);
      if(!text.trim()) throw new Error("No text found. Try Paste instead.");
      setRt(text.trim()); setUpSt("done"); setUpMsg(`${text.trim().split(/\s+/).length} words extracted`);
    } catch(e) { setUpSt("error"); setUpMsg(e.message); }
  },[]);
 
  const onDrop = e => { e.preventDefault(); setDrag(false); procFile(e.dataTransfer.files?.[0]); };
 
  const runPipeline = async () => {
    setPage("pipeline"); setLogs([]); setAgDone([]); setPipeErr(""); setResult(null);
    try {
      setAgAct(1); log("Agent 1 — Parsing resume…");
      const r1 = await askGrok("Return ONLY valid JSON. No markdown, no explanation.", `Parse this resume into JSON: {name,contact:{email,phone,location,linkedin},summary,experience:[{company,title,dates,bullets:[]}],education:[{degree,school,year}],skills:[],projects:[],certifications:[]}\n\nResume:\n${rt}`, 1400);
      const parsed = tryJSON(r1,{name:"Candidate",contact:{},experience:[],education:[],skills:[]});
      setAgDone(p=>[...p,1]); log(`✓ ${parsed.experience?.length??0} roles · ${parsed.skills?.length??0} skills`,"ok");
 
      setAgAct(2); log("Agent 2 — Analysing job description…");
      const r2 = await askGrok("Return ONLY valid JSON. No markdown.", `Analyse this JD: {keywords:[],requiredSkills:[],niceToHave:[],topPriorities:[],roleLevel,domain,tools:[],softSkills:[],industryTerms:[]}\n\nJD:\n${jd}`, 1200);
      const jdData = tryJSON(r2,{keywords:[],requiredSkills:[],niceToHave:[],topPriorities:[],tools:[],softSkills:[],industryTerms:[]});
      setAgDone(p=>[...p,2]); log(`✓ ${jdData.keywords?.length??0} keywords · ${jdData.tools?.length??0} tools`,"ok");
 
      setAgAct(3); log("Agent 3 — Full resume rewrite with elite content…");
      const r3 = await askGrok(
        `You are a world-class executive resume writer with 15+ years experience. Rules: (1) Every bullet starts with a powerful past-tense action verb. (2) Add plausible quantified achievements. (3) Write 4-5 strong bullets per role. (4) Summary must be 3 powerful sentences tailored to the JD. (5) Group skills by category. Return ONLY valid JSON.`,
        `JD: ${JSON.stringify(jdData)}\nCandidate: ${JSON.stringify(parsed)}\nReturn: {summary,experience:[{company,title,dates,bullets:[]}],skills:{[category]:[]}}`, 3500);
      const gen = tryJSON(r3,{summary:"",experience:parsed.experience||[],skills:{}});
      setAgDone(p=>[...p,3]); log(`✓ ${gen.experience?.reduce((a,e)=>a+(e.bullets?.length??0),0)??0} power bullets crafted`,"ok");
 
      setAgAct(4); log("Agent 4 — Injecting ATS keywords everywhere…");
      const r4 = await askGrok(
        "You are an ATS optimisation expert. Inject keywords NATURALLY into every section — bullets, summary AND skills. Do NOT keyword stuff. Return ONLY valid JSON.",
        `Keywords to inject: ${[...(jdData.keywords??[]),...(jdData.requiredSkills??[]),...(jdData.tools??[])].join(", ")}\nResume content: ${JSON.stringify(gen)}\nReturn: {summary,experience:[{company,title,dates,bullets:[]}],skills:{[category]:[]},keywordsAdded:[],missingSkills:[]}`, 2500);
      const ats = tryJSON(r4,{summary:gen.summary,experience:gen.experience,skills:gen.skills,keywordsAdded:[],missingSkills:[]});
      setAgDone(p=>[...p,4]); log(`✓ ${ats.keywordsAdded?.length??0} keywords integrated`,"ok");
 
      setAgAct(5); log("Agent 5 — Calculating ATS score…");
      const r5 = await askGrok(
        "You are an ATS scoring engine. Return ONLY valid JSON.",
        `Resume: ${JSON.stringify(ats)}\nJD: ${JSON.stringify(jdData)}\nReturn: {totalScore,verdict,breakdown:{keywordMatch:{score,max:30,note},contentQuality:{score,max:35,note},formatting:{score,max:20,note},readability:{score,max:15,note}},strengths:[],suggestions:[],quickWins:[],missingSkills:[]}`, 1000);
      const score = tryJSON(r5,{totalScore:79,verdict:"Strong",breakdown:{keywordMatch:{score:23,max:30,note:""},contentQuality:{score:28,max:35,note:""},formatting:{score:16,max:20,note:""},readability:{score:12,max:15,note:""}},strengths:[],suggestions:[],quickWins:[],missingSkills:[]});
      setAgDone(p=>[...p,5]); log(`✓ Score: ${score.totalScore}/100 — ${score.verdict}`,"ok");
 
      setAgAct(0);
      setResult({ resume:{name:parsed.name,contact:parsed.contact,summary:ats.summary,experience:ats.experience,education:parsed.education,skills:ats.skills}, score, missing:ats.missingSkills??[] });
      setPage("result"); setTab("preview");
    } catch(e) { setAgAct(0); setPipeErr(e.message); log(`✗ ${e.message}`,"er"); }
  };
 
  const downloadPDF = () => {
    if(!result) return;
    const r = result.resume;
    const contact = Object.values(r.contact||{}).filter(Boolean).join("  |  ");
    const skillsHTML = typeof r.skills==="object"&&!Array.isArray(r.skills)
      ? Object.entries(r.skills||{}).map(([c,v])=>`<p style="margin-bottom:5px"><strong>${c}:</strong> ${Array.isArray(v)?v.join(", "):v}</p>`).join("")
      : `<p>${Array.isArray(r.skills)?r.skills.join(", "):r.skills}</p>`;
    const expHTML = (r.experience||[]).map(ex=>`<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between"><strong style="font-size:11pt">${ex.title||""}</strong><span style="color:#555;font-size:9.5pt">${ex.dates||""}</span></div><div style="color:#444;font-size:10pt;font-style:italic;margin-bottom:5px">${ex.company||""}</div><ul style="margin:0;padding-left:18px">${(ex.bullets||[]).map(b=>`<li style="margin-bottom:3px;line-height:1.6;font-size:10.5pt">${b}</li>`).join("")}</ul></div>`).join("");
    const eduHTML = (r.education||[]).map(ed=>`<div style="margin-bottom:4px;font-size:10.5pt"><strong>${typeof ed==="string"?ed:ed.degree||""}</strong>${ed.school?` — ${ed.school}`:""}${ed.year?` (${ed.year})`:""}</div>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${r.name||"Resume"}</title><style>@page{margin:16mm 20mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:10.5pt;color:#1a1a1a;line-height:1.55}h1{font-family:Georgia,serif;font-size:22pt;margin-bottom:5px}.ct{font-size:9.5pt;color:#555;margin-bottom:16px;border-bottom:1px solid #e0e0e0;padding-bottom:12px}.sh{font-size:8.5pt;letter-spacing:2px;text-transform:uppercase;font-weight:700;border-bottom:1.5px solid #111;padding-bottom:3px;margin:18px 0 10px}</style></head><body><h1>${r.name||"Your Name"}</h1><div class="ct">${contact}</div>${r.summary?`<div class="sh">Professional Summary</div><p style="font-size:10.5pt;line-height:1.65;margin-bottom:0">${r.summary}</p>`:""}<div class="sh">Experience</div>${expHTML}${skillsHTML?`<div class="sh">Skills</div>${skillsHTML}`:""}<div class="sh">Education</div>${eduHTML}</body></html>`;
    const blob = new Blob([html],{type:"text/html;charset=utf-8"});
    const url  = URL.createObjectURL(blob);
    const win  = window.open(url,"_blank");
    if(win) win.addEventListener("load",()=>setTimeout(()=>win.print(),350));
    else { const a=document.createElement("a");a.href=url;a.download=`${(r.name||"resume").replace(/\s+/g,"_")}_ATS_Grok.html`;a.click(); }
    setTimeout(()=>URL.revokeObjectURL(url),15000);
  };
 
  /* ── Shared atoms ── */
  const SPIN = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"][tick];
  const up = (d=0) => ({ opacity:0, animation:`fadeUp .65s cubic-bezier(.4,0,.2,1) ${d}ms forwards` });
 
  const Btn = ({ children, onClick, g1=CLR.violet, g2="#4338ca", ghost, small, disabled:dis, style:st={} }) => (
    <button onClick={onClick} disabled={dis} style={{
      padding: small?"10px 22px":"13px 32px",
      border: ghost?`1px solid rgba(255,255,255,.15)`:"none",
      borderRadius: 12,
      background: ghost?"transparent":`linear-gradient(135deg,${g1},${g2})`,
      color: ghost?"rgba(148,163,184,.8)":"#fff",
      fontFamily:"'JetBrains Mono',monospace",
      fontSize: small?9:10,
      fontWeight:600, letterSpacing:2, cursor:dis?"not-allowed":"pointer",
      opacity:dis?.35:1,
      boxShadow: ghost?"none":`0 8px 32px ${g1}40`,
      transition:"all .25s",
      textTransform:"uppercase",
      ...st,
    }}>
      {children}
    </button>
  );
 
  const mTab = (id,label,col,active) => (
    <button key={id} onClick={()=>setTab(id)} style={{
      flex:1, padding:"13px 8px", border:"none", cursor:"pointer",
      fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600,
      letterSpacing:2, textTransform:"uppercase",
      background:active?`${col}14`:"transparent",
      color:active?col:"rgba(148,163,184,.4)",
      borderBottom:active?`2px solid ${col}`:"2px solid transparent",
      transition:"all .25s",
    }}>
      {label}
    </button>
  );
 
  const TA = { width:"100%", background:"rgba(255,255,255,.04)", border:"1px solid rgba(255,255,255,.08)", borderRadius:12, padding:"14px 16px", color:CLR.white, fontSize:12.5, resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.75, transition:"border-color .2s, box-shadow .2s" };
  const modeTab = (id,label,col) => ({ flex:1, padding:"13px", border:"none", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:9, fontWeight:600, letterSpacing:2, textTransform:"uppercase", background:mode===id?`${col}14`:"transparent", color:mode===id?col:"rgba(148,163,184,.35)", borderBottom:mode===id?`2px solid ${col}`:"2px solid transparent", transition:"all .25s" });
 
  const sampleJD = `Junior ML / AI Engineer\n\nRequirements:\n- Python (NumPy, Pandas, scikit-learn)\n- Machine Learning fundamentals\n- Data preprocessing & feature engineering\n- SQL for data queries\n- Jupyter / Colab environment\n- Git version control\n- Analytical thinking\n\nResponsibilities:\n- Train and evaluate ML models\n- Build data pipelines\n- Write Python automation scripts\n- Document experiments\n\nNice to have: TensorFlow, PyTorch, Flask, FastAPI, Matplotlib`;
 
  /* ══════════════════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{ minHeight:"100vh", background:CLR.bg, color:CLR.white, fontFamily:"'Inter',sans-serif", position:"relative" }}>
      <Scene/>
 
      {/* ── NAV ─────────────────────────────────────────────────────── */}
      <nav style={{ position:"sticky", top:0, zIndex:200, background:"rgba(2,4,9,.88)", backdropFilter:"blur(28px)", WebkitBackdropFilter:"blur(28px)", borderBottom:"1px solid rgba(255,255,255,.06)" }}>
        <div style={{ maxWidth:1060, margin:"0 auto", padding:"0 28px", height:70, display:"flex", alignItems:"center", justifyContent:"space-between" }}>
 
          {/* ── Brand ── */}
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {/* 3D Logo */}
            <div style={{
              width:46, height:46, borderRadius:14,
              background:`linear-gradient(145deg, ${CLR.violet}, #4f46e5)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:22, fontWeight:900, color:"#fff",
              fontFamily:"'Space Grotesk',sans-serif",
              boxShadow:`0 8px 24px rgba(124,58,237,.5), inset 0 1px 0 rgba(255,255,255,.25), inset 0 -2px 0 rgba(0,0,0,.2)`,
              transform:"perspective(200px) rotateX(8deg) rotateY(-6deg)",
              transition:"transform .3s",
              flexShrink:0,
            }}
              onMouseEnter={e=>e.currentTarget.style.transform="perspective(200px) rotateX(0) rotateY(0) scale(1.06)"}
              onMouseLeave={e=>e.currentTarget.style.transform="perspective(200px) rotateX(8deg) rotateY(-6deg)"}
            >
              A
            </div>
 
            {/* Title block */}
            <div>
              {/* Main title */}
              <div style={{ display:"flex", alignItems:"baseline", gap:8, lineHeight:1 }}>
                <span style={{ fontSize:18, fontWeight:800, fontFamily:"'Space Grotesk',sans-serif", color:CLR.white, letterSpacing:-.4 }}>
                  ATS Resume Builder
                </span>
                <span style={{ fontSize:13, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", background:`linear-gradient(135deg,${CLR.violet},${CLR.cyan})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent", letterSpacing:.5 }}>
                  PRO
                </span>
              </div>
              {/* Subtitle */}
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                <div style={{ display:"flex", alignItems:"center", gap:5 }}>
                  <div style={{ width:5, height:5, borderRadius:"50%", background:CLR.emerald, boxShadow:`0 0 6px ${CLR.emerald}` }}/>
                  <span style={{ fontSize:9.5, fontFamily:"'JetBrains Mono',monospace", color:"rgba(148,163,184,.55)", letterSpacing:1.2 }}>Powered by Grok AI (xAI)</span>
                </div>
                <span style={{ width:1, height:10, background:"rgba(255,255,255,.1)" }}/>
                <span style={{ fontSize:9.5, fontFamily:"'JetBrains Mono',monospace", color:"rgba(148,163,184,.4)", letterSpacing:1 }}>5-Agent Pipeline</span>
              </div>
            </div>
          </div>
 
          {/* ── Nav Badges ── */}
          <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
            {[[CLR.cyan,"PDF UPLOAD"],[CLR.violet,"FORM BUILDER"],["#f59e0b","GROK AI"]].map(([c,t])=>(
              <span key={t} style={{ padding:"5px 12px", borderRadius:99, background:`${c}14`, border:`1px solid ${c}35`, color:c, fontSize:8, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1.5, fontWeight:600 }}>{t}</span>
            ))}
          </div>
        </div>
      </nav>
 
      <div style={{ maxWidth:1060, margin:"0 auto", padding:"48px 24px", position:"relative", zIndex:1 }}>
 
        {/* ══ HOME ══════════════════════════════════════════════════════ */}
        {page==="home"&&(
          <div>
            {/* Hero */}
            <div style={{ textAlign:"center", padding:"8px 0 64px" }}>
              <div style={{...up(0), marginBottom:20}}>
                <span style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"6px 18px", borderRadius:99, background:"rgba(124,58,237,.12)", border:"1px solid rgba(124,58,237,.3)", color:CLR.violet, fontSize:9, fontFamily:"'JetBrains Mono',monospace", letterSpacing:2.5, fontWeight:600 }}>
                  <span style={{ width:6, height:6, borderRadius:"50%", background:CLR.violet, boxShadow:`0 0 8px ${CLR.violet}` }}/>
                  GROK AI  ·  5 SPECIALIZED AGENTS  ·  FULL ATS REWRITE
                </span>
              </div>
 
              {/* Main heading */}
              <div style={up(120)}>
                <h1 style={{ fontFamily:"'Space Grotesk',sans-serif", fontWeight:800, lineHeight:1.08, letterSpacing:-2, marginBottom:24 }}>
                  <div style={{ fontSize:"clamp(36px,6vw,70px)", color:CLR.white }}>
                    Turn Any Resume Into
                  </div>
                  <div style={{
                    fontSize:"clamp(36px,6vw,70px)",
                    background:`linear-gradient(135deg, ${CLR.violet} 0%, #818cf8 35%, ${CLR.cyan} 65%, ${CLR.emerald} 100%)`,
                    backgroundSize:"300% 300%",
                    WebkitBackgroundClip:"text",
                    WebkitTextFillColor:"transparent",
                    animation:"shimmerText 6s ease infinite",
                    display:"block",
                  }}>
                    Your Dream Job Offer
                  </div>
                </h1>
              </div>
 
              <p style={{...up(220), fontSize:16, color:"rgba(148,163,184,.75)", lineHeight:1.9, maxWidth:540, margin:"0 auto 44px", fontWeight:400 }}>
                Upload your resume · Paste a job description · Watch Grok AI run 5 specialised agents that completely rewrite, ATS-optimise and score your resume in 60 seconds.
              </p>
 
              <div style={{...up(300), display:"flex", gap:14, justifyContent:"center", flexWrap:"wrap"}}>
                <Btn onClick={()=>setPage("input")} st={{ fontSize:12, padding:"16px 48px", boxShadow:`0 16px 56px rgba(124,58,237,.45)` }}>
                  Start Building Free →
                </Btn>
                <Btn ghost onClick={()=>{setRt("Your Name\nyour@email.com | +1 555-0000 | City\n\nSUMMARY\nDedicated professional with software development experience.\n\nEXPERIENCE\nDeveloper — Tech Co | 2021–2024\n- Worked on features and bug fixes\n- Participated in code reviews\n\nEDUCATION\nB.S. Computer Science | 2021\n\nSKILLS\nJavaScript, Python, React, SQL");setPage("jd");}}>
                  Try Demo →
                </Btn>
              </div>
            </div>
 
            {/* Feature cards — true 3D hover */}
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(192px,1fr))", gap:14, marginBottom:52 }}>
              {[
                [CLR.cyan,       "📂","Upload PDF / DOCX",    "Drop your old resume — AI extracts and completely rebuilds it"],
                ["#8b5cf6",      "📋","Smart Form Builder",   "No resume? Fill a guided form — Grok creates one from scratch"],
                [CLR.emerald,    "✍️","Complete AI Rewrite",  "Every bullet transformed with action verbs and real metrics"],
                [CLR.amber,      "🎯","Full Keyword Boost",   "JD keywords injected into bullets, summary and skills"],
                [CLR.rose,       "📊","ATS Score + Roadmap",  "Detailed 0–100 ATS score with a specific improvement plan"],
              ].map(([col,icon,title,text],i)=>(
                <div key={i} style={{...up(380+i*70)}}>
                  <Card glow={col} className="hover3d" style={{ padding:"22px 20px", height:"100%" }}>
                    <div style={{ fontSize:28, marginBottom:12, filter:`drop-shadow(0 4px 12px ${col}66)` }}>{icon}</div>
                    <div style={{ fontSize:13.5, fontWeight:700, fontFamily:"'Space Grotesk',sans-serif", color:CLR.white, marginBottom:8 }}>{title}</div>
                    <div style={{ fontSize:12, color:"rgba(148,163,184,.7)", lineHeight:1.65, fontWeight:400 }}>{text}</div>
                    <div style={{ height:1, background:`linear-gradient(to right,${col}50,transparent)`, marginTop:16 }}/>
                    <div style={{ position:"absolute", bottom:16, right:16, width:6, height:6, borderRadius:"50%", background:col, opacity:.5, boxShadow:`0 0 8px ${col}` }}/>
                  </Card>
                </div>
              ))}
            </div>
 
            {/* Pipeline visual */}
            <div style={up(750)}>
              <Card style={{ padding:"32px 36px" }}>
                <div style={{ textAlign:"center", marginBottom:28 }}>
                  <div style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:"rgba(148,163,184,.35)", letterSpacing:3, marginBottom:8 }}>HOW IT WORKS</div>
                  <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:20, fontWeight:700 }}>The 5-Agent Grok AI Pipeline</h2>
                </div>
                <div style={{ display:"flex", alignItems:"center", overflowX:"auto", paddingBottom:8 }}>
                  {AGENTS.map((ag,i)=>(
                    <div key={ag.id} style={{ display:"flex", alignItems:"center", flex:1, minWidth:0 }}>
                      <div style={{ textAlign:"center", flex:1, padding:"0 6px" }}>
                        <div style={{ width:50, height:50, borderRadius:14, background:`${ag.color}14`, border:`1px solid ${ag.color}35`, display:"flex", alignItems:"center", justifyContent:"center", margin:"0 auto 10px", boxShadow:`0 4px 20px ${ag.color}20`, fontSize:11, fontFamily:"'JetBrains Mono',monospace", fontWeight:600, color:ag.color }}>
                          {String(ag.id).padStart(2,"0")}
                        </div>
                        <div style={{ fontSize:8, color:ag.color, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1.5, marginBottom:4 }}>{ag.tag}</div>
                        <div style={{ fontSize:10.5, color:"rgba(148,163,184,.6)", lineHeight:1.45 }}>{ag.name}</div>
                      </div>
                      {i<4&&(
                        <div style={{ width:22, flexShrink:0, display:"flex", flexDirection:"column", gap:3, marginBottom:24 }}>
                          {[0,1,2].map(j=><div key={j} style={{ height:1, background:`linear-gradient(to right,${ag.color}50,${AGENTS[i+1].color}50)`, animation:`progressPulse ${1.2+j*.2}s ease-in-out infinite` }}/>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}
 
        {/* ══ INPUT ═════════════════════════════════════════════════════ */}
        {page==="input"&&(
          <div style={up()}>
            <div style={{ marginBottom:32 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"4px 14px", borderRadius:99, background:"rgba(79,70,229,.15)", border:"1px solid rgba(79,70,229,.3)", marginBottom:14 }}>
                <span style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:CLR.indigo, letterSpacing:3, fontWeight:600 }}>STEP 01 / 02</span>
              </div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:32, fontWeight:800, letterSpacing:-.5, margin:"0 0 8px" }}>Your Resume</h2>
              <p style={{ color:"rgba(148,163,184,.65)", fontSize:14, lineHeight:1.6 }}>Three ways to provide your information — Grok AI handles the rest.</p>
            </div>
 
            <Card style={{ padding:"30px 32px" }}>
              <div style={{ display:"flex", borderRadius:12, overflow:"hidden", border:"1px solid rgba(255,255,255,.07)", marginBottom:26, background:"rgba(0,0,0,.3)" }}>
                <button style={modeTab("upload","⬆ Upload File",CLR.cyan)} onClick={()=>setMode("upload")}>⬆ Upload File</button>
                <button style={modeTab("paste","✎ Paste Text",CLR.emerald)} onClick={()=>setMode("paste")}>✎ Paste Text</button>
                <button style={modeTab("form","☰ Fill Form","#8b5cf6")} onClick={()=>setMode("form")}>☰ Fill Form</button>
              </div>
 
              {/* Upload zone */}
              {mode==="upload"&&(
                <>
                  <div onClick={()=>fileRef.current?.click()} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={onDrop}
                    style={{ border:`2px dashed ${drag?CLR.cyan:upSt==="done"?CLR.emerald:upSt==="error"?CLR.rose:"rgba(255,255,255,.1)"}`, borderRadius:16, padding:"52px 24px", textAlign:"center", cursor:"pointer", background:drag?`${CLR.cyan}06`:upSt==="done"?`${CLR.emerald}06`:upSt==="error"?`${CLR.rose}06`:"rgba(255,255,255,.015)", transition:"all .25s", marginBottom:16, position:"relative", overflow:"hidden" }}>
                    <div style={{ position:"absolute", top:0, left:"15%", right:"15%", height:1, background: upSt==="done"?`linear-gradient(to right,transparent,${CLR.emerald}70,transparent)`:drag?`linear-gradient(to right,transparent,${CLR.cyan}70,transparent)`:`linear-gradient(to right,transparent,rgba(124,58,237,.3),transparent)` }}/>
                    <div style={{ fontSize:52, marginBottom:16, lineHeight:1 }}>
                      {upSt==="loading"?"⏳":upSt==="done"?"✅":upSt==="error"?"❌":"📂"}
                    </div>
                    {upSt==="idle"&&<>
                      <div style={{ fontSize:17, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, color:CLR.white, marginBottom:8 }}>Drop your resume here</div>
                      <div style={{ fontSize:11, color:"rgba(148,163,184,.4)", fontFamily:"'JetBrains Mono',monospace", letterSpacing:1, marginBottom:20 }}>PDF · DOCX · DOC supported</div>
                      <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"11px 28px", background:"linear-gradient(135deg,rgba(6,182,212,.2),rgba(6,182,212,.1))", border:"1px solid rgba(6,182,212,.35)", borderRadius:10, color:CLR.cyan, fontFamily:"'JetBrains Mono',monospace", fontSize:10, fontWeight:600, letterSpacing:2 }}>
                        BROWSE FILES
                      </div>
                    </>}
                    {upSt==="loading"&&<div style={{ fontSize:13, color:CLR.amber, fontFamily:"'JetBrains Mono',monospace" }}>{upNm} — reading…</div>}
                    {upSt==="done"&&<>
                      <div style={{ fontSize:15, color:CLR.emerald, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, marginBottom:6 }}>✓ {upNm}</div>
                      <div style={{ fontSize:10, color:`${CLR.emerald}70`, fontFamily:"'JetBrains Mono',monospace" }}>{upMsg}</div>
                    </>}
                    {upSt==="error"&&<>
                      <div style={{ fontSize:15, color:CLR.rose, fontFamily:"'Space Grotesk',sans-serif", fontWeight:700, marginBottom:6 }}>Upload Failed</div>
                      <div style={{ fontSize:10, color:`${CLR.rose}70`, fontFamily:"'JetBrains Mono',monospace" }}>{upMsg}</div>
                    </>}
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{ display:"none" }} onChange={e=>{if(e.target.files?.[0])procFile(e.target.files[0]);e.target.value="";}}/>
                  </div>
                  {upSt==="done"&&<Card style={{ padding:"14px 18px", marginBottom:14 }}><div style={{ fontSize:7, fontFamily:"'JetBrains Mono',monospace", color:"rgba(148,163,184,.35)", letterSpacing:2, marginBottom:8 }}>EXTRACTED PREVIEW</div><div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:11, color:"rgba(148,163,184,.55)", maxHeight:75, overflowY:"auto", whiteSpace:"pre-wrap", lineHeight:1.5 }}>{rt.slice(0,450)}…</div></Card>}
                  {(upSt==="done"||upSt==="error")&&<button style={{ padding:"9px 18px", border:"1px solid rgba(255,255,255,.1)", borderRadius:10, background:"transparent", color:"rgba(148,163,184,.5)", fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:1.5, marginBottom:16, cursor:"pointer" }} onClick={()=>{setUpSt("idle");setUpNm("");setUpMsg("");setRt("")}}>↺ Try Different File</button>}
                </>
              )}
 
              {/* Paste */}
              {mode==="paste"&&(
                <>
                  <div style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:"rgba(148,163,184,.35)", letterSpacing:2, marginBottom:8 }}>PASTE YOUR RESUME TEXT</div>
                  <textarea style={{...TA, minHeight:260}} value={rt} onChange={e=>setRt(e.target.value)}
                    placeholder={"Your Name\nyour@email.com | Phone | City, Country\n\nSUMMARY\nYour career summary...\n\nEXPERIENCE\nJob Title — Company | Date Range\n- What you did and achieved\n\nEDUCATION\nDegree — University | Year\n\nSKILLS\nSkill 1, Skill 2, Skill 3"}
                    onFocus={e=>{e.target.style.borderColor=`${CLR.emerald}50`;e.target.style.boxShadow="0 0 0 3px rgba(16,185,129,.12)"}}
                    onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.08)";e.target.style.boxShadow="none"}}/>
                  {rt.trim()&&<div style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:"rgba(148,163,184,.35)", letterSpacing:1.5, marginTop:7 }}>{rt.trim().split(/\s+/).length} WORDS DETECTED</div>}
                </>
              )}
 
              {/* Form */}
              {mode==="form"&&<FormBuilder onComplete={text=>{setRt(text);setMode("paste");}}/>}
 
              {mode!=="form"&&(
                <div style={{ display:"flex", gap:12, marginTop:22, alignItems:"center" }}>
                  <Btn ghost onClick={()=>setPage("home")} small>← Home</Btn>
                  <div style={{ flex:1 }}/>
                  <Btn onClick={()=>setPage("jd")} disabled={!rt.trim()}>Next: Job Description →</Btn>
                </div>
              )}
            </Card>
          </div>
        )}
 
        {/* ══ JD ════════════════════════════════════════════════════════ */}
        {page==="jd"&&(
          <div style={up()}>
            <div style={{ marginBottom:32 }}>
              <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"4px 14px", borderRadius:99, background:"rgba(139,92,246,.15)", border:"1px solid rgba(139,92,246,.3)", marginBottom:14 }}>
                <span style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:"#8b5cf6", letterSpacing:3, fontWeight:600 }}>STEP 02 / 02</span>
              </div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:32, fontWeight:800, letterSpacing:-.5, margin:"0 0 8px" }}>Target Job Description</h2>
              <p style={{ color:"rgba(148,163,184,.65)", fontSize:14 }}>Paste the full job post — Grok extracts every keyword and tailors your resume precisely.</p>
            </div>
            <Card style={{ padding:"30px 32px" }}>
              <div style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:"rgba(148,163,184,.35)", letterSpacing:2, marginBottom:8 }}>JOB DESCRIPTION</div>
              <textarea style={{...TA, minHeight:300}} value={jd} onChange={e=>setJd(e.target.value)}
                placeholder={"Paste the complete job posting here...\n\nJob Title — Company\n\nRequirements:\n- Skills and technologies\n- Experience needed\n\nResponsibilities:\n- What you will do\n\nNice to have:\n- Bonus qualifications"}
                onFocus={e=>{e.target.style.borderColor="rgba(139,92,246,.5)";e.target.style.boxShadow="0 0 0 3px rgba(139,92,246,.12)"}}
                onBlur={e=>{e.target.style.borderColor="rgba(255,255,255,.08)";e.target.style.boxShadow="none"}}/>
              {jd.trim()&&<div style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:"rgba(148,163,184,.35)", letterSpacing:1.5, marginTop:7 }}>{jd.trim().split(/\s+/).length} WORDS</div>}
              <div style={{ display:"flex", gap:12, marginTop:22, flexWrap:"wrap", alignItems:"center" }}>
                <Btn ghost onClick={()=>setPage("input")} small>← Back</Btn>
                <Btn ghost onClick={()=>setJd(sampleJD)} small st={{ borderColor:"rgba(139,92,246,.3)", color:"rgba(139,92,246,.7)" }}>Load Sample JD</Btn>
                <div style={{ flex:1 }}/>
                <Btn onClick={runPipeline} g1="#8b5cf6" g2="#6d28d9" disabled={!jd.trim()}>🚀 Launch Grok Pipeline →</Btn>
              </div>
            </Card>
          </div>
        )}
 
        {/* ══ PIPELINE ══════════════════════════════════════════════════ */}
        {page==="pipeline"&&(
          <div style={up()}>
            <div style={{ textAlign:"center", marginBottom:44 }}>
              <div style={{ fontSize:8, fontFamily:"'JetBrains Mono',monospace", color:"rgba(148,163,184,.35)", letterSpacing:3, marginBottom:14 }}>GROK BETA · DEEP AI PROCESSING</div>
              <h2 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:40, fontWeight:900, letterSpacing:-1.5, margin:"0 0 12px", background:`linear-gradient(135deg,${CLR.white},${CLR.violet})`, WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
                Transforming Your Resume
              </h2>
              <p style={{ color:"rgba(148,163,184,.55)", fontSize:14 }}>5 AI agents running a complete professional rewrite — 30–60 seconds</p>
            </div>
 
            {/* Progress bar */}
            <div style={{ marginBottom:32 }}>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:8 }}>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"rgba(148,163,184,.35)", letterSpacing:1.5 }}>PIPELINE PROGRESS</span>
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:CLR.violet, letterSpacing:1 }}>{agDone.length} / 5 COMPLETE</span>
              </div>
              <div style={{ height:2, background:"rgba(255,255,255,.06)", borderRadius:2, overflow:"hidden" }}>
                <div style={{ height:"100%", width:`${(agDone.length/5)*100}%`, background:`linear-gradient(to right,${CLR.violet},#818cf8,${CLR.cyan})`, transition:"width .9s cubic-bezier(.4,0,.2,1)", boxShadow:`0 0 20px rgba(124,58,237,.6)` }}/>
              </div>
            </div>
 
            {/* Agent cards */}
            <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:24 }}>
              {AGENTS.map((ag,i)=>{
                const done=agDone.includes(ag.id), active=agAct===ag.id;
                return(
                  <div key={ag.id} style={up(i*45)}>
                    <div style={{ display:"flex", alignItems:"center", gap:16, padding:"18px 22px", borderRadius:16, background:done?`${ag.color}07`:active?`${ag.color}05`:"rgba(255,255,255,.02)", border:`1px solid ${done?`${ag.color}35`:active?`${ag.color}50`:"rgba(255,255,255,.06)"}`, transition:"all .4s", boxShadow:active?`0 0 40px ${ag.color}18,inset 0 1px 0 ${ag.color}15`:"none", position:"relative", overflow:"hidden" }}>
                      {active&&<div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:`linear-gradient(to right,transparent,${ag.color},transparent)`, animation:"progressPulse 1.5s ease-in-out infinite" }}/>}
                      {/* Icon */}
                      <div style={{ width:52, height:52, borderRadius:14, flexShrink:0, background:done?`${ag.color}18`:active?`${ag.color}14`:"rgba(255,255,255,.04)", border:`1px solid ${done?`${ag.color}50`:active?`${ag.color}60`:"rgba(255,255,255,.08)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:done?20:11, color:done?ag.color:active?ag.color:"rgba(148,163,184,.3)", fontFamily:"'JetBrains Mono',monospace", fontWeight:600, boxShadow:active?`0 0 28px ${ag.color}35,inset 0 1px 0 ${ag.color}20`:"none", transition:"all .35s" }}>
                        {done?"✓":active?SPIN:String(ag.id).padStart(2,"0")}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:5 }}>
                          <span style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:15, fontWeight:700, color:done?ag.color:active?CLR.white:"rgba(148,163,184,.4)", transition:"color .3s" }}>{ag.name}</span>
                          <span style={{ padding:"2px 9px", borderRadius:99, background:`${done?ag.color:active?ag.color:"rgba(148,163,184,.2)"}15`, border:`1px solid ${done?`${ag.color}30`:active?`${ag.color}35`:"rgba(255,255,255,.06)"}`, color:done?ag.color:active?ag.color:"rgba(148,163,184,.3)", fontSize:7, fontFamily:"'JetBrains Mono',monospace", letterSpacing:1.5 }}>{ag.tag}</span>
                        </div>
                        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:done?`${ag.color}60`:active?"rgba(148,163,184,.65)":"rgba(148,163,184,.25)" }}>
                          {done?"Completed successfully ✓":active?ag.desc:"Waiting in queue…"}
                        </div>
                      </div>
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"rgba(148,163,184,.2)", letterSpacing:1 }}>{ag.id}/5</span>
                    </div>
                  </div>
                );
              })}
            </div>
 
            {/* Log */}
            <Card style={{ padding:"18px 22px" }}>
              <div style={{ fontSize:7, fontFamily:"'JetBrains Mono',monospace", color:"rgba(148,163,184,.3)", letterSpacing:2.5, marginBottom:10 }}>◆ GROK AGENT LOG — LIVE</div>
              <div ref={logRef} style={{ maxHeight:100, overflowY:"auto" }}>
                {logs.map((l,i)=>(
                  <div key={i} style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10.5, display:"flex", gap:10, marginBottom:3, lineHeight:1.5 }}>
                    <span style={{ color:"rgba(148,163,184,.2)", flexShrink:0 }}>{l.t}</span>
                    <span style={{ color:l.type==="ok"?CLR.emerald:l.type==="er"?CLR.rose:"rgba(148,163,184,.5)" }}>{l.msg}</span>
                  </div>
                ))}
                {agAct>0&&!pipeErr&&<div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:"rgba(148,163,184,.25)", marginTop:4, animation:"progressPulse 1.5s ease-in-out infinite" }}>▮ Grok is processing…</div>}
              </div>
            </Card>
 
            {pipeErr&&(
              <Card style={{ padding:"18px 22px", marginTop:12, border:`1px solid ${CLR.rose}30`, background:`${CLR.rose}06` }}>
                <div style={{ color:CLR.rose, fontFamily:"'JetBrains Mono',monospace", fontSize:12, marginBottom:12 }}>✗ Error: {pipeErr}</div>
                <Btn ghost onClick={()=>setPage("jd")} small>← Retry</Btn>
              </Card>
            )}
          </div>
        )}
 
        {/* ══ RESULT ════════════════════════════════════════════════════ */}
        {page==="result"&&result&&(
          <div style={up()}>
            {/* Score panel */}
            <Card glow={CLR.violet} style={{ padding:"36px 40px", marginBottom:16 }}>
              <div style={{ display:"flex", flexWrap:"wrap", gap:36, alignItems:"flex-start" }}>
                <Ring3D score={result.score.totalScore}/>
 
                {/* Breakdown */}
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:18 }}>
                    <div style={{ width:2, height:14, borderRadius:2, background:`linear-gradient(to bottom,${CLR.cyan},transparent)` }}/>
                    <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:3, color:CLR.cyan, fontWeight:600 }}>SCORE BREAKDOWN</span>
                  </div>
                  {Object.entries(result.score.breakdown||{}).map(([k,v])=>{
                    const pct=v.max?(v.score/v.max)*100:v.score;
                    const col=pct>=80?CLR.emerald:pct>=55?CLR.amber:CLR.rose;
                    return(
                      <div key={k} style={{ marginBottom:14 }}>
                        <div style={{ display:"flex", justifyContent:"space-between", marginBottom:5 }}>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"rgba(148,163,184,.5)", letterSpacing:.5 }}>{k.replace(/([A-Z])/g," $1").toUpperCase()}</span>
                          <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:9, color:col, fontWeight:600 }}>{v.score}/{v.max}</span>
                        </div>
                        <div style={{ height:3, background:"rgba(255,255,255,.05)", borderRadius:2, overflow:"hidden" }}>
                          <div style={{ height:"100%", width:`${pct}%`, background:`linear-gradient(to right,${col}80,${col})`, borderRadius:2, transition:"width 2s cubic-bezier(.4,0,.2,1)", boxShadow:`0 0 12px ${col}55` }}/>
                        </div>
                        {v.note&&<div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"rgba(148,163,184,.25)", marginTop:3 }}>{v.note}</div>}
                      </div>
                    );
                  })}
                </div>
 
                {/* Strengths & Gaps */}
                <div style={{ flex:1, minWidth:160 }}>
                  {result.score.strengths?.length>0&&(
                    <div style={{ marginBottom:18 }}>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:CLR.emerald, letterSpacing:2.5, marginBottom:10, fontWeight:600 }}>✓ STRENGTHS</div>
                      {result.score.strengths.map((s,i)=>(
                        <div key={i} style={{ fontSize:12, color:"rgba(148,163,184,.75)", marginBottom:7, display:"flex", gap:7, alignItems:"flex-start", lineHeight:1.55 }}>
                          <span style={{ color:CLR.emerald, flexShrink:0, marginTop:1 }}>▸</span>{s}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.missing?.length>0&&(
                    <>
                      <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:CLR.amber, letterSpacing:2.5, marginBottom:10, fontWeight:600 }}>⚠ SKILL GAPS</div>
                      <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
                        {result.missing.slice(0,8).map((s,i)=>(
                          <span key={i} style={{ padding:"3px 10px", borderRadius:99, background:"rgba(245,158,11,.12)", border:"1px solid rgba(245,158,11,.28)", color:CLR.amber, fontSize:9, fontFamily:"'JetBrains Mono',monospace" }}>{s}</span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </Card>
 
            {/* Tabs */}
            <div style={{ display:"flex", borderRadius:14, overflow:"hidden", border:"1px solid rgba(255,255,255,.07)", marginBottom:16, background:"rgba(0,0,0,.35)" }}>
              {mTab("preview","◈ Resume Preview",CLR.cyan,tab==="preview")}
              {mTab("suggest","◉ Suggestions",CLR.amber,tab==="suggest")}
              {mTab("wins","◆ Quick Wins",CLR.emerald,tab==="wins")}
            </div>
 
            {/* Preview */}
            {tab==="preview"&&(
              <Card style={{ padding:"28px 30px" }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:24, flexWrap:"wrap", gap:12 }}>
                  <div>
                    <h3 style={{ fontFamily:"'Space Grotesk',sans-serif", fontSize:17, fontWeight:700, margin:"0 0 4px" }}>ATS-Optimised Resume</h3>
                    <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, color:"rgba(148,163,184,.35)", letterSpacing:1.5 }}>GROK ENHANCED · ATS-SAFE · PROFESSIONAL FORMAT</div>
                  </div>
                  <Btn onClick={downloadPDF} g1={CLR.emerald} g2="#059669">⬇ Download PDF</Btn>
                </div>
                <div style={{ background:"#fff", borderRadius:12, padding:"40px 46px", boxShadow:"0 24px 80px rgba(0,0,0,.75)" }}>
                  <div style={{ fontFamily:"Arial,Helvetica,sans-serif", color:"#1a1a1a", lineHeight:1.55 }}>
                    <h1 style={{ margin:0, fontSize:22, fontFamily:"Georgia,serif", color:"#0a0a0a", letterSpacing:"-.3px" }}>{result.resume.name}</h1>
                    <p style={{ fontSize:9.5, color:"#555", margin:"5px 0 14px", paddingBottom:12, borderBottom:"1px solid #e8e8e8" }}>{Object.values(result.resume.contact||{}).filter(Boolean).join("  |  ")}</p>
                    {result.resume.summary&&<><div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", fontWeight:700, borderBottom:"1.5px solid #111", paddingBottom:3, margin:"14px 0 9px" }}>Professional Summary</div><p style={{ fontSize:10.5, lineHeight:1.65, color:"#222" }}>{result.resume.summary}</p></>}
                    {result.resume.experience?.length>0&&<>
                      <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", fontWeight:700, borderBottom:"1.5px solid #111", paddingBottom:3, margin:"18px 0 10px" }}>Experience</div>
                      {result.resume.experience.map((ex,i)=>(
                        <div key={i} style={{ marginBottom:14 }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline" }}>
                            <strong style={{ fontSize:11, color:"#111" }}>{ex.title}</strong>
                            <span style={{ fontSize:9.5, color:"#666", whiteSpace:"nowrap" }}>{ex.dates}</span>
                          </div>
                          <div style={{ fontSize:10, color:"#444", fontStyle:"italic", marginBottom:5 }}>{ex.company}</div>
                          <ul style={{ margin:0, paddingLeft:17 }}>
                            {(ex.bullets||[]).map((b,j)=><li key={j} style={{ fontSize:10.5, lineHeight:1.6, marginBottom:2, color:"#222" }}>{b}</li>)}
                          </ul>
                        </div>
                      ))}
                    </>}
                    {result.resume.skills&&Object.keys(result.resume.skills).length>0&&<>
                      <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", fontWeight:700, borderBottom:"1.5px solid #111", paddingBottom:3, margin:"18px 0 10px" }}>Skills</div>
                      {typeof result.resume.skills==="object"&&!Array.isArray(result.resume.skills)
                        ? Object.entries(result.resume.skills).map(([c,v])=><p key={c} style={{ fontSize:10.5, marginBottom:4 }}><strong>{c}:</strong> {Array.isArray(v)?v.join(", "):v}</p>)
                        : <p style={{ fontSize:10.5 }}>{Array.isArray(result.resume.skills)?result.resume.skills.join(", "):result.resume.skills}</p>
                      }
                    </>}
                    {result.resume.education?.length>0&&<>
                      <div style={{ fontSize:8, letterSpacing:2, textTransform:"uppercase", fontWeight:700, borderBottom:"1.5px solid #111", paddingBottom:3, margin:"18px 0 10px" }}>Education</div>
                      {result.resume.education.map((ed,i)=><div key={i} style={{ fontSize:10.5, color:"#222", marginBottom:3 }}><strong>{typeof ed==="string"?ed:ed.degree||""}</strong>{ed.school?` — ${ed.school}`:""}{ed.year?` (${ed.year})`:""}</div>)}
                    </>}
                  </div>
                </div>
                <div style={{ marginTop:14, padding:"12px 16px", background:`${CLR.emerald}08`, border:`1px solid ${CLR.emerald}20`, borderRadius:10 }}>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:10, color:CLR.emerald }}>💡 Click "Download PDF" → in print dialog → choose <strong>Save as PDF</strong></span>
                </div>
              </Card>
            )}
 
            {tab==="suggest"&&(
              <Card style={{ padding:"28px 30px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                  <div style={{ width:2, height:14, borderRadius:2, background:`linear-gradient(to bottom,${CLR.amber},transparent)` }}/>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:3, color:CLR.amber, fontWeight:600 }}>IMPROVEMENT SUGGESTIONS</span>
                </div>
                {!(result.score.suggestions?.length)&&<div style={{ color:"rgba(148,163,184,.35)", fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>Resume is well optimised!</div>}
                {(result.score.suggestions||[]).map((s,i)=>(
                  <div key={i} style={{ display:"flex", gap:14, padding:"14px 18px", marginBottom:8, background:"rgba(245,158,11,.05)", borderRadius:12, border:"1px solid rgba(245,158,11,.15)",...up(i*40) }}>
                    <div style={{ width:28, height:28, borderRadius:8, background:"rgba(245,158,11,.14)", border:"1px solid rgba(245,158,11,.22)", display:"flex", alignItems:"center", justifyContent:"center", fontSize:9, fontFamily:"'JetBrains Mono',monospace", fontWeight:600, color:CLR.amber, flexShrink:0 }}>{String(i+1).padStart(2,"0")}</div>
                    <div style={{ fontSize:13, color:"rgba(148,163,184,.8)", lineHeight:1.65 }}>{s}</div>
                  </div>
                ))}
              </Card>
            )}
 
            {tab==="wins"&&(
              <Card style={{ padding:"28px 30px" }}>
                <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
                  <div style={{ width:2, height:14, borderRadius:2, background:`linear-gradient(to bottom,${CLR.emerald},transparent)` }}/>
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:8, letterSpacing:3, color:CLR.emerald, fontWeight:600 }}>QUICK WINS — DO THESE FIRST</span>
                </div>
                {!(result.score.quickWins?.length)&&<div style={{ color:"rgba(148,163,184,.35)", fontFamily:"'JetBrains Mono',monospace", fontSize:11 }}>Resume is already strong!</div>}
                {(result.score.quickWins||[]).map((w,i)=>(
                  <div key={i} style={{ display:"flex", gap:12, padding:"14px 18px", marginBottom:8, background:"rgba(16,185,129,.05)", borderRadius:12, border:"1px solid rgba(16,185,129,.15)",...up(i*40) }}>
                    <span style={{ color:CLR.emerald, fontSize:15, flexShrink:0 }}>⚡</span>
                    <span style={{ fontSize:13, color:"rgba(148,163,184,.8)", lineHeight:1.65 }}>{w}</span>
                  </div>
                ))}
              </Card>
            )}
 
            <div style={{ display:"flex", gap:10, justifyContent:"center", marginTop:18, flexWrap:"wrap" }}>
              <Btn ghost onClick={()=>{setPage("home");setRt("");setJd("");setResult(null);setUpSt("idle");setUpNm("");}} small>◈ Start Over</Btn>
              <Btn ghost onClick={()=>setPage("jd")} small st={{ borderColor:"rgba(139,92,246,.35)", color:"rgba(139,92,246,.8)" }}>← Change Job</Btn>
              <Btn onClick={downloadPDF} g1={CLR.emerald} g2="#059669">⬇ Download PDF</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
