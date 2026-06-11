package com.cine.catalog.clients;
import java.util.List;

import org.springframework.cloud.openfeign.FeignClient;

import com.cine.catalog.records.MovieDTO;
import com.cine.catalog.records.MovieMinDTO;

@FeignClient(name = "storage", url = "${services.storage-url}")
public interface StorageClient {

    List<MovieMinDTO> getAll(String genre);
    MovieDTO getById(String movieId);
    MovieDTO create(String movieId);
    void remove(String movieId);
}