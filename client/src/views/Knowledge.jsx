import { useState, useEffect } from "react";
import { api } from "../api.js";

const P = {background:"var(--bg-main)",color:"var(--text-primary)",height:"100%",overflowY:"auto",padding:"32px 40px 60px"};
const TYPES = ["all","note","snippet","procedure","best_practice"];
const TYPE_LABELS = {all:"All Items",note:"Notes",snippet:"Snippets",procedure:"Procedures",best_practice:"Best Practices"};

export default function Knowledge() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({title:"",content:"",type:"note",tags:""});

  useEffect(() => {
    api.getKnowledge().then(d => { setItems(d.items||[]); setLoading(false); }).catch(()=>setLoading(false));
  }, []);

  const addItem = async (e) => {
    e.preventDefault();
    try {
      const d = await api.addKnowledge({...form, tags: form.tags.split(",").map(t=>t.trim()).filter(Boolean)});
      if (d.item) { setItems(prev=>[d.item,...prev]); setShowAdd(false); setForm({title:"",content:"",type:"note",tags:""}); }
    } catch(err) { alert(err.message); }
  };

  const filtered = items.filter(item => {
    const matchType = typeFilter==="all" || item.type===typeFilter;
    const matchSearch = !search || item.title?.toLowerCase().includes(search.toLowerCase()) || item.content?.toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const TYPE_COLOR = {note:"var(--blue-text)",snippet:"var(--green-text)",procedure:"var(--orange)",best_practice:"var(--amber-text)"};

  return (
    <div style={P}>
      <div style={{maxWidth:1080,margin:"0 auto"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:11,color:"var(--text-muted)",fontFamily:"var(--font-mono)",marginBottom:6}}>Sanjaya &gt; Personal Workspace &gt; <strong style={{color:"var(--text-primary)"}}>Knowledge Library</strong></div>
            <h1 style={{fontSize:22,fontWeight:800,color:"var(--text-primary)",letterSpacing:"-0.02em"}}>Personal Knowledge Library</h1>
            <p style={{fontSize:13,color:"var(--text-muted)",marginTop:4}}>Saved procedures, verified code snippets, operational notes, and personal documentation — isolated to your account.</p>
          </div>
          <button onClick={()=>setShowAdd(true)} className="btn-primary">＋ Add Knowledge Item</button>
        </div>

        <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center",flexWrap:"wrap"}}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search by title, tags, or content..." style={{flex:1,minWidth:200,background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 14px",fontSize:13,color:"var(--text-primary)",outline:"none"}}/>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {TYPES.map(t => (
              <button key={t} onClick={()=>setTypeFilter(t)} style={{padding:"5px 12px",borderRadius:9999,fontSize:11.5,fontWeight:600,border:"1px solid",borderColor:typeFilter===t?"var(--orange)":"var(--border-subtle)",background:typeFilter===t?"rgba(255,85,0,0.12)":"transparent",color:typeFilter===t?"var(--orange)":"var(--text-muted)"}}>
                {TYPE_LABELS[t]}
              </button>
            ))}
          </div>
        </div>

        {loading && <p style={{color:"var(--text-muted)",fontSize:13}}>Loading...</p>}
        {!loading && filtered.length===0 && <p style={{color:"var(--text-muted)",fontSize:13}}>No knowledge items found. Add your first item above.</p>}

        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(320px,1fr))",gap:14}}>
          {filtered.map(item => (
            <div key={item.id} style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:"16px 18px",transition:"all .15s"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <span style={{fontSize:10,fontFamily:"var(--font-mono)",fontWeight:700,color:TYPE_COLOR[item.type]||"var(--text-muted)",textTransform:"uppercase"}}>{item.type}</span>
                <span style={{fontSize:10,color:"var(--text-muted)"}}>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <div style={{fontSize:14,fontWeight:700,color:"var(--text-primary)",marginBottom:6}}>{item.title}</div>
              <div style={{fontSize:12,color:"var(--text-muted)",lineHeight:1.6,marginBottom:10}}>{(item.content||"").substring(0,160)}{(item.content||"").length>160?"...":""}</div>
              {item.tags?.length>0 && (
                <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                  {(Array.isArray(item.tags)?item.tags:JSON.parse(item.tags||"[]")).map((tag,i) => (
                    <span key={i} style={{fontSize:10,fontFamily:"var(--font-mono)",background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",padding:"1px 6px",borderRadius:4,color:"var(--text-muted)"}}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {showAdd && (
          <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",backdropFilter:"blur(4px)",zIndex:200,display:"flex",alignItems:"center",justifyContent:"center"}} onClick={()=>setShowAdd(false)}>
            <div style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:12,padding:28,width:520,maxWidth:"90vw"}} onClick={e=>e.stopPropagation()}>
              <h2 style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:20}}>Add Knowledge Item</h2>
              <form onSubmit={addItem} style={{display:"flex",flexDirection:"column",gap:14}}>
                <div><label style={{fontSize:12,color:"var(--text-muted)",display:"block",marginBottom:4}}>Title *</label><input value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))} required placeholder="e.g. SMQR Configuration for WM_STG_* queues" style={{width:"100%",background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 12px",fontSize:13,color:"var(--text-primary)",outline:"none"}}/></div>
                <div><label style={{fontSize:12,color:"var(--text-muted)",display:"block",marginBottom:4}}>Type</label><select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))} style={{width:"100%",background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 12px",fontSize:13,color:"var(--text-primary)"}}><option value="note">Note</option><option value="snippet">Snippet</option><option value="procedure">Procedure</option><option value="best_practice">Best Practice</option></select></div>
                <div><label style={{fontSize:12,color:"var(--text-muted)",display:"block",marginBottom:4}}>Content *</label><textarea value={form.content} onChange={e=>{setForm(f=>({...f,content:e.target.value})); e.target.style.height="auto"; e.target.style.height=Math.min(Math.max(e.target.scrollHeight, 110), 320)+"px";}} required rows={5} placeholder="Write your knowledge content..." style={{width:"100%",minHeight:110,maxHeight:320,background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 12px",fontSize:13,color:"var(--text-primary)",outline:"none",resize:"vertical",boxSizing:"border-box",overflowY:"auto",lineHeight:1.5}}/></div>
                <div><label style={{fontSize:12,color:"var(--text-muted)",display:"block",marginBottom:4}}>Tags (comma-separated)</label><input value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="smq2, ewm, qrfc, staging" style={{width:"100%",background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 12px",fontSize:13,color:"var(--text-primary)",outline:"none"}}/></div>
                <div style={{display:"flex",gap:8,justifyContent:"flex-end"}}>
                  <button type="button" onClick={()=>setShowAdd(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary">Save Item</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
