
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  region: "auto",
  endpoint: `https://f2185d026195d5e6e9cd9948b65bc40f.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
});

const R2_BUCKET_NAME = "sublime";
const R2_PUBLIC_URL = "https://sublime.statics.csio.aqtmax.space";

export async function POST(req: NextRequest) {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'File name and type are required.' }, { status: 400 });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9.-_]/g, '_');
    const key = `${randomUUID()}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl });
}
