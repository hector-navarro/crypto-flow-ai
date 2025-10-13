package com.cryptoflow.api;

import com.cryptoflow.model.PriceUpdate;
import com.cryptoflow.service.MarketDataService;
import org.springframework.http.MediaType;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

@RestController
@RequestMapping("/api/prices")
@CrossOrigin
public class PriceStreamController {

    private final MarketDataService marketDataService;

    public PriceStreamController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<PriceUpdate>> streamPrices() {
        return marketDataService.streamPriceUpdates()
                .map(update -> ServerSentEvent.builder(update)
                        .event("price-update")
                        .id(update.pair())
                        .build());
    }
}
