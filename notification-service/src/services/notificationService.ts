import { emailService } from './emailService.js';

export interface SendNotificationPayload {
  userId: string;
  recipientEmail?: string;
  recipientName?: string;
  type: string;
  title: string;
  message: string;
  metadata?: {
    itemReference?: string;
    itemName?: string;
    claimReference?: string;
    actionUrl?: string;
    location?: string;
    scheduledAt?: string;
    notes?: string;
  };
}

export class NotificationService {
  async processNotification(payload: SendNotificationPayload) {
    const { recipientEmail, recipientName, type, title, message, metadata } = payload;

    console.log(`[NotificationMicroservice] Processing notification: [${type}] "${title}" for User: ${payload.userId}`);

    let emailResult = { sent: false, status: 'NO_EMAIL_PROVIDED' };

    if (recipientEmail) {
      const html = this.buildEmailTemplate(title, message, recipientName || 'Student', metadata);
      emailResult = await emailService.sendEmail(recipientEmail, `[CampusConnect] ${title}`, html);
    }

    return {
      success: true,
      deliveredAt: new Date().toISOString(),
      type,
      recipient: recipientEmail || payload.userId,
      emailDispatch: emailResult,
    };
  }

  private buildEmailTemplate(title: string, message: string, name: string, metadata?: any): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc; color: #1e293b; margin: 0; padding: 20px; }
          .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background-color: #172554; padding: 24px; text-align: center; color: #ffffff; }
          .header h1 { margin: 0; font-size: 20px; font-weight: 700; letter-spacing: 0.5px; }
          .header p { margin: 5px 0 0 0; font-size: 13px; color: #93c5fd; }
          .content { padding: 32px 24px; }
          .title { font-size: 18px; font-weight: 600; color: #0f172a; margin-bottom: 16px; }
          .greeting { font-size: 15px; margin-bottom: 16px; color: #334155; }
          .message-box { background-color: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; border-radius: 4px; margin-bottom: 24px; font-size: 14px; line-height: 1.6; color: #1e293b; }
          .meta-table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
          .meta-table td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
          .meta-table td.label { font-weight: 600; color: #64748b; width: 35%; }
          .meta-table td.value { color: #0f172a; font-weight: 500; }
          .footer { background-color: #f8fafc; padding: 16px 24px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #e2e8f0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>CampusConnect Lost &amp; Found</h1>
            <p>University Property Management Portal</p>
          </div>
          <div class="content">
            <div class="greeting">Hello ${name},</div>
            <div class="title">${title}</div>
            <div class="message-box">${message}</div>
            ${metadata ? `
              <table class="meta-table">
                ${metadata.itemReference ? `<tr><td class="label">Item Ref:</td><td class="value">${metadata.itemReference}</td></tr>` : ''}
                ${metadata.itemName ? `<tr><td class="label">Item Name:</td><td class="value">${metadata.itemName}</td></tr>` : ''}
                ${metadata.claimReference ? `<tr><td class="label">Claim Ref:</td><td class="value">${metadata.claimReference}</td></tr>` : ''}
                ${metadata.location ? `<tr><td class="label">Location:</td><td class="value">${metadata.location}</td></tr>` : ''}
                ${metadata.scheduledAt ? `<tr><td class="label">Scheduled Time:</td><td class="value">${metadata.scheduledAt}</td></tr>` : ''}
              </table>
            ` : ''}
            <p style="font-size: 13px; color: #64748b; line-height: 1.5;">
              You can log into the portal anytime to view updates, manage your listings, and respond to claims.
            </p>
          </div>
          <div class="footer">
            &copy; 2026 CampusConnect &bull; Safe, Verified Campus Property Recovery
          </div>
        </div>
      </body>
    </html>
    `;
  }
}

export const notificationService = new NotificationService();
