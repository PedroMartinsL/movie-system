package com.pedromartinsl.dslist.dto;

import com.pedromartinsl.dslist.entities.Movie;

public class MovieMinDTO {
    private Long id;
	private String title;
	private Integer year;
	private String imgUrl;
	private String description;

    public MovieMinDTO() {

    }

    public MovieMinDTO(Movie entity) {
		id = entity.getId();
		title = entity.getTitle();
		year = entity.getYear();
		imgUrl = entity.getImgUrl();
		description = entity.getDescription();
	}
	
	public Long getId() {
		return id;
	}
	public String getTitle() {
		return title;
	}
	public Integer getYear() {
		return year;
	}
	public String getImgUrl() {
		return imgUrl;
	}
	public String getDescription() {
		return description;
	}
}
