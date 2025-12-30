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

export async function sendOrderConfirmationEmail(order: Order) {
    const subject = `Your SubLime Order #${order.id} has been placed!`;
    const itemsHtml = order.items.map(item => `
        <tr style="border-bottom: 1px solid #ddd;">
            <td style="padding: 10px;">${item.subscriptionName} (${item.variantName})</td>
            <td style="padding: 10px; text-align: right;">${item.price.toFixed(2)} PKR</td>
        </tr>
    `).join('');

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1 style="color: #333;">Thank you for your order, ${order.customerName}!</h1>
            <p>We've received your order and are processing it. We'll notify you again once your subscription credentials are ready.</p>
            <h2 style="border-bottom: 2px solid #eee; padding-bottom: 10px;">Order Summary (ID: ${order.id})</h2>
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr>
                        <th style="padding: 10px; text-align: left; background-color: #f7f7f7;">Item</th>
                        <th style="padding: 10px; text-align: right; background-color: #f7f7f7;">Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr>
                        <td style="padding: 10px; text-align: right; font-weight: bold;">Total</td>
                        <td style="padding: 10px; text-align: right; font-weight: bold;">${order.totalAmount.toFixed(2)} PKR</td>
                    </tr>
                </tfoot>
            </table>
            <p style="margin-top: 20px;">You can view your order details in your account profile.</p>
            <p>Thanks for shopping with SubLime Marketplace!</p>
        </div>
    `;

    await sendEmail(order.customerEmail, subject, html);
}

export async function sendOrderFulfilledEmail(order: Order) {
    const subject = `Your SubLime Order #${order.id} is Complete!`;
    const itemsHtml = order.items.map(item => `<li>${item.subscriptionName} (${item.variantName})</li>`).join('');

    const html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h1 style="color: #333;">Your order is ready, ${order.customerName}!</h1>
            <p>Your subscription for the following item(s) has been fulfilled:</p>
            <ul>${itemsHtml}</ul>
            
            <div style="background-color: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3 style="margin-top: 0;">Your Credentials</h3>
                <p><strong>Username/Email:</strong> ${order.credentials?.username}</p>
                <p><strong>Password:</strong> ${order.credentials?.password}</p>
                 ${order.note ? `<p style="font-style: italic;"><strong>Note:</strong> ${order.note}</p>` : ''}
            </div>

            <div style="border-left: 4px solid #d9534f; padding: 10px; background-color: #f9f2f4; margin: 20px 0;">
                <h4 style="margin-top:0; color: #d9534f;">Important Rules</h4>
                <ul style="margin:0; padding-left: 20px;">
                    <li>Do not pin any profiles.</li>
                    <li>Do not change any account details (password, email, etc.).</li>
                    <li>Violation of these rules will result in a permanent ban with no refund.</li>
                </ul>
            </div>

            <p>You can now log in and enjoy your subscription. You can also review these details in your account on our website.</p>
            <p>Thanks for shopping with SubLime Marketplace!</p>
        </div>
    `;

    await sendEmail(order.customerEmail, subject, html);
}
