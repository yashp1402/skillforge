// middleware.ts
export { auth as middleware } from "@/auth";

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/skills/:path*",
    "/jobs/:path*",
    "/goals/:path*",
    "/applications/:path*",
  ],
};