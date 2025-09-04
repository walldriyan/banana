export { default } from "next-auth/middleware"

// The middleware will protect all routes by default
// We are excluding the login page from protection to avoid a redirect loop
export const config = { 
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - login (the login page)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
    ] 
}
