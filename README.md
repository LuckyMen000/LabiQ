````md
# LabIQ — запуск проекта

LabIQ — интеллектуальная система поддержки принятия решений в лабораторной диагностике.

Проект состоит из:

- Backend: Python + FastAPI
- Frontend: React + TypeScript
- Database: PostgreSQL
- Docker: Docker Compose + Nginx

---

## 1. Структура проекта

```text
LabIQ/
├── backend/
│   ├── app/
│   ├── Dockerfile
│   └── requirements.txt
│
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
├── docker-compose.yml
├── .env
└── README.md
````

---

# 2. Запуск через Docker

## 2.1. Требования

Перед запуском должен быть установлен:

* Docker
* Docker Compose

Проверка:

```bash
docker --version
docker compose version
```

---

## 2.2. Переменные окружения

В корне проекта должен быть файл `.env`:

```env
POSTGRES_DB=labiq_db
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

DATABASE_URL=postgresql://postgres:postgres@db:5432/labiq_db
```

---

## 2.3. Запуск проекта через Docker

Из корня проекта:

```bash
docker compose up --build
```

После запуска будут доступны:

```text
Frontend: http://localhost:3000
Backend:  http://localhost:8000
Swagger:  http://localhost:8000/docs
Health:   http://localhost:8000/api/health
```

---

## 2.4. Остановка контейнеров

```bash
docker compose down
```

---

## 2.5. Полная пересборка

```bash
docker compose down
docker compose build --no-cache
docker compose up
```

---

## 2.6. Просмотр логов

Все контейнеры:

```bash
docker compose logs
```

Backend:

```bash
docker compose logs backend
```

Frontend:

```bash
docker compose logs frontend
```

Database:

```bash
docker compose logs db
```

---

## 2.7. Подключение к PostgreSQL из PgAdmin

```text
Host: localhost
Port: 5433
Database: labiq_db
Username: postgres
Password: postgres
```

Внутри Docker backend подключается к базе через:

```text
db:5432
```

---

# 3. Локальный запуск без Docker

## 3.1. Backend

Перейти в папку backend:

```bash
cd backend
```

Создать виртуальное окружение:

```bash
python -m venv venv
```

Активировать окружение:

### Windows CMD

```bash
venv\Scripts\activate
```

### Windows PowerShell

```bash
.\venv\Scripts\Activate.ps1
```

Установить зависимости:

```bash
pip install -r requirements.txt
```

---

## 3.2. Backend `.env`

Для локального запуска в `backend/.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/labiq_db
```

Если PostgreSQL установлен локально без Docker и работает на стандартном порту:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/labiq_db
```

---

## 3.3. Запуск backend

Из папки `backend`:

```bash
uvicorn app.main:app --reload
```

Backend будет доступен:

```text
http://localhost:8000
```

Swagger:

```text
http://localhost:8000/docs
```

Health check:

```text
http://localhost:8000/api/health
```

---

# 4. Локальный запуск frontend

Перейти в папку frontend:

```bash
cd frontend
```

Установить зависимости:

```bash
npm install
```

Запустить frontend:

```bash
npm start
```

Frontend будет доступен:

```text
http://localhost:3000
```

---

# 5. Возможные проблемы

## 5.1. Порт 8000 уже занят

Ошибка:

```text
Bind for 0.0.0.0:8000 failed: port is already allocated
```

Решение:

Остановить локальный backend:

```bash
Ctrl + C
```

Или поменять порт в `docker-compose.yml`:

```yml
ports:
  - "8001:8000"
```

Тогда backend будет доступен:

```text
http://localhost:8001
```

---

## 5.2. Порт 3000 уже занят

Остановить другой frontend-процесс или изменить порт.

Для React можно запустить так:

```bash
set PORT=3001 && npm start
```

---

## 5.3. Пересоздать базу Docker

Если нужно удалить старые данные PostgreSQL:

```bash
docker compose down -v
docker compose up --build
```

Важно: команда удалит volume с данными базы.

---

# 6. Git

Перед коммитом проверить статус:

```bash
git status
```

Не должны попадать в Git:

```text
backend/venv/
frontend/node_modules/
.env
```

Первый коммит:

```bash
git add .
git commit -m "Initial LabIQ setup with Docker"
```

```
```
