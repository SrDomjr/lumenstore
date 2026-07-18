package com.lumenstore.services;

import org.springframework.web.multipart.MultipartFile;

/**
 * Abstrae el "dónde y cómo" se guardan los archivos, separando esta
 * responsabilidad de la lógica de negocio de productos (SRP).
 * <p>
 * La implementación concreta puede almacenar localmente o delegar en
 * un servicio externo como Cloudinary.
 */
public interface FileStorageService {

    /**
     * Guarda un archivo dentro de la subcarpeta indicada y retorna la URL
     * pública con la que se podrá servir dicho archivo.
     *
     * @param file      archivo recibido en el request (multipart)
     * @param subFolder subcarpeta destino, p. ej. "products/12/34"
     * @return URL pública completa, p. ej. "https://res.cloudinary.com/.../image/upload/v1/products/12/34/5_main"
     */
    String store(MultipartFile file, String subFolder);

    /**
     * Guarda un archivo con un public_id específico (útil para reemplazar
     * una imagen existente manteniendo el mismo identificador).
     *
     * @param file      archivo recibido en el request (multipart)
     * @param subFolder subcarpeta destino, p. ej. "products/12/34"
     * @param publicId  identificador único del archivo en Cloudinary
     * @return URL pública completa
     */
    String store(MultipartFile file, String subFolder, String publicId);

    /**
     * Elimina un archivo del almacenamiento usando su identificador único.
     *
     * @param publicId identificador único del archivo (incluyendo ruta de carpetas)
     */
    void delete(String publicId);

    /**
     * Obtiene el identificador único (public_id) a partir de la URL completa
     * de Cloudinary. Útil para extraer el public_id de URLs almacenadas en BD.
     *
     * @param imageUrl URL completa de Cloudinary
     * @return public_id extraído, o null si no se pudo extraer
     */
    String extractPublicId(String imageUrl);
}
