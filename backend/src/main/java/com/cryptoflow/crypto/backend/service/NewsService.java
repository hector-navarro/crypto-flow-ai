package com.cryptoflow.crypto.backend.service;

import com.cryptoflow.crypto.backend.model.NewsItem;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.UUID;

@Service
public class NewsService {

    private final Deque<NewsItem> rotatingNews = new ArrayDeque<>();

    @PostConstruct
    void init() {
        rotatingNews.addAll(List.of(
                create("Bitcoin alcanza nuevo máximo semanal", "El precio de Bitcoin rebota impulsado por nuevas entradas institucionales."),
                create("Ethereum implementa actualización de escalabilidad", "La comunidad celebra la mejora en tiempos de transacción y tarifas más bajas."),
                create("Solana impulsa el ecosistema DeFi", "Protocolos emergentes anuncian liquidez récord y nuevas asociaciones."),
                create("Dogecoin vuelve a escena", "La criptomoneda meme registra un incremento de actividad social y comercial."),
                create("Regulación cripto en foco", "Gobiernos anuncian lineamientos para stablecoins y tokens de seguridad."),
                create("Nuevas inversiones institucionales", "Fondos tradicionales diversifican portafolios con activos digitales."),
                create("Polygon lanza campaña ecológica", "Iniciativas para compensar la huella de carbono en el ecosistema Web3."),
                create("Cardano anuncia roadmap 2025", "Enfoque en gobernanza, interoperabilidad y adopción empresarial."),
                create("XRP expande su red de pagos", "Alianzas con bancos regionales impulsan la adopción transfronteriza.")
        ));
    }

    public List<NewsItem> latestNews(int limit) {
        return rotatingNews.stream().limit(limit).toList();
    }

    public Flux<List<NewsItem>> streamNews() {
        return Flux.interval(Duration.ofSeconds(15))
                .map(tick -> rotate())
                .startWith(rotatingNews.stream().limit(5).toList());
    }

    private List<NewsItem> rotate() {
        NewsItem first = rotatingNews.pollFirst();
        if (first != null) {
            rotatingNews.offerLast(create(first.title(), first.summary()));
        }
        return rotatingNews.stream().limit(5).toList();
    }

    private NewsItem create(String title, String summary) {
        return new NewsItem(UUID.randomUUID().toString(), title, summary, "CryptoFlow Newsroom", Instant.now());
    }
}
