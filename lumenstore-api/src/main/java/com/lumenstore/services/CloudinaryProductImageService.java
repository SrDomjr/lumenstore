package com.lumenstore.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.lumenstore.dto.ProductImageResponseDTO;
import com.lumenstore.exception.FileStorageException;
import com.lumenstore.exception.ResourceNotFoundException;
import com.lumenstore.models.ProductImage;
import com.lumenstore.models.Producto;
import com.lumenstore.models.ProductVariant;
import com.lumenstore.repository.IProductImageRepository;
import com.lumenstore.repository.IProductoRepository;
import com.lumenstore.repository.IProductVariantRepository;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Implementación de {@link IProductImageService} que almacena imágenes en
 * Cloudinary.
 * <p>
 * Solo se registra como bean si {@code cloudinary.enabled=true} (el bean
 * {@link Cloudinary} debe existir en el contexto).
 * <p>
 * Estructura de carpetas en Cloudinary (segmentación del ID):
 * 
 * <pre>
 *   Producto ID 12345 → folder: "lumenstore/products/12/34/"
 *                        public_id: "5_main" o "5_variant_99"
 *   Producto ID 7    → folder: "lumenstore/products/00/00/"
 *                        public_id: "7_main"
 * </pre>
 */
@Slf4j
@Service
@ConditionalOnBean(Cloudinary.class)
public class CloudinaryProductImageService implements IProductImageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of("image/jpeg", "image/png", "image/webp",
            "image/gif", "image/avif");

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB

    private static final String FOLDER_PREFIX = "lumenstore";

    private final Cloudinary cloudinary;
    private final IProductImageRepository productImageRepository;
    private final IProductoRepository productoRepository;
    private final IProductVariantRepository productVariantRepository;

    public CloudinaryProductImageService(
            Cloudinary cloudinary,
            IProductImageRepository productImageRepository,
            IProductoRepository productoRepository,
            IProductVariantRepository productVariantRepository) {
        this.cloudinary = cloudinary;
        this.productImageRepository = productImageRepository;
        this.productoRepository = productoRepository;
        this.productVariantRepository = productVariantRepository;
    }

    // ─── Subida ─────────────────────────────────────────────────

    @Override
    @Transactional
    public ProductImageResponseDTO upload(
            Long productId,
            Optional<Long> variantId,
            MultipartFile file,
            String altText,
            boolean isMain) {

        // 1. Validar archivo
        validateFile(file);

        // 2. Validar que el producto exista
        Producto product = productoRepository.findById(productId)
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", productId));

        // 3. Validar variante si se proporcionó
        ProductVariant variant = null;
        if (variantId.isPresent()) {
            variant = productVariantRepository.findById(variantId.get())
                    .orElseThrow(() -> ResourceNotFoundException.of("Variante", variantId.get()));
        }

        // 4. Construir folder y public_id con segmentación del ID
        String idStr = String.format("%08d", productId);
        String folder = FOLDER_PREFIX + "/products/"
                + idStr.substring(0, 2) + "/"
                + idStr.substring(2, 4);

        String publicId;
        String uniqueSuffix = "_" + java.util.UUID.randomUUID().toString().substring(0, 8);
        if (variant != null) {
            publicId = idStr.substring(4) + "_variant_" + variant.getId() + uniqueSuffix;
        } else {
            publicId = idStr.substring(4) + "_main" + uniqueSuffix;
        }

        // 5. Subir a Cloudinary
        String fullPublicId;
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folder,
                            "public_id", publicId,
                            "overwrite", false,
                            "resource_type", "image"));

            fullPublicId = (String) uploadResult.get("public_id");
            log.info("Imagen subida a Cloudinary: public_id={}", fullPublicId);
        } catch (IOException e) {
            throw new FileStorageException(
                    "No se pudo subir la imagen '" + file.getOriginalFilename() + "' a Cloudinary.", e);
        }

        // 6. Gestionar imagen principal
        if (isMain) {
            desmarcarMainImages(productId);
        } else {
            boolean hasMain = !productImageRepository
                    .findByProductIdAndIsMainTrue(productId).isEmpty();
            if (!hasMain) {
                isMain = true;
            }
        }

        // 7. Determinar sort_order
        int sortOrder = productImageRepository.findByProductId(productId).size();

        // 8. Persistir en BD (image_url = public_id de Cloudinary)
        ProductImage image = ProductImage.builder()
                .product(product)
                .variant(variant)
                .imageUrl(fullPublicId) // ← Solo el public_id
                .altText(altText != null ? altText : "")
                .sortOrder(sortOrder)
                .isMain(isMain)
                .build();

        image = productImageRepository.save(image);

        log.debug("Imagen persistida en BD: id={}, public_id={}", image.getId(), fullPublicId);

        return toDTO(image);
    }

    // ─── Eliminación ────────────────────────────────────────────

    @Override
    @Transactional
    public void delete(Long imageId) {
        ProductImage image = productImageRepository.findById(imageId)
                .orElseThrow(() -> ResourceNotFoundException.of("Imagen", imageId));

        String imageUrl = image.getImageUrl();

        // Solo intentar eliminar de Cloudinary si el valor es un public_id real
        // (no una URL local de almacenamiento antiguo)
        if (imageUrl != null && !imageUrl.startsWith("http://") && !imageUrl.startsWith("/uploads/")) {
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> result = cloudinary.uploader().destroy(imageUrl, ObjectUtils.emptyMap());
                String status = (String) result.get("result");
                log.info("Imagen eliminada de Cloudinary: public_id={}, resultado={}", imageUrl, status);
            } catch (IOException e) {
                log.error("Error al eliminar imagen de Cloudinary: public_id={}", imageUrl, e);
            }
        } else {
            log.debug("Imagen con URL local (no Cloudinary), se omite destrucción remota: {}", imageUrl);
        }

        // 2. Eliminar de BD
        productImageRepository.deleteById(imageId);
        log.debug("Imagen eliminada de BD: id={}", imageId);
    }

    // ─── Consultas ──────────────────────────────────────────────

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

    private ProductImageResponseDTO toDTO(ProductImage image) {
        return ProductImageResponseDTO.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl()) // ← public_id de Cloudinary
                .altText(image.getAltText())
                .sortOrder(image.getSortOrder())
                .isMain(image.getIsMain())
                .variantId(image.getVariant() != null ? image.getVariant().getId() : null)
                .build();
    }

    @Override
    @Transactional
    public int cleanupOrphanedImages() {
        // Buscar imágenes con URLs locales (no Cloudinary)
        // Patrón: empiezan con http://, https:// (que no sea res.cloudinary.com), o
        // /uploads/
        List<ProductImage> orphaned = productImageRepository.findAll().stream()
                .filter(img -> {
                    String url = img.getImageUrl();
                    if (url == null || url.isBlank())
                        return true;
                    // Es local si empieza con /uploads/ o es una URL HTTP que NO es de Cloudinary
                    return url.startsWith("/uploads/")
                            || (url.startsWith("http://") && !url.contains("res.cloudinary.com"))
                            || (url.startsWith("https://") && !url.contains("res.cloudinary.com"));
                })
                .toList();

        if (orphaned.isEmpty()) {
            log.info("No se encontraron imágenes huérfanas para limpiar.");
            return 0;
        }

        log.warn("Limpiando {} imágenes huérfanas (URLs locales sin archivo físico)...", orphaned.size());
        productImageRepository.deleteAll(orphaned);
        log.info("Limpieza completada: {} registros eliminados.", orphaned.size());
        return orphaned.size();
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("El archivo enviado está vacío.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("El archivo supera el tamaño máximo permitido (10 MB).");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new IllegalArgumentException(
                    "Tipo de archivo no permitido. Formatos aceptados: " + ALLOWED_CONTENT_TYPES);
        }
    }
}