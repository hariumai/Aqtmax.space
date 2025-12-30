
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
<html lang="en">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SubLime Marketplace</title>
    <style>
        body {
            background-color: #0c0a09; color: #f2f2f2; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        }
        .container {
            width: 100%; max-width: 600px; margin: 0 auto; padding: 20px;
        }
        .header {
            text-align: center; padding-bottom: 20px; border-bottom: 1px solid #27272a;
        }
        .header h1 {
            color: #3b82f6; font-size: 24px; font-weight: bold; margin: 0;
        }
        .main-content {
            background-color: #18181b; border-radius: 12px; padding: 24px; margin-top: 24px;
        }
        .footer {
            text-align: center; padding-top: 20px; font-size: 12px; color: #a1a1aa;
        }
        .button {
            display: inline-block; background-color: #3b82f6; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold;
        }
        .credentials-box {
            background-color: #0c0a09; border: 1px solid #27272a; padding: 16px; border-radius: 8px; margin-top: 16px;
        }
         .rules-box {
            background-color: #3f2323; border-left: 4px solid #ef4444; color: #fecaca; padding: 16px; border-radius: 4px; margin: 16px 0;
        }
    </style>
</head>
<body>
    <div style="display: none; max-height: 0; overflow: hidden;">${preheader}</div>
    <div class="container">
        <div class="header">
            <h1>SubLime Marketplace</h1>
        </div>
        <div class="main-content">
            ${content}
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} SubLime. All rights reserved.</p>
        </div>
    </div>
</body>
</html>
`;


export async function sendOrderConfirmationEmail(order: Order) {
    const subject = `Your SubLime Order #${order.id} has been placed!`;
    const itemsHtml = order.items.map(item => `
        <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #27272a;">
            <span>${item.subscriptionName} (${item.variantName})</span>
            <span>${item.price.toFixed(2)} PKR</span>
        </div>
    `).join('');

    const content = `
        <h2 style="color: #f2f2f2; font-size: 20px; font-weight: 600;">Thank you for your order, ${order.customerName}!</h2>
        <p style="color: #a1a1aa; line-height: 1.5;">We've received your order and are now processing it. We will notify you again once your subscription credentials are ready. This usually takes less than 24 hours.</p>
        
        <h3 style="color: #f2f2f2; font-size: 16px; font-weight: 600; margin-top: 24px;">Order Summary (ID: ${order.id})</h3>
        <div style="margin-top: 12px;">
            ${itemsHtml}
            <div style="display: flex; justify-content: space-between; padding-top: 12px; margin-top: 8px; font-weight: bold; font-size: 16px;">
                <span>Total</span>
                <span>${order.totalAmount.toFixed(2)} PKR</span>
            </div>
        </div>

        <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" class="button">View My Orders</a>
        </div>
    `;

    const preheader = `Your order #${order.id} is confirmed and is now being processed.`;
    await sendEmail(order.customerEmail, subject, emailWrapper(content, preheader));
}

export async function sendOrderFulfilledEmail(order: Order) {
    const subject = `🚀 Your SubLime Order #${order.id} is Complete!`;

    const content = `
        <h2 style="color: #f2f2f2; font-size: 20px; font-weight: 600;">Your order is ready, ${order.customerName}!</h2>
        <p style="color: #a1a1aa; line-height: 1.5;">Your subscription is now active! Please find your account credentials below. You can also access this information from your profile page on our website.</p>
        
        <div class="credentials-box">
            <p style="color: #a1a1aa; margin: 0 0 4px;">Username/Email:</p>
            <p style="color: #f2f2f2; font-weight: bold; font-size: 16px; margin: 0 0 12px;">${order.credentials?.username}</p>
            <p style="color: #a1a1aa; margin: 0 0 4px;">Password:</p>
            <p style="color: #f2f2f2; font-weight: bold; font-size: 16px; margin: 0;">${order.credentials?.password}</p>
            ${order.note ? `<p style="margin: 12px 0 0 0; color: #a1a1aa; border-top: 1px solid #27272a; padding-top: 12px;"><em>Note: ${order.note}</em></p>` : ''}
        </div>

        <div class="rules-box">
            <h4 style="margin: 0 0 8px; font-weight: 600; color: #fecaca;">⚠️ Important Account Rules</h4>
            <ul style="margin: 0; padding-left: 20px; font-size: 13px; color: #fecaca; line-height: 1.6;">
                <li>Do not change any account details (password, email, etc.).</li>
                <li>Do not add or change the profile PIN.</li>
                <li>Violation of these rules will result in a permanent ban without refund.</li>
            </ul>
        </div>
        
        <div style="text-align: center; margin-top: 24px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" class="button">Go to My Profile</a>
        </div>
    `;
    
    const preheader = `Your credentials for order #${order.id} are here!`;
    await sendEmail(order.customerEmail, subject, emailWrapper(content, preheader));
}
