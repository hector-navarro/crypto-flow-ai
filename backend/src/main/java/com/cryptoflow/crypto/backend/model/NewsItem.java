package com.cryptoflow.crypto.backend.model;

import java.time.Instant;

public record NewsItem(String id, String title, String summary, String source, Instant publishedAt) {
}
