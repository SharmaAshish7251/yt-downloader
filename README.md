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

The UI uses the Next.js App Router and React. Metadata and download processing are implemented as local API routes. The development server binds to localhost only and temporary download files are removed after transfer. Downloads depend on the video's availability, your permissions, and YouTube's terms.
