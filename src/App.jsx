import { useState, useRef, useEffect, useCallback } from "react";
import * as mammoth from "mammoth";

// ─── Theme ─────────────────────────────────────────────────────────────────
const P = {
  bg:"#06101c", card:"#0b1929", hi:"#0f2138", border:"#1a3352",
  borderHi:"#234470", text:"#ddeaf8", sub:"#8aaac8", muted:"#3d607a",
  accent:"#2d7ff9", accentDim:"#1a4a90",
  green:"#22d38a", greenDim:"#0a3d25",
  amber:"#f5a623", amberDim:"#3d2700",
  red:"#e8525a", redDim:"#3a0f12",
  purple:"#9b7af0",
};

const AGENTS = [
  { id:1, name:"Parsing Agent",     icon:"◈", desc:"Extracting your full resume structure" },
  { id:2, name:"JD Analysis Agent", icon:"◉", desc:"Mining every keyword & requirement" },
  { id:3, name:"Content Agent",     icon:"◆", desc:"Aggressively rewriting every bullet point" },
  { id:4, name:"ATS Keyword Agent", icon:"◇", desc:"Injecting keywords across ALL sections" },
  { id:5, name:"Scoring Agent",     icon:"◎", desc:"Final ATS score & detailed feedback" },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
function tryJSON(text, fallback) {
  try {
    let clean = text.trim();
    // Strip markdown code fences
    clean = clean.replace(/^```(?:json)?\s*/i,"").replace(/\s*```$/,"").trim();
    return JSON.parse(clean);
  } catch {
    // Try to find first { } block
    try {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return fallback;
  }
}

async function askClaude(system, user, maxTokens = 2000) {
  const res = await fetch("/api/claude", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-opus-4-5",
      max_tokens: maxTokens,
      system,
      messages: [{ role:"user", content: user }],
    }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e?.error?.message || `HTTP ${res.status}`);
  }
  const d = await res.json();
  return d.content?.[0]?.text || "";
}

