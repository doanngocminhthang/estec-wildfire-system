FROM python:3.10-slim

WORKDIR /app

# Cài đặt thư viện hệ thống cần thiết (nếu psycopg2 cần)
RUN apt-get update && apt-get install -y libpq-dev gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Chạy server FastAPI
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
