import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log("Starting contact categories migration...");
  
  // Find all tenants that have contacts
  const tenants = await prisma.tenant.findMany({
    include: { contacts: true }
  });

  for (const tenant of tenants) {
    if (tenant.contacts.length === 0) continue;

    console.log(`Processing tenant: ${tenant.name} (${tenant.id})`);

    // Get unique relationship types
    const uniqueTypes = [...new Set(tenant.contacts.map(c => c.relationshipType))];
    
    for (const type of uniqueTypes) {
      if (!type) continue;
      
      // Check if category already exists for this type
      let category = await prisma.contactCategory.findFirst({
        where: {
          organizationId: tenant.id,
          name: type
        }
      });

      if (!category) {
        // Create category
        category = await prisma.contactCategory.create({
          data: {
            organizationId: tenant.id,
            name: type,
            color: "#94a3b8" // Default slate-400 color
          }
        });
        console.log(`Created category: ${type} (${category.id})`);
      } else {
        console.log(`Category ${type} already exists. Skipping creation.`);
      }

      // Update contacts
      const updated = await prisma.contact.updateMany({
        where: { 
          organizationId: tenant.id, 
          relationshipType: type,
          contactCategoryId: null
        },
        data: { contactCategoryId: category.id }
      });

      console.log(`Updated ${updated.count} contacts for category ${type}`);
    }
  }

  console.log("Migration finished.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
