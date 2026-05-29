package com.pedromartinsl.dslist.infrastructure.services;

import java.io.IOException;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
public class StorageService {

    @Value("${storage.endpoint}")
    private String endpoint;

    @Value("${storage.bucket}")
    private String bucket;

    @Autowired
    private S3Client s3;

    public String upload(MultipartFile file)
        throws IOException {

        String filename =
            UUID.randomUUID()
            + "-"
            + file.getOriginalFilename();

        s3.putObject(
            PutObjectRequest.builder()
                .bucket(bucket)
                .key(filename)
                .contentType(file.getContentType())
                .build(),

            RequestBody.fromBytes(file.getBytes())
        );

        return endpoint
            + "/"
            + bucket
            + "/"
            + filename;
    }
}
