import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "@workspace/db";
import {
  wilayasTable, usersTable, categoriesTable, servicesTable, sellerWalletsTable,
} from "@workspace/db";

const WILAYAS = [
  { code: "01", name_fr: "Adrar", name_ar: "أدرار", region: "Sud-Ouest" },
  { code: "02", name_fr: "Chlef", name_ar: "الشلف", region: "Nord-Ouest" },
  { code: "03", name_fr: "Laghouat", name_ar: "الأغواط", region: "Centre" },
  { code: "04", name_fr: "Oum El Bouaghi", name_ar: "أم البواقي", region: "Nord-Est" },
  { code: "05", name_fr: "Batna", name_ar: "باتنة", region: "Nord-Est" },
  { code: "06", name_fr: "Béjaïa", name_ar: "بجاية", region: "Nord-Est" },
  { code: "07", name_fr: "Biskra", name_ar: "بسكرة", region: "Centre" },
  { code: "08", name_fr: "Béchar", name_ar: "بشار", region: "Sud-Ouest" },
  { code: "09", name_fr: "Blida", name_ar: "البليدة", region: "Centre" },
  { code: "10", name_fr: "Bouira", name_ar: "البويرة", region: "Centre" },
  { code: "11", name_fr: "Tamanrasset", name_ar: "تمنراست", region: "Grand-Sud" },
  { code: "12", name_fr: "Tébessa", name_ar: "تبسة", region: "Nord-Est" },
  { code: "13", name_fr: "Tlemcen", name_ar: "تلمسان", region: "Nord-Ouest", is_pilot: true },
  { code: "14", name_fr: "Tiaret", name_ar: "تيارت", region: "Centre-Ouest" },
  { code: "15", name_fr: "Tizi Ouzou", name_ar: "تيزي وزو", region: "Nord", is_pilot: true },
  { code: "16", name_fr: "Alger", name_ar: "الجزائر", region: "Centre", is_pilot: true },
  { code: "17", name_fr: "Djelfa", name_ar: "الجلفة", region: "Centre" },
  { code: "18", name_fr: "Jijel", name_ar: "جيجل", region: "Nord-Est" },
  { code: "19", name_fr: "Sétif", name_ar: "سطيف", region: "Nord-Est" },
  { code: "20", name_fr: "Saïda", name_ar: "سعيدة", region: "Nord-Ouest" },
  { code: "21", name_fr: "Skikda", name_ar: "سكيكدة", region: "Nord-Est" },
  { code: "22", name_fr: "Sidi Bel Abbès", name_ar: "سيدي بلعباس", region: "Nord-Ouest" },
  { code: "23", name_fr: "Annaba", name_ar: "عنابة", region: "Nord-Est" },
  { code: "24", name_fr: "Guelma", name_ar: "قالمة", region: "Nord-Est" },
  { code: "25", name_fr: "Constantine", name_ar: "قسنطينة", region: "Nord-Est", is_pilot: true },
  { code: "26", name_fr: "Médéa", name_ar: "المدية", region: "Centre" },
  { code: "27", name_fr: "Mostaganem", name_ar: "مستغانم", region: "Nord-Ouest" },
  { code: "28", name_fr: "M'Sila", name_ar: "المسيلة", region: "Centre" },
  { code: "29", name_fr: "Mascara", name_ar: "معسكر", region: "Nord-Ouest" },
  { code: "30", name_fr: "Ouargla", name_ar: "ورقلة", region: "Sud" },
  { code: "31", name_fr: "Oran", name_ar: "وهران", region: "Nord-Ouest", is_pilot: true },
  { code: "32", name_fr: "El Bayadh", name_ar: "البيض", region: "Sud-Ouest" },
  { code: "33", name_fr: "Illizi", name_ar: "إليزي", region: "Grand-Sud" },
  { code: "34", name_fr: "Bordj Bou Arréridj", name_ar: "برج بوعريريج", region: "Centre" },
  { code: "35", name_fr: "Boumerdès", name_ar: "بومرداس", region: "Centre" },
  { code: "36", name_fr: "El Tarf", name_ar: "الطارف", region: "Nord-Est" },
  { code: "37", name_fr: "Tindouf", name_ar: "تندوف", region: "Grand-Sud" },
  { code: "38", name_fr: "Tissemsilt", name_ar: "تيسمسيلت", region: "Centre-Ouest" },
  { code: "39", name_fr: "El Oued", name_ar: "الوادي", region: "Sud" },
  { code: "40", name_fr: "Khenchela", name_ar: "خنشلة", region: "Nord-Est" },
  { code: "41", name_fr: "Souk Ahras", name_ar: "سوق أهراس", region: "Nord-Est" },
  { code: "42", name_fr: "Tipaza", name_ar: "تيبازة", region: "Centre" },
  { code: "43", name_fr: "Mila", name_ar: "ميلة", region: "Nord-Est" },
  { code: "44", name_fr: "Aïn Defla", name_ar: "عين الدفلى", region: "Centre-Ouest" },
  { code: "45", name_fr: "Naâma", name_ar: "النعامة", region: "Sud-Ouest" },
  { code: "46", name_fr: "Aïn Témouchent", name_ar: "عين تيموشنت", region: "Nord-Ouest" },
  { code: "47", name_fr: "Ghardaïa", name_ar: "غرداية", region: "Sud" },
  { code: "48", name_fr: "Relizane", name_ar: "غليزان", region: "Nord-Ouest" },
  { code: "49", name_fr: "Timimoun", name_ar: "تيميمون", region: "Grand-Sud" },
  { code: "50", name_fr: "Bordj Badji Mokhtar", name_ar: "برج باجي مختار", region: "Grand-Sud" },
  { code: "51", name_fr: "Ouled Djellal", name_ar: "أولاد جلال", region: "Sud" },
  { code: "52", name_fr: "Béni Abbès", name_ar: "بني عباس", region: "Sud-Ouest" },
  { code: "53", name_fr: "In Salah", name_ar: "عين صالح", region: "Grand-Sud" },
  { code: "54", name_fr: "In Guezzam", name_ar: "عين قزام", region: "Grand-Sud" },
  { code: "55", name_fr: "Touggourt", name_ar: "تقرت", region: "Sud" },
  { code: "56", name_fr: "Djanet", name_ar: "جانت", region: "Grand-Sud" },
  { code: "57", name_fr: "El M'Ghair", name_ar: "المغير", region: "Sud" },
  { code: "58", name_fr: "El Meniaa", name_ar: "المنيعة", region: "Sud" },
];

