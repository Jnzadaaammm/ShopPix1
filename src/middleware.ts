import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    !pathname.startsWith("/api") &&
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/favicon") &&
    !pathname.includes(".")
  ) {
    const url = new URL("/api/activity", request.url);
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";

    try {
      const cookie = request.headers.get("cookie") || "";
      await Promise.race([
        fetch(url.toString(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            cookie,
          },
          body: JSON.stringify({ action: "page_view", path: pathname, ip }),
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 2500)),
      ]);
    } catch {
      // ignora
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|_next/webpack-hmr).*)"],
};
