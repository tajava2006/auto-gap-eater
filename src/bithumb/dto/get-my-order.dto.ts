export interface GetMyOrderResponse {
  status: string;
  data: Order[];
}

export interface Order {
  search: string;
  transfer_date: string;
  order_currency: string;
  payment_currency: string;
  units: string;
  price: string;
  amount: string;
  fee_currency: string;
  fee: string;
  order_balance: string;
  payment_balance: string;
}
