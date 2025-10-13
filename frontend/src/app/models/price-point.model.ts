export interface PricePoint {
  /** CoinGecko identifier for the asset */
  id: string;
  /** Latest quoted price in USD */
  price: number;
  /** Percentage change relative to the reference window */
  changePercent: number;
  /** ISO timestamp associated with the value */
  timestamp: string;
}
