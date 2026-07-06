import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService, API_URL } from './api.service';
import { LoginRequest, RegisterRequest, AuthResponse, Usuario } from '../models';

@Injectable({
  providedIn: 'root',
})
export class AuthService extends ApiService {
  private currentUserSubject: BehaviorSubject<AuthResponse | null>;
  public currentUser$: Observable<AuthResponse | null>;

  private tokenSubject: BehaviorSubject<string | null>;
  public token$: Observable<string | null>;

  constructor(http: HttpClient) {
    super(http);
    const storedUser = localStorage.getItem('currentUser');
    const storedToken = localStorage.getItem('token');

    this.currentUserSubject = new BehaviorSubject<AuthResponse | null>(
      storedUser ? JSON.parse(storedUser) : null,
    );
    this.currentUser$ = this.currentUserSubject.asObservable();

    this.tokenSubject = new BehaviorSubject<string | null>(storedToken);
    this.token$ = this.tokenSubject.asObservable();
  }

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/login', credentials).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.tokenSubject.next(response.token);
          this.currentUserSubject.next(response);
        }
      }),
    );
  }

  register(request: RegisterRequest): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/register', request).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.tokenSubject.next(response.token);
          this.currentUserSubject.next(response);
        }
      }),
    );
  }

  logout(): void {
    // Clear local state immediately
    const token = this.getToken();
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.tokenSubject.next(null);
    this.currentUserSubject.next(null);

    // Notify server to clear session (best-effort, do not block)
    try {
      this.post('/auth/logout', {}).subscribe({ next: () => {}, error: () => {} });
    } catch (e) {
      // ignore
    }
  }

  // Returns observable to allow waiting for server to confirm logout if needed
  logoutServer(): Observable<any> {
    return this.post('/auth/logout', {});
  }

  getToken(): string | null {
    return this.tokenSubject.value;
  }

  getCurrentUser(): AuthResponse | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  refreshToken(refreshToken: string): Observable<AuthResponse> {
    return this.post<AuthResponse>('/auth/refresh', { refreshToken }).pipe(
      tap((response) => {
        if (response && response.token) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response));
          this.tokenSubject.next(response.token);
          this.currentUserSubject.next(response);
        }
      }),
    );
  }

  getLoginHistory(): Observable<any[]> {
    return this.get<any[]>('/auth/login-history');
  }
}
