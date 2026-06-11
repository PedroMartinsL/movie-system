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

@FeignClient(
    name = "subtitle",
    url = "${services.subtitle-url}"
)
public interface SubtitleClient {

    @GetMapping("/subtitles/{movieId}/languages")
    List<String> getAvailableLanguages(
            @PathVariable String movieId
    );

    @GetMapping("/subtitles/{movieId}")
    List<String> getSubtitles(
            @PathVariable String movieId
    );

    @PostMapping(
        value = "/subtitles/{movieId}",
        consumes = MediaType.MULTIPART_FORM_DATA_VALUE
    )
    void createSubtitle(
            @PathVariable String movieId,
            @RequestParam String languageCode,
            @RequestPart MultipartFile subtitle
    );

    @PostMapping("/subtitles/bind/{movieId}")
    void createBindSubtitle(
            @PathVariable String movieId
    );

    @DeleteMapping("/subtitles/bind/{movieId}")
    void removeBindSubtitles(
            @PathVariable String movieId
    );
}