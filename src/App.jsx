import { useState, useRef, useEffect, useCallback } from "react";
import * as mammoth from "mammoth";
 
/* ── Fonts ── */
const FONTS = `@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@300;400;500;600;700&family=JetBrains+Mono:wght@300;400;500;600&display=swap');`;
 
/* ── Global CSS ── */
const CSS = `
${FONTS}
*{box-sizing:border-box;margin:0;padding:0}
body{background:#03050d;overflow-x:hidden}
::selection{background:rgba(99,102,241,.35);color:#fff}
::-webkit-scrollbar{width:3px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:rgba(99,102,241,.4);border-radius:99px}
 
@keyframes rotateOrb{0%{transform:rotate(0deg) translateX(180px) rotate(0deg)}100%{transform:rotate(360deg) translateX(180px) rotate(-360deg)}}
@keyframes rotateOrb2{0%{transform:rotate(0deg) translateX(260px) rotate(0deg)}100%{transform:rotate(-360deg) translateX(260px) rotate(360deg)}}
@keyframes rotateOrb3{0%{transform:rotate(0deg) translateX(320px) rotate(0deg)}100%{transform:rotate(360deg) translateX(320px) rotate(-360deg)}}
@keyframes pulse3d{0%,100%{transform:scale(1) rotateX(0deg);opacity:.8}50%{transform:scale(1.04) rotateX(2deg);opacity:1}}
@keyframes float3d{0%,100%{transform:translateY(0px) rotateX(0deg) rotateZ(0deg)}33%{transform:translateY(-14px) rotateX(2deg) rotateZ(0.5deg)}66%{transform:translateY(-6px) rotateX(-1deg) rotateZ(-0.5deg)}}
@keyframes gridMove{0%{transform:perspective(800px) rotateX(60deg) translateY(0)}100%{transform:perspective(800px) rotateX(60deg) translateY(80px)}}
@keyframes slideUp{from{opacity:0;transform:translateY(40px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes shimText{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
@keyframes borderSpin{0%{background-position:0% 0%}100%{background-position:300% 0%}}
@keyframes scanDown{0%{transform:translateY(-100%)}100%{transform:translateY(100vh)}}
@keyframes glowPulse{0%,100%{box-shadow:0 0 20px rgba(99,102,241,.3),0 0 60px rgba(99,102,241,.1)}50%{box-shadow:0 0 40px rgba(99,102,241,.6),0 0 100px rgba(99,102,241,.2)}}
@keyframes countNum{0%{opacity:0;transform:scale(.3) translateY(20px)}60%{transform:scale(1.1)}100%{opacity:1;transform:scale(1) translateY(0)}}
@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
@keyframes progressShimmer{0%{background-position:-200px 0}100%{background-position:200px 0}}
@keyframes particleFly{0%{transform:translateY(0) translateX(0);opacity:1}100%{transform:translateY(-120px) translateX(var(--dx));opacity:0}}
@keyframes hoverLift{to{transform:translateY(-6px) rotateX(4deg) scale(1.02)}}
@keyframes dotBlink{0%,80%,100%{opacity:0}40%{opacity:1}}
@keyframes waveBar{0%,100%{transform:scaleY(.4)}50%{transform:scaleY(1)}}
 
.card3d{transform-style:preserve-3d;transition:transform .4s cubic-bezier(.4,0,.2,1),box-shadow .4s}
.card3d:hover{transform:translateY(-8px) rotateX(4deg) scale(1.015)}
button:active{transform:scale(.95)!important}
input:focus,textarea:focus{outline:none}
.glass{background:linear-gradient(135deg,rgba(255,255,255,.07) 0%,rgba(255,255,255,.02) 100%);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px)}
`;
 
/* ── Color Palette ── */
const C = {
  bg:"#03050d", bg2:"#060a18", bg3:"#0a0f20",
  indigo:"#6366f1", indigoDim:"#312e81", indigoGlow:"rgba(99,102,241,.25)",
  cyan:"#06b6d4", cyanDim:"#164e63", cyanGlow:"rgba(6,182,212,.2)",
  violet:"#8b5cf6", violetGlow:"rgba(139,92,246,.2)",
  emerald:"#10b981", emeraldGlow:"rgba(16,185,129,.15)",
  amber:"#f59e0b", rose:"#f43f5e",
  white:"#f8fafc", gray:"#94a3b8", grayDim:"#334155",
  border:"rgba(255,255,255,.08)", borderHi:"rgba(255,255,255,.15)",
};
 
/* ── Agents ── */
const AGENTS = [
  {id:1,name:"Input Parser",     tag:"PARSE",    desc:"Extracts full structure from your resume",   color:C.cyan,   icon:"◈"},
  {id:2,name:"JD Intelligence",  tag:"ANALYSE",  desc:"Deep-mines every keyword from the job post", color:C.violet, icon:"◉"},
  {id:3,name:"Content Architect",tag:"GENERATE", desc:"Rewrites every bullet with elite language",  color:C.emerald,icon:"◆"},
  {id:4,name:"ATS Optimizer",    tag:"OPTIMISE", desc:"Injects keywords across ALL sections",       color:C.amber,  icon:"◇"},
  {id:5,name:"Quality Scorer",   tag:"SCORE",    desc:"Calculates ATS score and improvement plan",  color:C.rose,   icon:"◎"},
];
 
/* ── Helpers ── */
function tryJSON(t,f){try{return JSON.parse(t.replace(/```json\n?/gi,"").replace(/```\n?/gi,"").trim())}catch{try{const m=t.match(/\{[\s\S]*\}/);if(m)return JSON.parse(m[0])}catch{}return f}}
async function askAI(system,user,maxTokens=2000){
  async function askAI(system, user, agent = "parser", maxTokens = 2000) {
  const r = await fetch("/api/groq", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      system,
      user,
      agent,
      maxTokens
    }),
  });

  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.text || "";
}
function loadPDF(){return new Promise((res,rej)=>{if(window.pdfjsLib){res(window.pdfjsLib);return}const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";s.onload=()=>{window.pdfjsLib.GlobalWorkerOptions.workerSrc="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";res(window.pdfjsLib)};s.onerror=rej;document.head.appendChild(s)})}
async function readPDF(ab){const l=await loadPDF();const p=await l.getDocument({data:ab}).promise;let o="";for(let i=1;i<=p.numPages;i++){const pg=await p.getPage(i);const c=await pg.getTextContent();o+=c.items.map(x=>x.str).join(" ")+"\n"}return o}
async function readDOCX(ab){const r=await mammoth.extractRawText({arrayBuffer:ab});return r.value}
 
/* ── 3D Rotating Scene ── */
function Scene3D(){
  return(
    <div style={{position:"fixed",inset:0,zIndex:0,overflow:"hidden",pointerEvents:"none"}}>
      {/* Deep space gradient */}
      <div style={{position:"absolute",inset:0,background:`radial-gradient(ellipse 80% 60% at 50% -10%,rgba(99,102,241,.18) 0%,transparent 70%),radial-gradient(ellipse 60% 50% at 90% 90%,rgba(139,92,246,.12) 0%,transparent 60%),radial-gradient(ellipse 50% 40% at 10% 80%,rgba(6,182,212,.1) 0%,transparent 60%),#03050d`}}/>
 
      {/* 3D perspective grid floor */}
      <div style={{position:"absolute",bottom:0,left:"-50%",right:"-50%",height:"60%",overflow:"hidden"}}>
        <div style={{position:"absolute",inset:0,backgroundImage:`linear-gradient(rgba(99,102,241,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(99,102,241,.12) 1px,transparent 1px)`,backgroundSize:"60px 60px",transform:"perspective(600px) rotateX(70deg) translateY(20%)",animation:"gridMove 8s linear infinite",opacity:.6}}/>
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:"40%",background:"linear-gradient(to top,#03050d,transparent)"}}/>
      </div>
 
      {/* Orbiting light orbs */}
      <div style={{position:"absolute",top:"50%",left:"50%",width:0,height:0}}>
        <div style={{position:"absolute",width:8,height:8,borderRadius:"50%",background:C.indigo,boxShadow:`0 0 20px 6px ${C.indigoGlow}`,animation:"rotateOrb 14s linear infinite",marginLeft:-4,marginTop:-4}}/>
        <div style={{position:"absolute",width:5,height:5,borderRadius:"50%",background:C.cyan,boxShadow:`0 0 16px 4px ${C.cyanGlow}`,animation:"rotateOrb2 20s linear infinite reverse",marginLeft:-2,marginTop:-2}}/>
        <div style={{position:"absolute",width:4,height:4,borderRadius:"50%",background:C.violet,boxShadow:`0 0 14px 3px ${C.violetGlow}`,animation:"rotateOrb3 28s linear infinite",marginLeft:-2,marginTop:-2}}/>
      </div>
 
      {/* Large blurred orbs */}
      <div style={{position:"absolute",top:"15%",left:"5%",width:500,height:500,borderRadius:"50%",background:`radial-gradient(circle,rgba(99,102,241,.08),transparent 70%)`,filter:"blur(2px)"}}/>
      <div style={{position:"absolute",bottom:"10%",right:"5%",width:600,height:600,borderRadius:"50%",background:`radial-gradient(circle,rgba(139,92,246,.07),transparent 70%)`,filter:"blur(2px)"}}/>
      <div style={{position:"absolute",top:"45%",left:"40%",width:300,height:300,borderRadius:"50%",background:`radial-gradient(circle,rgba(6,182,212,.06),transparent 70%)`,filter:"blur(1px)"}}/>
 
      {/* Scan line */}
      <div style={{position:"absolute",left:0,right:0,height:"1px",background:`linear-gradient(to right,transparent,${C.indigo}60,transparent)`,animation:"scanDown 6s linear infinite",opacity:.5}}/>
 
      {/* Noise grain */}
      <div style={{position:"absolute",inset:0,opacity:.025,backgroundImage:"url(\"data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")"}}/>
    </div>
  );
}
 
/* ── Glowing Badge ── */
function Badge({children,color=C.indigo}){
  return(
    <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"5px 14px",borderRadius:99,background:`${color}18`,border:`1px solid ${color}40`,color,fontSize:9,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,fontWeight:600,textTransform:"uppercase",boxShadow:`0 0 12px ${color}20`}}>
      {children}
    </span>
  );
}
 
