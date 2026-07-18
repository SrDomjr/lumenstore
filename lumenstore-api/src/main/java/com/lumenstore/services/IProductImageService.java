package com.lumenstore.services;

import com.lumenstore.dto.ProductImageResponseDTO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

/**
 * Interfaz que abstrae la gestión de imágenes de producto.
 * <p>
 * Dos implementaciones:
 * <ul>
 *   <li>{@link CloudinaryProductImageService} — cuando {@code cloudinary.enabled=true}</li>
 *   <li>{@link LocalProductImageService} — cuando {@code cloudinary.enabled=false} (default)</li>
 * </ul>
 * El controlador siempre recibe una implementación válida, evitando
 * {@code NoSuchBeanDefinitionException}.
 */
public interface IProductImageService {

    /**
     * Sube una imagen y persiste el registro en BD.
     *
     * @param productId ID del producto
     * @param variantId ID opcional de la variante
     * @param file      archivo multipart
     * @param altText   texto alternativo
     * @param isMain    si es imagen principal
     * @return DTO con los datos persistidos
     */
    ProductImageResponseDTO upload(Long productId, Optional<Long> variantId,
                                   MultipartFile file, String altText, boolean isMain);

    /**
     * Elimina una imagen del almacenamiento y de BD.
     *
     * @param imageId ID del registro de imagen
     */
    void delete(Long imageId);

    /**
     * Obtiene todas las imágenes de un producto ordenadas por sort_order.
     */
    List<ProductImageResponseDTO> getImagesByProduct(Long productId);

    /**
     * Marca una imagen como principal (desmarca las demás).
     */
    void setMainImage(Long productId, Long imageId);

    /**
     * Limpia registros huérfanos de imágenes que no pertenecen a Cloudinary
     * (ej: URLs locales de migraciones previas).
     * <p>
     * En una migración real de almacenamiento local → Cloudinary, este método
     * debería subir las imágenes locales a Cloudinary y actualizar los registros.
     * Si los archivos locales ya no existen, simplemente elimina los registros
     * huérfanos.
     *
     * @return número de registros eliminados
     */
    int cleanupOrphanedImages();
}