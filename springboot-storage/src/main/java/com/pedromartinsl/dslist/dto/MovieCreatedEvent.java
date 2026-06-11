package com.pedromartinsl.dslist.dto;

public record MovieCreatedEvent(
    String movieId,
    String title,
    String languageCode
) {}