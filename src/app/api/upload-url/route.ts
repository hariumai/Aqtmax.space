
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// Check if all required environment variables are set
if (
  !process.env.CLOUDFLARE_R2_ACCOUNT_ID ||
  !process.env.CLOUDFLARE_R2_ACCESS_KEY_ID ||
  !process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY ||
  !process.env.CLOUDFLARE_R2_BUCKET_NAME ||
  !process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL
) {
  throw new Error("Missing required Cloudflare R2 environment variables.");
}

const s3Client = new S3Client({
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY,
  },
  region: 'auto',
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
    }
    
    // Sanitize file name
    const safeFileName = file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `${randomUUID()}-${safeFileName}`;

    // Read file into a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await s3Client.send(command);

    // Construct the public URL
    const publicUrl = `${process.env.NEXT_PUBLIC_CLOUDFLARE_R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({ publicUrl });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json({ error: 'Failed to upload file.' }, { status: 500 });
  }
}