const CATEGORIES = [
  { name_fr: "Thèse & Mémoire", name_ar: "مذكرة وأطروحة", slug: "these-memoire", icon: "📚" },
  { name_fr: "Présentation PPT", name_ar: "عرض تقديمي", slug: "ppt-presentation", icon: "📊" },
  { name_fr: "Traduction", name_ar: "ترجمة", slug: "traduction", icon: "🌐" },
  { name_fr: "Développement Web", name_ar: "تطوير ويب", slug: "developpement-web", icon: "💻" },
  { name_fr: "Design Graphique", name_ar: "تصميم جرافيك", slug: "design-graphique", icon: "🎨" },
  { name_fr: "Saisie & Frappe", name_ar: "إدخال البيانات", slug: "saisie-frappe", icon: "⌨️" },
  { name_fr: "Tutorat & Cours", name_ar: "دروس خصوصية", slug: "tutorat", icon: "🎓" },
  { name_fr: "Correction & Relecture", name_ar: "تدقيق لغوي", slug: "correction", icon: "✏️" },
  { name_fr: "Marketing Digital", name_ar: "تسويق رقمي", slug: "marketing", icon: "📱" },
  { name_fr: "Autre", name_ar: "أخرى", slug: "autre", icon: "📦" },
];

async function seed() {
  console.log("🌱 Seeding database...");

  // Wilayas
  console.log("  → Inserting 58 wilayas...");
  for (const w of WILAYAS) {
    await db.insert(wilayasTable).values({
      code: w.code,
      nameFr: w.name_fr,
      nameAr: w.name_ar,
      region: w.region,
      isPilot: !!(w as any).is_pilot,
      isActive: true,
    }).onConflictDoNothing();
  }

  // Categories
  console.log("  → Inserting categories...");
  for (let i = 0; i < CATEGORIES.length; i++) {
    const c = CATEGORIES[i];
    await db.insert(categoriesTable).values({
      nameFr: c.name_fr,
      nameAr: c.name_ar,
      slug: c.slug,
      icon: c.icon,
      sortOrder: i,
      isActive: true,
    }).onConflictDoNothing();
  }

  // Fetch inserted wilayas for IDs
  const allWilayas = await db.select().from(wilayasTable);
  const alger = allWilayas.find(w => w.code === "16");
  const oran = allWilayas.find(w => w.code === "31");
  const constantine = allWilayas.find(w => w.code === "25");

  // Demo users
  console.log("  → Creating demo accounts...");
  const adminHash = await bcrypt.hash("Admin123!", 12);
  const sellerHash = await bcrypt.hash("Seller123!", 12);
  const clientHash = await bcrypt.hash("Client123!", 12);

  const adminRows = await db.insert(usersTable).values({
    name: "Admin UnivMarket",
    email: "admin@univmarket.dz",
    passwordHash: adminHash,
    role: "admin",
    wilayaId: alger?.id ?? 1,
    phone: "0555000000",
    bio: "Administrateur de la plateforme UnivMarket",
    verifiedAt: new Date().toISOString(),
    referralCode: "ADMIN001",
    trustScore: 100,
  }).onConflictDoNothing().returning();

  const sellerRows = await db.insert(usersTable).values({
    name: "Ahmed Benali",
    email: "seller@univmarket.dz",
    passwordHash: sellerHash,
    role: "seller",
    wilayaId: oran?.id ?? 2,
    phone: "0555111111",
    bio: "Doctorant en informatique à l'Université d'Oran. Spécialisé en rédaction académique et développement web.",
    verifiedAt: new Date().toISOString(),
    referralCode: "SELLER001",
    trustScore: 87,
  }).onConflictDoNothing().returning();

  const clientRows = await db.insert(usersTable).values({
    name: "Sara Meziane",
    email: "client@univmarket.dz",
    passwordHash: clientHash,
    role: "client",
    wilayaId: constantine?.id ?? 3,
    phone: "0555222222",
    bio: "Étudiante en master à l'Université Mentouri de Constantine.",
    referralCode: "CLIENT001",
    trustScore: 75,
  }).onConflictDoNothing().returning();

  const seller = sellerRows[0];

  // Create wallet for seller
  if (seller?.id) {
    await db.insert(sellerWalletsTable).values({
      sellerId: seller.id,
      balance: 12500,
      pendingBalance: 3200,
      totalEarned: 45800,
      totalWithdrawn: 30100,
    }).onConflictDoNothing();
  }

  // Sample services for demo seller
  if (seller?.id) {
    const cats = await db.select().from(categoriesTable);
    const cat1 = cats.find(c => c.slug === "these-memoire");
    const cat2 = cats.find(c => c.slug === "developpement-web");
    const cat3 = cats.find(c => c.slug === "ppt-presentation");
    const cat4 = cats.find(c => c.slug === "correction");

    const SAMPLE_SERVICES = [
      {
        sellerId: seller.id,
        categoryId: cat1?.id ?? 1,
        wilayaId: oran?.id ?? 2,
        titleFr: "Rédaction et correction de mémoire de master (toutes spécialités)",
        titleAr: "كتابة وتصحيح مذكرة الماستر (جميع التخصصات)",
        descriptionFr: "Je vous aide à rédiger, corriger et mettre en forme votre mémoire de master selon les normes académiques algériennes. Plus de 5 ans d'expérience et 200+ mémoires rédigés avec succès.",
        price: 8000,
        priceType: "fixed",
        deliveryDays: 7,
        status: "approved",
        isFeatured: true,
        viewsCount: 342,
      },
      {
        sellerId: seller.id,
        categoryId: cat2?.id ?? 2,
        wilayaId: oran?.id ?? 2,
        titleFr: "Développement d'application web complète (React + Node.js)",
        titleAr: "تطوير تطبيق ويب متكامل",
        descriptionFr: "Développement d'applications web modernes avec React, Node.js, PostgreSQL. Idéal pour projets de fin d'études et applications académiques.",
        price: 25000,
        priceType: "fixed",
        deliveryDays: 14,
        status: "approved",
        isFeatured: true,
        viewsCount: 198,
      },
      {
        sellerId: seller.id,
        categoryId: cat3?.id ?? 3,
        wilayaId: oran?.id ?? 2,
        titleFr: "Création de présentations PowerPoint professionnelles",
        titleAr: "إنشاء عروض باوربوينت احترافية",
        descriptionFr: "Création de présentations PowerPoint visuellement attractives pour soutenances, cours et conférences. Design moderne et professionnel.",
        price: 2500,
        priceType: "fixed",
        deliveryDays: 2,
        status: "approved",
        viewsCount: 127,
      },
      {
        sellerId: seller.id,
        categoryId: cat4?.id ?? 4,
        wilayaId: oran?.id ?? 2,
        titleFr: "Correction et relecture de thèse de doctorat",
        titleAr: "تصحيح ومراجعة أطروحة الدكتوراه",
        descriptionFr: "Correction orthographique, grammaticale et stylistique de thèses de doctorat. Mise en forme selon les normes de votre université.",
        price: 15000,
        priceType: "fixed",
        deliveryDays: 10,
        status: "pending",
        viewsCount: 45,
      },
      {
        sellerId: seller.id,
        categoryId: cat1?.id ?? 1,
        wilayaId: alger?.id ?? 1,
        titleFr: "Aide à la rédaction de rapport de stage",
        descriptionFr: "Rédaction professionnelle de rapports de stage selon les normes de votre université.",
        price: 3500,
        priceType: "fixed",
        deliveryDays: 4,
        status: "approved",
        viewsCount: 89,
      },
    ];

    for (const svc of SAMPLE_SERVICES) {
      await db.insert(servicesTable).values(svc as any).onConflictDoNothing();
    }
  }

  console.log("✅ Seeding complete!");
  console.log("");
  console.log("Demo accounts:");
  console.log("  Admin:  admin@univmarket.dz  / Admin123!");
  console.log("  Seller: seller@univmarket.dz / Seller123!");
  console.log("  Client: client@univmarket.dz / Client123!");
  process.exit(0);
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
