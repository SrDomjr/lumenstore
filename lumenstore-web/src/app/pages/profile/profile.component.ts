import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent {
  user: any = this.getCurrentUser();
  profileForm: FormGroup;
  saved = false;

  constructor(private fb: FormBuilder) {
    this.profileForm = this.fb.group({
      firstName: [this.user?.firstName || '', Validators.required],
      lastName: [this.user?.lastName || '', Validators.required],
      email: [this.user?.email || '', [Validators.required, Validators.email]],
    });
  }

  private getCurrentUser() {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  saveProfile() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const updated = {
      ...this.user,
      ...this.profileForm.value,
    };

    localStorage.setItem('currentUser', JSON.stringify(updated));
    this.user = updated;
    this.saved = true;
    setTimeout(() => (this.saved = false), 2500);
  }
}
