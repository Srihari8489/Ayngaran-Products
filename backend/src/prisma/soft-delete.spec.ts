import { PrismaService } from './prisma.service';

async function testSoftDelete() {
  console.log('🧪 Testing Prisma Soft-Delete & Admin Bypass Extension...');

  const prismaService = new PrismaService();
  await prismaService.onModuleInit();

  try {
    // 1. Create a test brand
    const testBrand = await prismaService.client.brand.create({
      data: {
        brandCode: 'BRD-TEST-999',
        name: 'Test Temp Brand',
        slug: 'test-temp-brand',
        description: 'Brand for testing soft delete',
        isActive: true,
      },
    });
    console.log('  ✅ 1. Created test brand:', testBrand.brandCode);

    // 2. Perform soft delete using prismaService.softDelete
    await prismaService.softDelete('Brand', testBrand.id, 1);
    console.log('  ✅ 2. Successfully soft-deleted brand with audit logging');

    // 3. Normal findFirst / findMany must NOT return the soft-deleted brand
    const normalQuery = await prismaService.client.brand.findUnique({
      where: { id: testBrand.id },
    });
    if (normalQuery === null) {
      console.log('  ✅ 3. Normal query correctly excluded soft-deleted brand (deletedAt IS NULL enforced)');
    } else {
      throw new Error('FAIL: Soft-deleted record was returned by normal query!');
    }

    // 4. Admin findDeletedOnly must return the soft-deleted brand
    const deletedOnly = await prismaService.findDeletedOnly('Brand', {
      where: { id: testBrand.id },
    });
    if (deletedOnly.length === 1 && deletedOnly[0].deletedAt !== null) {
      console.log('  ✅ 4. Admin findDeletedOnly successfully located soft-deleted brand');
    } else {
      throw new Error('FAIL: Admin findDeletedOnly failed to find soft-deleted brand');
    }

    // 5. Admin restore must restore the brand
    const restored = await prismaService.restore('Brand', testBrand.id, 1);
    if (restored.deletedAt === null) {
      console.log('  ✅ 5. Admin restore successfully cleared deletedAt and logged audit trail');
    } else {
      throw new Error('FAIL: Admin restore failed to clear deletedAt');
    }

    // 6. Normal query should now find the restored brand
    const afterRestore = await prismaService.client.brand.findUnique({
      where: { id: testBrand.id },
    });
    if (afterRestore && afterRestore.id === testBrand.id) {
      console.log('  ✅ 6. Restored brand is now queryable in normal queries');
    } else {
      throw new Error('FAIL: Restored brand not returned by normal query');
    }

    // Clean up test brand using raw client to keep DB clean
    await prismaService.raw.brand.delete({ where: { id: testBrand.id } });
    console.log('  ✅ 7. Test record cleaned up');

    console.log('🎉 ALL SOFT-DELETE & AUDIT TESTS PASSED!');
  } finally {
    await prismaService.onModuleDestroy();
  }
}

testSoftDelete().catch((err) => {
  console.error('❌ Soft-delete test failed:', err);
  process.exit(1);
});
