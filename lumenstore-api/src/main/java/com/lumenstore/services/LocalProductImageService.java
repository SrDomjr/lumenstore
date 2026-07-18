package com.lumenstore.services;

import com.lumenstore.dto.ProductImageResponseDTO;
import com.lumenstore.exception.ResourceNotFoundException;
import com.lumenstore.models.ProductImage;
import com.lumenstore.models.Producto;
import com.lumenstore.models.ProductVariant;
import com.lumenstore.repository.IProductImageRepository;
import com.lumenstore.repository.IProductoRepository;
import com.lumenstore.repository.IProductVariantRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

/**
 * Implementación de {@link IProductImageService} que almacena imágenes
 * en el sistema de archivos local.
 * <p>
 * Se registra como bean por defecto cuando {@code cloudinary.enabled=false}
 * (es decir, cuando NO existe un bean de {@link com.cloudinary.Cloudinary}).
 * <p>
 * Esta implementación delega en {@link FileStorageService} para el almacenamiento
 * físico y en {@link IProductImageRepository} para la persistencia en BD.
 */
@Slf4j
@Service
@ConditionalOnMissingBean(com.cloudinary.Cloudinary.class)
public class LocalProductImageService implements IProductImageService {

    private final FileStorageService fileStorageService;
    private final IProductImageRepository productImageRepository;
    private final IProductoRepository productoRepository;
    private final IProductVariantRepository productVariantRepository;

    public LocalProductImageService(
            FileStorageService fileStorageService,
            IProductImageRepository productImageRepository,
            IProductoRepository productoRepository,
            IProductVariantRepository productVariantRepository) {
        this.fileStorageService = fileStorageService;
        this.productImageRepository = productImageRepository;
        this.productoRepository = productoRepository;
        this.productVariantRepository = productVariantRepository;
    }

    @Override
    @Transactional
    public ProductImageResponseDTO upload(
            Long productId,
            Optional<Long> variantId,
            MultipartFile file,
            String altText,
            boolean isMain) {

        // 1. Validar que el producto exista
        Producto product = productoRepository.findById(productId)
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", productId));

        // 2. Validar variante si se proporcionó
        ProductVariant variant = null;
        if (variantId.isPresent()) {
            variant = productVariantRepository.findById(variantId.get())
                    .orElseThrow(() -> ResourceNotFoundException.of("Variante", variantId.get()));
        }

        // 3. Construir subcarpeta local con segmentación del ID
        String idStr = String.format("%08d", productId);
        String subFolder = "products/" + idStr.substring(0, 2) + "/" + idStr.substring(2, 4);

        // 4. Almacenar localmente (FileStorageService retorna la URL/ruta local)
        String imageUrl = fileStorageService.store(file, subFolder);

        // 5. Gestionar imagen principal
        if (isMain) {
            desmarcarMainImages(productId);
        } else {
            boolean hasMain = !productImageRepository
                    .findByProductIdAndIsMainTrue(productId).isEmpty();
            if (!hasMain) {
                isMain = true;
            }
        }

        // 6. Determinar sort_order
        int sortOrder = productImageRepository.findByProductId(productId).size();

        // 7. Persistir en BD
        ProductImage image = ProductImage.builder()
                .product(product)
                .variant(variant)
                .imageUrl(imageUrl)
                .altText(altText != null ? altText : "")
                .sortOrder(sortOrder)
                .isMain(isMain)
                .build();

        image = productImageRepository.save(image);

        log.debug("Imagen almacenada localmente: id={}, url={}", image.getId(), imageUrl);

        return toDTO(image);
    }

    @Override
    @Transactional
    public void delete(Long imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> ResourceNotFoundException.of("Imagen", imageId));

        // 1. Eliminar archivo local
        String publicId = fileStorageService.extractPublicId(image.getImageUrl());
        if (publicId != null) {
            fileStorageService.delete(publicId);
        }

        // 2. Eliminar de BD
        productImageRepository.delete(image);
        log.debug("Imagen eliminada de BD: id={}", imageId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductImageResponseDTO> getImagesByProduct(Long productId) {
        return productImageRepository.findByProductIdOrderBySortOrderAsc(productId)
                .stream()
                .map(this::toDTO)
                .toList();
    }

    @Override
    @Transactional
    public void setMainImage(Long productId, Long imageId) {
        desmarcarMainImages(productId);

        ProductImage newMain = productImageRepository.findById(imageId)
                .orElseThrow(() -> ResourceNotFoundException.of("Imagen", imageId));
        newMain.setIsMain(true);
        productImageRepository.save(newMain);
    }

    // ─── Privados ───────────────────────────────────────────────

    private void desmarcarMainImages(Long productId) {
        List<ProductImage> currentMain = productImageRepository
                .findByProductIdAndIsMainTrue(productId);
        currentMain.forEach(img -> img.setIsMain(false));
        productImageRepository.saveAll(currentMain);
    }
    @Override
    public int cleanupOrphanedImages() {
        // En modo local no hay concepto de imágenes huérfanas
        log.debug("cleanupOrphanedImages() no aplica para almacenamiento local.");
        return 0;
    }

    private ProductImageResponseDTO toDTO(ProductImage image) {
        return ProductImageResponseDTO.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .altText(image.getAltText())
                .sortOrder(image.getSortOrder())
                .isMain(image.getIsMain())
                .variantId(image.getVariant() != null ? image.getVariant().getId() : null)
                .build();
    }
}