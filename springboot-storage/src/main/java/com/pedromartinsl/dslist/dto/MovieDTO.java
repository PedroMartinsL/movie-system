package com.pedromartinsl.dslist.dto;

import com.pedromartinsl.dslist.entities.Movie;
import com.pedromartinsl.dslist.entities.enums.Genre;

public class MovieDTO {
    
    private Long id;
	private String title;
	private Integer year;
	private Genre genre;
	private String imgUrl;
	private String description;
	private String videoUrl;
	private String languageCode;
	
	public MovieDTO(Movie entity) {
		this.id = entity.getId();
		this.title = entity.getTitle();
		this.year = entity.getYear();
		this.genre = entity.getGenre();
		this.imgUrl = entity.getImgUrl();
		this.description = entity.getDescription();
		this.videoUrl = entity.getVideoUrl();
		this.languageCode = entity.getLanguageCode();
	}
	
	public Long getId() {
		return id;
	}
	public void setId(Long id) {
		this.id = id;
	}
	public String getTitle() {
		return title;
	}
	public void setTitle(String title) {
		this.title = title;
	}
	public Integer getYear() {
		return year;
	}
	public void setYear(Integer year) {
		this.year = year;
	}
	public Genre getGenre() {
		return genre;
	}
	public void setGenre(Genre genre) {
		this.genre = genre;
	}
	public String getImgUrl() {
		return imgUrl;
	}
	public void setImgUrl(String imgUrl) {
		this.imgUrl = imgUrl;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public String getVideoUrl() {
		return videoUrl;
	}

	public void setVideoUrl(String videoUrl) {
		this.videoUrl = videoUrl;
	}

    public String getLanguageCode() {
        return languageCode;
    }

    public void setLanguageCode(String languageCode) {
        this.languageCode = languageCode;
    }
}
