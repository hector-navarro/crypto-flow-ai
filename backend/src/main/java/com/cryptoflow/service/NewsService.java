package com.cryptoflow.service;

import com.cryptoflow.model.NewsEvent;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.UUID;

public class NewsService {

    private final List<Headline> headlines = List.of(
            new Headline(
                    "Bitcoin alcanza nuevo máximo trimestral",
                    "El precio de BTC supera los 65k impulsado por el interés institucional.",
                    "Crypto Insights"
            ),
            new Headline(
                    "Ethereum se prepara para próxima actualización",
                    "Los desarrolladores anuncian mejoras de escalabilidad en la red principal.",
                    "DeFi Journal"
            ),
            new Headline(
                    "Solana integra más proyectos DeFi",
                    "Nuevas plataformas aprovechan las bajas comisiones para lanzar productos innovadores.",
                    "Solana Daily"
            ),
            new Headline(
                    "Reguladores discuten marcos comunes",
                    "Países del G20 buscan coordinarse para supervisar el mercado cripto.",
                    "G20 Watch"
            )
    );

    private final Random random = new Random();

    public List<NewsEvent> randomBatch() {
        int batchSize = Math.max(1, random.nextInt(headlines.size()));
        List<Headline> shuffled = new ArrayList<>(headlines);
        Collections.shuffle(shuffled, random);
        return shuffled.stream()
                .limit(batchSize)
                .map(this::mapToEvent)
                .toList();
    }

    private NewsEvent mapToEvent(Headline headline) {
        return new NewsEvent(
                UUID.randomUUID().toString(),
                headline.title(),
                headline.summary(),
                headline.source(),
                Instant.now()
        );
    }

    private record Headline(String title, String summary, String source) {
    }
}
