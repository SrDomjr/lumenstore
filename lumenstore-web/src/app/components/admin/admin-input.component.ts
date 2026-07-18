import { Component, Input, Output, EventEmitter, forwardRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-admin-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="admin-field">
      <label *ngIf="label" class="admin-label" [for]="inputId">{{ label }}</label>
      <input
        *ngIf="type !== 'textarea'"
        [id]="inputId"
        [type]="type"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [class.is-invalid]="!!error"
        class="admin-input"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
      />
      <textarea
        *ngIf="type === 'textarea'"
        [id]="inputId"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [class.is-invalid]="!!error"
        class="admin-textarea"
        [ngModel]="value"
        (ngModelChange)="onValueChange($event)"
      ></textarea>
      <span *ngIf="error" class="admin-field-error">{{ error }}</span>
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AdminInputComponent),
      multi: true,
    },
  ],
})
export class AdminInputComponent implements ControlValueAccessor {
  @Input() label = '';
  @Input() type = 'text';
  @Input() placeholder = '';
  @Input() disabled = false;
  @Input() error = '';
  @Input() inputId = `admin-input-${Math.random().toString(36).slice(2, 8)}`;

  @Output() valueChange = new EventEmitter<string>();

  value = '';

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: string): void {
    this.value = val ?? '';
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onValueChange(val: string): void {
    this.value = val;
    this.onChange(val);
    this.valueChange.emit(val);
  }
}
