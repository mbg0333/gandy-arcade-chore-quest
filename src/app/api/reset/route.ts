import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');

    // Secure the endpoint so only we can run it
    if (key !== 'super-secret-reset-key-1234') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Starting total database coin reset...');

    // 1. Delete coin transactions, quest submissions, and reward redemptions
    const deletedTxs = await prisma.coinTransaction.deleteMany({});
    const deletedSubmissions = await prisma.taskSubmission.deleteMany({});
    const deletedRedemptions = await prisma.rewardRedemption.deleteMany({});

    // 2. Reset all kid coin counts
    const updatedKids = await prisma.user.updateMany({
      where: { role: 'KID' },
      data: {
        coins: 0,
        totalEarned: 0,
        tasksCompleted: 0,
      },
    });

    return NextResponse.json({
      success: true,
      message: 'Coins and transactions reset successfully!',
      details: {
        deletedTransactionsCount: deletedTxs.count,
        deletedSubmissionsCount: deletedSubmissions.count,
        deletedRedemptionsCount: deletedRedemptions.count,
        resetKidsCount: updatedKids.count,
      }
    });
  } catch (error: any) {
    console.error('Reset failed:', error);
    return NextResponse.json({ error: error.message || 'Reset failed' }, { status: 500 });
  }
}
