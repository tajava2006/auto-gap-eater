export interface GetNetworkInfoResponse {
  status: string;
  data: Data[];
}

export interface Data {
  currency: string;
  net_type: string;
  deposit_status: number;
  withdrawal_status: number;
}
