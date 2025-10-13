package com.cryptoflow.api;

import com.cryptoflow.service.MarketDataService;
import java.util.List;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pairs")
@CrossOrigin
public class PairController {

    private final MarketDataService marketDataService;

    public PairController(MarketDataService marketDataService) {
        this.marketDataService = marketDataService;
    }

    @GetMapping
    public List<String> listPairs() {
        return marketDataService.getSupportedPairs();
    }
}
