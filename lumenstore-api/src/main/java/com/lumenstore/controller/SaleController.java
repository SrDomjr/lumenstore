package com.lumenstore.controller;

import com.lumenstore.dto.SaleRequestDTO;
import com.lumenstore.dto.SaleResponseDTO;
import com.lumenstore.models.Sale;
import com.lumenstore.services.SaleService;
import lombok.RequiredArgsConstructor;
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

    @GetMapping("/{id}")
    public ResponseEntity<SaleResponseDTO> getSaleById(@PathVariable Long id) {
        SaleResponseDTO sale = saleService.getSaleById(id);
        return ResponseEntity.ok(sale);
    }

    @GetMapping("/customer/{customerId}")
    public ResponseEntity<List<SaleResponseDTO>> getSalesByCustomer(@PathVariable Long customerId) {
        List<SaleResponseDTO> sales = saleService.getSalesByCustomer(customerId);
        return ResponseEntity.ok(sales);
    }

    @GetMapping("/status/{status}")
    public ResponseEntity<List<SaleResponseDTO>> getSalesByStatus(@PathVariable String status) {
        List<SaleResponseDTO> sales = saleService.getSalesByStatus(status);
        return ResponseEntity.ok(sales);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Sale> updateSaleStatus(@PathVariable Long id, @RequestParam String status) {
        Sale sale = saleService.updateSaleStatus(id, status);
        return ResponseEntity.ok(sale);
    }
}
