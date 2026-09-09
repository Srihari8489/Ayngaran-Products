import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface VariantSpec {
  size: string;
  price: number;
  weightKg: number;
}

interface ProductData {
  name: string;
  slug: string;
  productCode: string;
  description: string;
  categorySlug: string;
  variants: VariantSpec[];
}

const CATEGORIES_DATA = [
  {
    name: 'Podi Varieties',
    slug: 'podi-varieties',
    categoryCode: 'CAT-PODI-001',
    description: 'Traditional and nutritious South Indian podi varieties prepared with pure authentic ingredients.',
    sortOrder: 1,
  },
  {
    name: 'Malt Varieties',
    slug: 'malt-varieties',
    categoryCode: 'CAT-MALT-001',
    description: 'Health-boosting natural malts, vitality drinks, and nutrient-dense wellness powders.',
    sortOrder: 2,
  },
  {
    name: 'Powder Varieties',
    slug: 'powder-varieties',
    categoryCode: 'CAT-POWDER-001',
    description: 'Pure, organic, unadulterated herbal and botanical wellness powders.',
    sortOrder: 3,
  },
  {
    name: 'Masala Varieties',
    slug: 'masala-varieties',
    categoryCode: 'CAT-MASALA-001',
    description: 'Authentic stone-ground masala blends crafted for traditional South Indian home cooking.',
    sortOrder: 4,
  },
  {
    name: 'Soup Varieties',
    slug: 'soup-varieties',
    categoryCode: 'CAT-SOUP-001',
    description: 'Restorative herbal and botanical soup mixes for everyday health and natural immunity.',
    sortOrder: 5,
  },
  {
    name: 'Others',
    slug: 'others',
    categoryCode: 'CAT-OTHERS-001',
    description: 'Wholesome snacks, healthy noodles, pasta, nutrient-rich muesli, and delicious chocolate treats.',
    sortOrder: 6,
  },
  {
    name: 'Skin Care',
    slug: 'skin-care',
    categoryCode: 'CAT-SKINCARE-001',
    description: '100% natural, chemical-free herbal personal and hair wellness care products.',
    sortOrder: 7,
  },
];

