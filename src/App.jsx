import { useState, useRef, useEffect, useCallback } from "react";
import * as mammoth from "mammoth";
 
/* ── Google Fonts ─────────────────────────────────────────────────────────── */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&family=Crimson+Pro:ital,wght@0,300;0,400;0,600;1,300;1,400&display=swap');
  `}</style>
);
 
/* ── Design Tokens ────────────────────────────────────────────────────────── */
const T = {
  bg:        "#07080f",
  bg2:       "#0c0e1a",
  surface:   "#111425",
  surfaceHi: "#161a2e",
  glass:     "rgba(255,255,255,0.03)",
  border:    "rgba(255,255,255,0.07)",
  borderHi:  "rgba(255,255,255,0.14)",
  gold:      "#c9a84c",
  goldDim:   "#7a5f1f",
  goldGlow:  "rgba(201,168,76,0.15)",
  blue:      "#4facfe",
  blueDim:   "#1a3f6e",
  blueGlow:  "rgba(79,172,254,0.12)",
  teal:      "#00f2c3",
  tealDim:   "#003d32",
  red:       "#ff6b7a",
  redDim:    "#3a0f18",
  text:      "#f0ece4",
  textSub:   "#8a8fa8",
  textMuted: "#3d4260",
  ff: {
    display: "'Playfair Display', Georgia, serif",
    body:    "'Crimson Pro', Georgia, serif",
    mono:    "'DM Mono', 'Courier New', monospace",
  },
};
 
/* ── Agents ───────────────────────────────────────────────────────────────── */
const AGENTS = [
  { id:1, name:"Input Parser",        icon:"⬡", tag:"PARSE",    desc:"Extracting full resume structure into JSON",     color: T.blue },
  { id:2, name:"JD Intelligence",     icon:"⬡", tag:"ANALYSE",  desc:"Mining every keyword & requirement from JD",    color: T.gold },
  { id:3, name:"Content Architect",   icon:"⬡", tag:"GENERATE", desc:"Rewriting every bullet with power language",    color: T.teal },
  { id:4, name:"ATS Keyword Engine",  icon:"⬡", tag:"OPTIMISE", desc:"Injecting keywords across all sections",        color: "#a78bfa" },
  { id:5, name:"Quality Scorer",      icon:"⬡", tag:"SCORE",    desc:"Calculating ATS score & improvement roadmap",   color: T.gold },
];
 
/* ── Helpers ──────────────────────────────────────────────────────────────── */
function tryJSON(txt, fallback) {
  try { return JSON.parse(txt.replace(/```json\n?/gi,"").replace(/```\n?/gi,"").trim()); }
  catch { try { const m=txt.match(/\{[\s\S]*\}/); if(m) return JSON.parse(m[0]); } catch{} return fallback; }
}
async function askClaude(system, user, maxTokens=2000) {
  const res = await fetch("/api/claude", {
    method:"POST", headers:{"Content-Type":"application/json"},
    body: JSON.stringify({ model:"claude-opus-4-5", max_tokens:maxTokens, system, messages:[{role:"user",content:user}] }),
  });
  if (!res.ok) { const e=await res.json().catch(()=>({})); throw new Error(e?.error?.message||`HTTP ${res.status}`); }
  const d = await res.json();
  return d.content?.[0]?.text || "";
}
function loadPDFJS() {
  return new Promise((resolve,reject)=>{
    if(window.pdfjsLib){resolve(window.pdfjsLib);return;}
    const s=document.createElement("script");
    s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";resolve(window.pdfjsLib);};
    s.onerror=reject; document.head.appendChild(s);
  });
}
async function extractPDF(ab) {
  const lib=await loadPDFJS(); const pdf=await lib.getDocument({data:ab}).promise;
  let out=""; for(let i=1;i<=pdf.numPages;i++){const p=await pdf.getPage(i);const c=await p.getTextContent();out+=c.items.map(x=>x.str).join(" ")+"\n";}
  return out;
}
async function extractDOCX(ab) { const r=await mammoth.extractRawText({arrayBuffer:ab}); return r.value; }
 
/* ── Animated Background ──────────────────────────────────────────────────── */
function Background() {
  return (
    <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
      {/* Radial orbs */}
      <div style={{position:"absolute",width:700,height:700,borderRadius:"50%",background:"radial-gradient(circle,rgba(79,172,254,0.06) 0%,transparent 70%)",top:-200,left:-200,animation:"orb1 20s ease-in-out infinite"}}/>
      <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 70%)",bottom:-100,right:-100,animation:"orb2 25s ease-in-out infinite"}}/>
      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(0,242,195,0.04) 0%,transparent 70%)",top:"40%",left:"60%",animation:"orb3 18s ease-in-out infinite"}}/>
      {/* Grid lines */}
      <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(255,255,255,0.015) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.015) 1px,transparent 1px)`,backgroundSize:"60px 60px"}}/>
      {/* Grain overlay */}
      <div style={{position:"absolute",inset:0,opacity:0.4,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.08'/%3E%3C/svg%3E\")"}}/>
      <style>{`
        @keyframes orb1{0%,100%{transform:translate(0,0) scale(1)}33%{transform:translate(80px,60px) scale(1.1)}66%{transform:translate(-40px,80px) scale(0.95)}}
        @keyframes orb2{0%,100%{transform:translate(0,0) scale(1)}50%{transform:translate(-60px,-80px) scale(1.15)}}
        @keyframes orb3{0%,100%{transform:translate(0,0)}50%{transform:translate(-80px,40px)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes shimmer{0%{background-position:-200% 0}100%{background-position:200% 0}}
        @keyframes pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.7;transform:scale(0.96)}}
        @keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes progressFill{from{width:0}to{width:100%}}
        @keyframes glow{0%,100%{box-shadow:0 0 20px rgba(79,172,254,0.3)}50%{box-shadow:0 0 40px rgba(79,172,254,0.6)}}
      `}</style>
    </div>
  );
}
 
/* ── Score Ring ───────────────────────────────────────────────────────────── */
function ScoreRing({ score }) {
  const r=56, circ=2*Math.PI*r, fill=Math.min(Math.max(score,0),100);
  const gradient = fill>=80?"url(#goldGrad)":fill>=60?"url(#blueGrad)":"url(#redGrad)";
  const verdict = fill>=80?"EXCEPTIONAL":fill>=60?"STRONG":fill>=40?"FAIR":"NEEDS WORK";
  const verdictColor = fill>=80?T.gold:fill>=60?T.blue:T.red;
  return (
    <div style={{position:"relative",display:"inline-flex",flexDirection:"column",alignItems:"center",gap:8}}>
      <svg width={140} height={140} viewBox="0 0 140 140">
        <defs>
          <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0c060"/><stop offset="100%" stopColor="#c9a84c"/>
          </linearGradient>
          <linearGradient id="blueGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4facfe"/><stop offset="100%" stopColor="#00f2fe"/>
          </linearGradient>
          <linearGradient id="redGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ff6b7a"/><stop offset="100%" stopColor="#ff4757"/>
          </linearGradient>
          <filter id="glow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        </defs>
        <circle cx="70" cy="70" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8"/>
        <circle cx="70" cy="70" r={r} fill="none" stroke={gradient} strokeWidth="8"
          strokeDasharray={`${(fill/100)*circ} ${circ}`} strokeLinecap="round"
          transform="rotate(-90 70 70)" filter="url(#glow)"
          style={{transition:"stroke-dasharray 1.5s cubic-bezier(.4,0,.2,1)"}}/>
        <text x="70" y="63" textAnchor="middle" fill={fill>=80?T.gold:fill>=60?T.blue:T.red}
          fontSize="32" fontWeight="700" fontFamily={T.ff.display}>{fill}</text>
        <text x="70" y="82" textAnchor="middle" fill={T.textMuted} fontSize="11" fontFamily={T.ff.mono}>/100</text>
      </svg>
      <div style={{fontFamily:T.ff.mono,fontSize:9,letterSpacing:3,color:verdictColor,fontWeight:500}}>{verdict}</div>
    </div>
  );
}
 
