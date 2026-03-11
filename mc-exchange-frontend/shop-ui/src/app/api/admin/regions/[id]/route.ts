import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

type IdParams = Promise<{ id: string }>;

export async function PATCH(
  req: NextRequest,
  context: { params: IdParams }
) {
  try {
    const { id } = await context.params;
    const body = await req.json();

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    const auth = req.headers.get("authorization");
    if (auth) headers["authorization"] = auth;

    const res = await fetch(`${BACKEND_URL}/admin/regions/${id}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(body),
    });

    // Safely handle non-JSON/empty bodies
    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = res.status === 204 ? null : (isJson ? await res.json() : await res.text());

    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message :
      typeof error === "string" ? error :
      "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: IdParams }
) {
  try {
    const { id } = await context.params;

    const headers: Record<string, string> = {};
    const auth = req.headers.get("authorization");
    if (auth) headers["authorization"] = auth;

    const res = await fetch(`${BACKEND_URL}/admin/regions/${id}`, {
      method: "DELETE",
      headers,
    });

    const isJson = res.headers.get("content-type")?.includes("application/json");
    const data = res.status === 204 ? null : (isJson ? await res.json() : await res.text());

    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message :
      typeof error === "string" ? error :
      "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
