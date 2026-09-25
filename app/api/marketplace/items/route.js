import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import MarketplaceItem from '@/models/MarketplaceItem';
export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category');
    const condition = searchParams.get('condition');
    
    let query = { status: 'Available' };
    if (category && category !== 'All') query.category = category;
    if (condition && condition !== 'All') query.condition = condition;

    const items = await MarketplaceItem.find(query)
      .populate('seller', 'username avatarUrl')
      .sort({ createdAt: -1 })
      .limit(50);
      
    return NextResponse.json({ items });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { title, description, price, condition, category, images } = body;

    if (!title || !description || price === undefined || !condition) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newItem = await MarketplaceItem.create({
      seller: user._id,
      title,
      description,
      price: Number(price),
      condition,
      category: category || 'Other',
      images: images || [],
      status: 'Available'
    });

    return NextResponse.json({ success: true, item: newItem }, { status: 201 });
  } catch (error) {
    console.error('Marketplace POST error:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}
