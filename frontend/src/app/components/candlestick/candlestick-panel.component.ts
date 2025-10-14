import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CryptoPair } from '../../models/crypto-pair.model';
import { CryptoDataService } from '../../services/crypto-data.service';
import { CandlestickPoint } from '../../models/candlestick-point.model';

interface IndicatorState {
  showSma: boolean;
  showEma: boolean;
  showBollinger: boolean;
  showPressure: boolean;
}

interface CandleShape {
  x: number;
  width: number;
  wickX: number;
  openY: number;
  closeY: number;
  highY: number;
  lowY: number;
  bullish: boolean;
  timestamp: string;
  open: number;
  close: number;
}

interface PathPoint {
  x: number;
  y: number;
}

interface PressureArea {
  path: string;
  type: 'buy' | 'sell';
}

@Component({
  selector: 'app-candlestick-panel',
  templateUrl: './candlestick-panel.component.html',
  styleUrls: ['./candlestick-panel.component.scss']
})
export class CandlestickPanelComponent implements OnInit, OnChanges, OnDestroy {
  @Input() pairs: CryptoPair[] = [];
  @Input() defaultPairId?: string;

  settingsForm: FormGroup;
  loading = true;
  errorMessage?: string;
  candles: CandlestickPoint[] = [];
  candleShapes: CandleShape[] = [];
  smaPath?: string;
  emaPath?: string;
  bollingerFillPath?: string;
  bollingerUpperPath?: string;
  bollingerLowerPath?: string;
  pressureAreas: PressureArea[] = [];
  priceTicks: { value: number; y: number }[] = [];
  timeLabels: { x: number; label: string }[] = [];

  private subscription?: Subscription;
  private indicatorSubscription?: Subscription;
  private lastPairId?: string;

  readonly chartWidth = 1000;
  readonly chartHeight = 320;
  private readonly chartPadding = 24;

  constructor(
    private readonly cryptoDataService: CryptoDataService,
    private readonly formBuilder: FormBuilder
  ) {
    this.settingsForm = this.formBuilder.nonNullable.group({
      pairId: '',
      showSma: true,
      showEma: false,
      showBollinger: true,
      showPressure: true
    });
  }

  ngOnInit(): void {
    this.indicatorSubscription = this.settingsForm.valueChanges
      .pipe(debounceTime(180))
      .subscribe(values => {
        const currentPair = (values as IndicatorState & { pairId?: string }).pairId ?? '';
        if (currentPair && currentPair !== this.lastPairId) {
          this.lastPairId = currentPair;
          this.loadCandles();
        } else {
          this.updateChartArtifacts();
        }
      });
    this.initializePair();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['defaultPairId'] && !changes['defaultPairId'].isFirstChange()) {
      const nextId = changes['defaultPairId'].currentValue as string | undefined;
      const current = this.settingsForm.get('pairId')?.value as string | undefined;
      if (nextId && current !== nextId) {
        this.settingsForm.patchValue({ pairId: nextId }, { emitEvent: false });
        this.lastPairId = nextId;
        this.loadCandles();
      }
    }
    const currentPair = this.settingsForm.get('pairId')?.value as string | undefined;
    if (changes['pairs'] && !currentPair && this.pairs.length > 0) {
      this.initializePair();
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.indicatorSubscription?.unsubscribe();
  }

  get hasData(): boolean {
    return this.candles.length > 0 && !this.loading && !this.errorMessage;
  }

  private initializePair(): void {
    const initial = this.defaultPairId ?? this.pairs[0]?.id ?? '';
    this.settingsForm.patchValue({ pairId: initial }, { emitEvent: false });
    this.lastPairId = initial;
    if (initial) {
      this.loadCandles();
    } else {
      this.loading = false;
      this.errorMessage = 'Sin pares disponibles para mostrar.';
    }
  }

  private loadCandles(): void {
    const pairId = this.settingsForm.get('pairId')?.value as string | undefined;
    if (!pairId) {
      return;
    }

    this.subscription?.unsubscribe();
    this.loading = true;
    this.errorMessage = undefined;
    this.candles = [];

    this.subscription = this.cryptoDataService.getOhlc(pairId).subscribe({
      next: candles => {
        this.candles = candles;
        this.loading = false;
        if (candles.length === 0) {
          this.errorMessage = 'No se encontraron velas disponibles para este activo.';
        }
        this.updateChartArtifacts();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible recuperar el gráfico de velas en este momento.';
      }
    });
  }

