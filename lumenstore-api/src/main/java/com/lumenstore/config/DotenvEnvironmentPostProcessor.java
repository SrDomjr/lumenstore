package com.lumenstore.config;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.env.EnvironmentPostProcessor;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;

/**
 * Carga el archivo .env desde la raiz del proyecto como fuente de propiedades
 * de Spring Boot, incluso antes de que se procesen las definiciones de beans.
 * <p>
 * Busca el .env en tres ubicaciones (en orden):
 * <ol>
 *   <li>Raiz del proyecto (si existe {@code pom.xml} o {@code build.gradle})</li>
 *   <li>Directorio de trabajo actual</li>
 *   <li>Directorio padre del working directory</li>
 * </ol>
 */
public class DotenvEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        Path envPath = findEnvFile();
        if (envPath == null) {
            return;
        }

        Map<String, Object> properties = parseEnvFile(envPath);
        if (!properties.isEmpty()) {
            environment.getPropertySources().addFirst(
                    new MapPropertySource("dotenv", properties));
        }
    }

    private Path findEnvFile() {
        Path cwd = Paths.get("").toAbsolutePath();

        // Buscar en directorio actual y padres hasta 3 niveles
        Path searchDir = cwd;
        for (int i = 0; i < 4; i++) {
            Path candidate = searchDir.resolve(".env");
            if (Files.exists(candidate) && Files.isRegularFile(candidate)) {
                return candidate;
            }
            searchDir = searchDir.getParent();
            if (searchDir == null) break;
        }
        return null;
    }

    private Map<String, Object> parseEnvFile(Path path) {
        Map<String, Object> properties = new HashMap<>();
        try (InputStream is = Files.newInputStream(path);
             BufferedReader reader = new BufferedReader(new InputStreamReader(is))) {

            String line;
            while ((line = reader.readLine()) != null) {
                line = line.trim();
                if (line.isEmpty() || line.startsWith("#")) continue;

                int eqIndex = line.indexOf('=');
                if (eqIndex <= 0) continue;

                String key = line.substring(0, eqIndex).trim();
                String value = line.substring(eqIndex + 1).trim();

                // Remover comillas si las tiene
                if ((value.startsWith("\"") && value.endsWith("\"")) ||
                    (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length() - 1);
                }

                properties.put(key, value);
            }
        } catch (IOException e) {
            // Silenciar si no se puede leer
        }
        return properties;
    }
}
