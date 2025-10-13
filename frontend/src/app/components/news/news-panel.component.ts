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
  private subscription?: Subscription;

  constructor(private readonly cryptoDataService: CryptoDataService) {}

  ngOnInit(): void {
    this.subscription = this.cryptoDataService.streamNews()
      .subscribe(items => this.news = items);
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  trackById(_: number, item: NewsItem): string {
    return item.id;
  }
}
