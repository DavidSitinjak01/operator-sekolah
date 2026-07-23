import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── RIASEC Jurusan Recommendation Mapping ──────────────────────────────────

const jurusanMap: Record<
  string,
  { sma: string; kuliah: string }
> = {
  R: {
    sma: "Teknik Mesin, Teknik Elektro, Teknik Bangunan, Teknik Otomotif, Pertanian, Teknik Pengelasan, Teknik Komputer dan Jaringan",
    kuliah:
      "Teknik Mesin, Teknik Elektro, Teknik Sipil, Teknik Pertanian, Teknik Geofisika, Teknik Kelautan, Teknik Penerbangan",
  },
  I: {
    sma: "IPA, MIPA, Kimia, Fisika, Biologi, Matematika, Informatika",
    kuliah:
      "Kedokteran, Farmasi, Kedokteran Gigi, Biologi, Kimia, Fisika, Matematika, Statistika, Ilmu Komputer, Riset Ilmiah",
  },
  A: {
    sma: "Seni Rupa, Seni Musik, Seni Tari, Desain Komunikasi Visual, Animasi, Broadcasting",
    kuliah:
      "Desain Produk, Desain Interior, Arsitektur, Seni Rupa, Musik, Film & Televisi, Desain Komunikasi Visual, Animasi, Sastra",
  },
  S: {
    sma: "IPS, Sosiologi, Ekonomi, Geografi, Pendidikan, Keperawatan",
    kuliah:
      "Pendidikan (semua bidang), Psikologi, Keperawatan, Kesehatan Masyarakat, Pekerjaan Sosial, Sosiologi, Konseling, Hubungan Masyarakat",
  },
  E: {
    sma: "IPS, Ekonomi, Manajemen, Akuntansi, Administrasi Perkantoran",
    kuliah:
      "Manajemen, Akuntansi, Hukum, Administrasi Bisnis, Marketing, Entrepreneurship, Hubungan Internasional, Politik, komunikasi Bisnis",
  },
  C: {
    sma: "IPS, Akuntansi, Administrasi Perkantoran, Otomatisasi Tata Kelola",
    kuliah:
      "Akuntansi, Sistem Informasi, Manajemen, Perpajakan, Keuangan, Administrasi Publik, Statistik, Arsiparis",
  },
};

// ─── RIASEC Description Mapping ────────────────────────────────────────────

const deskripsiMap: Record<string, string> = {
  R: "Kamu adalah orang yang praktis dan suka bekerja dengan tangan. Kamu lebih nyaman dengan pekerjaan yang melibatkan aktivitas fisik, penggunaan alat, mesin, atau teknologi. Karakter cocok: Teknik, mekanik, atlet, petani.",
  I: "Kamu adalah orang yang suka menganalisis dan memecahkan masalah. Kamu penasaran tentang bagaimana dan mengapa sesuatu bekerja, serta menikmati aktivitas ilmiah dan riset. Karakter cocok: Ilmuwan, peneliti, dokter, programmer.",
  A: "Kamu adalah orang yang kreatif dan imajinatif. Kamu menikmati aktivitas seni, memiliki kemampuan ekspresif, dan suka lingkungan yang fleksibel dan tidak terstruktur. Karakter cocok: Seniman, desainer, musisi, arsitek.",
  S: "Kamu adalah orang yang peduli dan suka membantu orang lain. Kamu memiliki empati tinggi dan menikmati pekerjaan yang melibatkan interaksi sosial, pendidikan, atau pelayanan. Karakter cocok: Guru, konselor, perawat, pekerja sosial.",
  E: "Kamu adalah orang yang percaya diri dan suka memimpin. Kamu memiliki kemampuan persuasif, menyukai tantangan, dan nyaman dalam situasi kompetitif. Karakter cocok: Pengusaha, manajer, pengacara, politisi.",
  C: "Kamu adalah orang yang teratur dan detail. Kamu suka bekerja dengan data, mengikuti prosedur yang jelas, dan menikmati lingkungan kerja yang terstruktur. Karakter cocok: Akuntan, administrasi, analis data, programmer.",
};

