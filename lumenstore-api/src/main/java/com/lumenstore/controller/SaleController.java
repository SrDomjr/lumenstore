package com.lumenstore.controller;

import com.lumenstore.dto.*;
import com.lumenstore.models.Sale;
import com.lumenstore.services.SaleService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/sales")
@RequiredArgsConstructor
public class SaleController {

    private final SaleService saleService;

    @PostMapping
    public ResponseEntity<Sale> createSale(@RequestBody SaleRequestDTO request) {
        Sale sale = saleService.createSale(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(sale);
    }

    @GetMapping
    public ResponseEntity<Page<SaleResponseDTO>> getAllSales(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "25") int size) {
        return ResponseEntity.ok(saleService.getAllSales(page, size));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponseDTO> getSaleById(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.getSaleById(id));
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<SaleResponseDTO>> getSalesByCustomer(@PathVariable Long customerId) {
        return ResponseEntity.ok(saleService.getSalesByCustomer(customerId));
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<SaleResponseDTO>> getSalesByStatus(@PathVariable String status) {
        return ResponseEntity.ok(saleService.getSalesByStatus(status));
    }

    @GetMapping("/{id}/details")
    public ResponseEntity<List<SaleDetailResponseDTO>> getSaleDetails(@PathVariable Long id) {
        return ResponseEntity.ok(saleService.getSaleDetails(id));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<SaleResponseDTO> updateSaleStatus(
            @PathVariable Long id,
            @RequestBody SaleStatusRequestDTO request) {
        return ResponseEntity.ok(saleService.updateSaleStatus(id, request.getStatus()));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<SaleResponseDTO> cancelSale(
            @PathVariable Long id,
            @RequestBody(required = false) SaleStatusRequestDTO request) {
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(saleService.cancelSale(id, reason));
    }

    @GetMapping("/reports")
    public ResponseEntity<List<SaleResponseDTO>> getSalesReport(
            @RequestParam String startDate,
            @RequestParam String endDate) {
        return ResponseEntity.ok(saleService.getSalesReport(startDate, endDate));
    }
}
