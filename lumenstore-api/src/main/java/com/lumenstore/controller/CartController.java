package com.lumenstore.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.lumenstore.dto.CarritoItemRequestDTO;
import com.lumenstore.dto.CarritoResponseDTO;
import com.lumenstore.services.CarritoService;

@RestController
@RequestMapping("/api/v1/cart")
@RequiredArgsConstructor
public class CartController {

    private final CarritoService carritoService;

    @PostMapping("/add")
    public ResponseEntity<?> addItemToCart(
            @Valid @RequestBody CarritoItemRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        CarritoResponseDTO response = carritoService.addProductToCart(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }
}
