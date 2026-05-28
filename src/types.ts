export interface Transaction {
  id: string; // Internal unique ID
  orderNumber: string;
  product: string;
  price: number;
  date: string;
  paymentMethod: string;
}

export interface DashboardFilters {
  startDate: string;
  endDate: string;
  selectedProducts: string[];
  selectedPaymentMethods: string[];
  searchQuery: string;
  minPrice: number;
  maxPrice: number;
}

export interface ProductAnalytics {
  name: string;
  revenue: number;
  quantity: number;
  averagePrice: number;
  category: string;
}

export interface DailySales {
  date: string;
  revenue: number;
  ordersCount: number;
  itemsCount: number;
}

export interface PaymentMethodAnalytics {
  name: string;
  value: number; // Revenue or count
  percentage: number;
  count: number;
}
