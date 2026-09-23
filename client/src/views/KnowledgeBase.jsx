import { useState, useEffect } from "react";
import { api } from "../api.js";

const P = {background:"var(--bg-main)",color:"var(--text-primary)",height:"100%",overflowY:"auto",padding:"32px 40px 60px"};

export default function KnowledgeBase() {
  const [kbItems, setKbItems] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("kb");

  useEffect(() => {
    Promise.all([api.getKb().catch(()=>({catalog:[]})), api.getNotes().catch(()=>({notes:[]}))])
      .then(([kb, n]) => { setKbItems(kb.catalog||kb.items||[]); setNotes(n.notes||[]); setLoading(false); });
  }, []);

  const filteredKb = kbItems.filter(i => !search || i.title?.toLowerCase().includes(search.toLowerCase()) || (i.keywords||[]).some(k=>k.includes(search.toLowerCase())));
  const filteredNotes = notes.filter(i => !search || i.title?.toLowerCase().includes(search.toLowerCase()) || i.noteNumber?.includes(search));

  return (
    <div style={P}>
      <div style={{maxWidth:1080,margin:"0 auto"}}>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:"var(--text-muted)",fontFamily:"var(--font-mono)",marginBottom:6}}>Sanjaya &gt; <strong style={{color:"var(--text-primary)"}}>SAP Knowledge Base & OSS Notes</strong></div>
          <h1 style={{fontSize:22,fontWeight:800,color:"var(--text-primary)",letterSpacing:"-0.02em"}}>SAP Help & OSS Notes Reference</h1>
          <p style={{fontSize:13,color:"var(--text-muted)",marginTop:4}}>Verified SAP Help Portal articles and official OSS notes for EWM, qRFC, bgRFC, and production integration.</p>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, T-code, or keyword..." style={{flex:1,background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 14px",fontSize:13,color:"var(--text-primary)",outline:"none"}}/>
          {search && <button onClick={()=>setSearch("")} className="btn-secondary">Clear</button>}
        </div>

        <div style={{display:"flex",gap:4,marginBottom:20}}>
          {[{id:"kb",label:"SAP Help Portal"},{id:"notes",label:"OSS Notes"}].map(t => (
            <button key={t.id} onClick={()=>setActiveTab(t.id)} style={{padding:"7px 16px",borderRadius:6,fontSize:13,fontWeight:600,border:"1px solid",borderColor:activeTab===t.id?"var(--orange)":"var(--border-subtle)",background:activeTab===t.id?"rgba(255,85,0,0.1)":"transparent",color:activeTab===t.id?"var(--orange)":"var(--text-muted)"}}>
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p style={{color:"var(--text-muted)",fontSize:13}}>Loading...</p>}

        {!loading && activeTab==="kb" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filteredKb.length===0 && <p style={{color:"var(--text-muted)",fontSize:13}}>No results found.</p>}
            {filteredKb.map(item => (
              <div key={item.id} style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:"18px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:8}}>
                  <div>
                    <span style={{fontSize:10,fontFamily:"var(--font-mono)",fontWeight:700,color:"var(--orange)",background:"rgba(255,85,0,0.1)",border:"1px solid rgba(255,85,0,0.3)",padding:"2px 8px",borderRadius:4}}>{item.citationId}</span>
                    <span style={{fontSize:11,color:"var(--text-muted)",marginLeft:8}}>{item.tier}</span>
                  </div>
                  {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"var(--blue-text)",fontFamily:"var(--font-mono)"}}>View on SAP Help ↗</a>}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",marginBottom:6}}>{item.title}</div>
                <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:10}}>{item.product} · {item.release}</div>
                <div style={{fontSize:13,color:"var(--text-body)",lineHeight:1.65}}>{item.excerpt}</div>
                {item.keywords?.length>0 && (
                  <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:10}}>
                    {item.keywords.slice(0,8).map((k,i) => <span key={i} style={{fontSize:10,fontFamily:"var(--font-mono)",background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",padding:"1px 6px",borderRadius:4,color:"var(--text-muted)"}}>{k}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab==="notes" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filteredNotes.length===0 && <p style={{color:"var(--text-muted)",fontSize:13}}>No results found.</p>}
            {filteredNotes.map(note => (
              <div key={note.noteNumber} style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:"18px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,fontFamily:"var(--font-mono)",fontWeight:700,color:"var(--blue-text)",background:"var(--blue-light)",border:"1px solid var(--blue-border)",padding:"2px 8px",borderRadius:4}}>OSS #{note.noteNumber}</span>
                    <span style={{fontSize:10,color:"var(--green-text)",background:"var(--green-light)",border:"1px solid var(--green-border)",padding:"2px 8px",borderRadius:4,fontWeight:600}}>{note.verified?"Verified":""}</span>
                  </div>
                  {note.url && <a href={note.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"var(--blue-text)"}}>SAP Me ↗</a>}
                </div>
                <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",marginBottom:6}}>{note.title}</div>
                <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:10}}>{note.component} · {note.priority} · {note.release}</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginTop:12}}>
                  <div style={{background:"var(--bg-surface)",borderRadius:6,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:"var(--text-muted)",marginBottom:4,textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>Symptom</div><div style={{fontSize:12,color:"var(--text-body)",lineHeight:1.5}}>{note.symptom}</div></div>
                  <div style={{background:"var(--bg-surface)",borderRadius:6,padding:"10px 12px"}}><div style={{fontSize:10,fontWeight:700,color:"var(--text-muted)",marginBottom:4,textTransform:"uppercase",fontFamily:"var(--font-mono)"}}>Solution</div><div style={{fontSize:12,color:"var(--text-body)",lineHeight:1.5}}>{note.solution}</div></div>
                </div>
                {note.tcodes?.length>0 && (
                  <div style={{display:"flex",gap:6,marginTop:10}}>
                    {note.tcodes.map((t,i) => <span key={i} style={{fontSize:11,fontFamily:"var(--font-mono)",fontWeight:700,color:"var(--orange)",background:"rgba(255,85,0,0.08)",border:"1px solid rgba(255,85,0,0.25)",padding:"2px 8px",borderRadius:4}}>{t}</span>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
