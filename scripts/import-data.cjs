const { PrismaClient } = require('@prisma/client');
const openpyxl = require('openpyxl');

const prisma = new PrismaClient();

function s(ws, r, c, d="") {
  const v = ws.cell(row=r, column=c).value;
  return v ? String(v).trim() : d;
}
function si(ws, r, c, d=0) {
  const v = ws.cell(row=r, column=c).value;
  if (v === null) return d;
  return typeof v === 'number' ? v : d;
}

async function main() {
  console.log("Clearing old data...");
  await prisma.mutasiMasuk.deleteMany({});
  await prisma.mutasiKeluar.deleteMany({});
  await prisma.guru.deleteMany({});
  await prisma.siswa.deleteMany({});

  // Import Guru
  const wb = openpyxl.load_workbook('upload/daftar-guru-SMA NEGERI 1 TELUKDALAM-2026-05-30 13_34_21 (1).xlsx', { data_only: true });
  const ws = wb.active;
  let gc = 0;
  for (let ri = 6; ri <= ws.max_row; ri++) {
    const nama = ws.cell(row=ri, column=2).value;
    if (!nama) continue;
    await prisma.guru.create({
      data: {
        no: si(ws,ri,1), nama: s(ws,ri,2), nuptk: s(ws,ri,3), jenisKelamin: s(ws,ri,4),
        tempatLahir: s(ws,ri,5), tanggalLahir: s(ws,ri,6), nip: s(ws,ri,7),
        statusKepegawaian: s(ws,ri,8), jenisPTK: s(ws,ri,9), agama: s(ws,ri,10),
        alamat: s(ws,ri,11), hp: s(ws,ri,19), email: s(ws,ri,20),
        tugasTambahan: s(ws,ri,21), pangkatGolongan: s(ws,ri,27), sumberGaji: s(ws,ri,28),
        statusPerkawinan: s(ws,ri,30), kewarganegaraan: s(ws,ri,41),
        status: "Aktif", tahunPelajaran: "2025/2026", semester: "Ganjil",
      },
    });
    gc++;
    if (gc % 10 === 0) console.log(`  ${gc} guru`);
  }
  console.log(`\nImported ${gc} guru`);

  // Import Siswa
  const wb2 = openpyxl.load_workbook('upload/daftar_pd-SMA NEGERI 1 TELUKDALAM-2026-06-02 16_45_42 (1).xlsx', { data_only: true });
  const ws2 = wb2.active;
  let sc = 0;
  for (let ri = 7; ri <= ws2.max_row; ri++) {
    const nama = ws2.cell(row=ri, column=2).value;
    if (!nama) continue;
    await prisma.siswa.create({
      data: {
        no: si(ws2,ri,1), nama: s(ws2,ri,2), nipd: s(ws2,ri,3), jenisKelamin: s(ws2,ri,4),
        nisn: s(ws2,ri,5), tempatLahir: s(ws2,ri,6), tanggalLahir: s(ws2,ri,7),
        nik: s(ws2,ri,8), agama: s(ws2,ri,9), alamat: s(ws2,ri,10),
        hp: s(ws2,ri,20), email: s(ws2,ri,21), rombel: s(ws2,ri,43),
        kebutuhanKhusus: s(ws2,ri,55), sekolahAsal: s(ws2,ri,56),
        namaAyah: s(ws2,ri,25), namaIbu: s(ws2,ri,31), namaWali: s(ws2,ri,37),
        status: "Aktif", tahunPelajaran: "2025/2026", semester: "Ganjil",
      },
    });
    sc++;
    if (sc % 50 === 0) console.log(`  ${sc} siswa`);
  }
  console.log(`\nImported ${sc} siswa`);

  await prisma.$disconnect();
  console.log("Done!");
}

main().catch(e => { console.error(e); process.exit(1); });