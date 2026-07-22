import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

// ─── POST: Seed kalender pendidikan holidays ──────────────────────────────
// Seeds all dates from Kalender Pendidikan TA 2026/2027
// Requires admin role
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const role = (session.user as { role?: string })?.role || "";
    if (role !== "admin") {
      return NextResponse.json({ error: "Hanya admin yang bisa seed data" }, { status: 403 });
    }

    const body = await req.json();
    const tahunPelajaran = body.tahunPelajaran || "2026/2027";

    // Clear existing data for this tahun pelajaran
    await db.hariLibur.deleteMany({ where: { tahunPelajaran } });

    // All holiday data from Kalender Pendidikan TA 2026/2027
    // Dinas Pendidikan Provinsi Sumatera Utara
    // 10 kategori sesuai legend kalender
    const holidays: { tanggal: string; label: string; kategori: string }[] = [
      // ═══════════════════════════════════════════════════════════
      // JULI 2026
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2026-07-09", label: "MPLS Ramah Khusus SLB", kategori: "Hari Pertama Masuk" },
      { tanggal: "2026-07-13", label: "Hari Pertama Masuk Sekolah", kategori: "Hari Pertama Masuk" },
      { tanggal: "2026-07-14", label: "MPLS Ramah Umum", kategori: "Hari Pertama Masuk" },
      { tanggal: "2026-07-15", label: "MPLS Ramah Umum", kategori: "Hari Pertama Masuk" },
      { tanggal: "2026-07-16", label: "MPLS Ramah Umum", kategori: "Hari Pertama Masuk" },
      { tanggal: "2026-07-17", label: "MPLS Ramah Umum", kategori: "Hari Pertama Masuk" },

      // ═══════════════════════════════════════════════════════════
      // AGUSTUS 2026
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2026-08-17", label: "Hari Kemerdekaan RI", kategori: "Libur Nasional" },
      { tanggal: "2026-08-25", label: "Maulid Nabi Muhammad S.A.W", kategori: "Libur Nasional" },

      // ═══════════════════════════════════════════════════════════
      // SEPTEMBER 2026
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2026-09-14", label: "Asesmen Diagnostik", kategori: "Asesmen" },
      { tanggal: "2026-09-15", label: "Asesmen Diagnostik", kategori: "Asesmen" },
      { tanggal: "2026-09-16", label: "Asesmen Diagnostik", kategori: "Asesmen" },
      { tanggal: "2026-09-17", label: "Asesmen Diagnostik", kategori: "Asesmen" },
      { tanggal: "2026-09-18", label: "Asesmen Diagnostik", kategori: "Asesmen" },
      { tanggal: "2026-09-19", label: "Asesmen Diagnostik", kategori: "Asesmen" },

      // ═══════════════════════════════════════════════════════════
      // OKTOBER 2026
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2026-10-26", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },
      { tanggal: "2026-10-27", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },
      { tanggal: "2026-10-28", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },
      { tanggal: "2026-10-29", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },
      { tanggal: "2026-10-30", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },
      { tanggal: "2026-10-31", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },

      // ═══════════════════════════════════════════════════════════
      // NOVEMBER 2026
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2026-11-02", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },
      { tanggal: "2026-11-03", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },
      { tanggal: "2026-11-04", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },
      { tanggal: "2026-11-05", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },
      { tanggal: "2026-11-06", label: "Perkiraan Pelaksanaan TKA", kategori: "Perkiraan TKA" },
      { tanggal: "2026-11-25", label: "Hari Guru Nasional", kategori: "Hari Guru" },
      { tanggal: "2026-11-30", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },

      // ═══════════════════════════════════════════════════════════
      // DESEMBER 2026
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2026-12-01", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },
      { tanggal: "2026-12-02", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },
      { tanggal: "2026-12-03", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },
      { tanggal: "2026-12-04", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },
      { tanggal: "2026-12-05", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },
      { tanggal: "2026-12-06", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },
      { tanggal: "2026-12-07", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },
      { tanggal: "2026-12-08", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },
      { tanggal: "2026-12-09", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },
      { tanggal: "2026-12-10", label: "Asesmen Akhir Semester Ganjil", kategori: "Asesmen" },
      { tanggal: "2026-12-18", label: "Penyerahan Rapor Semester Ganjil", kategori: "Penyerahan Rapor" },
      { tanggal: "2026-12-21", label: "Libur Semester Ganjil", kategori: "Libur Semester" },
      { tanggal: "2026-12-22", label: "Libur Semester Ganjil", kategori: "Libur Semester" },
      { tanggal: "2026-12-23", label: "Libur Semester Ganjil", kategori: "Libur Semester" },
      { tanggal: "2026-12-24", label: "Hari Raya Natal (Libur Khusus)", kategori: "Libur Khusus" },
      { tanggal: "2026-12-25", label: "Hari Raya Natal / Kelahiran Yesus Kristus", kategori: "Libur Nasional" },
      { tanggal: "2026-12-26", label: "Libur Semester Ganjil", kategori: "Libur Semester" },
      { tanggal: "2026-12-27", label: "Libur Semester Ganjil", kategori: "Libur Semester" },
      { tanggal: "2026-12-28", label: "Libur Semester Ganjil", kategori: "Libur Semester" },
      { tanggal: "2026-12-29", label: "Libur Semester Ganjil", kategori: "Libur Semester" },
      { tanggal: "2026-12-30", label: "Libur Semester Ganjil", kategori: "Libur Semester" },
      { tanggal: "2026-12-31", label: "Libur Semester Ganjil", kategori: "Libur Semester" },

      // ═══════════════════════════════════════════════════════════
      // JANUARI 2027
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2027-01-01", label: "Tahun Baru 2027 Masehi", kategori: "Libur Nasional" },
      { tanggal: "2027-01-04", label: "Hari Pertama Masuk Semester Genap", kategori: "Hari Pertama Masuk" },
      { tanggal: "2027-01-05", label: "Isra Mikraj Nabi Muhammad S.A.W", kategori: "Libur Nasional" },

      // ═══════════════════════════════════════════════════════════
      // FEBRUARI 2027
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2027-02-06", label: "Tahun Baru Imlek 2578 Kongzili", kategori: "Libur Nasional" },
      { tanggal: "2027-02-08", label: "Cuti Bersama Awal Puasa", kategori: "Libur Semester" },
      { tanggal: "2027-02-09", label: "Cuti Bersama Awal Puasa", kategori: "Libur Semester" },
      { tanggal: "2027-02-10", label: "Cuti Bersama Awal Puasa", kategori: "Libur Semester" },

      // ═══════════════════════════════════════════════════════════
      // MARET 2027
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2027-03-01", label: "Asesmen Tengah Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-03-02", label: "Asesmen Tengah Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-03-03", label: "Asesmen Tengah Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-03-04", label: "Asesmen Tengah Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-03-05", label: "Asesmen Tengah Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-03-09", label: "Hari Suci Nyepi Tahun Baru Saka 1949", kategori: "Libur Khusus" },
      { tanggal: "2027-03-10", label: "Hari Raya Idul Fitri 1448 H", kategori: "Libur Nasional" },
      { tanggal: "2027-03-11", label: "Hari Raya Idul Fitri 1448 H", kategori: "Libur Nasional" },
      { tanggal: "2027-03-12", label: "Cuti Bersama Idul Fitri", kategori: "Libur Khusus" },
      { tanggal: "2027-03-15", label: "Cuti Bersama Idul Fitri", kategori: "Libur Khusus" },
      { tanggal: "2027-03-16", label: "Cuti Bersama Idul Fitri", kategori: "Libur Khusus" },
      { tanggal: "2027-03-18", label: "Cuti Bersama Idul Fitri", kategori: "Libur Khusus" },
      { tanggal: "2027-03-20", label: "Cuti Bersama Idul Fitri", kategori: "Libur Khusus" },
      { tanggal: "2027-03-26", label: "Wafat Yesus Kristus", kategori: "Libur Nasional" },

      // ═══════════════════════════════════════════════════════════
      // APRIL 2027
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2027-04-11", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-12", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-13", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-14", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-15", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-16", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-17", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-18", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-19", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-20", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-21", label: "Asesmen Sekolah", kategori: "Asesmen" },
      { tanggal: "2027-04-22", label: "Asesmen Sekolah", kategori: "Asesmen" },

      // ═══════════════════════════════════════════════════════════
      // MEI 2027
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2027-05-01", label: "Hari Buruh Internasional", kategori: "Libur Nasional" },
      { tanggal: "2027-05-02", label: "Hari Pendidikan Nasional", kategori: "Hari Pendidikan Nasional" },
      { tanggal: "2027-05-03", label: "Pengumuman Kelulusan", kategori: "Penyerahan Rapor" },
      { tanggal: "2027-05-06", label: "Kenaikan Yesus Kristus", kategori: "Libur Nasional" },
      { tanggal: "2027-05-17", label: "Hari Raya Idul Adha 1448 H", kategori: "Libur Nasional" },
      { tanggal: "2027-05-18", label: "Cuti Bersama Idul Adha", kategori: "Libur Khusus" },
      { tanggal: "2027-05-20", label: "Hari Raya Waisak 2571 BE", kategori: "Libur Nasional" },

      // ═══════════════════════════════════════════════════════════
      // JUNI 2027
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2027-06-01", label: "Hari Lahir Pancasila", kategori: "Libur Nasional" },
      { tanggal: "2027-06-06", label: "Tahun Baru Islam 1449 H", kategori: "Libur Semester" },
      { tanggal: "2027-06-02", label: "Asesmen Akhir Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-06-03", label: "Asesmen Akhir Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-06-04", label: "Asesmen Akhir Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-06-05", label: "Asesmen Akhir Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-06-07", label: "Asesmen Akhir Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-06-08", label: "Asesmen Akhir Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-06-09", label: "Asesmen Akhir Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-06-10", label: "Asesmen Akhir Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-06-11", label: "Asesmen Akhir Semester Genap", kategori: "Asesmen" },
      { tanggal: "2027-06-18", label: "Penyerahan Rapor Semester Genap", kategori: "Penyerahan Rapor" },
      { tanggal: "2027-06-20", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-06-21", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-06-22", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-06-23", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-06-24", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-06-25", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-06-26", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-06-27", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-06-28", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-06-29", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-06-30", label: "Libur Semester Genap", kategori: "Libur Semester" },

      // ═══════════════════════════════════════════════════════════
      // JULI 2027
      // ═══════════════════════════════════════════════════════════
      { tanggal: "2027-07-01", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-07-02", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-07-03", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-07-04", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-07-05", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-07-06", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-07-07", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-07-08", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-07-09", label: "Libur Semester Genap", kategori: "Libur Semester" },
      { tanggal: "2027-07-12", label: "Hari Pertama Masuk Sekolah TA Baru", kategori: "Hari Pertama Masuk" },
    ];

    // Bulk upsert
    let count = 0;
    for (const item of holidays) {
      try {
        await db.hariLibur.upsert({
          where: { tanggal_tahunPelajaran: { tanggal: item.tanggal, tahunPelajaran } },
          create: { tanggal: item.tanggal, label: item.label, kategori: item.kategori, tahunPelajaran },
          update: { label: item.label, kategori: item.kategori },
        });
        count++;
      } catch (e) {
        console.error(`Failed to upsert ${item.tanggal}:`, e);
      }
    }

    return NextResponse.json({
      success: true,
      count,
      message: `Berhasil menyimpan ${count} hari libur untuk TA ${tahunPelajaran}`,
    });
  } catch (error) {
    console.error("[LIBUR SEED]", error);
    return NextResponse.json({ error: "Gagal seed data kalender" }, { status: 500 });
  }
}
