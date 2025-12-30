import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const base64Image = Buffer.from(buffer).toString('base64');
    const mimeType = file.type;

    const mongoClient = await clientPromise;
    const db = mongoClient.db(); // use default database from connection string
    const collection = db.collection('payment_proofs');

    const result = await collection.insertOne({
      image: base64Image,
      contentType: mimeType,
      filename: file.name,
      createdAt: new Date(),
    });

    return NextResponse.json({ proofId: result.insertedId.toString() });

  } catch (err: any) {
    console.error('❌ Upload API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
