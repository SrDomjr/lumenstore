package com.lumenstore.exception;

/**
 * Se lanza cuando una operación es válida en forma (los datos tienen el tipo correcto)
 * pero viola una regla de negocio del catálogo (por ejemplo: eliminar una categoría que
 * todavía tiene productos activos, o guardar un producto sin ninguna variante con precio).
 * El GlobalExceptionHandler la traduce a HTTP 422 (Unprocessable Entity).
 */
public class BusinessRuleException extends RuntimeException {
    public BusinessRuleException(String message) {
        super(message);
    }
}
