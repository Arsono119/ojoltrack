import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

export default async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const isPlaceholder = !url || url.includes("placeholder");

  // If Supabase not configured (placeholder), allow all (so local dev not blocked)
  // Once real env set in Vercel, enforce paksa login
  if (isPlaceholder) return supabaseResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) { cookiesToSet.forEach(({ name, value, options }) => supabaseResponse.cookies.set(name, value, options)); },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;
  const isAuthPage = path === "/login" || path.startsWith("/login");
  const isPublicAsset = path.startsWith("/_next") || path === "/favicon.ico" || path === "/manifest.webmanifest" || path.startsWith("/icons");

  if (!user && !isAuthPage && !isPublicAsset) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", path);
    return NextResponse.redirect(loginUrl);
  }
  if (user && isAuthPage) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }
  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|manifest.webmanifest|icons).*)"],
};
