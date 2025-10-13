package com.cryptoflow.crypto.backend.service;

import com.cryptoflow.crypto.backend.model.CryptoPair;
import com.cryptoflow.crypto.backend.model.PricePoint;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ThreadLocalRandom;
import java.util.stream.Collectors;

@Service
public class PriceStreamService {

    private final Map<String, CryptoPair> supportedPairs = new ConcurrentHashMap<>();
    private final Map<String, BigDecimal> referencePrices = new ConcurrentHashMap<>();

    @PostConstruct
    void initPairs() {
        List.of(
                new CryptoPair("USD", "BTC", "USD / Bitcoin"),
                new CryptoPair("USD", "ETH", "USD / Ethereum"),
                new CryptoPair("USD", "SOL", "USD / Solana"),
                new CryptoPair("USD", "ADA", "USD / Cardano"),
                new CryptoPair("USD", "XRP", "USD / XRP"),
                new CryptoPair("USD", "DOGE", "USD / Dogecoin"),
                new CryptoPair("USD", "DOT", "USD / Polkadot"),
                new CryptoPair("USD", "MATIC", "USD / Polygon"),
                new CryptoPair("USD", "LTC", "USD / Litecoin")
        ).forEach(pair -> {
            String symbol = symbol(pair);
            supportedPairs.put(symbol, pair);
            referencePrices.put(symbol, randomBasePrice(pair.quote()));
        });
    }

    public List<CryptoPair> getSupportedPairs() {
        return supportedPairs.values().stream()
                .sorted((a, b) -> a.quote().compareToIgnoreCase(b.quote()))
                .toList();
    }

    public Flux<PricePoint> streamFor(List<String> quotes) {
        List<String> normalized = quotes == null || quotes.isEmpty()
                ? supportedPairs.keySet().stream().limit(6).toList()
                : quotes.stream()
                .map(String::toUpperCase)
                .filter(supportedPairs::containsKey)
                .limit(6)
                .collect(Collectors.toList());

        if (normalized.isEmpty()) {
            normalized = supportedPairs.keySet().stream().limit(6).toList();
        }

        List<String> finalNormalized = normalized;
        return Flux.interval(Duration.ofSeconds(2))
                .flatMap(tick -> Flux.fromIterable(finalNormalized))
                .map(symbol -> createPricePoint(symbol, referencePrices.computeIfAbsent(symbol, this::fallbackBasePrice)));
    }

    private PricePoint createPricePoint(String symbol, BigDecimal base) {
        BigDecimal delta = randomPercentChange();
        BigDecimal updated = base.multiply(BigDecimal.ONE.add(delta.divide(BigDecimal.valueOf(100), 6, RoundingMode.HALF_UP)));
        referencePrices.put(symbol, updated);

        return new PricePoint(
                symbol,
                updated.setScale(2, RoundingMode.HALF_UP),
                delta.setScale(2, RoundingMode.HALF_UP),
                Instant.now()
        );
    }

    private BigDecimal randomPercentChange() {
        double change = ThreadLocalRandom.current().nextDouble(-1.5, 1.5);
        return BigDecimal.valueOf(change);
    }

    private BigDecimal randomBasePrice(String quote) {
        return switch (quote) {
            case "BTC" -> BigDecimal.valueOf(65000 + ThreadLocalRandom.current().nextDouble(-2000, 2000));
            case "ETH" -> BigDecimal.valueOf(3200 + ThreadLocalRandom.current().nextDouble(-200, 200));
            case "SOL" -> BigDecimal.valueOf(150 + ThreadLocalRandom.current().nextDouble(-15, 15));
            case "ADA" -> BigDecimal.valueOf(1.2 + ThreadLocalRandom.current().nextDouble(-0.2, 0.2));
            case "XRP" -> BigDecimal.valueOf(0.65 + ThreadLocalRandom.current().nextDouble(-0.1, 0.1));
            case "DOGE" -> BigDecimal.valueOf(0.18 + ThreadLocalRandom.current().nextDouble(-0.05, 0.05));
            case "DOT" -> BigDecimal.valueOf(8 + ThreadLocalRandom.current().nextDouble(-2, 2));
            case "MATIC" -> BigDecimal.valueOf(1.1 + ThreadLocalRandom.current().nextDouble(-0.2, 0.2));
            case "LTC" -> BigDecimal.valueOf(95 + ThreadLocalRandom.current().nextDouble(-10, 10));
            default -> fallbackBasePrice(quote);
        };
    }

    private BigDecimal fallbackBasePrice(String symbol) {
        return BigDecimal.valueOf(50 + ThreadLocalRandom.current().nextDouble(-5, 5));
    }

    private String symbol(CryptoPair pair) {
        return pair.base() + "-" + pair.quote();
    }
}
