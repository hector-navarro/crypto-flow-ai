import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { CryptoPair } from '../models/crypto-pair.model';
import { PricePoint } from '../models/price-point.model';
import { NewsItem } from '../models/news-item.model';
import { CandlestickPoint } from '../models/candlestick-point.model';

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

interface CoinCapAsset {
  id: string;
  symbol: string;
  name: string;
  priceUsd: string;
  changePercent24Hr: string;
}

interface CoinCapAssetsResponse {
  data: CoinCapAsset[];
}

interface CoinCapHistoryPoint {
  priceUsd: string;
  time: number;
}

interface CoinCapHistoryResponse {
  data: CoinCapHistoryPoint[];
}

interface CryptoCompareNewsItem {
  id: string | number;
  title: string;
  body: string;
  url: string;
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
  private readonly coinCapApi = 'https://api.coincap.io/v2';

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
        ),
        catchError(() => this.fetchCoinCapPairs(limit))
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
        }),
        catchError(() => this.fetchCoinCapHistory(id, maxPoints))
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
          })),
        ),
        catchError(() => this.fetchCoinCapSnapshots(ids))
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
            summary: this.buildSummary(item.body),
            source: item.source_info?.name ?? 'CryptoCompare',
            publishedAt: new Date(item.published_on * 1000).toISOString(),
            content: this.cleanContent(item.body),
            url: item.url
          }))
        )
      );
  }

  getNewsDetail(id: string): Observable<NewsItem | undefined> {
    return this.getNews(30).pipe(map(items => items.find(item => item.id === id)));
  }

  getOhlc(id: string, days = 7): Observable<CandlestickPoint[]> {
    const params = new HttpParams({
      fromObject: {
        vs_currency: 'usd',
        days: days.toString()
      }
    });

    return this.http
      .get<[number, number, number, number, number][]>(`${this.coinGeckoApi}/coins/${id}/ohlc`, { params })
      .pipe(
        map(series =>
          series.map(point => ({
            timestamp: new Date(point[0]).toISOString(),
            open: point[1],
            high: point[2],
            low: point[3],
            close: point[4]
          }))
        ),
        catchError(() => of<CandlestickPoint[]>([]))
      );
  }

  private fetchCoinCapPairs(limit: number): Observable<CryptoPair[]> {
    const params = new HttpParams({
      fromObject: {
        limit: limit.toString()
      }
    });

    return this.http.get<CoinCapAssetsResponse>(`${this.coinCapApi}/assets`, { params }).pipe(
      map(response =>
        response.data.map(asset => ({
          id: asset.id,
          base: 'USD',
          quote: asset.symbol.toUpperCase(),
          label: `${asset.name} (${asset.symbol.toUpperCase()})`
        }))
      )
    );
  }

  private fetchCoinCapHistory(id: string, maxPoints: number): Observable<PricePoint[]> {
    const params = new HttpParams({
      fromObject: {
        interval: 'h1'
      }
    });

    return this.http
      .get<CoinCapHistoryResponse>(`${this.coinCapApi}/assets/${id}/history`, { params })
      .pipe(
        map(response => {
          const points = response.data.slice(-maxPoints);
          const baseline = points.length > 0 ? parseFloat(points[0].priceUsd) || 0 : 0;

          return points.map(point => {
            const price = parseFloat(point.priceUsd) || 0;
            const changePercent = baseline ? ((price - baseline) / baseline) * 100 : 0;
            return {
              id,
              price,
              changePercent,
              timestamp: new Date(point.time).toISOString()
            } as PricePoint;
          });
        })
      );
  }

  private fetchCoinCapSnapshots(ids: string[]): Observable<PricePoint[]> {
    const params = new HttpParams({
      fromObject: {
        ids: ids.join(',')
      }
    });

    return this.http.get<CoinCapAssetsResponse>(`${this.coinCapApi}/assets`, { params }).pipe(
      map(response =>
        response.data.map(asset => ({
          id: asset.id,
          price: parseFloat(asset.priceUsd) || 0,
          changePercent: parseFloat(asset.changePercent24Hr) || 0,
          timestamp: new Date().toISOString()
        }))
      )
    );
  }

  private buildSummary(value: string, maxLength = 140): string {
    const cleanValue = this.cleanContent(value);
    if (cleanValue.length <= maxLength) {
      return cleanValue;
    }
    return `${cleanValue.slice(0, maxLength).trim()}…`;
  }

  private cleanContent(value: string): string {
    return value
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[a-z#0-9]+;/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
