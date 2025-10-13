import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { ChartConfiguration, ChartData, ChartType } from 'chart.js';
import { BaseChartDirective } from 'ng2-charts';
import { Subscription, forkJoin, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { CryptoDataService } from '../../services/crypto-data.service';
import { CryptoPair } from '../../models/crypto-pair.model';
import { PricePoint } from '../../models/price-point.model';

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
  selectedIds: string[] = [];
  priceHistory = new Map<string, number[]>();
  latestPoints = new Map<string, PricePoint>();
  labels: string[] = [];
  connectionStatus: 'connecting' | 'live' | 'error' = 'connecting';
  connectionMessage = 'Sincronizando datos con CoinGecko…';
  private historySubscription?: Subscription;
  private autoRefreshSubscription?: Subscription;
  private retrySubscription?: Subscription;

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
        this.selectedIds = pairs.slice(0, 3).map(pair => pair.id);
        this.initializeHistory();
        this.loadMarketData();
      },
      error: () => {
        this.loading = false;
        this.connectionStatus = 'error';
        this.connectionMessage = 'No fue posible conectar con CoinGecko.';
        this.errorMessage = 'No fue posible recuperar la lista de activos disponibles.';
      }
    });
  }

  ngOnDestroy(): void {
    this.historySubscription?.unsubscribe();
    this.autoRefreshSubscription?.unsubscribe();
    this.retrySubscription?.unsubscribe();
  }

  onSelectionChange(ids: string[]): void {
    this.selectedIds = ids;
    this.initializeHistory();
    this.loadMarketData();
  }

  private initializeHistory(): void {
    this.priceHistory.clear();
    this.latestPoints.clear();
    this.labels = [];
    this.loading = true;
    this.errorMessage = undefined;
    this.connectionStatus = 'connecting';
    this.connectionMessage = 'Preparando datos del mercado desde CoinGecko…';
    this.selectedIds.forEach(id => this.priceHistory.set(id, []));
    this.updateDatasets();
  }

  private loadMarketData(): void {
    this.historySubscription?.unsubscribe();
    this.autoRefreshSubscription?.unsubscribe();
    this.retrySubscription?.unsubscribe();

    if (this.selectedIds.length === 0) {
      this.loading = false;
      this.updateDatasets();
      return;
    }

    const requests = this.selectedIds.map(id => this.cryptoDataService.getMarketChart(id));
    this.connectionStatus = 'connecting';
    this.connectionMessage = 'Actualizando datos desde CoinGecko…';

    this.historySubscription = forkJoin(requests).subscribe({
      next: seriesCollection => {
        if (seriesCollection.length === 0) {
          this.loading = false;
          this.errorMessage = 'No se encontraron datos de mercado para los activos seleccionados.';
          return;
        }

        const referenceSeries = seriesCollection[0];
        this.labels = referenceSeries.map(point => new Date(point.timestamp).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit'
        }));

        seriesCollection.forEach((series, index) => {
          const assetId = this.selectedIds[index];
          const percentSeries = series.map(point => point.changePercent);
          this.priceHistory.set(assetId, percentSeries);
          if (series.length > 0) {
            this.latestPoints.set(assetId, series[series.length - 1]);
          }
        });

        this.loading = false;
        this.errorMessage = undefined;
        this.connectionStatus = 'live';
        this.connectionMessage = 'Datos obtenidos de CoinGecko';
        this.updateDatasets();
        this.startAutoRefresh();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible obtener datos de mercado desde CoinGecko.';
        this.connectionStatus = 'error';
        this.connectionMessage = 'Sin conexión con CoinGecko. Reintentando…';
        this.scheduleRetry();
      }
    });
  }

  private updateDatasets(): void {
    const colors = ['#4f46e5', '#22d3ee', '#14b8a6', '#f97316', '#ef4444', '#a855f7'];
    const datasets = this.selectedIds.map((id, index) => {
      const data = this.priceHistory.get(id) ?? [];
      const color = colors[index % colors.length];
      return {
        data,
        label: this.availablePairs.find(pair => pair.id === id)?.label ?? id,
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
    return this.selectedIds.map(id => {
      const pair = this.availablePairs.find(item => item.id === id);
      const latest = this.latestPoints.get(id);
      return {
        symbol: pair?.quote ?? id.toUpperCase(),
        label: pair?.label ?? id,
        price: latest?.price,
        changePercent: latest?.changePercent
      };
    });
  }

  private startAutoRefresh(): void {
    this.autoRefreshSubscription?.unsubscribe();
    if (this.selectedIds.length === 0) {
      return;
    }

    this.autoRefreshSubscription = timer(60000, 60000)
      .pipe(switchMap(() => this.cryptoDataService.getSnapshots(this.selectedIds)))
      .subscribe({
        next: snapshots => {
          snapshots.forEach(snapshot => {
            const previous = this.latestPoints.get(snapshot.id);
            this.latestPoints.set(snapshot.id, {
              ...snapshot,
              changePercent: snapshot.changePercent ?? previous?.changePercent ?? 0
            });
          });
          this.connectionStatus = 'live';
          this.connectionMessage = 'Datos obtenidos de CoinGecko';
        },
        error: () => {
          this.connectionStatus = 'error';
          this.connectionMessage = 'Dificultad para refrescar datos desde CoinGecko.';
        }
      });
  }

  private scheduleRetry(): void {
    this.retrySubscription?.unsubscribe();
    if (this.selectedIds.length === 0) {
      return;
    }
    this.retrySubscription = timer(6000).subscribe(() => this.loadMarketData());
  }
}
