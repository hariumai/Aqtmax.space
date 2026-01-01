
import { type Order } from './types';

async function sendEmail(to: string, subject: string, html: string) {
    try {
        const response = await fetch('/api/send-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to, subject, html }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to send email');
        }

        console.log('Email sent successfully');
    } catch (error) {
        console.error('Error in sendEmail function:', error);
        // We don't re-throw here to prevent crashing the main flow
    }
}

const emailWrapper = (content: string, preheader: string) => `
<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
    <meta charset="utf-8">
    <meta name="x-apple-disable-message-reformatting">
    <meta http-equiv="x-ua-compatible" content="ie=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
    <!--[if mso]>
    <xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
    <style>
        td,th,div,p,a,h1,h2,h3,h4,h5,h6 {font-family: "Segoe UI", sans-serif; mso-line-height-rule: exactly;}
    </style>
    <![endif]-->
    <title>AQT Max</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
        body {
            margin: 0;
            padding: 0;
            width: 100%;
            word-break: break-word;
            -webkit-font-smoothing: antialiased;
            background-color: #f8fafc;
            font-family: 'Inter', sans-serif;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
        }
        .button {
            display: inline-block;
            background-color: #2563eb;
            color: #ffffff !important;
            padding: 12px 24px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
        }
        .credentials-box {
            background-color: #f1f5f9;
            border-left: 4px solid #2563eb;
            padding: 20px;
            margin: 24px 0;
        }
        .rules-box {
            background-color: #fffbeb;
            border-left: 4px solid #f59e0b;
            color: #b45309;
            padding: 16px;
            margin-top: 24px;
        }
    </style>
</head>
<body style="background-color: #f8fafc; font-family: 'Inter', sans-serif; margin: 0; padding: 0;">
    <div style="display: none;">${preheader}&#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &zwnj;
      &#160;&#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &#847; &zwnj;
      &#160;&#847; &#847; &#847; &#847; &#847; 
    </div>
    <div role="article" aria-roledescription="email" aria-label="AQT Max" lang="en">
        <table style="width: 100%;" cellpadding="0" cellspacing="0" role="presentation">
            <tr>
                <td align="center" style="background-color: #f8fafc; padding: 20px 0;">
                    <table class="container" style="width: 100%;" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                            <td style="padding: 24px; text-align: center;">
                                <a href="${process.env.NEXT_PUBLIC_APP_URL}" style="font-size: 24px; font-weight: 700; color: #1e293b; text-decoration: none;">AQT Max</a>
                            </td>
                        </tr>
                        <tr>
                            <td style="background-color: #ffffff; border-radius: 12px; padding: 40px;">
                                ${content}
                            </td>
                        </tr>
                        <tr>
                            <td style="padding: 24px; text-align: center; font-size: 12px; color: #64748b;">
                                <p style="margin: 0 0 4px;">&copy; ${new Date().getFullYear()} AQT Max. All rights reserved.</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </div>
</body>
</html>
`;


export async function sendOrderConfirmationEmail(order: Order) {
    const subject = `Your AQT Max Order #${order.id} is confirmed!`;
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #334155;">
                ${item.subscriptionName} <span style="color: #64748b;">(${item.variantName})</span>
            </td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: 500; color: #1e293b;">
                ${item.price.toFixed(2)} PKR
            </td>
        </tr>
    `).join('');

    const content = `
        <h1 style="color: #1e293b; font-size: 24px; font-weight: 700; margin-top: 0;">Thanks for your order, ${order.customerName}!</h1>
        <p style="color: #475569; line-height: 1.5;">We've received your order and are processing it now. You'll get another email with your subscription details once everything is ready. This usually takes less than 24 hours.</p>
        
        <table style="width: 100%; border-top: 1px solid #e2e8f0; margin-top: 32px;" cellpadding="0" cellspacing="0" role="presentation">
            <tr><td style="padding-top: 16px; font-size: 16px; font-weight: 600; color: #1e293b;">Order Summary</td></tr>
        </table>
        <table style="width: 100%;" cellpadding="0" cellspacing="0" role="presentation">
            ${itemsHtml}
            <tr>
                <td style="padding-top: 16px; text-align: right; font-weight: 700; color: #1e293b;">Total</td>
                <td style="padding-top: 16px; text-align: right; font-weight: 700; font-size: 20px; color: #1e293b;">${order.totalAmount.toFixed(2)} PKR</td>
            </tr>
        </table>

        <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" class="button">View My Orders</a>
        </div>
    `;

    const preheader = `Your order #${order.id} is confirmed and is now being processed.`;
    await sendEmail(order.customerEmail, subject, emailWrapper(content, preheader));
}

export async function sendOrderFulfilledEmail(order: Order) {
    const subject = `🚀 Your AQT Max Order #${order.id} is Ready!`;

    const content = `
        <h1 style="color: #1e293b; font-size: 24px; font-weight: 700; margin-top: 0;">Your order is ready, ${order.customerName}!</h1>
        <p style="color: #475569; line-height: 1.5;">Your subscription is now active! Please find your account credentials below. You can also access this information from your profile page on our website.</p>
        
        <div class="credentials-box">
            <p style="color: #475569; margin: 0 0 4px; font-size: 14px;">Username/Email:</p>
            <p style="color: #0f172a; font-weight: 600; font-size: 16px; margin: 0 0 16px; font-family: monospace; background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${order.credentials?.username}</p>
            <p style="color: #475569; margin: 0 0 4px; font-size: 14px;">Password:</p>
            <p style="color: #0f172a; font-weight: 600; font-size: 16px; margin: 0; font-family: monospace; background-color: #e2e8f0; padding: 4px 8px; border-radius: 4px;">${order.credentials?.password}</p>
            ${order.note ? `<p style="margin: 16px 0 0 0; color: #475569; border-top: 1px solid #d1d5db; padding-top: 16px; font-size: 14px; font-style: italic;">Note: ${order.note}</p>` : ''}
        </div>

        <div class="rules-box">
            <h4 style="margin: 0 0 8px; font-weight: 600; color: #b45309;">⚠️ Important Account Rules</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #d97706; line-height: 1.6;">
                <li>Do not change any account details (password, email, etc.).</li>
                <li>Do not add or change the profile PIN.</li>
                <li>Violation of these rules will result in a permanent ban without refund.</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" class="button">Go to My Profile</a>
        </div>
    `;
    
    const preheader = `Your credentials for order #${order.id} are here!`;
    await sendEmail(order.customerEmail, subject, emailWrapper(content, preheader));
}

export async function sendAppealApprovedEmail(userEmail: string, userName: string) {
    const subject = `Your AQT Max Account Appeal Has Been Approved`;

    const content = `
        <h1 style="color: #1e293b; font-size: 24px; font-weight: 700; margin-top: 0;">Great News, ${userName}!</h1>
        <p style="color: #475569; line-height: 1.5;">We have reviewed your appeal and we are happy to inform you that your account access will be restored.</p>
        <p style="color: #475569; line-height: 1.5;">Your account will be automatically unbanned within the next 24 hours. You will be able to log in and access your profile as normal after this period.</p>
        <p style="color: #475569; line-height: 1.5;">Thank you for your patience and understanding.</p>
        
        <div style="text-align: center; margin: 32px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" class="button">Check Account Status</a>
        </div>
    `;
    
    const preheader = `Your appeal has been approved and your account will be restored soon.`;
    await sendEmail(userEmail, subject, emailWrapper(content, preheader));
}
