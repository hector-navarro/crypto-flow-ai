import { Injectable, NgZone } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { CryptoPair } from '../models/crypto-pair.model';
import { PricePoint } from '../models/price-point.model';
import { NewsItem } from '../models/news-item.model';

@Injectable({
  providedIn: 'root'
})
export class CryptoDataService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private readonly http: HttpClient, private readonly zone: NgZone) {}

  getPairs(): Observable<CryptoPair[]> {
    return this.http.get<CryptoPair[]>(`${this.apiUrl}/prices`);
  }

  streamPrices(quotes: string[]): Observable<PricePoint> {
    const params = new HttpParams({ fromObject: { quotes } });
    const url = `${this.apiUrl}/prices/stream?${params.toString()}`;

    return new Observable<PricePoint>(observer => {
      const eventSource = new EventSource(url);
      eventSource.onmessage = event => {
        this.zone.run(() => {
          const parsed: PricePoint = JSON.parse(event.data);
          observer.next(parsed);
        });
      };
      eventSource.onerror = error => {
        this.zone.run(() => observer.error(error));
        eventSource.close();
      };
      return () => eventSource.close();
    });
  }

  streamNews(): Observable<NewsItem[]> {
    const url = `${this.apiUrl}/news/stream`;
    return new Observable<NewsItem[]>(observer => {
      const eventSource = new EventSource(url);
      eventSource.onmessage = event => {
        this.zone.run(() => {
          const parsed: NewsItem[] = JSON.parse(event.data);
          observer.next(parsed);
        });
      };
      eventSource.onerror = error => {
        this.zone.run(() => observer.error(error));
        eventSource.close();
      };
      return () => eventSource.close();
    });
  }
}
