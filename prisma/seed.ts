import { PrismaClient, ThresholdType, FinanceType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.INITIAL_SUPERADMIN_EMAIL || 'admin@crm.com';
  const adminPassword = process.env.INITIAL_SUPERADMIN_PASSWORD || 'admin';

  console.log(`Checking superadmin for: ${adminEmail}`);

  let admin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!admin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    admin = await prisma.user.create({
      data: {
        email: adminEmail,
        name: 'Super Administrador',
        password: hashedPassword,
        isSuperAdmin: true,
      },
    });
    console.log('Superadmin created!');
  } else {
    console.log('Superadmin already exists.');
  }

  // Ensure a System Tenant exists (using first one or creating one)
  let systemTenant = await prisma.tenant.findFirst();
  if (!systemTenant) {
    systemTenant = await prisma.tenant.create({
      data: { name: 'Sistema CRM' },
    });
  }

  // Assign Super Admin to System Tenant as Admin if not already
  const existingLink = await prisma.tenantUser.findFirst({
    where: { tenantId: systemTenant.id, userId: admin.id },
  });

  if (!existingLink) {
    await prisma.tenantUser.create({
      data: {
        tenantId: systemTenant.id,
        userId: admin.id,
        role: 'TENANT_ADMIN',
      },
    });
    console.log('Linked Superadmin to System Tenant.');
  }

  // Seed Categories for System Tenant
  const categories = [
    { name: 'Trabajo', color: 'bg-blue-500' },
    { name: 'Personal', color: 'bg-emerald-500' },
    { name: 'Salud', color: 'bg-rose-500' },
    { name: 'Finanzas', color: 'bg-amber-500' },
  ];

  for (const cat of categories) {
    const existingCat = await prisma.category.findFirst({
      where: { name: cat.name, tenantId: systemTenant.id }
    });
    if (!existingCat) {
      await prisma.category.create({
        data: {
          name: cat.name,
          color: cat.color,
          tenantId: systemTenant.id,
        }
      });
    }
  }
  console.log('Categories seeded.');

  // Seed Finance Categories for System Tenant
  const financeCategories = [
    { name: 'Salario', type: FinanceType.INGRESO, color: 'bg-emerald-500' },
    { name: 'Otros Ingresos', type: FinanceType.INGRESO, color: 'bg-teal-500' },
    { name: 'Alimentación', type: FinanceType.GASTO, color: 'bg-orange-500' },
    { name: 'Transporte', type: FinanceType.GASTO, color: 'bg-blue-500' },
    { name: 'Vivienda', type: FinanceType.GASTO, color: 'bg-indigo-500' },
    { name: 'Entretenimiento', type: FinanceType.GASTO, color: 'bg-purple-500' },
    { name: 'Salud', type: FinanceType.GASTO, color: 'bg-rose-500' },
    { name: 'Otros Gastos', type: FinanceType.GASTO, color: 'bg-slate-500' },
  ];

  for (const cat of financeCategories) {
    const existingFinCat = await prisma.financeCategory.findFirst({
      where: { name: cat.name, organizationId: systemTenant.id }
    });
    if (!existingFinCat) {
      await prisma.financeCategory.create({
        data: {
          name: cat.name,
          type: cat.type,
          color: cat.color,
          organizationId: systemTenant.id,
        }
      });
    }
  }
  console.log('Finance Categories seeded.');

  // Initialize UserStats for the admin in the system tenant
  const existingStats = await prisma.userStats.findUnique({
    where: {
      userId_tenantId: { userId: admin.id, tenantId: systemTenant.id }
    }
  });

  if (!existingStats) {
    await prisma.userStats.create({
      data: {
        userId: admin.id,
        tenantId: systemTenant.id,
      }
    });
    console.log('UserStats created for Superadmin.');
  }

  // Seed Achievements
  const achievements = [
    { code: 'FIRST_TASK', title: 'El Primer Paso', description: 'Completa tu primera tarea.', icon: '🎯', thresholdValue: 1, thresholdType: ThresholdType.TOTAL_TASKS },
    { code: 'TASKS_10', title: 'En Racha', description: 'Completa 10 tareas.', icon: '⚡', thresholdValue: 10, thresholdType: ThresholdType.TOTAL_TASKS },
    { code: 'TASKS_50', title: 'Máquina de Productividad', description: 'Completa 50 tareas.', icon: '🤖', thresholdValue: 50, thresholdType: ThresholdType.TOTAL_TASKS },
    { code: 'POINTS_100', title: 'Cien Puntos', description: 'Acumula 100 puntos totales.', icon: '💯', thresholdValue: 100, thresholdType: ThresholdType.TOTAL_POINTS },
    { code: 'POINTS_500', title: 'Medio Millar', description: 'Acumula 500 puntos totales.', icon: '💎', thresholdValue: 500, thresholdType: ThresholdType.TOTAL_POINTS },
    { code: 'STREAK_7', title: 'Semana Perfecta', description: 'Mantén una racha de 7 días completando tareas.', icon: '🔥', thresholdValue: 7, thresholdType: ThresholdType.STREAK_DAYS },
  ];

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { code: ach.code },
      update: {
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        thresholdValue: ach.thresholdValue,
        thresholdType: ach.thresholdType
      },
      create: ach
    });
  }
  console.log('Achievements seeded.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
