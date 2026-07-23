import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const role = (session.user as Record<string, unknown>).role as string;
    if (role !== 'admin' && role !== 'operator') {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const tahunPelajaran = body.tahunPelajaran || '2025/2026';

    // Delete existing questions for this tahunPelajaran
    await db.soalTesMinatBakat.deleteMany({
      where: { tahunPelajaran },
    });

    const questions = [
      // ── R (Realistic) — 7 soal ──
      {
        nomor: 1,
        pertanyaan:
          'Saat waktu luang, kamu lebih suka:',
        dimensi: 'R',
        poinA: 'Memperbaiki sepeda atau peralatan yang rusak',
        poinB: 'Membaca buku tentang penemuan ilmiah',
        skorA: 'R',
        skorB: 'I',
        tahunPelajaran,
      },
      {
        nomor: 2,
        pertanyaan:
          'Dalam pekerjaan kelompok, peran yang paling kamu nikmati adalah:',
        dimensi: 'R',
        poinA: 'Membuat model atau prototipe secara langsung',
        poinB: 'Menghias dan mendesain tampilan hasil kerja',
        skorA: 'R',
        skorB: 'A',
        tahunPelajaran,
      },
      {
        nomor: 3,
        pertanyaan:
          'Jika kamu diminta memilih kegiatan ekstrakurikuler, kamu akan memilih:',
        dimensi: 'R',
        poinA: 'Pramuka atau pecinta alam',
        poinB: 'Pekerjaan sosial atau PMR',
        skorA: 'R',
        skorB: 'S',
        tahunPelajaran,
      },
      {
        nomor: 4,
        pertanyaan:
          'Kamu merasa lebih puas jika:',
        dimensi: 'R',
        poinA: 'Berhasil membangun sesuatu dengan tangan sendiri',
        poinB: 'Berhasil meyakinkan orang lain untuk mengikuti idemu',
        skorA: 'R',
        skorB: 'E',
        tahunPelajaran,
      },
      {
        nomor: 5,
        pertanyaan:
          'Tugas sekolah yang paling kamu sukai adalah:',
        dimensi: 'R',
        poinA: 'Praktikum di laboratorium atau bengkel',
        poinB: 'Mengelola data dan menyusun tabel',
        skorA: 'R',
        skorB: 'C',
        tahunPelajaran,
      },
      {
        nomor: 6,
        pertanyaan:
          'Kamu lebih tertarik dengan pekerjaan yang:',
        dimensi: 'R',
        poinA: 'Berkaitan dengan mesin dan peralatan teknis',
        poinB: 'Berkaitan dengan riset dan penyelidikan',
        skorA: 'R',
        skorB: 'I',
        tahunPelajaran,
      },
      {
        nomor: 7,
        pertanyaan:
          'Kamu lebih suka belajar dengan cara:',
        dimensi: 'R',
        poinA: 'Langsung praktek dan mencoba sendiri',
        poinB: 'Memimpin diskusi kelompok',
        skorA: 'R',
        skorB: 'E',
        tahunPelajaran,
      },

      // ── I (Investigative) — 7 soal ──
      {
        nomor: 8,
        pertanyaan:
          'Saat melihat suatu fenomena alam, kamu cenderung:',
        dimensi: 'I',
        poinA: 'Ingin menyelidiki penyebab dan alasan di baliknya',
        poinB: 'Ingin menggambar atau menulis tentang keindahannya',
        skorA: 'I',
        skorB: 'A',
        tahunPelajaran,
      },
      {
        nomor: 9,
        pertanyaan:
          'Dalam mengerjakan tugas, kamu lebih suka:',
        dimensi: 'I',
        poinA: 'Menganalisis data dan mencari pola',
        poinB: 'Mengajar teman yang belum paham',
        skorA: 'I',
        skorB: 'S',
        tahunPelajaran,
      },
      {
        nomor: 10,
        pertanyaan:
          'Mata pelajaran yang paling kamu enjoy adalah:',
        dimensi: 'I',
        poinA: 'Matematika dan IPA',
        poinB: 'Ekonomi dan kewirausahaan',
        skorA: 'I',
        skorB: 'E',
        tahunPelajaran,
      },
      {
        nomor: 11,
        pertanyaan:
          'Kamu lebih tertarik membaca:',
        dimensi: 'I',
        poinA: 'Artikel tentang teknologi dan sains',
        poinB: 'Panduan langkah-langkah yang terstruktur',
        skorA: 'I',
        skorB: 'C',
        tahunPelajaran,
      },
      {
        nomor: 12,
        pertanyaan:
          'Saat ada masalah yang rumit, kamu akan:',
        dimensi: 'I',
        poinA: 'Mengumpulkan informasi dan menganalisis secara mendalam',
        poinB: 'Mencoba memperbaiki langsung secara fisik',
        skorA: 'I',
        skorB: 'R',
        tahunPelajaran,
      },
      {
        nomor: 13,
        pertanyaan:
          'Kamu lebih suka menonton acara TV tentang:',
        dimensi: 'I',
        poinA: 'Dokumenter penemuan dan misteri alam',
        poinB: 'Acara seni dan pertunjukan kreatif',
        skorA: 'I',
        skorB: 'A',
        tahunPelajaran,
      },
      {
        nomor: 14,
        pertanyaan:
          'Kamu merasa tertantang oleh:',
        dimensi: 'I',
        poinA: 'Teka-teki dan soal yang membutuhkan logika',
        poinB: 'Mengatur dan mengorganisir acara sekolah',
        skorA: 'I',
        skorB: 'C',
        tahunPelajaran,
      },

      // ── A (Artistic) — 7 soal ──
      {
        nomor: 15,
        pertanyaan:
          'Kamu paling bangga jika:',
        dimensi: 'A',
        poinA: 'Karya seni atau desainmu dipuji orang lain',
        poinB: 'Berhasil membantu teman menyelesaikan masalahnya',
        skorA: 'A',
        skorB: 'S',
        tahunPelajaran,
      },
      {
        nomor: 16,
        pertanyaan:
          'Jika kamu menjadi pemimpin sebuah proyek, kamu akan:',
        dimensi: 'A',
        poinA: 'Fokus pada konsep kreatif dan visi unik',
        poinB: 'Fokus pada target dan cara mencapai hasil',
        skorA: 'A',
        skorB: 'E',
        tahunPelajaran,
      },
      {
        nomor: 17,
        pertanyaan:
          'Cara kamu mengekspresikan diri paling sering melalui:',
        dimensi: 'A',
        poinA: 'Musik, menggambar, atau menulis kreatif',
        poinB: 'Kegiatan yang terjadwal dan teratur',
        skorA: 'A',
        skorB: 'C',
        tahunPelajaran,
      },
      {
        nomor: 18,
        pertanyaan:
          'Kamu lebih menyukai ruang kelas yang:',
        dimensi: 'A',
        poinA: 'Didekorasi secara bebas dan penuh warna',
        poinB: 'Dilengkapi alat-alat praktik dan bengkel',
        skorA: 'A',
        skorB: 'R',
        tahunPelajaran,
      },
      {
        nomor: 19,
        pertanyaan:
          'Saat diberi tugas membuat presentasi, kamu lebih fokus pada:',
        dimensi: 'A',
        poinA: 'Desain visual dan kreativitas tampilannya',
        poinB: 'Kedalaman isi dan keakuratan datanya',
        skorA: 'A',
        skorB: 'I',
        tahunPelajaran,
      },
      {
        nomor: 20,
        pertanyaan:
          'Kamu merasa bosan jika harus:',
        dimensi: 'A',
        poinA: 'Mengikuti instruksi yang kaku tanpa ruang kreativitas',
        poinB: 'Bekerja sendirian tanpa interaksi dengan orang lain',
        skorA: 'A',
        skorB: 'S',
        tahunPelajaran,
      },
      {
        nomor: 21,
        pertanyaan:
          'Masa depan yang kamu impikan lebih berkaitan dengan:',
        dimensi: 'A',
        poinA: 'Menjadi seniman, desainer, atau kreator konten',
        poinB: 'Menjadi pengusaha atau pemimpin bisnis',
        skorA: 'A',
        skorB: 'E',
        tahunPelajaran,
      },

      // ── S (Social) — 7 soal ──
      {
        nomor: 22,
        pertanyaan:
          'Dalam situasi baru, kamu cenderung:',
        dimensi: 'S',
        poinA: 'Mendekati dan berkenalan dengan orang banyak',
        poinB: 'Mencari peluang untuk memulai sesuatu',
        skorA: 'S',
        skorB: 'E',
        tahunPelajaran,
      },
      {
        nomor: 23,
        pertanyaan:
          'Kamu lebih suka menjadi:',
        dimensi: 'S',
        poinA: 'Konselor atau guru yang membimbing orang lain',
        poinB: 'Pegawai administrasi yang mengatur arsip',
        skorA: 'S',
        skorB: 'C',
        tahunPelajaran,
      },
      {
        nomor: 24,
        pertanyaan:
          'Kegiatan yang membuatmu merasa bermakna adalah:',
        dimensi: 'S',
        poinA: 'Mengajar atau membantu adik belajar',
        poinB: 'Bekerja di bengkel atau kegiatan outdoor',
        skorA: 'S',
        skorB: 'R',
        tahunPelajaran,
      },
      {
        nomor: 25,
        pertanyaan:
          'Saat ada teman yang sedang sedih, kamu akan:',
        dimensi: 'S',
        poinA: 'Mendengarkan dan memberikan dukungan emosional',
        poinB: 'Menganalisis masalahnya dan mencari solusi logis',
        skorA: 'S',
        skorB: 'I',
        tahunPelajaran,
      },
      {
        nomor: 26,
        pertanyaan:
          'Kamu merasa paling nyaman ketika:',
        dimensi: 'S',
        poinA: 'Bekerja dalam tim dan berkolaborasi',
        poinB: 'Mengekspresikan ide melalui karya seni',
        skorA: 'S',
        skorB: 'A',
        tahunPelajaran,
      },
      {
        nomor: 27,
        pertanyaan:
          'Profesi yang paling menarik bagimu adalah:',
        dimensi: 'S',
        poinA: 'Psikolog, guru, atau pekerja sosial',
        poinB: 'Manajer atau direktur perusahaan',
        skorA: 'S',
        skorB: 'E',
        tahunPelajaran,
      },
      {
        nomor: 28,
        pertanyaan:
          'Kamu lebih suka menghabiskan waktu untuk:',
        dimensi: 'S',
        poinA: 'Kegiatan sosial dan sukarela di masyarakat',
        poinB: 'Mengorganisir dan menata berkas-berkas',
        skorA: 'S',
        skorB: 'C',
        tahunPelajaran,
      },

      // ── E (Enterprising) — 6 soal ──
      {
        nomor: 29,
        pertanyaan:
          'Dalam sebuah organisasi, posisi yang paling kamu inginkan adalah:',
        dimensi: 'E',
        poinA: 'Ketua atau pemimpin yang mengambil keputusan',
        poinB: 'Bendahara atau sekretaris yang mengatur administrasi',
        skorA: 'E',
        skorB: 'C',
        tahunPelajaran,
      },
      {
        nomor: 30,
        pertanyaan:
          'Kamu lebih tertarik pada pelajaran tentang:',
        dimensi: 'E',
        poinA: 'Bisnis, pemasaran, dan kepemimpinan',
        poinB: 'Teknik mesin dan praktik kerja',
        skorA: 'E',
        skorB: 'R',
        tahunPelajaran,
      },
      {
        nomor: 31,
        pertanyaan:
          'Saat ada kompetisi, kamu akan:',
        dimensi: 'E',
        poinA: 'Menjadi kapten tim dan menyusun strategi',
        poinB: 'Meneliti aturan dan mencari celah untuk menang',
        skorA: 'E',
        skorB: 'I',
        tahunPelajaran,
      },
      {
        nomor: 32,
        pertanyaan:
          'Kamu lebih suka kegiatan yang:',
        dimensi: 'E',
        poinA: 'Melibatkan negosiasi dan meyakinkan orang lain',
        poinB: 'Melibatkan ekspresi diri secara bebas dan kreatif',
        skorA: 'E',
        skorB: 'A',
        tahunPelajaran,
      },
      {
        nomor: 33,
        pertanyaan:
          'Jika kamu diberi modal usaha, kamu akan:',
        dimensi: 'E',
        poinA: 'Memulai bisnis dan merekrut teman-teman',
        poinB: 'Menggunakannya untuk kegiatan sosial membantu masyarakat',
        skorA: 'E',
        skorB: 'S',
        tahunPelajaran,
      },
      {
        nomor: 34,
        pertanyaan:
          'Sifat yang paling mencerminkan dirimu adalah:',
        dimensi: 'E',
        poinA: 'Percaya diri dan berani mengambil risiko',
        poinB: 'Teliti dan suka bekerja secara sistematis',
        skorA: 'E',
        skorB: 'C',
        tahunPelajaran,
      },

      // ── C (Conventional) — 6 soal ──
      {
        nomor: 35,
        pertanyaan:
          'Dalam mengerjakan tugas, kamu lebih suka:',
        dimensi: 'C',
        poinA: 'Mengikuti petunjuk langkah demi langkah',
        poinB: 'Melakukan secara langsung dan coba-coba',
        skorA: 'C',
        skorB: 'R',
        tahunPelajaran,
      },
      {
        nomor: 36,
        pertanyaan:
          'Kamu merasa paling produktif ketika:',
        dimensi: 'C',
        poinA: 'Mempunyai jadwal dan rencana yang jelas',
        poinB: 'Bebas mengeksplorasi topik yang menarik',
        skorA: 'C',
        skorB: 'I',
        tahunPelajaran,
      },
      {
        nomor: 37,
        pertanyaan:
          'Kamu lebih suka tugas yang:',
        dimensi: 'C',
        poinA: 'Memiliki format dan aturan yang sudah ditentukan',
        poinB: 'Memberi kebebasan penuh untuk berkreasi',
        skorA: 'C',
        skorB: 'A',
        tahunPelajaran,
      },
      {
        nomor: 38,
        pertanyaan:
          'Dalam kelompok, kamu paling cocok menjadi:',
        dimensi: 'C',
        poinA: 'Pengelola data dan pencatat hasil rapat',
        poinB: 'Fasilitator yang memastikan semua anggota terlibat',
        skorA: 'C',
        skorB: 'S',
        tahunPelajaran,
      },
      {
        nomor: 39,
        pertanyaan:
          'Kamu lebih tertarik pada pekerjaan yang:',
        dimensi: 'C',
        poinA: 'Berkaitan dengan pengelolaan keuangan dan administrasi',
        poinB: 'Berkaitan dengan manajemen dan pengembangan bisnis',
        skorA: 'C',
        skorB: 'E',
        tahunPelajaran,
      },
      {
        nomor: 40,
        pertanyaan:
          'Hal yang paling membuatmu tenang adalah:',
        dimensi: 'C',
        poinA: 'Semuanya tersusun rapi dan teratur',
        poinB: 'Menemukan jawaban dari pertanyaan yang mengganjal',
        skorA: 'C',
        skorB: 'I',
        tahunPelajaran,
      },
    ];

    await db.soalTesMinatBakat.createMany({ data: questions });

    return NextResponse.json({ success: true, count: 40 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Gagal men-seed soal';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
