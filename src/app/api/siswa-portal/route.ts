import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// ─── POST: Verify student by NISN ──────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nisn } = body;

    if (!nisn) {
      return NextResponse.json(
        { error: "NISN wajib diisi" },
        { status: 400 }
      );
    }

    const siswa = await db.siswa.findFirst({
      where: {
        nisn,
        status: "Aktif",
      },
      select: {
        id: true,
        nama: true,
        nisn: true,
        nipd: true,
        jenisKelamin: true,
        rombel: true,
        tahunPelajaran: true,
        semester: true,
        tempatLahir: true,
        tanggalLahir: true,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!siswa) {
      return NextResponse.json(
        { error: "NISN tidak ditemukan atau siswa tidak aktif" },
        { status: 404 }
      );
    }

    return NextResponse.json({ siswa });
  } catch (error) {
    console.error("[SISWA PORTAL VERIFY]", error);
    return NextResponse.json(
      { error: "Gagal memverifikasi NISN" },
      { status: 500 }
    );
  }
}
