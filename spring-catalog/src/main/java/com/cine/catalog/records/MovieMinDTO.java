package com.cine.catalog.records;

public record MovieMinDTO(
        String id,
        String title,
        String genre,
        Integer year,
        String imgUrl,
        String languageCode
) {}