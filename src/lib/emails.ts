
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
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
    <title>SubLime Marketplace</title>
    <style>
        @media only screen and (max-width: 620px) {
            table.body h1 {
                font-size: 28px !important;
                margin-bottom: 10px !important;
            }
            table.body p,
            table.body ul,
            table.body ol,
            table.body td,
            table.body span,
            table.body a {
                font-size: 16px !important;
            }
            table.body .wrapper,
            table.body .article {
                padding: 10px !important;
            }
            table.body .content {
                padding: 0 !important;
            }
            table.body .container {
                padding: 0 !important;
                width: 100% !important;
            }
            table.body .main {
                border-left-width: 0 !important;
                border-radius: 0 !important;
                border-right-width: 0 !important;
            }
            table.body .btn table {
                width: 100% !important;
            }
            table.body .btn a {
                width: 100% !important;
            }
            table.body .img-responsive {
                height: auto !important;
                max-width: 100% !important;
                width: auto !important;
            }
        }
        @media all {
            .ExternalClass {
                width: 100%;
            }
            .ExternalClass,
            .ExternalClass p,
            .ExternalClass span,
            .ExternalClass font,
            .ExternalClass td,
            .ExternalClass div {
                line-height: 100%;
            }
            .apple-link a {
                color: inherit !important;
                font-family: inherit !important;
                font-size: inherit !important;
                font-weight: inherit !important;
                line-height: inherit !important;
                text-decoration: none !important;
            }
            #MessageViewBody a {
                color: inherit;
                text-decoration: none;
                font-size: inherit;
                font-family: inherit;
                font-weight: inherit;
                line-height: inherit;
            }
            .btn-primary table td:hover {
                background-color: #34495e !important;
            }
            .btn-primary a:hover {
                background-color: #34495e !important;
                border-color: #34495e !important;
            }
        }
    </style>
</head>
<body style="background-color: #f6f6f6; font-family: sans-serif; -webkit-font-smoothing: antialiased; font-size: 14px; line-height: 1.4; margin: 0; padding: 0; -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%;">
    <span class="preheader" style="color: transparent; display: none; height: 0; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; visibility: hidden; width: 0;">${preheader}</span>
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="body" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: #f6f6f6; width: 100%;" width="100%" bgcolor="#f6f6f6">
        <tr>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
            <td class="container" style="font-family: sans-serif; font-size: 14px; vertical-align: top; display: block; max-width: 580px; padding: 10px; width: 580px; margin: 0 auto;" width="580" valign="top">
                <div class="content" style="box-sizing: border-box; display: block; margin: 0 auto; max-width: 580px; padding: 10px;">
                    <!-- START HEADER -->
                    <div class="header" style="clear: both; margin-top: 10px; text-align: center; width: 100%;">
                        <h1 style="font-family: sans-serif; font-weight: 700; line-height: 1.4; margin: 0; margin-bottom: 15px; font-size: 24px; color: #333;">SubLime Marketplace</h1>
                    </div>
                    <!-- END HEADER -->
                    <!-- START CENTERED WHITE CONTAINER -->
                    <table role="presentation" class="main" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; background: #ffffff; border-radius: 3px; width: 100%;" width="100%">
                        <!-- START MAIN CONTENT AREA -->
                        <tr>
                            <td class="wrapper" style="font-family: sans-serif; font-size: 14px; vertical-align: top; box-sizing: border-box; padding: 20px;" valign="top">
                                ${content}
                            </td>
                        </tr>
                        <!-- END MAIN CONTENT AREA -->
                    </table>
                    <!-- END CENTERED WHITE CONTAINER -->
                    <!-- START FOOTER -->
                    <div class="footer" style="clear: both; margin-top: 10px; text-align: center; width: 100%;">
                        <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                            <tr>
                                <td class="content-block" style="font-family: sans-serif; vertical-align: top; padding-bottom: 10px; padding-top: 10px; color: #999999; font-size: 12px; text-align: center;" valign="top" align="center">
                                    <span class="apple-link" style="color: #999999; font-size: 12px; text-align: center;">SubLime Marketplace, Your one-stop digital shop.</span>
                                    <br> Don't like these emails? <a href="#" style="text-decoration: underline; color: #999999; font-size: 12px; text-align: center;">Unsubscribe</a>.
                                </td>
                            </tr>
                        </table>
                    </div>
                    <!-- END FOOTER -->
                </div>
            </td>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">&nbsp;</td>
        </tr>
    </table>
