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
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">T</div>
          <div className="brand-name">Thesis<em>AI</em></div>
        </div>

        <button className="new-chat-btn" onClick={() => { setChatStarted(false); setMessages([]); }}>+ New chat</button>

        <div className="nav-group">
          <div className="nav-item"><span className="icon">✎</span> AI Writer</div>
          <div className="nav-item"><span className="icon">▤</span> Library</div>
          <div className="nav-item"><span className="icon">⚗</span> Systematic Review</div>
          <div className="nav-item active"><span className="icon">◷</span> Recents</div>
        </div>

        <div className="nav-divider"></div>
        <div className="sidebar-search">🔍 Search…</div>

        {recentQueries.length === 0 ? (
          <div id="recentsSidebar" className="sidebar-empty">No queries or chats yet</div>
        ) : (
          <div style={{ marginTop: '16px' }}>
            {recentQueries.slice(0, 6).map((q, i) => (
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
                    <div key={idx} className="try-chip" onClick={() => submitQuery(chip)}>{chip}</div>
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

      <FilterPanel isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} />
    </div>
  );
}

export default App;
