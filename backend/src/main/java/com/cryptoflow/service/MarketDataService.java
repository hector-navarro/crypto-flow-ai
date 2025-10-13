package com.cryptoflow.service;

import com.cryptoflow.model.PriceUpdate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class MarketDataService {

    private static final List<String> SUPPORTED_PAIRS = List.of(
            "BTC-USD",
            "ETH-USD",
            "XRP-USD",
            "LTC-USD",
            "ADA-USD",
            "SOL-USD"
    );

    private final Map<String, BigDecimal> lastPrices = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public MarketDataService() {
        lastPrices.put("BTC-USD", BigDecimal.valueOf(64000));
        lastPrices.put("ETH-USD", BigDecimal.valueOf(3200));
        lastPrices.put("XRP-USD", BigDecimal.valueOf(0.55));
        lastPrices.put("LTC-USD", BigDecimal.valueOf(85));
        lastPrices.put("ADA-USD", BigDecimal.valueOf(0.72));
        lastPrices.put("SOL-USD", BigDecimal.valueOf(155));
    }

    public List<String> getSupportedPairs() {
        return SUPPORTED_PAIRS;
    }

    public Flux<PriceUpdate> streamPriceUpdates() {
        return Flux.interval(Duration.ofSeconds(1))
                .flatMap(tick -> Flux.fromIterable(SUPPORTED_PAIRS)
                        .map(this::nextUpdateForPair));
    }

    private PriceUpdate nextUpdateForPair(String pair) {
        BigDecimal lastPrice = lastPrices.get(pair);
        double changePercent = (random.nextDouble() - 0.5) * 2.0; // -1% to +1%
        BigDecimal delta = BigDecimal.valueOf(changePercent).setScale(2, RoundingMode.HALF_UP);
        BigDecimal multiplier = BigDecimal.ONE.add(delta.movePointLeft(2));
        BigDecimal updatedPrice = lastPrice.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        lastPrices.put(pair, updatedPrice);
        return new PriceUpdate(pair, updatedPrice, delta, Instant.now());
    }
}
