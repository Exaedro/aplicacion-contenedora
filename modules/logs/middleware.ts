import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // This is a client-side auth system, so we just allow all requests
  // In a real app, you'd validate tokens here
  return NextResponse.next()
}

export const config = {
  matcher: ["/dashboard/:path*"],
}
