package com.lumenstore.exception;

/**
 * Se lanza cuando un recurso solicitado (producto, categoría, marca, variante, etc.)
 * no existe. El GlobalExceptionHandler la traduce a HTTP 404.
 */
public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String message) {
        super(message);
    }

    public static ResourceNotFoundException of(String entity, Object id) {
        return new ResourceNotFoundException(entity + " no encontrado(a) con id: " + id);
    }
}
