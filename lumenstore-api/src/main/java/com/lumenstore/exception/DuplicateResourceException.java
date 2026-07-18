package com.lumenstore.exception;

/**
 * Se lanza cuando se intenta crear/actualizar un recurso violando una regla de unicidad
 * del negocio (SKU duplicado, slug duplicado, nombre de marca/categoría duplicado, etc.).
 * El GlobalExceptionHandler la traduce a HTTP 409 (Conflict).
 */
public class DuplicateResourceException extends RuntimeException {
    public DuplicateResourceException(String message) {
        super(message);
    }
}
