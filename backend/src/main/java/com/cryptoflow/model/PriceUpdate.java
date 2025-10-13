package com.cryptoflow.model;

import java.math.BigDecimal;
import java.time.Instant;

public record PriceUpdate(
        String pair,
        BigDecimal price,
        BigDecimal change24h,
        Instant timestamp
) {
}
