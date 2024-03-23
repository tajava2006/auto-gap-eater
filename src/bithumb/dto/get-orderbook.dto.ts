export interface GetOrderbookResponse {
  status: string;
  data: Orderbook;
}

export interface Orderbook {
  timestamp: string;
  payment_currency: string;
  order_currency: string;
  bids: Bid[];
  asks: Ask[];
}

export interface Bid {
  price: string;
  quantity: string;
}

export interface Ask {
  price: string;
  quantity: string;
}
