package com.cine.catalog.records;

public record MovieMinDTO(
        String id,
        String title,
        String genre,
        String imgUrl,
        String languageCode
) {}