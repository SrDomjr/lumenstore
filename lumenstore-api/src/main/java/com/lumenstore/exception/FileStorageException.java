package com.lumenstore.exception;

/**
 * Excepción específica para fallos del subsistema de almacenamiento de archivos
 * (creación de directorios, escritura en disco, permisos, etc).
 *
 * Se distingue de un RuntimeException genérico para poder:
 *  - Mapearla a un código HTTP apropiado (500) con un mensaje claro para el cliente.
 *  - Conservar SIEMPRE la excepción original como causa, para no perder el
 *    stacktrace real en los logs del servidor.
 */
public class FileStorageException extends RuntimeException {

    public FileStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
