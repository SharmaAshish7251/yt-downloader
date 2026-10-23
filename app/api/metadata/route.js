import { spawn } from "node:child_process";

export const runtime = "nodejs";

function runYtDlp(args) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      /*turbopackIgnore: true*/
      process.env.PYTHON || "python",
      ["-m", "yt_dlp", "--js-runtimes", "node", ...args],
      { windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
    );
    let stdout = "";
    let stderr = "";
    child.stdout.setEncoding("utf8");
    child.stdout.on("data", (chunk) => { stdout += chunk; });
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-6000); });
    child.once("error", (error) => reject(new Error(`Could not start yt-dlp: ${error.message}`)));
    child.once("close", (code) => {
      if (code === 0) resolve(stdout.trim());
      else reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
    });
  });
}

export async function GET(request) {
  const id = new URL(request.url).searchParams.get("id");
  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
    return Response.json({ error: "Invalid YouTube video ID." }, { status: 400 });
  }

  try {
    const output = await runYtDlp([
      "--dump-single-json",
      "--skip-download",
      "--no-playlist",
      `https://www.youtube.com/watch?v=${id}`,
    ]);
    const info = JSON.parse(output);
    return Response.json({
      title: info.title || `YouTube video ${id}`,
      author: info.uploader || info.channel || "YouTube",
      duration: info.duration || null,
      views: info.view_count || null,
      description: (info.description || "").slice(0, 500),
      thumbnail: info.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
    });
  } catch (error) {
    return Response.json(
      { error: `Could not fetch video details: ${error.message}` },
      { status: 502 },
    );
  }
}
