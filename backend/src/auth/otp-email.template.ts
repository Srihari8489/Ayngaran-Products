export interface OtpEmailParams {
  otp: string;
  expiresInMinutes?: number;
}

export function generateOtpEmailHtml(params: OtpEmailParams): string {
  const expiresIn = params.expiresInMinutes || 5;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Ayngaran Foods Login OTP</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
      color: #18181b;
    }
    .wrapper {
      max-width: 520px;
      margin: 30px auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
      border: 1px solid #e4e4e7;
    }
    .header {
      background: linear-gradient(135deg, #15803d 0%, #166534 100%);
      color: #ffffff;
      padding: 28px 24px;
      text-align: center;
    }
    .header h1 {
      margin: 0;
      font-size: 22px;
      font-weight: 800;
      letter-spacing: 0.5px;
    }
    .header p {
      margin: 6px 0 0 0;
      font-size: 13px;
      opacity: 0.9;
    }
    .content {
      padding: 32px 28px;
      text-align: center;
    }
    .greeting {
      font-size: 16px;
      color: #3f3f46;
      margin-bottom: 20px;
    }
    .otp-card {
      background: #f0fdf4;
      border: 2px dashed #86efac;
      border-radius: 12px;
      padding: 24px 16px;
      margin: 24px 0;
    }
    .otp-code {
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #15803d;
      font-family: 'Courier New', Courier, monospace;
      margin: 0;
    }
    .otp-subtext {
      font-size: 13px;
      color: #166534;
      margin-top: 10px;
      font-weight: 600;
    }
    .info-text {
      font-size: 13px;
      color: #71717a;
      line-height: 1.6;
      margin: 20px 0 0 0;
    }
    .footer {
      background-color: #fafafa;
      padding: 18px 24px;
      text-align: center;
      font-size: 12px;
      color: #a1a1aa;
      border-top: 1px solid #f4f4f5;
    }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="header">
      <h1>AYNGARAN FOODS</h1>
      <p>Pure &bull; Traditional &bull; Authentic</p>
    </div>
    <div class="content">
      <div class="greeting">Hello,</div>
      <p style="margin: 0; color: #52525b; font-size: 14px;">Use the following verification code to sign in to your Ayngaran account:</p>
      
      <div class="otp-card">
        <div class="otp-code">${params.otp}</div>
        <div class="otp-subtext">Valid for ${expiresIn} minutes</div>
      </div>

      <p class="info-text">
        Do not share this OTP with anyone. Our staff will never ask for your verification code.
        If you did not request this OTP, please ignore this email.
      </p>
    </div>
    <div class="footer">
      &copy; ${new Date().getFullYear()} Ayngaran Foods. All rights reserved.
    </div>
  </div>
</body>
</html>`;
}
