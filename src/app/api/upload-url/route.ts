
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

const s3Client = new S3Client({
  endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY!,
  },
  region: 'auto',
});

export async function POST(req: NextRequest) {
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
        return NextResponse.json({ error: 'File name and type are required' }, { status: 400 });
    }
    
    // Sanitize file name
    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `${randomUUID()}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME!,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 * 5 }); // URL expires in 5 minutes

    return NextResponse.json({ uploadUrl, key });
  } catch (error) {
    console.error("Error creating pre-signed URL:", error);
    return NextResponse.json({ error: 'Failed to create upload URL' }, { status: 500 });
  }
}