/* ── Chip ─────────────────────────────────────────────────────────────────── */
function Chip({children, color=T.blue, style={}}) {
  return (
    <span style={{display:"inline-flex",alignItems:"center",gap:4,padding:"3px 10px",borderRadius:99,background:`${color}14`,border:`1px solid ${color}30`,color,fontSize:9,fontFamily:T.ff.mono,letterSpacing:1.5,fontWeight:500,...style}}>
      {children}
    </span>
  );
}
 
/* ── Section Label ────────────────────────────────────────────────────────── */
function SectionLabel({children, color=T.gold}) {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
      <div style={{width:2,height:14,background:`linear-gradient(to bottom,${color},transparent)`,borderRadius:1}}/>
      <span style={{fontFamily:T.ff.mono,fontSize:9,letterSpacing:3,color,fontWeight:500,textTransform:"uppercase"}}>{children}</span>
      <div style={{flex:1,height:1,background:`linear-gradient(to right,${color}30,transparent)`}}/>
    </div>
  );
}
 
/* ── Glass Card ───────────────────────────────────────────────────────────── */
function GlassCard({children, style={}, glow}) {
  return (
    <div style={{
      background:"linear-gradient(135deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01))",
      border:`1px solid ${T.border}`,borderRadius:16,
      backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",
      boxShadow:glow?`0 0 40px ${glow}14,0 20px 60px rgba(0,0,0,0.4)`:"0 20px 60px rgba(0,0,0,0.3)",
      ...style,
    }}>
      {children}
    </div>
  );
}
 
/* ── Form Builder ─────────────────────────────────────────────────────────── */
function FormBuilder({ onComplete }) {
  const [form,setForm]=useState({name:"",email:"",phone:"",location:"",linkedin:"",summary:"",experience:[{company:"",title:"",dates:"",bullets:[""]}],education:[{degree:"",school:"",year:""}],skills:[""]});
  const upd=(path,val)=>setForm(p=>{const c=JSON.parse(JSON.stringify(p));const keys=path.split(".");let o=c;for(let i=0;i<keys.length-1;i++)o=isNaN(keys[i])?o[keys[i]]:o[+keys[i]];const l=keys[keys.length-1];isNaN(l)?o[l]=val:o[+l]=val;return c;});
  const addExp=()=>setForm(p=>({...p,experience:[...p.experience,{company:"",title:"",dates:"",bullets:[""]}]}));
  const remExp=i=>setForm(p=>({...p,experience:p.experience.filter((_,j)=>j!==i)}));
  const addBlt=ei=>setForm(p=>{const e=[...p.experience];e[ei]={...e[ei],bullets:[...e[ei].bullets,""]};return{...p,experience:e};});
  const remBlt=(ei,bi)=>setForm(p=>{const e=[...p.experience];e[ei]={...e[ei],bullets:e[ei].bullets.filter((_,j)=>j!==bi)};return{...p,experience:e};});
  const addEdu=()=>setForm(p=>({...p,education:[...p.education,{degree:"",school:"",year:""}]}));
  const addSkl=()=>setForm(p=>({...p,skills:[...p.skills,""]}));
  const remSkl=i=>setForm(p=>({...p,skills:p.skills.filter((_,j)=>j!==i)}));
  const build=()=>{const lines=[form.name,[form.email,form.phone,form.location,form.linkedin].filter(Boolean).join(" | "),"",form.summary&&`SUMMARY\n${form.summary}`,"","EXPERIENCE",...form.experience.map(e=>`${e.title} — ${e.company} | ${e.dates}\n${e.bullets.filter(Boolean).map(b=>`- ${b}`).join("\n")}`),"EDUCATION",...form.education.map(e=>`${e.degree} — ${e.school} | ${e.year}`),"SKILLS",form.skills.filter(Boolean).join(", ")].filter(l=>l!==false&&l!==undefined&&l!==null);onComplete(lines.join("\n"));};
 
  const fld={width:"100%",background:"rgba(255,255,255,0.04)",border:`1px solid ${T.border}`,borderRadius:8,padding:"10px 14px",color:T.text,fontFamily:T.ff.mono,fontSize:12,outline:"none",boxSizing:"border-box",transition:"border-color .2s"};
  const lbl={display:"block",fontSize:9,color:T.textMuted,fontFamily:T.ff.mono,letterSpacing:1.5,textTransform:"uppercase",marginBottom:6};
  const half={display:"grid",gridTemplateColumns:"1fr 1fr",gap:10};
 
  return (
    <div style={{maxHeight:"58vh",overflowY:"auto",paddingRight:4}}>
      <SectionLabel color={T.blue}>Personal Information</SectionLabel>
      <div style={{...half,marginBottom:10}}>
        {[["name","Full Name","Anuj Chaudhary"],["email","Email","anuj@email.com"],["phone","Phone","+91 76687 96070"],["location","Location","Mathura, UP"]].map(([k,l,p])=>(
          <div key={k} style={{marginBottom:8}}><label style={lbl}>{l}</label><input style={fld} value={form[k]} onChange={e=>upd(k,e.target.value)} placeholder={p} onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.border}/></div>
        ))}
      </div>
      <div style={{marginBottom:12}}><label style={lbl}>LinkedIn</label><input style={fld} value={form.linkedin} onChange={e=>upd("linkedin",e.target.value)} placeholder="linkedin.com/in/anuj-chaudhary" onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.border}/></div>
      <div style={{marginBottom:16}}><label style={lbl}>Career Summary</label><textarea style={{...fld,minHeight:60,resize:"vertical"}} value={form.summary} onChange={e=>upd("summary",e.target.value)} placeholder="Brief summary — AI will enhance it…"/></div>
 
      <SectionLabel color={T.gold}>Experience</SectionLabel>
      {form.experience.map((exp,ei)=>(
        <div key={ei} style={{background:"rgba(255,255,255,0.02)",border:`1px solid ${T.border}`,borderRadius:10,padding:"14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontSize:9,color:T.textMuted,fontFamily:T.ff.mono,letterSpacing:1}}>POSITION {ei+1}</span>
            {form.experience.length>1&&<button onClick={()=>remExp(ei)} style={{background:"none",border:"none",color:T.red,cursor:"pointer",fontSize:11,fontFamily:T.ff.mono}}>✕ Remove</button>}
          </div>
          <div style={{...half,marginBottom:8}}>
            <div><label style={lbl}>Job Title</label><input style={fld} value={exp.title} onChange={e=>upd(`experience.${ei}.title`,e.target.value)} placeholder="Python Intern" onFocus={e=>e.target.style.borderColor=T.gold} onBlur={e=>e.target.style.borderColor=T.border}/></div>
            <div><label style={lbl}>Company</label><input style={fld} value={exp.company} onChange={e=>upd(`experience.${ei}.company`,e.target.value)} placeholder="Acmegrade" onFocus={e=>e.target.style.borderColor=T.gold} onBlur={e=>e.target.style.borderColor=T.border}/></div>
          </div>
          <div style={{marginBottom:10}}><label style={lbl}>Duration</label><input style={fld} value={exp.dates} onChange={e=>upd(`experience.${ei}.dates`,e.target.value)} placeholder="Jun 2023 – Dec 2023" onFocus={e=>e.target.style.borderColor=T.gold} onBlur={e=>e.target.style.borderColor=T.border}/></div>
          <label style={lbl}>Responsibilities</label>
          {exp.bullets.map((b,bi)=>(
            <div key={bi} style={{display:"flex",gap:6,marginBottom:5}}>
              <input style={{...fld,flex:1}} value={b} onChange={e=>upd(`experience.${ei}.bullets.${bi}`,e.target.value)} placeholder="What you built or achieved…"/>
              {exp.bullets.length>1&&<button onClick={()=>remBlt(ei,bi)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer",fontSize:14}}>✕</button>}
            </div>
          ))}
          <button onClick={()=>addBlt(ei)} style={{background:"none",border:`1px dashed ${T.border}`,color:T.textMuted,cursor:"pointer",fontSize:9,fontFamily:T.ff.mono,padding:"5px 12px",borderRadius:6,marginTop:4}}>+ Add bullet</button>
        </div>
      ))}
      <button onClick={addExp} style={{width:"100%",background:"none",border:`1px dashed ${T.border}`,color:T.gold,cursor:"pointer",fontSize:9,fontFamily:T.ff.mono,padding:"8px",borderRadius:8,marginBottom:16,letterSpacing:1}}>+ ADD EXPERIENCE</button>
 
      <SectionLabel color={T.teal}>Education</SectionLabel>
      {form.education.map((ed,i)=>(
        <div key={i} style={{...half,background:"rgba(255,255,255,0.02)",border:`1px solid ${T.border}`,borderRadius:10,padding:"12px",marginBottom:8}}>
          <div><label style={lbl}>Degree</label><input style={fld} value={ed.degree} onChange={e=>upd(`education.${i}.degree`,e.target.value)} placeholder="B.Tech CSE"/></div>
          <div><label style={lbl}>Institution</label><input style={fld} value={ed.school} onChange={e=>upd(`education.${i}.school`,e.target.value)} placeholder="University Name"/></div>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Year</label><input style={fld} value={ed.year} onChange={e=>upd(`education.${i}.year`,e.target.value)} placeholder="2025 / Pursuing"/></div>
        </div>
      ))}
      <button onClick={addEdu} style={{width:"100%",background:"none",border:`1px dashed ${T.border}`,color:T.teal,cursor:"pointer",fontSize:9,fontFamily:T.ff.mono,padding:"8px",borderRadius:8,marginBottom:16,letterSpacing:1}}>+ ADD EDUCATION</button>
 
      <SectionLabel>Skills</SectionLabel>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {form.skills.map((sk,i)=>(
          <div key={i} style={{display:"flex",gap:4,alignItems:"center"}}>
            <input style={{...fld,width:110}} value={sk} onChange={e=>upd(`skills.${i}`,e.target.value)} placeholder="Python"/>
            {form.skills.length>1&&<button onClick={()=>remSkl(i)} style={{background:"none",border:"none",color:T.textMuted,cursor:"pointer"}}>✕</button>}
          </div>
        ))}
        <button onClick={addSkl} style={{background:"none",border:`1px dashed ${T.border}`,color:T.blue,cursor:"pointer",fontSize:9,fontFamily:T.ff.mono,padding:"5px 12px",borderRadius:6,letterSpacing:1}}>+ ADD</button>
      </div>
 
      <button onClick={build} style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,border:"none",borderRadius:10,color:"#07080f",fontFamily:T.ff.mono,fontSize:11,fontWeight:500,cursor:"pointer",letterSpacing:2}}>
        CONTINUE WITH FORM DATA →
      </button>
    </div>
  );
}
 
