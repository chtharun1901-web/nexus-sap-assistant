import { useState, useEffect } from "react";
import { api } from "../api.js";

const P = {background:"var(--bg-main)",color:"var(--text-primary)",height:"100%",overflowY:"auto",padding:"32px 40px 60px"};

export default function Cases({ onOpen }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({title:"",description:"",priority:"Medium",status:"Open"});

  useEffect(() => {
    api.getInvestigations().then(d => { setCases(d.investigations||[]); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const create = async (e) => {
    e.preventDefault();
    try {
      const d = await api.createInvestigation(form);
      if (d.investigation) { setCases(prev=>[d.investigation,...prev]); setShowNew(false); setForm({title:"",description:"",priority:"Medium",status:"Open"}); }
    } catch(err) { alert(err.message); }
  };

  const filtered = cases.filter(c => c.title?.toLowerCase().includes(search.toLowerCase()) || c.description?.toLowerCase().includes(search.toLowerCase()));

  const STATUS_COLOR = {Open:"var(--blue)",Active:"var(--orange)",Resolved:"var(--green)",Closed:"var(--text-muted)"};

  return (
    <div style={P}>
      <div style={{maxWidth:1080,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:11,color:"var(--text-muted)",fontFamily:"var(--font-mono)",marginBottom:6}}>SAP EWM Operations &gt; Case Management &gt; <strong style={{color:"var(--text-primary)"}}>Incident Catalog</strong></div>
            <h1 style={{fontSize:22,fontWeight:800,color:"var(--text-primary)",letterSpacing:"-0.02em"}}>Incident Investigation Catalog</h1>
            <p style={{fontSize:13,color:"var(--text-muted)",marginTop:4}}>Explore staging errors, qRFC queue jams, and diagnostic checklists across S/4HANA EWM landscapes.</p>
          </div>
          <button onClick={()=>setShowNew(true)} className="btn-primary" style={{display:"flex",alignItems:"center",gap:6}}>
            <span>+ New Investigation</span>
          </button>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:20}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search investigations..." style={{flex:1,background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 14px",fontSize:13,color:"var(--text-primary)",outline:"none"}}/>
        </div>

        {loading && <p style={{color:"var(--text-muted)",fontSize:13}}>Loading...</p>}
        {!loading && filtered.length===0 && <p style={{color:"var(--text-muted)",fontSize:13}}>No investigations found. Create your first investigation above.</p>}

        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          {filtered.map(c => (
            <div key={c.id} onClick={()=>onOpen&&onOpen(c)} style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:"16px 20px",cursor:"pointer",transition:"all .15s",display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:16}}>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
                  <span style={{fontSize:10,fontFamily:"var(--font-mono)",fontWeight:700,color:"var(--text-muted)",background:"var(--bg-surface)",padding:"2px 8px",borderRadius:4,border:"1px solid var(--border-subtle)"}}>{c.case_id||c.id?.substring(0,12)}</span>
                  <span style={{fontSize:11,fontWeight:600,color:STATUS_COLOR[c.status]||"var(--text-muted)"}}>{c.status||"Open"}</span>
                  <span style={{fontSize:11,color:"var(--text-muted)"}}>{c.priority||"Medium"} Priority</span>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",marginBottom:4}}>{c.title}</div>
                <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.5}}>{(c.description||"").substring(0,150)}</div>
              </div>
              <div style={{fontSize:11,color:"var(--text-muted)",flexShrink:0,textAlign:"right"}}>
                <div>{new Date(c.created_at).toLocaleDateString()}</div>
                <div style={{color:"var(--orange)",fontFamily:"var(--font-mono)",fontSize:10,marginTop:4}}>Open →</div>
              </div>
            </div>
          ))}
        </div>

        {showNew && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowNew(false)}>
            <div style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:12,padding:28,width:480,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}>
              <h2 style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:20}}>New Investigation</h2>
              <form onSubmit={create} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div><label style={{fontSize:12,color:"var(--text-muted)",display:"block",marginBottom:4}}>Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="e.g. SMQ2 Queue Jam - Plant 1000" style={{width:"100%",background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 12px",fontSize:13,color:"var(--text-primary)",outline:"none"}}/></div>
                <div><label style={{fontSize:12,color:"var(--text-muted)",display:"block",marginBottom:4}}>Description</label><textarea value={form.description} onChange={e=>{setForm(f=>({...f,description:e.target.value})); e.target.style.height="auto"; e.target.style.height=Math.min(Math.max(e.target.scrollHeight, 72), 240)+"px";}} rows={3} placeholder="Describe the issue..." style={{width:"100%",minHeight:72,maxHeight:240,background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 12px",fontSize:13,color:"var(--text-primary)",outline:"none",resize:"vertical",boxSizing:"border-box",overflowY:"auto",lineHeight:1.5}}/></div>
                <div style={{display:"flex",gap:12}}>
                  <div style={{flex:1}}><label style={{fontSize:12,color:"var(--text-muted)",display:"block",marginBottom:4}}>Priority</label><select value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))} style={{width:"100%",background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 12px",fontSize:13,color:"var(--text-primary)"}}><option>High</option><option>Medium</option><option>Low</option></select></div>
                  <div style={{flex:1}}><label style={{fontSize:12,color:"var(--text-muted)",display:"block",marginBottom:4}}>Status</label><select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))} style={{width:"100%",background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 12px",fontSize:13,color:"var(--text-primary)"}}><option>Open</option><option>Active</option><option>Resolved</option></select></div>
                </div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end",marginTop:4}}>
                  <button type="button" onClick={()=>setShowNew(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Create Investigation</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
