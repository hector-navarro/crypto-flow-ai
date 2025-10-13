package com.cryptoflow.model;

import java.time.Instant;

public record NewsEvent(
        String id,
        String title,
        String summary,
        String source,
        Instant publishedAt
) {
}
