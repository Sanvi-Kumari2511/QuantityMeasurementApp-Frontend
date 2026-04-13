import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HistoryService } from '../../services/history.service';
import { QuantityService, QuantityDTO, QuantityInputDTO } from '../../services/quantity.service';
import { Observable, Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

interface UnitMap {
  [key: string]: string[];
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './home.html',
  styleUrls: ['./home.css'],
})
export class HomeComponent implements OnInit, OnDestroy {
  showLogoutDialog = false;

  types = [
    { id: 'length', label: 'Length', icon: '📏', hoverEmoji: '⚖️' },
    { id: 'weight', label: 'Weight', icon: '⚖️', hoverEmoji: '🏋️' },
    { id: 'temperature', label: 'Temperature', icon: '🌡️', hoverEmoji: '🔥' },
    { id: 'volume', label: 'Volume', icon: '🧪', hoverEmoji: '🫧' },
  ];

  private logSubject = new Subject<void>();
  private logSub?: Subscription;

  constructor(
    public authService: AuthService,
    private historyService: HistoryService,
    private quantityService: QuantityService,
  ) {}

  ngOnInit(): void {
    this.logSub = this.logSubject.pipe(debounceTime(1000)).subscribe(() => this.pushLogToBackend());
  }

  ngOnDestroy(): void {
    this.logSub?.unsubscribe();
  }

  showLogoutConfirm(): void {
    this.showLogoutDialog = true;
  }

  confirmLogout(): void {
    this.authService.logout();
    this.showLogoutDialog = false;
  }

  cancelLogout(): void {
    this.showLogoutDialog = false;
  }

  actions = ['Comparison', 'Conversion', 'Arithmetic'];

  unitMap: UnitMap = {
    length: ['Kilometer', 'Meters', 'Centimeter', 'Millimeter', 'Mile', 'Yard', 'Foot', 'Inch'],
    weight: ['Kilogram', 'Gram', 'Milligram', 'Pound', 'Ounce'],
    temperature: ['Celsius', 'Fahrenheit', 'Kelvin'],
    volume: ['Liter', 'Milliliter', 'Gallon', 'Cup'],
  };

  conversionFactors: { [key: string]: { [unit: string]: number } } = {
    length: {
      Kilometer: 1000,
      Meters: 1,
      Centimeter: 0.01,
      Millimeter: 0.001,
      Mile: 1609.34,
      Yard: 0.9144,
      Foot: 0.3048,
      Inch: 0.0254,
    },
    weight: { Kilogram: 1000, Gram: 1, Milligram: 0.001, Pound: 453.592, Ounce: 28.3495 },
    volume: { Liter: 1000, Milliliter: 1, Gallon: 3785.41, Cup: 236.588 },
  };

  selectedType = 'length';
  selectedAction = 'Comparison';
  fromValue = 1;
  toValue = 1000;
  fromUnit = 'Kilometer';
  toUnit = 'Meters';

  // Comparison
  toCompareValue = 500;
  comparisonSymbol = '>';
  comparisonText = 'Greater Than';

  // Arithmetic
  arithmeticOp = 'add';
  arithmeticVal1 = 0;
  arithmeticVal2 = 0;
  arithmeticUnit = 'Meters';
  arithmeticResult = 0;

  get units(): string[] {
    return this.unitMap[this.selectedType] || [];
  }

  selectType(typeId: string): void {
    this.selectedType = typeId;
    const units = this.units;
    this.fromUnit = units[0] || '';
    this.toUnit = units[1] || units[0] || '';
    this.arithmeticUnit = units[0] || '';
    this.recalculate();
  }

  selectAction(action: string): void {
    this.selectedAction = action;
    this.recalculate();
  }

  recalculate(): void {
    if (this.selectedAction === 'Comparison') {
      this.compareBackend();
    } else if (this.selectedAction === 'Conversion') {
      this.convertBackend();
    } else if (this.selectedAction === 'Arithmetic') {
      this.calculateArithmeticBackend();
    }

    if (this.authService.isLoggedIn()) {
      this.logSubject.next();
    }
  }

  private buildComparisonPayload(): QuantityInputDTO {
    return {
      thisQuantityDTO: { value: this.fromValue, unit: this.fromUnit },
      thatQuantityDTO: { value: this.toCompareValue, unit: this.toUnit },
    };
  }

  private buildArithmeticPayload(): QuantityInputDTO {
    return {
      thisQuantityDTO: { value: this.arithmeticVal1, unit: this.arithmeticUnit },
      thatQuantityDTO: { value: this.arithmeticVal2, unit: this.arithmeticUnit },
    };
  }

  private compareBackend(): void {
    this.quantityService.compare(this.buildComparisonPayload()).subscribe({
      next: (result) => {
        if (result) {
          this.comparisonSymbol = '=';
          this.comparisonText = 'Equal To';
        } else {
          this.compare();
        }
      },
      error: (err) => {
        console.error('Compare request failed', err);
        this.compare();
      },
    });
  }

  private convertBackend(): void {
    this.quantityService
      .convert({ value: this.fromValue, unit: this.fromUnit }, this.toUnit)
      .subscribe({
        next: (response) => {
          this.toValue = response?.value ?? this.toValue;
        },
        error: (err) => {
          console.error('Convert request failed', err);
          this.convert();
        },
      });
  }

