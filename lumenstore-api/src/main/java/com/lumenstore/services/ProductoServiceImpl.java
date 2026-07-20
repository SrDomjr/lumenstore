package com.lumenstore.services;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.lumenstore.dto.ProductImageResponseDTO;
import com.lumenstore.dto.ProductoRequestDTO;
import com.lumenstore.dto.ProductoResponseDTO;
import com.lumenstore.dto.ProductVariantResponseDTO;
import com.lumenstore.exception.BusinessRuleException;
import com.lumenstore.exception.DuplicateResourceException;
import com.lumenstore.exception.ResourceNotFoundException;
import com.lumenstore.models.Categoria;
import com.lumenstore.models.Color;
import com.lumenstore.models.Descuento;
import com.lumenstore.models.Etiqueta;
import com.lumenstore.models.Marca;
import com.lumenstore.models.ProductImage;
import com.lumenstore.models.Producto;
import com.lumenstore.models.ProductVariant;
import com.lumenstore.models.Talla;
import com.lumenstore.repository.ICategoriaRepository;
import com.lumenstore.repository.IColorRepository;
import com.lumenstore.repository.IEtiquetaRepository;
import com.lumenstore.repository.IMarcaRepository;
import com.lumenstore.repository.IProductImageRepository;
import com.lumenstore.repository.IProductoRepository;
import com.lumenstore.repository.IProductVariantRepository;
import com.lumenstore.repository.ITallaRepository;

import java.math.BigDecimal;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
@RequiredArgsConstructor
public class ProductoServiceImpl implements ProductoService {

    private static final Logger log = LoggerFactory.getLogger(ProductoServiceImpl.class);

