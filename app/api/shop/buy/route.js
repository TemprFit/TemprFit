import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { getSessionUser } from '@/lib/auth';
import { SHOP_ITEMS } from '@/lib/shop';

export async function POST(req) {
  try {
    await connectDB();
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { itemId } = await req.json();
    if (!itemId) {
      return NextResponse.json({ error: 'Item ID required' }, { status: 400 });
    }

    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    // Check if it's a weekend item and it's not the weekend
    if (item.weekendOnly) {
      const day = new Date().getDay();
      if (day !== 0 && day !== 6) {
        return NextResponse.json({ error: 'This item is only available on weekends!' }, { status: 400 });
      }
    }

    if ((user.xp || 0) < item.cost) {
      return NextResponse.json({ error: 'Not enough XP' }, { status: 400 });
    }

    // Apply the purchase
    user.xp -= item.cost;

    if (item.type === 'color') {
      if (!user.unlockedColors.includes(item.value)) {
        user.unlockedColors.push(item.value);
      }
      user.activeColor = item.value;
    } else if (item.type === 'border') {
      if (!user.unlockedBorders) {
        user.unlockedBorders = [];
      }
      if (!user.unlockedBorders.includes(item.value)) {
        user.unlockedBorders.push(item.value);
      }
      user.activeBorder = item.value;
    } else if (item.type === 'subscription') {
      user.plan = item.value;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + item.durationDays);
      // If they already have an active sub, extend it
      if (user.planExpiresAt && user.planExpiresAt > new Date()) {
        const currentExpiry = new Date(user.planExpiresAt);
        currentExpiry.setDate(currentExpiry.getDate() + item.durationDays);
        user.planExpiresAt = currentExpiry;
      } else {
        user.planExpiresAt = expiry;
      }
    } else if (item.type === 'consumable') {
      if (!user.inventory) user.inventory = {};
      user.inventory[item.value] = (user.inventory[item.value] || 0) + 1;
    } else if (item.type === 'badge') {
      if (user.badges.some(b => b.badgeId === item.id)) {
        return NextResponse.json({ error: 'You already own this badge' }, { status: 400 });
      }
      user.badges.push({ badgeId: item.id, earnedAt: new Date() });
    }

    await user.save();

    return NextResponse.json({ 
      success: true, 
      xp: user.xp, 
      activeColor: user.activeColor,
      activeBorder: user.activeBorder,
      borderExpiresAt: user.borderExpiresAt,
      plan: user.plan,
      planExpiresAt: user.planExpiresAt,
      unlockedColors: user.unlockedColors,
      unlockedBorders: user.unlockedBorders,
      inventory: user.inventory,
      badges: user.badges
    });
  } catch (error) {
    console.error('Shop buy error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
