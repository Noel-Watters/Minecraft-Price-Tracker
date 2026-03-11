import { NextRequest, NextResponse } from "next/server";
import { Region } from "@/types/region"; // Adjust the import path if needed

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001"; // adjust as needed

// GET All regions
export async function GET(req: NextRequest) {
  const token = req.headers.get("authorization");
  const res = await fetch(`${BACKEND_URL}/admin/regions`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: token } : {}),
    },
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Failed to fetch regions" }, { status: res.status });
  }
  const data: { regions: Region[] } = await res.json();
  return NextResponse.json(data);
}

// POST Create Region
export async function POST(req: NextRequest) {
  try {
    const token = req.headers.get("authorization");
    const body = await req.json();
    const res = await fetch(`${BACKEND_URL}/admin/regions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify(body),
    });

    const data: Region = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "string"
        ? error
        : "Internal server error";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}