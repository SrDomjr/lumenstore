package com.lumenstore.controller;

import com.lumenstore.dto.DireccionRequestDTO;
import com.lumenstore.dto.DireccionResponseDTO;
import com.lumenstore.models.Direccion;
import com.lumenstore.services.AddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/customers/{customerId}/addresses")
@RequiredArgsConstructor
public class AddressController {

    private final AddressService addressService;

    @PostMapping
    public ResponseEntity<Direccion> createAddress(
            @PathVariable Long customerId,
            @RequestBody DireccionRequestDTO request) {
        Direccion address = addressService.createAddress(customerId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(address);
    }

    @GetMapping("/{addressId}")
    public ResponseEntity<DireccionResponseDTO> getAddress(
            @PathVariable Long customerId,
            @PathVariable Long addressId) {
        DireccionResponseDTO address = addressService.getAddressById(customerId, addressId);
        return ResponseEntity.ok(address);
    }

    @GetMapping
    public ResponseEntity<List<DireccionResponseDTO>> getAddresses(@PathVariable Long customerId) {
        List<DireccionResponseDTO> addresses = addressService.getAddressesByCustomer(customerId);
        return ResponseEntity.ok(addresses);
    }

    @PutMapping("/{addressId}")
    public ResponseEntity<Direccion> updateAddress(
            @PathVariable Long customerId,
            @PathVariable Long addressId,
            @RequestBody DireccionRequestDTO request) {
        Direccion address = addressService.updateAddress(customerId, addressId, request);
        return ResponseEntity.ok(address);
    }

    @DeleteMapping("/{addressId}")
    public ResponseEntity<Void> deleteAddress(
            @PathVariable Long customerId,
            @PathVariable Long addressId) {
        addressService.deleteAddress(customerId, addressId);
        return ResponseEntity.noContent().build();
    }
}
