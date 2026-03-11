import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3001';

// GET /api/user/regions/[slug]/shops
export async function GET(req: NextRequest) {
  try {
    const segments = req.nextUrl.pathname.split('/');
    const regionSlug = segments[segments.length - 2];

    const res = await fetch(`${BACKEND_URL}/user/regions/${regionSlug}/shops`, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(
        { error: errorData.error || 'Failed to fetch shops for region' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  }catch (e: unknown) {
    const message =
      e instanceof Error
        ? e.message
        : typeof e === "string"
        ? e
        : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}