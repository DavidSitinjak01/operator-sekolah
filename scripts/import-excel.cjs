const XLSX = require('xlsx');
const { PrismaClient } = require('@prisma/client');
const db = new PrismaClient();

async function importSiswa() {
  const wb = XLSX.readFile('upload/daftar_pd-SMA NEGERI 1 TELUKDALAM-2026-06-02 16_45_42 (1).xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Data starts from row 6 (0-indexed), header is row 4-5
  // Columns by index:
  // 0:No, 1:Nama, 2:NIPD, 3:JK, 4:NISN, 5:Tempat Lahir, 6:Tanggal Lahir, 7:NIK, 8:Agama,
  // 9:Alamat, 10:RT, 11:RW, 12:Dusun, 13:Kelurahan, 14:Kecamatan, 15:Kode Pos,
  // 16:Jenis Tinggal, 17:Alat Transportasi, 18:Telepon, 19:HP, 20:E-Mail,
  // 21:SKHUN, 22:Penerima KPS, 23:No. KPS,
  // 24:Nama Ayah, 25:Ayah Tahun Lahir, 26:Ayah Jenjang, 27:Ayah Pekerjaan, 28:Ayah Penghasilan, 29:Ayah NIK,
  // 30:Nama Ibu, 31:Ibu Tahun Lahir, 32:Ibu Jenjang, 33:Ibu Pekerjaan, 34:Ibu Penghasilan, 35:Ibu NIK,
  // 36:Nama Wali, 37:Wali Tahun Lahir, 38:Wali Jenjang, 39:Wali Pekerjaan, 40:Wali Penghasilan, 41:Wali NIK,
  // 42:Rombel Saat Ini, 43:No Peserta UN, 44:No Seri Ijazah,
  // 45:Penerima KIP, 46:Nomor KIP, 47:Nama di KIP, 48:Nomor KKS,
  // 49:No Reg Akta Lahir, 50:Bank, 51:No Rek Bank, 52:Rek Atas Nama,
  // 53:Layak PIP, 54:Alasan Layak PIP, 55:Kebutuhan Khusus, 56:Sekolah Asal,
  // 57:Anak ke-berapa, 58:Lintang, 59:Bujur, 60:No KK,
  // 61:Berat Badan, 62:Tinggi Badan, 63:Lingkar Kepala, 64:Jml Saudara Kandung, 65:Jarak Rumah ke Sekolah

  let imported = 0;
  let skipped = 0;
  const tahunPelajaran = '2025/2026';
  const semester = 'Ganjil';

  // Clear existing siswa data for this TP/semester
  const deleted = await db.siswa.deleteMany({
    where: { tahunPelajaran, semester }
  });
  console.log(`Deleted ${deleted.count} existing siswa records for ${tahunPelajaran} ${semester}`);

  for (let i = 6; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[0]) {
      skipped++;
      continue;
    }

    const nama = String(row[1] || '').trim();
    if (!nama) {
      skipped++;
      continue;
    }

    try {
      await db.siswa.create({
        data: {
          no: String(row[0] || '').trim(),
          nama,
          nipd: String(row[2] || '').trim(),
          jenisKelamin: String(row[3] || '').trim(),
          nisn: String(row[4] || '').trim(),
          tempatLahir: String(row[5] || '').trim(),
          tanggalLahir: String(row[6] || '').trim(),
          nik: String(row[7] || '').trim(),
          agama: String(row[8] || '').trim(),
          alamat: String(row[9] || '').trim(),
          rt: String(row[10] || '').trim(),
          rw: String(row[11] || '').trim(),
          dusun: String(row[12] || '').trim(),
          kelurahan: String(row[13] || '').trim(),
          kecamatan: String(row[14] || '').trim(),
          kodePos: String(row[15] || '').trim(),
          jenisTinggal: String(row[16] || '').trim(),
          alatTransportasi: String(row[17] || '').trim(),
          telepon: String(row[18] || '').trim(),
          hp: String(row[19] || '').trim(),
          email: String(row[20] || '').trim(),
          skhun: String(row[21] || '').trim(),
          penerimaKPS: String(row[22] || '').trim(),
          noKPS: String(row[23] || '').trim(),
          namaAyah: String(row[24] || '').trim(),
          ayahTahunLahir: String(row[25] || '').trim(),
          ayahJenjangPendidikan: String(row[26] || '').trim(),
          ayahPekerjaan: String(row[27] || '').trim(),
          ayahPenghasilan: String(row[28] || '').trim(),
          ayahNik: String(row[29] || '').trim(),
          namaIbu: String(row[30] || '').trim(),
          ibuTahunLahir: String(row[31] || '').trim(),
          ibuJenjangPendidikan: String(row[32] || '').trim(),
          ibuPekerjaan: String(row[33] || '').trim(),
          ibuPenghasilan: String(row[34] || '').trim(),
          ibuNik: String(row[35] || '').trim(),
          namaWali: String(row[36] || '').trim(),
          waliTahunLahir: String(row[37] || '').trim(),
          waliJenjangPendidikan: String(row[38] || '').trim(),
          waliPekerjaan: String(row[39] || '').trim(),
          waliPenghasilan: String(row[40] || '').trim(),
          waliNik: String(row[41] || '').trim(),
          rombel: String(row[42] || '').trim(),
          noPesertaUN: String(row[43] || '').trim(),
          noSeriIjazah: String(row[44] || '').trim(),
          penerimaKIP: String(row[45] || '').trim(),
          nomorKIP: String(row[46] || '').trim(),
          namaKIP: String(row[47] || '').trim(),
          nomorKKS: String(row[48] || '').trim(),
          noRegAktaLahir: String(row[49] || '').trim(),
          bank: String(row[50] || '').trim(),
          nomorRekeningBank: String(row[51] || '').trim(),
          rekeningAtasNama: String(row[52] || '').trim(),
          layakPIP: String(row[53] || '').trim(),
          alasanLayakPIP: String(row[54] || '').trim(),
          kebutuhanKhusus: String(row[55] || '').trim(),
          sekolahAsal: String(row[56] || '').trim(),
          anakKeBerapa: String(row[57] || '').trim(),
          lintang: String(row[58] || '').trim(),
          bujur: String(row[59] || '').trim(),
          noKK: String(row[60] || '').trim(),
          beratBadan: String(row[61] || '').trim(),
          tinggiBadan: String(row[62] || '').trim(),
          lingkarKepala: String(row[63] || '').trim(),
          jmlSaudaraKandung: String(row[64] || '').trim(),
          jarakRumahKeSekolah: String(row[65] || '').trim(),
          status: 'Aktif',
          tahunPelajaran,
          semester,
        }
      });
      imported++;
    } catch (err) {
      console.error(`Error at row ${i + 1} (${nama}):`, err.message);
      skipped++;
    }
  }

  console.log(`\n=== SISWA IMPORT COMPLETE ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total rows processed: ${imported + skipped}`);
}

