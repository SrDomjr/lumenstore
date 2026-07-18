import { Pipe, PipeTransform, Inject, InjectionToken, inject } from '@angular/core';

/**
 * Injection token para configurar el cloud_name de Cloudinary.
 * Se provee desde {@code app.config.ts} o {@code main.ts}.
 *
 * @example
 * ```typescript
 * providers: [
 *   { provide: CLOUDINARY_CLOUD_NAME, useValue: 'mi-cloud-name' }
 * ]
 * ```
 */
export const CLOUDINARY_CLOUD_NAME = new InjectionToken<string>('cloudinary.cloudName');

/**
 * Pipe que construye una URL optimizada de Cloudinary a partir de un
 * {@code public_id} almacenado en la base de datos.
 * <p>
 * La columna {@code image_url} de la tabla {@code product_images} almacena
 * ÚNICAMENTE el {@code public_id} (ej: {@code lumenstore/products/12/34/5_main}).
 * Este pipe construye la URL completa de Cloudinary con transformaciones
 * al vuelo para optimizar la entrega.
 * <p>
 * Transformaciones aplicadas:
 * <ul>
 *   <li>{@code f_auto} — formato automático (WebP/AVIF según el navegador)</li>
 *   <li>{@code q_auto} — compresión inteligente sin pérdida visible</li>
 *   <li>{@code w_XXX} — ancho específico para imágenes responsive</li>
 *   <li>{@code c_thumb,g_auto} — recorte inteligente basado en IA</li>
 * </ul>
 * <p>
 * Uso en plantillas:
 * <pre>
 *   {{ publicId | cloudinaryUrl }}
 *   {{ publicId | cloudinaryUrl:300 }}
 *   {{ publicId | cloudinaryUrl:800:'thumb' }}
 * </pre>
 * <p>
 * Si el valor ya es una URL completa (no de Cloudinary), se devuelve sin cambios.
 */
@Pipe({
  name: 'cloudinaryUrl',
  standalone: true,
})
export class CloudinaryUrlPipe implements PipeTransform {
  private readonly cloudName: string;

  constructor(@Inject(CLOUDINARY_CLOUD_NAME) cloudName: string) {
    this.cloudName = cloudName;
  }

  /**
   * Transforma un public_id de Cloudinary en una URL optimizada.
   *
   * @param value  public_id de Cloudinary (ej: "lumenstore/products/12/34/5_main")
   *               o URL completa (se devuelve sin cambios si no es de Cloudinary)
   * @param width  Ancho deseado en píxeles (opcional)
   * @param crop   Tipo de recorte: 'thumb' | 'scale' | 'fit' | 'fill' (opcional)
   * @return       URL completa de Cloudinary con transformaciones
   */
  transform(value: string | null | undefined, width?: number, crop?: string): string {
    if (!value) return '';

    // Si el valor ya es una URL completa HTTP, verificar si es de Cloudinary
    if (value.startsWith('http://') || value.startsWith('https://')) {
      // Si es de Cloudinary, extraer el public_id y reconstruir
      const cloudinaryMatch = value.match(
        /https?:\/\/res\.cloudinary\.com\/[\w-]+\/image\/upload\/(?:v\d+\/)?(.+)$/,
      );
      if (cloudinaryMatch) {
        // Extraer el public_id (sin extensión)
        let publicId = cloudinaryMatch[1];
        const extDot = publicId.lastIndexOf('.');
        if (extDot !== -1) {
          publicId = publicId.substring(0, extDot);
        }
        return this.buildCloudinaryUrl(publicId, width, crop);
      }
      // No es Cloudinary, devolver tal cual
      return value;
    }

    // Es un public_id de Cloudinary → construir URL
    return this.buildCloudinaryUrl(value, width, crop);
  }

  /**
   * Construye la URL completa de Cloudinary con transformaciones.
   */
  private buildCloudinaryUrl(publicId: string, width?: number, crop?: string): string {
    const baseUrl = `https://res.cloudinary.com/${this.cloudName}/image/upload`;
    const transformations: string[] = ['f_auto', 'q_auto'];

    if (width && width > 0) {
      transformations.push(`w_${width}`);
      const cropMode = crop || 'scale';
      transformations.push(`c_${cropMode}`);

      if (cropMode === 'thumb') {
        transformations.push('g_auto'); // recorte inteligente con IA
      }
    }

    const transformStr = transformations.join(',');

    return `${baseUrl}/${transformStr}/${publicId}`;
  }
}
