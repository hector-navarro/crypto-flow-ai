import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CryptoDataService } from '../../../services/crypto-data.service';
import { NewsItem } from '../../../models/news-item.model';

@Component({
  selector: 'app-news-article',
  templateUrl: './news-article.component.html',
  styleUrls: ['./news-article.component.scss']
})
export class NewsArticleComponent implements OnInit, OnDestroy {
  article?: NewsItem;
  loading = true;
  errorMessage?: string;
  private subscription?: Subscription;

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router,
    private readonly cryptoDataService: CryptoDataService
  ) {}

  ngOnInit(): void {
    this.subscription = this.activatedRoute.paramMap
      .pipe(
        switchMap(params => {
          const id = params.get('id');
          if (!id) {
            this.errorMessage = 'Artículo no encontrado.';
            this.loading = false;
            return of(undefined);
          }
          this.loading = true;
          this.errorMessage = undefined;
          return this.cryptoDataService.getNewsDetail(id);
        })
      )
      .subscribe(article => {
        if (!article) {
          this.errorMessage = 'No pudimos cargar esta noticia. Inténtalo más tarde.';
          this.loading = false;
          return;
        }
        this.article = article;
        this.loading = false;
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  goBack(): void {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      this.router.navigate(['/']);
    }
  }
}
