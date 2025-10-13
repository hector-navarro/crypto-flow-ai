package com.cryptoflow.model;

import java.net.URI;
import java.time.Instant;

public record NewsEvent(
        String id,
        String headline,
        String summary,
        URI link,
        Instant publishedAt
) {
}
