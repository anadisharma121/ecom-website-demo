import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

function placeholderSvg(text: string): string {
  const encoded = encodeURIComponent(text);
  return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200'%3E%3Crect fill='%23f1f5f9' width='300' height='200'/%3E%3Ctext fill='%2394a3b8' font-family='Arial,sans-serif' font-size='14' text-anchor='middle' dominant-baseline='central' x='150' y='100'%3E${encoded}%3C/text%3E%3C/svg%3E`;
}

async function main() {
  console.log("🌱 Seeding database...");

  // Clear existing data (products first due to foreign keys)
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.userCategory.deleteMany({});
  await prisma.category.deleteMany({});

  console.log("🗑️  Cleared existing data");

  // Create default categories
  const categories = [
    { name: "Mandatory Signs", emoji: "✅", description: "Mandatory instruction and compliance signs" },
    { name: "Banner Signs", emoji: "🏳️", description: "Large format banner signs for display" },
    { name: "Door Signs", emoji: "🚪", description: "Signs for doors and entrances" },
    { name: "Hazard Notifier Boards Signs", emoji: "⚠️", description: "Hazard notification and warning board signs" },
    { name: "Recycling Signs", emoji: "♻️", description: "Recycling and waste management signs" },
    { name: "Road Signs", emoji: "🛣️", description: "Road safety and traffic signs" },
    { name: "Site Notice Board Signs", emoji: "📋", description: "Site notice boards and information signs" },
    { name: "Bespoke Multipurpose Signs", emoji: "🎨", description: "Custom-made multipurpose signs" },
    { name: "First Aid Fire Safety Signs", emoji: "🧯", description: "First aid and fire safety signs" },
    { name: "Multi Purpose Signs", emoji: "📌", description: "General multi-purpose signs" },
    { name: "PPE Signs", emoji: "🦺", description: "Personal protective equipment signs" },
    { name: "Hazard Signs", emoji: "☢️", description: "Hazard warning and danger signs" },
    { name: "Prohibition Signs", emoji: "🚫", description: "Prohibition and restriction signs" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  console.log("✅ Categories created");

  // Create default admin user
  const adminPassword = await bcrypt.hash(
    process.env.ADMIN_PASSWORD || "admin123",
    12
  );

  await prisma.user.upsert({
    where: { username: process.env.ADMIN_USERNAME || "admin" },
    update: { password: adminPassword },
    create: {
      username: process.env.ADMIN_USERNAME || "admin",
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  console.log("✅ Admin user created (username: admin, password: admin123)");

  // Create sample products
  const mandatoryCategory = await prisma.category.findUnique({
    where: { name: "Mandatory Signs" },
  });
  const hazardCategory = await prisma.category.findUnique({
    where: { name: "Hazard Signs" },
  });
  const roadCategory = await prisma.category.findUnique({
    where: { name: "Road Signs" },
  });

  if (mandatoryCategory) {
    await prisma.product.createMany({
      skipDuplicates: true,
      data: [
        {
          name: "Fire Exit Sign",
          description: "Photoluminescent fire exit sign, ISO 7010 compliant",
          price: 12.99,
          image: placeholderSvg("Fire Exit Sign"),
          categoryId: mandatoryCategory.id,
        },
        {
          name: "Safety Helmet Required",
          description: "Mandatory safety helmet sign for construction areas",
          price: 8.99,
          image: placeholderSvg("Safety Helmet"),
          categoryId: mandatoryCategory.id,
        },
      ],
    });
  }

  if (hazardCategory) {
    await prisma.product.createMany({
      skipDuplicates: true,
      data: [
        {
          name: "Caution Wet Floor",
          description: "Yellow caution wet floor warning sign",
          price: 14.99,
          image: placeholderSvg("Wet Floor"),
          categoryId: hazardCategory.id,
        },
        {
          name: "High Voltage Warning",
          description: "Electric shock hazard warning sign",
          price: 10.99,
          image: placeholderSvg("High Voltage"),
          categoryId: hazardCategory.id,
        },
      ],
    });
  }

  if (roadCategory) {
    await prisma.product.createMany({
      skipDuplicates: true,
      data: [
        {
          name: "Speed Limit 30 Sign",
          description: "Standard speed limit 30mph road sign",
          price: 29.99,
          image: placeholderSvg("Speed Limit 30"),
          categoryId: roadCategory.id,
        },
        {
          name: "Stop Sign",
          description: "Reflective octagonal stop sign for road use",
          price: 34.99,
          image: placeholderSvg("Stop Sign"),
          categoryId: roadCategory.id,
        },
      ],
    });
  }

  console.log("✅ Sample products created");
  console.log("🎉 Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