  private calculateArithmeticBackend(): void {
    const payload = this.buildArithmeticPayload();

    if (this.arithmeticOp === 'multiply') {
      this.calculateArithmetic();
      return;
    }

    let request$: Observable<number | QuantityDTO>;

    if (this.arithmeticOp === 'add') {
      request$ = this.quantityService.add(payload);
    } else if (this.arithmeticOp === 'subtract') {
      request$ = this.quantityService.subtract(payload);
    } else {
      request$ = this.quantityService.divide(payload);
    }

    request$.subscribe({
      next: (response) => {
        if (typeof response === 'number') {
          this.arithmeticResult = response;
        } else {
          this.arithmeticResult = response?.value ?? this.arithmeticResult;
        }
      },
      error: (err) => {
        console.error('Arithmetic request failed', err);
        this.calculateArithmetic();
      },
    });
  }

  private pushLogToBackend(): void {
    let payload: any = { operation: this.selectedAction.toUpperCase() };

    if (this.selectedAction === 'Conversion') {
      payload.operand1 = `${this.fromValue} ${this.fromUnit}`;
      payload.result = `${this.toValue} ${this.toUnit}`;
    } else if (this.selectedAction === 'Comparison') {
      payload.operand1 = `${this.fromValue} ${this.fromUnit}`;
      payload.operand2 = `${this.toCompareValue} ${this.toUnit}`;
      payload.result = `${this.comparisonSymbol} (${this.comparisonText})`;
    } else if (this.selectedAction === 'Arithmetic') {
      const opSign =
        this.arithmeticOp === 'add'
          ? '+'
          : this.arithmeticOp === 'subtract'
            ? '-'
            : this.arithmeticOp === 'multiply'
              ? '×'
              : '÷';
      payload.operation = this.arithmeticOp.toUpperCase();
      payload.operand1 = `${this.arithmeticVal1} ${this.arithmeticUnit}`;
      payload.operand2 = `${this.arithmeticVal2} ${this.arithmeticUnit}`;
      payload.result = `${this.arithmeticResult} ${this.arithmeticUnit}`;
    }

    this.historyService.logOperation(payload).subscribe({
      error: (e) => console.error('Failed to log operation', e),
    });
  }

  convert(): void {
    if (this.selectedType === 'temperature') {
      this.toValue = this.convertTemperature(this.fromValue, this.fromUnit, this.toUnit);
    } else {
      const factors = this.conversionFactors[this.selectedType];
      if (factors && factors[this.fromUnit] && factors[this.toUnit]) {
        const inBase = this.fromValue * factors[this.fromUnit];
        this.toValue = Math.round((inBase / factors[this.toUnit]) * 10000) / 10000;
      }
    }
  }

  onFromValueChange(): void {
    this.recalculate();
  }

  onUnitChange(): void {
    this.recalculate();
  }

  compare(): void {
    let fromInBase: number;
    let toInBase: number;

    if (this.selectedType === 'temperature') {
      fromInBase = this.toCelsius(this.fromValue, this.fromUnit);
      toInBase = this.toCelsius(this.toCompareValue, this.toUnit);
    } else {
      const factors = this.conversionFactors[this.selectedType];
      if (!factors) return;
      fromInBase = this.fromValue * (factors[this.fromUnit] || 1);
      toInBase = this.toCompareValue * (factors[this.toUnit] || 1);
    }

    if (Math.abs(fromInBase - toInBase) < 1e-9) {
      this.comparisonSymbol = '=';
      this.comparisonText = 'Equal To';
    } else if (fromInBase > toInBase) {
      this.comparisonSymbol = '>';
      this.comparisonText = 'Greater Than';
    } else {
      this.comparisonSymbol = '<';
      this.comparisonText = 'Less Than';
    }
  }

  onCompareValueChange(): void {
    this.recalculate();
  }

  calculateArithmetic(): void {
    const v1 = this.arithmeticVal1;
    const v2 = this.arithmeticVal2;
    switch (this.arithmeticOp) {
      case 'add':
        this.arithmeticResult = Math.round((v1 + v2) * 10000) / 10000;
        break;
      case 'subtract':
        this.arithmeticResult = Math.round((v1 - v2) * 10000) / 10000;
        break;
      case 'multiply':
        this.arithmeticResult = Math.round(v1 * v2 * 10000) / 10000;
        break;
      case 'divide':
        this.arithmeticResult = v2 !== 0 ? Math.round((v1 / v2) * 10000) / 10000 : 0;
        break;
    }
  }

  onArithmeticChange(): void {
    this.calculateArithmetic();
  }

  private toCelsius(value: number, unit: string): number {
    if (unit === 'Celsius') return value;
    if (unit === 'Fahrenheit') return ((value - 32) * 5) / 9;
    return value - 273.15;
  }

  private convertTemperature(value: number, from: string, to: string): number {
    const celsius = this.toCelsius(value, from);
    if (to === 'Celsius') return Math.round(celsius * 100) / 100;
    if (to === 'Fahrenheit') return Math.round(((celsius * 9) / 5 + 32) * 100) / 100;
    return Math.round((celsius + 273.15) * 100) / 100;
  }
}
