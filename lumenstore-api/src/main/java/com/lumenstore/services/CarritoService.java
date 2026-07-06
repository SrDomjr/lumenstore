package com.lumenstore.services;


import com.lumenstore.dto.CarritoItemRequestDTO;
import com.lumenstore.dto.CarritoItemResponseDTO;
import com.lumenstore.dto.CarritoResponseDTO;
import com.lumenstore.models.Carrito;
import com.lumenstore.models.CarritoItem;
import com.lumenstore.models.ProductVariant;
import com.lumenstore.models.Usuario;
import com.lumenstore.repository.ICarritoRepository;
import com.lumenstore.repository.IUsuarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CarritoService {

    private final ICarritoRepository carritoRepository;
    private final IUsuarioRepository userRepository;
    // Asumimos que tienes este repositorio para buscar las variantes
    // Si se llama diferente en tu proyecto (ej. IProductVariantRepository), cámbialo aquí
    private final com.lumenstore.repository.IProductVariantRepository productVariantRepository; 

    @Transactional
    public CarritoResponseDTO addProductToCart(String username, CarritoItemRequestDTO request) {
        // 1. Buscar al usuario dueño de la petición
        Usuario usuario = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado"));

        // 2. Buscar o crear el carrito asociado al usuario
        Carrito carrito = carritoRepository.findByUserId(usuario.getId())
                .orElseGet(() -> {
                    Carrito newCarrito = Carrito.builder().user(usuario).build();
                    return carritoRepository.save(newCarrito);
                });

        // 3. Validar que la variante del producto exista
        // Primero buscar por ID de variante, si no, buscar como ID de producto
        Optional<ProductVariant> variantOpt = productVariantRepository.findById(request.getProductVariantId());
        ProductVariant variant;
        
        if (variantOpt.isPresent()) {
            variant = variantOpt.get();
        } else {
            // Buscar si el ID corresponde a un producto y obtener su primera variante activa
            List<ProductVariant> productVariants = productVariantRepository.findByProductIdAndIsActiveTrue(request.getProductVariantId());
            if (productVariants.isEmpty()) {
                throw new RuntimeException("La variante de producto especificada no existe");
            }
            variant = productVariants.get(0);
        }

        final ProductVariant finalVariant = variant;

        // 4. Verificar si la variante ya está en el carrito
        Optional<CarritoItem> existingItem = carrito.getItems().stream()
                .filter(item -> item.getProductVariant().getId().equals(finalVariant.getId()))
                .findFirst();

        if (existingItem.isPresent()) {
            // Si ya existe, acumulamos la nueva cantidad
            CarritoItem item = existingItem.get();
            item.setQuantity(item.getQuantity() + request.getQuantity());
        } else {
            // Si es nuevo, creamos el detalle y lo enlazamos
            CarritoItem newItem = CarritoItem.builder()
                    .cart(carrito)
                    .productVariant(finalVariant)
                    .quantity(request.getQuantity())
                    .build();
            carrito.getItems().add(newItem);
        }

        // 5. Guardar los cambios en cascada y devolver DTO
        carrito = carritoRepository.save(carrito);
        return convertToDTO(carrito);
    }

    @Transactional(readOnly = true)
    public CarritoResponseDTO getCart(Long clientId) {
        Carrito carrito = carritoRepository.findByUserId(clientId)
                .orElse(null);
        return convertToDTO(carrito);
    }

    private CarritoResponseDTO convertToDTO(Carrito carrito) {
        if (carrito == null) return null;

        var items = carrito.getItems().stream()
                .map(this::convertItemToDTO)
                .collect(Collectors.toList());

        return CarritoResponseDTO.builder()
                .id(carrito.getId())
                .clienteId(carrito.getUser().getId())
                .items(items)
                .createdAt(carrito.getCreatedAt() != null ? carrito.getCreatedAt().toString() : null)
                .updatedAt(carrito.getUpdatedAt() != null ? carrito.getUpdatedAt().toString() : null)
                .build();
    }

    private CarritoItemResponseDTO convertItemToDTO(CarritoItem item) {
        if (item == null) return null;

        ProductVariant variant = item.getProductVariant();
        if (variant == null) {
            return CarritoItemResponseDTO.builder()
                    .id(item.getId())
                    .quantity(item.getQuantity())
                    .addedAt(item.getCreatedAt() != null ? item.getCreatedAt().toString() : null)
                    .build();
        }

        // Get color name from the Color entity
        String colorName = null;
        if (variant.getColor() != null) {
            colorName = variant.getColor().getName();
        }

        // Get size name from the Talla entity
        String sizeName = null;
        if (variant.getSize() != null) {
            sizeName = variant.getSize().getName();
        }

        return CarritoItemResponseDTO.builder()
                .id(item.getId())
                .variantId(variant.getId())
                .productName(variant.getProduct() != null ? variant.getProduct().getName() : "")
                .price(variant.getPrice())
                .imageUrl(null)
                .color(colorName)
                .size(sizeName)
                .quantity(item.getQuantity())
                .addedAt(item.getCreatedAt() != null ? item.getCreatedAt().toString() : null)
                .build();
    }
}