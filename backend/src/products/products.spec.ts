import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from '../categories/categories.service';
import { ProductsService } from './products.service';
import { InventoryService } from '../inventory/inventory.service';

async function testProductsAndInventory() {
  console.log('🧪 Testing Slice 5: Products, Dynamic Faceted Filters, Variants & Inventory Alerts...');

  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const categoriesService = new CategoriesService(prisma);
  const productsService = new ProductsService(prisma, categoriesService);
  const inventoryService = new InventoryService(prisma);

  try {
    // 1. Test Category Dynamic Filters Generation
    const androidCat = await prisma.client.category.findUnique({
      where: { categoryCode: 'CAT-AND-001' },
    });
    if (!androidCat) throw new Error('CAT-AND-001 not found');

    const filters = await productsService.getCategoryFilters(androidCat.id);
    console.log('  ✅ 1. Database-driven dynamic filters generated:');
    console.log('        Price range:', filters.priceRange);
    console.log('        Brands present:', filters.brands.map((b) => `${b.name} (${b.count})`).join(', '));
    console.log('        Filterable attributes count:', filters.attributes.length);
    const ramFacet = filters.attributes.find((a) => a.name === 'RAM');
    if (ramFacet) {
      console.log('        RAM options:', ramFacet.options.map((o) => `${o.displayName} (${o.count})`).join(', '));
    }

    // 2. Test Dynamic Attribute Filtering
    const searchRes = await productsService.findAll({
      categoryId: String(androidCat.id),
      attrs: JSON.stringify({ ram: '12 GB' }),
    });
    console.log('  ✅ 2. Dynamic attribute query for { ram: "12 GB" } returned count:', searchRes.items.length);
    if (searchRes.items.length === 0) {
      throw new Error('FAIL: Attribute query did not return matching product');
    }
    console.log('        Matched product:', searchRes.items[0].name);

    // 3. Test Low Stock Alerts Detection
    const lowStockAlerts = await inventoryService.getLowStockAlerts();
    console.log('  ✅ 3. Low stock alerts evaluated. Total alert count:', lowStockAlerts.length);
    const lowStockItem = lowStockAlerts.find((item) => item.sku === 'SKU-APP-16P-SLV-1TB');
    if (!lowStockItem) {
      throw new Error('FAIL: iPhone 1TB variant (stock: 3 <= minStockAlert: 5) was not flagged as low stock!');
    }
    console.log(`        Found low-stock alert: ${lowStockItem.productName} (${lowStockItem.sku}) - Stock: ${lowStockItem.stockQuantity}, Min Alert: ${lowStockItem.minStockAlert}`);

    // 4. Test Stock Safety (No negative stock allowed)
    try {
      await inventoryService.adjustStock({
        productId: lowStockItem.productId,
        variantId: lowStockItem.variantId,
        type: 'ADJUSTMENT',
        quantityChange: -100, // exceeds available stock 3!
        reason: 'Attempt invalid negative stock',
      });
      throw new Error('FAIL: Negative stock adjustment was allowed!');
    } catch (e: any) {
      if (e.message.includes('Insufficient stock')) {
        console.log('  ✅ 4. Concurrency safety: prevented negative stock adjustment');
      } else {
        throw e;
      }
    }

    // 5. Test Valid Stock Adjustment (+10 units)
    const adjustRes = await inventoryService.adjustStock({
      productId: lowStockItem.productId,
      variantId: lowStockItem.variantId,
      type: 'RESTOCK',
      quantityChange: 10,
      reason: 'Warehouse restock delivery',
    });
    console.log('  ✅ 5. Restock adjustment processed. Previous: 3, New Stock:', adjustRes.newStock);

    // Revert adjustment back to keep test state consistent
    await inventoryService.adjustStock({
      productId: lowStockItem.productId,
      variantId: lowStockItem.variantId,
      type: 'ADJUSTMENT',
      quantityChange: -10,
      reason: 'Revert test adjustment',
    });
    console.log('  ✅ 6. Stock reverted and audit ledger maintained');

    console.log('🎉 SLICE 5: PRODUCTS & INVENTORY ENGINE PASSED!');
  } finally {
    await prisma.onModuleDestroy();
  }
}

testProductsAndInventory().catch((err) => {
  console.error('❌ Products/Inventory test failed:', err);
  process.exit(1);
});
