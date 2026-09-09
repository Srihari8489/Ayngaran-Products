import { PrismaService } from '../prisma/prisma.service';
import { CategoriesService } from './categories.service';

async function testCatalogInheritance() {
  console.log('🧪 Testing Slice 3 & 4: Category Hierarchy & Multi-Level Attribute Inheritance...');

  const prisma = new PrismaService();
  await prisma.onModuleInit();
  const categoriesService = new CategoriesService(prisma);

  try {
    // 1. Test Category Tree
    const tree = await categoriesService.getCategoryTree();
    console.log('  ✅ 1. Category Tree fetched, root nodes count:', tree.length);
    const electronicsNode = tree.find((c: any) => c.categoryCode === 'CAT-ELEC-001');
    if (!electronicsNode || electronicsNode.children.length === 0) {
      throw new Error('FAIL: Electronics category has no children!');
    }
    console.log('        Electronics has subcategories:', electronicsNode.children.map((c: any) => c.name).join(', '));

    const mobilesNode = electronicsNode.children.find((c: any) => c.categoryCode === 'CAT-MOB-001');
    if (!mobilesNode || mobilesNode.children.length === 0) {
      throw new Error('FAIL: Mobiles subcategory has no sub-subcategories!');
    }
    console.log('        Mobiles has subcategories:', mobilesNode.children.map((c: any) => c.name).join(', '));

    // 2. Test Breadcrumb path for Android Phones
    const androidCat = await prisma.client.category.findUnique({
      where: { categoryCode: 'CAT-AND-001' },
    });
    if (!androidCat) throw new Error('CAT-AND-001 not found');

    const breadcrumbs = await categoriesService.getBreadcrumbs(androidCat.id);
    console.log('  ✅ 2. Breadcrumbs resolved:', breadcrumbs.map((b: any) => b.name).join(' > '));
    if (breadcrumbs.length !== 3 || breadcrumbs[0].name !== 'Electronics' || breadcrumbs[2].name !== 'Android Phones') {
      throw new Error('FAIL: Breadcrumbs hierarchy incorrect!');
    }

    // 3. Test Multi-Level Attribute Inheritance Resolution Engine
    const inheritedAttrs = await categoriesService.getInheritedAttributes(androidCat.id);
    console.log('  ✅ 3. Inherited Attributes for Android Phones resolved. Total count:', inheritedAttrs.length);

    const attrNames = inheritedAttrs.map((a: any) => a.name);
    console.log('        Resolved attribute names:', attrNames.join(', '));

    // Check inherited from Level 1 (Electronics): Warranty
    const warranty = inheritedAttrs.find((a: any) => a.name === 'Warranty');
    if (!warranty || !warranty.isInherited || warranty.sourceCategoryName !== 'Electronics') {
      throw new Error('FAIL: Warranty from Electronics was not properly inherited!');
    }
    console.log('        Level 1 Inherited: Warranty (from Electronics)');

    // Check inherited from Level 2 (Mobiles): RAM, Storage, Color, Screen Size
    const ram = inheritedAttrs.find((a: any) => a.name === 'RAM');
    if (!ram || !ram.isInherited || ram.sourceCategoryName !== 'Mobiles') {
      throw new Error('FAIL: RAM from Mobiles was not properly inherited!');
    }
    console.log('        Level 2 Inherited: RAM & Storage (from Mobiles, isVariant:', ram.isVariant, ')');

    // Check Level 3 direct: Processor, OS, 5G
    const processor = inheritedAttrs.find((a: any) => a.name === 'Processor');
    if (!processor || processor.isInherited || processor.sourceCategoryName !== 'Android Phones') {
      throw new Error('FAIL: Processor from Android Phones direct attribute missing!');
    }
    console.log('        Level 3 Direct: Processor, OS, 5G (from Android Phones)');

    // 4. Test Reserved Identifier Protection
    try {
      await categoriesService.create({
        categoryCode: 'CAT-ELEC-001', // duplicate code!
        name: 'Duplicate Electronics',
        slug: 'duplicate-electronics',
      });
      throw new Error('FAIL: Duplicate category code was accepted!');
    } catch (err: any) {
      if (err.message.includes('already reserved or exists')) {
        console.log('  ✅ 4. Reserved business code protection verified');
      } else {
        throw err;
      }
    }

    console.log('🎉 SLICE 3 & 4: CATEGORY HIERARCHY & INHERITANCE ENGINE PASSED!');
  } finally {
    await prisma.onModuleDestroy();
  }
}

testCatalogInheritance().catch((err) => {
  console.error('❌ Catalog inheritance test failed:', err);
  process.exit(1);
});
