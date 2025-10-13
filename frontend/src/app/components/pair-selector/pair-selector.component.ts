import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Subscription } from 'rxjs';
import { CryptoPair } from '../../models/crypto-pair.model';

@Component({
  selector: 'app-pair-selector',
  templateUrl: './pair-selector.component.html',
  styleUrls: ['./pair-selector.component.scss']
})
export class PairSelectorComponent implements OnInit, OnChanges, OnDestroy {
  @Input() pairs: CryptoPair[] = [];
  @Input() selectedQuotes: string[] = [];
  @Output() selectionChange = new EventEmitter<string[]>();

  control = new FormControl<string[]>([], { nonNullable: true });
  private subscription?: Subscription;
  readonly maxPairs = 6;

  ngOnInit(): void {
    this.control.setValue(this.selectedQuotes);
    this.subscription = this.control.valueChanges.subscribe(values => {
      const truncated = values.slice(0, this.maxPairs);
      if (truncated.length !== values.length) {
        this.control.setValue(truncated, { emitEvent: false });
      }
      this.selectionChange.emit(truncated);
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedQuotes']) {
      const incoming = this.selectedQuotes;
      const current = this.control.value ?? [];
      const changed = incoming.length !== current.length || incoming.some((value, index) => value !== current[index]);
      if (changed) {
        this.control.setValue(incoming, { emitEvent: false });
      }
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
