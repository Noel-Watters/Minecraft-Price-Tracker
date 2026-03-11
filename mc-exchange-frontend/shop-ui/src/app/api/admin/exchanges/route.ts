import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:300";

export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization");
  const search = req.nextUrl.search;
  const url = `${BACKEND_URL}/admin/exchanges${search}`;

  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch  {
    return NextResponse.json({ error: "Invalid JSON from backend", details: text }, { status: 500 });
  }

  return NextResponse.json(data, { status: res.status });
}