import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Proxy image bytes so html2canvas can read them without CORS issues.
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'Missing url param' }, { status: 400 })
  }

  // Only allow http(s) and a known list of hosts to prevent SSRF
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }
  const allowedHosts = ['image.pollinations.ai']
  if (!allowedHosts.includes(parsed.hostname)) {
    return NextResponse.json({ error: 'Host not allowed' }, { status: 403 })
  }

  try {
    const upstream = await fetch(parsed.toString(), { cache: 'no-store' })
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: 502 },
      )
    }
    const buf = await upstream.arrayBuffer()
    const contentType = upstream.headers.get('content-type') || 'image/png'
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Fetch failed' }, { status: 500 })
  }
}