const PRODUCTS_DATA: ProductData[] = [
  // 1. Podi Varieties
  {
    name: 'Moringa Podi',
    slug: 'moringa-podi',
    productCode: 'AYG-PRD-MORINGA-PODI',
    description: 'Nutrient-rich Moringa leaf podi blended with traditional spices for daily vitality and immunity.',
    categorySlug: 'podi-varieties',
    variants: [
      { size: '50G', price: 70, weightKg: 0.05 },
      { size: '100G', price: 140, weightKg: 0.1 },
      { size: '200G', price: 280, weightKg: 0.2 },
      { size: '500G', price: 700, weightKg: 0.5 },
      { size: '1KG', price: 1400, weightKg: 1.0 },
    ],
  },
  {
    name: 'Karuveppillai Podi',
    slug: 'karuveppillai-podi',
    productCode: 'AYG-PRD-KARUVEPPILLAI-PODI',
    description: 'Fragrant and iron-rich Curry Leaf (Karuveppillai) podi, excellent for hair health and digestion.',
    categorySlug: 'podi-varieties',
    variants: [
      { size: '50G', price: 70, weightKg: 0.05 },
      { size: '100G', price: 140, weightKg: 0.1 },
      { size: '200G', price: 280, weightKg: 0.2 },
      { size: '500G', price: 700, weightKg: 0.5 },
      { size: '1KG', price: 1400, weightKg: 1.0 },
    ],
  },
  {
    name: 'Paruppu Podi',
    slug: 'paruppu-podi',
    productCode: 'AYG-PRD-PARUPPU-PODI',
    description: 'Classic roasted lentil podi with aromatic spices, best served hot with rice and ghee.',
    categorySlug: 'podi-varieties',
    variants: [
      { size: '100G', price: 100, weightKg: 0.1 },
      { size: '200G', price: 200, weightKg: 0.2 },
      { size: '500G', price: 500, weightKg: 0.5 },
    ],
  },

  // 2. Malt Varieties
  {
    name: 'U-Malt',
    slug: 'u-malt',
    productCode: 'AYG-PRD-U-MALT',
    description: 'Wholesome multigrain malt drink mix packed with vitamins and natural stamina boosters.',
    categorySlug: 'malt-varieties',
    variants: [
      { size: '50G', price: 80, weightKg: 0.05 },
      { size: '100G', price: 160, weightKg: 0.1 },
      { size: '200G', price: 320, weightKg: 0.2 },
      { size: '500G', price: 800, weightKg: 0.5 },
      { size: '1KG', price: 1600, weightKg: 1.0 },
    ],
  },
  {
    name: 'R-Malt',
    slug: 'r-malt',
    productCode: 'AYG-PRD-R-MALT',
    description: 'Traditional roasted ragi malt formulation rich in dietary calcium and sustained energy.',
    categorySlug: 'malt-varieties',
    variants: [
      { size: '50G', price: 80, weightKg: 0.05 },
      { size: '100G', price: 160, weightKg: 0.1 },
      { size: '200G', price: 320, weightKg: 0.2 },
      { size: '500G', price: 800, weightKg: 0.5 },
      { size: '1KG', price: 1600, weightKg: 1.0 },
    ],
  },
  {
    name: 'ABC Malt',
    slug: 'abc-malt',
    productCode: 'AYG-PRD-ABC-MALT',
    description: 'Apple, Beetroot & Carrot natural malt formula for skin glow and antioxidant wellness.',
    categorySlug: 'malt-varieties',
    variants: [
      { size: '100G', price: 150, weightKg: 0.1 },
      { size: '200G', price: 300, weightKg: 0.2 },
    ],
  },

  // 3. Powder Varieties
  {
    name: 'Dates Powder',
    slug: 'dates-powder',
    productCode: 'AYG-PRD-DATES-POWDER',
    description: 'Natural dried date sweetener powder, a wholesome and nutritious alternative to refined sugar.',
    categorySlug: 'powder-varieties',
    variants: [
      { size: '100G', price: 140, weightKg: 0.1 },
      { size: '200G', price: 280, weightKg: 0.2 },
      { size: '500G', price: 700, weightKg: 0.5 },
      { size: '1KG', price: 1400, weightKg: 1.0 },
    ],
  },
  {
    name: 'Raw Banana Powder',
    slug: 'raw-banana-powder',
    productCode: 'AYG-PRD-RAW-BANANA-POWDER',
    description: 'Potent prebiotic green banana flour rich in resistant starch for exceptional gut digestion.',
    categorySlug: 'powder-varieties',
    variants: [
      { size: '50G', price: 80, weightKg: 0.05 },
      { size: '100G', price: 160, weightKg: 0.1 },
      { size: '200G', price: 320, weightKg: 0.2 },
      { size: '500G', price: 800, weightKg: 0.5 },
      { size: '1KG', price: 1600, weightKg: 1.0 },
    ],
  },
  {
    name: 'Raw Moringa Powder',
    slug: 'raw-moringa-powder',
    productCode: 'AYG-PRD-RAW-MORINGA-POWDER',
    description: '100% pure shade-dried raw moringa leaves ground into a green superfood botanical powder.',
    categorySlug: 'powder-varieties',
    variants: [
      { size: '50G', price: 100, weightKg: 0.05 },
    ],
  },
  {
    name: 'Raw Karuveppillai Powder',
    slug: 'raw-karuveppillai-powder',
    productCode: 'AYG-PRD-RAW-KARUVEPPILLAI-POWDER',
    description: 'Pure raw dried curry leaf powder, ideal for hair root nourishment and internal detox.',
    categorySlug: 'powder-varieties',
    variants: [
      { size: '50G', price: 100, weightKg: 0.05 },
    ],
  },
  {
    name: 'Gut Free Powder',
    slug: 'gut-free-powder',
    productCode: 'AYG-PRD-GUT-FREE-POWDER',
    description: 'Specialized herbal blend formulated to soothe the stomach lining, relieve bloating, and aid digestion.',
    categorySlug: 'powder-varieties',
    variants: [
      { size: '100G', price: 140, weightKg: 0.1 },
      { size: '200G', price: 280, weightKg: 0.2 },
      { size: '500G', price: 700, weightKg: 0.5 },
      { size: '1KG', price: 1400, weightKg: 1.0 },
    ],
  },
  {
    name: 'Weight Loss Powder',
    slug: 'weight-loss-powder',
    productCode: 'AYG-PRD-WEIGHT-LOSS-POWDER',
    description: 'Natural herbal wellness formulation crafted to support active metabolism and healthy weight management.',
    categorySlug: 'powder-varieties',
    variants: [
      { size: '250G', price: 300, weightKg: 0.25 },
      { size: '500G', price: 500, weightKg: 0.5 },
      { size: '1KG', price: 1000, weightKg: 1.0 },
    ],
  },

  // 4. Masala Varieties
  {
    name: 'Sambar Powder',
    slug: 'sambar-powder',
    productCode: 'AYG-PRD-SAMBAR-POWDER',
    description: 'Aromatic traditional South Indian sambar masala ground from hand-picked lentils, coriander, and spices.',
    categorySlug: 'masala-varieties',
    variants: [
      { size: '100G', price: 80, weightKg: 0.1 },
    ],
  },
  {
    name: 'Rasam Powder',
    slug: 'rasam-powder',
    productCode: 'AYG-PRD-RASAM-POWDER',
    description: 'Classic zesty rasam powder infused with black pepper, cumin, and fragrant herbs.',
    categorySlug: 'masala-varieties',
    variants: [
      { size: '100G', price: 90, weightKg: 0.1 },
    ],
  },
  {
    name: 'All Fry Masala (Veg & Non-Veg)',
    slug: 'all-fry-masala-veg-non-veg',
    productCode: 'AYG-PRD-ALL-FRY-MASALA',
    description: 'Versatile crispy fry seasoning blend formulated for vegetables, paneer, and non-veg specialties.',
    categorySlug: 'masala-varieties',
    variants: [
      { size: '100G', price: 120, weightKg: 0.1 },
    ],
  },
  {
    name: 'Curry Masalas',
    slug: 'curry-masalas',
    productCode: 'AYG-PRD-CURRY-MASALAS',
    description: 'Multi-purpose traditional curry masala blend for deep, flavorful South Indian gravies and curries.',
    categorySlug: 'masala-varieties',
    variants: [
      { size: '100G', price: 90, weightKg: 0.1 },
    ],
  },
  {
    name: 'Kulambu Milagu Powder',
    slug: 'kulambu-milagu-powder',
    productCode: 'AYG-PRD-KULAMBU-MILAGU-POWDER',
    description: 'Spicy pepper-infused kulambu powder ideal for restorative milagu kuzhambu and medicinal gravies.',
    categorySlug: 'masala-varieties',
    variants: [
      { size: '100G', price: 90, weightKg: 0.1 },
    ],
  },

  // 5. Soup Varieties
  {
    name: 'Mudavatukal Soup Mix',
    slug: 'mudavatukal-soup-mix',
    productCode: 'AYG-PRD-MUDAVATUKAL-SOUP-MIX',
    description: 'Traditional Mudavatukal kizhangu botanical soup mix renowned for bone strength and joint comfort.',
    categorySlug: 'soup-varieties',
    variants: [
      { size: '50G', price: 120, weightKg: 0.05 },
      { size: '100G', price: 220, weightKg: 0.1 },
      { size: '200G', price: 380, weightKg: 0.2 },
    ],
  },
  {
    name: 'Moringa Soup Mix',
    slug: 'moringa-soup-mix',
    productCode: 'AYG-PRD-MORINGA-SOUP-MIX',
    description: 'Instant nutrient-dense moringa herbal soup mix, soothing, energizing, and rich in vitamins.',
    categorySlug: 'soup-varieties',
    variants: [
      { size: '50G', price: 80, weightKg: 0.05 },
      { size: '100G', price: 160, weightKg: 0.1 },
    ],
  },

  // 6. Others
  {
    name: 'Noodle & Pasta',
    slug: 'noodle-and-pasta',
    productCode: 'AYG-PRD-NOODLE-PASTA',
    description: 'Wholesome millet and grain noodles and pasta made without refined flour or artificial preservatives.',
    categorySlug: 'others',
    variants: [
      { size: 'PACKET', price: 150, weightKg: 0.2 },
    ],
  },
  {
    name: 'Museli',
    slug: 'museli',
    productCode: 'AYG-PRD-MUSELI',
    description: 'Healthy breakfast muesli loaded with rolled grains, nuts, and natural dried fruits.',
    categorySlug: 'others',
    variants: [
      { size: 'PACKET', price: 280, weightKg: 0.35 },
    ],
  },
  {
    name: 'Snacks',
    slug: 'snacks',
    productCode: 'AYG-PRD-SNACKS',
    description: 'Traditional and nutritious crunchy snacks prepared using natural cold-pressed oil and wholesome grains.',
    categorySlug: 'others',
    variants: [
      { size: 'PACKET', price: 150, weightKg: 0.2 },
    ],
  },
  {
    name: 'Choco Blast',
    slug: 'choco-blast',
    productCode: 'AYG-PRD-CHOCO-BLAST',
    description: 'Delicious chocolate energy crunch bites crafted with wholesome natural ingredients.',
    categorySlug: 'others',
    variants: [
      { size: 'PACKET', price: 200, weightKg: 0.2 },
    ],
  },

  // 7. Skin Care
  {
    name: 'Herbal Hair Dye',
    slug: 'herbal-hair-dye',
    productCode: 'AYG-PRD-HERBAL-HAIR-DYE',
    description: '100% natural, ammonia-free herbal hair dye formulation crafted from indigo, henna, and botanical herbs.',
    categorySlug: 'skin-care',
    variants: [
      { size: '20G', price: 150, weightKg: 0.02 },
      { size: '50G', price: 320, weightKg: 0.05 },
    ],
  },
];

