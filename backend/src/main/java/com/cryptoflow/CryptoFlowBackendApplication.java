package com.cryptoflow;

import com.cryptoflow.http.NewsStreamHandler;
import com.cryptoflow.http.PriceListHandler;
import com.cryptoflow.http.PriceStreamHandler;
import com.cryptoflow.service.MarketDataService;
import com.cryptoflow.service.NewsService;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;

public final class CryptoFlowBackendApplication {

    private CryptoFlowBackendApplication() {
    }

    public static void main(String[] args) throws IOException {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        HttpServer server = HttpServer.create(new InetSocketAddress(port), 0);
        server.setExecutor(Executors.newCachedThreadPool());

        MarketDataService marketDataService = new MarketDataService();
        NewsService newsService = new NewsService();

        server.createContext("/api/prices", new PriceListHandler(marketDataService));
        server.createContext("/api/prices/stream", new PriceStreamHandler(marketDataService));
        server.createContext("/api/news/stream", new NewsStreamHandler(newsService));

        server.start();
        System.out.printf("Crypto Flow backend running on http://localhost:%d%n", port);
    }
}