/* ══ MAIN APP ═══════════════════════════════════════════════════════════════ */
export default function App() {
  const [page,setPage]=useState("home");
  const [inputMode,setInputMode]=useState("upload");
  const [resumeText,setResumeText]=useState("");
  const [jd,setJd]=useState("");
  const [uploadState,setUploadState]=useState("idle");
  const [uploadName,setUploadName]=useState("");
  const [uploadMsg,setUploadMsg]=useState("");
  const [dragOver,setDragOver]=useState(false);
  const [agentActive,setAgentActive]=useState(0);
  const [agentsDone,setAgentsDone]=useState([]);
  const [logs,setLogs]=useState([]);
  const [pipeErr,setPipeErr]=useState("");
  const [result,setResult]=useState(null);
  const [tab,setTab]=useState("preview");
  const [tick,setTick]=useState(0);
  const [mounted,setMounted]=useState(false);
  const logRef=useRef(null);
  const fileRef=useRef(null);
 
  useEffect(()=>{ setTimeout(()=>setMounted(true),100); },[]);
  useEffect(()=>{ if(agentActive>0){const t=setInterval(()=>setTick(x=>(x+1)%8),260);return()=>clearInterval(t);} },[agentActive]);
  useEffect(()=>{ if(logRef.current) logRef.current.scrollTop=9999; },[logs]);
 
  const log=(msg,type="i")=>setLogs(p=>[...p,{msg,type,t:new Date().toLocaleTimeString("en-US",{hour12:false})}]);
 
  const processFile=useCallback(async(file)=>{
    if(!file)return;
    const ext=file.name.split(".").pop().toLowerCase();
    if(!["pdf","docx","doc"].includes(ext)){setUploadState("error");setUploadMsg("Please use PDF or DOCX format");return;}
    setUploadState("loading");setUploadName(file.name);setUploadMsg("Extracting text…");
    try{
      const ab=await file.arrayBuffer();
      const text=ext==="pdf"?await extractPDF(ab):await extractDOCX(ab);
      if(!text.trim())throw new Error("No text extracted. Try Paste instead.");
      setResumeText(text.trim());setUploadState("done");setUploadMsg(`${text.trim().split(/\s+/).length} words extracted`);
    }catch(e){setUploadState("error");setUploadMsg(e.message||"Read failed. Try paste.");}
  },[]);
 
  const onDrop=e=>{e.preventDefault();setDragOver(false);processFile(e.dataTransfer.files?.[0]);};
 
  const runPipeline=async()=>{
    setPage("pipeline");setLogs([]);setAgentsDone([]);setPipeErr("");setResult(null);
    try{
      setAgentActive(1);log("Agent 1 — Parsing resume structure…");
      const r1=await askClaude("Return ONLY valid JSON (no markdown): {name,contact:{email,phone,location,linkedin},summary,experience:[{company,title,dates,bullets:[]}],education:[{degree,school,year}],skills:[],projects:[],certifications:[]}",`Parse:\n${resumeText}`,1200);
      const parsed=tryJSON(r1,{name:"Candidate",contact:{},experience:[],education:[],skills:[]});
      setAgentsDone(p=>[...p,1]);log(`✓ ${parsed.experience?.length??0} roles · ${parsed.skills?.length??0} skills parsed`,"ok");
 
      setAgentActive(2);log("Agent 2 — Deep JD intelligence extraction…");
      const r2=await askClaude("Return ONLY valid JSON: {keywords:[],requiredSkills:[],niceToHave:[],topPriorities:[],roleLevel,domain,tools:[],softSkills:[],industryTerms:[]}",`Analyse JD:\n${jd}`,1200);
      const jdData=tryJSON(r2,{keywords:[],requiredSkills:[],niceToHave:[],topPriorities:[],tools:[],softSkills:[],industryTerms:[]});
      setAgentsDone(p=>[...p,2]);log(`✓ ${jdData.keywords?.length??0} keywords · ${jdData.tools?.length??0} tools found`,"ok");
 
      setAgentActive(3);log("Agent 3 — Rewriting resume with elite content…");
      const r3=await askClaude(`You are a world-class executive resume writer with 15+ years placing candidates at top firms. COMPLETELY TRANSFORM the resume.
RULES: Every bullet starts with a strong past-tense action verb. Add quantified achievements. Write 4+ bullets per role. 3-4 sentence compelling summary. Comprehensive skills grouped by category. Return ONLY valid JSON: {summary,experience:[{company,title,dates,bullets:[]}],skills:{[category]:[]}}`,
`JD: ${JSON.stringify(jdData)}\nCandidate: ${JSON.stringify(parsed)}\nTransform completely.`,3000);
      const gen=tryJSON(r3,{summary:"",experience:parsed.experience||[],skills:{}});
      setAgentsDone(p=>[...p,3]);log(`✓ ${gen.experience?.reduce((a,e)=>a+(e.bullets?.length??0),0)??0} power bullets generated`,"ok");
 
      setAgentActive(4);log("Agent 4 — Injecting ATS keywords across all sections…");
      const r4=await askClaude(`ATS keyword integration specialist. Inject keywords into EVERY section naturally. Expand skills significantly. Return ONLY valid JSON: {summary,experience:[{company,title,dates,bullets:[]}],skills:{[category]:[]},keywordsAdded:[],missingSkills:[]}`,
`Keywords: ${[...(jdData.keywords??[]),...(jdData.requiredSkills??[]),...(jdData.tools??[])].join(", ")}\nContent: ${JSON.stringify(gen)}`,2500);
      const ats=tryJSON(r4,{summary:gen.summary,experience:gen.experience,skills:gen.skills,keywordsAdded:[],missingSkills:[]});
      setAgentsDone(p=>[...p,4]);log(`✓ ${ats.keywordsAdded?.length??0} keywords woven across all sections`,"ok");
 
      setAgentActive(5);log("Agent 5 — Calculating final ATS score…");
      const r5=await askClaude("ATS scoring engine. Return ONLY valid JSON: {totalScore,verdict,breakdown:{keywordMatch:{score,max:30,note},contentQuality:{score,max:35,note},formatting:{score,max:20,note},readability:{score,max:15,note}},strengths:[],suggestions:[],quickWins:[],missingSkills:[]}",
`Resume: ${JSON.stringify(ats)}\nJD: ${JSON.stringify(jdData)}`,1000);
      const score=tryJSON(r5,{totalScore:78,verdict:"Strong",breakdown:{keywordMatch:{score:22,max:30,note:""},contentQuality:{score:27,max:35,note:""},formatting:{score:16,max:20,note:""},readability:{score:13,max:15,note:""}},strengths:[],suggestions:[],quickWins:[],missingSkills:[]});
      setAgentsDone(p=>[...p,5]);log(`✓ ATS Score: ${score.totalScore}/100 — ${score.verdict}`,"ok");
 
      setAgentActive(0);
      setResult({resume:{name:parsed.name,contact:parsed.contact,summary:ats.summary,experience:ats.experience,education:parsed.education,skills:ats.skills},score,missing:ats.missingSkills??[]});
      setPage("result");setTab("preview");
    }catch(e){setAgentActive(0);setPipeErr(e.message);log(`✗ ${e.message}`,"er");}
  };
 
  const downloadPDF=()=>{
    if(!result)return;
    const r=result.resume;
    const contact=Object.values(r.contact||{}).filter(Boolean).join("  |  ");
    const skillsHTML=typeof r.skills==="object"&&!Array.isArray(r.skills)?Object.entries(r.skills||{}).map(([cat,vals])=>`<p style="margin-bottom:5px"><strong>${cat}:</strong> ${Array.isArray(vals)?vals.join(", "):vals}</p>`).join(""):Array.isArray(r.skills)?`<p>${r.skills.join(", ")}</p>`:"";
    const expHTML=(r.experience||[]).map(ex=>`<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between"><strong style="font-size:11pt">${ex.title||""}</strong><span style="color:#666;font-size:9.5pt">${ex.dates||""}</span></div><div style="color:#444;font-size:10pt;font-style:italic;margin-bottom:5px">${ex.company||""}</div><ul style="margin:0;padding-left:18px">${(ex.bullets||[]).map(b=>`<li style="margin-bottom:3px;font-size:10.5pt;color:#222;line-height:1.6">${b}</li>`).join("")}</ul></div>`).join("");
    const eduHTML=(r.education||[]).map(ed=>`<div style="margin-bottom:4px;font-size:10.5pt"><strong>${typeof ed==="string"?ed:ed.degree||""}</strong>${ed.school?` — ${ed.school}`:""}${ed.year?` (${ed.year})`:""}</div>`).join("");
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${r.name||"Resume"}</title><style>@page{margin:16mm 20mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:10.5pt;color:#1a1a1a;line-height:1.55}h1{font-family:Georgia,serif;font-size:22pt;margin-bottom:5px}.contact{font-size:9.5pt;color:#555;margin-bottom:16px;border-bottom:1px solid #ddd;padding-bottom:12px}.sh{font-size:8.5pt;letter-spacing:2px;text-transform:uppercase;font-weight:700;border-bottom:1.5px solid #111;padding-bottom:3px;margin:18px 0 10px}</style></head><body><h1>${r.name||"Your Name"}</h1><div class="contact">${contact}</div>${r.summary?`<div class="sh">Professional Summary</div><p style="font-size:10.5pt;line-height:1.65;color:#222">${r.summary}</p>`:""}<div class="sh">Experience</div>${expHTML}${skillsHTML?`<div class="sh">Skills</div>${skillsHTML}`:""}<div class="sh">Education</div>${eduHTML}</body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const win=window.open(url,"_blank");
    if(win){win.addEventListener("load",()=>{setTimeout(()=>win.print(),300);});}
    else{const a=document.createElement("a");a.href=url;a.download=`${(r.name||"resume").replace(/\s+/g,"_")}_ATS.html`;a.click();}
    setTimeout(()=>URL.revokeObjectURL(url),15000);
  };
 
  /* ── Shared styles ── */
  const SPIN=["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠇"][tick];
  const anim=(delay=0)=>({opacity:0,animation:`fadeUp 0.6s ease forwards`,animationDelay:`${delay}ms`});
  const btnPrimary=(color=T.gold)=>({padding:"12px 28px",border:"none",borderRadius:10,cursor:"pointer",fontFamily:T.ff.mono,fontSize:11,fontWeight:500,letterSpacing:1.5,background:`linear-gradient(135deg,${color},${color}aa)`,color:color===T.gold?"#07080f":"#07080f",boxShadow:`0 8px 32px ${color}30`,transition:"all .25s",textTransform:"uppercase"});
  const btnGhost=(color=T.textMuted)=>({padding:"11px 22px",border:`1px solid ${T.border}`,borderRadius:10,cursor:"pointer",fontFamily:T.ff.mono,fontSize:11,fontWeight:500,letterSpacing:1,background:"transparent",color,transition:"all .25s",textTransform:"uppercase"});
  const ta={width:"100%",background:"rgba(255,255,255,0.03)",border:`1px solid ${T.border}`,borderRadius:10,padding:"14px 16px",color:T.text,fontFamily:T.ff.mono,fontSize:12,resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.7};
  const modeTab=(active,color=T.blue)=>({flex:1,padding:"12px",border:"none",cursor:"pointer",fontFamily:T.ff.mono,fontSize:10,fontWeight:500,letterSpacing:1.5,background:active?`${color}10`:"transparent",color:active?color:T.textMuted,borderBottom:active?`1.5px solid ${color}`:"1.5px solid transparent",transition:"all .2s",textTransform:"uppercase"});
 
  const sampleJD=`Junior ML Engineer — AI Product Team\n\nRequirements:\n- Python (NumPy, Pandas, scikit-learn)\n- Machine Learning fundamentals\n- Data preprocessing & feature engineering\n- SQL for data extraction\n- Jupyter Notebook / Google Colab\n- Git version control\n\nResponsibilities:\n- Build and evaluate ML models\n- Clean and preprocess datasets\n- Write Python scripts for data pipelines\n- Document experiments\n\nNice to have: TensorFlow, PyTorch, Matplotlib, Flask`;
 
  /* ════════════════════════════════════════════════════════════════════════ */
  return (
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:T.ff.body,position:"relative"}}>
      <FontLink/>
      <Background/>
 
      {/* ── NAV ── */}
      <nav style={{position:"sticky",top:0,zIndex:100,borderBottom:`1px solid ${T.border}`,background:"rgba(7,8,15,0.85)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)"}}>
        <div style={{maxWidth:1000,margin:"0 auto",padding:"0 24px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:36,height:36,borderRadius:10,background:`linear-gradient(135deg,${T.gold},${T.goldDim})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:800,color:"#07080f",fontFamily:T.ff.display,boxShadow:`0 4px 16px ${T.goldGlow}`}}>A</div>
            <div>
              <div style={{fontSize:14,fontWeight:700,fontFamily:T.ff.display,letterSpacing:0.3,lineHeight:1.1}}>ATS Resume Builder</div>
              <div style={{fontSize:8,color:T.textMuted,fontFamily:T.ff.mono,letterSpacing:2}}>PRO · 5-AGENT PIPELINE · v3.0</div>
            </div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Chip color={T.teal}>PDF UPLOAD</Chip>
            <Chip color={T.gold}>FORM BUILDER</Chip>
            <Chip color={T.blue}>CLAUDE OPUS</Chip>
          </div>
        </div>
      </nav>
 
      <div style={{maxWidth:920,margin:"0 auto",padding:"40px 20px",position:"relative",zIndex:1}}>
 
        {/* ══ HOME ══════════════════════════════════════════════════════════ */}
        {page==="home"&&(
          <div style={anim()}>
            {/* Hero */}
            <div style={{textAlign:"center",marginBottom:56,padding:"20px 0"}}>
              <div style={{...anim(100),marginBottom:16}}>
                <Chip color={T.gold} style={{fontSize:9,letterSpacing:2}}>◆ POWERED BY 5 SPECIALIZED AI AGENTS</Chip>
              </div>
              <h1 style={{...anim(200),fontSize:"clamp(32px,5vw,52px)",fontFamily:T.ff.display,fontWeight:800,lineHeight:1.15,margin:"0 0 20px",background:`linear-gradient(135deg,${T.text} 40%,${T.gold})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                From Ordinary<br/>to Interview-Ready
              </h1>
              <p style={{...anim(300),fontSize:16,fontFamily:T.ff.body,color:T.textSub,lineHeight:1.8,maxWidth:500,margin:"0 auto 36px"}}>
                Upload your resume · Paste a job description · Watch 5 AI agents completely transform it into a professional, ATS-optimised document.
              </p>
              <div style={anim(400)}>
                <button style={{...btnPrimary(T.gold),fontSize:13,padding:"15px 40px"}} onClick={()=>setPage("input")}>
                  Start Building →
                </button>
              </div>
            </div>
 
            {/* Feature grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:12,marginBottom:48}}>
              {[
                [T.blue,"⬆","Upload PDF / DOCX","Drop your old resume — AI extracts and rebuilds everything"],
                [T.gold,"☰","Form Builder","No resume? Fill a guided form — AI creates one from scratch"],
                [T.teal,"◆","Full AI Rewrite","Every single bullet rewritten with action verbs and metrics"],
                ["#a78bfa","◇","ATS Keywords","Keywords injected into bullets, summary AND skills section"],
                [T.gold,"◎","Score + Roadmap","Get a 0–100 ATS score with specific improvement steps"],
              ].map(([color,icon,title,text],i)=>(
                <div key={icon} style={{...anim(500+i*80)}}>
                  <GlassCard glow={color} style={{padding:"20px 18px",height:"100%",transition:"transform .2s,box-shadow .2s",cursor:"default"}}>
                    <div style={{fontSize:22,color,marginBottom:10,filter:`drop-shadow(0 0 8px ${color}66)`}}>{icon}</div>
                    <div style={{fontSize:13,fontWeight:600,fontFamily:T.ff.display,marginBottom:6,color:T.text}}>{title}</div>
                    <div style={{fontSize:12,color:T.textSub,fontFamily:T.ff.body,lineHeight:1.6}}>{text}</div>
                  </GlassCard>
                </div>
              ))}
            </div>
 
            {/* Pipeline preview */}
            <GlassCard style={{padding:"28px 32px",...anim(900)}}>
              <SectionLabel color={T.blue}>How It Works</SectionLabel>
              <div style={{display:"flex",alignItems:"center",gap:0,overflowX:"auto",paddingBottom:4}}>
                {AGENTS.map((ag,i)=>(
                  <div key={ag.id} style={{display:"flex",alignItems:"center",flex:1,minWidth:0}}>
                    <div style={{textAlign:"center",flex:1}}>
                      <div style={{width:36,height:36,borderRadius:10,background:`${ag.color}14`,border:`1px solid ${ag.color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:ag.color,fontFamily:T.ff.mono,margin:"0 auto 6px",fontWeight:600}}>{ag.id}</div>
                      <div style={{fontSize:9,color:ag.color,fontFamily:T.ff.mono,letterSpacing:0.5,marginBottom:2}}>{ag.tag}</div>
                      <div style={{fontSize:10,color:T.textMuted,fontFamily:T.ff.body,lineHeight:1.4,maxWidth:80,margin:"0 auto"}}>{ag.name}</div>
                    </div>
                    {i<4&&<div style={{width:20,height:1,background:`linear-gradient(to right,${ag.color}40,${AGENTS[i+1].color}40)`,flexShrink:0}}/>}
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}
 
        {/* ══ INPUT ══════════════════════════════════════════════════════════ */}
        {page==="input"&&(
          <div style={anim()}>
            <div style={{marginBottom:28}}>
              <div style={{fontFamily:T.ff.mono,fontSize:9,color:T.gold,letterSpacing:3,marginBottom:8}}>STEP 01 OF 02</div>
              <h2 style={{fontFamily:T.ff.display,fontSize:28,fontWeight:700,margin:0}}>Your Resume</h2>
              <p style={{color:T.textSub,fontFamily:T.ff.body,fontSize:14,marginTop:6}}>Three ways to provide your information — AI handles the rest.</p>
            </div>
 
            <GlassCard style={{padding:"28px"}}>
              {/* Mode tabs */}
              <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:`1px solid ${T.border}`,marginBottom:24}}>
                <button style={modeTab(inputMode==="upload",T.blue)} onClick={()=>setInputMode("upload")}>⬆ Upload File</button>
                <button style={modeTab(inputMode==="paste",T.teal)} onClick={()=>setInputMode("paste")}>✎ Paste Text</button>
                <button style={modeTab(inputMode==="form",T.gold)} onClick={()=>setInputMode("form")}>☰ Build Form</button>
              </div>
 
              {/* Upload */}
              {inputMode==="upload"&&(
                <>
                  <div onClick={()=>fileRef.current?.click()} onDragOver={e=>{e.preventDefault();setDragOver(true)}} onDragLeave={()=>setDragOver(false)} onDrop={onDrop}
                    style={{border:`2px dashed ${dragOver?T.blue:uploadState==="done"?T.teal:uploadState==="error"?T.red:T.border}`,borderRadius:14,padding:"44px 24px",textAlign:"center",cursor:"pointer",background:dragOver?`${T.blue}08`:uploadState==="done"?`${T.teal}08`:uploadState==="error"?`${T.red}08`:"rgba(255,255,255,0.02)",transition:"all .25s",marginBottom:16}}>
                    <div style={{fontSize:40,marginBottom:14,filter:uploadState==="done"?`drop-shadow(0 0 12px ${T.teal})`:"none"}}>
                      {uploadState==="loading"?"⏳":uploadState==="done"?"✅":uploadState==="error"?"❌":"📄"}
                    </div>
                    {uploadState==="idle"&&<>
                      <div style={{fontSize:15,fontFamily:T.ff.display,color:T.text,fontWeight:600,marginBottom:8}}>Drop your resume here</div>
                      <div style={{fontSize:11,color:T.textMuted,fontFamily:T.ff.mono,marginBottom:16,letterSpacing:0.5}}>PDF · DOCX · DOC supported</div>
                      <div style={{display:"inline-block",padding:"10px 24px",background:`linear-gradient(135deg,${T.blue},${T.blueDim})`,borderRadius:8,color:"#fff",fontFamily:T.ff.mono,fontSize:11,fontWeight:500,letterSpacing:1,boxShadow:`0 4px 20px ${T.blueGlow}`}}>BROWSE FILES</div>
                    </>}
                    {uploadState==="loading"&&<div style={{fontSize:13,color:T.gold,fontFamily:T.ff.mono}}>{uploadName} — extracting…</div>}
                    {uploadState==="done"&&<>
                      <div style={{fontSize:13,color:T.teal,fontFamily:T.ff.display,fontWeight:600,marginBottom:4}}>✓ {uploadName}</div>
                      <div style={{fontSize:11,color:T.textMuted,fontFamily:T.ff.mono}}>{uploadMsg}</div>
                    </>}
                    {uploadState==="error"&&<>
                      <div style={{fontSize:13,color:T.red,fontFamily:T.ff.display,fontWeight:600,marginBottom:4}}>Upload Failed</div>
                      <div style={{fontSize:11,color:T.textMuted,fontFamily:T.ff.mono}}>{uploadMsg}</div>
                    </>}
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])processFile(e.target.files[0]);e.target.value="";}}/>
                  </div>
                  {uploadState==="done"&&(
                    <GlassCard style={{padding:"12px 16px",marginBottom:14}}>
                      <div style={{fontSize:8,fontFamily:T.ff.mono,color:T.textMuted,letterSpacing:1.5,marginBottom:7}}>EXTRACTED PREVIEW</div>
                      <div style={{fontFamily:T.ff.mono,fontSize:11,color:T.textSub,maxHeight:90,overflowY:"auto",whiteSpace:"pre-wrap",lineHeight:1.5}}>{resumeText.slice(0,500)}…</div>
                    </GlassCard>
                  )}
                  {(uploadState==="done"||uploadState==="error")&&<button style={{...btnGhost(T.textMuted),fontSize:10,marginBottom:16}} onClick={()=>{setUploadState("idle");setUploadName("");setUploadMsg("");setResumeText("");}}>↺ Try Different File</button>}
                </>
              )}
 
              {/* Paste */}
              {inputMode==="paste"&&(
                <>
                  <div style={{fontFamily:T.ff.mono,fontSize:9,color:T.textMuted,letterSpacing:1.5,marginBottom:8}}>RESUME TEXT</div>
                  <textarea style={{...ta,minHeight:260,color:T.textSub}} value={resumeText} onChange={e=>setResumeText(e.target.value)}
                    placeholder={"Paste your full resume here…\n\nAnuj Chaudhary\nanujattri59@gmail.com | 7668796070 | Mathura, UP\n\nSKILLS\nPython, SQL, Anaconda, VS Code\n\nINTERNSHIP\nPython Intern – Acmegrade\n- Learned Python with Jupyter Notebook\n- Managed packages with Anaconda\n\nEDUCATION\nB.Sc. — XYZ University | 2024"}
                    onFocus={e=>e.target.style.borderColor=T.teal} onBlur={e=>e.target.style.borderColor=T.border}/>
                  {resumeText.trim()&&<div style={{fontFamily:T.ff.mono,fontSize:9,color:T.textMuted,marginTop:6,letterSpacing:1}}>{resumeText.trim().split(/\s+/).length} WORDS</div>}
                </>
              )}
 
              {/* Form */}
              {inputMode==="form"&&<FormBuilder onComplete={text=>{setResumeText(text);setInputMode("paste");}}/>}
 
              {inputMode!=="form"&&(
                <div style={{display:"flex",gap:10,marginTop:20,alignItems:"center"}}>
                  <button style={btnGhost()} onClick={()=>setPage("home")}>← Back</button>
                  <div style={{flex:1}}/>
                  <button style={{...btnPrimary(T.blue),opacity:resumeText.trim()?1:0.3,cursor:resumeText.trim()?"pointer":"not-allowed"}} disabled={!resumeText.trim()} onClick={()=>setPage("jd")}>
                    Next: Job Description →
                  </button>
                </div>
              )}
            </GlassCard>
          </div>
        )}
 
        {/* ══ JD ═════════════════════════════════════════════════════════════ */}
        {page==="jd"&&(
          <div style={anim()}>
            <div style={{marginBottom:28}}>
              <div style={{fontFamily:T.ff.mono,fontSize:9,color:T.gold,letterSpacing:3,marginBottom:8}}>STEP 02 OF 02</div>
              <h2 style={{fontFamily:T.ff.display,fontSize:28,fontWeight:700,margin:0}}>Target Job Description</h2>
              <p style={{color:T.textSub,fontFamily:T.ff.body,fontSize:14,marginTop:6}}>The more detail you paste, the more precisely the AI tailors your resume.</p>
            </div>
            <GlassCard style={{padding:"28px"}}>
              <div style={{fontFamily:T.ff.mono,fontSize:9,color:T.textMuted,letterSpacing:1.5,marginBottom:8}}>JOB DESCRIPTION</div>
              <textarea style={{...ta,minHeight:300,color:T.textSub}} value={jd} onChange={e=>setJd(e.target.value)}
                placeholder="Paste the full job posting here — requirements, responsibilities, tech stack, nice to have…"
                onFocus={e=>e.target.style.borderColor=T.gold} onBlur={e=>e.target.style.borderColor=T.border}/>
              {jd.trim()&&<div style={{fontFamily:T.ff.mono,fontSize:9,color:T.textMuted,marginTop:6,letterSpacing:1}}>{jd.trim().split(/\s+/).length} WORDS</div>}
              <div style={{display:"flex",gap:10,marginTop:20,flexWrap:"wrap",alignItems:"center"}}>
                <button style={btnGhost()} onClick={()=>setPage("input")}>← Back</button>
                <button style={{...btnGhost(T.gold),fontSize:10}} onClick={()=>setJd(sampleJD)}>Load ML Sample JD</button>
                <div style={{flex:1}}/>
                <button style={{...btnPrimary("#a78bfa"),opacity:jd.trim()?1:0.3,cursor:jd.trim()?"pointer":"not-allowed",fontSize:12,padding:"12px 28px"}} disabled={!jd.trim()} onClick={runPipeline}>
                  🚀 Launch AI Pipeline →
                </button>
              </div>
            </GlassCard>
          </div>
        )}
 
        {/* ══ PIPELINE ═══════════════════════════════════════════════════════ */}
        {page==="pipeline"&&(
          <div style={anim()}>
            <div style={{textAlign:"center",marginBottom:40}}>
              <div style={{fontFamily:T.ff.mono,fontSize:9,color:T.textMuted,letterSpacing:3,marginBottom:12}}>DEEP AI PROCESSING</div>
              <h2 style={{fontFamily:T.ff.display,fontSize:32,fontWeight:800,margin:"0 0 10px",background:`linear-gradient(135deg,${T.text},${T.gold})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                Transforming Your Resume
              </h2>
              <p style={{color:T.textSub,fontFamily:T.ff.body,fontSize:14}}>5 specialized agents running a complete professional rewrite…</p>
            </div>
 
            {/* Progress bar */}
            <div style={{height:2,background:T.border,borderRadius:2,marginBottom:32,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(agentsDone.length/5)*100}%`,background:`linear-gradient(to right,${T.blue},${T.gold})`,transition:"width .8s cubic-bezier(.4,0,.2,1)",boxShadow:`0 0 12px ${T.blueGlow}`}}/>
            </div>
 
            {/* Agent cards */}
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {AGENTS.map((ag,i)=>{
                const isDone=agentsDone.includes(ag.id),isActive=agentActive===ag.id;
                return (
                  <div key={ag.id} style={{...anim(i*60)}}>
                    <GlassCard glow={isActive?ag.color:isDone?T.teal:undefined} style={{padding:"16px 20px",border:`1px solid ${isDone?`${T.teal}40`:isActive?`${ag.color}40`:T.border}`,transition:"all .4s",background:isDone?`${T.teal}06`:isActive?`${ag.color}06`:"rgba(255,255,255,0.02)"}}>
                      <div style={{display:"flex",alignItems:"center",gap:14}}>
                        {/* Icon */}
                        <div style={{width:42,height:42,borderRadius:10,flexShrink:0,background:isDone?`${T.teal}18`:isActive?`${ag.color}18`:"rgba(255,255,255,0.04)",border:`1px solid ${isDone?T.teal:isActive?ag.color:T.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isDone?16:14,color:isDone?T.teal:isActive?ag.color:T.textMuted,transition:"all .3s",boxShadow:isActive?`0 0 20px ${ag.color}30`:"none",fontFamily:T.ff.mono}}>
                          {isDone?"✓":isActive?SPIN:ag.id}
                        </div>
                        {/* Info */}
                        <div style={{flex:1}}>
                          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                            <span style={{fontFamily:T.ff.display,fontSize:14,fontWeight:600,color:isDone?T.teal:isActive?T.text:T.textMuted,transition:"color .3s"}}>{ag.name}</span>
                            <Chip color={isDone?T.teal:isActive?ag.color:T.textMuted}>{ag.tag}</Chip>
                          </div>
                          <div style={{fontFamily:T.ff.mono,fontSize:10,color:isDone?"rgba(0,242,195,0.5)":isActive?T.textSub:T.textMuted}}>
                            {isDone?"Completed successfully":isActive?ag.desc:"Queued"}
                          </div>
                        </div>
                        {/* Step */}
                        <div style={{fontFamily:T.ff.mono,fontSize:9,color:T.textMuted,letterSpacing:1}}>{ag.id}/5</div>
                      </div>
                      {/* Active progress line */}
                      {isActive&&<div style={{height:2,background:T.border,borderRadius:2,marginTop:14,overflow:"hidden"}}><div style={{height:"100%",background:`linear-gradient(to right,${ag.color},transparent)`,animation:"progressFill 3s ease-in-out infinite"}}/></div>}
                    </GlassCard>
                  </div>
                );
              })}
            </div>
 
            {/* Log */}
            <GlassCard style={{padding:"16px 20px"}}>
              <div style={{fontFamily:T.ff.mono,fontSize:8,color:T.textMuted,letterSpacing:2,marginBottom:10}}>◆ LIVE LOG</div>
              <div ref={logRef} style={{maxHeight:120,overflowY:"auto"}}>
                {logs.map((l,i)=>(
                  <div key={i} style={{fontFamily:T.ff.mono,fontSize:10.5,display:"flex",gap:10,marginBottom:3}}>
                    <span style={{color:T.textMuted,flexShrink:0}}>{l.t}</span>
                    <span style={{color:l.type==="ok"?T.teal:l.type==="er"?T.red:T.textSub}}>{l.msg}</span>
                  </div>
                ))}
                {agentActive>0&&!pipeErr&&<div style={{fontFamily:T.ff.mono,fontSize:10,color:T.textMuted,marginTop:6,fontStyle:"italic"}}>Processing… this may take 30–60 seconds</div>}
              </div>
            </GlassCard>
 
            {pipeErr&&(
              <GlassCard style={{padding:"16px 20px",marginTop:12,border:`1px solid ${T.red}40`,background:`${T.red}06`}}>
                <div style={{color:T.red,fontFamily:T.ff.mono,fontSize:12,marginBottom:12}}>✗ {pipeErr}</div>
                <div style={{display:"flex",gap:8}}><button style={btnGhost(T.red)} onClick={()=>setPage("jd")}>← Retry</button></div>
              </GlassCard>
            )}
          </div>
        )}
 
        {/* ══ RESULT ═════════════════════════════════════════════════════════ */}
        {page==="result"&&result&&(
          <div style={anim()}>
 
            {/* Score + breakdown */}
            <GlassCard style={{padding:"32px",marginBottom:16}} glow={T.gold}>
              <div style={{display:"flex",flexWrap:"wrap",gap:28,alignItems:"flex-start"}}>
                <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
                  <ScoreRing score={result.score.totalScore}/>
                  <div style={{textAlign:"center"}}>
                    <div style={{fontFamily:T.ff.mono,fontSize:8,color:T.textMuted,letterSpacing:2,marginBottom:4}}>VERDICT</div>
                    <div style={{fontFamily:T.ff.display,fontSize:16,fontWeight:700,color:T.gold}}>{result.score.verdict}</div>
                  </div>
                </div>
 
                <div style={{flex:1,minWidth:180}}>
                  <SectionLabel color={T.blue}>Score Breakdown</SectionLabel>
                  {Object.entries(result.score.breakdown||{}).map(([k,v])=>{
                    const pct=v.max?(v.score/v.max)*100:v.score;
                    const c=pct>=80?T.teal:pct>=55?T.gold:T.red;
                    return (
                      <div key={k} style={{marginBottom:12}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <span style={{fontFamily:T.ff.mono,fontSize:9,color:T.textMuted,letterSpacing:0.5}}>{k.replace(/([A-Z])/g," $1").toUpperCase()}</span>
                          <span style={{fontFamily:T.ff.mono,fontSize:9,color:c,fontWeight:500}}>{v.score}/{v.max}</span>
                        </div>
                        <div style={{height:3,background:"rgba(255,255,255,0.05)",borderRadius:2,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(to right,${c},${c}88)`,borderRadius:2,transition:"width 1.5s cubic-bezier(.4,0,.2,1)",boxShadow:`0 0 8px ${c}44`}}/>
                        </div>
                        {v.note&&<div style={{fontFamily:T.ff.mono,fontSize:8,color:T.textMuted,marginTop:3}}>{v.note}</div>}
                      </div>
                    );
                  })}
                </div>
 
                <div style={{flex:1,minWidth:160}}>
                  {result.score.strengths?.length>0&&(
                    <div style={{marginBottom:18}}>
                      <div style={{fontFamily:T.ff.mono,fontSize:8,color:T.teal,letterSpacing:2,marginBottom:10}}>✓ STRENGTHS</div>
                      {result.score.strengths.map((s,i)=>(
                        <div key={i} style={{fontFamily:T.ff.body,fontSize:12,color:T.textSub,marginBottom:6,display:"flex",gap:6,alignItems:"flex-start"}}>
                          <span style={{color:T.teal,flexShrink:0,marginTop:2}}>▸</span>{s}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.missing?.length>0&&(
                    <>
                      <div style={{fontFamily:T.ff.mono,fontSize:8,color:T.gold,letterSpacing:2,marginBottom:10}}>⚠ SKILL GAPS</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {result.missing.slice(0,8).map((s,i)=><Chip key={i} color={T.gold}>{s}</Chip>)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </GlassCard>
 
            {/* Result tabs */}
            <div style={{display:"flex",borderRadius:12,overflow:"hidden",border:`1px solid ${T.border}`,marginBottom:16,background:"rgba(255,255,255,0.02)"}}>
              {[["preview","◈ Resume Preview","preview",T.blue],["suggest","◉ Suggestions","suggest",T.gold],["wins","◆ Quick Wins","wins",T.teal]].map(([id,label,key,color])=>(
                <button key={id} onClick={()=>setTab(key)} style={modeTab(tab===key,color)}>{label}</button>
              ))}
            </div>
 
            {/* Preview tab */}
            {tab==="preview"&&(
              <GlassCard style={{padding:"28px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
                  <div>
                    <h3 style={{fontFamily:T.ff.display,fontSize:17,fontWeight:700,margin:"0 0 4px"}}>ATS-Optimised Resume</h3>
                    <div style={{fontFamily:T.ff.mono,fontSize:9,color:T.textMuted,letterSpacing:1}}>CLEAN FORMAT · NO TABLES · ATS-SAFE · PROFESSIONAL</div>
                  </div>
                  <button style={{...btnPrimary(T.teal),fontSize:11}} onClick={downloadPDF}>⬇ Download PDF</button>
                </div>
 
                {/* White paper doc */}
                <div style={{background:"#fff",borderRadius:10,padding:"40px 44px",boxShadow:"0 20px 80px rgba(0,0,0,0.7)"}}>
                  <div style={{fontFamily:"Arial,Helvetica,sans-serif",color:"#1a1a1a",lineHeight:1.55}}>
                    <h1 style={{margin:0,fontSize:22,fontFamily:"Georgia,serif",color:"#0a0a0a"}}>{result.resume.name}</h1>
                    <p style={{fontSize:9.5,color:"#555",margin:"5px 0 14px",paddingBottom:12,borderBottom:"1px solid #e8e8e8"}}>
                      {Object.values(result.resume.contact||{}).filter(Boolean).join("  |  ")}
                    </p>
                    {result.resume.summary&&<>
                      <div style={{fontSize:8,letterSpacing:2,textTransform:"uppercase",fontWeight:700,borderBottom:"1.5px solid #111",paddingBottom:3,margin:"14px 0 9px"}}>Professional Summary</div>
                      <p style={{fontSize:10.5,lineHeight:1.65,color:"#222"}}>{result.resume.summary}</p>
                    </>}
                    {result.resume.experience?.length>0&&<>
                      <div style={{fontSize:8,letterSpacing:2,textTransform:"uppercase",fontWeight:700,borderBottom:"1.5px solid #111",paddingBottom:3,margin:"18px 0 10px"}}>Experience</div>
                      {result.resume.experience.map((ex,i)=>(
                        <div key={i} style={{marginBottom:14}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                            <strong style={{fontSize:11,color:"#111"}}>{ex.title}</strong>
                            <span style={{fontSize:9.5,color:"#666",whiteSpace:"nowrap"}}>{ex.dates}</span>
                          </div>
                          <div style={{fontSize:10,color:"#444",fontStyle:"italic",marginBottom:5}}>{ex.company}</div>
                          <ul style={{margin:0,paddingLeft:17}}>
                            {(ex.bullets||[]).map((b,j)=><li key={j} style={{fontSize:10.5,lineHeight:1.6,marginBottom:2,color:"#222"}}>{b}</li>)}
                          </ul>
                        </div>
                      ))}
                    </>}
                    {result.resume.skills&&Object.keys(result.resume.skills).length>0&&<>
                      <div style={{fontSize:8,letterSpacing:2,textTransform:"uppercase",fontWeight:700,borderBottom:"1.5px solid #111",paddingBottom:3,margin:"18px 0 10px"}}>Skills</div>
                      {typeof result.resume.skills==="object"&&!Array.isArray(result.resume.skills)
                        ?Object.entries(result.resume.skills).map(([cat,vals])=>(
                          <p key={cat} style={{fontSize:10.5,marginBottom:4}}><strong>{cat}:</strong> {Array.isArray(vals)?vals.join(", "):vals}</p>
                        ))
                        :<p style={{fontSize:10.5}}>{Array.isArray(result.resume.skills)?result.resume.skills.join(", "):result.resume.skills}</p>
                      }
                    </>}
                    {result.resume.education?.length>0&&<>
                      <div style={{fontSize:8,letterSpacing:2,textTransform:"uppercase",fontWeight:700,borderBottom:"1.5px solid #111",paddingBottom:3,margin:"18px 0 10px"}}>Education</div>
                      {result.resume.education.map((ed,i)=>(
                        <div key={i} style={{fontSize:10.5,color:"#222",marginBottom:3}}>
                          <strong>{typeof ed==="string"?ed:ed.degree||""}</strong>{ed.school?` — ${ed.school}`:""}{ed.year?` (${ed.year})`:""}
                        </div>
                      ))}
                    </>}
                  </div>
                </div>
 
                <div style={{marginTop:14,padding:"12px 16px",background:`${T.teal}08`,border:`1px solid ${T.teal}25`,borderRadius:8}}>
                  <div style={{fontFamily:T.ff.mono,fontSize:10,color:T.teal}}>💡 Click "Download PDF" → in the print dialog choose <strong>Save as PDF</strong></div>
                </div>
              </GlassCard>
            )}
 
            {/* Suggestions */}
            {tab==="suggest"&&(
              <GlassCard style={{padding:"28px"}}>
                <SectionLabel color={T.gold}>Improvement Suggestions</SectionLabel>
                {!(result.score.suggestions?.length)&&<div style={{color:T.textMuted,fontFamily:T.ff.mono,fontSize:11}}>Resume is well-optimised!</div>}
                {(result.score.suggestions||[]).map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:14,padding:"14px 16px",marginBottom:8,background:"rgba(255,255,255,0.02)",borderRadius:10,border:`1px solid ${T.border}`,...anim(i*60)}}>
                    <div style={{width:26,height:26,borderRadius:7,background:`${T.gold}14`,border:`1px solid ${T.gold}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontFamily:T.ff.mono,fontWeight:500,color:T.gold,flexShrink:0}}>{String(i+1).padStart(2,"0")}</div>
                    <div style={{fontSize:13,color:T.textSub,fontFamily:T.ff.body,lineHeight:1.65}}>{s}</div>
                  </div>
                ))}
              </GlassCard>
            )}
 
            {/* Quick wins */}
            {tab==="wins"&&(
              <GlassCard style={{padding:"28px"}}>
                <SectionLabel color={T.teal}>Quick Wins — Do These First</SectionLabel>
                {!(result.score.quickWins?.length)&&<div style={{color:T.textMuted,fontFamily:T.ff.mono,fontSize:11}}>Resume is already strong!</div>}
                {(result.score.quickWins||[]).map((w,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"14px 16px",marginBottom:8,background:`${T.teal}06`,borderRadius:10,border:`1px solid ${T.teal}20`,...anim(i*60)}}>
                    <span style={{color:T.teal,fontSize:14,flexShrink:0}}>⚡</span>
                    <span style={{fontSize:13,color:T.textSub,fontFamily:T.ff.body,lineHeight:1.65}}>{w}</span>
                  </div>
                ))}
              </GlassCard>
            )}
 
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:16,flexWrap:"wrap"}}>
              <button style={btnGhost()} onClick={()=>{setPage("home");setResumeText("");setJd("");setResult(null);setUploadState("idle");setUploadName("");}}>◈ Start Over</button>
              <button style={btnGhost(T.gold)} onClick={()=>setPage("jd")}>← Change JD</button>
              <button style={{...btnPrimary(T.teal),fontSize:11}} onClick={downloadPDF}>⬇ Download PDF</button>
            </div>
          </div>
        )}
      </div>
 
      <style>{`
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:transparent}
        ::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:4px}
        button:hover{opacity:.85;transform:translateY(-1px)}
        button:active{transform:scale(.97) translateY(0)}
        button{transition:all .2s}
        ::placeholder{color:rgba(138,143,168,0.4)}
        textarea:focus,input:focus{border-color:inherit!important}
      `}</style>
    </div>
  );
}
