import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:5000';

// GET /api/regions
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    if (!authorization) {
      return NextResponse.json(
        { error: 'Authorization required' },
        { status: 401 }
      );
    }

    const response = await axios.get(`${BACKEND_URL}/owner/regions`, {
      headers: {
        'Authorization': authorization,
        'Content-Type': 'application/json'
      }
    });

    return NextResponse.json(response.data, { status: response.status });
  } catch (error: unknown) {
    let message = 'Internal server error';
    let status = 500;
    if (axios.isAxiosError(error)) {
      message = error.response?.data?.details || error.message || message;
      status = error.response?.status || status;
    } else if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