async function runImport() {
  console.log('====================================================');
  console.log('🚀 IMPORTING AYNGARAN FOODS OFFICIAL CATALOG');
  console.log('====================================================\n');

  // STEP 1: Remove all testing data cleanly in correct foreign-key order
  console.log('🗑️  Step 1: Cleaning up existing testing data...');

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);

  await prisma.orderDeliveryAssignment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.review.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.cart.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.variantAttributeValue.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.productAttributeValue.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.categoryAttribute.deleteMany();
  await prisma.category.deleteMany();
  await prisma.brand.deleteMany();
  await prisma.attributeValue.deleteMany();
  await prisma.attribute.deleteMany();

  await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
  console.log('   ✅ All testing catalog and transactional data removed.\n');

  // STEP 2: Create Brand "Ayngaran Foods"
  console.log('🏷️  Step 2: Creating Brand: Ayngaran Foods...');
  const brand = await prisma.brand.create({
    data: {
      brandCode: 'BRD-AYN-001',
      name: 'Ayngaran Foods',
      slug: 'ayngaran-foods',
      description: 'Authentic traditional foods, healthy podi, natural malts, aromatic masalas, and pure herbal wellness products.',
      isActive: true,
    },
  });
  console.log(`   ✅ Brand created: ${brand.name} (${brand.brandCode})\n`);

  // STEP 3: Create Categories
  console.log('📂 Step 3: Creating Categories...');
  const categoryMap = new Map<string, number>();

  for (const cat of CATEGORIES_DATA) {
    const createdCat = await prisma.category.create({
      data: {
        categoryCode: cat.categoryCode,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, createdCat.id);
    console.log(`   📁 Category [${cat.sortOrder}]: ${createdCat.name} (${createdCat.categoryCode})`);
  }
  console.log('   ✅ All 7 categories created.\n');

  // STEP 4: Create Dynamic Attribute "Package Size" & Values
  console.log('⚙️  Step 4: Creating Dynamic Attribute: Package Size...');
  const packageSizeAttr = await prisma.attribute.create({
    data: {
      name: 'Package Size',
      slug: 'package-size',
      dataType: 'single_select',
      unit: null,
      isActive: true,
    },
  });

  const PACKAGE_SIZES = [
    { code: '20G', label: '20g', order: 1 },
    { code: '50G', label: '50g', order: 2 },
    { code: '100G', label: '100g', order: 3 },
    { code: '200G', label: '200g', order: 4 },
    { code: '250G', label: '250g', order: 5 },
    { code: '500G', label: '500g', order: 6 },
    { code: '1KG', label: '1kg', order: 7 },
    { code: 'PACKET', label: 'Packet', order: 8 },
  ];

  const attrValueMap = new Map<string, number>();

  for (const s of PACKAGE_SIZES) {
    const av = await prisma.attributeValue.create({
      data: {
        attributeId: packageSizeAttr.id,
        value: s.code,
        displayName: s.label,
        sortOrder: s.order,
        isActive: true,
      },
    });
    attrValueMap.set(s.code, av.id);
  }
  console.log(`   ✅ Dynamic attribute "Package Size" created with ${PACKAGE_SIZES.length} reusable values.\n`);

  // Map "Package Size" to all Categories as isVariant=true, isFilterable=true, isRequired=true
  console.log('🔗 Step 5: Mapping Attribute to all Categories...');
  for (const catId of categoryMap.values()) {
    await prisma.categoryAttribute.create({
      data: {
        categoryId: catId,
        attributeId: packageSizeAttr.id,
        isRequired: true,
        isFilterable: true,
        isVariant: true,
        sortOrder: 1,
      },
    });
  }
  console.log('   ✅ Attribute successfully mapped to all 7 categories.\n');

  // STEP 6: Import Products, Variants, and Initial Stock Ledgers
  console.log('📦 Step 6: Importing Products, Variants, and Stock Ledgers...');

  let totalVariantsCreated = 0;
  let totalPricesImported = 0;

  for (const p of PRODUCTS_DATA) {
    const categoryId = categoryMap.get(p.categorySlug);
    if (!categoryId) {
      throw new Error(`Category ${p.categorySlug} not found for product ${p.name}`);
    }

    // Base price is lowest variant price
    const minPrice = Math.min(...p.variants.map((v) => v.price));

    const createdProduct = await prisma.product.create({
      data: {
        productCode: p.productCode,
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: categoryId,
        brandId: brand.id,
        basePrice: minPrice,
        status: 'ACTIVE',
        minStockAlert: 5,
      },
    });

    console.log(`\n   🔹 Product: ${createdProduct.name} [${createdProduct.productCode}] (Base Price: ₹${minPrice})`);

    // Create Variants
    for (const v of p.variants) {
      const variantSku = `AYG-${p.slug.toUpperCase()}-${v.size}`;
      const attrValId = attrValueMap.get(v.size);
      if (!attrValId) {
        throw new Error(`Attribute value for ${v.size} not found`);
      }

      const initialStock = 50; // Initial healthy inventory for production launch

      const variant = await prisma.productVariant.create({
        data: {
          productId: createdProduct.id,
          sku: variantSku,
          price: v.price,
          stockQuantity: initialStock,
          weight: v.weightKg,
          status: 'ACTIVE',
        },
      });

      // Link Variant to Package Size Attribute Value
      await prisma.variantAttributeValue.create({
        data: {
          variantId: variant.id,
          attributeId: packageSizeAttr.id,
          attributeValueId: attrValId,
        },
      });

      // Record Initial Stock in Immutable Inventory Transaction Ledger
      await prisma.inventoryTransaction.create({
        data: {
          productId: createdProduct.id,
          variantId: variant.id,
          type: 'INITIAL',
          quantityChange: initialStock,
          previousQuantity: 0,
          newQuantity: initialStock,
          reason: 'Initial stock intake from Ayngaran Foods Official Price List import',
        },
      });

      totalVariantsCreated++;
      totalPricesImported++;
      console.log(`      🔸 Variant: ${v.size} → ₹${v.price} (SKU: ${variantSku}, Stock: ${initialStock})`);
    }
  }

  console.log('\n====================================================');
  console.log('🎉 AYNGARAN FOODS CATALOG IMPORT COMPLETE!');
  console.log('====================================================');
  console.log(`Categories created: ${categoryMap.size}`);
  console.log(`Brands created: 1 (${brand.name})`);
  console.log(`Products created: ${PRODUCTS_DATA.length}`);
  console.log(`Variants created: ${totalVariantsCreated}`);
  console.log(`Prices imported: ${totalPricesImported}`);
  console.log(`Products without images: ${PRODUCTS_DATA.length} (Editable from Admin)`);
  console.log(`Products with missing package sizes (hyphenated exclusions): Handled strictly per Word doc.`);
  console.log('====================================================\n');
}

runImport()
  .catch((err) => {
    console.error('❌ Import failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
