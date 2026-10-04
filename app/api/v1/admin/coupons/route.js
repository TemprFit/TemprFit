import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import CouponCode from '@/models/CouponCode';
import { verifyAdminRequest } from '@/lib/auth';
import { adminCouponListResponseSchema } from '@/lib/contracts/v1/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const coupons = await CouponCode.find().sort({ createdAt: -1 }).lean();
    return NextResponse.json({ coupons });
  } catch (err) {
    console.error('[v1/admin/coupons] GET Error:', err);
    return NextResponse.json({ error: 'Failed to retrieve coupons.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { code, planLevel, discountPercent, expiresInDays, maxUses } = body;

    if (!code) {
      return NextResponse.json({ error: 'Coupon code is required.' }, { status: 400 });
    }

    const normalizedCode = String(code).trim().toUpperCase();
    const exists = await CouponCode.findOne({ code: normalizedCode });
    if (exists) {
      return NextResponse.json({ error: 'Coupon code already exists.' }, { status: 409 });
    }

    let expiresAt = null;
    if (expiresInDays && Number(expiresInDays) > 0) {
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + parseInt(expiresInDays, 10));
    }

    const coupon = await CouponCode.create({
      code: normalizedCode,
      planLevel: planLevel || 'pro',
      discountPercent: Number(discountPercent) || 100,
      maxUses: Number(maxUses) || null,
      isActive: true,
      expiresAt,
    });

    return NextResponse.json({ coupon }, { status: 201 });
  } catch (err) {
    console.error('[v1/admin/coupons] POST Error:', err);
    return NextResponse.json({ error: 'Failed to create coupon.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    await connectDB();
    const { authorized } = await verifyAdminRequest();
    if (!authorized) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required.' }, { status: 403 });
    }

    const body = await request.json().catch(() => ({}));
    const { id, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'Coupon id is required.' }, { status: 400 });
    }

    const coupon = await CouponCode.findByIdAndUpdate(
      id,
      { $set: { isActive: Boolean(isActive) } },
      { new: true }
    ).lean();

    if (!coupon) {
      return NextResponse.json({ error: 'Coupon not found.' }, { status: 404 });
    }

    return NextResponse.json({ coupon });
  } catch (err) {
    console.error('[v1/admin/coupons] PATCH Error:', err);
    return NextResponse.json({ error: 'Failed to update coupon.' }, { status: 500 });
  }
}
