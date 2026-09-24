import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';

const prisma = new PrismaClient();

function encryptSecret(text: string, secretKey: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(secretKey, 'utf-8'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');
  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
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

const PRODUCTS_DATA = [
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

async function main() {
  console.log('🌱 Starting Ayngaran Foods Official Database Seed...');

  const encryptionKey = process.env.ENCRYPTION_KEY || '01234567890123456789012345678901';

  // 1. Seed Permissions
  console.log('  -> Seeding Permissions...');
  const permissionsData = [
    { code: 'PRODUCTS_MANAGE', name: 'Manage Products', module: 'Products' },
    { code: 'CATEGORIES_MANAGE', name: 'Manage Categories', module: 'Catalog' },
    { code: 'BRANDS_MANAGE', name: 'Manage Brands', module: 'Catalog' },
    { code: 'ATTRIBUTES_MANAGE', name: 'Manage Attributes', module: 'Catalog' },
    { code: 'ORDERS_MANAGE', name: 'Manage Orders', module: 'Orders' },
    { code: 'INVENTORY_MANAGE', name: 'Manage Inventory', module: 'Inventory' },
    { code: 'PAYMENTS_MANAGE', name: 'Manage Payments', module: 'Payments' },
    { code: 'DELIVERY_MANAGE', name: 'Manage Delivery', module: 'Delivery' },
    { code: 'STAFF_MANAGE', name: 'Manage Staff', module: 'Staff' },
    { code: 'REPORTS_VIEW', name: 'View Reports', module: 'Reports' },
    { code: 'REVIEWS_MODERATE', name: 'Moderate Reviews', module: 'Reviews' },
    { code: 'AUDIT_VIEW', name: 'View Audit Logs', module: 'Audit' },
  ];

  const permissions: Record<string, any> = {};
  for (const p of permissionsData) {
    permissions[p.code] = await prisma.permission.upsert({
      where: { code: p.code },
      update: {},
      create: p,
    });
  }

  // 2. Seed Roles
  console.log('  -> Seeding Roles...');
  const superAdminRole = await prisma.role.upsert({
    where: { name: 'SUPER_ADMIN' },
    update: {},
    create: {
      name: 'SUPER_ADMIN',
      description: 'Full unrestricted system access across all modules',
    },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: {
      name: 'ADMIN',
      description: 'Operations administrator with catalog, orders, and inventory access',
    },
  });

  // Map all permissions to Super Admin
  for (const p of Object.values(permissions)) {
    await prisma.rolePermission.upsert({
      where: {
        roleId_permissionId: {
          roleId: superAdminRole.id,
          permissionId: p.id,
        },
      },
      update: {},
      create: {
        roleId: superAdminRole.id,
        permissionId: p.id,
      },
    });
  }

  // 3. Seed Super Admin Staff
  console.log('  -> Seeding Staff Accounts...');
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash('Admin@123AYNGARAN', salt);

  const superAdminStaff = await prisma.staff.upsert({
    where: { email: 'admin@ayngaran.com' },
    update: { passwordHash },
    create: {
      staffCode: 'STF-001',
      name: 'Srihari (Super Admin)',
      email: 'admin@ayngaran.com',
      phone: '+91 9876543210',
      passwordHash,
      roleId: superAdminRole.id,
      isActive: true,
    },
  });
 
  // 4. Seed Sample Customer User
  console.log('  -> Seeding Sample Customer...');
  const sampleUser = await prisma.user.upsert({
    where: { email: 'customer@ayngaran.com' },
    update: {},
    create: {
      userCode: 'USR-001',
      name: 'Karthik Raja',
      email: 'customer@ayngaran.com',
      phone: '9876543210',
      isActive: true,
    },
  });

  // 5. Seed Brand "Ayngaran Foods"
  console.log('  -> Seeding Brand: Ayngaran Foods...');
  const brand = await prisma.brand.upsert({
    where: { slug: 'ayngaran-foods' },
    update: {},
    create: {
      brandCode: 'BRD-AYN-001',
      name: 'Ayngaran Foods',
      slug: 'ayngaran-foods',
      description: 'Authentic traditional foods, healthy podi, natural malts, aromatic masalas, and pure herbal wellness products.',
      isActive: true,
    },
  });

  // 6. Seed Categories
  console.log('  -> Seeding Categories...');
  const categoryMap = new Map<string, any>();
  for (const cat of CATEGORIES_DATA) {
    const createdCat = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: {
        categoryCode: cat.categoryCode,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        sortOrder: cat.sortOrder,
        isActive: true,
      },
    });
    categoryMap.set(cat.slug, createdCat);
  }

  // 7. Seed Dynamic Attribute "Package Size" & Values
  console.log('  -> Seeding Dynamic Attribute: Package Size...');
  const packageSizeAttr = await prisma.attribute.upsert({
    where: { slug: 'package-size' },
    update: {},
    create: {
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

  const attrValueMap = new Map<string, any>();
  for (const s of PACKAGE_SIZES) {
    let av = await prisma.attributeValue.findFirst({
      where: { attributeId: packageSizeAttr.id, value: s.code },
    });
    if (!av) {
      av = await prisma.attributeValue.create({
        data: {
          attributeId: packageSizeAttr.id,
          value: s.code,
          displayName: s.label,
          sortOrder: s.order,
          isActive: true,
        },
      });
    }
    attrValueMap.set(s.code, av);
  }

  // Map to categories
  for (const cat of categoryMap.values()) {
    await prisma.categoryAttribute.upsert({
      where: {
        categoryId_attributeId: {
          categoryId: cat.id,
          attributeId: packageSizeAttr.id,
        },
      },
      update: {},
      create: {
        categoryId: cat.id,
        attributeId: packageSizeAttr.id,
        isRequired: true,
        isFilterable: true,
        isVariant: true,
        sortOrder: 1,
      },
    });
  }

  // 8. Seed Products, Variants & Inventory
  console.log('  -> Seeding Products & Variants...');
  for (const p of PRODUCTS_DATA) {
    const cat = categoryMap.get(p.categorySlug);
    const minPrice = Math.min(...p.variants.map((v) => v.price));

    const prod = await prisma.product.upsert({
      where: { productCode: p.productCode },
      update: {},
      create: {
        productCode: p.productCode,
        name: p.name,
        slug: p.slug,
        description: p.description,
        categoryId: cat.id,
        brandId: brand.id,
        basePrice: minPrice,
        status: 'ACTIVE',
        minStockAlert: 5,
      },
    });

    for (const v of p.variants) {
      const sku = `AYG-${p.slug.toUpperCase()}-${v.size}`;
      const attrVal = attrValueMap.get(v.size);

      const variant = await prisma.productVariant.upsert({
        where: { sku },
        update: {},
        create: {
          productId: prod.id,
          sku,
          price: v.price,
          stockQuantity: 50,
          weight: v.weightKg,
          status: 'ACTIVE',
        },
      });

      await prisma.variantAttributeValue.upsert({
        where: {
          variantId_attributeId: {
            variantId: variant.id,
            attributeId: packageSizeAttr.id,
          },
        },
        update: {},
        create: {
          variantId: variant.id,
          attributeId: packageSizeAttr.id,
          attributeValueId: attrVal.id,
        },
      });

      // Ledger
      const existingTx = await prisma.inventoryTransaction.findFirst({
        where: { variantId: variant.id, type: 'INITIAL' },
      });
      if (!existingTx) {
        await prisma.inventoryTransaction.create({
          data: {
            productId: prod.id,
            variantId: variant.id,
            staffId: superAdminStaff.id,
            type: 'INITIAL',
            quantityChange: 50,
            previousQuantity: 0,
            newQuantity: 50,
            reason: 'Initial stock intake from Ayngaran Foods Official Price List import',
          },
        });
      }
    }
  }

  // 9. Seed Payment Gateways
  console.log('  -> Seeding Payment Gateways...');
  await prisma.paymentGateway.upsert({
    where: { code: 'COD' },
    update: {},
    create: {
      code: 'COD',
      name: 'Cash on Delivery',
      isEnabled: true,
      mode: 'LIVE',
      supportedMethodsJson: JSON.stringify(['CASH']),
    },
  });

  await prisma.paymentGateway.upsert({
    where: { code: 'MOCK' },
    update: {},
    create: {
      code: 'MOCK',
      name: 'Instant Sandbox Gateway',
      isEnabled: true,
      mode: 'TEST',
      supportedMethodsJson: JSON.stringify(['UPI', 'CARD', 'NETBANKING']),
    },
  });

  const encryptedRazorpaySecret = encryptSecret('rzp_test_secret_sample_key_9999', encryptionKey);
  const encryptedWebhookSecret = encryptSecret('whsec_test_webhook_key_1234', encryptionKey);

  await prisma.paymentGateway.upsert({
    where: { code: 'RAZORPAY' },
    update: {
      encryptedSecretKey: encryptedRazorpaySecret,
      encryptedWebhookSecret,
    },
    create: {
      code: 'RAZORPAY',
      name: 'Razorpay Secure Checkout',
      isEnabled: true,
      mode: 'TEST',
      keyId: 'rzp_test_sampleKeyId123',
      encryptedSecretKey: encryptedRazorpaySecret,
      encryptedWebhookSecret,
      supportedMethodsJson: JSON.stringify(['UPI', 'CARD', 'NETBANKING', 'WALLET']),
    },
  });

  // 10. Seed Delivery Partners
  console.log('  -> Seeding Delivery Partners...');
  await prisma.deliveryPartner.upsert({
    where: { partnerCode: 'DEL-BLUEDART' },
    update: {},
    create: {
      partnerCode: 'DEL-BLUEDART',
      name: 'Blue Dart Express',
      contactPhone: '+91 1860 233 1234',
      contactEmail: 'track@bluedart.com',
      trackingUrlTemplate: 'https://www.bluedart.com/tracking?track={tracking}',
      isActive: true,
    },
  });

  await prisma.deliveryPartner.upsert({
    where: { partnerCode: 'DEL-DELHIVERY' },
    update: {},
    create: {
      partnerCode: 'DEL-DELHIVERY',
      name: 'Delhivery Surface & Air',
      contactPhone: '+91 124 6719500',
      contactEmail: 'support@delhivery.com',
      trackingUrlTemplate: 'https://www.delhivery.com/track/package/{tracking}',
      isActive: true,
    },
  });

  console.log('✨ Ayngaran Foods Official Database Seeded Successfully!');
  console.log('   Admin credentials: admin@ayngaran.com / Admin@123AYNGARAN');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
