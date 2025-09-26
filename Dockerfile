FROM python:3.12

ENV DEBUG FALSE
ENV ROBOFLOW_API_KEY "abc"
ENV INSTANTDB_APP_ID "abc"

WORKDIR /app

RUN apt-get update -y && \
    apt-get install -y libgl1 libglib2.0-0 && \
    rm -rf /var/lib/apt/lists/*

COPY . .

RUN pip install --no-cache-dir flask inference-sdk gunicorn numpy opencv-python
RUN pip install --no-cache-dir flask-cors

EXPOSE 5000

CMD ["python3", "-m", "flask", "run", "--host=0.0.0.0"]