package com.lumenstore.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Configura el SDK de Cloudinary.
 * <p>
 * Este bean solo se crea si la propiedad {@code cloudinary.enabled=true}.
 * Si está deshabilitada, la aplicación usará almacenamiento local.
 */
@Slf4j
@Configuration
@ConditionalOnProperty(name = "cloudinary.enabled", havingValue = "true")
public class CloudinaryConfig {

    private final String cloudName;
    private final String apiKey;
    private final String apiSecret;

    public CloudinaryConfig(
            @org.springframework.beans.factory.annotation.Value("${cloudinary.cloud-name}") String cloudName,
            @org.springframework.beans.factory.annotation.Value("${cloudinary.api-key}") String apiKey,
            @org.springframework.beans.factory.annotation.Value("${cloudinary.api-secret}") String apiSecret) {
        this.cloudName = cloudName;
        this.apiKey = apiKey;
        this.apiSecret = apiSecret;
    }

    @Bean
    public Cloudinary cloudinary() {
        log.info("Inicializando SDK de Cloudinary (cloud_name={})", cloudName);
        @SuppressWarnings("unchecked")
        Map<String, String> config = ObjectUtils.asMap(
                "cloud_name", cloudName,
                "api_key", apiKey,
                "api_secret", apiSecret,
                "secure", true
        );
        return new Cloudinary(config);
    }
}