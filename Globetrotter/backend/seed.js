const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10);

  await prisma.user.upsert({
    where: { email: 'admin@globetrotter.dev' },
    update: {},
    create: { name: 'Admin', email: 'admin@globetrotter.dev', passwordHash, role: 'ADMIN' },
  });
  await prisma.user.upsert({
    where: { email: 'demo@globetrotter.dev' },
    update: {},
    create: { name: 'Demo Traveler', email: 'demo@globetrotter.dev', passwordHash, role: 'USER' },
  });

  const cities = [
    { name: 'Paris', country: 'France', region: 'Europe', costIndex: 80, popularity: 98, imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34' },
    { name: 'Tokyo', country: 'Japan', region: 'Asia', costIndex: 75, popularity: 95, imageUrl: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf' },
    { name: 'Bali', country: 'Indonesia', region: 'Asia', costIndex: 35, popularity: 90, imageUrl: 'https://images.unsplash.com/photo-1537996194471-e657df975ab4' },
    { name: 'Rome', country: 'Italy', region: 'Europe', costIndex: 65, popularity: 92, imageUrl: 'https://images.unsplash.com/photo-1552832230-c0197dd311b5' },
    { name: 'New York', country: 'USA', region: 'North America', costIndex: 90, popularity: 96, imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9' },
    { name: 'Bangkok', country: 'Thailand', region: 'Asia', costIndex: 30, popularity: 88, imageUrl: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365' },
    { name: 'Barcelona', country: 'Spain', region: 'Europe', costIndex: 60, popularity: 89, imageUrl: 'https://images.unsplash.com/photo-1583422409516-2895a77efded' },
    { name: 'Dubai', country: 'UAE', region: 'Middle East', costIndex: 85, popularity: 87, imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c' },
    { name: 'Ahmedabad', country: 'India', region: 'Asia', costIndex: 20, popularity: 70, imageUrl: '/ahmedabad.png' },
    { name: 'Goa', country: 'India', region: 'Asia', costIndex: 25, popularity: 85, imageUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2' },
  ];

  // Clean up any cities that are not in the seed array
  const keepNames = cities.map(c => c.name);
  await prisma.city.deleteMany({
    where: {
      name: { notIn: keepNames }
    }
  });


  const cityRecords = {};
  for (const c of cities) {
    const created = await prisma.city.upsert({
      where: { name_country: { name: c.name, country: c.country } },
      update: { imageUrl: c.imageUrl, costIndex: c.costIndex, popularity: c.popularity, region: c.region },
      create: c,
    });
    cityRecords[c.name] = created;
  }

  const activityTemplates = (city) => {
    const price = (usd) => Math.max(100, Math.round((usd * 85 * (city.costIndex / 60)) / 50) * 50);
    return [
      { name: `${city.name} Walking Tour`, category: 'SIGHTSEEING', cost: price(20), durationMin: 120, description: `Guided walking tour through ${city.name}'s highlights.` },
      { name: `${city.name} Food Crawl`, category: 'FOOD', cost: price(45), durationMin: 150, description: `Taste local specialties around ${city.name}.` },
      { name: `${city.name} Museum Pass`, category: 'CULTURE', cost: price(25), durationMin: 180, description: `Entry to top museums in ${city.name}.` },
      { name: `${city.name} Adventure Day`, category: 'ADVENTURE', cost: price(80), durationMin: 300, description: `Full-day adventure activity near ${city.name}.` },
      { name: `${city.name} Nightlife Experience`, category: 'NIGHTLIFE', cost: price(50), durationMin: 180, description: `Evening out at ${city.name}'s best spots.` },
    ];
  };

  for (const [name, city] of Object.entries(cityRecords)) {
    for (const act of activityTemplates(city)) {
      const exists = await prisma.activity.findFirst({ where: { cityId: city.id, name: act.name } });
      if (!exists) {
        await prisma.activity.create({ data: { ...act, cityId: city.id } });
      } else {
        await prisma.activity.update({ where: { id: exists.id }, data: { cost: act.cost } });
      }
    }
  }

  console.log('Seed complete. Demo login: demo@globetrotter.dev / password123 (admin: admin@globetrotter.dev)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
