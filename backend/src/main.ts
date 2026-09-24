import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const logger = new Logger('AyngaranBootstrap');
  const app = await NestFactory.create(AppModule);

  // Global Prefix
  app.setGlobalPrefix('api/v1');

  // Global Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );

  // Global Response Interceptor and Exception Filter
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new AllExceptionsFilter());

  // CORS Configuration
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3000,http://localhost:3001').split(',');
  app.enableCors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, postman)
      if (!origin || allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  // Serve /uploads statically from the backend/uploads directory
  const express = require('express');
  const path = require('path');
  const fs = require('fs');
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  app.use('/uploads', express.static(uploadsDir));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  logger.log(`🚀 Ayngaran E-Commerce API is running on: http://localhost:${port}/api/v1`);
  logger.log(`📁 Static uploads folder mounted on: http://localhost:${port}/uploads`);

  if (process.env.WHATSAPP_OTP_MODE === 'DEMO' || process.env.OTP_HASHING === 'false') {
    logger.warn('====================================================================');
    logger.warn('WARNING:');
    logger.warn('WhatsApp OTP is running in DEMO MODE.');
    logger.warn('OTP hashing is disabled.');
    logger.warn('This configuration MUST NOT be used in production.');
    logger.warn('====================================================================');
  }
}

bootstrap();
