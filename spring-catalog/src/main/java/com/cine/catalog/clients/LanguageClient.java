package com.cine.catalog.clients;
import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;

@FeignClient(name = "language", url = "${services.language-url}")
public interface LanguageClient {

    List<String> getUserLanguages(String userId);
}