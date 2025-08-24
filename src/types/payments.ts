export interface PaymentItem {
  item?: string;
  price?: number;
  woo_product?: number;
  duration?: string;
}

export interface PaymentsSettings {
  enable_payment: boolean;
  type: 'native' | 'woocommerce';
  woo_product: number | null;
  enable_items_based_on_duration: boolean;
  items: PaymentItem[];
  multi_duration_items: {
    [key: string]: PaymentItem;
  };
  payment_methods?: string[];
  enable_paypal: boolean;
  enable_stripe: boolean;
  currency?: string;
} 