// ─── PDF.js loader ──────────────────────────────────────────────────────────
function loadPDFJS() {
  return new Promise((resolve, reject) => {
    if (window.pdfjsLib) { resolve(window.pdfjsLib); return; }
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
    s.onload = () => {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
      resolve(window.pdfjsLib);
    };
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function extractPDFText(ab) {
  const lib = await loadPDFJS();
  const pdf = await lib.getDocument({ data: ab }).promise;
  let out = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    out += content.items.map(x => x.str).join(" ") + "\n";
  }
  return out;
}

async function extractDOCXText(ab) {
  const result = await mammoth.extractRawText({ arrayBuffer: ab });
  return result.value;
}

// ─── Score Ring ─────────────────────────────────────────────────────────────
function Ring({ score }) {
  const r=44, c=2*Math.PI*r, fill=Math.min(Math.max(score,0),100);
  const color = fill>=80?P.green:fill>=60?P.amber:P.red;
  const verdict = fill>=80?"STRONG":fill>=60?"GOOD":fill>=40?"FAIR":"WEAK";
  return (
    <div style={{textAlign:"center"}}>
      <svg width="120" height="120" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#0d2035" strokeWidth="9"/>
        <circle cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9"
          strokeDasharray={`${(fill/100)*c} ${c}`} strokeLinecap="round"
          transform="rotate(-90 50 50)" style={{transition:"stroke-dasharray 1.4s ease"}}/>
        <text x="50" y="46" textAnchor="middle" fill={color} fontSize="22" fontWeight="800" fontFamily="monospace">{fill}</text>
        <text x="50" y="60" textAnchor="middle" fill={P.muted} fontSize="8" fontFamily="monospace">/100</text>
      </svg>
      <div style={{fontSize:9,fontFamily:"monospace",color,letterSpacing:2,marginTop:3,fontWeight:700}}>{verdict}</div>
    </div>
  );
}

// ─── Form Builder ────────────────────────────────────────────────────────────
function FormBuilder({ onComplete }) {
  const [form, setForm] = useState({
    name:"", email:"", phone:"", location:"", linkedin:"", summary:"",
    experience:[{ company:"", title:"", dates:"", bullets:["",""] }],
    education:[{ degree:"", school:"", year:"" }],
    skills:[""],
  });

  const upd = (path, val) => setForm(p => {
    const copy = JSON.parse(JSON.stringify(p));
    const keys = path.split(".");
    let o = copy;
    for (let i=0;i<keys.length-1;i++) o = isNaN(keys[i]) ? o[keys[i]] : o[+keys[i]];
    const last = keys[keys.length-1];
    if (isNaN(last)) o[last]=val; else o[+last]=val;
    return copy;
  });

  const addExp = ()=> setForm(p=>({...p,experience:[...p.experience,{company:"",title:"",dates:"",bullets:[""]}]}));
  const remExp = i=> setForm(p=>({...p,experience:p.experience.filter((_,j)=>j!==i)}));
  const addBlt = ei=> setForm(p=>{const e=[...p.experience];e[ei]={...e[ei],bullets:[...e[ei].bullets,""]};return{...p,experience:e};});
  const remBlt = (ei,bi)=> setForm(p=>{const e=[...p.experience];e[ei]={...e[ei],bullets:e[ei].bullets.filter((_,j)=>j!==bi)};return{...p,experience:e};});
  const addEdu = ()=> setForm(p=>({...p,education:[...p.education,{degree:"",school:"",year:""}]}));
  const addSkl = ()=> setForm(p=>({...p,skills:[...p.skills,""]}));
  const remSkl = i=> setForm(p=>({...p,skills:p.skills.filter((_,j)=>j!==i)}));

  const build = () => {
    const lines = [
      form.name,
      [form.email,form.phone,form.location,form.linkedin].filter(Boolean).join(" | "),
      "", form.summary && `SUMMARY\n${form.summary}`, "",
      "EXPERIENCE",
      ...form.experience.map(e=>`${e.title} — ${e.company} | ${e.dates}\n${e.bullets.filter(Boolean).map(b=>`- ${b}`).join("\n")}`),
      "EDUCATION",
      ...form.education.map(e=>`${e.degree} — ${e.school} | ${e.year}`),
      "SKILLS", form.skills.filter(Boolean).join(", "),
    ].filter(l=>l!==false&&l!==undefined&&l!==null);
    onComplete(lines.join("\n"));
  };

  const fld={width:"100%",background:"#060e1a",border:`1px solid ${P.border}`,borderRadius:7,padding:"9px 12px",color:"#8ab0cc",fontFamily:"monospace",fontSize:12,outline:"none",boxSizing:"border-box"};
  const lbl={display:"block",fontSize:9,color:P.muted,fontFamily:"monospace",letterSpacing:1.5,textTransform:"uppercase",marginBottom:5};
  const half={display:"grid",gridTemplateColumns:"1fr 1fr",gap:10};

  return (
    <div style={{maxHeight:"62vh",overflowY:"auto",paddingRight:6}}>
      <div style={{fontSize:10,color:P.accent,fontFamily:"monospace",letterSpacing:1,marginBottom:12,fontWeight:700}}>● PERSONAL INFORMATION</div>
      <div style={{...half,marginBottom:10}}>
        <div><label style={lbl}>Full Name *</label><input style={fld} value={form.name} onChange={e=>upd("name",e.target.value)} placeholder="PETER PARKER"/></div>
        <div><label style={lbl}>Email *</label><input style={fld} value={form.email} onChange={e=>upd("email",e.target.value)} placeholder="peter@XXX.com"/></div>
        <div><label style={lbl}>Phone</label><input style={fld} value={form.phone} onChange={e=>upd("phone",e.target.value)} placeholder="+91 XXXXXXXXXX"/></div>
        <div><label style={lbl}>Location</label><input style={fld} value={form.location} onChange={e=>upd("location",e.target.value)} placeholder="City, State , Country"/></div>
      </div>
      <div style={{marginBottom:10}}><label style={lbl}>LinkedIn URL</label><input style={fld} value={form.linkedin} onChange={e=>upd("linkedin",e.target.value)} placeholder="linkedin.com/in/anuj-chaudhary"/></div>
      <div style={{marginBottom:14}}><label style={lbl}>Career Summary (optional)</label><textarea style={{...fld,minHeight:60,resize:"vertical"}} value={form.summary} onChange={e=>upd("summary",e.target.value)} placeholder="Brief summary — AI will improve it…"/></div>

      <div style={{fontSize:10,color:P.accent,fontFamily:"monospace",letterSpacing:1,marginBottom:12,fontWeight:700}}>● EXPERIENCE</div>
      {form.experience.map((exp,ei)=>(
        <div key={ei} style={{background:"#070f1c",border:`1px solid ${P.border}`,borderRadius:8,padding:"13px",marginBottom:10}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:9}}>
            <span style={{fontSize:9,color:P.sub,fontFamily:"monospace"}}>Position {ei+1}</span>
            {form.experience.length>1&&<button onClick={()=>remExp(ei)} style={{background:"none",border:"none",color:P.red,cursor:"pointer",fontSize:11,fontFamily:"monospace"}}>✕ Remove</button>}
          </div>
          <div style={{...half,marginBottom:9}}>
            <div><label style={lbl}>Job Title</label><input style={fld} value={exp.title} onChange={e=>upd(`experience.${ei}.title`,e.target.value)} placeholder="Python Intern"/></div>
            <div><label style={lbl}>Company</label><input style={fld} value={exp.company} onChange={e=>upd(`experience.${ei}.company`,e.target.value)} placeholder="Acmegrade"/></div>
          </div>
          <div style={{marginBottom:9}}><label style={lbl}>Duration</label><input style={fld} value={exp.dates} onChange={e=>upd(`experience.${ei}.dates`,e.target.value)} placeholder="Jun 2023 – Dec 2023"/></div>
          <label style={lbl}>Responsibilities / What you did</label>
          {exp.bullets.map((b,bi)=>(
            <div key={bi} style={{display:"flex",gap:6,marginBottom:5}}>
              <input style={{...fld,flex:1}} value={b} onChange={e=>upd(`experience.${ei}.bullets.${bi}`,e.target.value)} placeholder={`e.g. Built a Python script to automate data cleaning tasks`}/>
              {exp.bullets.length>1&&<button onClick={()=>remBlt(ei,bi)} style={{background:"none",border:"none",color:P.muted,cursor:"pointer",fontSize:13}}>✕</button>}
            </div>
          ))}
          <button onClick={()=>addBlt(ei)} style={{background:"none",border:`1px dashed ${P.border}`,color:P.muted,cursor:"pointer",fontSize:9,fontFamily:"monospace",padding:"4px 12px",borderRadius:5,marginTop:2}}>+ Add bullet</button>
        </div>
      ))}
      <button onClick={addExp} style={{background:"none",border:`1px dashed ${P.border}`,color:P.accent,cursor:"pointer",fontSize:9,fontFamily:"monospace",padding:"7px 16px",borderRadius:7,marginBottom:16,width:"100%"}}>+ Add Experience</button>

      <div style={{fontSize:10,color:P.accent,fontFamily:"monospace",letterSpacing:1,marginBottom:12,fontWeight:700}}>● EDUCATION</div>
      {form.education.map((ed,i)=>(
        <div key={i} style={{...half,background:"#070f1c",border:`1px solid ${P.border}`,borderRadius:8,padding:"12px",marginBottom:8}}>
          <div><label style={lbl}>Degree / Course</label><input style={fld} value={ed.degree} onChange={e=>upd(`education.${i}.degree`,e.target.value)} placeholder="B.Tech CSE"/></div>
          <div><label style={lbl}>Institution</label><input style={fld} value={ed.school} onChange={e=>upd(`education.${i}.school`,e.target.value)} placeholder="University Name"/></div>
          <div style={{gridColumn:"span 2"}}><label style={lbl}>Year / Status</label><input style={fld} value={ed.year} onChange={e=>upd(`education.${i}.year`,e.target.value)} placeholder="2025 / Pursuing"/></div>
        </div>
      ))}
      <button onClick={addEdu} style={{background:"none",border:`1px dashed ${P.border}`,color:P.accent,cursor:"pointer",fontSize:9,fontFamily:"monospace",padding:"7px 16px",borderRadius:7,marginBottom:16,width:"100%"}}>+ Add Education</button>

      <div style={{fontSize:10,color:P.accent,fontFamily:"monospace",letterSpacing:1,marginBottom:12,fontWeight:700}}>● SKILLS</div>
      <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:16}}>
        {form.skills.map((sk,i)=>(
          <div key={i} style={{display:"flex",gap:4,alignItems:"center"}}>
            <input style={{...fld,width:120}} value={sk} onChange={e=>upd(`skills.${i}`,e.target.value)} placeholder="Python"/>
            {form.skills.length>1&&<button onClick={()=>remSkl(i)} style={{background:"none",border:"none",color:P.muted,cursor:"pointer",fontSize:12}}>✕</button>}
          </div>
        ))}
        <button onClick={addSkl} style={{background:"none",border:`1px dashed ${P.border}`,color:P.accent,cursor:"pointer",fontSize:9,fontFamily:"monospace",padding:"4px 12px",borderRadius:5}}>+ Add</button>
      </div>

      <button onClick={build} style={{width:"100%",padding:"12px",background:`linear-gradient(135deg,${P.accent},${P.accentDim})`,border:"none",borderRadius:8,color:"#fff",fontFamily:"monospace",fontSize:13,fontWeight:700,cursor:"pointer",letterSpacing:1}}>
        ✓ Build from Form & Continue →
      </button>
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────
export default function App() {
  const [page, setPage] = useState("home");
  const [inputMode, setInputMode] = useState("upload");
  const [resumeText, setResumeText] = useState("");
  const [jd, setJd] = useState("");

  const [uploadState, setUploadState] = useState("idle"); // idle|loading|done|error
  const [uploadName, setUploadName] = useState("");
  const [uploadMsg, setUploadMsg] = useState("");
  const [dragOver, setDragOver] = useState(false);

  const [agentActive, setAgentActive] = useState(0);
  const [agentsDone, setAgentsDone] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pipeErr, setPipeErr] = useState("");
  const [result, setResult] = useState(null);
  const [tab, setTab] = useState("preview");
  const [tick, setTick] = useState(0);
  const logRef = useRef(null);
  const fileRef = useRef(null);

  useEffect(() => {
    if (agentActive > 0) {
      const t = setInterval(() => setTick(x=>(x+1)%8), 260);
      return () => clearInterval(t);
    }
  }, [agentActive]);

  useEffect(() => { if (logRef.current) logRef.current.scrollTop = 9999; }, [logs]);

  const log = (msg, type="i") => setLogs(p=>[...p,{msg,type,t:new Date().toLocaleTimeString("en-US",{hour12:false})}]);

  // ── File upload ────────────────────────────────────────────────────────
  const processFile = useCallback(async (file) => {
    if (!file) return;
    const ext = file.name.split(".").pop().toLowerCase();
    if (!["pdf","docx","doc"].includes(ext)) {
      setUploadState("error"); setUploadMsg("Unsupported format. Please use PDF or DOCX."); return;
    }
    setUploadState("loading"); setUploadName(file.name); setUploadMsg("Extracting text…");
    try {
      const ab = await file.arrayBuffer();
      const text = ext==="pdf" ? await extractPDFText(ab) : await extractDOCXText(ab);
      if (!text.trim()) throw new Error("No text found. Try the Paste option instead.");
      setResumeText(text.trim());
      setUploadState("done");
      setUploadMsg(`${text.trim().split(/\s+/).length} words extracted successfully`);
    } catch(e) {
      setUploadState("error"); setUploadMsg(e.message || "Read failed. Try paste option.");
    }
  }, []);

  const onDrop = e => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); };

  // ── PIPELINE ───────────────────────────────────────────────────────────
  const runPipeline = async () => {
    setPage("pipeline"); setLogs([]); setAgentsDone([]); setPipeErr(""); setResult(null);
    try {
      // ── Agent 1: Parse ──────────────────────────────────────────────
      setAgentActive(1); log("Agent 1 — Parsing resume…");
      const r1 = await askClaude(
        `You are a precise resume parser. Extract ALL data from the resume and return ONLY a valid JSON object. No markdown, no explanation, no extra text — pure JSON only.
Schema: {"name":"","contact":{"email":"","phone":"","location":"","linkedin":""},"summary":"","experience":[{"company":"","title":"","dates":"","bullets":[]}],"education":[{"degree":"","school":"","year":""}],"skills":[],"projects":[],"certifications":[]}`,
        `Parse this resume completely:\n\n${resumeText}`,
        1200
      );
      const parsed = tryJSON(r1, {name:"Candidate",contact:{},experience:[],education:[],skills:[]});
      setAgentsDone(p=>[...p,1]);
      log(`✓ Parsed: ${parsed.experience?.length??0} roles, ${parsed.skills?.length??0} skills`, "ok");

      // ── Agent 2: JD Analysis ────────────────────────────────────────
      setAgentActive(2); log("Agent 2 — Deep JD analysis…");
      const r2 = await askClaude(
        `You are an expert job description analyst and ATS specialist. Extract every possible signal from the JD. Return ONLY pure JSON, no markdown.
Schema: {"keywords":[],"requiredSkills":[],"niceToHave":[],"topPriorities":[],"roleLevel":"","domain":"","tools":[],"softSkills":[],"responsibilities":[],"industryTerms":[]}`,
        `Analyse this job description. Extract every keyword, tool, technology, skill, and phrase that an ATS would scan for:\n\n${jd}`,
        1200
      );
      const jdData = tryJSON(r2, {keywords:[],requiredSkills:[],niceToHave:[],topPriorities:[],tools:[],softSkills:[],industryTerms:[]});
      setAgentsDone(p=>[...p,2]);
      log(`✓ ${jdData.keywords?.length??0} keywords + ${jdData.tools?.length??0} tools extracted`, "ok");

      // ── Agent 3: Content Generation ─────────────────────────────────
      setAgentActive(3); log("Agent 3 — Rewriting entire resume with power content…");
      const r3 = await askClaude(
        `You are a WORLD-CLASS executive resume writer and career coach with 15+ years of experience placing candidates at top companies. Your task is to COMPLETELY TRANSFORM the candidate's resume into a powerful, professional document that will get interviews.

STRICT RULES:
1. EVERY bullet must start with a strong past-tense action verb (Led, Built, Engineered, Designed, Implemented, Developed, Optimised, Automated, Analysed, Delivered, Achieved, Reduced, Increased, Launched, Drove, Streamlined, Created, Established, Managed)
2. ADD quantified achievements even if not in original — use plausible numbers (%, hours saved, datasets size, model accuracy, project scope)
3. Transform vague bullets into specific, measurable accomplishments
4. Write AT LEAST 4 strong bullets per experience
5. The summary must be 3–4 powerful sentences positioning the candidate perfectly for the target role
6. Skills section must be comprehensive, grouped by category, filled with JD-relevant technologies
7. DO NOT make up companies or dates — keep those real
8. Return ONLY pure JSON, no markdown, no explanation

Return: {"summary":"","experience":[{"company":"","title":"","dates":"","bullets":[]}],"skills":{"[Category Name]":[]}}`,
        `TARGET JD ANALYSIS:
${JSON.stringify(jdData,null,2)}

CANDIDATE DATA:
${JSON.stringify(parsed,null,2)}

Transform this resume completely. Make every bullet powerful, specific, and impactful. Add keywords from the JD naturally throughout. The candidate is a fresher/junior — write strong bullets that highlight learning, tools used, and any measurable impact even if small.`,
        3000
      );
      const gen = tryJSON(r3, {summary:"",experience:parsed.experience||[],skills:{}});
      setAgentsDone(p=>[...p,3]);
      const totalBullets = gen.experience?.reduce((a,e)=>a+(e.bullets?.length??0),0)??0;
      log(`✓ Generated ${totalBullets} power bullets across ${gen.experience?.length??0} roles`, "ok");

      // ── Agent 4: ATS Keyword Integration ───────────────────────────
      setAgentActive(4); log("Agent 4 — Injecting ATS keywords across ALL sections…");
      const r4 = await askClaude(
        `You are an ATS (Applicant Tracking System) expert and keyword integration specialist. Your job is to maximise keyword density across the ENTIRE resume — not just the summary.

RULES:
1. Inject keywords from the target JD into EVERY experience bullet where it makes contextual sense
2. Expand the skills section to include ALL relevant tools and technologies from the JD
3. The summary must contain the job title, 3+ core keywords, and position the candidate for the role
4. Add missing tools/technologies to skills that are relevant to the JD (the candidate can be learning them)
5. Keep language natural — no keyword stuffing
6. EVERY section must contain JD keywords: summary, each experience bullet, skills
7. Return ONLY pure JSON

Return: {"summary":"","experience":[{"company":"","title":"","dates":"","bullets":[]}],"skills":{"[Category]":[]},"keywordsIntegrated":[],"missingSkills":[]}`,
        `MUST-INCLUDE KEYWORDS: ${[...new Set([...(jdData.keywords??[]),...(jdData.requiredSkills??[]),...(jdData.tools??[]),...(jdData.industryTerms??[])])].join(", ")}

NICE-TO-HAVE: ${(jdData.niceToHave??[]).join(", ")}

CURRENT RESUME CONTENT:
${JSON.stringify(gen,null,2)}

Integrate keywords throughout every section. Expand skills section significantly.`,
        2500
      );
      const ats = tryJSON(r4, {summary:gen.summary,experience:gen.experience,skills:gen.skills,keywordsIntegrated:[],missingSkills:[]});
      setAgentsDone(p=>[...p,4]);
      log(`✓ ${ats.keywordsIntegrated?.length??0} keywords woven across all sections`, "ok");

      // ── Agent 5: Score ──────────────────────────────────────────────
      setAgentActive(5); log("Agent 5 — Scoring & generating feedback…");
      const r5 = await askClaude(
        `You are an enterprise ATS scoring engine used by Fortune 500 HR departments. Score this resume rigorously against the JD. Return ONLY pure JSON.
Return: {"totalScore":0,"verdict":"","breakdown":{"keywordMatch":{"score":0,"max":30,"note":""},"contentQuality":{"score":0,"max":35,"note":""},"formatting":{"score":0,"max":20,"note":""},"readability":{"score":0,"max":15,"note":""}},"strengths":[],"suggestions":[],"quickWins":[],"missingSkills":[]}`,
        `OPTIMISED RESUME: ${JSON.stringify(ats)}
JD REQUIREMENTS: ${JSON.stringify(jdData)}
Score honestly. Deduct points for any missing critical keywords or weak bullets.`,
        1000
      );
      const score = tryJSON(r5, {
        totalScore:78,verdict:"Good",
        breakdown:{keywordMatch:{score:22,max:30,note:""},contentQuality:{score:27,max:35,note:""},formatting:{score:16,max:20,note:""},readability:{score:13,max:15,note:""}},
        strengths:[],suggestions:[],quickWins:[],missingSkills:ats.missingSkills??[],
      });
      setAgentsDone(p=>[...p,5]);
      log(`✓ ATS Score: ${score.totalScore}/100 — ${score.verdict}`, "ok");

      setAgentActive(0);
      setResult({
        resume:{name:parsed.name,contact:parsed.contact,summary:ats.summary,experience:ats.experience,education:parsed.education,skills:ats.skills,projects:parsed.projects||[],certifications:parsed.certifications||[]},
        score,
        missing:ats.missingSkills??[],
      });
      setPage("result"); setTab("preview");

    } catch(e) {
      setAgentActive(0); setPipeErr(e.message); log(`✗ ${e.message}`, "er");
    }
  };

  // ── Download PDF ─────────────────────────────────────────────────────
  const downloadPDF = () => {
    if (!result) return;
    const r = result.resume;
    const contact = Object.values(r.contact||{}).filter(Boolean).join("  |  ");

    const skillsHTML = (() => {
      if (!r.skills) return "";
      if (Array.isArray(r.skills)) return `<p>${r.skills.join(", ")}</p>`;
      return Object.entries(r.skills).map(([cat,vals])=>
        `<p style="margin-bottom:5px"><strong style="color:#111">${cat}:</strong> <span style="color:#333">${Array.isArray(vals)?vals.join(", "):vals}</span></p>`
      ).join("");
    })();

    const expHTML = (r.experience||[]).map(ex=>`
      <div style="margin-bottom:16px">
        <div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:1px">
          <strong style="font-size:11pt;color:#111">${ex.title||""}</strong>
          <span style="font-size:9.5pt;color:#555;white-space:nowrap">${ex.dates||""}</span>
        </div>
        <div style="font-size:10pt;color:#333;margin-bottom:5px;font-style:italic">${ex.company||""}</div>
        <ul style="margin:0;padding-left:18px">${(ex.bullets||[]).map(b=>`<li style="font-size:10.5pt;line-height:1.6;color:#222;margin-bottom:2px">${b}</li>`).join("")}</ul>
      </div>`).join("");

    const eduHTML = (r.education||[]).map(ed=>`
      <div style="margin-bottom:5px;font-size:10.5pt;color:#222">
        <strong>${typeof ed==="string"?ed:ed.degree||""}</strong>${ed.school?` — ${ed.school}`:""}${ed.year?` &nbsp;(${ed.year})`:""}
      </div>`).join("");

    const projHTML = r.projects?.length ? `
      <div class="sh">Projects</div>
      ${r.projects.map(p=>`<p style="font-size:10.5pt;color:#222;margin-bottom:4px">${typeof p==="string"?p:p.name||JSON.stringify(p)}</p>`).join("")}` : "";

    const certHTML = r.certifications?.length ? `
      <div class="sh">Certifications</div>
      ${r.certifications.map(c=>`<p style="font-size:10.5pt;color:#222;margin-bottom:4px">${typeof c==="string"?c:c.name||JSON.stringify(c)}</p>`).join("")}` : "";

    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<title>${r.name||"Resume"} — ATS Optimised</title>
<style>
  @page{margin:15mm 18mm}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;color:#1a1a1a;line-height:1.55;background:#fff}
  h1{font-family:Georgia,"Times New Roman",serif;font-size:21pt;color:#0a0a0a;letter-spacing:-0.3px;margin-bottom:4px}
  .contact{font-size:9.5pt;color:#444;margin-bottom:18px;border-bottom:1px solid #e0e0e0;padding-bottom:12px}
  .sh{font-size:8.5pt;letter-spacing:2px;text-transform:uppercase;font-weight:700;border-bottom:1.5px solid #111;padding-bottom:3px;margin:18px 0 10px;color:#111}
  ul{padding-left:18px}
  li{margin-bottom:3px}
  @media print{body{padding:0}@page{margin:15mm 18mm}}
</style></head><body>
  <h1>${r.name||"Your Name"}</h1>
  <div class="contact">${contact}</div>
  ${r.summary?`<div class="sh">Professional Summary</div><p style="font-size:10.5pt;line-height:1.65;color:#222">${r.summary}</p>`:""}
  ${expHTML?`<div class="sh">Experience</div>${expHTML}`:""}
  ${skillsHTML?`<div class="sh">Skills</div>${skillsHTML}`:""}
  ${eduHTML?`<div class="sh">Education</div>${eduHTML}`:""}
  ${projHTML}${certHTML}
</body></html>`;

    const blob = new Blob([html], {type:"text/html;charset=utf-8"});
    const url = URL.createObjectURL(blob);
    const win = window.open(url,"_blank");
    if (win) {
      win.addEventListener("load",()=>{ setTimeout(()=>win.print(),300); });
    } else {
      const a = document.createElement("a");
      a.href=url; a.download=`${(r.name||"resume").replace(/\s+/g,"_")}_ATS_Resume.html`; a.click();
    }
    setTimeout(()=>URL.revokeObjectURL(url),15000);
  };

  // ── UI helpers ───────────────────────────────────────────────────────
  const SPIN = ["⠋","⠙","⠹","⠸","⠼","⠴","⠦","⠇"][tick];
  const card = {background:P.card,border:`1px solid ${P.border}`,borderRadius:12,padding:"22px 26px",marginBottom:14};
  const bPri = {padding:"10px 22px",border:"none",borderRadius:8,cursor:"pointer",fontFamily:"monospace",fontSize:12,fontWeight:700,letterSpacing:.8,background:P.accent,color:"#fff",boxShadow:"0 4px 20px #2d7ff930"};
  const bSec = {padding:"9px 18px",border:`1px solid ${P.border}`,borderRadius:8,cursor:"pointer",fontFamily:"monospace",fontSize:12,fontWeight:600,background:P.hi,color:P.sub};
  const bGrn = {...bPri,background:P.green,boxShadow:"0 4px 20px #22d38a30",color:"#031a0e"};
  const lbl  = {display:"block",fontSize:9,color:P.muted,fontFamily:"monospace",letterSpacing:1.5,textTransform:"uppercase",marginBottom:6};
  const ta   = {width:"100%",background:"#050d17",border:`1px solid ${P.border}`,borderRadius:8,padding:"12px 14px",color:"#7aaec8",fontFamily:"monospace",fontSize:12,resize:"vertical",outline:"none",boxSizing:"border-box",lineHeight:1.65};
  const pill = (c=P.accent)=>({padding:"2px 9px",borderRadius:20,background:`${c}18`,border:`1px solid ${c}35`,color:c,fontSize:9,fontFamily:"monospace",letterSpacing:1});
  const modeBtn = active=>({flex:1,padding:"11px 8px",border:"none",cursor:"pointer",fontFamily:"monospace",fontSize:11.5,fontWeight:700,background:active?P.hi:P.card,color:active?P.text:P.muted,borderBottom:active?`2px solid ${P.accent}`:"2px solid transparent",transition:"all .2s"});

  const sampleJD = `Junior ML Engineer / Data Science Intern

About the Role:
We're looking for a motivated Python developer to join our ML team and help build data pipelines and machine learning models.

Requirements:
- Python (NumPy, Pandas, scikit-learn)
- Machine Learning fundamentals (classification, regression, clustering)
- Data preprocessing and feature engineering
- SQL for data extraction
- Jupyter Notebook / Google Colab
- Basic Git and version control
- Analytical mindset and problem-solving skills

Responsibilities:
- Preprocess and clean datasets for ML pipelines
- Train and evaluate machine learning models
- Write Python scripts for data analysis
- Document experiments and model performance
- Collaborate with senior data scientists

Nice to have: Matplotlib, Seaborn, TensorFlow, PyTorch, Flask/FastAPI`;

  return (
    <div style={{minHeight:"100vh",background:P.bg,color:P.text,fontFamily:"Georgia,serif"}}>

      {/* ── NAV ── */}
      <div style={{borderBottom:`1px solid ${P.border}`,padding:"0 24px",height:54,display:"flex",alignItems:"center",justifyContent:"space-between",background:P.card,position:"sticky",top:0,zIndex:99}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:30,height:30,background:`linear-gradient(135deg,${P.accent},${P.accentDim})`,borderRadius:6,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:14,fontStyle:"italic"}}>A</div>
          <div>
            <div style={{fontSize:13,fontWeight:"bold",lineHeight:1.1}}>ATS Resume Builder Pro</div>
            <div style={{fontSize:8,color:P.muted,fontFamily:"monospace",letterSpacing:1.5}}>5-AGENT AI PIPELINE  ·  v3.0</div>
          </div>
        </div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          <span style={pill(P.green)}>PDF UPLOAD</span>
          <span style={pill(P.purple)}>FORM BUILD</span>
          <span style={pill(P.amber)}>HIGH-POWER AI</span>
        </div>
      </div>

      <div style={{maxWidth:880,margin:"0 auto",padding:"28px 18px"}}>

        {/* ══ HOME ══ */}
        {page==="home"&&(
          <>
            <div style={{textAlign:"center",marginBottom:30}}>
              <div style={{fontSize:9,fontFamily:"monospace",color:P.accent,letterSpacing:3,marginBottom:10}}>HIGH-POWER AI · 5 SPECIALIZED AGENTS · FULL REWRITE</div>
              <h1 style={{fontSize:28,margin:"0 0 12px",lineHeight:1.2}}>From Basic to Brilliant —<br/>AI That Truly Transforms Your Resume</h1>
              <p style={{color:P.muted,fontFamily:"monospace",fontSize:12,lineHeight:1.8}}>Upload PDF/DOCX  ·  Paste text  ·  Build from scratch<br/>Our AI completely rewrites your resume with power bullets, ATS keywords, and professional language.</p>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(195px,1fr))",gap:10,marginBottom:28}}>
              {[
                ["⬆","Upload PDF / DOCX","Drop your old resume — AI extracts and completely rebuilds it"],
                ["☰","Form Builder","No resume? Fill a simple form — AI creates a professional one"],
                ["◆","Deep AI Rewrite","Every bullet rewritten with action verbs & quantified results"],
                ["◇","Full Keyword Injection","JD keywords inserted into summary, bullets AND skills"],
                ["◎","ATS Score + Plan","Detailed score with specific steps to improve further"],
              ].map(([icon,title,text])=>(
                <div key={icon} style={{...card,padding:"15px 17px",marginBottom:0,textAlign:"center"}}>
                  <div style={{fontSize:20,color:P.accent,marginBottom:7}}>{icon}</div>
                  <div style={{fontSize:12,fontWeight:"bold",marginBottom:4}}>{title}</div>
                  <div style={{fontSize:10.5,color:P.muted,fontFamily:"monospace",lineHeight:1.55}}>{text}</div>
                </div>
              ))}
            </div>
            <div style={{textAlign:"center"}}><button style={{...bPri,fontSize:14,padding:"13px 38px"}} onClick={()=>setPage("input")}>Get Started →</button></div>
          </>
        )}

        {/* ══ INPUT ══ */}
        {page==="input"&&(
          <div style={card}>
            <h2 style={{fontSize:18,marginBottom:5}}>◈ Step 1 — Your Resume</h2>
            <p style={{color:P.muted,fontFamily:"monospace",fontSize:11,marginBottom:16,lineHeight:1.6}}>Three ways to get started. The AI will completely transform whatever you provide.</p>

            {/* Mode switcher */}
            <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:`1px solid ${P.border}`,marginBottom:18}}>
              <button style={modeBtn(inputMode==="upload")} onClick={()=>setInputMode("upload")}>⬆ Upload File</button>
              <button style={modeBtn(inputMode==="paste")} onClick={()=>setInputMode("paste")}>✎ Paste Text</button>
              <button style={modeBtn(inputMode==="form")} onClick={()=>setInputMode("form")}>☰ Build Form</button>
            </div>

            {/* ─ UPLOAD MODE ─ */}
            {inputMode==="upload"&&(
              <div>
                {/* Drop zone — always visible */}
                <div
                  onClick={()=>fileRef.current&&fileRef.current.click()}
                  onDragOver={e=>{e.preventDefault();setDragOver(true)}}
                  onDragLeave={()=>setDragOver(false)}
                  onDrop={onDrop}
                  style={{
                    border:`2px dashed ${dragOver?P.accent:uploadState==="done"?P.green:uploadState==="error"?P.red:P.borderHi}`,
                    borderRadius:12,padding:"32px 20px",textAlign:"center",cursor:"pointer",
                    background:dragOver?`${P.accent}0c`:uploadState==="done"?`${P.green}0a`:uploadState==="error"?`${P.red}0a`:"#050d17",
                    transition:"all .25s",marginBottom:14,userSelect:"none",
                  }}>
                  {/* Icon */}
                  <div style={{fontSize:38,marginBottom:12,lineHeight:1}}>
                    {uploadState==="loading"?"⏳":uploadState==="done"?"✅":uploadState==="error"?"❌":"📄"}
                  </div>
                  {/* Status text */}
                  {uploadState==="idle"&&(
                    <>
                      <div style={{fontSize:14,color:P.sub,fontWeight:"bold",marginBottom:6}}>Drop your resume here</div>
                      <div style={{fontSize:11,color:P.muted,fontFamily:"monospace",marginBottom:10}}>PDF or DOCX supported</div>
                      <div style={{display:"inline-block",padding:"8px 20px",background:P.accent,borderRadius:7,color:"#fff",fontFamily:"monospace",fontSize:12,fontWeight:700}}>Browse Files</div>
                    </>
                  )}
                  {uploadState==="loading"&&(
                    <div style={{fontSize:13,color:P.amber,fontWeight:"bold"}}>Extracting text from {uploadName}…</div>
                  )}
                  {uploadState==="done"&&(
                    <>
                      <div style={{fontSize:13,color:P.green,fontWeight:"bold",marginBottom:4}}>✓ {uploadName}</div>
                      <div style={{fontSize:11,color:P.muted,fontFamily:"monospace"}}>{uploadMsg}</div>
                    </>
                  )}
                  {uploadState==="error"&&(
                    <>
                      <div style={{fontSize:13,color:P.red,fontWeight:"bold",marginBottom:4}}>Upload Failed</div>
                      <div style={{fontSize:11,color:P.muted,fontFamily:"monospace"}}>{uploadMsg}</div>
                    </>
                  )}
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.docx,.doc"
                    style={{display:"none"}}
                    onChange={e=>{ if(e.target.files?.[0]) processFile(e.target.files[0]); e.target.value=""; }}
                  />
                </div>

                {uploadState==="done"&&(
                  <div style={{background:"#050d17",border:`1px solid ${P.border}`,borderRadius:8,padding:"12px 14px",marginBottom:12}}>
                    <div style={{fontSize:8,fontFamily:"monospace",color:P.muted,letterSpacing:1.5,marginBottom:7}}>EXTRACTED PREVIEW</div>
                    <div style={{fontFamily:"monospace",fontSize:11,color:"#6a9ab8",maxHeight:100,overflowY:"auto",whiteSpace:"pre-wrap",lineHeight:1.5}}>
                      {resumeText.slice(0,600)}{resumeText.length>600?"…":""}
                    </div>
                  </div>
                )}

                {(uploadState==="done"||uploadState==="error")&&(
                  <button style={{...bSec,marginBottom:14,fontSize:11}} onClick={()=>{setUploadState("idle");setUploadName("");setUploadMsg("");setResumeText("");}}>
                    ↺ Try Different File
                  </button>
                )}
              </div>
            )}

            {/* ─ PASTE MODE ─ */}
            {inputMode==="paste"&&(
              <>
                <label style={lbl}>Paste Your Resume</label>
                <textarea style={{...ta,minHeight:260}} value={resumeText} onChange={e=>setResumeText(e.target.value)}
                  placeholder={"Paste your full resume here…\n\nExample:\nAnuj Chaudhary\nanujattri59@gmail.com | 7668796070 | Mathura, UP\n\nSKILLS\nPython, SQL, Anaconda, VS Code, MS Excel\n\nINTERNSHIP\nPython Intern – Acmegrade\n- Worked with Jupyter Notebook\n- Used Anaconda for packages\n\nEDUCATION\nB.Sc. — XYZ University | 2024"}
                  onFocus={e=>e.target.style.borderColor=P.accent}
                  onBlur={e=>e.target.style.borderColor=P.border}/>
                {resumeText.trim()&&<div style={{fontSize:9,color:P.muted,fontFamily:"monospace",marginTop:5}}>{resumeText.trim().split(/\s+/).length} words</div>}
              </>
            )}

            {/* ─ FORM MODE ─ */}
            {inputMode==="form"&&(
              <FormBuilder onComplete={(text)=>{ setResumeText(text); setInputMode("paste"); }}/>
            )}

            {/* Nav buttons */}
            {inputMode!=="form"&&(
              <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap",alignItems:"center"}}>
                <button style={bSec} onClick={()=>setPage("home")}>← Home</button>
                <div style={{flex:1}}/>
                <button
                  style={{...bPri,opacity:resumeText.trim()?1:0.35,cursor:resumeText.trim()?"pointer":"not-allowed"}}
                  disabled={!resumeText.trim()}
                  onClick={()=>setPage("jd")}>
                  Next: Paste Job Description →
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══ JD ══ */}
        {page==="jd"&&(
          <div style={card}>
            <h2 style={{fontSize:18,marginBottom:5}}>◉ Step 2 — Target Job Description</h2>
            <p style={{color:P.muted,fontFamily:"monospace",fontSize:11,marginBottom:16,lineHeight:1.6}}>Paste the full job description. The more detail you give, the better the AI tailors your resume.</p>
            <label style={lbl}>Job Description</label>
            <textarea style={{...ta,minHeight:280}} value={jd} onChange={e=>setJd(e.target.value)}
              placeholder="Paste the full job posting here…"
              onFocus={e=>e.target.style.borderColor=P.purple}
              onBlur={e=>e.target.style.borderColor=P.border}/>
            {jd.trim()&&<div style={{fontSize:9,color:P.muted,fontFamily:"monospace",marginTop:5}}>{jd.trim().split(/\s+/).length} words</div>}
            <div style={{display:"flex",gap:10,marginTop:16,flexWrap:"wrap",alignItems:"center"}}>
              <button style={bSec} onClick={()=>setPage("input")}>← Back</button>
              <button style={bSec} onClick={()=>setJd(sampleJD)}>◉ Load ML Sample JD</button>
              <div style={{flex:1}}/>
              <button style={{...bPri,opacity:jd.trim()?1:0.35,background:jd.trim()?"#6d28d9":P.accentDim,cursor:jd.trim()?"pointer":"not-allowed"}} disabled={!jd.trim()} onClick={runPipeline}>
                🚀 Launch 5-Agent Pipeline →
              </button>
            </div>
          </div>
        )}

        {/* ══ PIPELINE ══ */}
        {page==="pipeline"&&(
          <>
            <div style={{textAlign:"center",marginBottom:24}}>
              <div style={{fontSize:9,fontFamily:"monospace",color:P.muted,letterSpacing:2,marginBottom:7}}>DEEP AI PROCESSING</div>
              <h2 style={{fontSize:22,margin:0}}>Transforming Your Resume…</h2>
              <p style={{color:P.muted,fontFamily:"monospace",fontSize:11,marginTop:7}}>5 specialised agents running a complete rewrite</p>
            </div>
            <div style={{height:3,background:P.border,borderRadius:3,marginBottom:18,overflow:"hidden"}}>
              <div style={{height:"100%",width:`${(agentsDone.length/5)*100}%`,background:`linear-gradient(to right,${P.accent},${P.green})`,transition:"width .7s"}}/>
            </div>
            {AGENTS.map(ag=>{
              const isDone=agentsDone.includes(ag.id), isActive=agentActive===ag.id;
              return (
                <div key={ag.id} style={{display:"flex",alignItems:"center",gap:13,padding:"13px 16px",borderRadius:10,marginBottom:7,background:isDone?P.greenDim:isActive?P.hi:P.card,border:`1px solid ${isDone?"#0a4a28":isActive?P.accent+"66":P.border}`,transition:"all .3s",boxShadow:isActive?`0 0 24px ${P.accent}14`:"none"}}>
                  <div style={{width:36,height:36,borderRadius:8,flexShrink:0,background:isDone?"#0a4a28":isActive?`${P.accent}18`:"#0a1525",border:`1px solid ${isDone?P.green:isActive?P.accent:P.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:isDone?15:17,color:isDone?P.green:isActive?P.accent:P.muted}}>
                    {isDone?"✓":isActive?SPIN:ag.icon}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{fontSize:13,fontWeight:isDone||isActive?700:400,color:isDone?P.green:isActive?P.text:P.muted}}>{ag.name}</div>
                    <div style={{fontSize:10,fontFamily:"monospace",color:isDone?"#1a5e32":isActive?P.sub:"#1a304a",marginTop:2}}>{isDone?"Completed":isActive?ag.desc:"Queued"}</div>
                  </div>
                  <span style={{fontFamily:"monospace",fontSize:9,color:P.muted}}>{ag.id}/5</span>
                </div>
              );
            })}
            <div style={{...card,padding:"12px 16px",marginTop:14}}>
              <div style={{fontSize:8,fontFamily:"monospace",color:P.muted,letterSpacing:1.5,marginBottom:8}}>◆ LIVE LOG</div>
              <div ref={logRef} style={{maxHeight:120,overflowY:"auto"}}>
                {logs.map((l,i)=>(
                  <div key={i} style={{fontFamily:"monospace",fontSize:10.5,display:"flex",gap:8,marginBottom:2}}>
                    <span style={{color:"#1a3050",flexShrink:0}}>{l.t}</span>
                    <span style={{color:l.type==="ok"?P.green:l.type==="er"?P.red:P.muted}}>{l.msg}</span>
                  </div>
                ))}
                {agentActive>0&&!pipeErr&&<div style={{fontFamily:"monospace",fontSize:10.5,color:P.muted,marginTop:4}}>— This may take 30–60 seconds. The AI is doing a thorough rewrite…</div>}
              </div>
            </div>
            {pipeErr&&(
              <div style={{padding:"13px 16px",background:P.redDim,border:`1px solid ${P.red}44`,borderRadius:10,color:P.red,fontFamily:"monospace",fontSize:12,marginTop:12}}>
                <strong>Error:</strong> {pipeErr}
                <div style={{marginTop:10,display:"flex",gap:8}}>
                  <button style={bSec} onClick={()=>setPage("jd")}>← Retry</button>
                  <button style={bSec} onClick={()=>setPage("input")}>← Change Resume</button>
                </div>
              </div>
            )}
          </>
        )}

        {/* ══ RESULT ══ */}
        {page==="result"&&result&&(
          <>
            {/* Score panel */}
            <div style={{...card,display:"flex",flexWrap:"wrap",gap:22,alignItems:"flex-start"}}>
              <Ring score={result.score.totalScore}/>
              <div style={{flex:1,minWidth:170}}>
                <div style={{fontSize:12,fontWeight:"bold",marginBottom:13}}>Score Breakdown</div>
                {Object.entries(result.score.breakdown||{}).map(([k,v])=>{
                  const pct=v.max?(v.score/v.max)*100:v.score, c=pct>=80?P.green:pct>=55?P.amber:P.red;
                  return (
                    <div key={k} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",marginBottom:3}}>
                        <span style={{fontSize:9,color:P.muted,fontFamily:"monospace"}}>{k.replace(/([A-Z])/g," $1").toUpperCase()}</span>
                        <span style={{fontSize:9,color:c,fontFamily:"monospace",fontWeight:700}}>{v.score}/{v.max}</span>
                      </div>
                      <div style={{height:4,background:"#0a1e30",borderRadius:3,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${pct}%`,background:c,borderRadius:3,transition:"width 1.3s"}}/>
                      </div>
                      {v.note&&<div style={{fontSize:8,color:"#1a3050",marginTop:2,fontFamily:"monospace"}}>{v.note}</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{flex:1,minWidth:150}}>
                {result.score.strengths?.length>0&&(
                  <div style={{marginBottom:14}}>
                    <div style={{fontSize:8,fontFamily:"monospace",color:P.green,letterSpacing:1.5,marginBottom:7}}>✓ STRENGTHS</div>
                    {result.score.strengths.map((s,i)=><div key={i} style={{fontSize:10.5,color:"#1a6e3a",fontFamily:"monospace",marginBottom:4}}>▸ {s}</div>)}
                  </div>
                )}
                {result.missing?.length>0&&(
                  <>
                    <div style={{fontSize:8,fontFamily:"monospace",color:P.amber,letterSpacing:1.5,marginBottom:7}}>⚠ GAPS TO FILL</div>
                    <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                      {result.missing.slice(0,8).map((s,i)=><span key={i} style={{padding:"3px 7px",borderRadius:4,background:P.amberDim,border:`1px solid ${P.amber}35`,color:P.amber,fontSize:9,fontFamily:"monospace"}}>{s}</span>)}
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Tabs */}
            <div style={{display:"flex",borderRadius:10,overflow:"hidden",border:`1px solid ${P.border}`,marginBottom:14}}>
              {[["preview","◈ Resume Preview"],["suggest","◉ Suggestions"],["wins","◆ Quick Wins"]].map(([id,label])=>(
                <button key={id} onClick={()=>setTab(id)} style={{flex:1,padding:"10px",border:"none",cursor:"pointer",fontFamily:"monospace",fontSize:11,fontWeight:600,background:tab===id?P.hi:P.card,color:tab===id?P.text:P.muted,borderBottom:tab===id?`2px solid ${P.accent}`:"2px solid transparent",transition:"all .2s"}}>{label}</button>
              ))}
            </div>

            {/* Preview */}
            {tab==="preview"&&(
              <div style={card}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:"bold"}}>ATS-Optimised Resume</div>
                    <div style={{fontSize:9,color:P.muted,fontFamily:"monospace",marginTop:3}}>Professional format · No tables · ATS-safe</div>
                  </div>
                  <button style={bGrn} onClick={downloadPDF}>⬇ Download / Print PDF</button>
                </div>
                <div style={{background:"#fff",borderRadius:8,padding:"36px 40px",boxShadow:"0 6px 36px #00000065"}}>
                  <div style={{fontFamily:"Arial,Helvetica,sans-serif",color:"#1a1a1a",fontSize:"10.5pt",lineHeight:1.55}}>
                    <h1 style={{margin:0,fontSize:21,fontFamily:"Georgia,serif",color:"#0a0a0a",letterSpacing:"-0.3px"}}>{result.resume.name}</h1>
                    <p style={{fontSize:9.5,color:"#444",margin:"5px 0 14px",borderBottom:"1px solid #e0e0e0",paddingBottom:12}}>
                      {Object.values(result.resume.contact||{}).filter(Boolean).join("  |  ")}
                    </p>

                    {result.resume.summary&&<>
                      <div style={{fontSize:8.5,letterSpacing:"2px",textTransform:"uppercase",borderBottom:"1.5px solid #111",paddingBottom:3,margin:"14px 0 10px",fontWeight:700}}>Professional Summary</div>
                      <p style={{fontSize:10.5,lineHeight:1.65,color:"#222",margin:0}}>{result.resume.summary}</p>
                    </>}

                    {result.resume.experience?.length>0&&<>
                      <div style={{fontSize:8.5,letterSpacing:"2px",textTransform:"uppercase",borderBottom:"1.5px solid #111",paddingBottom:3,margin:"18px 0 10px",fontWeight:700}}>Experience</div>
                      {result.resume.experience.map((ex,i)=>(
                        <div key={i} style={{marginBottom:14}}>
                          <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                            <strong style={{fontSize:11,color:"#111"}}>{ex.title}</strong>
                            <span style={{fontSize:9.5,color:"#555",whiteSpace:"nowrap"}}>{ex.dates}</span>
                          </div>
                          <div style={{fontSize:10,color:"#333",fontStyle:"italic",marginBottom:5}}>{ex.company}</div>
                          <ul style={{margin:0,paddingLeft:17}}>
                            {(ex.bullets||[]).map((b,j)=><li key={j} style={{fontSize:10.5,lineHeight:1.6,marginBottom:2,color:"#222"}}>{b}</li>)}
                          </ul>
                        </div>
                      ))}
                    </>}

                    {result.resume.skills&&Object.keys(result.resume.skills).length>0&&<>
                      <div style={{fontSize:8.5,letterSpacing:"2px",textTransform:"uppercase",borderBottom:"1.5px solid #111",paddingBottom:3,margin:"18px 0 10px",fontWeight:700}}>Skills</div>
                      {typeof result.resume.skills==="object"&&!Array.isArray(result.resume.skills)
                        ?Object.entries(result.resume.skills).map(([cat,vals])=>(
                          <p key={cat} style={{fontSize:10.5,marginBottom:4}}><strong>{cat}:</strong> {Array.isArray(vals)?vals.join(", "):vals}</p>
                        ))
                        :<p style={{fontSize:10.5}}>{Array.isArray(result.resume.skills)?result.resume.skills.join(", "):result.resume.skills}</p>
                      }
                    </>}

                    {result.resume.education?.length>0&&<>
                      <div style={{fontSize:8.5,letterSpacing:"2px",textTransform:"uppercase",borderBottom:"1.5px solid #111",paddingBottom:3,margin:"18px 0 10px",fontWeight:700}}>Education</div>
                      {result.resume.education.map((ed,i)=>(
                        <div key={i} style={{fontSize:10.5,color:"#222",marginBottom:3}}>
                          <strong>{typeof ed==="string"?ed:ed.degree||""}</strong>
                          {ed.school?` — ${ed.school}`:""}
                          {ed.year?` (${ed.year})`:""}
                        </div>
                      ))}
                    </>}
                  </div>
                </div>
                <div style={{marginTop:12,padding:"11px 14px",background:P.greenDim,border:`1px solid #0a4a28`,borderRadius:8}}>
                  <div style={{fontSize:10,fontFamily:"monospace",color:P.green}}>💡 <strong>To save as PDF:</strong> Click "Download / Print PDF" → in the print dialog select <em>Save as PDF</em> as destination. Use A4 or Letter size.</div>
                </div>
              </div>
            )}

            {/* Suggestions */}
            {tab==="suggest"&&(
              <div style={card}>
                <div style={{fontSize:13,fontWeight:"bold",marginBottom:16}}>◉ How to Improve Further</div>
                {!(result.score.suggestions?.length)&&<div style={{color:P.muted,fontFamily:"monospace",fontSize:11}}>Resume is well-optimised!</div>}
                {(result.score.suggestions||[]).map((s,i)=>(
                  <div key={i} style={{display:"flex",gap:13,padding:"11px 15px",marginBottom:7,background:"#050d17",borderRadius:8,border:`1px solid ${P.border}`}}>
                    <div style={{width:24,height:24,borderRadius:6,background:`${P.accent}14`,border:`1px solid ${P.accent}28`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontFamily:"monospace",fontWeight:700,color:P.accent,flexShrink:0}}>{String(i+1).padStart(2,"0")}</div>
                    <div style={{fontSize:12,color:"#7aaec8",fontFamily:"monospace",lineHeight:1.65}}>{s}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick Wins */}
            {tab==="wins"&&(
              <div style={card}>
                <div style={{fontSize:13,fontWeight:"bold",marginBottom:16}}>◆ Quick Wins — Do These First</div>
                {!(result.score.quickWins?.length)&&<div style={{color:P.muted,fontFamily:"monospace",fontSize:11}}>Resume is strong!</div>}
                {(result.score.quickWins||[]).map((w,i)=>(
                  <div key={i} style={{display:"flex",gap:11,padding:"11px 15px",marginBottom:7,background:P.greenDim,borderRadius:8,border:"1px solid #0a3d25"}}>
                    <span style={{color:P.green,fontSize:13}}>⚡</span>
                    <span style={{fontSize:12,color:"#7aaec8",fontFamily:"monospace",lineHeight:1.65}}>{w}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{display:"flex",gap:9,justifyContent:"center",marginTop:8,flexWrap:"wrap"}}>
              <button style={bSec} onClick={()=>{setPage("home");setResumeText("");setJd("");setResult(null);setUploadState("idle");setUploadName("");setUploadMsg("");}}>◈ Start Over</button>
              <button style={bSec} onClick={()=>setPage("jd")}>← Change Job Description</button>
              <button style={bGrn} onClick={downloadPDF}>⬇ Download PDF</button>
            </div>
          </>
        )}

      </div>
      <style>{`
        *{box-sizing:border-box}
        button:hover{opacity:.86}
        button:active{transform:scale(.97)}
        ::-webkit-scrollbar{width:4px;height:4px}
        ::-webkit-scrollbar-track{background:#050d17}
        ::-webkit-scrollbar-thumb{background:#1a3352;border-radius:4px}
      `}</style>
    </div>
  );
}
