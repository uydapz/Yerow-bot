// data.js — penyimpanan sementara (in-memory)
// Untuk produksi, ganti dengan database (SQLite/JSON file)

export const absenList = new Map(); // { tanggal: [{ jid, nama, waktu }] }
export const warnList = new Map(); // { jid: jumlahWarn }
export const memberList = new Map(); // { jid: { nama, bergabung } }

// Tambah absen
export function tambahAbsen(tanggal, jid, nama, keterangan = "Hadir") {
  if (!absenList.has(tanggal)) absenList.set(tanggal, []);
  const list = absenList.get(tanggal);
  const sudahAbsen = list.find((m) => m.jid === jid);
  if (sudahAbsen) return false;
  list.push({
    jid,
    nama,
    waktu: new Date().toLocaleTimeString("id-ID"),
    keterangan,
  });
  return true;
}

// Ambil list absen
export function getAbsen(tanggal) {
  return absenList.get(tanggal) || [];
}

// Tambah warn
export function tambahWarn(jid) {
  const warn = (warnList.get(jid) || 0) + 1;
  warnList.set(jid, warn);
  return warn;
}

// Reset warn
export function resetWarn(jid) {
  warnList.set(jid, 0);
}

// Get warn
export function getWarn(jid) {
  return warnList.get(jid) || 0;
}

// Tambah member
export function tambahMember(jid, nama) {
  memberList.set(jid, {
    nama,
    bergabung: new Date().toLocaleDateString("id-ID"),
  });
}

// Get semua member
export function getAllMember() {
  return memberList;
}
