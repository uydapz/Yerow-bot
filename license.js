// license.js — Sistem Aktivasi Premium
// Kode 12 digit, per grup, dengan masa aktif

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LICENSE_FILE = path.join(__dirname, "license.json");

// ── Baca / Tulis File ──
function readLicense() {
  try {
    return JSON.parse(fs.readFileSync(LICENSE_FILE, "utf-8"));
  } catch {
    return { codes: {}, groups: {} };
  }
}

function writeLicense(data) {
  fs.writeFileSync(LICENSE_FILE, JSON.stringify(data, null, 2));
}

// ── Generate kode 12 digit (huruf besar + angka) ──
export function generateKode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let kode = "";
  for (let i = 0; i < 12; i++) {
    if (i > 0 && i % 4 === 0) kode += "-"; // Format: XXXX-XXXX-XXXX
    kode += chars[crypto.randomInt(0, chars.length)];
  }
  return kode; // Contoh: AB12-CD34-EF56
}

// ── Tambah kode baru ke license.json ──
export function tambahKode(kode, durasi, satuan = "hari", catatan = "") {
  const data = readLicense();

  // Hitung ms dari durasi
  const msMap = {
    jam: 3600000,
    hari: 86400000,
    bulan: 2592000000,
    tahun: 31536000000,
  };
  const ms = (msMap[satuan] || msMap["hari"]) * durasi;

  data.codes[kode] = {
    durasi,
    satuan,
    ms,
    catatan,
    used: false,
    usedBy: null,
    createdAt: Date.now(),
  };
  writeLicense(data);
  return data.codes[kode];
}

// ── Aktivasi kode untuk grup ──
export function aktivasiKode(kode, grupJid) {
  const data = readLicense();
  const entry = data.codes[kode];

  if (!entry) return { ok: false, msg: "Kode tidak ditemukan." };
  if (entry.used)
    return { ok: false, msg: `Kode sudah digunakan oleh grup lain.` };

  const expiredAt = Date.now() + entry.ms;

  // Tandai kode sudah dipakai
  entry.used = true;
  entry.usedBy = grupJid;
  entry.usedAt = Date.now();

  // Daftarkan grup
  data.groups[grupJid] = {
    kode,
    aktifSejak: Date.now(),
    expiredAt,
    durasi: entry.durasi,
    satuan: entry.satuan,
  };

  writeLicense(data);
  return { ok: true, expiredAt, durasi: entry.durasi, satuan: entry.satuan };
}

// ── Cek apakah grup aktif ──
export function isGrupAktif(grupJid) {
  const data = readLicense();
  const grup = data.groups[grupJid];
  if (!grup) return false;
  return Date.now() < grup.expiredAt;
}

// ── Info lisensi grup ──
export function infoLisensi(grupJid) {
  const data = readLicense();
  return data.groups[grupJid] || null;
}

// ── Semua kode (untuk owner) ──
export function semuaKode() {
  return readLicense().codes;
}

// ── Semua grup aktif ──
export function semuaGrup() {
  return readLicense().groups;
}

// ── Hapus kode ──
export function hapusKode(kode) {
  const data = readLicense();
  if (!data.codes[kode]) return false;
  delete data.codes[kode];
  writeLicense(data);
  return true;
}

// ── Nonaktifkan lisensi grup ──
export function nonaktifkanGrup(grupJid) {
  const data = readLicense();
  if (!data.groups[grupJid]) return { ok: false, msg: "Grup tidak ditemukan." };

  // Simpan riwayat, set expired ke masa lalu
  data.groups[grupJid].expiredAt = Date.now() - 1;
  data.groups[grupJid].nonaktifAt = Date.now();
  data.groups[grupJid].status = "nonaktif";

  writeLicense(data);
  return { ok: true };
}
export function perpanjangLisensi(grupJid, durasi, satuan = "hari") {
  const data = readLicense();
  const grup = data.groups[grupJid];
  if (!grup) return false;

  const msMap = {
    jam: 3600000,
    hari: 86400000,
    bulan: 2592000000,
    tahun: 31536000000,
  };
  const ms = (msMap[satuan] || msMap["hari"]) * durasi;

  // Perpanjang dari sekarang atau dari expiredAt kalau belum expired
  const base = Math.max(Date.now(), grup.expiredAt);
  grup.expiredAt = base + ms;
  grup.durasi = durasi;
  grup.satuan = satuan;

  writeLicense(data);
  return grup.expiredAt;
}
