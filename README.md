# YT Downloader

A local-only Next.js app for saving YouTube videos you own or have permission to download. It uses `yt-dlp` and FFmpeg on your computer; downloads are not sent through a third-party downloader service.

## Windows setup

1. Install Node.js and Python.
2. Install FFmpeg and make sure `ffmpeg` is available on your `PATH`.
3. Install yt-dlp:

   ```powershell
   py -m pip install yt-dlp
   ```

4. Run `npm install`, then `npm run dev` (or double-click `start.bat`), and open <http://127.0.0.1:3000>.

## Deployment (Railway, Render, Fly.io, or VPS)

This app requires Python, `yt-dlp`, and FFmpeg. Because serverless hosts (like Vercel) lack these binaries and enforce short execution timeouts, the app is containerized with Docker for deployment to container-friendly platforms:

### Option A: Railway / Render (Zero-config)
1. Push your code to a GitHub repository.
2. In [Railway](https://railway.app) or [Render](https://render.com), create a new **Web Service** from your GitHub repo.
3. The platform will automatically detect the [`Dockerfile`](file:///c:/Users/Linux/Desktop/Rewrite/YT%20Downloader/Dockerfile) and build the application with Python, `yt-dlp`, and FFmpeg included.

### Option B: Docker / Docker Compose (Local or VPS)
Build and run the containerized app:

```bash
docker compose up --build -d
```
Then visit <http://localhost:3000>.

The UI uses the Next.js App Router and React. Metadata and download processing are implemented as local API routes. Temporary download files are removed after transfer. Downloads depend on the video's availability, your permissions, and YouTube's terms.
