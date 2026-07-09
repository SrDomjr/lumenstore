import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { RegisterRequest } from '../../models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
})
export class RegisterComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitted = false;
  error = '';

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private notification: NotificationService,
  ) {}

  ngOnInit() {
    this.form = this.formBuilder.group(
      {
        username: ['', [Validators.required, Validators.minLength(4)]],
        firstName: ['', Validators.required],
        lastName: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
      },
      { validators: this.passwordMatchValidator },
    );
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { mismatch: true };
  }

  get f() {
    return this.form.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';
    this.loading = true;

    if (this.form.invalid) {
      this.loading = false;
      return;
    }

    const registerRequest: RegisterRequest = {
      username: this.form.value.username,
      email: this.form.value.email,
      password: this.form.value.password,
      customerProfile: {
        firstName: this.form.value.firstName,
        lastName: this.form.value.lastName,
      },
    };

    this.authService
      .register(registerRequest)
      .pipe(
        finalize(() => {
          this.loading = false;
        }),
      )
      .subscribe({
        next: () => {
          this.notification.success('Registro exitoso', 'Tu cuenta ha sido creada correctamente');
          this.router.navigate(['/home']).then((success) => {
            if (!success) {
              this.error = 'Unable to navigate after registration. Please try again.';
            }
          });
        },
        error: (error) => {
          console.error('Registration error', error);
          this.error =
            error.error?.message || error.message || 'Registration failed. Please try again.';
          this.notification.error(this.error, 'Error de registro');
        },
      });
  }
}
