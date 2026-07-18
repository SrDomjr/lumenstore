import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';

export interface CategoryTree {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
  parentId?: number;
  sortOrder?: number;
  children?: CategoryTree[];
}

export interface Banner {
  id: number;
  title: string;
  subtitle?: string;
  imageUrl: string;
  linkUrl?: string;
  position: string;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  sortOrder: number;
}

export interface StoreSettings {
  [key: string]: string;
}

@Injectable({ providedIn: 'root' })
export class StoreInfoService extends ApiService {

  getCategoryTree(): Observable<CategoryTree[]> {
    return this.get<CategoryTree[]>('/categories/tree');
  }

  getBanners(): Observable<Banner[]> {
    return this.get<Banner[]>('/banners');
  }

  getBannersByPosition(position: string): Observable<Banner[]> {
    return this.get<Banner[]>(`/banners/${position}`);
  }

  getSettings(): Observable<StoreSettings> {
    return this.get<StoreSettings>('/settings');
  }

  getSetting(key: string): Observable<string> {
    return this.get<string>(`/settings/${key}`);
  }

  subscribeNewsletter(email: string): Observable<{ message: string }> {
    return this.post<{ message: string }>('/newsletter/subscribe', { email });
  }
}
