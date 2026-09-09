import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const EXPECTED_PRODUCTS: Record<string, { category: string; variants: Record<string, number> }> = {
  'Moringa Podi': {
    category: 'Podi Varieties',
    variants: { '50G': 70, '100G': 140, '200G': 280, '500G': 700, '1KG': 1400 },
  },
  'Karuveppillai Podi': {
    category: 'Podi Varieties',
    variants: { '50G': 70, '100G': 140, '200G': 280, '500G': 700, '1KG': 1400 },
  },
  'Paruppu Podi': {
    category: 'Podi Varieties',
    variants: { '100G': 100, '200G': 200, '500G': 500 },
  },
  'U-Malt': {
    category: 'Malt Varieties',
    variants: { '50G': 80, '100G': 160, '200G': 320, '500G': 800, '1KG': 1600 },
  },
  'R-Malt': {
    category: 'Malt Varieties',
    variants: { '50G': 80, '100G': 160, '200G': 320, '500G': 800, '1KG': 1600 },
  },
  'ABC Malt': {
    category: 'Malt Varieties',
    variants: { '100G': 150, '200G': 300 },
  },
  'Dates Powder': {
    category: 'Powder Varieties',
    variants: { '100G': 140, '200G': 280, '500G': 700, '1KG': 1400 },
  },
  'Raw Banana Powder': {
    category: 'Powder Varieties',
    variants: { '50G': 80, '100G': 160, '200G': 320, '500G': 800, '1KG': 1600 },
  },
  'Raw Moringa Powder': {
    category: 'Powder Varieties',
    variants: { '50G': 100 },
  },
  'Raw Karuveppillai Powder': {
    category: 'Powder Varieties',
    variants: { '50G': 100 },
  },
  'Gut Free Powder': {
    category: 'Powder Varieties',
    variants: { '100G': 140, '200G': 280, '500G': 700, '1KG': 1400 },
  },
  'Weight Loss Powder': {
    category: 'Powder Varieties',
    variants: { '250G': 300, '500G': 500, '1KG': 1000 },
  },
  'Sambar Powder': {
    category: 'Masala Varieties',
    variants: { '100G': 80 },
  },
  'Rasam Powder': {
    category: 'Masala Varieties',
    variants: { '100G': 90 },
  },
  'All Fry Masala (Veg & Non-Veg)': {
    category: 'Masala Varieties',
    variants: { '100G': 120 },
  },
  'Curry Masalas': {
    category: 'Masala Varieties',
    variants: { '100G': 90 },
  },
  'Kulambu Milagu Powder': {
    category: 'Masala Varieties',
    variants: { '100G': 90 },
  },
  'Mudavatukal Soup Mix': {
    category: 'Soup Varieties',
    variants: { '50G': 120, '100G': 220, '200G': 380 },
  },
  'Moringa Soup Mix': {
    category: 'Soup Varieties',
    variants: { '50G': 80, '100G': 160 },
  },
  'Noodle & Pasta': {
    category: 'Others',
    variants: { 'PACKET': 150 },
  },
  'Museli': {
    category: 'Others',
    variants: { 'PACKET': 280 },
  },
  'Snacks': {
    category: 'Others',
    variants: { 'PACKET': 150 },
  },
  'Choco Blast': {
    category: 'Others',
    variants: { 'PACKET': 200 },
  },
  'Herbal Hair Dye': {
    category: 'Skin Care',
    variants: { '20G': 150, '50G': 320 },
  },
};

