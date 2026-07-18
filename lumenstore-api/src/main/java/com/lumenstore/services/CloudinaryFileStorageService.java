package com.lumenstore.services;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import com.lumenstore.exception.BusinessRuleException;
import com.lumenstore.exception.FileStorageException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import java.util.Set;

/**
 * Implementación de {@link FileStorageService} que delega todo el almacenamiento
 * de imágenes a Cloudinary, liberando al servidor local de procesamiento y
 * almacenamiento físico.
 * <p>
 * Esta implementación se activa únicamente cuando la propiedad
 * {@code cloudinary.enabled=true} está presente en la configuración.
 * Si no está habilitada, se usará {@link LocalFileStorageService} como fallback.
 * <p>
 * Características:
 * <ul>
 *   <li>Subida directa a Cloudinary usando su SDK HTTP</li>
 *   <li>Estructura de carpetas segmentada: {@code products/XX/YY/ZZ_main}</li>
 *   <li>Eliminación remota mediante {@code uploader.destroy(publicId)}</li>
 *   <li>Validación de tipos y tamaño antes de la subida</li>
 * </ul>
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "cloudinary.enabled", havingValue = "true")
public class CloudinaryFileStorageService implements FileStorageService {

    private static final Set<String> ALLOWED_CONTENT_TYPES =
            Set.of("image/jpeg", "image/png", "image/webp", "image/gif", "image/avif");

    private static final long MAX_FILE_SIZE_BYTES = 10L * 1024 * 1024; // 10 MB

    private final Cloudinary cloudinary;

    @Value("${cloudinary.folder-prefix:lumenstore}")
    private String folderPrefix;

    @Override
    public String store(MultipartFile file, String subFolder) {
        validate(file);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folderPrefix + "/" + subFolder,
                            "use_filename", true,
                            "unique_filename", true,
                            "overwrite", false,
                            "resource_type", "image"
                    )
            );

            String publicId = (String) uploadResult.get("public_id");
            String url = (String) uploadResult.get("secure_url");

            log.debug("Imagen subida a Cloudinary: public_id={}, url={}", publicId, url);
            return url;
        } catch (IOException e) {
            throw new FileStorageException(
                    "No se pudo subir la imagen '" + file.getOriginalFilename() + "' a Cloudinary.", e);
        }
    }

    @Override
    public String store(MultipartFile file, String subFolder, String publicId) {
        validate(file);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> uploadResult = cloudinary.uploader().upload(
                    file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folderPrefix + "/" + subFolder,
                            "public_id", publicId,
                            "overwrite", true,
                            "resource_type", "image"
                    )
            );

            String url = (String) uploadResult.get("secure_url");

            log.debug("Imagen reemplazada en Cloudinary: public_id={}/{}, url={}", subFolder, publicId, url);
            return url;
        } catch (IOException e) {
            throw new FileStorageException(
                    "No se pudo reemplazar la imagen '" + file.getOriginalFilename() + "' en Cloudinary.", e);
        }
    }

    @Override
    public void delete(String publicId) {
        if (publicId == null || publicId.isBlank()) return;

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = cloudinary.uploader().destroy(
                    publicId,
                    ObjectUtils.emptyMap()
            );

            String resultStatus = (String) result.get("result");
            log.debug("Eliminación en Cloudinary: public_id={}, resultado={}", publicId, resultStatus);
        } catch (IOException e) {
            log.error("Error al eliminar imagen de Cloudinary: public_id={}", publicId, e);
            // No lanzamos excepción para no interrumpir el flujo de negocio
            // si la imagen ya no existe en Cloudinary o hay un error de red.
        }
    }

    @Override
    public String extractPublicId(String imageUrl) {
        if (imageUrl == null || imageUrl.isBlank()) return null;

        // Las URLs de Cloudinary tienen el formato:
        // https://res.cloudinary.com/<cloud_name>/image/upload/v<version>/<folder>/<public_id>.<ext>
        // El public_id incluye la ruta de carpetas relativa y el nombre sin extensión.
        try {
            // Buscar "/upload/" en la URL y tomar todo después de la versión (v123456)
            String uploadMarker = "/upload/";
            int uploadIdx = imageUrl.indexOf(uploadMarker);
            if (uploadIdx == -1) return null;

            String afterUpload = imageUrl.substring(uploadIdx + uploadMarker.length());

            // Remover el prefijo de versión (ej: "v1234567/")
            if (afterUpload.startsWith("v")) {
                int nextSlash = afterUpload.indexOf('/');
                if (nextSlash != -1) {
                    afterUpload = afterUpload.substring(nextSlash + 1);
                }
            }

            // Remover la extensión del archivo
            int extDot = afterUpload.lastIndexOf('.');
            if (extDot != -1) {
                afterUpload = afterUpload.substring(0, extDot);
            }

            return afterUpload;
        } catch (Exception e) {
            log.warn("No se pudo extraer public_id de la URL: {}", imageUrl);
            return null;
        }
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
}