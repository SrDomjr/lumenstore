import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../services/api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './users.component.html',
  styleUrls: ['./users.component.scss'],
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.http.get(`${API_URL}/admin/users`).subscribe({
      next: (resp: any) => {
        this.users = resp?.content || resp || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('[AdminUsers] Error:', err);
        this.error = 'No se pudieron cargar los usuarios.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
