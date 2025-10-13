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
  errorMessage?: string;
  availablePairs: CryptoPair[] = [];
  selectedQuotes: string[] = [];
  priceHistory = new Map<string, number[]>();
  latestPoints = new Map<string, PricePoint>();
  labels: string[] = [];
  connectionStatus: 'connecting' | 'live' | 'error' = 'connecting';
  connectionMessage = 'Sincronizando datos en vivo…';
  private priceSubscription?: Subscription;
  private reconnectTimeout?: ReturnType<typeof setTimeout>;

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
    this.cryptoDataService.getPairs().subscribe({
      next: pairs => {
        this.availablePairs = pairs;
        this.selectedQuotes = pairs.slice(0, 3).map(pair => pair.quote);
        this.initializeHistory();
        this.subscribeToPrices();
      },
      error: () => {
        this.loading = false;
        this.connectionStatus = 'error';
        this.connectionMessage = 'Sin conexión con el backend. Verifica que esté desplegado.';
        this.errorMessage = 'No fue posible recuperar la lista de pares disponibles.';
      }
    });
  }

  ngOnDestroy(): void {
    this.priceSubscription?.unsubscribe();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
  }

  onSelectionChange(quotes: string[]): void {
    this.selectedQuotes = quotes;
    this.initializeHistory();
    this.subscribeToPrices();
  }

  private initializeHistory(): void {
    this.priceHistory.clear();
    this.latestPoints.clear();
    this.labels = [];
    this.loading = true;
    this.errorMessage = undefined;
    this.connectionStatus = 'connecting';
    this.connectionMessage = 'Preparando el tablero en vivo…';
    this.selectedQuotes.forEach(quote => this.priceHistory.set(`USD-${quote}`, []));
    this.updateDatasets();
  }

  private subscribeToPrices(): void {
    this.priceSubscription?.unsubscribe();
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    if (this.selectedQuotes.length === 0) {
      return;
    }
    this.connectionStatus = 'connecting';
    this.connectionMessage = 'Conectando al flujo en vivo…';
    this.priceSubscription = this.cryptoDataService.streamPrices(this.selectedQuotes)
      .subscribe({
        next: pricePoint => this.handlePrice(pricePoint),
        error: () => this.handleStreamError()
      });
  }

  private handlePrice(point: PricePoint): void {
    if (!this.priceHistory.has(point.symbol)) {
      return;
    }
    this.connectionStatus = 'live';
    this.connectionMessage = 'Flujo en vivo activo';
    this.errorMessage = undefined;
    this.loading = false;
    const history = this.priceHistory.get(point.symbol)!;
    history.push(point.changePercent);
    if (history.length > 30) {
      history.shift();
    }
    this.latestPoints.set(point.symbol, point);
    const timestamp = new Date(point.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    this.labels.push(timestamp);
    if (this.labels.length > 30) {
      this.labels.shift();
    }
    this.updateDatasets();
  }

  private handleStreamError(): void {
    if (this.labels.length === 0) {
      this.errorMessage = 'No es posible obtener datos en vivo. Verifica que el backend esté desplegado.';
    }
    this.connectionStatus = 'error';
    this.connectionMessage = 'Sin conexión con el backend. Reintentando…';
    this.priceSubscription = undefined;
    if (this.selectedQuotes.length > 0) {
      this.reconnectTimeout = setTimeout(() => this.subscribeToPrices(), 3500);
    }
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

  get pairSnapshots(): { symbol: string; label: string; price?: number; changePercent?: number }[] {
    return this.selectedQuotes.map(quote => {
      const symbol = `USD-${quote}`;
      const latest = this.latestPoints.get(symbol);
      const label = this.availablePairs.find(pair => pair.quote === quote)?.label ?? symbol;
      return {
        symbol,
        label,
        price: latest?.price,
        changePercent: latest?.changePercent
      };
    });
  }
}
