package com.lumenstore.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import com.lumenstore.dto.CarritoItemRequestDTO;
import com.lumenstore.models.Carrito;
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
        // @AuthenticationPrincipal extrae automáticamente el usuario del Token JWT validado
        Carrito cart = carritoService.addProductToCart(userDetails.getUsername(), request);
        
        // Retornamos el carrito actualizado (puedes luego optimizarlo con un DTO de salida si deseas)
        return ResponseEntity.ok(cart);
    }
}