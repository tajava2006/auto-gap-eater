interface SymbolInfo {
  fee: number;
  address: string;
  memo?: string;
}

type symbolType = 'XRP' | 'SEI' | 'SOL';

const symbolMap = new Map<symbolType, SymbolInfo>();

symbolMap.set('XRP', {
  fee: 0.4,
  address: 'raQwCVAJVqjrVm1Nj5SFRcX8i22BhdC9WA',
  memo: '3838094008',
});

symbolMap.set('SEI', {
  fee: 1,
  address: 'sei1d9lnhs33tv3r6na4g0p4zf9v0p8svhsy6xwxyt',
  memo: 'eb1eaafec37aab00',
});

symbolMap.set('SOL', {
  fee: 0.03,
  address: '4tmGLRCpJDQDtRVy4RTvnoVJmPPEWKCaJ3auCQrXu3K9',
});

export { symbolType, symbolMap };
