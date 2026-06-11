package com.cine.catalog.clients;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "subtitle", url = "${services.subtitle-url}")
public interface SubtitleClient {

    List<String> getAvailableLanguages(@PathVariable String movieId);

    List<String> getSubtitles(
            @PathVariable String movieId
    );

    void createBindSubtitle(String movieId);
    void removeBindSubtitles(String movieId);
}