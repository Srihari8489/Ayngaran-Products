import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { StaffModule } from './staff/staff.module';
import { CategoriesModule } from './categories/categories.module';
import { AttributesModule } from './attributes/attributes.module';
import { BrandsModule } from './brands/brands.module';
import { ProductsModule } from './products/products.module';
import { InventoryModule } from './inventory/inventory.module';
import { CartModule } from './cart/cart.module';
import { CheckoutModule } from './checkout/checkout.module';
import { PaymentsModule } from './payments/payments.module';
import { OrdersModule } from './orders/orders.module';
import { DeliveryModule } from './delivery/delivery.module';
import { ReviewsModule } from './reviews/reviews.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './audit/audit.module';
import { UploadsModule } from './uploads/uploads.module';
import { WishlistModule } from './wishlist/wishlist.module';
import { InquiriesModule } from './inquiries/inquiries.module';
import { NewsletterModule } from './newsletter/newsletter.module';
import { UsersModule } from './users/users.module';
import { FeedbackModule } from './feedback/feedback.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    StaffModule,
    CategoriesModule,
    AttributesModule,
    BrandsModule,
    ProductsModule,
    InventoryModule,
    CartModule,
    CheckoutModule,
    PaymentsModule,
    OrdersModule,
    DeliveryModule,
    ReviewsModule,
    ReportsModule,
    AuditModule,
    UploadsModule,
    WishlistModule,
    InquiriesModule,
    NewsletterModule,
    UsersModule,
    FeedbackModule,
  ],
})
export class AppModule {}
