package com.cryptoflow.model;

import java.math.BigDecimal;
import java.time.Instant;

public record PriceUpdate(
        String symbol,
        BigDecimal price,
        BigDecimal changePercent,
        Instant timestamp
) {
}
