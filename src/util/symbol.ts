interface SymbolInfo {
  fee: number;
  address: string;
  memo?: string;
  oneTick: number;
  oneTickBonus: number;
}

type symbolType = 'XRP' | 'SEI' | 'SOL' | 'EOS' | 'NEO';

const symbolMap = new Map<symbolType, SymbolInfo>();

symbolMap.set('XRP', {
  fee: 0.4,
  address: 'raQwCVAJVqjrVm1Nj5SFRcX8i22BhdC9WA',
  memo: '3838094008',
  oneTick: 1,
  oneTickBonus: 100,
});

symbolMap.set('SEI', {
  fee: 1,
  address: 'sei1d9lnhs33tv3r6na4g0p4zf9v0p8svhsy6xwxyt',
  memo: 'eb1eaafec37aab00',
  oneTick: 1,
  oneTickBonus: 100,
});

symbolMap.set('SOL', {
  fee: 0.009,
  address: '4tmGLRCpJDQDtRVy4RTvnoVJmPPEWKCaJ3auCQrXu3K9',
  oneTick: 100,
  oneTickBonus: 1,
});

symbolMap.set('EOS', {
  fee: 0,
  address: 'eosupbitsusr',
  memo: 'd027e05d-b73c-49e7-98c7-25079c5b0fa3',
  oneTick: 1,
  oneTickBonus: 100,
});

symbolMap.set('NEO', {
  fee: 0,
  address: 'NLAy3tUfrGQtGnyovGzZih4RmpgEMxcNpf',
  oneTick: 100,
  oneTickBonus: 1,
});

export { symbolType, symbolMap };
