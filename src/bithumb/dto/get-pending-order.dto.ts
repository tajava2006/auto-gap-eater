export interface GetPendingOrderResponse {
  status: string;
  data: Order[];
}

export interface Order {
  order_currency: string;
  payment_currency: string;
  order_id: string;
  order_date: string;
  type: string;
  watch_price: string;
  units: string;
  units_remaining: string;
  price: string;
}
