import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )
  
  // Refresh session if expired
  await supabase.auth.getSession()
  
  const url = req.nextUrl.clone()
  
  // Check if the request is for an image from the old domain
  if (url.pathname.includes('auth.ravahq.com')) {
    // Rewrite to new domain
    const newPath = url.pathname.replace('auth.ravahq.com', 'auth.beam.new')
    url.pathname = newPath
    return NextResponse.rewrite(url)
  }
  
  // Handle relative image paths
  if (url.pathname.startsWith('/abcs') && !url.pathname.includes('auth.beam.new')) {
    // Rewrite to include full path with new domain
    url.pathname = `https://auth.beam.new/storage/v1/object/beamdata${url.pathname}`
    return NextResponse.rewrite(url)
  }
  
  return res
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 