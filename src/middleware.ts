import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const isLoggedIn = !!req.auth
  const isLoginPage = req.nextUrl.pathname.startsWith('/login')

  // If logged in and on login page, redirect to home
  if (isLoggedIn && isLoginPage) {
    return NextResponse.redirect(new URL('/', req.nextUrl))
  }

  // If not logged in and NOT on login page, redirect to login
  if (!isLoggedIn && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', req.nextUrl))
  }
})

export const config = {
  // Matcher ignoring static files and API routes
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|icon.png|font/.*).*)'],
}
