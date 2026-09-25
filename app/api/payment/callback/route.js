import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import Notification from '@/models/Notification';
import EscrowTransaction from '@/models/EscrowTransaction';
export const dynamic = 'force-dynamic';

const FLUTTERWAVE_SECRET_KEY = process.env.FLUTTERWAVE_SECRET_KEY || 'FLWSECK_TEST-dummy-key';
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const tx_ref = searchParams.get('tx_ref');
  const transaction_id = searchParams.get('transaction_id');

  if (status !== 'successful' && status !== 'completed') {
    return NextResponse.redirect(`${BASE_URL}/upgrade?error=Payment+failed+or+cancelled`);
  }

  try {
    // Verify the transaction using Flutterwave API
    const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${FLUTTERWAVE_SECRET_KEY}`,
      },
    });

    const data = await response.json();

    if (data.status === 'success' && data.data.status === 'successful') {
      const { userId, plan, type, trainerId, traineeNotes } = data.data.meta;
      const amount = data.data.amount;
      
      await connectDB();
      const user = await User.findById(userId);
      
      if (!user) {
        return NextResponse.redirect(`${BASE_URL}/upgrade?error=User+not+found`);
      }

      if (type === 'subscription') {
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 30); // 1 month

        user.plan = plan.toLowerCase();
        user.planExpiresAt = expiresAt;
        await user.save();

        await Notification.create({
          user: user._id,
          title: 'Payment Successful',
          message: `Your account has been upgraded to the ${plan} plan via Flutterwave!`,
          type: 'subscription',
        });

        return NextResponse.redirect(`${BASE_URL}/dashboard?success=Payment+successful`);
      } else if (type === 'boost') {
        // Boost profile logic
        if (!user.trainerInfo) user.trainerInfo = {};
        user.trainerInfo.isFeatured = true;
        
        const boostExpires = new Date();
        boostExpires.setDate(boostExpires.getDate() + 7); // 7 days boost
        user.trainerInfo.featuredUntil = boostExpires;
        
        await user.save();

        await Notification.create({
          user: user._id,
          title: 'Profile Boosted!',
          message: `Your trainer profile has been boosted and will be featured for the next 7 days.`,
          type: 'system',
        });

        return NextResponse.redirect(`${BASE_URL}/trainer-dashboard?success=Profile+boosted`);
      } else if (type === 'escrow') {
        const platformFee = amount * 0.15; // 15% fee
        const trainerEarnings = amount - platformFee;

        await EscrowTransaction.create({
          trainer: trainerId,
          trainee: user._id,
          amount,
          platformFee,
          trainerEarnings,
          status: 'held',
          description: `1-on-1 Training Session booked by ${user.username}`,
          traineeNotes: traineeNotes || '',
          milestones: [
            { id: 1, label: 'Initial Deposit', percent: 25, status: 'completed' },
            { id: 2, label: 'First Session', percent: 25, status: 'pending' },
            { id: 3, label: 'Halfway Point', percent: 25, status: 'locked' },
            { id: 4, label: 'Completion', percent: 25, status: 'locked' }
          ]
        });

        // Notify Trainee
        await Notification.create({
          user: user._id,
          title: 'Booking Confirmed!',
          message: `Your payment was successful and funds are securely held in escrow.`,
          type: 'system',
        });

        // Notify Trainer
        await Notification.create({
          user: trainerId,
          title: 'New Booking!',
          message: `${user.username} has booked a session with you! The funds are now in escrow.`,
          type: 'system',
        });

        return NextResponse.redirect(`${BASE_URL}/dashboard?success=Booking+confirmed`);
      }
    } else {
      return NextResponse.redirect(`${BASE_URL}/upgrade?error=Verification+failed`);
    }
  } catch (error) {
    console.error('Payment Callback Error:', error);
    return NextResponse.redirect(`${BASE_URL}/upgrade?error=System+error+during+verification`);
  }
}
