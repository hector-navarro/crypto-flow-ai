import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, timer, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { CryptoDataService } from '../../services/crypto-data.service';
import { NewsItem } from '../../models/news-item.model';

@Component({
  selector: 'app-news-panel',
  templateUrl: './news-panel.component.html',
  styleUrls: ['./news-panel.component.scss']
})
export class NewsPanelComponent implements OnInit, OnDestroy {
  news: NewsItem[] = [];
  loading = true;
  errorMessage?: string;
  connectionStatus: 'connecting' | 'live' | 'error' = 'connecting';
  connectionMessage = 'Sincronizando titulares desde CryptoCompare…';
  private subscription?: Subscription;

  constructor(private readonly cryptoDataService: CryptoDataService) {}

  ngOnInit(): void {
    this.subscribeToNews();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  trackById(_: number, item: NewsItem): string {
    return item.id;
  }

  private subscribeToNews(): void {
    this.subscription?.unsubscribe();
    this.loading = this.news.length === 0;
    this.errorMessage = undefined;
    this.connectionStatus = 'connecting';
    this.connectionMessage = 'Sincronizando titulares desde CryptoCompare…';

    this.subscription = timer(0, 300000)
      .pipe(
        switchMap(() =>
          this.cryptoDataService.getNews().pipe(
            catchError(() => {
              if (this.news.length === 0) {
                this.errorMessage = 'No fue posible obtener titulares desde CryptoCompare.';
              }
              this.loading = false;
              this.connectionStatus = 'error';
              this.connectionMessage = 'Error al contactar CryptoCompare. Reintentando…';
              return of<NewsItem[] | null>(null);
            })
          )
        )
      )
      .subscribe(items => {
        if (!items) {
          return;
        }
        this.news = items;
        this.loading = false;
        this.errorMessage = undefined;
        this.connectionStatus = 'live';
        this.connectionMessage = 'Fuente: CryptoCompare (actualización periódica)';
      });
  }
}
