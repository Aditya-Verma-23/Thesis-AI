import React, { useState, useEffect } from 'react';

const QUALITY_STEPS = ['Q1', 'Q2', 'Q3', 'Q4', 'All'];

function FilterPanel({ isOpen, onClose, onFiltersChange, initialFilters, sources, toggleSource }) {
  // State for Accordions
  const [expanded, setExpanded] = useState({
    citations: true,
    quality: true,
    pubTypes: true,
    database: true,
    dates: true
  });

  const toggleAccordion = (key) => setExpanded(prev => ({ ...prev, [key]: !prev[key] }));

  // Filter States
  const [minCitations, setMinCitations] = useState(0);
  const [journalQuality, setJournalQuality] = useState(4); // index 4 = All
  
  const [pubTypes, setPubTypes] = useState({
    journal: true,
    review: true,
    conference: true,
    preprint: false,
    books: false
  });

  const [dbMain, setDbMain] = useState({
    researchPapers: true,
    webSearches: true,
    patents: false,
    medicare: false,
    myLibrary: false
  });

  const [dbPapers, setDbPapers] = useState({
    semanticScholar: true,
    openAlex: true,
    pubmed: false,
    arxiv: false,
    clinicalTrials: false
  });

  const [dbWeb, setDbWeb] = useState({
    all: true,
    gov: false,
    edu: false
  });

  const [dates, setDates] = useState({
    start: '',
    end: ''
  });

  // Handle derived states
  const handleWebFilterChange = (which) => {
    if (which === 'all') {
      setDbWeb({ all: true, gov: false, edu: false });
    } else {
      setDbWeb(prev => ({ ...prev, [which]: !prev[which], all: false }));
    }
  };

  const resetFilters = () => {
    setMinCitations(0);
    setJournalQuality(4);
    setPubTypes({ journal: true, review: true, conference: false, preprint: false, books: false });
    setDbMain({ researchPapers: true, webSearches: true, patents: false, medicare: false, myLibrary: false });
    setDbPapers({ semanticScholar: true, openAlex: true, pubmed: false, arxiv: true, clinicalTrials: false });
    setDbWeb({ all: true, gov: false, edu: false });
    setDates({ start: '', end: '' });
  };

  const handleApply = () => {
    // In a real app, we'd pass the aggregated state up
    onClose();
  };

  // Helper for the Journal Quality step slider visual
  const qualPct = (journalQuality / (QUALITY_STEPS.length - 1)) * 100;

  const isPapersEnabled = sources ? sources.includes('papers') : dbMain.researchPapers;
  const isWebEnabled = sources ? sources.includes('web') : dbMain.webSearches;

  return (
    <>
      <div className={`filter-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}></div>
      <div className={`filter-panel ${isOpen ? 'open' : ''}`}>
        
        <div className="filter-head">
          <div className="filter-head-row">
            <div className="filter-title">Research Paper Filter</div>
            <button className="filter-close" onClick={onClose} aria-label="Close filters">✕</button>
          </div>
        </div>

        <div className="filter-body">
          {/* Minimum Citations */}
          <div className="fp-section">
            <button className="fp-trigger" aria-expanded={expanded.citations} onClick={() => toggleAccordion('citations')}>
              Minimum Citations <span className="fp-chevron">▲</span>
            </button>
            <div className={`fp-content ${!expanded.citations ? 'collapsed' : ''}`}>
              <div className="fp-slider-wrap">
                <div className="fp-slider-header">
                  <span className="fp-slider-label">Current value:</span>
                  <span className="fp-slider-val">{minCitations}</span>
                </div>
                <input 
                  type="range" 
                  className="fp-range" 
                  min="0" max="20" 
                  value={minCitations}
                  onChange={(e) => setMinCitations(Number(e.target.value))}
                  style={{ background: `linear-gradient(to right, var(--maroon) 0%, var(--maroon) ${(minCitations/20)*100}%, #e8dde0 ${(minCitations/20)*100}%, #e8dde0 100%)` }}
                />
                <div className="fp-range-bounds"><span>0</span><span>20</span></div>
              </div>
            </div>
          </div>

          {/* Journal Quality */}
          <div className="fp-section">
            <button className="fp-trigger" aria-expanded={expanded.quality} onClick={() => toggleAccordion('quality')}>
              Journal quality <span style={{fontSize:'11px', color:'var(--ink-faint)', fontWeight:400, marginLeft:'4px'}}>ⓘ</span><span className="fp-chevron">▲</span>
            </button>
            <div className={`fp-content ${!expanded.quality ? 'collapsed' : ''}`}>
              <div className="fp-quality-wrap">
                <div className="fp-quality-track" onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                  setJournalQuality(Math.round(pct * (QUALITY_STEPS.length - 1)));
                }}>
                  <div className="fp-quality-fill" style={{ width: `${qualPct}%` }}></div>
                  <div className="fp-quality-thumb" style={{ left: `${qualPct}%` }}></div>
                </div>
                <div className="fp-quality-labels">
                  {QUALITY_STEPS.map((lbl, idx) => (
                    <span key={idx} onClick={() => setJournalQuality(idx)} style={{ cursor: 'pointer' }}>{lbl}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Publication Types */}
          <div className="fp-section">
            <button className="fp-trigger" aria-expanded={expanded.pubTypes} onClick={() => toggleAccordion('pubTypes')}>
              Publication Types <span className="fp-chevron">▲</span>
            </button>
            <div className={`fp-content ${!expanded.pubTypes ? 'collapsed' : ''}`}>
              <p className="fp-hint">Select the types of publications to include in your search</p>
              <div className="fp-checkbox-list">
                <label className="fp-cb-label">
                  <input type="checkbox" checked={pubTypes.journal} onChange={(e) => setPubTypes(p => ({...p, journal: e.target.checked}))} />
                  <span className="fp-custom-cb"></span>Journal Articles
                </label>
                <label className="fp-cb-label">
                  <input type="checkbox" checked={pubTypes.review} onChange={(e) => setPubTypes(p => ({...p, review: e.target.checked}))} />
                  <span className="fp-custom-cb"></span>Review Articles
                </label>
                <label className="fp-cb-label">
                  <input type="checkbox" checked={pubTypes.conference} onChange={(e) => setPubTypes(p => ({...p, conference: e.target.checked}))} />
                  <span className="fp-custom-cb"></span>Conference Papers
                </label>
                <label className="fp-cb-label">
                  <input type="checkbox" checked={pubTypes.preprint} onChange={(e) => setPubTypes(p => ({...p, preprint: e.target.checked}))} />
                  <span className="fp-custom-cb"></span>Preprints
                </label>
                <label className="fp-cb-label">
                  <input type="checkbox" checked={pubTypes.books} onChange={(e) => setPubTypes(p => ({...p, books: e.target.checked}))} />
                  <span className="fp-custom-cb"></span>Books & Chapters
                </label>
              </div>
            </div>
          </div>

          {/* Database */}
          <div className="fp-section">
            <button className="fp-trigger" aria-expanded={expanded.database} onClick={() => toggleAccordion('database')}>
              Database <span className="fp-chevron">▲</span>
            </button>
            <div className={`fp-content ${!expanded.database ? 'collapsed' : ''}`}>
              <div className="fp-hint-tag">Select internet as well for more sources</div>

              {/* Research Papers */}
              <div className="fp-toggle-row">
                <span className="fp-db-header-label">Research papers</span>
                <label className="fp-toggle-switch">
                  <input type="checkbox" checked={isPapersEnabled} onChange={(e) => {
                    if (toggleSource) toggleSource('papers');
                    else setDbMain(p => ({...p, researchPapers: e.target.checked}));
                  }} />
                  <span className="fp-toggle-track"><span className="fp-toggle-thumb"></span></span>
                </label>
              </div>
              {isPapersEnabled && (
                <div className="fp-internet-filter visible">
                  <div className="fp-checkbox-list">
                    <label className="fp-cb-label">
                      <input type="checkbox" checked={dbPapers.semanticScholar} onChange={(e) => setDbPapers(p => ({...p, semanticScholar: e.target.checked}))} />
                      <span className="fp-custom-cb"></span>📚 Semantic Scholar
                    </label>
                    <label className="fp-cb-label">
                      <input type="checkbox" checked={dbPapers.openAlex} onChange={(e) => setDbPapers(p => ({...p, openAlex: e.target.checked}))} />
                      <span className="fp-custom-cb"></span>🔬 OpenAlex
                    </label>
                    <label className="fp-cb-label">
                      <input type="checkbox" checked={dbPapers.pubmed} onChange={(e) => setDbPapers(p => ({...p, pubmed: e.target.checked}))} />
                      <span className="fp-custom-cb"></span>🧬 PubMed
                    </label>
                    <label className="fp-cb-label">
                      <input type="checkbox" checked={dbPapers.arxiv} onChange={(e) => setDbPapers(p => ({...p, arxiv: e.target.checked}))} />
                      <span className="fp-custom-cb"></span>📄 arXiv
                    </label>
                    <label className="fp-cb-label">
                      <input type="checkbox" checked={dbPapers.clinicalTrials} onChange={(e) => setDbPapers(p => ({...p, clinicalTrials: e.target.checked}))} />
                      <span className="fp-custom-cb"></span>🏥 ClinicalTrials.gov
                    </label>
                  </div>
                </div>
              )}

              {/* Web Searches */}
              <div className="fp-toggle-list">
                <div className="fp-toggle-row">
                  <span className="fp-toggle-label">Web Searches</span>
                  <label className="fp-toggle-switch">
                    <input type="checkbox" checked={isWebEnabled} onChange={(e) => {
                      if (toggleSource) toggleSource('web');
                      else setDbMain(p => ({...p, webSearches: e.target.checked}));
                    }} />
                    <span className="fp-toggle-track"><span className="fp-toggle-thumb"></span></span>
                  </label>
                </div>
                {isWebEnabled && (
                  <div className="fp-internet-filter visible">
                    <div className="fp-internet-filter-label">Internet Filter:</div>
                    <div className="fp-checkbox-list" style={{ padding: '10px 12px', background: '#f5f5f5', borderRadius: '8px' }}>
                      <label className="fp-cb-label">
                        <input type="checkbox" checked={dbWeb.all} onChange={() => handleWebFilterChange('all')} />
                        <span className="fp-custom-cb"></span>🌐 All websites
                      </label>
                      <label className="fp-cb-label">
                        <input type="checkbox" checked={dbWeb.gov} onChange={() => handleWebFilterChange('gov')} />
                        <span className="fp-custom-cb"></span>🏛 .gov (Government)
                      </label>
                      <label className="fp-cb-label">
                        <input type="checkbox" checked={dbWeb.edu} onChange={() => handleWebFilterChange('edu')} />
                        <span className="fp-custom-cb"></span>🎓 .edu (Education)
                      </label>
                    </div>
                  </div>
                )}

                <div className="fp-toggle-row">
                  <span className="fp-toggle-label">Patents</span>
                  <label className="fp-toggle-switch">
                    <input type="checkbox" checked={dbMain.patents} onChange={(e) => setDbMain(p => ({...p, patents: e.target.checked}))} />
                    <span className="fp-toggle-track"><span className="fp-toggle-thumb"></span></span>
                  </label>
                </div>
                <div className="fp-toggle-row">
                  <span className="fp-toggle-label">Medicare Coverage</span>
                  <label className="fp-toggle-switch">
                    <input type="checkbox" checked={dbMain.medicare} onChange={(e) => setDbMain(p => ({...p, medicare: e.target.checked}))} />
                    <span className="fp-toggle-track"><span className="fp-toggle-thumb"></span></span>
                  </label>
                </div>
                <div className="fp-toggle-row">
                  <span className="fp-toggle-label">My Library</span>
                  <label className="fp-toggle-switch">
                    <input type="checkbox" checked={dbMain.myLibrary} onChange={(e) => setDbMain(p => ({...p, myLibrary: e.target.checked}))} />
                    <span className="fp-toggle-track"><span className="fp-toggle-thumb"></span></span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Publication Date */}
          <div className="fp-section">
            <button className="fp-trigger" aria-expanded={expanded.dates} onClick={() => toggleAccordion('dates')}>
              Publication Date <span className="fp-chevron">▲</span>
            </button>
            <div className={`fp-content ${!expanded.dates ? 'collapsed' : ''}`}>
              <div className="fp-date-group">
                <div className="fp-date-field">
                  <label>Start Date:</label>
                  <input type="date" className="fp-date-input" value={dates.start} onChange={e => setDates(p => ({...p, start: e.target.value}))} />
                </div>
                <div className="fp-date-field">
                  <label>End Date:</label>
                  <input type="date" className="fp-date-input" value={dates.end} onChange={e => setDates(p => ({...p, end: e.target.value}))} />
                </div>
              </div>
            </div>
          </div>

        </div>

        <div className="filter-foot">
          <button className="btn-primary" onClick={handleApply} style={{ width: '100%', justifyContent: 'center' }}>Submit Search</button>
        </div>

      </div>
    </>
  );
}

export default FilterPanel;
