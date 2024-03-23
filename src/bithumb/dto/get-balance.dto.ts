export interface GetBalanceResponse {
  status: string;
  data: BalanceData;
}

export interface BalanceData {
  total_krw: string;
  in_use_krw: string;
  available_krw: string;
  total_coin: string;
  in_use_coin: string;
  available_coin: string;
  xcoin_last_btc: string;
}
