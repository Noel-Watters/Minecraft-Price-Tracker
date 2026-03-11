import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

type IdParams = Promise<{ id: string }>;

function requireAuth(req: NextRequest) {
  const authorization = req.headers.get('authorization');
  if (!authorization) {
    return { error: NextResponse.json({ error: 'Authorization required' }, { status: 401 }) };
  }
  return { authorization };
}

// GET /api/regions/[id]/shops
export async function GET(request: NextRequest, context: { params: IdParams }) {
  const { authorization, error } = requireAuth(request);
  if (error) return error;

  const { id } = await context.params;

  const response = await axios.get(`${BACKEND_URL}/owner/regions/${id}/shops`, {
    headers: { Authorization: authorization!, 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  return NextResponse.json(response.data ?? null, { status: response.status });
}

// PATCH /api/regions/[id]/shops
export async function PATCH(request: NextRequest, context: { params: IdParams }) {
  const { authorization, error } = requireAuth(request);
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();

  const response = await axios.patch(`${BACKEND_URL}/owner/regions/${id}/shops`, body, {
    headers: { Authorization: authorization!, 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  return NextResponse.json(response.data ?? null, { status: response.status });
}

// POST /api/regions/[id]/shops
export async function POST(request: NextRequest, context: { params: IdParams }) {
  const { authorization, error } = requireAuth(request);
  if (error) return error;

  const { id } = await context.params;
  const body = await request.json();

  const response = await axios.post(`${BACKEND_URL}/owner/regions/${id}/shops`, body, {
    headers: { Authorization: authorization!, 'Content-Type': 'application/json' },
    validateStatus: () => true,
  });

  return NextResponse.json(response.data ?? null, { status: response.status });
}

// DELETE /api/regions/[id]/shops
export async function DELETE(request: NextRequest, context: { params: IdParams }) {
  const { authorization, error } = requireAuth(request);
  if (error) return error;

  const { id } = await context.params;
  // if your backend expects a body for DELETE:
  const body = await request.json().catch(() => undefined);

  const response = await axios.delete(`${BACKEND_URL}/owner/regions/${id}/shops`, {
    headers: { Authorization: authorization!, 'Content-Type': 'application/json' },
    data: body,
    validateStatus: () => true,
  });

  return NextResponse.json(response.data ?? null, { status: response.status });
}
