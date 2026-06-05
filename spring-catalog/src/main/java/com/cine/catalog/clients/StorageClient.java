package com.cine.catalog.clients;
import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;

import com.cine.catalog.records.MovieDTO;

@FeignClient(name = "storage", url = "${services.storage-url}")
public interface StorageClient {

    List<MovieDTO> getByGenre(String genre);

    MovieDTO getById(String movieId);
}