export const runtime = 'nodejs';

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
    console.log('✅ Upload API called');
    const formData = await req.formData();
    console.log('FormData keys:', Array.from(formData.keys()));

    const file = formData.get('file') as File;
    if (!file) {
      console.error('❌ No file received in formData');
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    console.log('File name:', file.name, 'type:', file.type, 'size:', file.size);

    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `${randomUUID()}-${file.name.replace(/\s+/g, '_')}`;

    console.log('Uploading to R2 bucket:', BUCKET, 'with key:', key);

    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: key,
        Body: buffer,
        ContentType: file.type,
      })
    );

    console.log('✅ Upload successful:', `${PUBLIC_URL}/${key}`);

    return NextResponse.json({ publicUrl: `${PUBLIC_URL}/${key}` });
  } catch (err) {
    console.error('❌ Upload API error:', err);
    if (err instanceof Error) console.error(err.message, err.stack);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
