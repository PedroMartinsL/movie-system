import os
from celery import Celery

broker = os.getenv("CELERY_BROKER_URL", f"redis://{os.getenv('REDIS_HOST','redis')}:{os.getenv('REDIS_PORT','6379')}/0")
celery_app = Celery("language_tasks", broker=broker)
celery_app.conf.result_backend = os.getenv("CELERY_RESULT_BACKEND", broker)
