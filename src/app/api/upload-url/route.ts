
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

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
  try {
    const { fileName, fileType } = await req.json();

    if (!fileName || !fileType) {
      return NextResponse.json({ error: 'File name and type are required.' }, { status: 400 });
    }

    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const key = `${randomUUID()}-${safeFileName}`;

    const command = new PutObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 60 });

    const publicUrl = `${R2_PUBLIC_URL}/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl });
  } catch (error) {
    console.error("Error creating presigned URL:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during URL generation.";
    
    // Provide a more helpful error for the likely CORS issue
    if (errorMessage.includes('credentials')) {
         return NextResponse.json({ 
            error: `Failed to create upload URL. Server error: Authorization failed. Please check your R2 API token permissions.` 
        }, { status: 500 });
    }

    const origin = req.headers.get('origin') || 'your-app-domain.com';
    const corsErrorGuidance = `This is likely a CORS issue on your Cloudflare R2 bucket. Please go to your R2 bucket settings > CORS Policy and add the following JSON: 
[
  {
    "AllowedOrigins": [
      "${origin}"
    ],
    "AllowedMethods": [
      "PUT",
      "GET"
    ],
    "AllowedHeaders": [
      "content-type"
    ],
    "MaxAgeSeconds": 3600
  }
]`;

    return NextResponse.json({ error: `Failed to create upload URL. ${corsErrorGuidance}` }, { status: 500 });
  }
}
