package com.cine.catalog.clients;

import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(
    name = "language",
    url = "${services.language-url}"
)
public interface LanguageClient {

    @GetMapping("/users/{userId}/languages")
    List<String> getUserLanguages(
            @PathVariable String userId
    );
}