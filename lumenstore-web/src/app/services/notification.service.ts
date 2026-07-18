import { Injectable, inject } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import Swal from 'sweetalert2';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ConfirmOptions {
  title?: string;
  text?: string;
  icon?: 'warning' | 'question' | 'info' | 'error' | 'success';
  confirmButtonText?: string;
  cancelButtonText?: string;
  showCancelButton?: boolean;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private readonly toastr = inject(ToastrService);

  // ──────────────────────────────────────────────
  //  ngx-toastr: notificaciones rápidas y ligeras
  // ──────────────────────────────────────────────

  toast(type: ToastType, message: string, title?: string, options?: Partial<any>): void {
    switch (type) {
      case 'success':
        this.toastr.success(message, title ?? 'Éxito', options);
        break;
      case 'error':
        this.toastr.error(message, title ?? 'Error', options);
        break;
      case 'info':
        this.toastr.info(message, title ?? 'Información', options);
        break;
      case 'warning':
        this.toastr.warning(message, title ?? 'Advertencia', options);
        break;
    }
  }

  success(message: string, title?: string): void {
    this.toast('success', message, title);
  }

  error(message: string, title?: string): void {
    this.toast('error', message, title);
  }

  info(message: string, title?: string): void {
    this.toast('info', message, title);
  }

  warning(message: string, title?: string): void {
    this.toast('warning', message, title);
  }

  /**
   * Extrae un mensaje legible desde un error HTTP del backend (ErrorResponseDTO).
   * Si el backend no envió un mensaje específico (ej. caída de red), usa el fallback.
   */
  extractErrorMessage(err: any, fallback: string): string {
    const backendMessage = err?.error?.message;
    const fieldErrors = err?.error?.fieldErrors;
    if (fieldErrors && Array.isArray(fieldErrors) && fieldErrors.length > 0) {
      return fieldErrors.map((f: any) => f.message).join(' · ');
    }
    return backendMessage || fallback;
  }

  /** Muestra un toast de error tomando el mensaje específico del backend cuando existe. */
  apiError(err: any, fallback: string, title?: string): void {
    this.error(this.extractErrorMessage(err, fallback), title);
  }

  // ──────────────────────────────────────────────
  //  SweetAlert2: diálogos que requieren atención
  // ──────────────────────────────────────────────

  alert(title: string, text?: string, icon?: ConfirmOptions['icon']): Promise<void> {
    return Swal.fire({
      title,
      text,
      icon: icon ?? 'info',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#667eea',
    }).then(() => void 0);
  }

  confirm(options: ConfirmOptions): Promise<boolean> {
    return Swal.fire({
      title: options.title ?? '¿Estás seguro?',
      text: options.text,
      icon: options.icon ?? 'question',
      showCancelButton: options.showCancelButton ?? true,
      confirmButtonText: options.confirmButtonText ?? 'Sí, confirmar',
      cancelButtonText: options.cancelButtonText ?? 'Cancelar',
      confirmButtonColor: '#667eea',
      cancelButtonColor: '#dc3545',
      reverseButtons: true,
    }).then((result) => result.isConfirmed);
  }

  /** Atajo para confirmar una acción de eliminación */
  confirmDelete(entityName?: string): Promise<boolean> {
    return this.confirm({
      title: '¿Eliminar?',
      text: entityName
        ? `Esta acción eliminará "${entityName}" de forma permanente.`
        : 'Esta acción no se puede deshacer.',
      icon: 'warning',
      confirmButtonText: 'Sí, eliminar',
    });
  }
}
