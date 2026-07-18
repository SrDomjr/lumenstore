import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

export interface SelectOption {
  label: string;
  value: any;
}

@Component({
  selector: 'app-admin-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-field">
      <label *ngIf="label" class="admin-label" [for]="selectId">{{ label }}</label>
      <select
        [id]="selectId"
        [disabled]="disabled"
        class="admin-select"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
      >
        <option *ngIf="placeholder" value="" disabled selected>{{ placeholder }}</option>
        <option *ngFor="let opt of options" [ngValue]="opt.value">{{ opt.label }}</option>
      </select>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AdminSelectComponent),
      multi: true,
    },
  ],
})
export class AdminSelectComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() options: SelectOption[] = [];
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() selectId = `admin-select-${Math.random().toString(36).slice(2, 8)}`;

  @Output() valueChange = new EventEmitter<any>();

  value: any = '';

  private onChange: (value: any) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    this.value = val ?? '';
  }

  registerOnChange(fn: (value: any) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(val: any): void {
    this.value = val;
    this.onChange(val);
    this.valueChange.emit(val);
  }
}
