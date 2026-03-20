// commands/media.js — Sticker, Eye, HD Upscale

import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { downloadMediaMessage } from "@whiskeysockets/baileys";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TEMP_DIR = path.join(__dirname, "../temp");

if (!fs.existsSync(TEMP_DIR)) fs.mkdirSync(TEMP_DIR, { recursive: true });

// ────────────────────────────────
// Helper: download media dari msg
// ────────────────────────────────
async function downloadMedia(msg, quotedMsg) {
  if (msg.message?.imageMessage || msg.message?.videoMessage) {
    return await downloadMediaMessage(msg, "buffer", {});
  } else if (quotedMsg) {
    const fakeMsg = { key: msg.key, message: quotedMsg };
    return await downloadMediaMessage(fakeMsg, "buffer", {});
  }
  return null;
}

// ────────────────────────────────
// Helper: upscale via DeepAI + sharp
// ────────────────────────────────
async function upscaleImage(imageBuffer, scale = 2) {
  try {
    const FormData = (await import("form-data")).default;
    const fetch = (await import("node-fetch")).default;

    // Pre-process: naikkan kualitas sebelum dikirim ke AI
    const preScaled = await sharp(imageBuffer)
      .resize({ width: 2048, withoutEnlargement: false })
      .jpeg({ quality: 100 })
      .toBuffer();

    const form = new FormData();
    form.append("image", preScaled, {
      filename: "image.jpg",
      contentType: "image/jpeg",
    });

    const res = await fetch("https://api.deepai.org/api/superresolution", {
      method: "POST",
      headers: {
        "api-key": "d3704cab-aef8-4260-8785-bd7abe65210e",
        ...form.getHeaders(),
      },
      body: form,
      timeout: 90000,
    });

    if (!res.ok) throw new Error(`DeepAI error: ${res.status}`);
    const json = await res.json();
    if (!json?.output_url) throw new Error("DeepAI: no output URL");

    const imgRes = await fetch(json.output_url);
    const hdBuffer = await imgRes.buffer();

    // Post-process: sharpen + maksimalkan kualitas output
    return await sharp(hdBuffer)
      .sharpen({ sigma: 0.5, m1: 0.3, m2: 0.8 })
      .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
      .toBuffer();
  } catch (e) {
    console.error("[HD] DeepAI gagal:", e.message);

    // Fallback: sharp maksimal
    const meta = await sharp(imageBuffer).metadata();
    const targetW = Math.min((meta.width || 512) * scale, 4096);
    const targetH = Math.min((meta.height || 512) * scale, 4096);

    return await sharp(imageBuffer)
      .resize(targetW, targetH, { fit: "fill", kernel: sharp.kernel.lanczos3 })
      .sharpen({ sigma: 1.2, m1: 0.8, m2: 2 })
      .jpeg({ quality: 100, chromaSubsampling: "4:4:4" })
      .toBuffer();
  }
}

