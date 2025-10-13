import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { CryptoPair } from '../models/crypto-pair.model';
import { PricePoint } from '../models/price-point.model';
import { NewsItem } from '../models/news-item.model';

interface CoinGeckoMarketResponse {
  id: string;
  symbol: string;
  name: string;
}

interface CoinGeckoMarketChartResponse {
  prices: [number, number][];
}

interface CoinGeckoSimplePriceResponse {
  [id: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

interface CryptoCompareNewsItem {
  id: string | number;
  title: string;
  body: string;
  source_info?: {
    name?: string;
  };
  published_on: number;
}

interface CryptoCompareNewsResponse {
  Data: CryptoCompareNewsItem[];
}

@Injectable({
  providedIn: 'root'
})
export class CryptoDataService {
  private readonly coinGeckoApi = 'https://api.coingecko.com/api/v3';
  private readonly cryptoCompareApi = 'https://min-api.cryptocompare.com/data/v2';

  constructor(private readonly http: HttpClient) {}

  getPairs(limit = 12): Observable<CryptoPair[]> {
    const params = new HttpParams({
      fromObject: {
        vs_currency: 'usd',
        order: 'market_cap_desc',
        per_page: limit.toString(),
        page: '1',
        sparkline: 'false'
      }
    });

    return this.http
      .get<CoinGeckoMarketResponse[]>(`${this.coinGeckoApi}/coins/markets`, { params })
      .pipe(
        map(markets =>
          markets.map(coin => ({
            id: coin.id,
            base: 'USD',
            quote: coin.symbol.toUpperCase(),
            label: `${coin.name} (${coin.symbol.toUpperCase()})`
          }))
        )
      );
  }

  getMarketChart(id: string, maxPoints = 30): Observable<PricePoint[]> {
    const params = new HttpParams({
      fromObject: {
        vs_currency: 'usd',
        days: '1',
        interval: 'hourly'
      }
    });

    return this.http
      .get<CoinGeckoMarketChartResponse>(`${this.coinGeckoApi}/coins/${id}/market_chart`, { params })
      .pipe(
        map(response => {
          const prices = response.prices.slice(-maxPoints);
          const baseline = prices[0]?.[1] ?? 0;

          return prices.map(([timestamp, price]) => {
            const changePercent = baseline ? ((price - baseline) / baseline) * 100 : 0;
            return {
              id,
              price,
              changePercent,
              timestamp: new Date(timestamp).toISOString()
            } as PricePoint;
          });
        })
      );
  }

  getSnapshots(ids: string[]): Observable<PricePoint[]> {
    if (ids.length === 0) {
      return of([]);
    }

    const params = new HttpParams({
      fromObject: {
        ids: ids.join(','),
        vs_currencies: 'usd',
        include_24hr_change: 'true'
      }
    });

    return this.http
      .get<CoinGeckoSimplePriceResponse>(`${this.coinGeckoApi}/simple/price`, { params })
      .pipe(
        map(response =>
          Object.entries(response).map(([id, value]) => ({
            id,
            price: value.usd,
            changePercent: value.usd_24h_change,
            timestamp: new Date().toISOString()
          }))
        )
      );
  }

  getNews(limit = 8): Observable<NewsItem[]> {
    const params = new HttpParams({
      fromObject: {
        lang: 'EN',
        sortOrder: 'popular',
        categories: 'blockchain'
      }
    });

    return this.http
      .get<CryptoCompareNewsResponse>(`${this.cryptoCompareApi}/news/`, { params })
      .pipe(
        map(response =>
          response.Data.slice(0, limit).map(item => ({
            id: item.id.toString(),
            title: item.title,
            summary: this.cleanSummary(item.body),
            source: item.source_info?.name ?? 'CryptoCompare',
            publishedAt: new Date(item.published_on * 1000).toISOString()
          }))
        )
      );
  }

  private cleanSummary(value: string): string {
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
