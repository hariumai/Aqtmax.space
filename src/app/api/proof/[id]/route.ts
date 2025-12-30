import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!id || !ObjectId.isValid(id)) {
      return NextResponse.json({ error: 'Invalid proof ID' }, { status: 400 });
    }

    const mongoClient = await clientPromise;
    const db = mongoClient.db();
    const collection = db.collection('payment_proofs');

    const proof = await collection.findOne({ _id: new ObjectId(id) });

    if (!proof) {
      return NextResponse.json({ error: 'Proof not found' }, { status: 404 });
    }

    const imageBuffer = Buffer.from(proof.image, 'base64');
    
    return new Response(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': proof.contentType,
        'Content-Length': imageBuffer.length.toString(),
      },
    });

  } catch (err: any) {
    console.error('❌ Proof API error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
