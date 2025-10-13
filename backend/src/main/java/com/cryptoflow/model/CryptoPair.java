package com.cryptoflow.model;

public record CryptoPair(String base, String quote) {

    public String label() {
        return quote + " / " + base;
    }
}
