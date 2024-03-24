export type GetOrderbookResponse = Orderbook[];

export interface Orderbook {
  market: string;
  timestamp: number;
  total_ask_size: number;
  total_bid_size: number;
  orderbook_units: OrderbookUnit[];
  level: number;
}

export interface OrderbookUnit {
  ask_price: number;
  bid_price: number;
  ask_size: number;
  bid_size: number;
}
