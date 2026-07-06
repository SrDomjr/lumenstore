package com.lumenstore.controller;

import com.lumenstore.dto.CarritoItemRequestDTO;
import com.lumenstore.dto.CarritoItemUpdateDTO;
import com.lumenstore.dto.CarritoResponseDTO;
import com.lumenstore.models.Carrito;
import com.lumenstore.models.CarritoItem;
import com.lumenstore.models.Usuario;
import com.lumenstore.repository.ICarritoItemRepository;
import com.lumenstore.repository.ICarritoRepository;
import com.lumenstore.repository.IUsuarioRepository;
import com.lumenstore.services.CarritoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/v1/carrito")
@RequiredArgsConstructor
public class CarritoController {

    private final CarritoService carritoService;
    private final ICarritoRepository carritoRepository;
    private final ICarritoItemRepository carritoItemRepository;
    private final IUsuarioRepository usuarioRepository;

    @GetMapping("/cliente/{clientId}")
    public ResponseEntity<?> getCartForClient(
            @PathVariable Long clientId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(clientId);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Usuario usuario = usuarioOpt.get();
        if (userDetails == null || !userDetails.getUsername().equals(usuario.getUsername())) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        CarritoResponseDTO response = carritoService.getCart(clientId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/cliente/{clientId}/items")
    public ResponseEntity<?> addItem(
            @PathVariable Long clientId,
            @RequestBody CarritoItemRequestDTO request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(clientId);
        if (usuarioOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Usuario usuario = usuarioOpt.get();

        if (userDetails == null || !userDetails.getUsername().equals(usuario.getUsername())) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        CarritoResponseDTO response = carritoService.addProductToCart(userDetails.getUsername(), request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/cliente/{clientId}/items/{itemId}")
    public ResponseEntity<?> updateItem(
            @PathVariable Long clientId,
            @PathVariable Long itemId,
            @RequestBody CarritoItemUpdateDTO request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(clientId);
        if (usuarioOpt.isEmpty()) return ResponseEntity.notFound().build();
        Usuario usuario = usuarioOpt.get();

        if (userDetails == null || !userDetails.getUsername().equals(usuario.getUsername())) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        Optional<CarritoItem> itemOpt = carritoItemRepository.findById(itemId);
        if (itemOpt.isEmpty()) return ResponseEntity.notFound().build();

        CarritoItem item = itemOpt.get();
        if (!item.getCart().getUser().getId().equals(clientId)) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        item.setQuantity(request.getQuantity());
        carritoItemRepository.save(item);

        CarritoResponseDTO response = carritoService.getCart(clientId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/cliente/{clientId}/items/{itemId}")
    public ResponseEntity<?> removeItem(
            @PathVariable Long clientId,
            @PathVariable Long itemId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(clientId);
        if (usuarioOpt.isEmpty()) return ResponseEntity.notFound().build();
        Usuario usuario = usuarioOpt.get();

        if (userDetails == null || !userDetails.getUsername().equals(usuario.getUsername())) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        Optional<CarritoItem> itemOpt = carritoItemRepository.findById(itemId);
        if (itemOpt.isEmpty()) return ResponseEntity.notFound().build();

        CarritoItem item = itemOpt.get();
        if (!item.getCart().getUser().getId().equals(clientId)) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        // Remover y persistir
        Carrito cart = item.getCart();
        cart.getItems().removeIf(i -> i.getId().equals(itemId));
        carritoRepository.save(cart);

        CarritoResponseDTO response = carritoService.getCart(clientId);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/cliente/{clientId}")
    public ResponseEntity<?> clearCart(
            @PathVariable Long clientId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        Optional<Usuario> usuarioOpt = usuarioRepository.findById(clientId);
        if (usuarioOpt.isEmpty()) return ResponseEntity.notFound().build();
        Usuario usuario = usuarioOpt.get();

        if (userDetails == null || !userDetails.getUsername().equals(usuario.getUsername())) {
            return ResponseEntity.status(403).body("Forbidden");
        }

        Optional<Carrito> cartOpt = carritoRepository.findByUserId(clientId);
        if (cartOpt.isEmpty()) return ResponseEntity.noContent().build();

        Carrito cart = cartOpt.get();
        cart.getItems().clear();
        carritoRepository.save(cart);

        CarritoResponseDTO response = carritoService.getCart(clientId);
        return ResponseEntity.ok(response);
    }
}