// ────────────────────────────────
// Handler utama
// ────────────────────────────────
export async function handleMedia(sock, from, msg, pengirimJid, isiPesan) {
  const pesanLower = isiPesan.toLowerCase().trim();

  // ── !sticker ──
  if (pesanLower === "!sticker") {
    const isImageMsg = msg.message?.imageMessage;
    const quotedMsg =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quotedMsg?.imageMessage;
    const quotedVideo = quotedMsg?.videoMessage;

    if (!isImageMsg && !quotedImage && !quotedVideo) {
      await sock.sendMessage(from, {
        text:
          `🖼️ *Cara pakai !sticker*\n\n` +
          `• Kirim gambar dengan caption *!sticker*\n` +
          `• Atau reply gambar/video lalu ketik *!sticker*`,
      });
      return true;
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Membuat sticker..." });

      let mediaBuffer;
      if (isImageMsg) {
        mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
      } else {
        const fakeMsg = { key: msg.key, message: quotedMsg };
        mediaBuffer = await downloadMediaMessage(fakeMsg, "buffer", {});
      }

      if (!mediaBuffer) {
        await sock.sendMessage(from, { text: "❌ Gagal download media." });
        return true;
      }

      const webpBuffer = await sharp(mediaBuffer)
        .resize(512, 512, {
          fit: "contain",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .webp({ quality: 80 })
        .toBuffer();

      await sock.sendMessage(from, { sticker: webpBuffer });
      return true;
    } catch (e) {
      console.error("[STICKER] error:", e.message);
      await sock.sendMessage(from, {
        text: `❌ Gagal buat sticker: ${e.message}`,
      });
      return true;
    }
  }

  // ── !eye ──
  if (pesanLower === "!eye") {
    console.log("[EYE] command triggered");

    const quotedCtx = msg.message?.extendedTextMessage?.contextInfo;
    const quotedMsg = quotedCtx?.quotedMessage;

    const viewOnceContent =
      quotedMsg?.viewOnceMessage?.message ||
      quotedMsg?.viewOnceMessageV2?.message ||
      quotedMsg?.viewOnceMessageV2Extension?.message ||
      quotedMsg;

    const imageMsg = viewOnceContent?.imageMessage;
    const videoMsg = viewOnceContent?.videoMessage;

    if (!quotedMsg || (!imageMsg && !videoMsg)) {
      await sock.sendMessage(from, {
        text:
          `👁️ *Cara pakai !eye*\n\n` +
          `• Reply pesan gambar *view once* lalu ketik *!eye*\n\n` +
          `_Bot akan membuka gambar tersebut untuk semua._`,
      });
      return true;
    }

    try {
      await sock.sendMessage(from, { text: "⏳ Membuka gambar view once..." });

      const senderJid = quotedCtx?.participant || quotedCtx?.remoteJid || from;
      const stanzaId = quotedCtx?.stanzaId;

      const fakeMsg = {
        key: { remoteJid: from, id: stanzaId, participant: senderJid },
        message: viewOnceContent,
      };

      const mediaBuffer = await downloadMediaMessage(fakeMsg, "buffer", {});

      if (!mediaBuffer || mediaBuffer.length === 0) {
        await sock.sendMessage(from, { text: "❌ Gagal download gambar." });
        return true;
      }

      if (videoMsg) {
        await sock.sendMessage(from, {
          video: mediaBuffer,
          caption: "👁️ View once dibuka.",
        });
      } else {
        await sock.sendMessage(from, {
          image: mediaBuffer,
          caption: "👁️ View once dibuka.",
        });
      }
      return true;
    } catch (e) {
      console.error("[EYE] error:", e.message);
      await sock.sendMessage(from, {
        text: `❌ Gagal buka view once: ${e.message}`,
      });
      return true;
    }
  }

  // ── !hd / !hd 2 / !hd 4 ──
  if (
    pesanLower === "!hd" ||
    pesanLower === "!hd 2" ||
    pesanLower === "!hd 4"
  ) {
    const isImageMsg = msg.message?.imageMessage;
    const quotedMsg =
      msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
    const quotedImage = quotedMsg?.imageMessage;

    if (!isImageMsg && !quotedImage) {
      await sock.sendMessage(from, {
        text:
          `🔍 *HD Upscale — Anti Pecah*\n\n` +
          `• Kirim gambar dengan caption *!hd*\n` +
          `• Atau reply gambar lalu ketik *!hd*\n\n` +
          `📐 *Scale:*\n` +
          `\`!hd\` atau \`!hd 2\` — Upscale 2x\n` +
          `\`!hd 4\` — Upscale 4x (lebih lambat)\n\n` +
          `📁 *Hasil dikirim sebagai dokumen* agar tidak dikompres WhatsApp.\n` +
          `_Proses 10-30 detik._`,
      });
      return true;
    }

    const scale = pesanLower.endsWith("4") ? 4 : 2;

    try {
      await sock.sendMessage(from, {
        text: `🔍 *Memproses HD Upscale ${scale}x...*\n⏳ Mohon tunggu 10-30 detik...`,
      });

      let mediaBuffer;
      if (isImageMsg) {
        mediaBuffer = await downloadMediaMessage(msg, "buffer", {});
      } else {
        const fakeMsg = { key: msg.key, message: quotedMsg };
        mediaBuffer = await downloadMediaMessage(fakeMsg, "buffer", {});
      }

      if (!mediaBuffer) {
        await sock.sendMessage(from, { text: "❌ Gagal download gambar." });
        return true;
      }

      if (mediaBuffer.length > 5 * 1024 * 1024) {
        await sock.sendMessage(from, {
          text: "❌ Ukuran gambar terlalu besar (maks 5MB).",
        });
        return true;
      }

      let hdBuffer;
      try {
        hdBuffer = await upscaleImage(mediaBuffer, scale);
      } catch (e) {
        console.error("[HD] error:", e.message);
        await sock.sendMessage(from, {
          text: `❌ Gagal upscale: ${e.message}`,
        });
        return true;
      }

      await sock.sendMessage(from, {
        document: hdBuffer,
        mimetype: "image/jpeg",
        fileName: `HD_${scale}x_${Date.now()}.jpg`,
        caption: `✅ *HD Upscale ${scale}x selesai!*\n_File dikirim sebagai dokumen agar tidak dikompres WhatsApp._`,
      });
      return true;
    } catch (e) {
      console.error("[HD] error:", e.message);
      await sock.sendMessage(from, { text: `❌ Gagal upscale: ${e.message}` });
      return true;
    }
  }

  return false;
}
