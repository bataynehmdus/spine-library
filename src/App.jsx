import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSTkz6c9GnRDR3j3gj0RV52we5G_WKn6znBTwZPpbB19zas1xQeiSCEvq4fSnylHdtjLKyS7GxnlzLt/pub?gid=0&single=true&output=csv";

// Tier Data
const TIER_INFO = {
  L1: {
    label: "The Basics (L1)",
    title: "Tier 1: Core (L1) - The Foundational Overview",
    description: "This tier provides a foundational understanding of spinal health and common conditions. Using accessible, non-medical language and clear visual metaphors, these videos focus on reducing anxiety."
  },
  L2: {
    label: "The Mechanics (L2)",
    title: "Tier 2: Column (L2) - The Procedural Journey",
    description: "This level transitions into the 'how' and 'why' of spinal mechanics and interventions. It provides a more structured exploration of anatomy and the logical steps of a treatment plan."
  },
  L3: {
    label: "The Deep-Dive (L3)",
    title: "Tier 3: Neural (L3) - The Advanced Deep-Dive",
    description: "Our most technical tier, dedicated to the intricate complexities of spinal medicine. These videos explore biomechanical principles, surgical nuances, and specific clinical outcomes."
  }
};

// Helper function to extract YouTube Video ID
const getYouTubeId = (url) => {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

export default function App() {
  const [allVideos, setAllVideos] = useState([]);
  const [selectedLevel, setSelectedLevel] = useState('L1'); // Default to L1
  const [loading, setLoading] = useState(true);
  const [activeVideo, setActiveVideo] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await fetch(SHEET_URL);
        const reader = response.body.getReader();
        const result = await reader.read();
        const decoder = new TextDecoder('utf-8');
        const csv = decoder.decode(result.value);
        
        Papa.parse(csv, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            setAllVideos(results.data);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error("Error loading data:", error);
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Filter and SORT the carousel videos based on the new VidID order
  const filteredVideos = allVideos
    .filter(v => v.video_class === selectedLevel)
    .sort((a, b) => parseInt(a.VidID, 10) - parseInt(b.VidID, 10));
    
  const featuredVideo = filteredVideos[0] || allVideos[0];
  const repeatedVideos = Array(30).fill(filteredVideos).flat();

  // Generate iframe embed URL for active video
  const getEmbedUrl = (video) => {
    if (!video || !video.youtube_link) return "";
    const videoId = getYouTubeId(video.youtube_link);
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : video.youtube_link;
  };

  // --- UPDATED LOGIC: Switch Complexity via VidID ---
  const handleComplexitySwitch = (targetLevel) => {
    // Find the exact video match using VidID for the target level
    const nextVideo = allVideos.find(
      (v) => v.VidID === activeVideo.VidID && v.video_class === targetLevel
    );

    setSelectedLevel(targetLevel); // Update the background carousel

    if (nextVideo) {
      setActiveVideo(nextVideo);
    } else {
      // Fallback if the video doesn't have that specific tier yet
      const fallbackVideo = allVideos
        .filter((v) => v.video_class === targetLevel)
        .sort((a, b) => parseInt(a.VidID, 10) - parseInt(b.VidID, 10))[0];
      if (fallbackVideo) setActiveVideo(fallbackVideo);
    }
  };

  // --- UPDATED LOGIC: Next Videos in Sequence (Wraparound) ---
  let nextVideosSequence = [];
  if (activeVideo) {
    // 1. Get all videos in the current class, sorted correctly by VidID
    const sameClassVideos = allVideos
      .filter(v => v.video_class === activeVideo.video_class)
      .sort((a, b) => parseInt(a.VidID, 10) - parseInt(b.VidID, 10));

    // 2. Find where the current video sits in that ordered list
    const currentIndex = sameClassVideos.findIndex(v => v.VidID === activeVideo.VidID);
    
    if (currentIndex !== -1) {
      // 3. Slice the array to get the videos *after* the current one
      const after = sameClassVideos.slice(currentIndex + 1);
      // 4. Slice the array to get the videos *before* the current one (to loop back around)
      // const before = sameClassVideos.slice(0, currentIndex);
      
      // Combine them so it smoothly plays in order and grabs the next 4
      nextVideosSequence = [...after].slice(0, 4);
    }
  }

  return (
    <div className="app-container">
      {/* Top Menu */}
      <nav className="top-menu">
        <span>Home &gt; Video Library &gt; </span>
        <span className={selectedLevel === 'L1' ? 'active' : ''} onClick={() => setSelectedLevel('L1')}>The Basics (L1)</span> &gt;
        <span className={selectedLevel === 'L2' ? 'active' : ''} onClick={() => setSelectedLevel('L2')}>The Mechanics (L2)</span> &gt;
        <span className={selectedLevel === 'L3' ? 'active' : ''} onClick={() => setSelectedLevel('L3')}>The Deep-Dive (L3)</span>
      </nav>

      <header className="hero-section">
        <div className="hero-background"></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="brand-header">
            <img src="https://via.placeholder.com/40" alt="Logo" className="brand-logo-img" />
          </div>

          <h1 className="hero-title">Spine library</h1>
          <p className="hero-description">{TIER_INFO[selectedLevel].description}</p>

          <div className="level-selection-zone">
            <p className="selection-hint">Select your depth: from 2-minute overviews to surgical deep-dives.</p>
            <div className="tier-buttons">
              {Object.keys(TIER_INFO).map(key => (
                <button 
                  key={key} 
                  className={`tier-btn ${selectedLevel === key ? 'active' : ''}`}
                  onClick={() => setSelectedLevel(key)}
                >
                  {TIER_INFO[key].label}
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => setActiveVideo(featuredVideo)} className="watch-now-btn">
            <span className="btn-text">PLAY</span> 
            <div className="play-icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
            </div>
          </button>
        </div>
      </header>

      <main className="carousel-section">
        <div className="marquee-track video-grid">
          {repeatedVideos.map((video, idx) => {
            const videoId = getYouTubeId(video.youtube_link);
            const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : video.thumbnail_link;

            return (
              <div key={idx} className="carousel-card" onClick={() => setActiveVideo(video)}>
                <img src={thumbnailUrl} alt={video.video_title} className="carousel-image" />
                <div className="play-overlay-always">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
            );
          })}
        </div>
      </main>

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
                  allowFullScreen
                  allow="autoplay; encrypted-media"
                ></iframe>
              </div>

              <div className="video-info-panel">
                <div className="badge-container">
                  <span className="vetted-badge">✔ Physician Vetted</span>
                </div>
                <h2 className="video-title">{activeVideo.video_title}</h2>
                <p>{activeVideo.Description || "Description pending..."}</p>
                
                <div className="complexity-switcher">
                  <p>Switch Complexity:</p>
                  <div className="switch-buttons">
                    {Object.keys(TIER_INFO).filter(k => k !== activeVideo.video_class).map(k => (
                      <button 
                        key={k} 
                        onClick={() => handleComplexitySwitch(k)} 
                        className="mini-tier-btn"
                      >
                        Watch {k} Version
                      </button>
                    ))}
                  </div>
                </div>

                {/* Up Next Grid relying on continuous VidID looping */}
                {nextVideosSequence.length > 0 && (
                  <div className="next-videos-section">
                    <h3>Up Next in {TIER_INFO[activeVideo.video_class]?.label}</h3>
                    <div className="next-videos-grid">
                      {nextVideosSequence.map((vid, idx) => {
                        const vId = getYouTubeId(vid.youtube_link);
                        const tUrl = vId ? `https://img.youtube.com/vi/${vId}/hqdefault.jpg` : vid.thumbnail_link;
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
  );
}