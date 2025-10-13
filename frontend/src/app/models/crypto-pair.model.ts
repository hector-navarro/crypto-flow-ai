export interface CryptoPair {
  /** Identifier for the asset used across market data providers */
  id: string;
  /** Quoted currency for the market (USD by default) */
  base: string;
  /** Trading symbol for the asset (e.g. BTC, ETH) */
  quote: string;
  /** Friendly label combining name and symbol */
  label: string;
}
