import { authOptions } from "@/lib/auth";

export async function GET(request: Request, context: { params: Promise<Record<string, string | string[]>> }) {
  const { default: NextAuth } = await import("next-auth");
  return NextAuth(authOptions)(request, context as any);
}

export async function POST(request: Request, context: { params: Promise<Record<string, string | string[]>> }) {
  const { default: NextAuth } = await import("next-auth");
  return NextAuth(authOptions)(request, context as any);
}