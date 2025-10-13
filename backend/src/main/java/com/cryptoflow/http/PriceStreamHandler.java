package com.cryptoflow.http;

import com.cryptoflow.model.PriceUpdate;
import com.cryptoflow.service.MarketDataService;
import com.cryptoflow.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

public class PriceStreamHandler implements HttpHandler {

    private final MarketDataService marketDataService;

    public PriceStreamHandler(MarketDataService marketDataService) {
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
        List<String> requestedQuotes = parseQuotes(exchange.getRequestURI().getRawQuery());
        exchange.getResponseHeaders().set("Content-Type", "text/event-stream; charset=UTF-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-cache");
        exchange.getResponseHeaders().set("Connection", "keep-alive");
        exchange.sendResponseHeaders(200, 0);
        try (Writer writer = new OutputStreamWriter(exchange.getResponseBody(), StandardCharsets.UTF_8)) {
            while (true) {
                List<PriceUpdate> updates = marketDataService.nextSnapshot(requestedQuotes);
                for (PriceUpdate update : updates) {
                    String payload = String.format(
                            "{\"symbol\":\"%s\",\"price\":%s,\"changePercent\":%s,\"timestamp\":\"%s\"}",
                            JsonUtil.escape(update.symbol()),
                            update.price().toPlainString(),
                            update.changePercent().toPlainString(),
                            JsonUtil.escape(update.timestamp().toString())
                    );
                    writer.write("data: ");
                    writer.write(payload);
                    writer.write("\n\n");
                }
                writer.flush();
                try {
                    Thread.sleep(1000);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        } catch (IOException ex) {
            // client disconnected, nothing to do
        } finally {
            exchange.close();
        }
    }

    private List<String> parseQuotes(String rawQuery) {
        if (rawQuery == null || rawQuery.isBlank()) {
            return List.of();
        }
        String[] params = rawQuery.split("&");
        Set<String> quotes = new LinkedHashSet<>();
        for (String param : params) {
            int idx = param.indexOf('=');
            if (idx <= 0) {
                continue;
            }
            String name = param.substring(0, idx);
            if (!"quotes".equals(name)) {
                continue;
            }
            String value = param.substring(idx + 1);
            if (value.isEmpty()) {
                continue;
            }
            String decoded = URLDecoder.decode(value, StandardCharsets.UTF_8);
            if (!decoded.isBlank()) {
                quotes.add(decoded);
            }
        }
        return new ArrayList<>(quotes);
    }

    private void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }
}
