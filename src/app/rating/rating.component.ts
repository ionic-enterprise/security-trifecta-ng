import { CommonModule } from '@angular/common';
import { Component, forwardRef, Input, HostBinding } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => RatingComponent),
      multi: true,
    },
  ],
  standalone: true,
  imports: [CommonModule, IonicModule],
})
export class RatingComponent implements ControlValueAccessor {
  @Input() rating: number;
  @Input() disabled = false;

  constructor() {}

  @HostBinding('style.opacity')
  get opacity(): number {
    return this.disabled ? 0.25 : 1;
  }

  onChange = (_rating: number) => {};

  onTouched = () => {};

  writeValue(rating: number): void {
    this.rating = rating;
    this.onChange(rating);
  }

  registerOnChange(fn: (rating: number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  ratingClicked(rating: number): void {
    if (!this.disabled) {
      this.writeValue(rating);
    }
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }
}
