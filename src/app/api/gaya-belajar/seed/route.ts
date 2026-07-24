import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const VARK_QUESTIONS = [
  { nomor: 1, pertanyaan: "Saat guru menjelaskan materi baru, kamu lebih suka:", dimensi: "V/A", poinA: "Melihat diagram, grafik, atau peta konsep", poinB: "Mendengarkan penjelasan guru secara lisan", skorA: "V", skorB: "A" },
  { nomor: 2, pertanyaan: "Kamu sedang mempelajari topik yang sulit. Kamu akan:", dimensi: "A/R", poinA: "Mendiskusikan dengan teman atau guru", poinB: "Membaca buku teks atau catatan secara mendalam", skorA: "A", skorB: "R" },
  { nomor: 3, pertanyaan: "Untuk mengingat sesuatu dengan baik, kamu lebih suka:", dimensi: "R/K", poinA: "Menulis ulang dan membaca berkali-kali", poinB: "Mencoba langsung dengan praktik", skorA: "R", skorB: "K" },
  { nomor: 4, pertanyaan: "Saat belajar tentang struktur sel, kamu lebih suka:", dimensi: "V/K", poinA: "Melihat gambar atau video animasi sel", poinB: "Membuat model sel dari plastisin atau bahan lain", skorA: "V", skorB: "K" },
  { nomor: 5, pertanyaan: "Dalam kegiatan kelompok, kamu biasanya:", dimensi: "A/K", poinA: "Aktif berdiskusi dan menyampaikan pendapat", poinB: "Lebih suka langsung mempraktikkan tugas", skorA: "A", skorB: "K" },
  { nomor: 6, pertanyaan: "Untuk mempersiapkan ujian, kamu lebih suka:", dimensi: "V/R", poinA: "Membuat ringkasan berupa mind map atau diagram", poinB: "Membaca ulang catatan pelajaran", skorA: "V", skorB: "R" },
  { nomor: 7, pertanyaan: "Kamu paling mudah mengingat informasi jika:", dimensi: "A/V", poinA: "Mendengarnya dibacakan atau dijelaskan", poinB: "Melihatnya dalam bentuk tulisan atau gambar", skorA: "A", skorB: "V" },
  { nomor: 8, pertanyaan: "Saat mendapat tugas proyek, langkah pertama kamu:", dimensi: "R/A", poinA: "Membaca petunjuk dan panduan tertulis", poinB: "Bertanya dan berdiskusi dengan teman", skorA: "R", skorB: "A" },
  { nomor: 9, pertanyaan: "Dalam pelajaran olahraga, kamu lebih mudah belajar:", dimensi: "K/V", poinA: "Melihat demonstrasi gerakan dari guru", poinB: "Langsung mencoba gerakan tersebut", skorA: "V", skorB: "K" },
  { nomor: 10, pertanyaan: "Untuk belajar menggunakan alat baru, kamu lebih suka:", dimensi: "K/R", poinA: "Mencoba langsung menggunakannya", poinB: "Membaca manual penggunaannya terlebih dahulu", skorA: "K", skorB: "R" },
  { nomor: 11, pertanyaan: "Saat belajar kosakata bahasa asing, kamu lebih suka:", dimensi: "V/A", poinA: "Menggunakan flashcard bergambar", poinB: "Mendengarkan pengucapan dan mengulanginya", skorA: "V", skorB: "A" },
  { nomor: 12, pertanyaan: "Kamu lebih mudah memahami cerita jika:", dimensi: "A/K", poinA: "Mendengarkan seseorang menceritakannya", poinB: "Bermain peran atau menirukan adegannya", skorA: "A", skorB: "K" },
  { nomor: 13, pertanyaan: "Saat menulis esai, kamu lebih suka:", dimensi: "R/V", poinA: "Membuat outline dan poin-poin tertulis dulu", poinB: "Menggambar alur pikiran dalam bentuk diagram", skorA: "R", skorB: "V" },
  { nomor: 14, pertanyaan: "Untuk mengingat arah ke suatu tempat, kamu:", dimensi: "V/K", poinA: "Mengingat pemandangan dan landmark visual", poinB: "Pernah mengunjungi dan mengingat rutenya secara fisik", skorA: "V", skorB: "K" },
  { nomor: 15, pertanyaan: "Saat mengikuti pelajaran daring (online), kamu lebih suka:", dimensi: "A/R", poinA: "Mengikuti kelas via video conference langsung", poinB: "Membaca materi yang sudah disiapkan", skorA: "A", skorB: "R" },
  { nomor: 16, pertanyaan: "Dalam pelajaran seni, kamu lebih suka:", dimensi: "K/A", poinA: "Langsung memegang alat dan mulai berkarya", poinB: "Mendengarkan instruksi guru detail dulu", skorA: "K", skorB: "A" },
  { nomor: 17, pertanyaan: "Untuk memahami data statistik, kamu lebih suka:", dimensi: "V/R", poinA: "Melihat grafik, chart, atau infografis", poinB: "Membaca tabel dan angka-angkanya", skorA: "V", skorB: "R" },
  { nomor: 18, pertanyaan: "Saat belajar musik, kamu lebih suka:", dimensi: "A/K", poinA: "Mendengarkan rekaman dan menjelaskan nada", poinB: "Langsung bermain alat musik", skorA: "A", skorB: "K" },
  { nomor: 19, pertanyaan: "Untuk belajar resep masakan baru, kamu lebih suka:", dimensi: "R/K", poinA: "Membaca resep langkah demi langkah", poinB: "Langsung mencoba memasak sambil melihat", skorA: "R", skorB: "K" },
  { nomor: 20, pertanyaan: "Dalam presentasi kelompok, kamu lebih suka:", dimensi: "V/A", poinA: "Membuat slide yang menarik secara visual", poinB: "Menyampaikan presentasi secara lisan dengan percaya diri", skorA: "V", skorB: "A" },
  { nomor: 21, pertanyaan: "Saat belajar tentang tata surya, kamu lebih suka:", dimensi: "K/V", poinA: "Mengunjungi planetarium atau observatorium", poinB: "Melihat gambar dan video tentang planet", skorA: "K", skorB: "V" },
  { nomor: 22, pertanyaan: "Untuk memahami hukum fisika, kamu lebih suka:", dimensi: "A/R", poinA: "Mendengarkan penjelasan dan diskusi kelas", poinB: "Membaca buku teks fisika dan mengerjakan contoh soal", skorA: "A", skorB: "R" },
  { nomor: 23, pertanyaan: "Saat belajar anatomi tubuh manusia, kamu lebih suka:", dimensi: "V/K", poinA: "Melihat diagram dan model 3D tubuh", poinB: "Memegang dan mempelajari model organ tubuh", skorA: "V", skorB: "K" },
  { nomor: 24, pertanyaan: "Sebelum ujian, kamu biasanya menghabiskan waktu:", dimensi: "R/A", poinA: "Membaca dan merangkum materi tertulis", poinB: "Mengikuti bimbingan belajar atau diskusi kelompok", skorA: "R", skorB: "A" },
  { nomor: 25, pertanyaan: "Untuk belajar teknik pengelasan, kamu lebih suka:", dimensi: "K/V", poinA: "Melihat video tutorial langkah demi langkah", poinB: "Langsung mencoba mengelas dengan bimbingan", skorA: "V", skorB: "K" },
  { nomor: 26, pertanyaan: "Saat menonton dokumenter, kamu lebih suka:", dimensi: "A/K", poinA: "Mendengarkan narasi dan penjelasan ahli", poinB: "Melihat adegan nyata dan demonstrasi langsung", skorA: "A", skorB: "K" },
  { nomor: 27, pertanyaan: "Untuk membuat jadwal kegiatan, kamu lebih suka:", dimensi: "V/R", poinA: "Membuat kalender visual dengan warna dan ikon", poinB: "Membuat daftar dalam format teks terstruktur", skorA: "V", skorB: "R" },
  { nomor: 28, pertanyaan: "Dalam pelajaran kimia, kamu lebih suka:", dimensi: "R/K", poinA: "Membaca rumus dan teori dari buku", poinB: "Melakukan praktikum di laboratorium", skorA: "R", skorB: "K" },
  { nomor: 29, pertanyaan: "Untuk belajar tari tradisional, kamu lebih suka:", dimensi: "K/A", poinA: "Langsung menirukan gerakan penari", poinB: "Mendengarkan penjelasan langkah dari instruktur", skorA: "K", skorB: "A" },
  { nomor: 30, pertanyaan: "Saat menerima informasi penting, kamu lebih suka:", dimensi: "A/V", poinA: "Mendengarkan langsung dari pembicara", poinB: "Menerima informasi dalam bentuk memo atau pesan tertulis", skorA: "A", skorB: "V" },
];

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (session?.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const tahunPelajaran = body.tahunPelajaran || "2025/2026";

    // Check if questions already exist
    const existing = await db.soalGayaBelajar.count({
      where: { tahunPelajaran },
    });

    if (existing > 0) {
      return NextResponse.json({
        message: `Soal gaya belajar untuk ${tahunPelajaran} sudah ada (${existing} soal)`,
        count: existing,
      });
    }

    // Seed questions
    const data = VARK_QUESTIONS.map((q) => ({
      nomor: q.nomor,
      pertanyaan: q.pertanyaan,
      dimensi: q.dimensi,
      poinA: q.poinA,
      poinB: q.poinB,
      skorA: q.skorA,
      skorB: q.skorB,
      tahunPelajaran,
    }));

    const result = await db.soalGayaBelajar.createMany({ data });

    return NextResponse.json({
      message: `Berhasil menambahkan ${result.count} soal gaya belajar untuk ${tahunPelajaran}`,
      count: result.count,
    });
  } catch (error) {
    console.error("[GAYA BELAJAR SEED]", error);
    return NextResponse.json(
      { error: "Gagal menambahkan soal gaya belajar" },
      { status: 500 }
    );
  }
}
