package com.cryptoflow.crypto.backend.controller;

import com.cryptoflow.crypto.backend.model.CryptoPair;
import com.cryptoflow.crypto.backend.model.PricePoint;
import com.cryptoflow.crypto.backend.service.PriceStreamService;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import reactor.core.publisher.Flux;

import java.util.List;

@RestController
@RequestMapping("/api/prices")
@CrossOrigin(origins = "*")
public class PriceController {

    private final PriceStreamService priceStreamService;

    public PriceController(PriceStreamService priceStreamService) {
        this.priceStreamService = priceStreamService;
    }

    @GetMapping
    public List<CryptoPair> supportedPairs() {
        return priceStreamService.getSupportedPairs();
    }

    @GetMapping(value = "/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<PricePoint> priceStream(@RequestParam(name = "quotes", required = false) List<String> quotes) {
        return priceStreamService.streamFor(quotes);
    }
}
