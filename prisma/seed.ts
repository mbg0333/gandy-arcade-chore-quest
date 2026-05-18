import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Admins
  const admin1 = await prisma.user.create({
    data: {
      role: 'ADMIN',
      name: 'mgandy',
      email: 'maxxgandy@gmail.com',
    },
  });

  const admin2 = await prisma.user.create({
    data: {
      role: 'ADMIN',
      name: 'agandy',
      email: 'angelagandy@gmail.com',
    },
  });

  // Kids
  const kidsData = [
    { name: 'Brexx', pin: '141414', coins: 150, totalEarned: 150 },
    { name: 'Reed', pin: '040404', coins: 50, totalEarned: 50 },
    { name: 'Will', pin: '242424', coins: 300, totalEarned: 300 },
  ];

  const kids = await Promise.all(
    kidsData.map(async (k) => {
      const hashedPin = await bcrypt.hash(k.pin, 10);
      return prisma.user.create({
        data: {
          role: 'KID',
          name: k.name,
          pin: hashedPin,
          coins: k.coins,
          totalEarned: k.totalEarned,
        },
      });
    })
  );

  // Example Tasks
  const tasks = [
    { title: 'Clean room', category: 'CHORE', rewardAmount: 50 },
    { title: 'Take out trash', category: 'CHORE', rewardAmount: 20 },
    { title: '20 pushups', category: 'WORKOUT', rewardAmount: 30 },
    { title: '20 situps', category: 'WORKOUT', rewardAmount: 30 },
    { title: 'Read for 20 minutes', category: 'SCHOOL', rewardAmount: 40 },
    { title: 'Help with dishes', category: 'CHORE', rewardAmount: 50 },
    { title: 'Feed pets', category: 'CHORE', rewardAmount: 15 },
    { title: 'Put laundry away', category: 'CHORE', rewardAmount: 40 },
    { title: 'Make bed', category: 'CHORE', rewardAmount: 25 },
    { title: 'Custom parent job', category: 'CUSTOM', rewardAmount: 100 },
  ];

  for (const t of tasks) {
    const task = await prisma.task.create({
      data: {
        title: t.title,
        category: t.category,
        rewardAmount: t.rewardAmount,
        hasReward: true,
        requiresApproval: true,
      },
    });

    // Assign to all kids
    for (const kid of kids) {
      await prisma.taskAssignment.create({
        data: {
          taskId: task.id,
          userId: kid.id,
        },
      });
    }
  }

  // Example Rewards
  const rewards = [
    { title: '$1 cash', cost: 50 },
    { title: '$5 cash', cost: 250 },
    { title: '30 minutes video games', cost: 150 },
    { title: '1 hour video games', cost: 300 },
    { title: 'Pick dinner', cost: 200 },
    { title: 'Stay up 30 minutes later', cost: 150 },
  ];

  for (const r of rewards) {
    await prisma.reward.create({
      data: {
        title: r.title,
        cost: r.cost,
      },
    });
  }

  // Example Transactions
  for (const kid of kids) {
    await prisma.coinTransaction.create({
      data: {
        userId: kid.id,
        amount: kid.coins,
        reason: 'Initial setup bonus!',
        adminId: admin1.id,
      },
    });
  }

  console.log('Database seeded!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
