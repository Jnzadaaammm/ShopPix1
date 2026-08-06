import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = await auth();
  const { action, path, details } = await req.json().catch(() => ({}));

  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

  await prisma.activityLog.create({
    data: {
      userId: session?.user?.id,
      action: action || "page_view",
      path: path || req.nextUrl.pathname,
      ip,
      details: details ? JSON.stringify(details) : undefined,
    },
  });

  return NextResponse.json({ success: true });
}
