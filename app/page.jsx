"use client";

import { useEffect, useState } from "react";

const videoQualities = [
  { label: "1080p", quality: "1080", note: "Up to Full HD · MP4" },
  { label: "720p", quality: "720", note: "Up to HD · MP4" },
  { label: "480p", quality: "480", note: "Up to SD · MP4" },
  { label: "360p", quality: "360", note: "Up to 360p · MP4" },
];

const audioQualities = [
  { label: "MP3 320kbps", quality: "320", note: "Best available quality" },
  { label: "MP3 192kbps", quality: "192", note: "Standard" },
  { label: "MP3 128kbps", quality: "128", note: "Smaller file" },
];

function extractId(input) {
  try {
    const url = new URL(input.trim());
    const host = url.hostname.toLowerCase();
    if (
      host !== "youtu.be" &&
      host !== "youtube.com" &&
      !host.endsWith(".youtube.com")
    ) {
      return null;
    }
    const id =
      host === "youtu.be"
        ? url.pathname.slice(1).split("/")[0]
        : url.searchParams.get("v") ||
          url.pathname.match(/^\/(?:shorts|embed)\/([A-Za-z0-9_-]{11})(?:\/|$)/)?.[1];
    return id && /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds)) return "YouTube";
  return `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;
}

export default function Home() {
  const [url, setUrl] = useState("");
  const [videoId, setVideoId] = useState("");
  const [metadata, setMetadata] = useState(null);
  const [mode, setMode] = useState("video");
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("");
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);

  async function loadVideo(value) {
    const id = extractId(value);
    if (!id) {
      setStatus("Enter a valid YouTube video link.");
      setStatusType("error");
      return;
    }

    setUrl(value);
    setVideoId(id);
    setMetadata(null);
    setLoading(true);
    setStatus("");
    setStatusType("");
    try {
      const response = await fetch(`/api/metadata?id=${encodeURIComponent(id)}`);
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Could not load video details.");
      setMetadata(body);
    } catch (error) {
      setStatus(error.message);
      setStatusType("error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const initial = params.get("url") || params.get("v");
    const value = initial
      ? initial.includes("http")
        ? initial
        : `https://www.youtube.com/watch?v=${initial}`
      : "https://www.youtube.com/watch?v=UTDsY01Mfjw";
    setUrl(value);
    loadVideo(value);
  }, []);

  async function pasteLink() {
    try {
      const value = await navigator.clipboard.readText();
      if (value) {
        setUrl(value);
        loadVideo(value);
      }
    } catch {
      setStatus("Clipboard access is unavailable. Paste the link into the field.");
      setStatusType("error");
    }
  }

  async function download(quality) {
    setDownloading(quality);
    setStatus("Preparing your file…");
    setStatusType("");
    try {
      const response = await fetch(
        `/api/download?id=${encodeURIComponent(videoId)}&q=${encodeURIComponent(quality)}&mode=${mode}`,
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error || `Download failed (${response.status}).`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      const filename = (metadata?.title || videoId)
        .replace(/[\\/:*?"<>|]+/g, "_")
        .slice(0, 90);
      anchor.href = objectUrl;
      anchor.download = `${filename}.${mode === "audio" ? "mp3" : "mp4"}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
      setStatus("Download started.");
      setStatusType("success");
    } catch (error) {
      setStatus(error.message);
      setStatusType("error");
    } finally {
      setDownloading("");
    }
  }

  const qualities = mode === "video" ? videoQualities : audioQualities;

  return (
    <main className="app-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <header className="topbar">
        <a className="brand" href="/" aria-label="YT Downloader home">
          <span className="brand-mark">▶</span>
          <span>YT<span className="brand-light">Downloader</span></span>
        </a>
        <div className="topbar-actions">
          <span className="local-tag"><span /> Runs on this device</span>
          <button className="text-button" onClick={() => setHowOpen((open) => !open)}>
            {howOpen ? "Close guide" : "How it works"}
          </button>
        </div>
      </header>

      <section className="hero">
        <div className="eyebrow"><span className="eyebrow-line" /> YOUR MEDIA, YOUR MACHINE</div>
        <h1>Bring a video<br />closer to <span>home.</span></h1>
        <p className="hero-copy">
          Save videos you own or have permission to download. Processing stays on
          your computer.
        </p>
        <form
          className="url-form"
          onSubmit={(event) => {
            event.preventDefault();
            loadVideo(url);
          }}
        >
          <span className="link-icon" aria-hidden="true">↗</span>
          <input
            aria-label="YouTube URL"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="Paste a YouTube link"
            spellCheck="false"
          />
          <button className="paste-button" type="button" onClick={pasteLink} aria-label="Paste from clipboard">
            Paste
          </button>
          <button className="submit-button" type="submit" disabled={loading}>
            {loading ? "Loading…" : "Load video"} <span aria-hidden="true">↗</span>
          </button>
        </form>
        <div className="form-foot">
          <span>youtube.com · youtu.be · Shorts</span>
          <span>MP4 video / MP3 audio</span>
        </div>
      </section>

      <section className={`result-card${videoId ? " is-visible" : ""}`} aria-live="polite">
        <div className="video-preview">
          {videoId && (
            <img
              src={metadata?.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
              alt=""
            />
          )}
          {metadata?.duration != null && (
            <span className="duration-badge">{formatDuration(metadata.duration)}</span>
          )}
          <button
            className="preview-button"
            onClick={() => setPreviewOpen(true)}
            disabled={!videoId}
          >
            <span>▶</span> Preview
          </button>
        </div>
        <div className="video-details">
          <div className="video-source">{metadata?.author || (loading ? "FETCHING VIDEO DETAILS" : "VIDEO DETAILS")}</div>
          <h2>{metadata?.title || (loading ? "Finding your video…" : "Paste a link to get started")}</h2>
          <p className="video-description">
            {metadata?.description || "Choose a format and quality. The file is prepared locally with yt-dlp and FFmpeg."}
          </p>

          <div className="format-switch" role="tablist" aria-label="Download format">
            <button
              role="tab"
              aria-selected={mode === "video"}
              className={mode === "video" ? "selected" : ""}
              onClick={() => setMode("video")}
            >
              Video <span>MP4</span>
            </button>
            <button
              role="tab"
              aria-selected={mode === "audio"}
              className={mode === "audio" ? "selected" : ""}
              onClick={() => setMode("audio")}
            >
              Audio <span>MP3</span>
            </button>
          </div>

          <div className="quality-list">
            {qualities.map((item) => (
              <div className="quality-row" key={item.quality}>
                <div><strong>{item.label}</strong><span>{item.note}</span></div>
                <button
                  className="download-button"
                  onClick={() => download(item.quality)}
                  disabled={!videoId || loading || Boolean(downloading)}
                >
                  {downloading === item.quality ? "Preparing…" : "Download"}
                </button>
              </div>
            ))}
          </div>
          {status && <p className={`status-message ${statusType}`}>{status}</p>}
        </div>
      </section>

      {howOpen && (
        <section className="guide-panel">
          <div><span>PASTE</span><p>Use a YouTube link you have permission to save.</p></div>
          <div><span>CHOOSE</span><p>Select video or audio, then choose a quality.</p></div>
          <div><span>SAVE</span><p>yt-dlp prepares the file on this computer.</p></div>
          <p className="legal-note">Respect copyright and YouTube’s terms. Only download content you own or are authorized to save.</p>
        </section>
      )}

      <footer className="page-footer">
        <span>LOCAL TOOL / NO THIRD-PARTY DOWNLOAD SERVICE</span>
        <span>Requires Node.js, Python, yt-dlp & FFmpeg</span>
      </footer>

      {previewOpen && videoId && (
        <div className="modal-backdrop" role="presentation" onClick={() => setPreviewOpen(false)}>
          <div className="preview-modal" role="dialog" aria-modal="true" aria-label="Video preview" onClick={(event) => event.stopPropagation()}>
            <button className="modal-close" onClick={() => setPreviewOpen(false)} aria-label="Close preview">×</button>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
              title="YouTube video preview"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </main>
  );
}
