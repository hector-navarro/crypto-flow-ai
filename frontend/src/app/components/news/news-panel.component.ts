import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
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
  connectionMessage = 'Sincronizando titulares…';
  private subscription?: Subscription;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;

  constructor(private readonly cryptoDataService: CryptoDataService) {}

  ngOnInit(): void {
    this.subscribeToNews();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }

  trackById(_: number, item: NewsItem): string {
    return item.id;
  }

  private subscribeToNews(): void {
    this.subscription?.unsubscribe();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.loading = this.news.length === 0;
    this.errorMessage = undefined;
    this.connectionStatus = 'connecting';
    this.connectionMessage = 'Sincronizando titulares…';

    this.subscription = this.cryptoDataService.streamNews().subscribe({
      next: items => {
        this.news = items;
        this.loading = false;
        this.errorMessage = undefined;
        this.connectionStatus = 'live';
        this.connectionMessage = 'Flujo de noticias activo';
      },
      error: () => {
        if (this.news.length === 0) {
          this.errorMessage = 'No es posible conectar con las noticias en vivo. Verifica el backend.';
        }
        this.loading = false;
        this.connectionStatus = 'error';
        this.connectionMessage = 'Sin conexión con el backend. Reintentando…';
        this.subscription = undefined;
        this.reconnectTimeout = setTimeout(() => this.subscribeToNews(), 5000);
      }
    });
  }
}
