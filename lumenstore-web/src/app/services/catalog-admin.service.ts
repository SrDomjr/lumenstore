import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

export interface CategoryDTO {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive?: boolean;
}

export interface BrandDTO {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logoUrl?: string;
  isActive?: boolean;
}

export interface ColorDTO {
  id: number;
  name: string;
  hexCode: string;
}

export interface SizeDTO {
  id: number;
  name: string;
}

@Injectable({
  providedIn: 'root',
})
export class CatalogAdminService extends ApiService {
  // ─── Categories ───────────────────────────────────────────────

  getCategories(): Observable<CategoryDTO[]> {
    return this.get<CategoryDTO[]>('/admin/catalog/categories');
  }

  createCategory(payload: {
    name: string;
    description?: string;
    imageUrl?: string;
  }): Observable<CategoryDTO> {
    return this.post<CategoryDTO>('/admin/catalog/categories', payload);
  }

  updateCategory(
    id: number,
    payload: { name?: string; description?: string; imageUrl?: string },
  ): Observable<CategoryDTO> {
    return this.put<CategoryDTO>(`/admin/catalog/categories/${id}`, payload);
  }

  deleteCategory(id: number): Observable<void> {
    return this.delete<void>(`/admin/catalog/categories/${id}`);
  }

  // ─── Brands ───────────────────────────────────────────────────

  getBrands(): Observable<BrandDTO[]> {
    return this.get<BrandDTO[]>('/admin/catalog/brands');
  }

  createBrand(payload: {
    name: string;
    description?: string;
    logoUrl?: string;
  }): Observable<BrandDTO> {
    return this.post<BrandDTO>('/admin/catalog/brands', payload);
  }

  updateBrand(
    id: number,
    payload: { name?: string; description?: string; logoUrl?: string },
  ): Observable<BrandDTO> {
    return this.put<BrandDTO>(`/admin/catalog/brands/${id}`, payload);
  }

  deleteBrand(id: number): Observable<void> {
    return this.delete<void>(`/admin/catalog/brands/${id}`);
  }

  // ─── Colors ───────────────────────────────────────────────────

  getColors(): Observable<ColorDTO[]> {
    return this.get<ColorDTO[]>('/admin/catalog/colors');
  }

  createColor(payload: { name: string; hexCode: string }): Observable<ColorDTO> {
    return this.post<ColorDTO>('/admin/catalog/colors', payload);
  }

  updateColor(id: number, payload: { name?: string; hexCode?: string }): Observable<ColorDTO> {
    return this.put<ColorDTO>(`/admin/catalog/colors/${id}`, payload);
  }

  deleteColor(id: number): Observable<void> {
    return this.delete<void>(`/admin/catalog/colors/${id}`);
  }

  // ─── Sizes ────────────────────────────────────────────────────

  getSizes(): Observable<SizeDTO[]> {
    return this.get<SizeDTO[]>('/admin/catalog/sizes');
  }

  createSize(payload: { name: string; productType?: string }): Observable<SizeDTO> {
    return this.post<SizeDTO>('/admin/catalog/sizes', payload);
  }

  updateSize(id: number, payload: { name?: string; productType?: string }): Observable<SizeDTO> {
    return this.put<SizeDTO>(`/admin/catalog/sizes/${id}`, payload);
  }

  deleteSize(id: number): Observable<void> {
    return this.delete<void>(`/admin/catalog/sizes/${id}`);
  }

  // ─── Quick-create (for contextual modals) ─────────────────────

  quickCreateBrand(name: string): Observable<BrandDTO> {
    return this.createBrand({ name });
  }

  quickCreateCategory(name: string): Observable<CategoryDTO> {
    return this.createCategory({ name });
  }

  quickCreateColor(name: string, hexCode: string): Observable<ColorDTO> {
    return this.createColor({ name, hexCode });
  }

  quickCreateSize(name: string, productType?: string): Observable<SizeDTO> {
    return this.createSize({ name, productType });
  }
}