// ─── POST: Submit tes minat bakat ───────────────────────────────────────────
// Protected (admin/operator only)
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

    // Validate required fields
    if (!siswaId || !jawaban || !tahunPelajaran || !semester) {
      return NextResponse.json(
        { error: "siswaId, jawaban, tahunPelajaran, dan semester wajib diisi" },
        { status: 400 }
      );
    }

    // Step 1: Fetch all questions for the given tahunPelajaran
    const questions = await db.soalTesMinatBakat.findMany({
      where: { tahunPelajaran },
      orderBy: { nomor: "asc" },
    });

    if (questions.length === 0) {
      return NextResponse.json(
        { error: "Belum ada soal untuk tahun pelajaran ini" },
        { status: 400 }
      );
    }

    // Step 2-3: Process answers and calculate RIASEC scores
    const skor: Record<string, number> = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

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

    // Step 4: Sort scores descending to find dominan1, dominan2, dominan3
    const sorted = Object.entries(skor)
      .map(([dimensi, nilai]) => ({ dimensi, nilai }))
      .sort((a, b) => b.nilai - a.nilai);

    const dominan1 = sorted[0].dimensi;
    const dominan2 = sorted[1].dimensi;
    const dominan3 = sorted[2].dimensi;

    // Step 5: Build kodeRIASEC from top 3
    const kodeRIASEC = `${dominan1}${dominan2}${dominan3}`;

    // Step 6: Generate rekomendasiJurusan based on top 3 dimensions
    const topDimensions = [dominan1, dominan2, dominan3];
    const smaList: string[] = [];
    const kuliahList: string[] = [];

    for (const dim of topDimensions) {
      const mapping = jurusanMap[dim];
      if (mapping) {
        smaList.push(mapping.sma);
        kuliahList.push(mapping.kuliah);
      }
    }

    const rekomendasiJurusan = `SMA/SMK: ${smaList.join(" | ")}\nKuliah: ${kuliahList.join(" | ")}`;

    // Step 7: Generate deskripsi based on dominan1
    const deskripsi = deskripsiMap[dominan1] || "";

    // Calculate totals
    const totalPoin = skor.R + skor.I + skor.A + skor.S + skor.E + skor.C;
    const totalSoal = questions.length;
    const operatorName = (session.user as { name?: string })?.name || "";

    // Step 8: Upsert to HasilTesMinatBakat
    const result = await db.hasilTesMinatBakat.upsert({
      where: {
        siswaId_tahunPelajaran_semester: {
          siswaId,
          tahunPelajaran,
          semester,
        },
      },
      create: {
        siswaId,
        siswaNama: siswaNama || "",
        nisn: nisn || "",
        rombel: rombel || "",
        jenisKelamin: jenisKelamin || "",
        tahunPelajaran,
        semester,
        skorR: skor.R,
        skorI: skor.I,
        skorA: skor.A,
        skorS: skor.S,
        skorE: skor.E,
        skorC: skor.C,
        dominan1,
        dominan2,
        dominan3,
        kodeRIASEC,
        rekomendasiJurusan,
        deskripsi,
        totalPoin,
        totalSoal,
        waktuKerja: waktuKerja || 0,
        dibuatOleh: operatorName,
      },
      update: {
        siswaNama: siswaNama || "",
        nisn: nisn || "",
        rombel: rombel || "",
        jenisKelamin: jenisKelamin || "",
        skorR: skor.R,
        skorI: skor.I,
        skorA: skor.A,
        skorS: skor.S,
        skorE: skor.E,
        skorC: skor.C,
        dominan1,
        dominan2,
        dominan3,
        kodeRIASEC,
        rekomendasiJurusan,
        deskripsi,
        totalPoin,
        totalSoal,
        waktuKerja: waktuKerja || 0,
        dibuatOleh: operatorName,
      },
    });

    // Step 9: Return the result
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("[TES MINAT BAKAT SUBMIT]", error);
    return NextResponse.json(
      { error: "Gagal menyimpan hasil tes minat bakat" },
      { status: 500 }
    );
  }
}
