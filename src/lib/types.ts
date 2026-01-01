

export type CartItem = {
    id: string;
    subscriptionId: string;
    subscriptionName: string;
    variantName: string;
    price: number;
    quantity: number;
    imageUrl?: string;
}

export type Order = {
    id: string;
    userId: string;
    items: CartItem[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    subtotal: number;
    totalAmount: number;
    paymentScreenshotUrl: string | null;
    orderDate: any; // Can be Date or FieldValue
    status: 'pending' | 'completed' | 'cancelled';
    credentials?: {
        username: string;
        password?: string;
    };
    note?: string | null;
}

export type EmailPayload = {
    to: string;
    subject: string;
    html: string;
};

export type Notification = {
    id: string;
    userId: string;
    message: string;
    href: string;
    createdAt: any; // Can be Date or FieldValue
    read: boolean;
    browser?: string;
};
