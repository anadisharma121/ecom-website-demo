import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const path = req.nextUrl.pathname;

    // Admin routes protection
    if (path.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/store", req.url));
    }

    // Store routes protection (must be logged in)
    if (path.startsWith("/store") && !token) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const path = req.nextUrl.pathname;
        
        // Allow login page without auth
        if (path === "/login" || path === "/") return true;
        
        // All other routes need auth
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/store/:path*"],
};
