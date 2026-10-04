import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CouponCode from '@/models/CouponCode';
import { verifyAdminRequest } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// List all coupons
export async function GET() {
  await connectDB();
  const { authorized } = await verifyAdminRequest();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  const coupons = await CouponCode.find().sort({ createdAt: -1 }).lean();
  return NextResponse.json({ coupons });
}

// Create a new coupon
export async function POST(req) {
  await connectDB();
  const { authorized } = await verifyAdminRequest();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  const { code, planLevel, expiresInDays } = await req.json();
  if (!code || !planLevel) {
    return NextResponse.json({ error: 'code and planLevel required' }, { status: 400 });
  }

  const exists = await CouponCode.findOne({ code: code.toUpperCase() });
  if (exists) {
    return NextResponse.json({ error: 'Coupon code already exists' }, { status: 409 });
  }

  let expiresAt = null;
  if (expiresInDays) {
    expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays, 10));
  }

  const coupon = await CouponCode.create({
    code: code.toUpperCase(),
    planLevel,
    isActive: true,
    expiresAt
  });

  return NextResponse.json({ coupon }, { status: 201 });
}

// Toggle coupon active/inactive
export async function PATCH(req) {
  await connectDB();
  const { authorized } = await verifyAdminRequest();
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
  }

  const { couponId, isActive } = await req.json();
  if (!couponId) return NextResponse.json({ error: 'couponId required' }, { status: 400 });

  const coupon = await CouponCode.findByIdAndUpdate(
    couponId,
    { $set: { isActive: !!isActive } },
    { new: true }
  ).lean();

  return NextResponse.json({ coupon });
}
