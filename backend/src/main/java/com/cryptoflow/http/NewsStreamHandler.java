package com.cryptoflow.http;

import com.cryptoflow.model.NewsEvent;
import com.cryptoflow.service.NewsService;
import com.cryptoflow.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.nio.charset.StandardCharsets;
import java.util.List;

public class NewsStreamHandler implements HttpHandler {

    private final NewsService newsService;

    public NewsStreamHandler(NewsService newsService) {
        this.newsService = newsService;
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
        exchange.getResponseHeaders().set("Content-Type", "text/event-stream; charset=UTF-8");
        exchange.getResponseHeaders().set("Cache-Control", "no-cache");
        exchange.getResponseHeaders().set("Connection", "keep-alive");
        exchange.sendResponseHeaders(200, 0);
        try (Writer writer = new OutputStreamWriter(exchange.getResponseBody(), StandardCharsets.UTF_8)) {
            while (true) {
                List<NewsEvent> events = newsService.randomBatch();
                String payload = events.stream()
                        .map(event -> String.format(
                                "{\"id\":\"%s\",\"title\":\"%s\",\"summary\":\"%s\",\"source\":\"%s\",\"publishedAt\":\"%s\"}",
                                JsonUtil.escape(event.id()),
                                JsonUtil.escape(event.title()),
                                JsonUtil.escape(event.summary()),
                                JsonUtil.escape(event.source()),
                                JsonUtil.escape(event.publishedAt().toString())
                        ))
                        .collect(java.util.stream.Collectors.joining(",", "[", "]"));
                writer.write("data: ");
                writer.write(payload);
                writer.write("\n\n");
                writer.flush();
                try {
                    Thread.sleep(5000);
                } catch (InterruptedException interrupted) {
                    Thread.currentThread().interrupt();
                    break;
                }
            }
        } catch (IOException ex) {
            // client disconnected
        } finally {
            exchange.close();
        }
    }

    private void addCorsHeaders(HttpExchange exchange) {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
    }
}
