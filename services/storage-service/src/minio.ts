import * as Minio from 'minio'

export const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || 'minio',
  port: parseInt(process.env.MINIO_PORT || '9000'),
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ROOT_USER || 'minioadmin',
  secretKey: process.env.MINIO_ROOT_PASSWORD || 'minioadmin123',
})

export const BUCKET_VIDEOS = process.env.MINIO_BUCKET_VIDEOS || 'movies-videos'
export const BUCKET_POSTERS = process.env.MINIO_BUCKET_POSTERS || 'movies-posters'

export async function ensureBuckets() {
  for (const bucket of [BUCKET_VIDEOS, BUCKET_POSTERS]) {
    const exists = await minioClient.bucketExists(bucket)
    if (!exists) await minioClient.makeBucket(bucket)
  }
}