</body>
</html>
`;


export async function sendOrderConfirmationEmail(order: Order) {
    const subject = `Your SubLime Order #${order.id} has been placed!`;
    const itemsHtml = order.items.map(item => `
        <tr>
            <td style="padding: 10px 0;">${item.subscriptionName} (${item.variantName})</td>
            <td style="padding: 10px 0; text-align: right;">${item.price.toFixed(2)} PKR</td>
        </tr>
    `).join('');

    const content = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
        <tr>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">
                <h2 style="font-family: sans-serif; font-weight: 500; line-height: 1.4; margin: 0; margin-bottom: 20px; font-size: 22px;">Thank you for your order, ${order.customerName}!</h2>
                <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">We've received your order and are processing it. We'll notify you again once your subscription credentials are ready.</p>
                
                <h3 style="border-bottom: 2px solid #eee; padding-bottom: 10px; margin-top: 20px; font-weight: 500;">Order Summary (ID: ${order.id})</h3>
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
                    <thead>
                        <tr>
                            <th style="padding: 10px 0; text-align: left; border-bottom: 1px solid #eee;">Item</th>
                            <th style="padding: 10px 0; text-align: right; border-bottom: 1px solid #eee;">Price</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                    <tfoot>
                        <tr>
                            <td style="padding: 15px 0; text-align: right; font-weight: bold; border-top: 2px solid #eee;">Total</td>
                            <td style="padding: 15px 0; text-align: right; font-weight: bold; border-top: 2px solid #eee;">${order.totalAmount.toFixed(2)} PKR</td>
                        </tr>
                    </tfoot>
                </table>

                <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-top: 20px;">You can view your order details in your account profile.</p>
                <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-top: 15px;">Thanks for shopping with SubLime Marketplace!</p>
            </td>
        </tr>
    </table>`;

    const preheader = `Your order #${order.id} has been placed and is now being processed.`;
    await sendEmail(order.customerEmail, subject, emailWrapper(content, preheader));
}

export async function sendOrderFulfilledEmail(order: Order) {
    const subject = `Your SubLime Order #${order.id} is Complete!`;
    const itemsHtml = order.items.map(item => `<li style="margin-bottom: 5px;">${item.subscriptionName} (${item.variantName})</li>`).join('');

    const content = `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%;" width="100%">
        <tr>
            <td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">
                <h2 style="font-family: sans-serif; font-weight: 500; line-height: 1.4; margin: 0; margin-bottom: 20px; font-size: 22px;">Your order is ready, ${order.customerName}!</h2>
                <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-bottom: 15px;">Your subscription for the following item(s) has been fulfilled:</p>
                <ul style="padding-left: 20px; margin-bottom: 20px;">${itemsHtml}</ul>
                
                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background-color: #f9f9f9; border: 1px solid #eee; border-radius: 5px; padding: 15px;" bgcolor="#f9f9f9">
                    <tr><td style="font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">
                        <h3 style="margin-top: 0; font-weight: 500;">Your Credentials</h3>
                        <p style="margin: 0 0 5px 0;"><strong>Username/Email:</strong> ${order.credentials?.username}</p>
                        <p style="margin: 0 0 10px 0;"><strong>Password:</strong> ${order.credentials?.password}</p>
                        ${order.note ? `<p style="margin: 10px 0 0 0; font-style: italic; border-top: 1px solid #ddd; padding-top: 10px;"><strong>Note:</strong> ${order.note}</p>` : ''}
                    </td></tr>
                </table>

                <table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin-top: 20px; border-left: 4px solid #d9534f; border-collapse: separate; mso-table-lspace: 0pt; mso-table-rspace: 0pt; width: 100%; background: #f9f2f4;" bgcolor="#f9f2f4">
                    <tr><td style="padding: 10px; font-family: sans-serif; font-size: 14px; vertical-align: top;" valign="top">
                        <h4 style="margin-top:0; color: #d9534f; font-weight: 500;">Important Rules</h4>
                        <ul style="margin:0; padding-left: 20px; font-size: 13px;">
                            <li>Do not pin any profiles.</li>
                            <li>Do not change any account details (password, email, etc.).</li>
                            <li>Violation of these rules will result in a permanent ban with no refund.</li>
                        </ul>
                    </td></tr>
                </table>

                <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-top: 20px;">You can now log in and enjoy your subscription. You can also review these details in your account on our website.</p>
                <p style="font-family: sans-serif; font-size: 14px; font-weight: normal; margin: 0; margin-top: 15px;">Thanks for shopping with SubLime Marketplace!</p>
            </td>
        </tr>
    </table>`;
    
    const preheader = `Your credentials for order #${order.id} are here!`;
    await sendEmail(order.customerEmail, subject, emailWrapper(content, preheader));
}
