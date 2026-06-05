package com.cine.catalog.controllers;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.cine.catalog.records.MovieDTO;
import com.cine.catalog.records.MovieDetailsDTO;
import com.cine.catalog.services.CatalogService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/movies")
    public List<MovieDTO> getMovies(
            @RequestParam String genre,
            @RequestHeader("X-Language") String userLanguage
    ) {
        return catalogService.getMovies(genre, userLanguage);
    }

    @GetMapping("/movies/{id}")
    public MovieDetailsDTO getMovie(
            @PathVariable String id,
            @RequestHeader("X-Language") String userLanguage
    ) {
        return catalogService.getMovie(id, userLanguage);
    }

    @GetMapping("/movies/{id}/subtitle")
    public String getSubtitle(
            @PathVariable String id,
            @RequestParam String language
    ) {
        return catalogService.getSubtitle(id, language);
    }
}