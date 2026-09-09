import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';

async function testAuth() {
  console.log('🧪 Testing Slice 2: Customer OTP, Staff Auth, & RBAC...');

  const prisma = new PrismaService();
  await prisma.onModuleInit();

  const jwtService = new JwtService({
    secret: 'ayngaran_secret_jwt_key_2026_super_secure_access_token',
  });

  const authService = new AuthService(prisma, jwtService);

  try {
    const testIdentifier = 'test_buyer@ayngaran.com';

    // 1. Request OTP
    const otpRes = await authService.requestCustomerOtp(testIdentifier);
    console.log('  ✅ 1. Requested OTP successfully:', otpRes.devOtp);

    // 2. Test Cooldown (immediate request should be rejected)
    try {
      await authService.requestCustomerOtp(testIdentifier);
      throw new Error('FAIL: Cooldown check did not reject immediate request!');
    } catch (e: any) {
      if (e.message.includes('Please wait')) {
        console.log('  ✅ 2. Rate-limiting / Cooldown successfully blocked immediate re-request');
      } else {
        throw e;
      }
    }

    // 3. Test Wrong OTP attempt increment
    try {
      await authService.verifyCustomerOtp(testIdentifier, '000000');
      throw new Error('FAIL: Wrong OTP was accepted!');
    } catch (e: any) {
      if (e.message.includes('Invalid OTP')) {
        console.log('  ✅ 3. Invalid OTP rejected with remaining attempts alert');
      } else {
        throw e;
      }
    }

    // 4. Test Correct OTP verification
    const verifyRes = await authService.verifyCustomerOtp(testIdentifier, otpRes.devOtp!);
    if (verifyRes.accessToken && verifyRes.user) {
      console.log('  ✅ 4. Correct OTP verified, User created, JWT tokens issued');
    } else {
      throw new Error('FAIL: Verification did not return user or token');
    }

    // 5. Test Staff Login
    const staffRes = await authService.loginStaff('admin@ayngaran.com', 'Admin@2026', '127.0.0.1');
    if (staffRes.accessToken && staffRes.staff.role === 'SUPER_ADMIN') {
      console.log('  ✅ 5. Staff login verified with bcrypt & role assignment');
      console.log('        Permissions assigned:', staffRes.staff.permissions.length);
    } else {
      throw new Error('FAIL: Staff login failed');
    }

    // Clean up test customer
    await prisma.raw.cart.deleteMany({ where: { userId: verifyRes.user.id } });
    await prisma.raw.user.delete({ where: { id: verifyRes.user.id } });
    await prisma.raw.otpRequest.deleteMany({ where: { identifier: testIdentifier } });
    console.log('  ✅ 6. Cleaned up test buyer records');

    console.log('🎉 SLICE 2: AUTH & RBAC VERIFICATION PASSED!');
  } finally {
    await prisma.onModuleDestroy();
  }
}

testAuth().catch((err) => {
  console.error('❌ Auth test failed:', err);
  process.exit(1);
});
