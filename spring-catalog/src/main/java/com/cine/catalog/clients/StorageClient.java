package com.cine.catalog.clients;
import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.multipart.MultipartFile;

import com.cine.catalog.records.MovieDTO;
import com.cine.catalog.records.MovieMinDTO;
import com.cine.catalog.services.requests.CreateMovieRequest;

@FeignClient(
    name = "storage",
    url = "${services.storage-url}"
)
public interface StorageClient {

    @GetMapping("/movies")
    List<MovieMinDTO> getAll(
            @RequestParam(required = false)
            String genre
    );

    @GetMapping("/movies/{movieId}")
    MovieDTO getById(
            @PathVariable String movieId
    );

    @PostMapping(
    value = "/movies",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    MovieDTO create(
        @RequestPart("data") CreateMovieRequest data,
        @RequestPart("video") MultipartFile video,
        @RequestPart("thumbnail") MultipartFile thumbnail
    );

    @DeleteMapping("/movies/{movieId}")
    void remove(
            @PathVariable String movieId
    );
}