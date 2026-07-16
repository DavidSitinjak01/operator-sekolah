const { PrismaClient } = require('@prisma/client');
const FS = require('fs');
const path = require('path');

function s(v) { return v != null ? String(v).trim() : ''; }

async function run() {
  const prisma = new PrismaClient();

  // Import Guru
  console.log('Importing guru...');
  const guruText = FS.readFileSync(path.join(__dirname, '..', 'scripts', 'guru.csv'), 'utf-8');
  const guruLines = guruText.split('\n').filter(l => l.includes(','));
  let gc = 0;
  const guruHeaders = guruLines[0].split(',').map(h => h.trim());
  for (const line of guruLines.slice(1)) {
    const vals = line.split(',');
    const g = {};
    guruHeaders.forEach((h, i) => { g[h] = (vals[i] || '').trim(); });
    if (!g.nama) continue;
    try {
      await prisma.guru.create({
        data: {
          no: g['No'] || g['no'] || '',
          nama: g['Nama'] || '', nuptk: g['NUPTK'] || '',
          jenisKelamin: g['JK'] || '', tempatLahir: g['Tempat Lahir'] || '',
          tanggalLahir: g['Tanggal Lahir'] ? g['Tanggal Lahir'].split('T')[0] : '',
          nip: g['NIP'] || '', statusKepegawaian: g['Status Kepegawaian'] || '',
          jenisPTK: g['Jenis PTK'] || '', agama: g['Agama'] || '',
          alamat: g['Alamat Jalan'] || '', hp: g['HP'] || '',
          email: g['Email'] || '',
          tugasTambahan: g['Tugas Tambahan'] || '',
          pangkatGolongan: g['Pangkat/Golongan'] || '',
          sumberGaji: g['Sumber Gaji'] || '',
          statusPerkawinan: g['Status Perkawinan'] || '',
          kewarganegaraan: g['Kewarganegaraan'] || '',
          status: 'Aktif', tahunPelajaran: '2025/2026', semester: 'Ganjil',
        },
      });
      gc++;
    } catch (e) { console.error(`Guru ${g.nama}: ${e.message}`); }
  }
  console.log(`Imported ${gc} guru`);

  // Import Siswa
  console.log('Importing siswa...');
  const siswaText = FS.readFileSync(path.join(__dirname, '..', 'scripts', 'siswa.csv'), 'utf-8');
  const siswaLines = siswaText.split('\n').filter(l => l.includes(','));
  let sc = 0;
  const siswaHeaders = siswaLines[0].split(',').map(h => h.trim());
  for (const line of siswaLines.slice(1)) {
    const vals = line.split(',');
    const row = {};
    siswaHeaders.forEach((h, i) => { row[h] = (vals[i] || '').trim(); });
    if (!row.nama) continue;
    try {
      await prisma.siswa.create({
        data: {
          no: row['No'] || '', nama: row['Nama'] || '',
          nipd: row['NIPD'] || '', jenisKelamin: row['JK'] || '',
          nisn: row['NISN'] || '',
          tempatLahir: row['Tempat Lahir'] || '',
          tanggalLahir: row['Tanggal Lahir'] ? row['Tanggal Lahir'].split('T')[0] : '',
          nik: row['NIK'] || '', agama: row['Agama'] || '',
          alamat: row['Alamat'] || '', hp: row['HP'] || '',
          email: row['E-Mail'] || '', rombel: row['Rombel'] || row['Rombel'] || '',
          kebutuhanKhusus: row['Kebutuhan Khusus'] || '',
          sekolahAsal: row['Sekolah Asal'] || '',
          namaAyah: row['Nama Ayah'] || '', namaIbu: row['Nama Ibu'] || '',
          namaWali: row['Nama Wali'] || '',
          status: 'Aktif', tahunPelajaran: '2025/2026', semester: 'Ganjil',
        },
      });
      sc++;
    } catch (e) { console.error(`Siswa ${row.nama}: ${e.message}`); }
  }
  console.log(`Imported ${sc} siswa`);

  const gCount = await prisma.guru.count();
  const sCount = await prisma.siswa.count();
  console.log(`\nVerification: ${gCount} guru, ${sCount} siswa`);
  await prisma.$disconnect();
  console.log('Done!');
}

run().catch(function(e) { console.error(e); process.exit(1); });