  private updateChartArtifacts(): void {
    if (this.candles.length === 0) {
      this.candleShapes = [];
      this.smaPath = undefined;
      this.emaPath = undefined;
      this.bollingerFillPath = undefined;
      this.bollingerUpperPath = undefined;
      this.bollingerLowerPath = undefined;
      this.pressureAreas = [];
      this.priceTicks = [];
      this.timeLabels = [];
      return;
    }

    const closes = this.candles.map(candle => candle.close);
    const highs = this.candles.map(candle => candle.high);
    const lows = this.candles.map(candle => candle.low);
    const overallMax = Math.max(...highs);
    const overallMin = Math.min(...lows);
    const verticalRange = overallMax - overallMin || 1;
    const step = (this.chartWidth - this.chartPadding * 2) / Math.max(this.candles.length, 1);
    const candleWidth = Math.max(step * 0.6, 6);

    const scaleY = (value: number) => {
      const relative = (overallMax - value) / verticalRange;
      return this.chartPadding + relative * (this.chartHeight - this.chartPadding * 2);
    };

    this.candleShapes = this.candles.map((candle, index) => {
      const x = this.chartPadding + index * step;
      const wickX = x + candleWidth / 2;
      return {
        x,
        width: candleWidth,
        wickX,
        openY: scaleY(candle.open),
        closeY: scaleY(candle.close),
        highY: scaleY(candle.high),
        lowY: scaleY(candle.low),
        bullish: candle.close >= candle.open,
        timestamp: candle.timestamp,
        open: candle.open,
        close: candle.close
      };
    });

    const ticksCount = 5;
    this.priceTicks = Array.from({ length: ticksCount }, (_, index) => {
      const ratio = index / (ticksCount - 1);
      const value = overallMax - ratio * verticalRange;
      return { value, y: scaleY(value) };
    });

    const labelCount = Math.min(5, this.candleShapes.length);
    const labelStep = Math.max(1, Math.floor(this.candleShapes.length / labelCount));
    this.timeLabels = this.candleShapes
      .filter((_, index) => index % labelStep === 0 || index === this.candleShapes.length - 1)
      .map(shape => ({
        x: shape.x + shape.width / 2,
        label: new Date(shape.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }));

    const indicatorState = this.settingsForm.getRawValue();
    const smaValues = this.simpleMovingAverage(closes, 20);
    const emaValues = this.exponentialMovingAverage(closes, 12);
    const { upper, lower } = this.bollingerBands(closes, 20, 2);

    if (indicatorState.showSma) {
      this.smaPath = this.buildPath(
        smaValues
          .map((value, index) =>
            value === null
              ? undefined
              : ({
                  x: this.chartPadding + index * step + candleWidth / 2,
                  y: scaleY(value)
                } as PathPoint)
          )
          .filter((point): point is PathPoint => !!point)
      );
    } else {
      this.smaPath = undefined;
    }

    if (indicatorState.showEma) {
      this.emaPath = this.buildPath(
        emaValues
          .map((value, index) =>
            value === null
              ? undefined
              : ({
                  x: this.chartPadding + index * step + candleWidth / 2,
                  y: scaleY(value)
                } as PathPoint)
          )
          .filter((point): point is PathPoint => !!point)
      );
    } else {
      this.emaPath = undefined;
    }

    if (indicatorState.showBollinger) {
      const upperPoints = upper
        .map((value, index) =>
          value === null
            ? undefined
            : ({
                x: this.chartPadding + index * step + candleWidth / 2,
                y: scaleY(value)
              } as PathPoint)
        )
        .filter((point): point is PathPoint => !!point);
      const lowerPoints = lower
        .map((value, index) =>
          value === null
            ? undefined
            : ({
                x: this.chartPadding + index * step + candleWidth / 2,
                y: scaleY(value)
              } as PathPoint)
        )
        .filter((point): point is PathPoint => !!point);

      this.bollingerUpperPath = this.buildPath(upperPoints);
      this.bollingerLowerPath = this.buildPath(lowerPoints);

      if (upperPoints.length > 1 && lowerPoints.length > 1) {
        const fillPath = [
          this.buildPath(upperPoints),
          this.buildPath([...lowerPoints].reverse()),
          'Z'
        ].join(' ');
        this.bollingerFillPath = fillPath;
      } else {
        this.bollingerFillPath = undefined;
      }
    } else {
      this.bollingerUpperPath = undefined;
      this.bollingerLowerPath = undefined;
      this.bollingerFillPath = undefined;
    }

    if (indicatorState.showPressure) {
      this.pressureAreas = this.candleShapes
        .map((shape, index) => {
          const baseline = smaValues[index];
          if (baseline === null) {
            return undefined;
          }
          const baselineY = scaleY(baseline);
          const closeY = scaleY(this.candles[index].close);
          const path = [
            `M ${shape.x} ${baselineY}`,
            `L ${shape.x + shape.width} ${baselineY}`,
            `L ${shape.x + shape.width} ${closeY}`,
            `L ${shape.x} ${closeY}`,
            'Z'
          ].join(' ');
          return {
            path,
            type: closeY < baselineY ? 'buy' : 'sell'
          } as PressureArea;
        })
        .filter((area): area is PressureArea => !!area);
    } else {
      this.pressureAreas = [];
    }
  }

  private buildPath(points: PathPoint[]): string | undefined {
    if (!points || points.length === 0) {
      return undefined;
    }
    return points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
      .join(' ');
  }

  private simpleMovingAverage(values: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    for (let i = 0; i < values.length; i++) {
      if (i + 1 < period) {
        result.push(null);
        continue;
      }
      const window = values.slice(i + 1 - period, i + 1);
      const sum = window.reduce((acc, value) => acc + value, 0);
      result.push(sum / period);
    }
    return result;
  }

  private exponentialMovingAverage(values: number[], period: number): (number | null)[] {
    const result: (number | null)[] = [];
    const multiplier = 2 / (period + 1);
    let previousEma: number | null = null;

    values.forEach(value => {
      if (previousEma === null) {
        previousEma = value;
      } else {
        previousEma = (value - previousEma) * multiplier + previousEma;
      }
      result.push(previousEma);
    });

    return result;
  }

  private bollingerBands(values: number[], period: number, deviation = 2): { upper: (number | null)[]; lower: (number | null)[] } {
    const sma = this.simpleMovingAverage(values, period);
    const upper: (number | null)[] = [];
    const lower: (number | null)[] = [];

    for (let i = 0; i < values.length; i++) {
      const mean = sma[i];
      if (mean === null) {
        upper.push(null);
        lower.push(null);
        continue;
      }
      const window = values.slice(Math.max(0, i + 1 - period), i + 1);
      const variance = window.reduce((acc, value) => acc + Math.pow(value - mean, 2), 0) / window.length;
      const stdDev = Math.sqrt(variance);
      upper.push(mean + deviation * stdDev);
      lower.push(mean - deviation * stdDev);
    }

    return { upper, lower };
  }
}
