import pika
import json
import uuid
import os
import threading
from database import SessionLocal, ProcessingJob, create_tables
from processor import process_video

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672")


def start_consumer():
    create_tables()
    params = pika.URLParameters(RABBITMQ_URL)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()

    channel.exchange_declare(exchange="movie-events", exchange_type="topic", durable=True)
    channel.queue_declare(queue="ai.video.uploaded", durable=True)
    channel.queue_bind(exchange="movie-events", queue="ai.video.uploaded", routing_key="video.uploaded")

    print("[AI Consumer] Aguardando eventos video.uploaded...")

    def callback(ch, method, properties, body):
        try:
            event = json.loads(body)
            movie_id = event.get("movieId")
            bucket_name = event.get("bucketName")
            object_name = event.get("objectName")

            print(f"[AI Consumer] Evento recebido: movieId={movie_id}")

            db = SessionLocal()
            job = ProcessingJob(
                id=str(uuid.uuid4()),
                movie_id=movie_id,
                status="QUEUED",
            )
            db.add(job)
            db.commit()
            job_id = job.id
            db.close()

            # Processa em thread separada para não bloquear o consumer
            t = threading.Thread(target=process_video, args=(job_id, movie_id, bucket_name, object_name))
            t.daemon = True
            t.start()

            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            print(f"[AI Consumer] Erro ao processar mensagem: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue="ai.video.uploaded", on_message_callback=callback)
    channel.start_consuming()
