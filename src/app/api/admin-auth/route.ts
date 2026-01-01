
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { key } = await req.json();

    if (!process.env.ACCESS_KEY) {
      console.error('ACCESS_KEY environment variable is not set.');
      return NextResponse.json({ error: 'Server configuration error.' }, { status: 500 });
    }

    if (key === process.env.ACCESS_KEY) {
      return NextResponse.json({ success: true }, { status: 200 });
    } else {
      return NextResponse.json({ error: 'Invalid access key.' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
  }
}
