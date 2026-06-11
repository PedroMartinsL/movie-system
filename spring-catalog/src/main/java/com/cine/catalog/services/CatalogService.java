package com.cine.catalog.services;

import java.util.List;

import org.springframework.stereotype.Service;

import com.cine.catalog.clients.LanguageClient;
import com.cine.catalog.clients.StorageClient;
import com.cine.catalog.clients.SubtitleClient;
import com.cine.catalog.records.MovieDTO;
import com.cine.catalog.records.MovieDetailsDTO;
import com.cine.catalog.records.MovieMinDTO;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class CatalogService {

    private final StorageClient storageClient;
    private final SubtitleClient subtitleClient;
    private final LanguageClient languageClient;
    

    public List<MovieMinDTO> getMovies(
            String genre,
            String userId
    ) {
        // Deixar genero opcional

        List<String> userLanguages =
                languageClient.getUserLanguages(userId);

        return storageClient.getAll(genre)
                .stream()
                .filter(movie -> {

                    if (userLanguages.contains(movie.languageCode())) {
                        return true;
                    }

                    List<String> subtitles =
                            subtitleClient.getAvailableLanguages(
                                    movie.id());

                    return subtitles.stream()
                            .anyMatch(userLanguages::contains);
                })
                .toList();
    }

    public MovieDetailsDTO getMovie(
            String movieId,
            String userId
    ) {

        MovieDTO movie =
                storageClient.getById(movieId);

        List<String> subtitles =
                subtitleClient.getSubtitles(movieId);

        return new MovieDetailsDTO(
                movie,
                subtitles
        );
    }

public void createMovie(String movieId) {

    MovieDTO movie = storageClient.create(movieId);

    subtitleClient.createBindSubtitle(movie.id());
}

public void removeMovie(String movieId) {

    subtitleClient.removeBindSubtitles(movieId);

    storageClient.remove(movieId);
}
}