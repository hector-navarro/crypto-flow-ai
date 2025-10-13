import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { CryptoDataService } from '../../services/crypto-data.service';
import { CryptoPair } from '../../models/crypto-pair.model';
import { PricePoint } from '../../models/price-point.model';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { Subscription } from 'rxjs';
import { BaseChartDirective } from 'ng2-charts';

interface ChartSeries {
  label: string;
  data: number[];
  borderColor: string;
  backgroundColor: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild(BaseChartDirective) chart?: BaseChartDirective;

  loading = true;
  availablePairs: CryptoPair[] = [];
  selectedQuotes: string[] = [];
  priceHistory = new Map<string, number[]>();
  labels: string[] = [];
  private priceSubscription?: Subscription;

  lineChartData: ChartData<'line'> = {
    datasets: []
  };
  lineChartOptions: ChartConfiguration['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: 'var(--app-muted-text)' },
        grid: { color: 'rgba(148, 163, 184, 0.2)' }
      },
      y: {
        ticks: {
          color: 'var(--app-muted-text)',
          callback(value) {
            return `${value}%`;
          }
        },
        grid: { color: 'rgba(148, 163, 184, 0.2)' }
      }
    },
    plugins: {
      legend: {
        labels: {
          color: 'var(--app-text-color)'
        }
      },
      tooltip: {
        callbacks: {
          label(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y ?? 0;
            return `${label}: ${value.toFixed(2)}%`;
          }
        }
      }
    }
  };
  lineChartType: ChartType = 'line';

  constructor(private readonly cryptoDataService: CryptoDataService) {}

  ngOnInit(): void {
    this.cryptoDataService.getPairs().subscribe(pairs => {
      this.availablePairs = pairs;
      this.selectedQuotes = pairs.slice(0, 3).map(pair => pair.quote);
      this.initializeHistory();
      this.subscribeToPrices();
      this.loading = false;
    });
  }

  ngOnDestroy(): void {
    this.priceSubscription?.unsubscribe();
  }

  onSelectionChange(quotes: string[]): void {
    this.selectedQuotes = quotes;
    this.initializeHistory();
    this.subscribeToPrices();
  }

  private initializeHistory(): void {
    this.priceHistory.clear();
    this.labels = [];
    this.selectedQuotes.forEach(quote => this.priceHistory.set(`USD-${quote}`, []));
    this.updateDatasets();
  }

  private subscribeToPrices(): void {
    this.priceSubscription?.unsubscribe();
    if (this.selectedQuotes.length === 0) {
      return;
    }
    this.priceSubscription = this.cryptoDataService.streamPrices(this.selectedQuotes)
      .subscribe(pricePoint => this.handlePrice(pricePoint));
  }

  private handlePrice(point: PricePoint): void {
    if (!this.priceHistory.has(point.symbol)) {
      return;
    }
    const history = this.priceHistory.get(point.symbol)!;
    history.push(point.changePercent);
    if (history.length > 30) {
      history.shift();
    }
    const timestamp = new Date(point.timestamp).toLocaleTimeString();
    this.labels.push(timestamp);
    if (this.labels.length > 30) {
      this.labels.shift();
    }
    this.updateDatasets();
  }

  private updateDatasets(): void {
    const colors = ['#4f46e5', '#22d3ee', '#14b8a6', '#f97316', '#ef4444', '#a855f7'];
    const datasets = Array.from(this.priceHistory.entries()).map(([symbol, data], index) => {
      const color = colors[index % colors.length];
      return {
        data,
        label: symbol,
        borderColor: color,
        backgroundColor: `${color}33`,
        tension: 0.35,
        fill: false,
        pointRadius: 0
      } as ChartConfiguration<'line'>['data']['datasets'][number];
    });
    this.lineChartData = {
      labels: this.labels,
      datasets
    };
    this.chart?.update();
  }
}