async function importGuru() {
  const wb = XLSX.readFile('upload/daftar-guru-SMA NEGERI 1 TELUKDALAM-2026-05-30 13_34_21 (1).xlsx');
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  // Data starts from row 5, header is row 4
  // 0:No, 1:Nama, 2:NUPTK, 3:JK, 4:Tempat Lahir, 5:Tanggal Lahir, 6:NIP,
  // 7:Status Kepegawaian, 8:Jenis PTK, 9:Agama, 10:Alamat Jalan,
  // 11:RT, 12:RW, 13:Nama Dusun, 14:Desa/Kelurahan, 15:Kecamatan, 16:Kode Pos,
  // 17:Telepon, 18:HP, 19:Email, 20:Tugas Tambahan,
  // 21:SK CPNS, 22:Tanggal CPNS, 23:SK Pengangkatan, 24:TMT Pengangkatan, 25:Lembaga Pengangkatan,
  // 26:Pangkat Golongan, 27:Sumber Gaji,
  // 28:Nama Ibu Kandung, 29:Status Perkawinan, 30:Nama Suami/Istri, 31:NIP Suami/Istri, 32:Pekerjaan Suami/Istri,
  // 33:TMT PNS, 34:Sudah Lisensi Kepala Sekolah, 35:Pernah Diklat Kepengawasan,
  // 36:Keahlian Braille, 37:Keahlian Bahasa Isyarat,
  // 38:NPWP, 39:Nama Wajib Pajak, 40:Kewarganegaraan,
  // 41:Bank, 42:Nomor Rekening Bank, 43:Rekening Atas Nama,
  // 44:NIK, 45:No KK, 46:Karpeg, 47:Karis/Karsu,
  // 48:Lintang, 49:Bujur, 50:NUKS

  let imported = 0;
  let skipped = 0;
  const tahunPelajaran = '2025/2026';
  const semester = 'Ganjil';

  // Clear existing guru data
  const deleted = await db.guru.deleteMany({
    where: { tahunPelajaran, semester }
  });
  console.log(`\nDeleted ${deleted.count} existing guru records for ${tahunPelajaran} ${semester}`);

  for (let i = 5; i < rawData.length; i++) {
    const row = rawData[i];
    if (!row || !row[0]) {
      skipped++;
      continue;
    }

    const nama = String(row[1] || '').trim();
    if (!nama) {
      skipped++;
      continue;
    }

    try {
      await db.guru.create({
        data: {
          no: String(row[0] || '').trim(),
          nama,
          nuptk: String(row[2] || '').trim(),
          jenisKelamin: String(row[3] || '').trim(),
          tempatLahir: String(row[4] || '').trim(),
          tanggalLahir: String(row[5] || '').trim(),
          nip: String(row[6] || '').trim(),
          statusKepegawaian: String(row[7] || '').trim(),
          jenisPTK: String(row[8] || '').trim(),
          agama: String(row[9] || '').trim(),
          alamat: String(row[10] || '').trim(),
          rt: String(row[11] || '').trim(),
          rw: String(row[12] || '').trim(),
          namaDusun: String(row[13] || '').trim(),
          desaKelurahan: String(row[14] || '').trim(),
          kecamatan: String(row[15] || '').trim(),
          kodePos: String(row[16] || '').trim(),
          telepon: String(row[17] || '').trim(),
          hp: String(row[18] || '').trim(),
          email: String(row[19] || '').trim(),
          tugasTambahan: String(row[20] || '').trim(),
          skCPNS: String(row[21] || '').trim(),
          tanggalCPNS: String(row[22] || '').trim(),
          skPengangkatan: String(row[23] || '').trim(),
          tmtPengangkatan: String(row[24] || '').trim(),
          lembagaPengangkatan: String(row[25] || '').trim(),
          pangkatGolongan: String(row[26] || '').trim(),
          sumberGaji: String(row[27] || '').trim(),
          namaIbuKandung: String(row[28] || '').trim(),
          statusPerkawinan: String(row[29] || '').trim(),
          namaSuamiIstri: String(row[30] || '').trim(),
          nipSuamiIstri: String(row[31] || '').trim(),
          pekerjaanSuamiIstri: String(row[32] || '').trim(),
          tmtPNS: String(row[33] || '').trim(),
          sudahLisensiKepsek: String(row[34] || '').trim(),
          pernahDiklatKepengawasan: String(row[35] || '').trim(),
          keahlianBraille: String(row[36] || '').trim(),
          keahlianBahasaIsyarat: String(row[37] || '').trim(),
          npwp: String(row[38] || '').trim(),
          namaWajibPajak: String(row[39] || '').trim(),
          kewarganegaraan: String(row[40] || '').trim(),
          bank: String(row[41] || '').trim(),
          nomorRekeningBank: String(row[42] || '').trim(),
          rekeningAtasNama: String(row[43] || '').trim(),
          nik: String(row[44] || '').trim(),
          noKK: String(row[45] || '').trim(),
          karpeg: String(row[46] || '').trim(),
          karisKarsu: String(row[47] || '').trim(),
          lintang: String(row[48] || '').trim(),
          bujur: String(row[49] || '').trim(),
          nuks: String(row[50] || '').trim(),
          status: 'Aktif',
          tahunPelajaran,
          semester,
        }
      });
      imported++;
    } catch (err) {
      console.error(`Error at row ${i + 1} (${nama}):`, err.message);
      skipped++;
    }
  }

  console.log(`\n=== GURU IMPORT COMPLETE ===`);
  console.log(`Imported: ${imported}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Total rows processed: ${imported + skipped}`);
}

async function main() {
  console.log('Starting import...\n');
  await importSiswa();
  await importGuru();
  console.log('\n✅ All import complete!');
  await db.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});