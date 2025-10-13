package com.cryptoflow.crypto.backend.model;

import java.math.BigDecimal;
import java.time.Instant;

public record PricePoint(String symbol, BigDecimal price, BigDecimal changePercent, Instant timestamp) {
}
