package com.cine.catalog.records;

import java.util.List;

public record MovieDetailsDTO(
        MovieDTO movie,
        List<String> subtitles
) {}