import { Injectable, Logger } from '@nestjs/common';

export interface OtpDeliveryResult {
  success: boolean;
  message: string;
  demoWhatsAppUrl?: string;
}

export interface IOtpDeliveryProvider {
  sendOtp(phone: string, otp: string): Promise<OtpDeliveryResult>;
}

export class DemoWhatsAppDeliveryProvider implements IOtpDeliveryProvider {
  private readonly logger = new Logger(DemoWhatsAppDeliveryProvider.name);

  async sendOtp(phone: string, otp: string): Promise<OtpDeliveryResult> {
    // 1. Normalize phone to country code format e.g. "919876543210"
    const digits = phone.replace(/\D/g, '');
    const fullPhone = digits.length === 10 ? `91${digits}` : digits;

    // 2. Pre-filled WhatsApp message
    const message = `Your Ayngaran Foods OTP is ${otp}. It is valid for 5 minutes. Do not share this OTP with anyone.`;
    const encodedMessage = encodeURIComponent(message);
    const demoWhatsAppUrl = `https://wa.me/919025084185?text=${encodedMessage}`;
    this.logger.log(`[DEMO WhatsApp OTP] Generated wa.me URL for ${fullPhone}: ${demoWhatsAppUrl}`);

    return {
      success: true,
      message: 'Demo OTP generated successfully',
      demoWhatsAppUrl,
    };
  }
}

export class FutureWhatsAppBusinessDeliveryProvider implements IOtpDeliveryProvider {
  private readonly logger = new Logger(FutureWhatsAppBusinessDeliveryProvider.name);

  async sendOtp(phone: string, otp: string): Promise<OtpDeliveryResult> {
    /*
     TODO BEFORE PRODUCTION:
     1. Enable OTP hashing.
     2. Remove plaintext OTP storage.
     3. Remove DEMO wa.me delivery.
     4. Integrate official WhatsApp Business API.
     5. Review OTP rate limiting and security.
     6. Verify production secrets/configuration.
    */
    this.logger.error('WhatsApp Business Cloud API is not implemented yet.');
    throw new Error('Production WhatsApp Business API delivery provider is not configured.');
  }
}

@Injectable()
export class OtpDeliveryService {
  private readonly logger = new Logger(OtpDeliveryService.name);
  private provider: IOtpDeliveryProvider;

  constructor() {
    const isDemo = (process.env.WHATSAPP_OTP_MODE || 'DEMO').toUpperCase() === 'DEMO';
    if (isDemo) {
      this.provider = new DemoWhatsAppDeliveryProvider();
      this.logger.log('OtpDeliveryService initialized with DemoWhatsAppDeliveryProvider');
    } else {
      this.provider = new FutureWhatsAppBusinessDeliveryProvider();
    }
  }

  async sendOtp(phone: string, otp: string): Promise<OtpDeliveryResult> {
    return this.provider.sendOtp(phone, otp);
  }
}
