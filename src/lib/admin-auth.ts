import { auth } from "@/auth";
import { NextResponse } from "next/server";

const UNAUTHORIZED = NextResponse.json(
  { success: false, message: "Unauthorized" },
  { status: 401 }
);

export async function requireAdmin(): Promise<NextResponse | null> {
  const session = await auth();

  if (!session?.user) return UNAUTHORIZED;
  if ((session.user as { role?: string }).role !== "admin") return UNAUTHORIZED;

  return null;
}
