// commands/downloader.js

import { unlinkSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { execFile } from "child_process";
import { promisify } from "util";
import ffmpegStatic from "ffmpeg-static";

const execFileAsync = promisify(execFile);
const FFMPEG = ffmpegStatic;
const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = join(__dirname, "../temp");
const YTDLP = join(__dirname, "../assets/yt-dlp.exe");

if (!existsSync(TEMP_DIR)) mkdirSync(TEMP_DIR, { recursive: true });

// ── Helper ──
async function downloadToBuffer(url) {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);
  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

function isValidUrl(str) {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

// ── Commands ──
const downloader = {
  // ────────────────────────────────
  // !ytmp3
  // ────────────────────────────────
  ytmp3: async (sock, from, args) => {
    const url = args[0];
    if (!url || !isValidUrl(url)) {
      await sock.sendMessage(from, {
        text: `🎵 *!ytmp3 [url]*\nContoh: \`!ytmp3 https://youtu.be/xxx\``,
      });
      return;
    }

    await sock.sendMessage(from, { text: "⏳ Mengunduh audio YouTube..." });

    const outPath = join(TEMP_DIR, `ytmp3_${Date.now()}.mp3`);

    try {
      await execFileAsync(YTDLP, [
        "-x",
        "--audio-format",
        "mp3",
        "--audio-quality",
        "0",
        "--ffmpeg-location",
        FFMPEG, // ← tambah ini
        "-o",
        outPath,
        "--no-playlist",
        url,
      ]);

      const buffer = readFileSync(outPath);

      await sock.sendMessage(from, {
        audio: buffer,
        mimetype: "audio/mp4",
        ptt: false,
      });
    } catch (e) {
      console.error("[YTMP3] error:", e.message);
      await sock.sendMessage(from, {
        text: `❌ Gagal download audio: ${e.message}`,
      });
    } finally {
      if (existsSync(outPath)) unlinkSync(outPath);
    }
  },

  // ────────────────────────────────
  // !ytmp4
  // ────────────────────────────────
  ytmp4: async (sock, from, args) => {
    const url = args[0];
    if (!url || !isValidUrl(url)) {
      await sock.sendMessage(from, {
        text: `🎬 *!ytmp4 [url]*\nContoh: \`!ytmp4 https://youtu.be/xxx\``,
      });
      return;
    }

    await sock.sendMessage(from, { text: "⏳ Mengunduh video YouTube..." });

    const outPath = join(TEMP_DIR, `ytmp4_${Date.now()}.mp4`);

    try {
      await execFileAsync(YTDLP, [
        "-f",
        "best[ext=mp4]/best",
        "--ffmpeg-location",
        FFMPEG, // ← tambah ini
        "-o",
        outPath,
        "--no-playlist",
        url,
      ]);

      const buffer = readFileSync(outPath);

      await sock.sendMessage(from, {
        video: buffer,
        mimetype: "video/mp4",
        caption: "🎬 Video dari YouTube",
      });
    } catch (e) {
      console.error("[YTMP4] error:", e.message);
      await sock.sendMessage(from, {
        text: `❌ Gagal download video: ${e.message}`,
      });
    } finally {
      if (existsSync(outPath)) unlinkSync(outPath);
    }
  },

  // ────────────────────────────────
  // !tiktok
  // ────────────────────────────────
  tiktok: async (sock, from, args) => {
    const url = args[0];
    if (!url || !isValidUrl(url)) {
      await sock.sendMessage(from, {
        text: `🎵 *!tiktok [url]*\nContoh: \`!tiktok https://vt.tiktok.com/xxx\``,
      });
      return;
    }

    await sock.sendMessage(from, { text: "⏳ Mengunduh video TikTok..." });

    const outPath = join(TEMP_DIR, `tiktok_${Date.now()}.mp4`);

    try {
      await execFileAsync(YTDLP, [
        "-f",
        "best[ext=mp4]/best",
        "--ffmpeg-location",
        FFMPEG,
        "--no-playlist",
        "-o",
        outPath,
        url,
      ]);

      const buffer = readFileSync(outPath);

      await sock.sendMessage(from, {
        video: buffer,
        mimetype: "video/mp4",
        caption: "🎵 Video TikTok tanpa watermark",
      });
    } catch (e) {
      console.error("[TIKTOK] error:", e.message);
      await sock.sendMessage(from, {
        text: `❌ Gagal download TikTok: ${e.message}`,
      });
    } finally {
      if (existsSync(outPath)) unlinkSync(outPath);
    }
  },

  // ────────────────────────────────
  // !igdl
  // ────────────────────────────────
  igdl: async (sock, from, args) => {
    const url = args[0];
    if (!url || !isValidUrl(url)) {
      await sock.sendMessage(from, {
        text: `📸 *!igdl [url]*\nContoh: \`!igdl https://www.instagram.com/p/xxx\``,
      });
      return;
    }

    await sock.sendMessage(from, { text: "⏳ Mengunduh dari Instagram..." });

    const outPath = join(TEMP_DIR, `igdl_${Date.now()}.mp4`);
    const outPathImg = join(TEMP_DIR, `igdl_${Date.now()}.jpg`);

    try {
      // Coba download sebagai video dulu
      await execFileAsync(YTDLP, [
        "-f",
        "best[ext=mp4]/best",
        "--ffmpeg-location",
        FFMPEG,
        "--no-playlist",
        "-o",
        outPath,
        url,
      ]);

      if (existsSync(outPath)) {
        const buffer = readFileSync(outPath);
        await sock.sendMessage(from, {
          video: buffer,
          mimetype: "video/mp4",
          caption: "📸 Video dari Instagram",
        });
      }
    } catch {
      // Kalau gagal, coba sebagai gambar
      try {
        await execFileAsync(YTDLP, [
          "--ffmpeg-location",
          FFMPEG,
          "--no-playlist",
          "-o",
          outPathImg,
          url,
        ]);

        if (existsSync(outPathImg)) {
          const buffer = readFileSync(outPathImg);
          await sock.sendMessage(from, {
            image: buffer,
            caption: "📸 Foto dari Instagram",
          });
        }
      } catch (e) {
        console.error("[IGDL] error:", e.message);
        await sock.sendMessage(from, {
          text: `❌ Gagal download Instagram: ${e.message}`,
        });
      }
    } finally {
      if (existsSync(outPath)) unlinkSync(outPath);
      if (existsSync(outPathImg)) unlinkSync(outPathImg);
    }
  },
};

export default downloader;
