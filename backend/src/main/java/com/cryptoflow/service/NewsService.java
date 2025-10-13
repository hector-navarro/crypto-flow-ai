package com.cryptoflow.service;

import com.cryptoflow.model.NewsEvent;
import java.net.URI;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

@Service
public class NewsService {

    private final List<Headline> headlines = List.of(
            new Headline(
                    "Bitcoin alcanza nuevo máximo trimestral",
                    "El precio de BTC supera los 65k impulsado por el interés institucional.",
                    URI.create("https://example.com/news/bitcoin-all-time-high")
            ),
            new Headline(
                    "Ethereum se prepara para próxima actualización",
                    "Los desarrolladores anuncian mejoras de escalabilidad en la red principal.",
                    URI.create("https://example.com/news/ethereum-upgrade")
            ),
            new Headline(
                    "Solana integra más proyectos DeFi",
                    "Nuevas plataformas aprovechan las bajas comisiones para lanzar productos innovadores.",
                    URI.create("https://example.com/news/solana-defi")
            ),
            new Headline(
                    "Reguladores discuten marcos comunes",
                    "Países del G20 buscan coordinarse para supervisar el mercado cripto.",
                    URI.create("https://example.com/news/regulators")
            )
    );

    public Flux<NewsEvent> streamNews() {
        return Flux.interval(Duration.ofSeconds(8))
                .map(this::mapToEvent);
    }

    private NewsEvent mapToEvent(long index) {
        Headline headline = headlines.get((int) (index % headlines.size()));
        return new NewsEvent(
                UUID.randomUUID().toString(),
                headline.title(),
                headline.summary(),
                headline.url(),
                Instant.now()
        );
    }

    private record Headline(String title, String summary, URI url) {
    }
}
