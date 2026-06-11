package com.pedromartinsl.dslist.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public record MovieCreatedEvent(
    @JsonProperty("movieId") String movieId,
    @JsonProperty("title") String title,
    @JsonProperty("languageCode") String languageCode
) {}