    private final IProductoRepository productoRepository;
    private final IProductVariantRepository productVariantRepository;
    private final FileStorageService fileStorageService;
    private final IMarcaRepository marcaRepository;
    private final ICategoriaRepository categoriaRepository;
    private final IProductImageRepository productImageRepository;
    private final IProductImageService productImageService;
    private final IEtiquetaRepository etiquetaRepository;
    private final ITallaRepository tallaRepository;
    private final IColorRepository colorRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponseDTO> getProducts(Pageable pageable) {
        Page<Producto> page = productoRepository.findByIsActiveTrue(pageable);
        Map<Long, List<String>> imagesByProduct = batchLoadImages(page.getContent());
        return page.map(p -> convertToDTO(p, imagesByProduct));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponseDTO> getProducts(Pageable pageable, Long categoryId, Long brandId, String query, java.math.BigDecimal minPrice, java.math.BigDecimal maxPrice) {
        Page<Producto> page = productoRepository.findByFilters(categoryId, brandId, query, minPrice, maxPrice, pageable);
        Map<Long, List<String>> imagesByProduct = batchLoadImages(page.getContent());
        return page.map(p -> convertToDTO(p, imagesByProduct));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponseDTO> getAdminProducts(Pageable pageable, Long categoryId, Long brandId, String query) {
        Page<Producto> page = productoRepository.findByFiltersAdmin(categoryId, brandId, query, null, pageable);
        Map<Long, List<String>> imagesByProduct = batchLoadImages(page.getContent());
        return page.map(p -> convertToDTO(p, imagesByProduct));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ProductoResponseDTO> getProductsByCategory(Long categoryId, Pageable pageable) {
        Page<Producto> page = productoRepository.findByCategoryIdAndIsActiveTrue(categoryId, pageable);
        Map<Long, List<String>> imagesByProduct = batchLoadImages(page.getContent());
        return page.map(p -> convertToDTO(p, imagesByProduct));
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponseDTO getProductById(Long id) {
        Producto product = productoRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", id));
        return convertToDTO(product);
    }

    @Override
    @Transactional(readOnly = true)
    public ProductoResponseDTO getProductBySlug(String slug) {
        Producto product = productoRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Producto no encontrado con el slug: " + slug));
        return convertToDTO(product);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponseDTO> getTrendingProducts() {
        List<Producto> products = productoRepository.findTop12ByIsActiveTrueAndFeaturedTrueOrderByCreatedAtDesc();
        Map<Long, List<String>> imagesByProduct = batchLoadImages(products);
        return products.stream().map(p -> convertToDTO(p, imagesByProduct)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponseDTO> getNewProducts() {
        List<Producto> products = productoRepository.findTop12ByIsActiveTrueOrderByCreatedAtDesc();
        Map<Long, List<String>> imagesByProduct = batchLoadImages(products);
        return products.stream().map(p -> convertToDTO(p, imagesByProduct)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductoResponseDTO> getDiscountedProducts() {
        List<Producto> products = productoRepository.findDistinctByIsActiveTrueAndDiscountsIsNotEmpty(Pageable.ofSize(12));
        Map<Long, List<String>> imagesByProduct = batchLoadImages(products);
        return products.stream().map(p -> convertToDTO(p, imagesByProduct)).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProductVariantResponseDTO> getProductVariants(Long productId) {
        return productVariantRepository.findByProductIdAndIsActiveTrue(productId)
                .stream()
                .map(this::convertVariantToDTO)
                .toList();
    }

    @Override
    @Transactional
    public ProductoResponseDTO createProduct(ProductoRequestDTO request) {
        // ─── Reglas de negocio: alta de producto ───
        if (request.getName() == null || request.getName().isBlank()) {
            throw new BusinessRuleException("El nombre del producto es obligatorio");
        }
        if (request.getBrandId() == null) {
            throw new BusinessRuleException("Debe seleccionar una marca para el producto");
        }
        if (request.getCategoryId() == null) {
            throw new BusinessRuleException("Debe seleccionar una categoría para el producto");
        }

        Marca brand = marcaRepository.findById(request.getBrandId())
                .orElseThrow(() -> ResourceNotFoundException.of("Marca", request.getBrandId()));

        Categoria category = categoriaRepository.findById(request.getCategoryId())
                .orElseThrow(() -> ResourceNotFoundException.of("Categoría", request.getCategoryId()));

        String slug = generateUniqueSlug(request.getSlug(), request.getName(), null);

        String normalizedSku = (request.getSku() != null && !request.getSku().isBlank())
                ? request.getSku().trim() : null;

        if (normalizedSku != null && productoRepository.existsBySkuIgnoreCase(normalizedSku)) {
            throw new DuplicateResourceException("Ya existe un producto con el SKU: " + normalizedSku);
        }

        Producto product = Producto.builder()
                .name(request.getName())
                .slug(slug)
                .description(request.getDescription())
                .shortDescription(request.getShortDescription())
                .sku(normalizedSku)
                .brand(brand)
                .category(category)
                .isActive(request.getIsActive() != null ? request.getIsActive() : true)
                .featured(request.getFeatured() != null ? request.getFeatured() : false)
                .build();

        // Save tags if provided
        if (request.getTags() != null && !request.getTags().isEmpty()) {
            java.util.Set<Etiqueta> tagEntities = request.getTags().stream().map(tagName -> {
                String tagSlug = tagName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
                return etiquetaRepository.findBySlug(tagSlug)
                        .orElseGet(() -> {
                            Etiqueta newTag = Etiqueta.builder()
                                    .name(tagName)
                                    .slug(tagSlug)
                                    .build();
                            return etiquetaRepository.save(newTag);
                        });
            }).collect(java.util.stream.Collectors.toSet());
            product.setTags(tagEntities);
        }

        product = productoRepository.save(product);

        if (request.getBasePrice() != null || request.getStock() != null) {
            String variantSku = (normalizedSku != null) ? normalizedSku + "-DEFAULT" : null;
            ProductVariant variant = ProductVariant.builder()
                    .product(product)
                    .sku(variantSku)
                    .price(request.getBasePrice() != null ? request.getBasePrice() : BigDecimal.ZERO)
                    .stock(request.getStock() != null ? request.getStock() : 0)
                    .isActive(true)
                    .build();
            productVariantRepository.save(variant);
        }

        return convertToDTO(product);
    }

    @Override
    @Transactional
    public ProductoResponseDTO updateProduct(Long id, ProductoRequestDTO request) {
        Producto product = productoRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", id));

        if (request.getName() != null) {
            if (request.getName().isBlank()) {
                throw new BusinessRuleException("El nombre del producto no puede quedar vacío");
            }
            product.setName(request.getName());
        }
        if (request.getSlug() != null && !request.getSlug().isBlank()) {
            product.setSlug(generateUniqueSlug(request.getSlug(), product.getName(), id));
        }
        if (request.getDescription() != null) product.setDescription(request.getDescription());
        if (request.getShortDescription() != null) product.setShortDescription(request.getShortDescription());
        if (request.getSku() != null) {
            String normalizedSku = !request.getSku().isBlank() ? request.getSku().trim() : null;
            if (normalizedSku != null
                    && productoRepository.existsBySkuIgnoreCaseAndIdNot(normalizedSku, id)) {
                throw new DuplicateResourceException("Ya existe un producto con el SKU: " + normalizedSku);
            }
            product.setSku(normalizedSku);
        }
        if (request.getIsActive() != null) product.setIsActive(request.getIsActive());
        if (request.getFeatured() != null) product.setFeatured(request.getFeatured());

        if (request.getBrandId() != null) {
            Marca brand = marcaRepository.findById(request.getBrandId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Marca", request.getBrandId()));
            product.setBrand(brand);
        }

        if (request.getCategoryId() != null) {
            Categoria category = categoriaRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> ResourceNotFoundException.of("Categoría", request.getCategoryId()));
            product.setCategory(category);
        }

        // Update tags if provided in the request
        if (request.getTags() != null) {
            if (request.getTags().isEmpty()) {
                product.setTags(Collections.emptySet());
            } else {
                java.util.Set<Etiqueta> tagEntities = request.getTags().stream().map(tagName -> {
                    String tagSlug = tagName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
                    return etiquetaRepository.findBySlug(tagSlug)
                            .orElseGet(() -> {
                                Etiqueta newTag = Etiqueta.builder()
                                        .name(tagName)
                                        .slug(tagSlug)
                                        .build();
                                return etiquetaRepository.save(newTag);
                            });
                }).collect(java.util.stream.Collectors.toSet());
                product.setTags(tagEntities);
            }
        }

        product = productoRepository.save(product);

        // Update price/stock on first variant if provided
        if (request.getBasePrice() != null || request.getStock() != null) {
            List<ProductVariant> variants = productVariantRepository.findByProductIdAndIsActiveTrue(product.getId());
            if (!variants.isEmpty()) {
                ProductVariant variant = variants.get(0);
                if (request.getBasePrice() != null) variant.setPrice(request.getBasePrice());
                if (request.getStock() != null) variant.setStock(request.getStock());
                productVariantRepository.save(variant);
            }
        }

        return convertToDTO(product);
    }

    @Override
    @Transactional
    public void deleteProduct(Long id) {
        Producto product = productoRepository.findById(id)
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", id));
        // Baja lógica: se preserva el historial (pedidos, reseñas, reportes) en vez de borrar en cascada.
        product.setIsActive(false);
        productoRepository.save(product);
    }

    // ─── Variant CRUD ─────────────────────────────────────────

    @Override
    @Transactional
    public ProductVariantResponseDTO createVariant(Long productId, Map<String, Object> body) {
        Producto product = productoRepository.findById(productId)
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", productId));

        Talla size = null;
        if (body.get("sizeId") != null) {
            size = tallaRepository.findById(toLong(body.get("sizeId"))).orElse(null);
        }

        Color color = null;
        if (body.get("colorId") != null) {
            color = colorRepository.findById(toLong(body.get("colorId"))).orElse(null);
        }

        BigDecimal price = body.get("price") != null ? toBigDecimal(body.get("price")) : BigDecimal.ZERO;
        Integer stock = body.get("stock") != null ? toInt(body.get("stock")) : 0;
        validateVariantPriceAndStock(price, stock);

        // Generar SKU único si no se proporciona o está vacío
        String sku = (String) body.get("sku");
        if (sku == null || sku.isBlank()) {
            sku = generateUniqueSku(product, size, color);
        }

        ProductVariant variant = ProductVariant.builder()
                .product(product)
                .size(size)
                .color(color)
                .sku(sku)
                .price(price)
                .compareAtPrice(body.get("compareAtPrice") != null ? toBigDecimal(body.get("compareAtPrice")) : null)
                .stock(stock)
                .isActive(true)
                .build();

        variant = productVariantRepository.save(variant);
        return convertVariantToDTO(variant);
    }

    @Override
    @Transactional
    public ProductVariantResponseDTO updateVariant(Long variantId, Map<String, Object> body) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> ResourceNotFoundException.of("Variante", variantId));

        if (body.containsKey("sku")) {
            String newSku = (String) body.get("sku");
            if (newSku != null && !newSku.isBlank()) {
                variant.setSku(newSku);
            }
        }
        if (body.containsKey("price")) {
            BigDecimal price = toBigDecimal(body.get("price"));
            if (price.compareTo(BigDecimal.ZERO) < 0) {
                throw new BusinessRuleException("El precio no puede ser negativo");
            }
            variant.setPrice(price);
        }
        if (body.containsKey("compareAtPrice")) {
            variant.setCompareAtPrice(body.get("compareAtPrice") != null ? toBigDecimal(body.get("compareAtPrice")) : null);
        }
        if (body.containsKey("stock")) {
            int stock = toInt(body.get("stock"));
            if (stock < 0) {
                throw new BusinessRuleException("El stock no puede ser negativo");
            }
            variant.setStock(stock);
        }

        variant = productVariantRepository.save(variant);
        return convertVariantToDTO(variant);
    }

    @Override
    @Transactional
    public void deleteVariant(Long variantId) {
        ProductVariant variant = productVariantRepository.findById(variantId)
                .orElseThrow(() -> ResourceNotFoundException.of("Variante", variantId));
        // Soft delete: desactivar la variante en lugar de borrarla físicamente
        variant.setIsActive(false);
        productVariantRepository.save(variant);
        log.info("Variante {} desactivada (soft delete)", variantId);
    }

    // ─── Images ───────────────────────────────────────────────

    @Override
    @Transactional
    public List<ProductImageResponseDTO> uploadImages(Long productId, List<MultipartFile> files, Long variantId) {
        // Validate product exists
        if (!productoRepository.existsById(productId)) {
            throw ResourceNotFoundException.of("Producto", productId);
        }
        // Validate files
        if (files == null || files.isEmpty()) {
            throw new BusinessRuleException("Debe seleccionar al menos un archivo para subir");
        }
        for (MultipartFile file : files) {
            if (file.isEmpty()) {
                throw new BusinessRuleException("Uno de los archivos está vacío");
            }
            String contentType = file.getContentType();
            if (contentType == null || !contentType.startsWith("image/")) {
                throw new BusinessRuleException("Solo se permiten archivos de imagen");
            }
            if (file.getSize() > 10 * 1024 * 1024) { // 10MB
                throw new BusinessRuleException("El archivo " + file.getOriginalFilename() + " supera el tamaño máximo de 10MB");
            }
        }
        log.info("Subiendo {} imágenes para el producto {}", files.size(), productId);
        // Delegar al ProductImageService para cada archivo
        List<ProductImageResponseDTO> results = new java.util.ArrayList<>();
        for (MultipartFile file : files) {
            ProductImageResponseDTO dto = productImageService.upload(
                    productId,
                    variantId != null ? java.util.Optional.of(variantId) : java.util.Optional.empty(),
                    file,
                    "",
                    false
            );
            results.add(dto);
        }
        return results;
    }

    @Override
    @Transactional
    public void setMainImage(Long productId, Long imageId) {
        // Unset all main images for this product
        List<ProductImage> currentMain = productImageRepository.findByProductIdAndIsMainTrue(productId);
        currentMain.forEach(img -> img.setIsMain(false));
        productImageRepository.saveAll(currentMain);

        // Set the new main image
        ProductImage newMain = productImageRepository.findById(imageId)
                .orElseThrow(() -> ResourceNotFoundException.of("Imagen", imageId));
        newMain.setIsMain(true);
        productImageRepository.save(newMain);
    }

    // ─── Tags ─────────────────────────────────────────────────

    @Override
    @Transactional(readOnly = true)
    public List<String> getProductTags(Long productId) {
        Producto product = productoRepository.findById(productId)
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", productId));

        if (product.getTags() == null) return List.of();
        return product.getTags().stream()
                .map(Etiqueta::getName)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateProductTags(Long productId, List<String> tags) {
        Producto product = productoRepository.findById(productId)
                .orElseThrow(() -> ResourceNotFoundException.of("Producto", productId));

        if (tags == null || tags.isEmpty()) {
            product.setTags(Collections.emptySet());
        } else {
            java.util.Set<Etiqueta> tagEntities = tags.stream().map(tagName -> {
                String tagSlug = tagName.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
                return etiquetaRepository.findBySlug(tagSlug)
                        .orElseGet(() -> {
                            Etiqueta newTag = Etiqueta.builder()
                                    .name(tagName)
                                    .slug(tagSlug)
                                    .build();
                            return etiquetaRepository.save(newTag);
                        });
            }).collect(Collectors.toSet());
            product.setTags(tagEntities);
        }

        productoRepository.save(product);
    }

    // ─── Uniqueness checks ──────────────────────────────────

    @Override
    public boolean slugExists(String slug) {
        return productoRepository.existsBySlugIgnoreCase(slug);
    }

    @Override
    public boolean slugExistsForOther(String slug, Long excludeId) {
        return productoRepository.existsBySlugIgnoreCaseAndIdNot(slug, excludeId);
    }

    @Override
    public boolean skuExists(String sku) {
        return (sku == null || sku.isBlank()) ? false : productoRepository.existsBySkuIgnoreCase(sku);
    }

    @Override
    public boolean skuExistsForOther(String sku, Long excludeId) {
        return (sku == null || sku.isBlank()) ? false : productoRepository.existsBySkuIgnoreCaseAndIdNot(sku, excludeId);
    }

    // ─── Helpers de reglas de negocio ──────────────────────────

    /**
     * Genera un SKU único para una variante cuando no se proporciona uno.
     * Formato: {prefix}-{colorId}-{sizeId}-{randomSuffix}
     */
    private String generateUniqueSku(Producto product, Talla size, Color color) {
        String base = (product.getSku() != null && !product.getSku().isBlank())
                ? product.getSku()
                : "VAR-" + product.getId();
        if (color != null) base += "-" + color.getId();
        if (size != null) base += "-" + size.getId();
        // Añadir sufijo único para evitar colisiones
        String candidate = base + "-" + System.currentTimeMillis() % 10000;
        return candidate;
    }

    private void validateVariantPriceAndStock(BigDecimal price, Integer stock) {
        if (price != null && price.compareTo(BigDecimal.ZERO) < 0) {
            throw new BusinessRuleException("El precio no puede ser negativo");
        }
        if (stock != null && stock < 0) {
            throw new BusinessRuleException("El stock no puede ser negativo");
        }
    }

    /**
     * Genera un slug a partir del nombre (o usa el propuesto) y garantiza su unicidad
     * agregando un sufijo numérico si ya existe otro producto con el mismo slug.
     * excludeId permite ignorar el propio producto al editar.
     */
    private String generateUniqueSlug(String proposedSlug, String name, Long excludeId) {
        String base = (proposedSlug != null && !proposedSlug.isBlank()) ? proposedSlug : name;
        base = base.toLowerCase()
                .replaceAll("[^a-z0-9áéíóúñü\\s-]", "")
                .replaceAll("[\\s]+", "-")
                .replaceAll("á", "a").replaceAll("é", "e")
                .replaceAll("í", "i").replaceAll("ó", "o")
                .replaceAll("ú", "u").replaceAll("ñ", "n")
                .replaceAll("ü", "u").replaceAll("-+", "-")
                .replaceAll("^-|-$", "");

        if (base.isBlank()) {
            base = "producto";
        }

        String candidate = base;
        int suffix = 2;
        while (slugExists(candidate, excludeId)) {
            candidate = base + "-" + suffix;
            suffix++;
        }
        return candidate;
    }

    private boolean slugExists(String slug, Long excludeId) {
        return excludeId == null
                ? productoRepository.existsBySlugIgnoreCase(slug)
                : productoRepository.existsBySlugIgnoreCaseAndIdNot(slug, excludeId);
    }

    // ─── Helpers de parseo defensivo ───────────────────────────
    // Un body JSON deserializado como Map<String, Object> puede traer los
    // números como String (p. ej. si el frontend usa un <input type="text">),
    // por lo que no se puede castear directamente a Number sin arriesgar un
    // ClassCastException.

    private Integer toInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(value.toString().trim());
        } catch (NumberFormatException e) {
            throw new BusinessRuleException("El valor '" + value + "' no es un número entero válido.");
        }
    }

    private Long toLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(value.toString().trim());
        } catch (NumberFormatException e) {
            throw new BusinessRuleException("El valor '" + value + "' no es un identificador válido.");
        }
    }

    private BigDecimal toBigDecimal(Object value) {
        if (value instanceof BigDecimal bd) {
            return bd;
        }
        if (value instanceof Number number) {
            return BigDecimal.valueOf(number.doubleValue());
        }
        try {
            return new BigDecimal(value.toString().trim());
        } catch (NumberFormatException e) {
            throw new BusinessRuleException("El valor '" + value + "' no es un monto válido.");
        }
    }

    // ─── DTO Converters ───────────────────────────────────────

    private Map<Long, List<String>> batchLoadImages(List<Producto> products) {
        if (products.isEmpty()) return Map.of();
        List<Long> ids = products.stream().map(Producto::getId).toList();
        return productImageRepository.findByProductIdInOrderByProductIdSortOrderAsc(ids)
                .stream()
                .collect(Collectors.groupingBy(
                        img -> img.getProduct().getId(),
                        Collectors.mapping(ProductImage::getImageUrl, Collectors.toList())
                ));
    }

    private ProductVariantResponseDTO convertVariantToDTO(ProductVariant variant) {
        return ProductVariantResponseDTO.builder()
                .id(variant.getId())
                .sku(variant.getSku())
                .sizeId(variant.getSize() != null ? variant.getSize().getId() : null)
                .colorId(variant.getColor() != null ? variant.getColor().getId() : null)
                .sizeName(variant.getSize() != null ? variant.getSize().getName() : null)
                .colorName(variant.getColor() != null ? variant.getColor().getName() : null)
                .colorHex(variant.getColor() != null ? variant.getColor().getHexCode() : null)
                .price(variant.getPrice())
                .compareAtPrice(variant.getCompareAtPrice())
                .stock(variant.getStock())
                .isActive(variant.getIsActive())
                .build();
    }

    private ProductImageResponseDTO convertImageToDTO(ProductImage image) {
        return ProductImageResponseDTO.builder()
                .id(image.getId())
                .imageUrl(image.getImageUrl())
                .altText(image.getAltText())
                .sortOrder(image.getSortOrder())
                .isMain(image.getIsMain())
                .variantId(image.getVariant() != null ? image.getVariant().getId() : null)
                .build();
    }

    private ProductoResponseDTO convertToDTO(Producto product) {
        Map<Long, List<String>> singleMap = Map.of(product.getId(),
                productImageRepository.findByProductIdOrderBySortOrderAsc(product.getId())
                        .stream().map(ProductImage::getImageUrl).toList());
        return convertToDTO(product, singleMap);
    }

    private ProductoResponseDTO convertToDTO(Producto product, Map<Long, List<String>> imagesByProduct) {
        BigDecimal basePrice = BigDecimal.ZERO;
        Integer stock = 0;

        if (product.getVariants() != null && !product.getVariants().isEmpty()) {
            List<ProductVariant> activeVariants = product.getVariants().stream()
                    .filter(v -> Boolean.TRUE.equals(v.getIsActive()))
                    .toList();
            // Si no hay ninguna variante activa, se usa el set completo solo para
            // no mostrar $0 / stock 0 de forma engañosa en el panel de admin.
            List<ProductVariant> variantsForCalc = activeVariants.isEmpty() ? product.getVariants() : activeVariants;

            basePrice = variantsForCalc.stream()
                    .map(ProductVariant::getPrice)
                    .filter(Objects::nonNull)
                    .min(BigDecimal::compareTo)
                    .orElse(BigDecimal.ZERO);

            // Stock total del producto = suma del stock de todas sus variantes
            // (antes se mostraba el stock de una sola variante arbitraria, lo
            // que era incorrecto para control de inventario con tallas/colores).
            stock = variantsForCalc.stream()
                    .map(ProductVariant::getStock)
                    .filter(Objects::nonNull)
                    .mapToInt(Integer::intValue)
                    .sum();
        }

        // Calculate discount from active discount entities
        int maxDiscount = 0;
        if (product.getDiscounts() != null && !product.getDiscounts().isEmpty()) {
            maxDiscount = product.getDiscounts().stream()
                    .filter(d -> Boolean.TRUE.equals(d.getIsActive()))
                    .filter(d -> d.getStartsAt() == null || d.getStartsAt().isBefore(java.time.LocalDateTime.now()))
                    .filter(d -> d.getEndsAt() == null || d.getEndsAt().isAfter(java.time.LocalDateTime.now()))
                    .mapToInt(d -> {
                        if (Descuento.DiscountType.percentage == d.getDiscountType()) {
                            return d.getValue() != null ? d.getValue().intValue() : 0;
                        }
                        return 0;
                    })
                    .max()
                    .orElse(0);
        }

        List<String> imageUrls = imagesByProduct.getOrDefault(product.getId(), Collections.emptyList());

        return ProductoResponseDTO.builder()
                .id(product.getId())
                .name(product.getName())
                .slug(product.getSlug())
                .description(product.getDescription())
                .shortDescription(product.getShortDescription())
                .sku(product.getSku())
                .brandId(product.getBrand() != null ? product.getBrand().getId() : null)
                .brandName(product.getBrand() != null ? product.getBrand().getName() : null)
                .categoryId(product.getCategory() != null ? product.getCategory().getId() : null)
                .categoryName(product.getCategory() != null ? product.getCategory().getName() : null)
                .basePrice(basePrice)
                .stock(stock)
                .discount(maxDiscount)
                .featured(product.getFeatured() != null ? product.getFeatured() : false)
                .isActive(product.getIsActive() != null ? product.getIsActive() : true)
                .images(imageUrls)
                .build();
    }
}