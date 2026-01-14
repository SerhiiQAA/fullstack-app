import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Починаємо наповнення бази даних...');

  // Видаляємо старих юзерів, щоб не було дублікатів (за бажанням)
  await prisma.user.deleteMany();

  // Створюємо 50 фейкових користувачів
  const users = Array.from({ length: 50 }).map(() => ({
    name: faker.person.fullName(),
    email: faker.internet.email().toLowerCase(),
  }));

  await prisma.user.createMany({
    data: users,
  });

  console.log('✅ Успішно додано 50 користувачів!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });