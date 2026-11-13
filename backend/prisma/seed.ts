import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('[Seed] Starting database seeding for CampusConnect...');

  if (process.env.NODE_ENV === 'production') {
    const existing = await Promise.all([
      prisma.user.count(), prisma.category.count(), prisma.item.count(), prisma.itemImage.count(),
      prisma.claim.count(), prisma.collection.count(), prisma.notification.count(), prisma.auditLog.count(),
    ]);
    if (existing.some((count) => count > 0)) {
      throw new Error('Refusing to seed a non-empty production database. The seed is a one-time demo initializer and never replaces existing records.');
    }
  }

  // Clean existing records in reverse dependency order
  await prisma.auditLog.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.collection.deleteMany();
  await prisma.claim.deleteMany();
  await prisma.itemImage.deleteMany();
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  console.log('[Seed] Cleaned existing database tables.');

  // Password hashes
  const studentPasswordHash = await bcrypt.hash('Student@12345', 10);
  const adminPasswordHash = await bcrypt.hash('Admin@12345', 10);

  // 1. Seed Users
  const admin = await prisma.user.create({
    data: {
      fullName: 'Dean Michael Vance',
      email: 'admin@campusconnect.edu',
      studentId: 'ADM-9001',
      passwordHash: adminPasswordHash,
      department: 'Campus Safety & Administration',
      yearOfStudy: 0,
      role: 'ADMIN',
      accountStatus: 'ACTIVE',
      profileImage: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80',
    },
  });

  const sarah = await prisma.user.create({
    data: {
      fullName: 'Sarah Chen',
      email: 'sarah.chen@campusconnect.edu',
      studentId: 'STU-2023-4412',
      passwordHash: studentPasswordHash,
      department: 'Computer Science & Engineering',
      yearOfStudy: 3,
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      profileImage: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
    },
  });

  const marcus = await prisma.user.create({
    data: {
      fullName: 'Marcus Johnson',
      email: 'marcus.johnson@campusconnect.edu',
      studentId: 'STU-2024-8891',
      passwordHash: studentPasswordHash,
      department: 'Mechanical Engineering',
      yearOfStudy: 2,
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      profileImage: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    },
  });

  const priya = await prisma.user.create({
    data: {
      fullName: 'Priya Sharma',
      email: 'priya.sharma@campusconnect.edu',
      studentId: 'STU-2022-1054',
      passwordHash: studentPasswordHash,
      department: 'Business Administration',
      yearOfStudy: 4,
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      profileImage: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80',
    },
  });

  const david = await prisma.user.create({
    data: {
      fullName: 'David Kim',
      email: 'david.kim@campusconnect.edu',
      studentId: 'STU-2025-3319',
      passwordHash: studentPasswordHash,
      department: 'Electrical Engineering',
      yearOfStudy: 1,
      role: 'STUDENT',
      accountStatus: 'ACTIVE',
      profileImage: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
    },
  });

  console.log('[Seed] Created users (1 Admin, 4 Students).');

  // 2. Seed Categories
  const categoriesData = [
    { name: 'Electronics', description: 'Laptops, smartphones, headphones, smartwatches, chargers, and calculators', icon: 'Laptop' },
    { name: 'ID Cards & Keys', description: 'Student IDs, room access keys, car key fobs, and lanyard passes', icon: 'Key' },
    { name: 'Wallets & Bags', description: 'Backpacks, handbags, purses, wallets, and cardholders', icon: 'Briefcase' },
    { name: 'Books & Notebooks', description: 'Textbooks, course packets, lecture notebooks, and binders', icon: 'Book' },
    { name: 'Clothing & Accessories', description: 'Jackets, hoodies, scarves, hats, umbrellas, and watches', icon: 'Shirt' },
    { name: 'Sports & Gym Equipment', description: 'Water bottles, gym gear, yoga mats, and sports rackets', icon: 'Dumbbell' },
    { name: 'Eyewear', description: 'Prescription eyeglasses, blue-light blockers, and sunglasses', icon: 'Glasses' },
    { name: 'Miscellaneous', description: 'Stationery, art supplies, scientific instruments, and miscellaneous objects', icon: 'Package' },
  ];

  const categories: Record<string, any> = {};
  for (const cat of categoriesData) {
    const created = await prisma.category.create({ data: cat });
    categories[cat.name] = created;
  }
  console.log('[Seed] Created categories.');

  // 3. Seed Items (Lost and Found)
  // Item 1: Found Sony Headphones (Under review claim)
  const item1 = await prisma.item.create({
    data: {
      referenceNumber: 'LF-2026-1001',
      reporterId: marcus.id,
      itemName: 'Sony WH-1000XM4 Noise Canceling Headphones',
      categoryId: categories['Electronics'].id,
      itemType: 'FOUND',
      publicDescription: 'Found black over-ear Sony wireless headphones in a dark grey protective travel case on a study desk on the 3rd floor.',
      privateVerificationDetails: 'The inside right headband has a small white scratch and there is a custom engraved sticker "SJ-2024" on the inside hinge.',
      location: 'Central Library - 3rd Floor Silent Study Area',
      dateOccurred: new Date('2026-11-10T14:30:00Z'),
      colour: 'Black',
      brand: 'Sony',
      distinguishingFeatures: 'Over-ear headphones in hard zipper case with audio cable',
      currentHoldingLocation: 'Deposited at Security Office (Building A)',
      contactPreference: 'IN_APP',
      status: 'CLAIM_PENDING',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
            isPrimary: true,
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
            isPrimary: false,
          },
        ],
      },
    },
  });

  // Item 2: Lost Apple iPad Air (Matching item reported)
  const item2 = await prisma.item.create({
    data: {
      referenceNumber: 'LF-2026-1002',
      reporterId: sarah.id,
      itemName: 'Apple iPad Air (5th Gen) Space Gray',
      categoryId: categories['Electronics'].id,
      itemType: 'LOST',
      publicDescription: 'Lost my Space Gray iPad Air with a magnetic magnetic navy smart folio case. I believe I left it after the afternoon Operating Systems lecture.',
      privateVerificationDetails: 'Lock screen wallpaper is an anime landscape artwork. Back of iPad has a GitHub Octocat sticker in the lower right quadrant.',
      location: 'Engineering Hall - Lecture Room 302',
      dateOccurred: new Date('2026-11-11T16:15:00Z'),
      colour: 'Space Gray',
      brand: 'Apple',
      distinguishingFeatures: 'Navy blue folding cover, Apple Pencil 2 attached magnetically on top',
      currentHoldingLocation: 'With Finder',
      contactPreference: 'EMAIL',
      status: 'ACTIVE',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?auto=format&fit=crop&w=800&q=80',
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Item 3: Found Hydro Flask Water Bottle (Claim Approved & Ready for Pickup)
  const item3 = await prisma.item.create({
    data: {
      referenceNumber: 'LF-2026-1003',
      reporterId: david.id,
      itemName: 'Hydro Flask 32oz Wide Mouth Water Bottle',
      categoryId: categories['Sports & Gym Equipment'].id,
      itemType: 'FOUND',
      publicDescription: 'Found a Pacific Blue insulated metal water bottle with a flex straw lid left near the bench press rack.',
      privateVerificationDetails: 'Bottom edge is dented from a drop. Has a National Park sticker and a computer science club sticker near the base.',
      location: 'Recreation & Aquatic Center - Weight Room',
      dateOccurred: new Date('2026-11-08T18:00:00Z'),
      colour: 'Pacific Blue',
      brand: 'Hydro Flask',
      distinguishingFeatures: 'Black flex straw cap, stickers on bottom rim',
      currentHoldingLocation: 'Deposited at Security Office (Building A)',
      contactPreference: 'IN_APP',
      status: 'AWAITING_COLLECTION',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=80',
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Item 4: Lost Leather Wallet (Claim collected & reunited!)
  const item4 = await prisma.item.create({
    data: {
      referenceNumber: 'LF-2026-1004',
      reporterId: priya.id,
      itemName: 'Brown Leather Bi-fold Wallet',
      categoryId: categories['Wallets & Bags'].id,
      itemType: 'FOUND',
      publicDescription: 'Found a distressed brown leather wallet on a dining table at the Student Union food court.',
      privateVerificationDetails: 'Contains driver license ending in 884, student ID for P. Sharma, and two metro cards.',
      location: 'Student Union Building - Main Food Court',
      dateOccurred: new Date('2026-11-05T12:45:00Z'),
      colour: 'Brown',
      brand: 'Fossil',
      distinguishingFeatures: 'Stitched leather border, brass logo emblem on front corner',
      currentHoldingLocation: 'Deposited at Administration Office',
      contactPreference: 'IN_APP',
      status: 'RETURNED',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1627123424574-724758594e93?auto=format&fit=crop&w=800&q=80',
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Item 5: Found Student ID Card & Keyring
  const item5 = await prisma.item.create({
    data: {
      referenceNumber: 'LF-2026-1005',
      reporterId: sarah.id,
      itemName: 'Student ID Card with Dorm Access Keyring',
      categoryId: categories['ID Cards & Keys'].id,
      itemType: 'FOUND',
      publicDescription: 'Found a university lanyard with student ID card and brass dormitory key attached.',
      privateVerificationDetails: 'The card bears student ID STU-2025-3319 and has a blue Pokémon keychain figurine attached.',
      location: 'North Campus Bus Stop',
      dateOccurred: new Date('2026-11-12T08:50:00Z'),
      colour: 'Navy / Silver',
      brand: 'University Official',
      distinguishingFeatures: 'Navy lanyard with university seal, 2 keys, 1 mini figurine',
      currentHoldingLocation: 'Security Office (Building A)',
      contactPreference: 'IN_APP',
      status: 'ACTIVE',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80',
            isPrimary: true,
          },
        ],
      },
    },
  });

  // Item 6: Lost North Face Backpack
  const item6 = await prisma.item.create({
    data: {
      referenceNumber: 'LF-2026-1006',
      reporterId: marcus.id,
      itemName: 'The North Face Borealis Backpack',
      categoryId: categories['Wallets & Bags'].id,
      itemType: 'LOST',
      publicDescription: 'Left my black backpack with neon green bungee cords near the cafe outdoor seating area. Contains engineering graph paper and lecture notes.',
      privateVerificationDetails: 'In the front zippered organiser compartment there is a TI-84 Plus CE Silver Edition calculator with name engraved.',
      location: 'Campus Cafe Outdoor Patio',
      dateOccurred: new Date('2026-11-12T13:10:00Z'),
      colour: 'Black & Neon Green',
      brand: 'The North Face',
      distinguishingFeatures: 'Reflective bike light loop, padded laptop sleeve inside',
      currentHoldingLocation: 'With Finder',
      contactPreference: 'IN_APP',
      status: 'ACTIVE',
      images: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=80',
            isPrimary: true,
          },
        ],
      },
    },
  });

  console.log('[Seed] Created items with images.');

  // 4. Seed Claims
  // Claim A: Priya claims the Sony Headphones (Item 1) -> Under Review
  const claim1 = await prisma.claim.create({
    data: {
      referenceNumber: 'CLM-2026-9001',
      itemId: item1.id,
      claimantId: priya.id,
      claimDescription: 'These are my Sony WH-1000XM4 headphones that I left at table 14 while studying for my Marketing exam on Tuesday.',
      identifyingCharacteristics: 'I bought them refurbished; they have a custom sticker "SJ-2024" on the inside hinge and the case contains an airplane 2-prong adapter.',
      supportingEvidence: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=400&q=80',
      status: 'UNDER_REVIEW',
      verificationNotes: 'Claimant correctly identified the inside hinge sticker engraving.',
    },
  });

  // Claim B: Sarah claims the Hydro Flask (Item 3) -> Approved with Collection!
  const claim2 = await prisma.claim.create({
    data: {
      referenceNumber: 'CLM-2026-9002',
      itemId: item3.id,
      claimantId: sarah.id,
      claimDescription: 'I lost my Pacific Blue Hydro Flask in the weight room after finishing my workout routine.',
      identifyingCharacteristics: 'It has a dent on the bottom rim from dropping it on concrete, and a Yosemite National Park sticker.',
      supportingEvidence: 'I can provide the Amazon order invoice showing purchase of the Pacific Blue 32oz bottle.',
      status: 'APPROVED',
      verificationNotes: 'Sticker placement matches private verification information exactly. Claim approved.',
    },
  });

  // Create Collection for Claim B (Scheduled)
  await prisma.collection.create({
    data: {
      claimId: claim2.id,
      collectionLocation: 'Campus Security Center, Desk 2 (West Wing Building A)',
      collectionInstructions: 'Please present your student ID card STU-2023-4412 to Officer Jenkins to collect your item.',
      scheduledAt: new Date('2026-11-14T10:00:00Z'),
      status: 'SCHEDULED',
      handoverNotes: 'Scheduled for morning pickup.',
    },
  });

  // Claim C: Priya claimed the Leather Wallet (Item 4) -> Completed & Collected
  const claim3 = await prisma.claim.create({
    data: {
      referenceNumber: 'CLM-2026-9003',
      itemId: item4.id,
      claimantId: priya.id,
      claimDescription: 'My brown wallet fell out of my tote bag while eating lunch at the food court.',
      identifyingCharacteristics: 'Contains my student ID card STU-2022-1054 and driver license.',
      supportingEvidence: 'In-person verification confirmed against photo ID.',
      status: 'APPROVED',
      verificationNotes: 'Student ID matches claimant directly. Ownership verified 100%.',
    },
  });

  await prisma.collection.create({
    data: {
      claimId: claim3.id,
      collectionLocation: 'Central Administration Office, Room 104',
      collectionInstructions: 'Handed over in person by administrative officer.',
      scheduledAt: new Date('2026-11-06T11:00:00Z'),
      collectedAt: new Date('2026-11-06T11:20:00Z'),
      confirmedById: admin.id,
      status: 'COLLECTED',
      handoverNotes: 'Student Priya Sharma verified in person and successfully retrieved her wallet.',
    },
  });

  console.log('[Seed] Created claims and collections.');

  // 5. Seed Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: marcus.id,
        title: 'New Ownership Claim Submitted',
        message: 'Student Priya Sharma has submitted an ownership claim for your found item: "Sony WH-1000XM4 Noise Canceling Headphones".',
        type: 'CLAIM_SUBMITTED',
        link: `/items/${item1.id}`,
        isRead: false,
      },
      {
        userId: sarah.id,
        title: 'Ownership Claim Approved!',
        message: 'Your claim for "Hydro Flask 32oz Wide Mouth Water Bottle" has been verified and approved. Please check collection details.',
        type: 'CLAIM_APPROVED',
        link: `/dashboard`,
        isRead: false,
      },
      {
        userId: sarah.id,
        title: 'Collection Scheduled',
        message: 'Collection scheduled for your Hydro Flask at Campus Security Center, Desk 2.',
        type: 'COLLECTION_SCHEDULED',
        link: `/dashboard`,
        isRead: false,
      },
      {
        userId: priya.id,
        title: 'Item Successfully Reunited',
        message: 'Your item "Brown Leather Bi-fold Wallet" has been recorded as safely returned. Thank you for using CampusConnect!',
        type: 'ITEM_RETURNED',
        link: `/dashboard`,
        isRead: true,
      },
    ],
  });

  // 6. Seed Audit Logs
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: admin.id,
        action: 'CLAIM_APPROVED',
        entityType: 'CLAIM',
        entityId: claim2.id,
        details: JSON.stringify({ referenceNumber: 'CLM-2026-9002', item: 'Hydro Flask 32oz' }),
      },
      {
        actorId: admin.id,
        action: 'COLLECTION_CONFIRMED',
        entityType: 'COLLECTION',
        entityId: claim3.id,
        details: JSON.stringify({ claimant: 'Priya Sharma', item: 'Brown Leather Bi-fold Wallet' }),
      },
      {
        actorId: admin.id,
        action: 'SYSTEM_INITIALIZED',
        entityType: 'SYSTEM',
        entityId: 'SYSTEM-ROOT',
        details: 'Initial system seeding completed with realistic campus dataset.',
      },
    ],
  });

  console.log('[Seed] Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('[Seed] Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
