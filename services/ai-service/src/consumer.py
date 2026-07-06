import pika
import json
import uuid
import os
import threading
from database import SessionLocal, ProcessingJob, create_tables
from processor import process_video

RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@rabbitmq:5672")


# Fica "escutando" a fila do RabbitMQ à espera de vídeos novos.
def start_consumer():
    create_tables()
    # Conecta no RabbitMQ (o sistema de filas de mensagens).
    params = pika.URLParameters(RABBITMQ_URL)
    connection = pika.BlockingConnection(params)
    channel = connection.channel()

    # Assina o evento "video.uploaded": quando o storage avisar que um vídeo
    # foi enviado, essa mensagem cai na nossa fila "ai.video.uploaded".
    channel.exchange_declare(exchange="movie-events", exchange_type="topic", durable=True)
    channel.queue_declare(queue="ai.video.uploaded", durable=True)
    channel.queue_bind(exchange="movie-events", queue="ai.video.uploaded", routing_key="video.uploaded")

    print("[AI Consumer] Aguardando eventos video.uploaded...")

    # callback: roda toda vez que chega um vídeo novo na fila.
    def callback(ch, method, properties, body):
        try:
            # 1) Lê os dados do evento: qual filme e onde está o vídeo (MinIO).
            event = json.loads(body)
            movie_id = event.get("movieId")
            bucket_name = event.get("bucketName")
            object_name = event.get("objectName")

            print(f"[AI Consumer] Evento recebido: movieId={movie_id}")

            # 2) Cria o "Job" no ai-db com status QUEUED (registra que vai processar).
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

            # 3) Processa o vídeo em uma thread separada, para a fila não ficar
            #    travada esperando (a transcrição demora).
            t = threading.Thread(target=process_video, args=(job_id, movie_id, bucket_name, object_name))
            t.daemon = True
            t.start()

            # 4) Confirma pro RabbitMQ que recebemos a mensagem (ack).
            ch.basic_ack(delivery_tag=method.delivery_tag)
        except Exception as e:
            # Deu erro ao ler a mensagem: descarta (nack sem recolocar na fila).
            print(f"[AI Consumer] Erro ao processar mensagem: {e}")
            ch.basic_nack(delivery_tag=method.delivery_tag, requeue=False)

    # prefetch_count=1: pega um vídeo por vez, sem acumular.
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue="ai.video.uploaded", on_message_callback=callback)
    channel.start_consuming()  # começa a escutar (fica rodando pra sempre)
