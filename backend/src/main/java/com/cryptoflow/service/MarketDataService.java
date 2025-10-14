package com.cryptoflow.service;

import com.cryptoflow.model.CryptoPair;
import com.cryptoflow.model.PriceUpdate;
import java.io.IOException;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public class MarketDataService {

    private static final List<CryptoPair> SUPPORTED_PAIRS = List.of(
            new CryptoPair("USD", "BTC"),
            new CryptoPair("USD", "ETH"),
            new CryptoPair("USD", "XRP"),
            new CryptoPair("USD", "LTC"),
            new CryptoPair("USD", "ADA"),
            new CryptoPair("USD", "SOL")
    );

    private static final Map<String, String> QUOTE_TO_BINANCE_SYMBOL = Map.ofEntries(
            Map.entry("BTC", "BTCUSDT"),
            Map.entry("ETH", "ETHUSDT"),
            Map.entry("XRP", "XRPUSDT"),
            Map.entry("LTC", "LTCUSDT"),
            Map.entry("ADA", "ADAUSDT"),
            Map.entry("SOL", "SOLUSDT")
    );

    private static final Map<String, String> BINANCE_SYMBOL_TO_QUOTE = QUOTE_TO_BINANCE_SYMBOL.entrySet()
            .stream()
            .collect(Collectors.toUnmodifiableMap(Map.Entry::getValue, Map.Entry::getKey));

    private static final List<String> DEFAULT_QUOTES = SUPPORTED_PAIRS.stream()
            .map(CryptoPair::quote)
            .toList();

    private static final String BINANCE_TICKER_URL = "https://api.binance.com/api/v3/ticker/24hr?symbols=";

    private static final Pattern TICKER_PATTERN = Pattern.compile(
            "\\{\\s*\"symbol\"\\s*:\\s*\"([^\"]+)\".*?\"lastPrice\"\\s*:\\s*\"([^\"]+)\".*?\"priceChangePercent\"\\s*:\\s*\"([^\"]+)\".*?\"closeTime\"\\s*:\\s*(\\d+).*?}",
            Pattern.DOTALL
    );

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();

    private final Map<String, PriceUpdate> lastUpdates = new ConcurrentHashMap<>();

    public List<CryptoPair> getSupportedPairs() {
        return Collections.unmodifiableList(SUPPORTED_PAIRS);
    }

    public synchronized List<PriceUpdate> nextSnapshot(List<String> requestedQuotes) {
        List<String> quotesToStream = normalizeQuotes(requestedQuotes);
        Map<String, BinanceTicker> tickers = fetchTickers(quotesToStream);
        List<PriceUpdate> updates = new ArrayList<>(quotesToStream.size());
        for (String quote : quotesToStream) {
            updates.add(createUpdate(quote, tickers.get(quote)));
        }
        return updates;
    }

    private List<String> normalizeQuotes(List<String> requestedQuotes) {
        if (requestedQuotes == null || requestedQuotes.isEmpty()) {
            return DEFAULT_QUOTES;
        }
        List<String> normalized = requestedQuotes.stream()
                .map(value -> value == null ? "" : value.trim())
                .filter(value -> !value.isEmpty())
                .map(value -> value.toUpperCase(Locale.ROOT))
                .filter(QUOTE_TO_BINANCE_SYMBOL::containsKey)
                .distinct()
                .toList();
        if (normalized.isEmpty()) {
            return DEFAULT_QUOTES;
        }
        return normalized;
    }

    private Map<String, BinanceTicker> fetchTickers(List<String> quotes) {
        if (quotes.isEmpty()) {
            return Collections.emptyMap();
        }
        List<String> symbols = new ArrayList<>(quotes.size());
        for (String quote : quotes) {
            String symbol = QUOTE_TO_BINANCE_SYMBOL.get(quote);
            if (symbol != null) {
                symbols.add(symbol);
            }
        }
        if (symbols.isEmpty()) {
            return Collections.emptyMap();
        }
        String jsonSymbols = symbols.stream()
                .map(symbol -> "\"" + symbol + "\"")
                .collect(Collectors.joining(",", "[", "]"));
        String encodedSymbols = URLEncoder.encode(jsonSymbols, StandardCharsets.UTF_8);
        URI uri = URI.create(BINANCE_TICKER_URL + encodedSymbols);
        HttpRequest request = HttpRequest.newBuilder(uri)
                .GET()
                .header("Accept", "application/json")
                .build();

        Map<String, BinanceTicker> tickers = new HashMap<>();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                return tickers;
            }
            String body = response.body();
            Matcher matcher = TICKER_PATTERN.matcher(body);
            while (matcher.find()) {
                String binanceSymbol = matcher.group(1);
                String quote = BINANCE_SYMBOL_TO_QUOTE.get(binanceSymbol);
                if (quote == null) {
                    continue;
                }
                try {
                    BigDecimal price = new BigDecimal(matcher.group(2));
                    BigDecimal changePercent = new BigDecimal(matcher.group(3));
                    long closeTime = Long.parseLong(matcher.group(4));
                    Instant timestamp = closeTime > 0 ? Instant.ofEpochMilli(closeTime) : Instant.now();
                    tickers.put(quote, new BinanceTicker(price, changePercent, timestamp));
                } catch (NumberFormatException ex) {
                    // Skip malformed entry
                }
            }
        } catch (InterruptedException interrupted) {
            Thread.currentThread().interrupt();
        } catch (IOException ignored) {
            // Network error, will fall back to last known values
        }
        return tickers;
    }

    private PriceUpdate createUpdate(String quote, BinanceTicker ticker) {
        String symbol = "USD-" + quote;
        PriceUpdate last = lastUpdates.get(symbol);
        if (ticker == null) {
            if (last != null) {
                return new PriceUpdate(symbol, last.price(), last.changePercent(), Instant.now());
            }
            BigDecimal fallbackPrice = BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP);
            return new PriceUpdate(symbol, fallbackPrice, BigDecimal.ZERO.setScale(2, RoundingMode.HALF_UP), Instant.now());
        }
        BigDecimal price = ticker.price().setScale(2, RoundingMode.HALF_UP);
        BigDecimal changePercent = ticker.changePercent().setScale(2, RoundingMode.HALF_UP);
        Instant timestamp = ticker.timestamp();
        PriceUpdate update = new PriceUpdate(symbol, price, changePercent, timestamp);
        lastUpdates.put(symbol, update);
        return update;
    }

    private record BinanceTicker(BigDecimal price, BigDecimal changePercent, Instant timestamp) {
    }
}
