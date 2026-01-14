FROM node:20

WORKDIR /app

# Копируем зависимости
COPY package*.json ./
RUN npm install

# Копируем остальной код
COPY . .

# Собираем фронтенд (если нужно) и запускаем сервер
EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]
