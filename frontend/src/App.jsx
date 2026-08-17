import { useState, useEffect, useRef } from 'react';
import './index.css';
import FilterPanel from './components/FilterPanel';

function App() {
  const [activeTab, setActiveTab] = useState('qa');
  const [chatStarted, setChatStarted] = useState(false);
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stage, setStage] = useState('');
  const [sources, setSources] = useState(['papers', 'web']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isBackendReady, setIsBackendReady] = useState(false);
  const [backendStatusMsg, setBackendStatusMsg] = useState('Connecting to backend...');
  const [sidebarSearch, setSidebarSearch] = useState('');

  const [recentQueries, setRecentQueries] = useState(() => {
    return JSON.parse(localStorage.getItem('thesisai_recent') || '[]');
  });

  const chatEndRef = useRef(null);

  const TAB_CONFIG = {
    qa: {
      greeting: 'What would you like to research today?',
      placeholder: 'Ask any research question…',
      chips: [
        'What are the main causes of climate change?',
        'How does CRISPR gene editing work?',
        'What is the latest research on transformer efficiency?',
      ],
    },
    lit: {
      greeting: 'Generate a comprehensive literature review',
      placeholder: 'Enter your research topic for a literature review…',
      chips: [
        'Literature review on deep learning in medical imaging',
        'Literature review on climate change adaptation strategies',
        'Summarise the literature on large language models',
      ],
    },
    sys: {
      greeting: 'Run a systematic review with PRISMA methodology',
      placeholder: 'Describe your systematic review question (PICO format recommended)…',
      chips: [
        'Systematic review: effectiveness of CBT for depression in adults',
        'PRISMA review on mRNA vaccines safety and efficacy',
        'Systematic review of renewable energy adoption barriers',
      ],
    },
    data: {
      greeting: 'Analyse and visualise research data',
      placeholder: 'Describe what data you want to analyse or visualise…',
      chips: [
        'Analyse publication trends in AI research 2015–2024',
        'Compare citation counts across climate science journals',
        'Visualise co-authorship networks in machine learning',
      ],
    },
    gaps: {
      greeting: 'Identify open research gaps in your field',
      placeholder: 'Enter a research area to find unexplored gaps…',
      chips: [
        'Research gaps in federated learning for healthcare',
        'Unexplored areas in quantum computing error correction',
        'What are the open problems in multi-modal LLMs?',
      ],
    },
    chat: {
      greeting: 'Chat with a specific paper or document',
      placeholder: 'Paste a DOI, arXiv ID, or URL — then ask questions about it…',
      chips: [
        'arxiv:2303.08774 — summarise key contributions',
        'doi:10.1038/s41586-021-03819-2 — explain the methods',
        'https://arxiv.org/abs/2005.14165 — what are the limitations?',
      ],
    },
  };

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, stage]);

  useEffect(() => {
    let timeoutId;
    const checkBackend = async () => {
      try {
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), 3000);
        const res = await fetch('http://localhost:8000/health', { signal: controller.signal });
        clearTimeout(id);

        if (res.ok) {
          setIsBackendReady(true);
        } else {
          setBackendStatusMsg('Backend is not ready yet...');
          timeoutId = setTimeout(checkBackend, 2000);
        }
      } catch (err) {
        setBackendStatusMsg('Backend is offline. Please start it (port 8000).');
        timeoutId = setTimeout(checkBackend, 2000);
      }
    };
    checkBackend();

    return () => clearTimeout(timeoutId);
  }, []);

  const toggleSource = (src) => {
    setSources(prev =>
      prev.includes(src) ? prev.filter(s => s !== src) : [...prev, src]
    );
  };

  const submitQuery = async (text) => {
    // Chat functionality is temporarily commented out
    console.log("Chat functionality is disabled.");
    return;
  };

  const renderAnswer = (text) => {
    return text.replace(/\\[(\\d+(?:,\\s*\\d+)*)\\]/g, (m, nums) => {
      return nums.split(',').map(n => `<span class="cite-chip">${n.trim()}</span>`).join('');
    });
  };

  return (
    <div className="app">
      {!isBackendReady && (
        <div className="backend-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.95)', zIndex: 9999,
          display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
          color: 'white', backdropFilter: 'blur(10px)'
        }}>
          <div className="brand-mark" style={{ fontSize: '48px', width: '80px', height: '80px', marginBottom: '24px' }}>T</div>
          <h2 style={{ fontSize: '24px', marginBottom: '12px', fontWeight: 600 }}>{backendStatusMsg}</h2>
          <p style={{ color: '#94a3b8', maxWidth: '400px', textAlign: 'center' }}>
            Run <code style={{ backgroundColor: '#1e293b', padding: '4px 8px', borderRadius: '4px' }}>python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload</code> in your terminal to start the backend.
          </p>
          <div className="stage-dot" style={{ marginTop: '24px', width: '12px', height: '12px' }}></div>
        </div>
      )}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div className="brand-name">Thesis<em>AI</em></div>
        </div>

        <button className="new-chat-btn" onClick={() => { setChatStarted(false); setMessages([]); }}>
          <span className="new-chat-icon">+</span> <span className="nav-label">New chat</span>
        </button>

        <div className="nav-group">
          <div className="nav-item"><span className="icon">✎</span> <span className="nav-label">AI Writer</span></div>
          <div className="nav-item"><span className="icon">▤</span> <span className="nav-label">Library</span></div>
          <div className="nav-item"><span className="icon">⚗</span> <span className="nav-label">Systematic Review</span></div>
          <div className="nav-item active"><span className="icon">◷</span> <span className="nav-label">Recents</span></div>
        </div>

        <div className="nav-divider"></div>
        <div className="sidebar-search">
          <span className="icon">🔍</span>
          <input
            type="text"
            className="nav-label"
            placeholder="Search…"
            value={sidebarSearch}
            onChange={(e) => setSidebarSearch(e.target.value)}
            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '13px', color: 'var(--ink)' }}
          />
        </div>

        {recentQueries.filter(q => q.text.toLowerCase().includes(sidebarSearch.toLowerCase())).length === 0 ? (
          <div id="recentsSidebar" className="sidebar-empty">
            {recentQueries.length === 0 ? "No queries or chats yet" : "No results found"}
          </div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            {recentQueries
              .filter(q => q.text.toLowerCase().includes(sidebarSearch.toLowerCase()))
              .slice(0, 6)
              .map((q, i) => (
                <div key={i} className="recent-item" onClick={() => submitQuery(q.text)}>
                  <div>
                    <div className="recent-text">{q.text}</div>
                    <div className="recent-meta">{q.time}</div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </aside>

      <main className="main">
        <div className="topbar">
          <div className="pill">🎓 ThesisAI Free</div>
          <div className="avatar">AV</div>
        </div>

        <div className="content" id="content">
          <div className="content-inner">

            {!chatStarted ? (
              <div id="homeView">
                <div className="watermark">THESIS</div>
                <h1 className="greeting" id="greeting">Welcome back, Aditya</h1>
                <p className="sub-greeting">{TAB_CONFIG[activeTab].greeting}</p>

                <div className="workflow-tabs" id="workflowTabs">
                  {Object.keys(TAB_CONFIG).map(tabKey => (
                    <div
                      key={tabKey}
                      className={`tab ${activeTab === tabKey ? 'active' : ''}`}
                      onClick={() => setActiveTab(tabKey)}
                    >
                      {tabKey === 'qa' && '🎯 Quick Q/A'}
                      {tabKey === 'lit' && '📚 Literature review'}
                      {tabKey === 'sys' && '⚗ Systematic review'}
                      {tabKey === 'data' && '📈 Data analysis'}
                      {tabKey === 'gaps' && '🔍 Research gaps'}
                      {tabKey === 'chat' && '💬 Paper chat'}
                    </div>
                  ))}
                </div>

                <div className="composer">
                  <textarea
                    id="queryInput"
                    placeholder={TAB_CONFIG[activeTab].placeholder}
                    rows="3"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuery(query); } }}
                  ></textarea>
                  <div className="composer-toolbar">
                    <div className="toolbar-left">
                      <button className={`toolbar-btn ${sources.includes('papers') ? 'selected' : ''}`} onClick={() => toggleSource('papers')}>
                        📄 Papers {sources.includes('papers') ? '✓' : ''}
                      </button>
                      <button className={`toolbar-btn ${sources.includes('web') ? 'selected' : ''}`} onClick={() => toggleSource('web')}>
                        🌐 Internet {sources.includes('web') ? '✓' : ''}
                      </button>
                      <button className="toolbar-btn" onClick={() => setIsFilterOpen(true)}>⚙ Filters</button>
                    </div>
                    <div className="toolbar-right">
                      <button className="send-btn" onClick={() => submitQuery(query)}>↑</button>
                    </div>
                  </div>
                </div>

                <div className="try-row">
                  {TAB_CONFIG[activeTab].chips.map((chip, idx) => (
                    <div key={idx} className="try-chip" onClick={() => setQuery(chip)}>{chip}</div>
                  ))}
                </div>
              </div>
            ) : (
              <div id="chatView" className="chat-view">
                {messages.map((msg, idx) => (
                  <div key={idx}>
                    {msg.role === 'user' ? (
                      <div className="msg-row-user">
                        <div className="msg-user">{msg.content}</div>
                      </div>
                    ) : (
                      <>
                        {msg.content === '' && stage && (
                          <div className="stage-line">
                            <span className="stage-dot"></span><span className="stage-text">{stage}</span>
                          </div>
                        )}
                        {msg.content !== '' && (
                          <div className="msg-assistant" dangerouslySetInnerHTML={{ __html: renderAnswer(msg.content).replace(/\\n/g, '<br>') }} />
                        )}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="sources-grid">
                            {msg.citations.map((c, i) => (
                              <div key={i} className="source-card">
                                <span className="src-badge">[{c.index}] {c.source}</span>
                                <div className="src-title">
                                  {c.url ? <a href={c.url} target="_blank" rel="noopener">{c.title}</a> : c.title}
                                </div>
                                <div className="src-meta">{c.authors?.slice(0, 3).join(', ')}{c.year ? ' · ' + c.year : ''}</div>
                                {c.snippet && <div className="src-snippet">{c.snippet.slice(0, 160)}…</div>}
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                {stage && isLoading && messages[messages.length - 1]?.content !== '' && (
                  <div className="stage-line">
                    <span className="stage-dot"></span><span className="stage-text">{stage}</span>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>
            )}

            {chatStarted && (
              <div className="chat-composer-dock" id="dockedComposer">
                <div className="composer">
                  <textarea
                    id="queryInputDocked"
                    placeholder="Ask a follow-up question"
                    rows="1"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submitQuery(query); } }}
                  ></textarea>
                  <div className="composer-toolbar">
                    <div className="toolbar-left">
                      <button className={`toolbar-btn ${sources.includes('papers') ? 'selected' : ''}`} onClick={() => toggleSource('papers')}>
                        📄 Papers {sources.includes('papers') ? '✓' : ''}
                      </button>
                      <button className={`toolbar-btn ${sources.includes('web') ? 'selected' : ''}`} onClick={() => toggleSource('web')}>
                        🌐 Internet {sources.includes('web') ? '✓' : ''}
                      </button>
                      <button className="toolbar-btn" onClick={() => setIsFilterOpen(true)}>⚙ Filters</button>
                    </div>
                    <div className="toolbar-right">
                      <button className="send-btn" onClick={() => submitQuery(query)}>↑</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>

      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} sources={sources} toggleSource={toggleSource} />
    </div>
  );
}

export default App;
