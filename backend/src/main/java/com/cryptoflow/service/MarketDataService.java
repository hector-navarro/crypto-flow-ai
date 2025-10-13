package com.cryptoflow.service;

import com.cryptoflow.model.CryptoPair;
import com.cryptoflow.model.PriceUpdate;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

public class MarketDataService {

    private static final List<CryptoPair> SUPPORTED_PAIRS = List.of(
            new CryptoPair("USD", "BTC"),
            new CryptoPair("USD", "ETH"),
            new CryptoPair("USD", "XRP"),
            new CryptoPair("USD", "LTC"),
            new CryptoPair("USD", "ADA"),
            new CryptoPair("USD", "SOL")
    );

    private final Map<String, BigDecimal> lastPrices = new ConcurrentHashMap<>();
    private final Random random = new Random();

    public MarketDataService() {
        lastPrices.put("USD-BTC", BigDecimal.valueOf(64000));
        lastPrices.put("USD-ETH", BigDecimal.valueOf(3200));
        lastPrices.put("USD-XRP", BigDecimal.valueOf(0.55));
        lastPrices.put("USD-LTC", BigDecimal.valueOf(85));
        lastPrices.put("USD-ADA", BigDecimal.valueOf(0.72));
        lastPrices.put("USD-SOL", BigDecimal.valueOf(155));
    }

    public List<CryptoPair> getSupportedPairs() {
        return Collections.unmodifiableList(SUPPORTED_PAIRS);
    }

    public synchronized List<PriceUpdate> nextSnapshot(List<String> requestedQuotes) {
        List<String> quotesToStream = requestedQuotes.isEmpty() ? SUPPORTED_PAIRS.stream()
                .map(CryptoPair::quote)
                .toList() : requestedQuotes;
        List<PriceUpdate> updates = new ArrayList<>(quotesToStream.size());
        for (String quote : quotesToStream) {
            updates.add(nextUpdateForQuote(quote));
        }
        return updates;
    }

    public synchronized PriceUpdate nextUpdateForQuote(String quote) {
        String symbol = "USD-" + quote;
        BigDecimal lastPrice = lastPrices.getOrDefault(symbol, BigDecimal.valueOf(100));
        double changePercent = (random.nextDouble() - 0.5) * 2.0; // -1% to +1%
        BigDecimal delta = BigDecimal.valueOf(changePercent).setScale(2, RoundingMode.HALF_UP);
        BigDecimal multiplier = BigDecimal.ONE.add(delta.movePointLeft(2));
        BigDecimal updatedPrice = lastPrice.multiply(multiplier).setScale(2, RoundingMode.HALF_UP);
        lastPrices.put(symbol, updatedPrice);
        return new PriceUpdate(symbol, updatedPrice, delta, Instant.now());
    }
}
