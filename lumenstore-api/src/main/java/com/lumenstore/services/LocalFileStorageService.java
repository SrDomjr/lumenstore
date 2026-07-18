package com.lumenstore.services;

import com.lumenstore.exception.BusinessRuleException;
import com.lumenstore.exception.FileStorageException;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
@ConditionalOnProperty(name = "cloudinary.enabled", havingValue = "false", matchIfMissing = true)
public class LocalFileStorageService implements FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif");

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10MB por imagen

    // Ruta configurable vía application.yml (app.upload.dir). Por defecto: "uploads"
    // relativo al directorio de trabajo, pero ahora explícita y validada al arrancar.
    @Value("${app.upload.dir:uploads}")
    private String baseUploadDir;

    private Path rootLocation;

    @PostConstruct
    public void init() {
        this.rootLocation = Paths.get(baseUploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(rootLocation);
        } catch (IOException e) {
            // Fallar rápido en el arranque si el directorio de almacenamiento
            // no se puede crear/usar, en vez de fallar silenciosamente en cada
            // request de subida.
            throw new FileStorageException(
                    "No se pudo inicializar el directorio de almacenamiento: " + rootLocation, e);
        }
    }

    @Override
    public String store(MultipartFile file, String subFolder) {
        validate(file);

        Path targetDir = rootLocation.resolve(subFolder).normalize();
        if (!targetDir.startsWith(rootLocation)) {
            // Evita path traversal si subFolder llegara a ser manipulado.
            throw new BusinessRuleException("Ruta de destino inválida.");
        }

        try {
            Files.createDirectories(targetDir);

            String safeFileName = sanitize(file.getOriginalFilename());
            String fileName = UUID.randomUUID() + "_" + safeFileName;
            Path targetPath = targetDir.resolve(fileName);

            Files.copy(file.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);

            return "/" + Paths.get(baseUploadDir, subFolder, fileName)
                    .toString()
                    .replace("\\", "/");
        } catch (IOException e) {
            // Se conserva la causa original (e) para que quede en el log completo
            // y se pueda diagnosticar el error real (permisos, disco lleno, etc).
            throw new FileStorageException(
                    "No se pudo guardar el archivo '" + file.getOriginalFilename() + "'.", e);
        }
    }

    @Override
    public String store(MultipartFile file, String subFolder, String publicId) {
        // En almacenamiento local el publicId no aplica; se delega al store básico
        return store(file, subFolder);
    }

    @Override
    public void delete(String publicId) {
        // En almacenamiento local la eliminación se maneja por ruta física.
        // Como no se usa Cloudinary, esta operación es no-op para conservar
        // compatibilidad con el contrato de la interfaz.
        // La eliminación local se maneja directamente en el controlador o servicio.
    }

    @Override
    public String extractPublicId(String imageUrl) {
        // En almacenamiento local no hay concepto de public_id.
        // Si la URL es relativa, se retorna el nombre del archivo.
        if (imageUrl == null || imageUrl.isBlank()) return null;
        int lastSlash = imageUrl.lastIndexOf('/');
        return lastSlash >= 0 ? imageUrl.substring(lastSlash + 1) : imageUrl;
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("El archivo enviado está vacío.");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new BusinessRuleException("El archivo supera el tamaño máximo permitido (10MB).");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BusinessRuleException(
                    "Tipo de archivo no permitido. Formatos aceptados: " + ALLOWED_CONTENT_TYPES);
        }
    }

    private String sanitize(String originalFilename) {
        String cleaned = StringUtils.cleanPath(
                originalFilename == null ? "archivo" : originalFilename);
        // Evita separadores de ruta y caracteres problemáticos en el nombre final.
        return cleaned.replaceAll("[\\\\/:*?\"<>|]", "_");
    }
}