/* ── Score Ring 3D ── */
function ScoreRing({score}){
  const s=Math.min(Math.max(score,0),100);
  const r=56,circ=2*Math.PI*r;
  const col=s>=80?C.emerald:s>=60?C.amber:C.rose;
  const verdict=s>=80?"EXCEPTIONAL":s>=60?"STRONG":s>=40?"FAIR":"NEEDS WORK";
  return(
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10,perspective:300}}>
      <div style={{position:"relative",animation:"float3d 5s ease-in-out infinite",filter:`drop-shadow(0 20px 40px ${col}44)`}}>
        <svg width={160} height={160} viewBox="0 0 160 160">
          <defs>
            <linearGradient id="rg1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={col} stopOpacity=".2"/>
              <stop offset="100%" stopColor={col}/>
            </linearGradient>
            <filter id="gf"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
            <radialGradient id="bg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={`${col}10`}/>
              <stop offset="100%" stopColor="transparent"/>
            </radialGradient>
          </defs>
          <circle cx="80" cy="80" r="75" fill="url(#bg)"/>
          <circle cx="80" cy="80" r={r+16} fill="none" stroke={`${col}08`} strokeWidth="1"/>
          <circle cx="80" cy="80" r={r+8} fill="none" stroke={`${col}10`} strokeWidth="1"/>
          <circle cx="80" cy="80" r={r} fill="none" stroke={`${col}15`} strokeWidth="10"/>
          <circle cx="80" cy="80" r={r} fill="none" stroke="url(#rg1)" strokeWidth="10"
            strokeDasharray={`${(s/100)*circ} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 80 80)" filter="url(#gf)"
            style={{transition:"stroke-dasharray 2s cubic-bezier(.4,0,.2,1)"}}/>
          {[0,25,50,75,100].map(v=>{const a=(v/100)*2*Math.PI-Math.PI/2;return<circle key={v} cx={80+(r+18)*Math.cos(a)} cy={80+(r+18)*Math.sin(a)} r="2" fill={`${col}60`}/>})}
        </svg>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
          <span style={{fontSize:42,fontWeight:800,fontFamily:"'Outfit',sans-serif",color:col,lineHeight:1,animation:"countNum .8s cubic-bezier(.4,0,.2,1) forwards"}}>{s}</span>
          <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:`${col}60`,letterSpacing:1}}>/100 ATS</span>
        </div>
      </div>
      <Badge color={col}>{verdict}</Badge>
    </div>
  );
}
 
/* ── Glass Card with 3D ── */
function GCard({children,style={},glow,noHover}){
  const [h,setH]=useState(false);
  return(
    <div onMouseEnter={()=>!noHover&&setH(true)} onMouseLeave={()=>setH(false)}
      style={{background:"linear-gradient(135deg,rgba(255,255,255,.06) 0%,rgba(255,255,255,.02) 50%,rgba(255,255,255,.04) 100%)",border:`1px solid ${h?C.borderHi:C.border}`,borderRadius:20,backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",transform:h&&!noHover?"translateY(-6px) rotateX(3deg) scale(1.01)":"none",transition:"all .35s cubic-bezier(.4,0,.2,1)",boxShadow:h?`0 20px 60px rgba(0,0,0,.6),0 0 0 1px ${glow||C.indigo}30,inset 0 1px 0 rgba(255,255,255,.1)`:`0 8px 40px rgba(0,0,0,.4),inset 0 1px 0 rgba(255,255,255,.06)`,transformStyle:"preserve-3d",...style}}>
      {children}
    </div>
  );
}
 
/* ── Form Builder ── */
function FormBuilder({onComplete}){
  const [form,setForm]=useState({name:"",email:"",phone:"",location:"",linkedin:"",summary:"",experience:[{company:"",title:"",dates:"",bullets:[""]}],education:[{degree:"",school:"",year:""}],skills:[""]});
  const upd=(p,v)=>setForm(prev=>{const c=JSON.parse(JSON.stringify(prev));const keys=p.split(".");let o=c;for(let i=0;i<keys.length-1;i++)o=isNaN(keys[i])?o[keys[i]]:o[+keys[i]];const l=keys[keys.length-1];isNaN(l)?o[l]=v:o[+l]=v;return c});
  const addExp=()=>setForm(p=>({...p,experience:[...p.experience,{company:"",title:"",dates:"",bullets:[""]}]}));
  const remExp=i=>setForm(p=>({...p,experience:p.experience.filter((_,j)=>j!==i)}));
  const addBlt=ei=>setForm(p=>{const e=[...p.experience];e[ei]={...e[ei],bullets:[...e[ei].bullets,""]};return{...p,experience:e}});
  const remBlt=(ei,bi)=>setForm(p=>{const e=[...p.experience];e[ei]={...e[ei],bullets:e[ei].bullets.filter((_,j)=>j!==bi)};return{...p,experience:e}});
  const addEdu=()=>setForm(p=>({...p,education:[...p.education,{degree:"",school:"",year:""}]}));
  const addSkl=()=>setForm(p=>({...p,skills:[...p.skills,""]}));
  const remSkl=i=>setForm(p=>({...p,skills:p.skills.filter((_,j)=>j!==i)}));
  const build=()=>{
    const lines=[form.name,[form.email,form.phone,form.location,form.linkedin].filter(Boolean).join(" | "),"",form.summary&&`SUMMARY\n${form.summary}`,"","EXPERIENCE",...form.experience.map(e=>`${e.title} — ${e.company} | ${e.dates}\n${e.bullets.filter(Boolean).map(b=>`- ${b}`).join("\n")}`),"EDUCATION",...form.education.map(e=>`${e.degree} — ${e.school} | ${e.year}`),"SKILLS",form.skills.filter(Boolean).join(", ")].filter(Boolean);
    onComplete(lines.join("\n"));
  };
  const fld={width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.white,fontFamily:"'JetBrains Mono',monospace",fontSize:12,outline:"none",boxSizing:"border-box",transition:"border-color .2s, box-shadow .2s"};
  const lbl={display:"block",fontSize:8,color:`${C.gray}80`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2,textTransform:"uppercase",marginBottom:5};
  const sec=(label,color=C.indigo)=>(
    <div style={{display:"flex",alignItems:"center",gap:10,margin:"18px 0 12px"}}>
      <div style={{width:3,height:14,borderRadius:2,background:`linear-gradient(to bottom,${color},transparent)`}}/>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:3,color,fontWeight:600}}>{label}</span>
      <div style={{flex:1,height:1,background:`linear-gradient(to right,${color}30,transparent)`}}/>
    </div>
  );
  const half={display:"grid",gridTemplateColumns:"1fr 1fr",gap:10};
  const focusFld=e=>{e.target.style.borderColor=`${C.indigo}60`;e.target.style.boxShadow=`0 0 0 3px ${C.indigoGlow}`};
  const blurFld=e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none"};
  return(
    <div style={{maxHeight:"60vh",overflowY:"auto",paddingRight:4}}>
      {sec("Personal Information",C.cyan)}
      <div style={{...half,marginBottom:10}}>
        {[["name","Full Name","Your full name"],["email","Email","your@email.com"],["phone","Phone","Your phone number"],["location","Location","City, Country"]].map(([k,l,p])=>(
          <div key={k} style={{marginBottom:8}}><label style={lbl}>{l}</label><input style={fld} value={form[k]} onChange={e=>upd(k,e.target.value)} placeholder={p} onFocus={focusFld} onBlur={blurFld}/></div>
        ))}
      </div>
      <div style={{marginBottom:10}}><label style={lbl}>LinkedIn</label><input style={fld} value={form.linkedin} onChange={e=>upd("linkedin",e.target.value)} placeholder="linkedin.com/in/your-profile" onFocus={focusFld} onBlur={blurFld}/></div>
      <div style={{marginBottom:14}}><label style={lbl}>Summary (optional — AI will create one)</label><textarea style={{...fld,minHeight:55,resize:"vertical"}} value={form.summary} onChange={e=>upd("summary",e.target.value)} placeholder="Brief career overview…"/></div>
      {sec("Experience",C.violet)}
      {form.experience.map((exp,ei)=>(
        <div key={ei} style={{background:"rgba(255,255,255,.025)",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:10}}>
            <span style={{fontSize:8,color:`${C.gray}60`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:2}}>POSITION {ei+1}</span>
            {form.experience.length>1&&<button onClick={()=>remExp(ei)} style={{background:"none",border:"none",color:C.rose,fontSize:10,fontFamily:"'JetBrains Mono',monospace",cursor:"pointer",letterSpacing:.5}}>✕ REMOVE</button>}
          </div>
          <div style={{...half,marginBottom:8}}>
            <div><label style={lbl}>Job Title</label><input style={fld} value={exp.title} onChange={e=>upd(`experience.${ei}.title`,e.target.value)} placeholder="e.g. Software Engineer" onFocus={focusFld} onBlur={blurFld}/></div>
            <div><label style={lbl}>Company</label><input style={fld} value={exp.company} onChange={e=>upd(`experience.${ei}.company`,e.target.value)} placeholder="Company name" onFocus={focusFld} onBlur={blurFld}/></div>
          </div>
          <div style={{marginBottom:10}}><label style={lbl}>Duration</label><input style={fld} value={exp.dates} onChange={e=>upd(`experience.${ei}.dates`,e.target.value)} placeholder="Jan 2023 – Dec 2023" onFocus={focusFld} onBlur={blurFld}/></div>
          <label style={lbl}>Key Responsibilities</label>
          {exp.bullets.map((b,bi)=>(
            <div key={bi} style={{display:"flex",gap:6,marginBottom:5}}>
              <input style={{...fld,flex:1}} value={b} onChange={e=>upd(`experience.${ei}.bullets.${bi}`,e.target.value)} placeholder="What you built or achieved…" onFocus={focusFld} onBlur={blurFld}/>
              {exp.bullets.length>1&&<button onClick={()=>remBlt(ei,bi)} style={{background:"none",border:"none",color:`${C.gray}60`,cursor:"pointer",fontSize:14}}>✕</button>}
            </div>
          ))}
          <button onClick={()=>addBlt(ei)} style={{background:"none",border:`1px dashed ${C.border}`,color:`${C.gray}60`,cursor:"pointer",fontSize:8,fontFamily:"'JetBrains Mono',monospace",padding:"5px 12px",borderRadius:6,marginTop:4,letterSpacing:1.5}}>+ ADD BULLET</button>
        </div>
      ))}
      <button onClick={addExp} style={{width:"100%",background:"none",border:`1px dashed rgba(139,92,246,.3)`,color:C.violet,cursor:"pointer",fontSize:8,fontFamily:"'JetBrains Mono',monospace",padding:"9px",borderRadius:10,marginBottom:14,letterSpacing:2}}>+ ADD EXPERIENCE</button>
      {sec("Education",C.emerald)}
      {form.education.map((ed,i)=>(
        <div key={i} style={{...half,background:"rgba(255,255,255,.025)",border:`1px solid ${C.border}`,borderRadius:12,padding:"12px",marginBottom:8}}>
          <div><label style={lbl}>Degree</label><input style={fld} value={ed.degree} onChange={e=>upd(`education.${i}.degree`,e.target.value)} placeholder="e.g. B.Tech Computer Science" onFocus={focusFld} onBlur={blurFld}/></div>
          <div><label style={lbl}>Institution</label><input style={fld} value={ed.school} onChange={e=>upd(`education.${i}.school`,e.target.value)} placeholder="University or College" onFocus={focusFld} onBlur={blurFld}/></div>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Year / Status</label><input style={fld} value={ed.year} onChange={e=>upd(`education.${i}.year`,e.target.value)} placeholder="2025 or Pursuing" onFocus={focusFld} onBlur={blurFld}/></div>
        </div>
      ))}
      <button onClick={addEdu} style={{width:"100%",background:"none",border:`1px dashed rgba(16,185,129,.3)`,color:C.emerald,cursor:"pointer",fontSize:8,fontFamily:"'JetBrains Mono',monospace",padding:"9px",borderRadius:10,marginBottom:14,letterSpacing:2}}>+ ADD EDUCATION</button>
      {sec("Skills",C.amber)}
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {form.skills.map((sk,i)=>(
          <div key={i} style={{display:"flex",gap:4,alignItems:"center"}}>
            <input style={{...fld,width:110}} value={sk} onChange={e=>upd(`skills.${i}`,e.target.value)} placeholder="e.g. Python" onFocus={focusFld} onBlur={blurFld}/>
            {form.skills.length>1&&<button onClick={()=>remSkl(i)} style={{background:"none",border:"none",color:`${C.gray}50`,cursor:"pointer",fontSize:13}}>✕</button>}
          </div>
        ))}
        <button onClick={addSkl} style={{background:"none",border:`1px dashed rgba(245,158,11,.3)`,color:C.amber,cursor:"pointer",fontSize:8,fontFamily:"'JetBrains Mono',monospace",padding:"5px 12px",borderRadius:6,letterSpacing:1.5}}>+ ADD</button>
      </div>
      <button onClick={build} style={{width:"100%",padding:"13px",background:`linear-gradient(135deg,${C.indigo},#4338ca)`,border:"none",borderRadius:12,color:"#fff",fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:600,cursor:"pointer",letterSpacing:2,boxShadow:`0 8px 32px ${C.indigoGlow}`}}>
        CONTINUE WITH MY DETAILS →
      </button>
    </div>
  );
}
 
