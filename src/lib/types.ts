
export type CartItem = {
    id: string;
    subscriptionId: string;
    subscriptionName: string;
    variantName: string;
    price: number;
    quantity: number;
    imageUrl: string;
}

export type Order = {
    id: string;
    userId: string;
    items: CartItem[];
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    subtotal: number;
    creditUsed: number;
    totalAmount: number;
    paymentScreenshotUrl: string | null;
    orderDate: any; // Can be Date or FieldValue
    status: 'pending' | 'completed' | 'cancelled';
}
