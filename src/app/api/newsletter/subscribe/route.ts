import { NextResponse } from "next/server";
import prisma from "@/lib/db";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function POST(request: Request) {
  let body: { email?: string; source?: string } = {};

  try {
    body = (await request.json()) as { email?: string; source?: string };
  } catch {
    return NextResponse.json({ success: false, message: "Invalid JSON payload." }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase();
  const source = body.source?.trim() || "footer";

  if (!email || !isValidEmail(email)) {
    return NextResponse.json({ success: false, message: "Please provide a valid email." }, { status: 400 });
  }

  const tokenExpires = new Date();
  tokenExpires.setDate(tokenExpires.getDate() + 30);

  try {
    await prisma.newsletterSubscriber.upsert({
      where: { email },
      update: {
        status: "active",
        source,
        tokenExpires,
        unsubscribedAt: null,
      },
      create: {
        email,
        source,
        tokenExpires,
      },
    });

    return NextResponse.json({ success: true, message: "Subscribed successfully." });
  } catch (error) {
    console.error("Newsletter subscribe failed", error);
    return NextResponse.json(
      { success: false, message: "Could not subscribe at this time. Please try again." },
      { status: 500 }
    );
  }
}
