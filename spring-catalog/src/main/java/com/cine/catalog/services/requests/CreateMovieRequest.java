package com.cine.catalog.services.requests;

public record CreateMovieRequest(
    String title,
    Integer year,
    String genre,
    String description,
    String languageCode
) {}