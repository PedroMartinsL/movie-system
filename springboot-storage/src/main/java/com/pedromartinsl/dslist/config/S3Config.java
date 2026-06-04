package com.pedromartinsl.dslist.config;

import java.net.URI;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;
import software.amazon.awssdk.services.s3.model.HeadBucketRequest;
import software.amazon.awssdk.services.s3.model.NoSuchBucketException;

@Configuration
public class S3Config {

    @Value("${storage.endpoint}")
    private String endpoint;

    @Value("${storage.access-key}")
    private String accessKey;

    @Value("${storage.secret-key}")
    private String secretKey;

    @Value("${storage.bucket}")
    private String bucketName;

    @Bean
    public S3Client s3Client() {

        return S3Client.builder()
            .endpointOverride(URI.create(endpoint))
            .region(Region.US_EAST_1)
            .forcePathStyle(true)
            .credentialsProvider(
                StaticCredentialsProvider.create(
                    AwsBasicCredentials.create(
                        accessKey,
                        secretKey
                    )
                )
            )
            .build();
    }

    @Bean
    public CommandLineRunner createBucket(S3Client s3Client) {
        return args -> {

            try {

                s3Client.headBucket(
                    HeadBucketRequest.builder()
                        .bucket(bucketName)
                        .build()
                );

                System.out.println("Bucket already exists: " + bucketName);

            } catch (NoSuchBucketException e) {

                s3Client.createBucket(
                    CreateBucketRequest.builder()
                        .bucket(bucketName)
                        .build()
                );

                System.out.println("Bucket created: " + bucketName);
            }
        };
    }
}