/* ══ MAIN APP ═══════════════════════════════════════════════════════════════ */
export default function App(){
  const [page,setPage]=useState("home");
  const [mode,setMode]=useState("upload");
  const [rt,setRt]=useState("");
  const [jd,setJd]=useState("");
  const [upState,setUpState]=useState("idle");
  const [upName,setUpName]=useState("");
  const [upMsg,setUpMsg]=useState("");
  const [drag,setDrag]=useState(false);
  const [agActive,setAgActive]=useState(0);
  const [agDone,setAgDone]=useState([]);
  const [logs,setLogs]=useState([]);
  const [err,setErr]=useState("");
  const [result,setResult]=useState(null);
  const [tab,setTab]=useState("preview");
  const [tick,setTick]=useState(0);
  const logRef=useRef(null);
  const fileRef=useRef(null);
 
  useEffect(()=>{
    const s=document.createElement("style");
    s.innerHTML=CSS;document.head.appendChild(s);
    return()=>document.head.removeChild(s);
  },[]);
  useEffect(()=>{if(agActive>0){const t=setInterval(()=>setTick(x=>(x+1)%10),220);return()=>clearInterval(t)}},[agActive]);
  useEffect(()=>{if(logRef.current)logRef.current.scrollTop=9999},[logs]);
 
  const log=(msg,type="i")=>setLogs(p=>[...p,{msg,type,t:new Date().toLocaleTimeString("en-US",{hour12:false})}]);
 
  const procFile=useCallback(async(f)=>{
    if(!f)return;
    const ext=f.name.split(".").pop().toLowerCase();
    if(!["pdf","docx","doc"].includes(ext)){setUpState("error");setUpMsg("Use PDF or DOCX format");return}
    setUpState("loading");setUpName(f.name);setUpMsg("Extracting text…");
    try{
      const ab=await f.arrayBuffer();
      const text=ext==="pdf"?await readPDF(ab):await readDOCX(ab);
      if(!text.trim())throw new Error("No text found. Try Paste instead.");
      setRt(text.trim());setUpState("done");setUpMsg(`${text.trim().split(/\s+/).length} words extracted`);
    }catch(e){setUpState("error");setUpMsg(e.message)}
  },[]);
 
  const onDrop=e=>{e.preventDefault();setDrag(false);procFile(e.dataTransfer.files?.[0])};
 
  const runPipeline=async()=>{
    setPage("pipeline");setLogs([]);setAgDone([]);setErr("");setResult(null);
    try{
      setAgActive(1);log("Agent 1 — Parsing resume structure…");
      const r1=await ("Return ONLY valid JSON (no markdown):","Parse this resume into JSON: {name,contact:{email,phone,location,linkedin},summary,experience:[{company,title,dates,bullets:[]}],education:[{degree,school,year}],skills:[],projects:[],certifications:[]}\n\nResume:\n"+rt,1400);
      const parsed=tryJSON(r1,{name:"Candidate",contact:{},experience:[],education:[],skills:[]});
      setAgDone(p=>[...p,1]);log(`✓ ${parsed.experience?.length??0} roles · ${parsed.skills?.length??0} skills parsed`,"ok");
 
      setAgActive(2);log("Agent 2 — Deep job description analysis…");
      const r2=await askAI("Return ONLY valid JSON (no markdown):","Analyse this JD: {keywords:[],requiredSkills:[],niceToHave:[],topPriorities:[],roleLevel,domain,tools:[],softSkills:[],industryTerms:[]}\n\nJD:\n"+jd,1200);
      const jdData=tryJSON(r2,{keywords:[],requiredSkills:[],niceToHave:[],topPriorities:[],tools:[],softSkills:[],industryTerms:[]});
      setAgDone(p=>[...p,2]);log(`✓ ${jdData.keywords?.length??0} keywords · ${jdData.tools?.length??0} tools found`,"ok");
 
      setAgActive(3);log("Agent 3 — Rewriting with world-class content…");
      const r3=await askAI(
        "You are a world-class executive resume writer (15+ yrs). COMPLETELY TRANSFORM the resume. Every bullet = strong action verb + quantified result. 4+ bullets per role. Powerful 3-sentence summary. Group skills by category. Return ONLY valid JSON.",
        `JD: ${JSON.stringify(jdData)}\nCandidate: ${JSON.stringify(parsed)}\nReturn: {summary,experience:[{company,title,dates,bullets:[]}],skills:{[category]:[]}}`,3000);
      const gen=tryJSON(r3,{summary:"",experience:parsed.experience||[],skills:{}});
      setAgDone(p=>[...p,3]);log(`✓ ${gen.experience?.reduce((a,e)=>a+(e.bullets?.length??0),0)??0} power bullets crafted`,"ok");
 
      setAgActive(4);log("Agent 4 — Injecting ATS keywords everywhere…");
      const r4=await askAI(
        "ATS optimisation expert. Inject keywords into EVERY section naturally. Return ONLY valid JSON.",
        `Keywords: ${[...(jdData.keywords??[]),...(jdData.requiredSkills??[]),...(jdData.tools??[])].join(", ")}\nContent: ${JSON.stringify(gen)}\nReturn: {summary,experience:[{company,title,dates,bullets:[]}],skills:{[category]:[]},keywordsAdded:[],missingSkills:[]}`,2500);
      const ats=tryJSON(r4,{summary:gen.summary,experience:gen.experience,skills:gen.skills,keywordsAdded:[],missingSkills:[]});
      setAgDone(p=>[...p,4]);log(`✓ ${ats.keywordsAdded?.length??0} keywords woven in`,"ok");
 
      setAgActive(5);log("Agent 5 — Calculating ATS score…");
      const r5=await askAI(
        "ATS scoring engine. Return ONLY valid JSON.",
        `Resume: ${JSON.stringify(ats)}\nJD: ${JSON.stringify(jdData)}\nReturn: {totalScore,verdict,breakdown:{keywordMatch:{score,max:30,note},contentQuality:{score,max:35,note},formatting:{score,max:20,note},readability:{score,max:15,note}},strengths:[],suggestions:[],quickWins:[],missingSkills:[]}`,1000);
      const score=tryJSON(r5,{totalScore:78,verdict:"Strong",breakdown:{keywordMatch:{score:22,max:30,note:""},contentQuality:{score:27,max:35,note:""},formatting:{score:16,max:20,note:""},readability:{score:13,max:15,note:""}},strengths:[],suggestions:[],quickWins:[],missingSkills:[]});
      setAgDone(p=>[...p,5]);log(`✓ Score: ${score.totalScore}/100 — ${score.verdict}`,"ok");
 
      setAgActive(0);
      setResult({resume:{name:parsed.name,contact:parsed.contact,summary:ats.summary,experience:ats.experience,education:parsed.education,skills:ats.skills},score,missing:ats.missingSkills??[]});
      setPage("result");setTab("preview");
    }catch(e){setAgActive(0);setErr(e.message);log(`✗ ${e.message}`,"er")}
  };
 
  const downloadPDF=()=>{
    if(!result)return;
    const r=result.resume;
    const contact=Object.values(r.contact||{}).filter(Boolean).join("  |  ");
    const skillsHTML=typeof r.skills==="object"&&!Array.isArray(r.skills)?Object.entries(r.skills||{}).map(([cat,vals])=>`<p style="margin-bottom:5px"><strong>${cat}:</strong> ${Array.isArray(vals)?vals.join(", "):vals}</p>`).join(""):`<p>${Array.isArray(r.skills)?r.skills.join(", "):r.skills}</p>`;
    const expHTML=(r.experience||[]).map(ex=>`<div style="margin-bottom:16px"><div style="display:flex;justify-content:space-between"><strong style="font-size:11pt">${ex.title||""}</strong><span style="color:#555;font-size:9.5pt">${ex.dates||""}</span></div><div style="color:#444;font-size:10pt;font-style:italic;margin-bottom:5px">${ex.company||""}</div><ul style="margin:0;padding-left:18px">${(ex.bullets||[]).map(b=>`<li style="margin-bottom:3px;line-height:1.6;font-size:10.5pt;color:#222">${b}</li>`).join("")}</ul></div>`).join("");
    const eduHTML=(r.education||[]).map(ed=>`<div style="margin-bottom:4px;font-size:10.5pt"><strong>${typeof ed==="string"?ed:ed.degree||""}</strong>${ed.school?` — ${ed.school}`:""}${ed.year?` (${ed.year})`:""}</div>`).join("");
    const html=`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${r.name||"Resume"}</title><style>@page{margin:16mm 20mm}*{box-sizing:border-box;margin:0;padding:0}body{font-family:Arial,sans-serif;font-size:10.5pt;color:#1a1a1a;line-height:1.55}h1{font-family:Georgia,serif;font-size:22pt;margin-bottom:5px}.ct{font-size:9.5pt;color:#555;margin-bottom:16px;border-bottom:1px solid #ddd;padding-bottom:12px}.sh{font-size:8.5pt;letter-spacing:2px;text-transform:uppercase;font-weight:700;border-bottom:1.5px solid #111;padding-bottom:3px;margin:18px 0 10px}</style></head><body><h1>${r.name||"Your Name"}</h1><div class="ct">${contact}</div>${r.summary?`<div class="sh">Professional Summary</div><p style="font-size:10.5pt;line-height:1.65;color:#222">${r.summary}</p>`:""}<div class="sh">Experience</div>${expHTML}${skillsHTML?`<div class="sh">Skills</div>${skillsHTML}`:""}<div class="sh">Education</div>${eduHTML}</body></html>`;
    const blob=new Blob([html],{type:"text/html;charset=utf-8"});
    const url=URL.createObjectURL(blob);
    const win=window.open(url,"_blank");
    if(win)win.addEventListener("load",()=>setTimeout(()=>win.print(),300));
    else{const a=document.createElement("a");a.href=url;a.download=`${(r.name||"resume").replace(/\s+/g,"_")}_ATS.html`;a.click()}
    setTimeout(()=>URL.revokeObjectURL(url),15000);
  };
 
  /* ── UI Helpers ── */
  const SPIN=["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠧","⠇","⠏"][tick];
  const anim=(d=0)=>({opacity:0,animation:`slideUp .7s cubic-bezier(.4,0,.2,1) ${d}ms forwards`});
 
  const Btn=({children,onClick,color1=C.indigo,color2="#4338ca",outline,style:st={}})=>(
    <button onClick={onClick} style={{padding:"13px 30px",border:outline?`1px solid rgba(255,255,255,.15)`:"none",borderRadius:12,background:outline?"transparent":`linear-gradient(135deg,${color1},${color2})`,color:outline?C.gray:color1===C.indigo?"#fff":"#0a0e1a",fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:600,letterSpacing:2,cursor:"pointer",boxShadow:outline?"none":`0 8px 32px ${color1}35`,transition:"all .25s",textTransform:"uppercase",...st}}>
      {children}
    </button>
  );
 
  const tabBtn=(id,label,color,active)=>(
    <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"13px 8px",border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,letterSpacing:2,background:active?`${color}14`:"transparent",color:active?color:`${C.gray}50`,borderBottom:active?`2px solid ${color}`:"2px solid transparent",transition:"all .25s",textTransform:"uppercase"}}>
      {label}
    </button>
  );
 
  const inputFld={width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${C.border}`,borderRadius:12,padding:"14px 16px",color:C.white,fontFamily:"'JetBrains Mono',monospace",fontSize:12.5,resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.75,transition:"border-color .2s, box-shadow .2s"};
  const modTab=(active,col)=>({flex:1,padding:"13px",border:"none",cursor:"pointer",fontFamily:"'JetBrains Mono',monospace",fontSize:9,fontWeight:600,letterSpacing:2,background:active?`${col}14`:"transparent",color:active?col:`${C.gray}40`,borderBottom:active?`2px solid ${col}`:"2px solid transparent",transition:"all .25s",textTransform:"uppercase"});
 
  const sampleJD=`Junior ML Engineer — AI Product Team\n\nRequirements:\n- Python (NumPy, Pandas, scikit-learn)\n- Machine Learning fundamentals\n- Data preprocessing & feature engineering\n- SQL for data extraction\n- Jupyter Notebook / Google Colab\n- Git version control\n- Strong analytical mindset\n\nResponsibilities:\n- Build and evaluate ML models\n- Preprocess datasets for ML pipelines\n- Write Python scripts for automation\n- Document experiments and results\n\nNice to have: TensorFlow, PyTorch, Matplotlib, Flask, FastAPI`;
 
  /* ════════════════════════════════════════════════════════════════════════ */
  return(
    <div style={{minHeight:"100vh",background:C.bg,color:C.white,fontFamily:"'Space Grotesk',sans-serif",position:"relative"}}>
      <Scene3D/>
 
      {/* ── NAV ── */}
      <nav style={{position:"sticky",top:0,zIndex:100,background:"rgba(3,5,13,.9)",backdropFilter:"blur(24px)",WebkitBackdropFilter:"blur(24px)",borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1040,margin:"0 auto",padding:"0 28px",height:68,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          {/* Logo */}
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <div style={{width:44,height:44,borderRadius:12,background:`linear-gradient(135deg,${C.indigo},${C.violet})`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",fontSize:20,fontWeight:900,color:"#fff",boxShadow:`0 8px 28px ${C.indigoGlow},inset 0 1px 0 rgba(255,255,255,.25)`,transform:"rotateX(8deg) rotateY(-4deg)",transition:"transform .3s"}}>
              A
            </div>
            <div>
              <div style={{display:"flex",alignItems:"baseline",gap:8}}>
                <span style={{fontSize:17,fontWeight:700,fontFamily:"'Outfit',sans-serif",letterSpacing:-.3,background:`linear-gradient(135deg,${C.white},${C.gray})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>ATS Resume Builder</span>
                <span style={{fontSize:12,fontWeight:800,fontFamily:"'Outfit',sans-serif",background:`linear-gradient(135deg,${C.indigo},${C.violet})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",letterSpacing:.5}}>PRO</span>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,marginTop:2}}>
                <div style={{width:5,height:5,borderRadius:"50%",background:C.emerald,boxShadow:`0 0 6px ${C.emerald}`}}/>
                <span style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:`${C.gray}60`,letterSpacing:1.5}}>POWERED BY GEMINI 1.5 PRO  ·  5-AGENT AI</span>
              </div>
            </div>
          </div>
          {/* Badges */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            <Badge color={C.cyan}>PDF UPLOAD</Badge>
            <Badge color={C.violet}>FORM BUILDER</Badge>
            <Badge color={C.emerald}>GEMINI AI</Badge>
          </div>
        </div>
      </nav>
 
      <div style={{maxWidth:1040,margin:"0 auto",padding:"48px 24px",position:"relative",zIndex:1}}>
 
        {/* ══ HOME ════════════════════════════════════════════════════════ */}
        {page==="home"&&(
          <div>
            {/* Hero */}
            <div style={{textAlign:"center",padding:"10px 0 64px"}}>
              <div style={{...anim(0),marginBottom:20}}>
                <Badge color={C.indigo}>◆ 5 Specialized AI Agents  ·  Gemini 1.5 Pro  ·  ATS Optimised</Badge>
              </div>
              <h1 style={{...anim(120),fontFamily:"'Outfit',sans-serif",fontWeight:900,lineHeight:1.08,letterSpacing:-2,margin:"0 0 26px"}}>
                <div style={{fontSize:"clamp(38px,6vw,72px)",background:`linear-gradient(180deg,${C.white} 0%,rgba(248,250,252,.5) 100%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                  From Ordinary Resume
                </div>
                <div style={{fontSize:"clamp(38px,6vw,72px)",background:`linear-gradient(135deg,${C.indigo} 0%,${C.violet} 40%,${C.cyan} 80%)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundSize:"200% 200%",animation:"shimText 5s ease infinite"}}>
                  To Dream Job Offer
                </div>
              </h1>
              <p style={{...anim(240),fontSize:16,color:`${C.gray}90`,lineHeight:1.9,maxWidth:560,margin:"0 auto 44px",fontWeight:400}}>
                Upload your PDF · Paste a job description · Watch 5 AI agents completely rewrite,
                ATS-optimise and score your resume in under 60 seconds.
              </p>
              <div style={{...anim(340),display:"flex",gap:14,justifyContent:"center",flexWrap:"wrap"}}>
                <Btn onClick={()=>setPage("input")} style={{fontSize:13,padding:"15px 44px",boxShadow:`0 12px 48px ${C.indigoGlow}`}}>
                  Start Building Free →
                </Btn>
                <Btn outline onClick={()=>{setRt("Your Name\nyour@email.com | +1 555-0000 | City, Country\n\nSUMMARY\nDedicated professional with experience in software development.\n\nEXPERIENCE\nDeveloper — Tech Company | 2021–2024\n- Worked on projects\n- Fixed bugs and issues\n\nEDUCATION\nB.S. Computer Science | 2021\n\nSKILLS\nJavaScript, Python, React, SQL");setPage("jd")}}>
                  Try Demo
                </Btn>
              </div>
            </div>
 
            {/* Feature Cards 3D Grid */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:52,...anim(440)}}>
              {[
                [C.cyan,"📂","PDF & DOCX Upload","Drop your old resume — AI extracts text and rebuilds it completely"],
                [C.violet,"📋","Smart Form Builder","No resume? Fill a guided form and AI creates one from scratch"],
                [C.emerald,"✍️","Full AI Rewrite","Every bullet rewritten with action verbs and measurable achievements"],
                [C.amber,"🎯","Keyword Injection","JD keywords injected into bullets, summary and skills section"],
                [C.rose,"📊","ATS Score + Plan","0–100 score with a specific improvement roadmap"],
              ].map(([col,icon,title,text],i)=>(
                <div key={i} style={{...anim(500+i*70),perspective:400}}>
                  <GCard glow={col} style={{padding:"22px 20px",height:"100%"}}>
                    <div style={{fontSize:26,marginBottom:12}}>{icon}</div>
                    <div style={{fontSize:13.5,fontWeight:600,fontFamily:"'Outfit',sans-serif",marginBottom:7,color:C.white}}>{title}</div>
                    <div style={{fontSize:12,color:`${C.gray}80`,lineHeight:1.65,fontWeight:400}}>{text}</div>
                    <div style={{height:1,background:`linear-gradient(to right,${col}40,transparent)`,marginTop:16}}/>
                  </GCard>
                </div>
              ))}
            </div>
 
            {/* Pipeline preview */}
            <div style={anim(900)}>
              <GCard noHover style={{padding:"30px 36px"}}>
                <div style={{textAlign:"center",marginBottom:24}}>
                  <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:`${C.gray}50`,letterSpacing:3,marginBottom:8}}>HOW IT WORKS</div>
                  <div style={{fontSize:19,fontWeight:700,fontFamily:"'Outfit',sans-serif"}}>The 5-Agent AI Pipeline</div>
                </div>
                <div style={{display:"flex",alignItems:"center",overflowX:"auto",paddingBottom:8,gap:0}}>
                  {AGENTS.map((ag,i)=>(
                    <div key={ag.id} style={{display:"flex",alignItems:"center",flex:1,minWidth:0}}>
                      <div style={{textAlign:"center",flex:1,padding:"0 4px"}}>
                        <div style={{width:48,height:48,borderRadius:14,background:`${ag.color}14`,border:`1px solid ${ag.color}30`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 10px",boxShadow:`0 4px 24px ${ag.color}18`,fontSize:10,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:ag.color}}>
                          {String(ag.id).padStart(2,"0")}
                        </div>
                        <div style={{fontSize:8,color:ag.color,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5,marginBottom:4}}>{ag.tag}</div>
                        <div style={{fontSize:10.5,color:`${C.gray}70`,lineHeight:1.4,fontWeight:500}}>{ag.name}</div>
                      </div>
                      {i<4&&(
                        <div style={{width:20,flexShrink:0,display:"flex",flexDirection:"column",gap:3,marginBottom:24}}>
                          {[0,1,2].map(j=><div key={j} style={{height:1,background:`linear-gradient(to right,${ag.color}40,${AGENTS[i+1].color}40)`,animation:`progressPulse ${1.2+j*.2}s ease-in-out infinite`}}/>)}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </GCard>
            </div>
          </div>
        )}
 
        {/* ══ INPUT ════════════════════════════════════════════════════════ */}
        {page==="input"&&(
          <div style={anim()}>
            <div style={{marginBottom:32}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:`${C.indigo}80`,letterSpacing:3,background:`${C.indigo}14`,border:`1px solid ${C.indigo}30`,padding:"4px 12px",borderRadius:99}}>STEP 01 / 02</div>
              </div>
              <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:32,fontWeight:800,letterSpacing:-.5,margin:"0 0 8px"}}>Your Resume</h2>
              <p style={{color:`${C.gray}70`,fontSize:14,lineHeight:1.6}}>Three ways to provide your information — Gemini AI handles the rest.</p>
            </div>
            <GCard noHover style={{padding:"30px 32px"}}>
              <div style={{display:"flex",borderRadius:12,overflow:"hidden",border:`1px solid ${C.border}`,marginBottom:26,background:"rgba(0,0,0,.3)"}}>
                <button style={modTab(mode==="upload",C.cyan)} onClick={()=>setMode("upload")}>⬆ Upload File</button>
                <button style={modTab(mode==="paste",C.emerald)} onClick={()=>setMode("paste")}>✎ Paste Text</button>
                <button style={modTab(mode==="form",C.violet)} onClick={()=>setMode("form")}>☰ Fill Form</button>
              </div>
 
              {mode==="upload"&&(
                <>
                  <div onClick={()=>fileRef.current?.click()} onDragOver={e=>{e.preventDefault();setDrag(true)}} onDragLeave={()=>setDrag(false)} onDrop={onDrop}
                    style={{border:`2px dashed ${drag?C.cyan:upState==="done"?C.emerald:upState==="error"?C.rose:C.border}`,borderRadius:16,padding:"52px 24px",textAlign:"center",cursor:"pointer",background:drag?`${C.cyan}06`:upState==="done"?`${C.emerald}06`:upState==="error"?`${C.rose}06`:"rgba(255,255,255,.015)",transition:"all .25s",marginBottom:16,position:"relative",overflow:"hidden"}}>
                    {/* Top shimmer line */}
                    <div style={{position:"absolute",top:0,left:0,right:0,height:1,background:drag?`linear-gradient(to right,transparent,${C.cyan},transparent)`:upState==="done"?`linear-gradient(to right,transparent,${C.emerald},transparent)`:`linear-gradient(to right,transparent,${C.indigo}40,transparent)`}}/>
                    <div style={{fontSize:52,marginBottom:16,lineHeight:1}}>
                      {upState==="loading"?"⏳":upState==="done"?"✅":upState==="error"?"❌":"📂"}
                    </div>
                    {upState==="idle"&&<>
                      <div style={{fontSize:17,fontFamily:"'Outfit',sans-serif",fontWeight:600,color:C.white,marginBottom:8}}>Drop your resume here</div>
                      <div style={{fontSize:11,color:`${C.gray}50`,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1,marginBottom:20}}>PDF · DOCX · DOC supported</div>
                      <div style={{display:"inline-flex",alignItems:"center",gap:8,padding:"11px 28px",background:`linear-gradient(135deg,${C.indigo}25,${C.violet}20)`,border:`1px solid ${C.indigo}40`,borderRadius:10,color:C.indigo,fontFamily:"'JetBrains Mono',monospace",fontSize:10,fontWeight:600,letterSpacing:2,boxShadow:`0 4px 20px ${C.indigoGlow}`}}>
                        BROWSE FILES
                      </div>
                    </>}
                    {upState==="loading"&&<div style={{fontSize:13,color:C.amber,fontFamily:"'JetBrains Mono',monospace",letterSpacing:.5}}>{upName} — reading…</div>}
                    {upState==="done"&&<>
                      <div style={{fontSize:15,color:C.emerald,fontFamily:"'Outfit',sans-serif",fontWeight:600,marginBottom:6}}>✓ {upName}</div>
                      <div style={{fontSize:10,color:`${C.emerald}70`,fontFamily:"'JetBrains Mono',monospace"}}>{upMsg}</div>
                    </>}
                    {upState==="error"&&<>
                      <div style={{fontSize:15,color:C.rose,fontFamily:"'Outfit',sans-serif",fontWeight:600,marginBottom:6}}>Upload Failed</div>
                      <div style={{fontSize:10,color:`${C.rose}70`,fontFamily:"'JetBrains Mono',monospace"}}>{upMsg}</div>
                    </>}
                    <input ref={fileRef} type="file" accept=".pdf,.docx,.doc" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])procFile(e.target.files[0]);e.target.value=""}}/>
                  </div>
                  {upState==="done"&&(
                    <GCard noHover style={{padding:"14px 18px",marginBottom:14}}>
                      <div style={{fontSize:7,fontFamily:"'JetBrains Mono',monospace",color:`${C.gray}40`,letterSpacing:2,marginBottom:8}}>EXTRACTED TEXT PREVIEW</div>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:`${C.gray}60`,maxHeight:75,overflowY:"auto",whiteSpace:"pre-wrap",lineHeight:1.5}}>{rt.slice(0,400)}…</div>
                    </GCard>
                  )}
                  {(upState==="done"||upState==="error")&&<button style={{...Btn,padding:"9px 18px",border:`1px solid ${C.border}`,borderRadius:10,background:"transparent",color:`${C.gray}60`,fontFamily:"'JetBrains Mono',monospace",fontSize:9,letterSpacing:1.5,marginBottom:16,cursor:"pointer"}} onClick={()=>{setUpState("idle");setUpName("");setUpMsg("");setRt("")}}>↺ Try Different File</button>}
                </>
              )}
 
              {mode==="paste"&&(
                <>
                  <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:`${C.gray}40`,letterSpacing:2,marginBottom:8}}>PASTE YOUR RESUME</div>
                  <textarea style={{...inputFld,minHeight:260}} value={rt} onChange={e=>setRt(e.target.value)}
                    placeholder={"Your Name\nyour@email.com | Phone | Location\n\nSUMMARY\nYour professional summary...\n\nEXPERIENCE\nJob Title — Company | Date\n- What you did and achieved\n\nEDUCATION\nDegree — University | Year\n\nSKILLS\nSkill 1, Skill 2, Skill 3"}
                    onFocus={e=>{e.target.style.borderColor=`${C.emerald}50`;e.target.style.boxShadow=`0 0 0 3px ${C.emeraldGlow}`}}
                    onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none"}}/>
                  {rt.trim()&&<div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:`${C.gray}40`,letterSpacing:1.5,marginTop:7}}>{rt.trim().split(/\s+/).length} WORDS DETECTED</div>}
                </>
              )}
 
              {mode==="form"&&<FormBuilder onComplete={text=>{setRt(text);setMode("paste")}}/>}
 
              {mode!=="form"&&(
                <div style={{display:"flex",gap:12,marginTop:22,alignItems:"center"}}>
                  <Btn outline onClick={()=>setPage("home")}>← Home</Btn>
                  <div style={{flex:1}}/>
                  <Btn onClick={()=>setPage("jd")} style={{opacity:rt.trim()?1:.3,cursor:rt.trim()?"pointer":"not-allowed"}}>
                    Next: Job Description →
                  </Btn>
                </div>
              )}
            </GCard>
          </div>
        )}
 
        {/* ══ JD ══════════════════════════════════════════════════════════ */}
        {page==="jd"&&(
          <div style={anim()}>
            <div style={{marginBottom:32}}>
              <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:`${C.violet}80`,letterSpacing:3,background:`${C.violet}14`,border:`1px solid ${C.violet}30`,padding:"4px 12px",borderRadius:99}}>STEP 02 / 02</div>
              </div>
              <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:32,fontWeight:800,letterSpacing:-.5,margin:"0 0 8px"}}>Target Job Description</h2>
              <p style={{color:`${C.gray}70`,fontSize:14}}>Paste the full job post — Gemini extracts every requirement and tailors your resume precisely.</p>
            </div>
            <GCard noHover style={{padding:"30px 32px"}}>
              <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:`${C.gray}40`,letterSpacing:2,marginBottom:8}}>JOB DESCRIPTION TEXT</div>
              <textarea style={{...inputFld,minHeight:300}} value={jd} onChange={e=>setJd(e.target.value)}
                placeholder={"Paste the complete job posting here...\n\nJob Title — Company\n\nRequirements:\n- Required skills\n- Technologies\n\nResponsibilities:\n- What you will do\n\nNice to have:\n- Bonus skills"}
                onFocus={e=>{e.target.style.borderColor=`${C.violet}50`;e.target.style.boxShadow=`0 0 0 3px ${C.violetGlow}`}}
                onBlur={e=>{e.target.style.borderColor=C.border;e.target.style.boxShadow="none"}}/>
              {jd.trim()&&<div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:`${C.gray}40`,letterSpacing:1.5,marginTop:7}}>{jd.trim().split(/\s+/).length} WORDS</div>}
              <div style={{display:"flex",gap:12,marginTop:22,flexWrap:"wrap",alignItems:"center"}}>
                <Btn outline onClick={()=>setPage("input")}>← Back</Btn>
                <Btn outline onClick={()=>setJd(sampleJD)} style={{borderColor:`${C.violet}40`,color:`${C.violet}80`,fontSize:9}}>Load Sample JD</Btn>
                <div style={{flex:1}}/>
                <Btn onClick={runPipeline} color1={C.violet} color2="#6d28d9" style={{opacity:jd.trim()?1:.3,cursor:jd.trim()?"pointer":"not-allowed"}}>
                  🚀 Launch AI Pipeline →
                </Btn>
              </div>
            </GCard>
          </div>
        )}
 
        {/* ══ PIPELINE ════════════════════════════════════════════════════ */}
        {page==="pipeline"&&(
          <div style={anim()}>
            <div style={{textAlign:"center",marginBottom:44}}>
              <div style={{fontSize:9,fontFamily:"'JetBrains Mono',monospace",color:`${C.gray}40`,letterSpacing:3,marginBottom:16}}>GEMINI 1.5 PRO · DEEP PROCESSING</div>
              <h2 style={{fontFamily:"'Outfit',sans-serif",fontSize:38,fontWeight:900,letterSpacing:-1,margin:"0 0 12px",background:`linear-gradient(135deg,${C.white},${C.indigo})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>
                Transforming Your Resume
              </h2>
              <p style={{color:`${C.gray}60`,fontSize:14}}>5 AI agents are collaborating — this takes 30–60 seconds</p>
            </div>
 
            {/* Progress */}
            <div style={{marginBottom:32}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:`${C.gray}40`,letterSpacing:1.5}}>PIPELINE PROGRESS</span>
                <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:C.indigo,letterSpacing:1}}>{agDone.length}/5 AGENTS COMPLETE</span>
              </div>
              <div style={{height:2,background:`${C.grayDim}40`,borderRadius:2,overflow:"hidden",position:"relative"}}>
                <div style={{height:"100%",width:`${(agDone.length/5)*100}%`,background:`linear-gradient(to right,${C.indigo},${C.violet},${C.cyan})`,transition:"width .8s cubic-bezier(.4,0,.2,1)",boxShadow:`0 0 20px ${C.indigoGlow}`}}/>
              </div>
            </div>
 
            <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:24}}>
              {AGENTS.map((ag,i)=>{
                const isDone=agDone.includes(ag.id),isActive=agActive===ag.id;
                return(
                  <div key={ag.id} style={anim(i*50)}>
                    <div style={{display:"flex",alignItems:"center",gap:16,padding:"18px 22px",borderRadius:16,background:isDone?`${ag.color}07`:isActive?`${ag.color}05`:"rgba(255,255,255,.02)",border:`1px solid ${isDone?`${ag.color}35`:isActive?`${ag.color}45`:C.border}`,transition:"all .4s",boxShadow:isActive?`0 0 30px ${ag.color}18`:"none"}}>
                      {/* Icon box */}
                      <div style={{width:50,height:50,borderRadius:14,flexShrink:0,background:isDone?`${ag.color}18`:isActive?`${ag.color}14`:"rgba(255,255,255,.04)",border:`1px solid ${isDone?`${ag.color}50`:isActive?`${ag.color}50`:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isDone?20:12,color:isDone?ag.color:isActive?ag.color:`${C.gray}40`,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,boxShadow:isActive?`0 0 24px ${ag.color}30,inset 0 1px 0 ${ag.color}20`:"none",transition:"all .35s"}}>
                        {isDone?"✓":isActive?SPIN:String(ag.id).padStart(2,"0")}
                      </div>
                      <div style={{flex:1}}>
                        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:5}}>
                          <span style={{fontFamily:"'Outfit',sans-serif",fontSize:15,fontWeight:600,color:isDone?ag.color:isActive?C.white:`${C.gray}50`,transition:"color .3s"}}>{ag.name}</span>
                          <span style={{padding:"2px 9px",borderRadius:99,background:`${isDone?ag.color:isActive?ag.color:C.gray}15`,border:`1px solid ${isDone?`${ag.color}35`:isActive?`${ag.color}35`:`${C.gray}20`}`,color:isDone?ag.color:isActive?ag.color:`${C.gray}40`,fontSize:7,fontFamily:"'JetBrains Mono',monospace",letterSpacing:1.5}}>{ag.tag}</span>
                        </div>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:isDone?`${ag.color}60`:isActive?`${C.gray}70`:`${C.gray}30`}}>
                          {isDone?"Completed ✓":isActive?ag.desc:"Queued…"}
                        </div>
                        {isActive&&<div style={{height:1.5,background:`linear-gradient(to right,${ag.color},${ag.color}40,transparent)`,marginTop:10,borderRadius:1,animation:"progressShimmer 2s ease infinite",backgroundSize:"200px 100%"}}/>}
                      </div>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:`${C.gray}25`,letterSpacing:1}}>{ag.id} / 5</span>
                    </div>
                  </div>
                );
              })}
            </div>
 
            {/* Terminal log */}
            <GCard noHover style={{padding:"18px 22px"}}>
              <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:7,color:`${C.gray}35`,letterSpacing:2.5,marginBottom:10}}>◆ LIVE AGENT LOG</div>
              <div ref={logRef} style={{maxHeight:110,overflowY:"auto"}}>
                {logs.map((l,i)=>(
                  <div key={i} style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10.5,display:"flex",gap:10,marginBottom:3,lineHeight:1.5}}>
                    <span style={{color:`${C.gray}25`,flexShrink:0}}>{l.t}</span>
                    <span style={{color:l.type==="ok"?C.emerald:l.type==="er"?C.rose:`${C.gray}55`}}>{l.msg}</span>
                  </div>
                ))}
                {agActive>0&&!err&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:`${C.gray}30`,marginTop:4}}>▮ processing…</div>}
              </div>
            </GCard>
 
            {err&&(
              <GCard noHover style={{padding:"18px 22px",marginTop:12,border:`1px solid ${C.rose}30`,background:`${C.rose}06`}}>
                <div style={{color:C.rose,fontFamily:"'JetBrains Mono',monospace",fontSize:12,marginBottom:12}}>✗ {err}</div>
                <Btn outline onClick={()=>setPage("jd")}>← Retry</Btn>
              </GCard>
            )}
          </div>
        )}
 
        {/* ══ RESULT ══════════════════════════════════════════════════════ */}
        {page==="result"&&result&&(
          <div style={anim()}>
            {/* Score Panel */}
            <GCard noHover glow={C.indigo} style={{padding:"36px",marginBottom:16}}>
              <div style={{display:"flex",flexWrap:"wrap",gap:32,alignItems:"flex-start"}}>
                <ScoreRing score={result.score.totalScore}/>
                <div style={{flex:1,minWidth:180}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:18}}>
                    <div style={{width:2,height:14,borderRadius:2,background:`linear-gradient(to bottom,${C.cyan},transparent)`}}/>
                    <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:3,color:C.cyan,fontWeight:600}}>SCORE BREAKDOWN</span>
                  </div>
                  {Object.entries(result.score.breakdown||{}).map(([k,v])=>{
                    const pct=v.max?(v.score/v.max)*100:v.score;
                    const col=pct>=80?C.emerald:pct>=55?C.amber:C.rose;
                    return(
                      <div key={k} style={{marginBottom:14}}>
                        <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:`${C.gray}60`,letterSpacing:.5}}>{k.replace(/([A-Z])/g," $1").toUpperCase()}</span>
                          <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:9,color:col,fontWeight:600}}>{v.score}/{v.max}</span>
                        </div>
                        <div style={{height:3,background:"rgba(255,255,255,.05)",borderRadius:2,overflow:"hidden"}}>
                          <div style={{height:"100%",width:`${pct}%`,background:`linear-gradient(to right,${col}80,${col})`,borderRadius:2,transition:"width 2s cubic-bezier(.4,0,.2,1)",boxShadow:`0 0 10px ${col}50`}}/>
                        </div>
                        {v.note&&<div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:`${C.gray}30`,marginTop:3}}>{v.note}</div>}
                      </div>
                    );
                  })}
                </div>
                <div style={{flex:1,minWidth:160}}>
                  {result.score.strengths?.length>0&&(
                    <div style={{marginBottom:18}}>
                      <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:C.emerald,letterSpacing:2.5,marginBottom:10,fontWeight:600}}>✓ STRENGTHS</div>
                      {result.score.strengths.map((s,i)=>(
                        <div key={i} style={{fontSize:12,color:`${C.gray}75`,marginBottom:7,display:"flex",gap:7,alignItems:"flex-start",lineHeight:1.55}}>
                          <span style={{color:C.emerald,flexShrink:0,marginTop:2}}>▸</span>{s}
                        </div>
                      ))}
                    </div>
                  )}
                  {result.missing?.length>0&&(
                    <>
                      <div style={{fontSize:8,fontFamily:"'JetBrains Mono',monospace",color:C.amber,letterSpacing:2.5,marginBottom:10,fontWeight:600}}>⚠ SKILL GAPS</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                        {result.missing.slice(0,8).map((s,i)=><Badge key={i} color={C.amber}>{s}</Badge>)}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </GCard>
 
            {/* Tabs */}
            <div style={{display:"flex",borderRadius:14,overflow:"hidden",border:`1px solid ${C.border}`,marginBottom:16,background:"rgba(0,0,0,.3)"}}>
              {tabBtn("preview","◈ Resume Preview",C.cyan,tab==="preview")}
              {tabBtn("suggest","◉ Suggestions",C.amber,tab==="suggest")}
              {tabBtn("wins","◆ Quick Wins",C.emerald,tab==="wins")}
            </div>
 
            {tab==="preview"&&(
              <GCard noHover style={{padding:"28px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:24,flexWrap:"wrap",gap:12}}>
                  <div>
                    <h3 style={{fontFamily:"'Outfit',sans-serif",fontSize:17,fontWeight:700,margin:"0 0 4px"}}>ATS-Optimised Resume</h3>
                    <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,color:`${C.gray}40`,letterSpacing:1.5}}>GEMINI ENHANCED · ATS-SAFE · PROFESSIONAL FORMAT</div>
                  </div>
                  <Btn onClick={downloadPDF} color1={C.emerald} color2="#059669">⬇ Download PDF</Btn>
                </div>
                <div style={{background:"#fff",borderRadius:12,padding:"40px 46px",boxShadow:"0 24px 80px rgba(0,0,0,.7)"}}>
                  <div style={{fontFamily:"Arial,Helvetica,sans-serif",color:"#1a1a1a",lineHeight:1.55}}>
                    <h1 style={{margin:0,fontSize:22,fontFamily:"Georgia,serif",color:"#0a0a0a",letterSpacing:"-.3px"}}>{result.resume.name}</h1>
                    <p style={{fontSize:9.5,color:"#555",margin:"5px 0 14px",paddingBottom:12,borderBottom:"1px solid #ebebeb"}}>{Object.values(result.resume.contact||{}).filter(Boolean).join("  |  ")}</p>
                    {result.resume.summary&&<><div style={{fontSize:8,letterSpacing:2,textTransform:"uppercase",fontWeight:700,borderBottom:"1.5px solid #111",paddingBottom:3,margin:"14px 0 9px"}}>Professional Summary</div><p style={{fontSize:10.5,lineHeight:1.65,color:"#222",margin:0}}>{result.resume.summary}</p></>}
                    {result.resume.experience?.length>0&&<>
                      <div style={{fontSize:8,letterSpacing:2,textTransform:"uppercase",fontWeight:700,borderBottom:"1.5px solid #111",paddingBottom:3,margin:"18px 0 10px"}}>Experience</div>
                      {result.resume.experience.map((ex,i)=>(
                        <div key={i} style={{marginBottom:14}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                            <strong style={{fontSize:11,color:"#111"}}>{ex.title}</strong>
                            <span style={{fontSize:9.5,color:"#666",whiteSpace:"nowrap"}}>{ex.dates}</span>
                          </div>
                          <div style={{fontSize:10,color:"#444",fontStyle:"italic",marginBottom:5}}>{ex.company}</div>
                          <ul style={{margin:0,paddingLeft:17}}>{(ex.bullets||[]).map((b,j)=><li key={j} style={{fontSize:10.5,lineHeight:1.6,marginBottom:2,color:"#222"}}>{b}</li>)}</ul>
                        </div>
                      ))}
                    </>}
                    {result.resume.skills&&Object.keys(result.resume.skills).length>0&&<>
                      <div style={{fontSize:8,letterSpacing:2,textTransform:"uppercase",fontWeight:700,borderBottom:"1.5px solid #111",paddingBottom:3,margin:"18px 0 10px"}}>Skills</div>
                      {typeof result.resume.skills==="object"&&!Array.isArray(result.resume.skills)?Object.entries(result.resume.skills).map(([cat,vals])=><p key={cat} style={{fontSize:10.5,marginBottom:4}}><strong>{cat}:</strong> {Array.isArray(vals)?vals.join(", "):vals}</p>):<p style={{fontSize:10.5}}>{Array.isArray(result.resume.skills)?result.resume.skills.join(", "):result.resume.skills}</p>}
                    </>}
                    {result.resume.education?.length>0&&<>
                      <div style={{fontSize:8,letterSpacing:2,textTransform:"uppercase",fontWeight:700,borderBottom:"1.5px solid #111",paddingBottom:3,margin:"18px 0 10px"}}>Education</div>
                      {result.resume.education.map((ed,i)=><div key={i} style={{fontSize:10.5,color:"#222",marginBottom:3}}><strong>{typeof ed==="string"?ed:ed.degree||""}</strong>{ed.school?` — ${ed.school}`:""}{ed.year?` (${ed.year})`:""}</div>)}
                    </>}
                  </div>
                </div>
                <div style={{marginTop:14,padding:"12px 16px",background:`${C.emerald}08`,border:`1px solid ${C.emerald}20`,borderRadius:10}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.emerald}}>💡 Click Download PDF → in print dialog choose <strong>Save as PDF</strong></span>
                </div>
              </GCard>
            )}
 
            {tab==="suggest"&&(
              <GCard noHover style={{padding:"28px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                  <div style={{width:2,height:14,borderRadius:2,background:`linear-gradient(to bottom,${C.amber},transparent)`}}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:3,color:C.amber,fontWeight:600}}>IMPROVEMENT SUGGESTIONS</span>
                </div>
                {!(result.score.suggestions?.length)&&<div style={{color:`${C.gray}40`,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>Resume is well optimised!</div>}
                {(result.score.suggestions||[]).map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:14,padding:"14px 18px",marginBottom:8,background:`${C.amber}05`,borderRadius:12,border:`1px solid ${C.amber}18`,...anim(i*50)}}>
                    <div style={{width:28,height:28,borderRadius:8,background:`${C.amber}15`,border:`1px solid ${C.amber}25`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:C.amber,flexShrink:0}}>{String(i+1).padStart(2,"0")}</div>
                    <div style={{fontSize:13,color:`${C.gray}85`,lineHeight:1.65}}>{s}</div>
                  </div>
                ))}
              </GCard>
            )}
 
            {tab==="wins"&&(
              <GCard noHover style={{padding:"28px"}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:20}}>
                  <div style={{width:2,height:14,borderRadius:2,background:`linear-gradient(to bottom,${C.emerald},transparent)`}}/>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:8,letterSpacing:3,color:C.emerald,fontWeight:600}}>QUICK WINS — DO THESE FIRST</span>
                </div>
                {!(result.score.quickWins?.length)&&<div style={{color:`${C.gray}40`,fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>Resume is already strong!</div>}
                {(result.score.quickWins||[]).map((w,i)=>(
                  <div key={i} style={{display:"flex",gap:12,padding:"14px 18px",marginBottom:8,background:`${C.emerald}05`,borderRadius:12,border:`1px solid ${C.emerald}18`,...anim(i*50)}}>
                    <span style={{color:C.emerald,fontSize:15,flexShrink:0}}>⚡</span>
                    <span style={{fontSize:13,color:`${C.gray}85`,lineHeight:1.65}}>{w}</span>
                  </div>
                ))}
              </GCard>
            )}
 
            <div style={{display:"flex",gap:10,justifyContent:"center",marginTop:18,flexWrap:"wrap"}}>
              <Btn outline onClick={()=>{setPage("home");setRt("");setJd("");setResult(null);setUpState("idle");setUpName("")}}>◈ Start Over</Btn>
              <Btn outline onClick={()=>setPage("jd")} style={{borderColor:`${C.violet}40`,color:`${C.violet}80`}}>← Change Job</Btn>
              <Btn onClick={downloadPDF} color1={C.emerald} color2="#059669">⬇ Download PDF</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
