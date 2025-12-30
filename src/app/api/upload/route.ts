export const runtime = 'nodejs'; // Must use Node runtime for AWS SDK

import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT!,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET!;
const PUBLIC_URL = process.env.R2_PUBLIC_URL!;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${randomUUID()}-${file.name.replace(/\s+/g, '_')}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    return NextResponse.json({ publicUrl: `${PUBLIC_URL}/${key}` });
  } catch (err) {
    console.error('Upload API error:', err);
    if (err instanceof Error) {
      console.error('Error message:', err.message);
      console.error('Error stack:', err.stack);
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
