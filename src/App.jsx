import React, { useState, useEffect, useRef } from 'react';
import { videoData } from './data.js';
import { SmartSearch } from './SmartSearch.jsx';
import './App.css';

const Icons = {
  L1: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /></svg>,
  L2: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>,
  L3: () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>
};

const ACCENT_COLORS = {
  L1: '#00BFFF',
  L2: '#FFBF00',
  L3: '#FF7F50'
};

// Tier Data
const TIER_INFO = {
  L1: {
    label: "The Basics",
    title: "Tier 1: Core - The Foundational Overview",
    description: "Understand your condition and your spine"
  },
  L2: {
    label: "How It Works",
    title: "Tier 2: Column - The Procedural Journey",
    description: "See how treatments and procedures are done"
  },
  L3: {
    label: "The Deep-Dive",
    title: "Tier 3: Neural - The Advanced Deep-Dive",
    description: "Get detailed explanations of your care options"
  }
};

// Helper function to extract YouTube Video ID
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

const SeriesRow = ({ series, videos, getEmbedUrl, setActiveVideo }) => {
  const trackRef = useRef(null);

  const scrollCarousel = (direction) => {
    if (trackRef.current) {
      const scrollAmount = 260 * direction;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="series-section">
      <h2 className="series-title">{series}</h2>
      <div className="series-carousel-wrapper">
        <button className="nav-arrow left" onClick={() => scrollCarousel(-1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
        </button>
        <div className="carousel-track" ref={trackRef}>
          {videos.map((video, idx) => {
            const videoId = getYouTubeId(video.youtube_embed_link);
            const fallbackThumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : video.thumbnail_link;
            const thumbnailUrl = video.thumbnail_link || fallbackThumb;

            if (!thumbnailUrl) return null;

            return (
              <div key={idx} className="carousel-card" onClick={() => setActiveVideo(video)}>
                <img src={thumbnailUrl} alt={video.video_title} className="carousel-image" />
                <div className="play-overlay-always">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </div>
                <div className="carousel-title-overlay">{video.video_title}</div>
              </div>
            );
          })}
        </div>
        <button className="nav-arrow right" onClick={() => scrollCarousel(1)}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
        </button>
      </div>
    </div>
  );
};

const DescriptionText = ({ text }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const maxLength = 200;

  if (!text) return <p className="video-description">Description pending...</p>;

  const textString = String(text);
  if (textString.length <= maxLength) {
    return <p className="video-description">{textString}</p>;
  }

  return (
    <div className="video-description">
      <span>
        {isExpanded ? textString : `${textString.slice(0, maxLength)}...`}
      </span>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="read-more-btn"
      >
        {isExpanded ? "Show less" : "Continue reading"}
      </button>
    </div>
  );
};

export default function App() {
  const [allVideos, setAllVideos] = useState(videoData);
  const [selectedLevel, setSelectedLevel] = useState('L1');
  const [loading, setLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeVideo, setActiveVideo] = useState(null);
  const [searchResults, setSearchResults] = useState(null);

  // Filter and SORT the base videos
  const filteredVideos = allVideos
    .filter(v => v.video_class === selectedLevel)
    .sort((a, b) => parseInt(a.VidID, 10) - parseInt(b.VidID, 10));

  const featuredVideo = filteredVideos[0] || allVideos[0];

  // Group videos by series
  const videosBySeries = filteredVideos.reduce((acc, video) => {
    let rawSeries = video.video_series && video.video_series.trim() !== '' ? video.video_series : "Featured";

    // Normalize string: trim ends, replace multiple spaces with single space
    let normalized = rawSeries.trim().replace(/\s+/g, ' ');
    // Apply Title Case for consistent beautiful display
    normalized = normalized.replace(/\w\S*/g, txt => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());

    // Check if an existing key matches case-insensitively (just in case Title Case logic isn't enough, e.g., 'and' vs 'And')
    const existingKey = Object.keys(acc).find(key => key.toLowerCase() === normalized.toLowerCase());
    const finalSeriesName = existingKey || normalized;

    if (!acc[finalSeriesName]) acc[finalSeriesName] = [];
    acc[finalSeriesName].push(video);
    return acc;
  }, {});

  const getEmbedUrl = (video) => {
    if (!video || !video.youtube_embed_link) return "";
    // Avoid appending autoplay=1, as it causes Playback ID errors in some browsers due to autoplay policies.
    const videoId = getYouTubeId(video.youtube_embed_link);
    return videoId ? `https://www.youtube.com/embed/${videoId}?rel=0` : video.youtube_embed_link;
  };

  const handleComplexitySwitch = (targetLevel) => {
    const nextVideo = allVideos.find(
      (v) => v.VidID === activeVideo.VidID && v.video_class === targetLevel
    );

    setSelectedLevel(targetLevel);

    if (nextVideo) {
      setActiveVideo(nextVideo);
    } else {
      const fallbackVideo = allVideos
        .filter((v) => v.video_class === targetLevel)
        .sort((a, b) => parseInt(a.VidID, 10) - parseInt(b.VidID, 10))[0];
      if (fallbackVideo) setActiveVideo(fallbackVideo);
    }
  };

  let nextVideosSequence = [];
  if (activeVideo) {
    const sameClassVideos = allVideos
      .filter(v => v.video_class === activeVideo.video_class)
      .sort((a, b) => parseInt(a.VidID, 10) - parseInt(b.VidID, 10));

    const currentIndex = sameClassVideos.findIndex(v => v.VidID === activeVideo.VidID);

    if (currentIndex !== -1) {
      const after = sameClassVideos.slice(currentIndex + 1);
      nextVideosSequence = [...after].slice(0, 4);
    }
  }

  const heroBackgroundStyle = {
    backgroundImage: `url('/src/assets/${selectedLevel}.jpg')`,
    backgroundPosition: 'center',
    backgroundSize: 'cover',
    backgroundRepeat: 'no-repeat'
  };

  return (
    <div className="app-layout" style={{ '--active-accent': ACCENT_COLORS[selectedLevel] }}>
      <aside className="sidebar">
        <div className="sidebar-brand" onClick={() => window.location.href = 'https://mdus.ai'}>
          <img src="Logo_Large_White.png" alt="Spine Library" className="brand-logo-img" />
        </div>
        <nav className="sidebar-menu">
          <button className={`sidebar-item ${selectedLevel === 'L1' ? 'active' : ''}`} onClick={() => setSelectedLevel('L1')}>
            <span className="sidebar-icon" style={{ color: ACCENT_COLORS['L1'] }}><Icons.L1 /></span>
            <span className="sidebar-text">The Basics</span>
          </button>
          <button className={`sidebar-item ${selectedLevel === 'L2' ? 'active' : ''}`} onClick={() => setSelectedLevel('L2')}>
            <span className="sidebar-icon" style={{ color: ACCENT_COLORS['L2'] }}><Icons.L2 /></span>
            <span className="sidebar-text">How It Works</span>
          </button>
          <button className={`sidebar-item ${selectedLevel === 'L3' ? 'active' : ''}`} onClick={() => setSelectedLevel('L3')}>
            <span className="sidebar-icon" style={{ color: ACCENT_COLORS['L3'] }}><Icons.L3 /></span>
            <span className="sidebar-text">The Deep-Dive</span>
          </button>
        </nav>
      </aside>

      <div className="main-content">
        <div className="top-bar" style={{ padding: '20px 40px', position: 'absolute', top: 0, right: 0, zIndex: 10, width: '100%', display: 'flex', justifyContent: 'flex-end', boxSizing: 'border-box' }}>
          <SmartSearch 
            onSearchStart={() => setIsSearching(true)}
            onSearchResults={(results) => {
              setSearchResults(results);
              setIsSearching(false);
            }} 
            onClearSearch={() => {
              setSearchResults(null);
              setIsSearching(false);
            }} 
          />
        </div>
        
        {!searchResults && !isSearching && (
          <header className="hero-section">
            <div className="hero-background" style={heroBackgroundStyle}></div>
          <div className="hero-overlay"></div>
          <div className="hero-content">
            <h1 className="hero-title">Spine library</h1>
            <p className="hero-description">{TIER_INFO[selectedLevel].description}</p>

            <button onClick={() => setActiveVideo(featuredVideo)} className="watch-now-btn">
              <span className="btn-text">PLAY</span>
              <div className="play-icon-circle">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
              </div>
            </button>
          </div>
        </header>
        )}

        <main className="series-container">
          {isSearching ? (
            <div className="search-results-section">
              <h2 className="series-title" style={{ marginTop: '60px' }}>Analyzing your query...</h2>
              <div className="skeleton-container">
                {[1, 2].map(i => (
                  <div key={i} className="skeleton-row">
                    <div className="skeleton-title" style={{ width: '150px' }}></div>
                    <div className="skeleton-cards">
                      {[1, 2, 3, 4].map(j => (
                        <div key={j} className="skeleton-card"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : searchResults ? (
            <div className="search-results-section">
              <h2 className="series-title" style={{ marginTop: '60px' }}>Search Results</h2>
              {searchResults.length === 0 ? (
                <p style={{ color: 'white' }}>No videos found for your search.</p>
              ) : (
                <div className="search-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '20px' }}>
                  {searchResults.map((video, idx) => {
                    const videoId = getYouTubeId(video.youtube_embed_link);
                    const fallbackThumb = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : video.thumbnail_link;
                    const thumbnailUrl = video.thumbnail_link || fallbackThumb;

                    return (
                      <div key={idx} className="carousel-card" onClick={() => setActiveVideo(video)}>
                        <img src={thumbnailUrl} alt={video.video_title} className="carousel-image" />
                        <div className="play-overlay-always">
                          <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                        </div>
                        <div className="carousel-title-overlay">{video.video_title} <span style={{fontSize: '0.8em', opacity: 0.8}}>({video.video_class})</span></div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : loading ? (
            <div className="skeleton-container">
              {[1, 2].map(i => (
                <div key={i} className="skeleton-row">
                  <div className="skeleton-title"></div>
                  <div className="skeleton-cards">
                    {[1, 2, 3, 4].map(j => (
                      <div key={j} className="skeleton-card"></div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            Object.entries(videosBySeries).map(([series, videos]) => (
              <SeriesRow
                key={series}
                series={series}
                videos={videos}
                getEmbedUrl={getEmbedUrl}
                setActiveVideo={setActiveVideo}
              />
            ))
          )}
        </main>

        <footer className="main-footer">
          <a href="https://mdus.ai/terms-of-use" target="_blank" rel="noopener noreferrer">Terms of Use</a>
          <a href="https://mdus.ai/privacy-policy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
        </footer>

        {/* Modal Overlay */}
        {activeVideo && (
          <div className="video-modal-overlay" onClick={() => setActiveVideo(null)}>
            <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="close-modal-btn" onClick={() => setActiveVideo(null)}>✕</button>
              <div className="modal-layout">

                <div className="video-player-container">
                  <iframe
                    src={getEmbedUrl(activeVideo)}
                    className="video-iframe"
                    title="YouTube video player"
                    frameBorder="0"
                    allowFullScreen
                    referrerPolicy="strict-origin-when-cross-origin"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  ></iframe>
                </div>

                <div className="video-info-panel">
                  <div className="badge-container">
                    <span className="vetted-badge">✔ Physician Vetted</span>
                  </div>
                  <h2 className="video-title">{activeVideo.video_title}</h2>
                  <DescriptionText text={activeVideo.Description} />

                  <div className="complexity-switcher">
                    <p>Switch Complexity:</p>
                    <div className="switch-buttons">
                      {Object.keys(TIER_INFO).filter(k => k !== activeVideo.video_class).map(k => (
                        <button
                          key={k}
                          onClick={() => handleComplexitySwitch(k)}
                          className="mini-tier-btn"
                          style={{ borderColor: ACCENT_COLORS[k], color: ACCENT_COLORS[k] }}
                        >
                          Watch {TIER_INFO[k]?.label} Version
                        </button>
                      ))}
                    </div>
                  </div>

                  {nextVideosSequence.length > 0 && (
                    <div className="next-videos-section">
                      <h3>Up Next in {TIER_INFO[activeVideo.video_class]?.label}</h3>
                      <div className="next-videos-grid">
                        {nextVideosSequence.map((vid, idx) => {
                          const vId = getYouTubeId(vid.youtube_embed_link);
                          const fallbackThumb = vId ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : vid.thumbnail_link;
                          const tUrl = vid.thumbnail_link || fallbackThumb;

                          return (
                            <div key={idx} className="next-card" onClick={() => setActiveVideo(vid)}>
                              <img src={tUrl} alt={vid.video_title} className="next-thumb" />
                              <div className="next-info">
                                <p className="next-title">{vid.video_title}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}