package vn.eyevora.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;

import java.util.Arrays;
import java.util.List;

@Configuration
public class CorsConfig {

    @Bean
    public CorsFilter corsFilter() {
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        CorsConfiguration config = new CorsConfiguration();

        // Cho phép frontend ở cổng 5173 truy cập
        config.setAllowedOrigins(List.of("http://localhost:5173"));
        config.setAllowCredentials(true); // Cho phép gửi cookie/token

        // Cho phép tất cả các loại Header và Method cơ bản
        config.setAllowedHeaders(Arrays.asList("Origin", "Content-Type", "Accept", "Authorization", "X-Requested-With"));
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));

        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}