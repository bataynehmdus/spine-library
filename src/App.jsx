import React, { useState, useEffect } from 'react';
import Papa from 'papaparse';
import './App.css';

const SHEET_URL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vSTkz6c9GnRDR3j3gj0RV52we5G_WKn6znBTwZPpbB19zas1xQeiSCEvq4fSnylHdtjLKyS7GxnlzLt/pub?gid=0&single=true&output=csv";

const extractDriveId = (url) => {
  if (!url) return null;
  const match = url.match(/(?:file\/d\/|id=|\/d\/)([\w-]+)/);
  return match ? match[1] : null;
};

const getDirectDriveThumbnail = (url) => {
  const id = extractDriveId(url);
  return id ? `https://drive.google.com/thumbnail?id=${id}&sz=w1000` : url;
};

const fetchFromGoogleSheet = () => {
  return new Promise((resolve, reject) => {
    Papa.parse(SHEET_URL, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        reject(error);
      }
    });
  });
};

const getDriveEmbedUrl = (url) => {
  const id = extractDriveId(url);
  return id ? `https://drive.google.com/file/d/${id}/preview` : url;
};

const normalizeData = (row, index) => {
  const rawVideoUrl = row['video_link'] || row['youtube_link'] || "#";
  return {
    id: index.toString(),
    title: row['video_title'] || "Untitled Episode",
    libraryTitle: row['video_series'] || "MDus.ai Library",
    level: row['video_class'] || "General",
    videoUrl: getDriveEmbedUrl(rawVideoUrl),
    thumbnailUrl: getDirectDriveThumbnail(row['thumbnail_link']) || "https://via.placeholder.com/300x170/1a1a1a/ffffff?text=No+Thumbnail",
    description: row['Description'] || "No description available for this episode.",
    mainText: row['Thumbnail Text'] || "Spine library",
    subText: "Explore the library"
  };
};

export default function App() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const rawData = await fetchFromGoogleSheet();
        const safeData = rawData
          .map((row, index) => normalizeData(row, index))
          .filter(v => v.title !== "Untitled Episode" && v.title !== "");

        setVideos(safeData);
      } catch (error) {
        console.error("Failed to load sheet data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    if (activeVideoUrl) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [activeVideoUrl]);

  if (loading) {
    return <div className="loading-screen">Loading Library...</div>;
  }

  if (!videos.length) {
    return <div className="error-screen">No videos found. Please check your data source.</div>;
  }

  const featuredVideo = videos[0];

  const handlePlayVideo = (e, url) => {
    e.preventDefault();
    setActiveVideoUrl(url);
  };

  return (
    <div className="app-container">
      {/* HERO SECTION */}
      <header className="hero-section">
        <div className="hero-background"></div>
        <div className="hero-overlay"></div>

        <div className="hero-content">
          <div className="brand-header">
            {/* Replace the src below with the path to your actual logo (e.g., src={myLogo} if imported) */}
            <img src="https://via.placeholder.com/40" alt="Logo Placeholder" className="brand-logo-img" />
            <span className="brand-name">Mdus.Ai Library</span>
          </div>

          <h1 className="hero-title">Spine library</h1>
          <p className="hero-description">Simple, short, and kid-friendly videos that explain scoliosis in an accessible way.
             These low-complexity episodes use fun 3D visuals and clear examples to help kids and families understand what the Spine is,
              how doctors check it, and what it means for growing spines.</p>

          <a href="#" onClick={(e) => handlePlayVideo(e, featuredVideo.videoUrl)} className="watch-now-btn">
            <span className="btn-text">WATCH NOW</span>
            <div className="play-icon-circle">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </a>
        </div>
      </header>

      {/* INFINITE SCROLL CAROUSEL SECTION */}
      <main className="carousel-section">
        <div className="marquee-wrapper">
<div className="marquee-track">
            {/* We create 10 identical grids to ensure it fills any screen size seamlessly */}
            {[...Array(10)].map((_, gridIndex) => (
              <div className="video-grid" key={`grid-${gridIndex}`}>
                {videos.map((video) => (
                  <a 
                    href="#" 
                    onClick={(e) => handlePlayVideo(e, video.videoUrl)} 
                    key={`grid${gridIndex}-${video.id}`} 
                    className="carousel-card"
                  >
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title} 
                      className="carousel-image" 
                      onError={(e) => { e.target.src = "https://via.placeholder.com/300x170/1a1a1a/ffffff?text=Image+Error" }} 
                    />
                    <div className="play-overlay-always">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                    </div>
                  </a>
                ))}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* VIDEO PLAYER MODAL */}
      {activeVideoUrl && (
        <div className="video-modal-overlay" onClick={() => setActiveVideoUrl(null)}>
          <div className="video-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setActiveVideoUrl(null)}>✕</button>
            <iframe src={activeVideoUrl} className="video-iframe" allow="autoplay; fullscreen" title="Video Player"></iframe>
          </div>
        </div>
      )}
    </div>
  );
}