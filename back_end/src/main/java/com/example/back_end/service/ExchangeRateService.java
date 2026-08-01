package com.example.back_end.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicReference;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class ExchangeRateService {

    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newHttpClient();
    private final AtomicReference<CachedRate> cache = new AtomicReference<>();

    @Value("${exchange.usd-vnd.provider-url:}")
    private String providerUrl;

    @Value("${exchange.usd-vnd.cache-ttl-seconds:600}")
    private long cacheTtlSeconds;

    @Value("${exchange.usd-vnd.fallback:25000}")
    private BigDecimal fallbackRate;

    public BigDecimal getUsdToVnd() {
        CachedRate cached = cache.get();
        Instant now = Instant.now();
        if (cached != null && cached.expiresAt().isAfter(now)) {
            return cached.rate();
        }

        try {
            BigDecimal rate = fetchUsdToVnd();
            cache.set(new CachedRate(rate, now.plusSeconds(Math.max(60, cacheTtlSeconds))));
            return rate;
        } catch (RuntimeException ex) {
            log.warn("USD→VND rate fetch failed, using fallback {}: {}", fallbackRate, ex.getMessage());
            if (cached != null) {
                return cached.rate();
            }
            return fallbackRate.max(BigDecimal.ONE);
        }
    }

    private BigDecimal fetchUsdToVnd() {
        String url = (providerUrl == null || providerUrl.isBlank())
                ? "https://open.er-api.com/v6/latest/USD"
                : providerUrl.trim();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                throw new IllegalStateException("Exchange rate provider HTTP " + response.statusCode());
            }

            JsonNode root = objectMapper.readTree(response.body());
            JsonNode vnd = root.path("rates").path("VND");
            if (!vnd.isNumber()) {
                throw new IllegalStateException("Exchange rate response missing rates.VND");
            }

            BigDecimal rate = vnd.decimalValue();
            if (rate.compareTo(BigDecimal.ONE) < 0) {
                throw new IllegalStateException("Invalid USD→VND rate: " + rate);
            }
            return rate;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Exchange rate fetch interrupted", e);
        } catch (Exception e) {
            throw new IllegalStateException("Cannot fetch USD→VND rate", e);
        }
    }

    private record CachedRate(BigDecimal rate, Instant expiresAt) {}
}
