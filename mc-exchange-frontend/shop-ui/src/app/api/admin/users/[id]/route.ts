import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";

type IdParams = Promise<{ id: string }>;

export async function PATCH(
  req: NextRequest,
  context: { params: IdParams }
) {
  try {
    const { id } = await context.params;

    const authorization = req.headers.get("authorization");
    if (!authorization) {
      return NextResponse.json({ error: "Authorization required" }, { status: 401 });
    }

    const body = await req.json();

    const res = await fetch(`${BACKEND_URL}/admin/users/${id}`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
        authorization, 
      },
      body: JSON.stringify(body),
    });

    const ct = res.headers.get("content-type") || "";
    const data =
      res.status === 204
        ? null
        : ct.includes("application/json")
        ? await res.json()
        : await res.text();

    return NextResponse.json(data, { status: res.status });
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : typeof error === "string" ? error : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
