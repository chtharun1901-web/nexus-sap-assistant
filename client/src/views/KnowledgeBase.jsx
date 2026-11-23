import { useState, useEffect } from "react";
import { api } from "../api.js";

const P = {background:"var(--bg-main)",color:"var(--text-primary)",height:"100%",overflowY:"auto",padding:"32px 40px 60px"};

const MODULE_FILTERS = [
  { id: "ALL", label: "All Modules" },
  { id: "SD", label: "SD / S/4HANA Sales" },
  { id: "GTS", label: "SAP GTS" },
  { id: "EWM", label: "SAP EWM" },
  { id: "MM", label: "SAP MM" },
  { id: "PP", label: "SAP PP" },
  { id: "AI", label: "Business AI & Joule" },
];

const EDITION_FILTERS = [
  { id: "ALL", label: "All Editions" },
  { id: "Public", label: "Cloud Public" },
  { id: "Private", label: "Cloud Private" },
  { id: "On-Premise", label: "On-Premise" }
];

export default function KnowledgeBase() {
  const [kbItems, setKbItems] = useState([]);
  const [notes, setNotes] = useState([]);
  const [newsItems, setNewsItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("news");
  const [moduleFilter, setModuleFilter] = useState("ALL");
  const [editionFilter, setEditionFilter] = useState("ALL");

  useEffect(() => {
    Promise.all([
      api.getKb().catch(() => ({ catalog: [] })),
      api.getNotes().catch(() => ({ notes: [] })),
      api.getSapNews().catch(() => ({ items: [] }))
    ])
      .then(([kb, n, news]) => {
        setKbItems(kb.catalog || kb.items || []);
        setNotes(n.notes || []);
        setNewsItems(news.items || []);
        setLoading(false);
      });
  }, []);

  const filteredKb = kbItems.filter(i => 
    !search || 
    i.title?.toLowerCase().includes(search.toLowerCase()) || 
    (i.keywords || []).some(k => k.toLowerCase().includes(search.toLowerCase()))
  );

  const filteredNotes = notes.filter(i => 
    !search || 
    i.title?.toLowerCase().includes(search.toLowerCase()) || 
    i.noteNumber?.includes(search)
  );

  const filteredNews = newsItems.filter(item => {
    const s = search.toLowerCase();
    const matchesSearch = !search || 
      item.title?.toLowerCase().includes(s) ||
      item.summary?.toLowerCase().includes(s) ||
      (item.keywords || []).some(k => k.toLowerCase().includes(s)) ||
      item.module?.toLowerCase().includes(s) ||
      item.release?.toLowerCase().includes(s);

    const matchesModule = moduleFilter === "ALL" || 
      (item.module && item.module.toLowerCase().includes(moduleFilter.toLowerCase())) ||
      (item.keywords && item.keywords.some(k => k.toLowerCase().includes(moduleFilter.toLowerCase())));

    const matchesEdition = editionFilter === "ALL" || 
      (item.edition && item.edition.toLowerCase().includes(editionFilter.toLowerCase())) ||
      (item.applicability && item.applicability.toLowerCase().includes(editionFilter.toLowerCase()));

    return matchesSearch && matchesModule && matchesEdition;
  });

  return (
    <div style={P}>
      <div style={{maxWidth:1120,margin:"0 auto"}}>
        {/* Header */}
        <div style={{marginBottom:24}}>
          <div style={{fontSize:11,color:"var(--text-muted)",fontFamily:"var(--font-mono)",marginBottom:6}}>
            Nexus &gt; <strong style={{color:"var(--text-primary)"}}>Enterprise Official News & Retrieval Engine</strong>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end",flexWrap:"wrap",gap:12}}>
            <div>
              <h1 style={{fontSize:24,fontWeight:800,color:"var(--text-primary)",letterSpacing:"-0.02em"}}>
                Enterprise Knowledge Base & News
              </h1>
              <p style={{fontSize:13,color:"var(--text-muted)",marginTop:4,maxWidth:720,lineHeight:1.5}}>
                Verified release innovations, official documentation, reference architecture, and enterprise technical notes across Cloud Public, Cloud Private, and On-Premise editions.
              </p>
            </div>
            <div style={{display:"flex",gap:8,alignItems:"center"}}>
              <span style={{fontSize:11,background:"rgba(16,185,129,0.12)",color:"#10B981",border:"1px solid rgba(16,185,129,0.3)",padding:"4px 10px",borderRadius:20,fontWeight:700,fontFamily:"var(--font-mono)"}}>
                ● Tier 1 Enterprise Grounded
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div style={{display:"flex",gap:8,marginBottom:16,alignItems:"center"}}>
          <input 
            value={search} 
            onChange={e=>setSearch(e.target.value)} 
            placeholder="Search verified enterprise release innovations, transaction codes, or keywords (e.g. Sales, Supply Chain, Logistics)..." 
            style={{flex:1,background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:8,padding:"10px 16px",fontSize:13,color:"var(--text-primary)",outline:"none"}}
          />
          {search && <button onClick={()=>setSearch("")} className="btn-secondary" style={{padding:"8px 14px",fontSize:13}}>Clear</button>}
        </div>

        {/* Tab Navigation */}
        <div style={{display:"flex",gap:6,marginBottom:20,borderBottom:"1px solid var(--border-subtle)",paddingBottom:8}}>
          {[
            { id: "news", label: "Official Release Innovations & News", count: filteredNews.length },
            { id: "kb", label: "Enterprise Documentation Articles", count: filteredKb.length },
            { id: "notes", label: "Enterprise Notes Catalog", count: filteredNotes.length }
          ].map(t => (
            <button 
              key={t.id} 
              onClick={()=>setActiveTab(t.id)} 
              style={{
                padding:"8px 18px",
                borderRadius:6,
                fontSize:13,
                fontWeight:700,
                border:"1px solid",
                borderColor: activeTab===t.id ? "var(--orange)" : "transparent",
                background: activeTab===t.id ? "rgba(255,85,0,0.1)" : "transparent",
                color: activeTab===t.id ? "var(--orange)" : "var(--text-muted)",
                cursor:"pointer",
                display:"flex",
                alignItems:"center",
                gap:8
              }}
            >
              <span>{t.label}</span>
              <span style={{fontSize:11,background:"var(--bg-card)",padding:"1px 6px",borderRadius:10,opacity:0.8}}>
                {t.count}
              </span>
            </button>
          ))}
        </div>

        {loading && <p style={{color:"var(--text-muted)",fontSize:13,padding:"20px 0"}}>Loading official enterprise knowledge assets...</p>}

        {/* ── TAB 1: OFFICIAL SAP NEWS & RELEASE INNOVATIONS ── */}
        {!loading && activeTab === "news" && (
          <div>
            {/* Filters */}
            <div style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:"14px 16px",marginBottom:20,display:"flex",flexDirection:"column",gap:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                <span style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",fontFamily:"var(--font-mono)",minWidth:70}}>
                  Module:
                </span>
                {MODULE_FILTERS.map(m => (
                  <button 
                    key={m.id}
                    onClick={()=>setModuleFilter(m.id)}
                    style={{
                      padding:"4px 10px",
                      borderRadius:6,
                      fontSize:12,
                      fontWeight: moduleFilter===m.id ? 700 : 500,
                      border:"1px solid",
                      borderColor: moduleFilter===m.id ? "var(--orange)" : "var(--border-subtle)",
                      background: moduleFilter===m.id ? "rgba(255,85,0,0.12)" : "var(--bg-surface)",
                      color: moduleFilter===m.id ? "var(--orange)" : "var(--text-primary)",
                      cursor:"pointer"
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",borderTop:"1px solid var(--border-subtle)",paddingTop:10}}>
                <span style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",fontFamily:"var(--font-mono)",minWidth:70}}>
                  Edition:
                </span>
                {EDITION_FILTERS.map(ed => (
                  <button 
                    key={ed.id}
                    onClick={()=>setEditionFilter(ed.id)}
                    style={{
                      padding:"3px 10px",
                      borderRadius:6,
                      fontSize:12,
                      fontWeight: editionFilter===ed.id ? 700 : 500,
                      border:"1px solid",
                      borderColor: editionFilter===ed.id ? "var(--blue-text)" : "var(--border-subtle)",
                      background: editionFilter===ed.id ? "var(--blue-light)" : "var(--bg-surface)",
                      color: editionFilter===ed.id ? "var(--blue-text)" : "var(--text-muted)",
                      cursor:"pointer"
                    }}
                  >
                    {ed.label}
                  </button>
                ))}
              </div>
            </div>

            {filteredNews.length === 0 && (
              <div style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:32,textAlign:"center",color:"var(--text-muted)",fontSize:13}}>
                No official enterprise release innovations found matching the selected filter criteria.
              </div>
            )}

            <div style={{display:"flex",flexDirection:"column",gap:16}}>
              {filteredNews.map(item => (
                <div key={item.citationId || item.id} style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:"20px 24px",boxShadow:"0 1px 3px rgba(0,0,0,0.05)"}}>
                  {/* Top Metadata Row */}
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10,flexWrap:"wrap",gap:8}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                      <span style={{fontSize:10,fontFamily:"var(--font-mono)",fontWeight:800,color:"#10B981",background:"rgba(16,185,129,0.12)",border:"1px solid rgba(16,185,129,0.3)",padding:"3px 8px",borderRadius:4}}>
                        Tier {item.tierLevel || 1} Official Enterprise
                      </span>
                      <span style={{fontSize:11,fontFamily:"var(--font-mono)",fontWeight:700,color:"var(--orange)",background:"rgba(255,85,0,0.08)",border:"1px solid rgba(255,85,0,0.25)",padding:"2px 8px",borderRadius:4}}>
                        {item.citationId || item.id}
                      </span>
                      <span style={{fontSize:11,color:"var(--text-muted)",fontWeight:600}}>
                        {item.module}
                      </span>
                    </div>

                    <div style={{display:"flex",alignItems:"center",gap:8}}>
                      <span style={{fontSize:11,fontFamily:"var(--font-mono)",color:"var(--text-muted)"}}>
                        {item.publishDate || "Official Release"}
                      </span>
                      {item.url && (
                        <a href={item.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"var(--blue-text)",fontFamily:"var(--font-mono)",textDecoration:"none",display:"flex",alignItems:"center",gap:3,fontWeight:600}}>
                          Enterprise Official Portal ↗
                        </a>
                      )}
                    </div>
                  </div>

                  {/* Title & Product/Release */}
                  <h3 style={{fontSize:16,fontWeight:800,color:"var(--text-primary)",marginBottom:4,lineHeight:1.4}}>
                    {item.title}
                  </h3>
                  <div style={{fontSize:12,color:"var(--text-muted)",marginBottom:12,display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
                    <span style={{fontWeight:600,color:"var(--text-primary)"}}>{item.product}</span>
                    <span>·</span>
                    <span style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",padding:"1px 6px",borderRadius:4,fontFamily:"var(--font-mono)",fontSize:11}}>
                      Release {item.release}
                    </span>
                    <span>·</span>
                    <span style={{color:"var(--blue-text)",fontWeight:600}}>
                      {item.edition}
                    </span>
                  </div>

                  {/* Verified Summary */}
                  <div style={{fontSize:13,color:"var(--text-body)",lineHeight:1.65,marginBottom:12}}>
                    {item.summary}
                  </div>

                  {/* Edition Applicability Note */}
                  {(item.applicability || item.editionApplicability) && (
                    <div style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"10px 14px",marginBottom:12,fontSize:12,lineHeight:1.6}}>
                      <div style={{color:"var(--orange)",fontFamily:"var(--font-mono)",fontSize:11,fontWeight:700,textTransform:"uppercase",marginBottom:4}}>
                        Edition Scope & Availability:
                      </div>
                      {typeof item.editionApplicability === 'object' ? (
                        <div style={{display:"flex",flexDirection:"column",gap:2,color:"var(--text-body)"}}>
                          <div><strong>Cloud Public:</strong> {item.editionApplicability.publicCloud}</div>
                          <div><strong>Cloud Private:</strong> {item.editionApplicability.privateCloud}</div>
                          <div><strong>On-Premise:</strong> {item.editionApplicability.onPremise}</div>
                        </div>
                      ) : (
                        <span style={{color:"var(--text-body)"}}>{item.applicability}</span>
                      )}
                    </div>
                  )}

                  {/* Specific Innovations List */}
                  {item.innovations && item.innovations.length > 0 && (
                    <div style={{marginBottom:12}}>
                      <div style={{fontSize:11,fontWeight:700,color:"var(--text-muted)",textTransform:"uppercase",fontFamily:"var(--font-mono)",marginBottom:6}}>
                        Verified Capabilities:
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:8}}>
                        {item.innovations.map((inv, idx) => (
                          <div key={idx} style={{background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",borderRadius:6,padding:"8px 12px",fontSize:12,color:"var(--text-body)"}}>
                            <span style={{color:"#10B981",marginRight:6}}>✓</span>
                            {inv}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics / Keywords */}
                  {((item.topics && item.topics.length > 0) || (item.keywords && item.keywords.length > 0)) && (
                    <div style={{display:"flex",flexWrap:"wrap",gap:4,marginTop:12,borderTop:"1px solid var(--border-subtle)",paddingTop:10}}>
                      {(item.topics || item.keywords || []).map((k, i) => (
                        <span key={i} style={{fontSize:10,fontFamily:"var(--font-mono)",background:"var(--bg-surface)",border:"1px solid var(--border-subtle)",padding:"2px 6px",borderRadius:4,color:"var(--text-muted)"}}>
                          #{k}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TAB 2: SAP HELP PORTAL ARTICLES ── */}
        {!loading && activeTab === "kb" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filteredKb.length === 0 && <p style={{color:"var(--text-muted)",fontSize:13}}>No results found.</p>}
            {filteredKb.map(item => (
              <div key={item.id} style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:"18px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"wrap",gap:8}}>
                  <div>
                    <span style={{fontSize:10,fontFamily:"var(--font-mono)",fontWeight:700,color:"var(--orange)",background:"rgba(255,85,0,0.1)",border:"1px solid rgba(255,85,0,0.3)",padding:"2px 8px",borderRadius:4}}>{item.citationId}</span>
                    <span style={{fontSize:11,color:"var(--text-muted)",marginLeft:8}}>{item.tier}</span>
                  </div>
                  {item.url && <a href={item.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"var(--blue-text)",fontFamily:"var(--font-mono)"}}>View Documentation ↗</a>}
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

        {/* ── TAB 3: ENTERPRISE TECHNICAL NOTES CATALOG ── */}
        {!loading && activeTab === "notes" && (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            {filteredNotes.length === 0 && <p style={{color:"var(--text-muted)",fontSize:13}}>No results found.</p>}
            {filteredNotes.map(note => (
              <div key={note.noteNumber} style={{background:"var(--bg-card)",border:"1px solid var(--border-subtle)",borderRadius:10,padding:"18px 20px"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:8,flexWrap:"gap",gap:8}}>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontSize:10,fontFamily:"var(--font-mono)",fontWeight:700,color:"var(--blue-text)",background:"var(--blue-light)",border:"1px solid var(--blue-border)",padding:"2px 8px",borderRadius:4}}>Note #{note.noteNumber}</span>
                    <span style={{fontSize:10,color:"var(--green-text)",background:"var(--green-light)",border:"1px solid var(--green-border)",padding:"2px 8px",borderRadius:4,fontWeight:600}}>{note.verified?"Verified":""}</span>
                  </div>
                  {note.url && <a href={note.url} target="_blank" rel="noreferrer" style={{fontSize:11,color:"var(--blue-text)"}}>Documentation Portal ↗</a>}
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
