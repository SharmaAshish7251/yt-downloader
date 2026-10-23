import { spawn } from "node:child_process";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { createReadStream } from "node:fs";
import os from "node:os";
import path from "node:path";
import { Readable } from "node:stream";

export const runtime = "nodejs";

function runDownload(args, signal) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      /*turbopackIgnore: true*/
      process.env.PYTHON || "python",
      ["-m", "yt_dlp", "--js-runtimes", "node", ...args],
      { windowsHide: true, stdio: ["ignore", "ignore", "pipe"], signal },
    );
    let stderr = "";
    child.stderr.setEncoding("utf8");
    child.stderr.on("data", (chunk) => { stderr = (stderr + chunk).slice(-6000); });
    child.once("error", (error) => reject(new Error(`Could not run yt-dlp: ${error.message}`)));
    child.once("close", (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `yt-dlp exited with code ${code}`));
    });
  });
}

export async function GET(request) {
  const params = new URL(request.url).searchParams;
  const id = params.get("id");
  const mode = params.get("mode");
  const quality = params.get("q");
  const videoQualities = new Set(["1080", "720", "480", "360"]);
  const audioQualities = new Set(["320", "192", "128"]);

  if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) {
    return Response.json({ error: "Invalid YouTube video ID." }, { status: 400 });
  }
  if (mode !== "video" && mode !== "audio") {
    return Response.json({ error: "Choose video or audio format." }, { status: 400 });
  }
  if (!(mode === "video" ? videoQualities : audioQualities).has(quality)) {
    return Response.json({ error: "Unsupported quality selection." }, { status: 400 });
  }

  const tempDir = await mkdtemp(path.join(os.tmpdir(), "yt-downloader-"));
  const controller = new AbortController();
  const output = path.join(tempDir, "video.%(ext)s");
  const args = ["--no-playlist", "--no-warnings", "--no-progress", "--output", output];

  if (mode === "audio") {
    args.push("--extract-audio", "--audio-format", "mp3", "--audio-quality", `${quality}K`);
  } else {
    args.push(
      "--format",
      `bestvideo[height<=${quality}]+bestaudio/best[height<=${quality}]`,
      "--merge-output-format",
      "mp4",
    );
  }
  args.push(`https://www.youtube.com/watch?v=${id}`);

  request.signal.addEventListener("abort", () => controller.abort(), { once: true });
  try {
    await runDownload(args, controller.signal);
    const files = await readdir(tempDir);
    const file = files.find((name) => name.startsWith("video."));
    if (!file) throw new Error("yt-dlp finished without producing an output file.");

    const filePath = path.join(tempDir, file);
    const fileStream = createReadStream(filePath);
    fileStream.once("close", () => {
      rm(tempDir, { recursive: true, force: true }).catch((error) => {
        console.error("Could not remove temporary download folder:", error);
      });
    });
    const stream = Readable.toWeb(fileStream);
    const filename = `youtube-${id}.${mode === "audio" ? "mp3" : "mp4"}`;
    return new Response(stream, {
      headers: {
        "Content-Type": mode === "audio" ? "audio/mpeg" : "video/mp4",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    await rm(tempDir, { recursive: true, force: true });
    if (request.signal.aborted) return new Response(null, { status: 499 });
    return Response.json({ error: error.message }, { status: 500 });
  }
}