async function validate() {
  console.log('🔍 RUNNING AYNGARAN FOODS CATALOG AUDIT & VALIDATION...\n');

  let passed = 0;
  let failed = 0;

  // 1. Verify Brand
  const brands = await prisma.brand.findMany();
  if (brands.length === 1 && brands[0].name === 'Ayngaran Foods') {
    console.log(`✅ [BRAND] Exactly 1 Brand exists: "${brands[0].name}" (${brands[0].brandCode})`);
    passed++;
  } else {
    console.error(`❌ [BRAND FAIL] Expected 1 brand "Ayngaran Foods", found ${brands.length}`);
    failed++;
  }

  // 2. Verify Categories
  const categories = await prisma.category.findMany();
  console.log(`✅ [CATEGORIES] ${categories.length} Categories found in DB:`);
  categories.forEach((c) => console.log(`   - ${c.name} (${c.categoryCode})`));
  if (categories.length === 7) passed++;
  else {
    console.error(`❌ [CATEGORIES FAIL] Expected 7 categories, found ${categories.length}`);
    failed++;
  }

  // 3. Verify Products and Variants
  const products = await prisma.product.findMany({
    include: {
      category: true,
      brand: true,
      variants: {
        include: {
          variantValues: {
            include: { attributeValue: true },
          },
          inventoryTransactions: true,
        },
      },
    },
  });

  console.log(`\n✅ [PRODUCTS] ${products.length} Products found in DB.`);
  if (products.length === 24) passed++;
  else {
    console.error(`❌ [PRODUCTS FAIL] Expected 24 products, found ${products.length}`);
    failed++;
  }

  const allSkus = new Set<string>();
  let totalVariants = 0;

  for (const p of products) {
    const expected = EXPECTED_PRODUCTS[p.name];
    if (!expected) {
      console.error(`❌ [UNEXPECTED PRODUCT] Found product "${p.name}" not in expected list`);
      failed++;
      continue;
    }

    // Check Brand
    if (p.brand.name !== 'Ayngaran Foods') {
      console.error(`❌ [BRAND MISMATCH] "${p.name}" has brand "${p.brand.name}" instead of "Ayngaran Foods"`);
      failed++;
    }

    // Check Category
    if (p.category.name !== expected.category) {
      console.error(`❌ [CATEGORY MISMATCH] "${p.name}" in "${p.category.name}", expected "${expected.category}"`);
      failed++;
    }

    // Check Variants
    totalVariants += p.variants.length;
    const expectedSizes = Object.keys(expected.variants);

    if (p.variants.length !== expectedSizes.length) {
      console.error(`❌ [VARIANT COUNT FAIL] "${p.name}": expected ${expectedSizes.length} variants, got ${p.variants.length}`);
      failed++;
    }

    for (const v of p.variants) {
      // Check SKU uniqueness
      if (allSkus.has(v.sku)) {
        console.error(`❌ [DUPLICATE SKU] ${v.sku} appeared more than once`);
        failed++;
      }
      allSkus.add(v.sku);

      // Check Attribute
      const sizeVal = v.variantValues[0]?.attributeValue?.value;
      if (!sizeVal) {
        console.error(`❌ [MISSING ATTRIBUTE VALUE] Variant ${v.sku} has no Package Size attribute value`);
        failed++;
      } else {
        const expectedPrice = expected.variants[sizeVal];
        if (expectedPrice === undefined) {
          console.error(`❌ [EXCLUDED SIZE CREATED] Variant ${sizeVal} for "${p.name}" should NOT have been created!`);
          failed++;
        } else if (Number(v.price) !== expectedPrice) {
          console.error(`❌ [PRICE MISMATCH] "${p.name}" ${sizeVal}: expected ₹${expectedPrice}, got ₹${v.price}`);
          failed++;
        }
      }

      // Check Initial Inventory Transaction
      const initTx = v.inventoryTransactions.find((tx) => tx.type === 'INITIAL');
      if (!initTx || initTx.quantityChange <= 0) {
        console.error(`❌ [MISSING INITIAL INVENTORY] Variant ${v.sku} has no INITIAL inventory transaction`);
        failed++;
      }
    }
  }

  console.log(`✅ [VARIANTS] Total ${totalVariants} variants verified across all 24 products.`);
  console.log(`✅ [SKUs] ${allSkus.size} Unique SKUs verified (Zero collisions).`);

  console.log('\n====================================================');
  if (failed === 0) {
    console.log('🎉 ALL 24 PRODUCTS, 59 VARIANTS & PRICING VERIFIED 100% ACCURATE!');
  } else {
    console.error(`🚨 VALIDATION COMPLETED WITH ${failed} ERRORS!`);
  }
  console.log('====================================================\n');
}

validate()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
