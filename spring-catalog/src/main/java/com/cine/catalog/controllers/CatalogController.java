package com.cine.catalog.controllers;

import java.util.List;

import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.cine.catalog.records.MovieDetailsDTO;
import com.cine.catalog.records.MovieMinDTO;
import com.cine.catalog.services.CatalogService;
import com.cine.catalog.services.requests.CreateMovieRequest;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/catalog")
@RequiredArgsConstructor
public class CatalogController {

    private final CatalogService catalogService;

    @GetMapping("/movies")
    public List<MovieMinDTO> getMovies(
            @RequestParam(required = false) String genre,
            @RequestHeader("X-User-Id") String userId
    ) {
        return catalogService.getMovies(genre, userId);
    }

    @GetMapping("/movies/{id}")
    public MovieDetailsDTO getMovie(
            @PathVariable String id,
            @RequestHeader("X-User-Id") String userId
    ) {
        return catalogService.getMovie(id, userId);
    }

    @PostMapping(
        value = "/movies",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    public ResponseEntity<Void> createMovie(

            @RequestPart("data")
            CreateMovieRequest data,

            @RequestPart("video")
            MultipartFile video,

            @RequestPart("thumbnail")
            MultipartFile thumbnail,

            @RequestPart(value = "subtitle", required = false)
            MultipartFile subtitle
    ) {

        catalogService.createMovie(
            data,
            video,
            thumbnail,
            subtitle
        );

        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/movies/{id}")
    public ResponseEntity<Void> removeMovie(
            @PathVariable String id
    ) {
        catalogService.removeMovie(id);
        return ResponseEntity.noContent().build();
    }
}