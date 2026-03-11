import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

// GET /api/user/exchanges
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Build the backend URL with all query params
  const url = `${BACKEND_URL}/user/exchanges?${searchParams.toString()}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch exchanges" }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json(data);
}