package com.cryptoflow.http;

import com.cryptoflow.model.CryptoPair;
import com.cryptoflow.service.MarketDataService;
import com.cryptoflow.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.OutputStream;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.stream.Collectors;

public class PriceListHandler implements HttpHandler {

    private final MarketDataService marketDataService;

    public PriceListHandler(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        addCorsHeaders(exchange);
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
            return;
        }
        if (!"GET".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(405, -1);
            exchange.close();
            return;
        }
        List<CryptoPair> pairs = marketDataService.getSupportedPairs();
        String body = pairs.stream()
                .map(pair -> String.format("{\"base\":\"%s\",\"quote\":\"%s\",\"label\":\"%s\"}",
                        JsonUtil.escape(pair.base()),
                        JsonUtil.escape(pair.quote()),
                        JsonUtil.escape(pair.label())))
                .collect(Collectors.joining(",", "[", "]"));
        byte[] response = body.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().set("Content-Type", "application/json; charset=UTF-8");
        exchange.sendResponseHeaders(200, response.length);
        try (OutputStream output = exchange.getResponseBody()) {
            output.write(response);
        }
    }

    private void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }
}
