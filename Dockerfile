FROM python:3.9.6

ENV DEBUG FALSE
ENV ROBOFLOW_API_KEY "abc"
ENV INSTANTDB_APP_ID "abc"

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt

EXPOSE 5000

CMD [ "python3", "-m" , "flask", "run", "--host=0.0.0.0"]