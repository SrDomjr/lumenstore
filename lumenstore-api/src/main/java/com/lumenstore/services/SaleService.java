package com.lumenstore.services;

import com.lumenstore.models.*;
import com.lumenstore.repository.*;
import com.lumenstore.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final ISaleRepository saleRepository;
    private final ISaleDetailRepository saleDetailRepository;
    private final IProductVariantRepository variantRepository;
    private final IClienteRepository clienteRepository;
    private final IInventoryMovementRepository inventoryMovementRepository;
    private final IProductImageRepository productImageRepository;

    @Transactional
    public Sale createSale(SaleRequestDTO request) {
        Cliente customer = clienteRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        Sale sale = Sale.builder()
                .customer(customer)
                .orderNumber(generateOrderNumber())
                .status(Sale.SaleStatus.pending)
                .paymentMethod(Sale.PaymentMethod.valueOf(request.getPaymentMethod()))
                .subtotal(BigDecimal.ZERO)
                .discountAmount(request.getDiscountAmount() != null ? request.getDiscountAmount() : BigDecimal.ZERO)
                .shippingCost(request.getShippingCost() != null ? request.getShippingCost() : BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .notes(request.getNotes())
                .build();

        sale = saleRepository.save(sale);

        BigDecimal subtotal = BigDecimal.ZERO;

        for (var item : request.getItems()) {
            ProductVariant variant = variantRepository.findById(item.getVariantId())
                    .orElseThrow(() -> new RuntimeException("Variante no encontrada"));

            if (variant.getStock() < item.getQuantity()) {
                throw new RuntimeException("Stock insuficiente para la variante: " + variant.getSku());
            }

            BigDecimal itemSubtotal = item.getUnitPrice().multiply(BigDecimal.valueOf(item.getQuantity()));

            SaleDetail detail = SaleDetail.builder()
                    .sale(sale)
                    .variant(variant)
                    .quantity(item.getQuantity())
                    .unitPrice(item.getUnitPrice())
                    .discountAmount(item.getDiscountAmount() != null ? item.getDiscountAmount() : BigDecimal.ZERO)
                    .subtotal(itemSubtotal)
                    .build();

            saleDetailRepository.save(detail);
            subtotal = subtotal.add(itemSubtotal);

            variant.setStock(variant.getStock() - item.getQuantity());
            variantRepository.save(variant);

            InventoryMovement movement = InventoryMovement.builder()
                    .variant(variant)
                    .quantity(-item.getQuantity())
                    .movementType(InventoryMovement.MovementType.sale)
                    .referenceId(sale.getId())
                    .notes("Venta #" + sale.getOrderNumber())
                    .build();
            inventoryMovementRepository.save(movement);
        }

        sale.setSubtotal(subtotal);
        sale.setTotal(subtotal.subtract(sale.getDiscountAmount()).add(sale.getShippingCost()));

        return saleRepository.save(sale);
    }

    @Transactional(readOnly = true)
    public Page<SaleResponseDTO> getAllSales(int page, int size) {
        Page<Sale> sales = saleRepository.findAll(
                PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt")));
        return sales.map(this::mapToDTO);
    }

    @Transactional(readOnly = true)
    public SaleResponseDTO getSaleById(Long id) {
        Sale sale = saleRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
        return mapToDTO(sale);
    }

    @Transactional(readOnly = true)
    public List<SaleResponseDTO> getSalesByCustomer(Long customerId) {
        return saleRepository.findByCustomerIdOrderByCreatedAtDesc(customerId)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<SaleResponseDTO> getSalesByStatus(String status) {
        return saleRepository.findByStatusOrderByCreatedAtDesc(status)
                .stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Transactional
    public SaleResponseDTO updateSaleStatus(Long saleId, String newStatus) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
        sale.setStatus(Sale.SaleStatus.valueOf(newStatus));
        sale.setUpdatedAt(LocalDateTime.now());
        return mapToDTO(saleRepository.save(sale));
    }

    @Transactional
    public SaleResponseDTO cancelSale(Long saleId, String reason) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
        sale.setStatus(Sale.SaleStatus.cancelled);
        sale.setNotes(reason != null ? reason : sale.getNotes());
        sale.setUpdatedAt(LocalDateTime.now());

        List<SaleDetail> details = saleDetailRepository.findBySaleId(saleId);
        for (SaleDetail detail : details) {
            ProductVariant variant = detail.getVariant();
            variant.setStock(variant.getStock() + detail.getQuantity());
            variantRepository.save(variant);

            InventoryMovement movement = InventoryMovement.builder()
                    .variant(variant)
                    .quantity(detail.getQuantity())
                    .movementType(InventoryMovement.MovementType.sale)
                    .referenceId(saleId)
                    .notes("Devolución por cancelación #" + sale.getOrderNumber())
                    .build();
            inventoryMovementRepository.save(movement);
        }

        return mapToDTO(saleRepository.save(sale));
    }

    @Transactional(readOnly = true)
    public List<SaleDetailResponseDTO> getSaleDetails(Long saleId) {
        saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
        List<SaleDetail> details = saleDetailRepository.findBySaleId(saleId);
        return mapDetailsToDTO(details);
    }

    @Transactional(readOnly = true)
    public List<SaleResponseDTO> getSalesReport(String startDate, String endDate) {
        DateTimeFormatter formatter = DateTimeFormatter.ISO_LOCAL_DATE_TIME;
        LocalDateTime start = LocalDateTime.parse(startDate + "T00:00:00", formatter);
        LocalDateTime end = LocalDateTime.parse(endDate + "T23:59:59", formatter);

        List<Sale> sales = saleRepository.findAll();
        return sales.stream()
                .filter(s -> s.getCreatedAt() != null
                        && !s.getCreatedAt().isBefore(start)
                        && !s.getCreatedAt().isAfter(end))
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    private SaleResponseDTO mapToDTO(Sale sale) {
        List<SaleDetail> details = saleDetailRepository.findBySaleId(sale.getId());
        return SaleResponseDTO.builder()
                .id(sale.getId())
                .orderNumber(sale.getOrderNumber())
                .status(sale.getStatus().toString())
                .subtotal(sale.getSubtotal())
                .discountAmount(sale.getDiscountAmount())
                .shippingCost(sale.getShippingCost())
                .total(sale.getTotal())
                .paymentMethod(sale.getPaymentMethod().toString())
                .customerName(sale.getCustomer() != null ?
                        sale.getCustomer().getFirstName() + " " + sale.getCustomer().getLastName() : null)
                .notes(sale.getNotes())
                .items(mapDetailsToDTO(details))
                .createdAt(sale.getCreatedAt())
                .updatedAt(sale.getUpdatedAt())
                .build();
    }

    private List<SaleDetailResponseDTO> mapDetailsToDTO(List<SaleDetail> details) {
        if (details.isEmpty()) return List.of();

        List<Long> variantIds = details.stream()
                .map(d -> d.getVariant().getId())
                .distinct()
                .collect(Collectors.toList());

        List<ProductVariant> variants = variantRepository.findAllById(variantIds);
        Map<Long, ProductVariant> variantMap = variants.stream()
                .collect(Collectors.toMap(ProductVariant::getId, v -> v));

        List<Long> productIds = variants.stream()
                .map(v -> v.getProduct().getId())
                .distinct()
                .collect(Collectors.toList());

        List<ProductImage> allImages = productIds.isEmpty() ? List.of() :
                productImageRepository.findByProductIdInOrderByProductIdSortOrderAsc(productIds);
        Map<Long, String> mainImageByProductId = new HashMap<>();
        for (ProductImage img : allImages) {
            Long pid = img.getProduct().getId();
            if (!mainImageByProductId.containsKey(pid)) {
                mainImageByProductId.put(pid, img.getImageUrl());
            }
        }

        return details.stream().map(d -> {
            ProductVariant variant = variantMap.get(d.getVariant().getId());
            if (variant == null) return null;

            Long productId = variant.getProduct().getId();
            return SaleDetailResponseDTO.builder()
                    .id(d.getId())
                    .saleId(d.getSale().getId())
                    .variantId(variant.getId())
                    .productName(variant.getProduct().getName())
                    .variantSku(variant.getSku())
                    .colorName(variant.getColor() != null ? variant.getColor().getName() : null)
                    .sizeName(variant.getSize() != null ? variant.getSize().getName() : null)
                    .imageUrl(mainImageByProductId.get(productId))
                    .quantity(d.getQuantity())
                    .unitPrice(d.getUnitPrice())
                    .discountAmount(d.getDiscountAmount())
                    .subtotal(d.getSubtotal())
                    .build();
        }).filter(Objects::nonNull).collect(Collectors.toList());
    }

    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis();
    }
}
