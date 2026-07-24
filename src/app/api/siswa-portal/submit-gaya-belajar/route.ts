import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── VARK Description & Saran Mapping ──────────────────────────────────

const deskripsiMap: Record<string, string> = {
  V: "Kamu adalah tipe pembelajar Visual. Kamu belajar paling efektif melalui gambar, diagram, grafik, warna, dan representasi visual lainnya. Kamu mudah mengingat informasi yang dilihat dan menyukai organisasi informasi secara visual.",
  A: "Kamu adalah tipe pembelajar Auditory. Kamu belajar paling efektif melalui mendengarkan, berdiskusi, dan menjelaskan ide kepada orang lain. Kamu mudah mengingat informasi yang didengar dan menyukai lingkungan belajar yang interaktif.",
  R: "Kamu adalah tipe pembelajar Read/Write. Kamu belajar paling efektif melalui membaca teks, menulis catatan, dan mengerjakan latihan tertulis. Kamu lebih suka informasi dalam bentuk kata-kata, daftar, dan definisi yang jelas.",
  K: "Kamu adalah tipe pembelajar Kinestetik. Kamu belajar paling efektif melalui pengalaman langsung, praktik, dan eksplorasi fisik. Kamu mudah mengingat apa yang kamu lakukan dan menyukai belajar sambil bergerak.",
};

const saranBelajarMap: Record<string, string> = {
  V: "Gunakan warna, diagram, mind map, dan kode visual dalam catatan. Tonton video pembelajaran. Gunakan highlighter berwarna. Buat flashcard bergambar. Duduk di depan kelas agar bisa melihat guru dan papan tulis dengan jelas.",
  A: "Ikuti diskusi kelompok dan bimbingan belajar. Gunakan rekaman audio untuk belajar. Jelaskan materi kepada teman (teach-back method). Bacakan materi dengan suara keras. Gunakan mnemonic dan nyanyian untuk mengingat.",
  R: "Buat catatan yang rapi dan terstruktur. Buat daftar poin-poin penting. Kerjakan banyak latihan soal tertulis. Baca ulang materi berkali-kali. Gunakan kamus dan glosarium. Transformasikan diagram/grafik menjadi teks.",
  K: "Lakukan praktik langsung dan eksperimen. Gunakan simulasi dan permainan edukatif. Ambil jeda belajar untuk bergerak. Buat model atau prototype. Kunjungi lokasi terkait (museum, lab, lapangan). Belajar sambil melakukan aktivitas.",
};

// ─── POST: Submit gaya belajar test from student portal ────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      siswaId,
      siswaNama,
      nisn,
      rombel,
      jenisKelamin,
      tahunPelajaran,
      semester,
      jawaban,
      waktuKerja,
    } = body;

    if (!siswaId || !jawaban || !tahunPelajaran || !semester || !nisn) {
      return NextResponse.json(
        { error: "Data tidak lengkap" },
        { status: 400 }
      );
    }

    // Verify student exists
    const siswa = await db.siswa.findFirst({
      where: { id: siswaId, nisn, status: "Aktif" },
    });

    if (!siswa) {
      return NextResponse.json(
        { error: "Siswa tidak ditemukan" },
        { status: 404 }
      );
    }

    // Fetch questions
    const questions = await db.soalGayaBelajar.findMany({
      where: { tahunPelajaran },
      orderBy: { nomor: "asc" },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Belum ada soal gaya belajar untuk tahun pelajaran ini" },
        { status: 400 }
      );
    }

    // Calculate VARK scores
    const skor: Record<string, number> = { V: 0, A: 0, R: 0, K: 0 };

    for (const question of questions) {
      const key = String(question.nomor);
      const answer = jawaban[key] as "A" | "B" | undefined;

      if (answer === "A" && question.skorA) {
        const dim = question.skorA.toUpperCase().trim();
        if (skor[dim] !== undefined) {
          skor[dim] += 1;
        }
      } else if (answer === "B" && question.skorB) {
        const dim = question.skorB.toUpperCase().trim();
        if (skor[dim] !== undefined) {
          skor[dim] += 1;
        }
      }
    }

    // Sort scores descending
    const sorted = Object.entries(skor)
      .map(([dimensi, nilai]) => ({ dimensi, nilai }))
      .sort((a, b) => b.nilai - a.nilai);

    const dominan = sorted[0].dimensi;
    const kodeVARK = sorted.map((s) => s.dimensi).join("");
    const deskripsi = deskripsiMap[dominan] || "";
    const saranBelajar = saranBelajarMap[dominan] || "";
    const totalPoin = skor.V + skor.A + skor.R + skor.K;
    const totalSoal = questions.length;

    // Upsert result
    const result = await db.hasilGayaBelajar.upsert({
      where: {
        siswaId_tahunPelajaran_semester: {
          siswaId,
          tahunPelajaran,
          semester,
        },
      },
      create: {
        siswaId,
        siswaNama: siswaNama || siswa.nama,
        nisn: nisn || siswa.nisn,
        rombel: rombel || siswa.rombel,
        jenisKelamin: jenisKelamin || siswa.jenisKelamin,
        tahunPelajaran,
        semester,
        skorV: skor.V,
        skorA: skor.A,
        skorR: skor.R,
        skorK: skor.K,
        dominan,
        kodeVARK,
        deskripsi,
        saranBelajar,
        totalPoin,
        totalSoal,
        waktuKerja: waktuKerja || 0,
        dibuatOleh: "Siswa (Portal)",
      },
      update: {
        siswaNama: siswaNama || siswa.nama,
        nisn: nisn || siswa.nisn,
        rombel: rombel || siswa.rombel,
        jenisKelamin: jenisKelamin || siswa.jenisKelamin,
        skorV: skor.V,
        skorA: skor.A,
        skorR: skor.R,
        skorK: skor.K,
        dominan,
        kodeVARK,
        deskripsi,
        saranBelajar,
        totalPoin,
        totalSoal,
        waktuKerja: waktuKerja || 0,
        dibuatOleh: "Siswa (Portal)",
      },
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[SISWA PORTAL SUBMIT GAYA BELAJAR]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan hasil tes gaya belajar" },
      { status: 500 }
    );
  }
}
