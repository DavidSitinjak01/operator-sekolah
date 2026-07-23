import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// GET — fetch all links
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role || "";
    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const links = await db.linkPenting.findMany({
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(links);
  } catch (error) {
    console.error("GET /api/link-penting error:", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

// POST — create new link
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role || "";
    const username = (session?.user as { name?: string })?.name || "";

    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { judul, url, deskripsi, kategori, icon } = body;

    if (!judul?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Judul dan URL wajib diisi" }, { status: 400 });
    }

    // Ensure URL has protocol
    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    const link = await db.linkPenting.create({
      data: {
        judul: judul.trim(),
        url: finalUrl,
        deskripsi: deskripsi?.trim() || "",
        kategori: kategori?.trim() || "Lainnya",
        icon: icon?.trim() || "Link",
        dibuatOleh: username,
      },
    });

    return NextResponse.json(link, { status: 201 });
  } catch (error) {
    console.error("POST /api/link-penting error:", error);
    return NextResponse.json({ error: "Gagal menyimpan link" }, { status: 500 });
  }
}

// PUT — update link
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role || "";

    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { id, judul, url, deskripsi, kategori, icon } = body;

    if (!id || !judul?.trim() || !url?.trim()) {
      return NextResponse.json({ error: "Data tidak lengkap" }, { status: 400 });
    }

    let finalUrl = url.trim();
    if (!finalUrl.startsWith("http://") && !finalUrl.startsWith("https://")) {
      finalUrl = "https://" + finalUrl;
    }

    const link = await db.linkPenting.update({
      where: { id },
      data: {
        judul: judul.trim(),
        url: finalUrl,
        deskripsi: deskripsi?.trim() || "",
        kategori: kategori?.trim() || "Lainnya",
        icon: icon?.trim() || "Link",
      },
    });

    return NextResponse.json(link);
  } catch (error) {
    console.error("PUT /api/link-penting error:", error);
    return NextResponse.json({ error: "Gagal memperbarui link" }, { status: 500 });
  }
}

// DELETE — delete link
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const role = (session?.user as { role?: string })?.role || "";

    if (role !== "admin" && role !== "operator") {
      return NextResponse.json({ error: "Akses ditolak" }, { status: 403 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 });
    }

    await db.linkPenting.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/link-penting error:", error);
    return NextResponse.json({ error: "Gagal menghapus link" }, { status: 500 });
  }
}
