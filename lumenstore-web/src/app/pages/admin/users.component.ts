import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { API_URL } from '../../services/api.service';
import { AdminPageHeaderComponent } from '../../components/admin/admin-page-header.component';
import { AdminButtonComponent } from '../../components/admin/admin-button.component';
import { AdminBadgeComponent } from '../../components/admin/admin-badge.component';
import { AdminEmptyStateComponent } from '../../components/admin/admin-empty-state.component';
import { AdminSkeletonComponent } from '../../components/admin/admin-skeleton.component';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [
    CommonModule,
    AdminPageHeaderComponent,
    AdminButtonComponent,
    AdminBadgeComponent,
    AdminEmptyStateComponent,
    AdminSkeletonComponent,
  ],
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
