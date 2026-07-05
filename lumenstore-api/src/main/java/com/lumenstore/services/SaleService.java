package com.lumenstore.services;

import com.lumenstore.models.*;
import com.lumenstore.repository.*;
import com.lumenstore.dto.SaleRequestDTO;
import com.lumenstore.dto.SaleResponseDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SaleService {

    private final ISaleRepository saleRepository;
    private final ISaleDetailRepository saleDetailRepository;
    private final IProductVariantRepository variantRepository;
    private final IClienteRepository clienteRepository;
    private final IInventoryMovementRepository inventoryMovementRepository;

    @Transactional
    public Sale createSale(SaleRequestDTO request) {
        // Validar cliente
        Cliente customer = clienteRepository.findById(request.getCustomerId())
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado"));

        // Crear venta
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

        BigDecimal subtotal = BigDecimal.ZERO;

        // Crear detalles de venta
        for (var item : request.getItems()) {
            ProductVariant variant = variantRepository.findById(item.getVariantId())
                    .orElseThrow(() -> new RuntimeException("Variante no encontrada"));

            // Validar stock
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

            // Actualizar stock
            variant.setStock(variant.getStock() - item.getQuantity());
            variantRepository.save(variant);

            // Registrar movimiento de inventario
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
    public Sale updateSaleStatus(Long saleId, String newStatus) {
        Sale sale = saleRepository.findById(saleId)
                .orElseThrow(() -> new RuntimeException("Venta no encontrada"));
        sale.setStatus(Sale.SaleStatus.valueOf(newStatus));
        sale.setUpdatedAt(LocalDateTime.now());
        return saleRepository.save(sale);
    }

    private SaleResponseDTO mapToDTO(Sale sale) {
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
                .createdAt(sale.getCreatedAt())
                .updatedAt(sale.getUpdatedAt())
                .build();
    }

    private String generateOrderNumber() {
        return "ORD-" + System.currentTimeMillis();
    }
}
