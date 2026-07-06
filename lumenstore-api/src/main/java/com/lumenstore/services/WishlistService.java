package com.lumenstore.services;

import com.lumenstore.models.Wishlist;
import com.lumenstore.models.WishlistItem;
import com.lumenstore.models.Cliente;
import com.lumenstore.models.Producto;
import com.lumenstore.models.Usuario;
import com.lumenstore.repository.IWishlistRepository;
import com.lumenstore.repository.IWishlistItemRepository;
import com.lumenstore.repository.IClienteRepository;
import com.lumenstore.repository.IProductoRepository;
import com.lumenstore.repository.IUsuarioRepository;
import com.lumenstore.dto.WishlistResponseDTO;
import com.lumenstore.dto.WishlistRequestDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


@Service
@RequiredArgsConstructor
public class WishlistService {

    private final IWishlistRepository wishlistRepository;
    private final IWishlistItemRepository wishlistItemRepository;
    private final IClienteRepository clienteRepository;
    private final IProductoRepository productoRepository;
    private final IUsuarioRepository usuarioRepository;

    @Transactional
    public Wishlist createWishlist(Long userId, WishlistRequestDTO request) {
        Cliente cliente = getClienteByUserId(userId);

        Wishlist wishlist = Wishlist.builder()
                .customer(cliente)
                .name(request.getName() != null ? request.getName() : "Mi Lista de Deseos")
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .build();

        return wishlistRepository.save(wishlist);
    }

    private Cliente getClienteByUserId(Long userId) {
        Usuario usuario = usuarioRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));
        return clienteRepository.findByUser(usuario)
                .orElseThrow(() -> new RuntimeException("Cliente no encontrado para el usuario"));
    }

    @Transactional(readOnly = true)
    public WishlistResponseDTO getDefaultWishlist(Long userId) {
        Cliente cliente = getClienteByUserId(userId);
        Wishlist wishlist = wishlistRepository.findByCustomerIdAndIsDefaultTrue(cliente.getId())
                .orElse(null);

        if (wishlist == null) return null;

        int itemCount = wishlistItemRepository.findByWishlistId(wishlist.getId()).size();

        return mapToDTO(wishlist, itemCount);
    }

    @Transactional(readOnly = true)
    public WishlistResponseDTO getWishlistById(Long userId, Long wishlistId) {
        Cliente cliente = getClienteByUserId(userId);
        Wishlist wishlist = wishlistRepository.findByCustomerIdAndId(cliente.getId(), wishlistId)
                .orElseThrow(() -> new RuntimeException("Lista de deseos no encontrada"));

        int itemCount = wishlistItemRepository.findByWishlistId(wishlistId).size();

        return mapToDTO(wishlist, itemCount);
    }

    @Transactional
    public void addProductToWishlist(Long userId, Long wishlistId, Long productId) {
        Cliente cliente = getClienteByUserId(userId);
        Wishlist wishlist = wishlistRepository.findByCustomerIdAndId(cliente.getId(), wishlistId)
                .orElseThrow(() -> new RuntimeException("Lista de deseos no encontrada"));

        Producto producto = productoRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Producto no encontrado"));

        // Evitar duplicados
        if (wishlistItemRepository.findByWishlistIdAndProductId(wishlistId, productId).isPresent()) {
            throw new RuntimeException("El producto ya está en la lista de deseos");
        }

        WishlistItem item = WishlistItem.builder()
                .wishlist(wishlist)
                .product(producto)
                .build();

        wishlistItemRepository.save(item);
    }

    @Transactional
    public void removeProductFromWishlist(Long userId, Long wishlistId, Long productId) {
        Cliente cliente = getClienteByUserId(userId);
        Wishlist wishlist = wishlistRepository.findByCustomerIdAndId(cliente.getId(), wishlistId)
                .orElseThrow(() -> new RuntimeException("Lista de deseos no encontrada"));

        WishlistItem item = wishlistItemRepository.findByWishlistIdAndProductId(wishlistId, productId)
                .orElseThrow(() -> new RuntimeException("Producto no está en la lista de deseos"));

        wishlistItemRepository.delete(item);
    }

    private WishlistResponseDTO mapToDTO(Wishlist wishlist, int itemCount) {
        return WishlistResponseDTO.builder()
                .id(wishlist.getId())
                .name(wishlist.getName())
                .isDefault(wishlist.getIsDefault())
                .itemCount(itemCount)
                .createdAt(wishlist.getCreatedAt())
                .build();
    }
}
