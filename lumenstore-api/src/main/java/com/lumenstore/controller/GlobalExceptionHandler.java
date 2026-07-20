package com.lumenstore.controller;

import com.lumenstore.dto.ErrorResponseDTO;
import com.lumenstore.exception.BusinessRuleException;
import com.lumenstore.exception.DuplicateResourceException;
import com.lumenstore.exception.FileStorageException;
import com.lumenstore.exception.ResourceNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpStatusCode;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.servlet.mvc.method.annotation.ResponseEntityExceptionHandler;

import java.util.List;

@RestControllerAdvice
public class GlobalExceptionHandler extends ResponseEntityExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // ─── Errores de negocio específicos (deben ir ANTES del RuntimeException genérico) ───

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorResponseDTO> handleNotFound(ResourceNotFoundException ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponseDTO> handleDuplicate(DuplicateResourceException ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponseDTO> handleBusinessRule(BusinessRuleException ex) {
        ErrorResponseDTO response = new ErrorResponseDTO(ex.getMessage(), null);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(response);
    }

    @ExceptionHandler(com.lumenstore.exception.FileStorageException.class)
    public ResponseEntity<ErrorResponseDTO> handleFileStorage(com.lumenstore.exception.FileStorageException ex) {
        // Se loguea con la causa completa (ex.getCause()) para poder diagnosticar
        // el error real de disco/permisos, en vez de perderlo como antes.
        log.error("Error de almacenamiento de archivos: {}", ex.getMessage(), ex.getCause());
        ErrorResponseDTO response = new ErrorResponseDTO(
                "No se pudo guardar el archivo en el servidor. Intente nuevamente.", null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleDataIntegrity(DataIntegrityViolationException ex) {
        log.warn("Violación de integridad de datos: {}", ex.getMessage());
        ErrorResponseDTO response = new ErrorResponseDTO(
                "La operación no pudo completarse porque el dato ya existe o está siendo usado por otro registro.",
                null);
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponseDTO> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("Validación fallida: {}", ex.getMessage());
        ErrorResponseDTO response = new ErrorResponseDTO(ex.getMessage(), null);
        return ResponseEntity.badRequest().body(response);
    }

    // ─── Fallback genérico: cualquier otro RuntimeException no controlado ───

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ErrorResponseDTO> handleRuntimeException(RuntimeException ex) {
        log.error("Unexpected error: {}", ex.getMessage(), ex);
        ErrorResponseDTO response = new ErrorResponseDTO(
                "Ha ocurrido un error inesperado. Intente nuevamente.", null);
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    @Override
    protected ResponseEntity<Object> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpHeaders headers,
            HttpStatusCode status,
            WebRequest request) {

        List<ErrorResponseDTO.FieldErrorDTO> fieldErrors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> new ErrorResponseDTO.FieldErrorDTO(
                        fieldError.getField(),
                        fieldError.getDefaultMessage()))
                .toList();

        ErrorResponseDTO response = new ErrorResponseDTO("Error de validación", fieldErrors);
        return ResponseEntity.badRequest().body(response);
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponseDTO> handleConstraintViolation(ConstraintViolationException ex) {
        List<ErrorResponseDTO.FieldErrorDTO> fieldErrors = ex.getConstraintViolations().stream()
                .map(this::mapViolation)
                .toList();

        ErrorResponseDTO response = new ErrorResponseDTO("Error de validación", fieldErrors);
        return ResponseEntity.badRequest().body(response);
    }

    private ErrorResponseDTO.FieldErrorDTO mapViolation(ConstraintViolation<?> violation) {
        String field = violation.getPropertyPath().toString();
        return new ErrorResponseDTO.FieldErrorDTO(field, violation.getMessage());
    }
}