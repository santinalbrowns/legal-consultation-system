import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const { pathname } = req.nextUrl

  // Public routes
  const isPublicRoute = pathname === "/" || pathname === "/login" || pathname === "/register"
  
  // If not logged in and trying to access protected route
  if (!isLoggedIn && !isPublicRoute) {
    const loginUrl = new URL("/login", req.url)
    return NextResponse.redirect(loginUrl)
  }

  // If logged in and trying to access login/register, redirect to dashboard
  if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
    const role = req.auth?.user?.role
    if (role === "CLIENT") {
      return NextResponse.redirect(new URL("/dashboard/client", req.url))
    } else if (role === "LAWYER") {
      return NextResponse.redirect(new URL("/dashboard/lawyer", req.url))
    } else if (role === "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}
