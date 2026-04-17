# Použijeme stabilný Node.js obraz (LTS)
FROM node:20-slim

# Nastavenie pracovného adresára v kontajneri
WORKDIR /app

# Kopírujeme len súbory potrebné pre inštaláciu závislostí
# Toto využíva Docker Layer Caching (rýchlejšie buildy)
COPY package*.json ./

# Inštalujeme závislosti
RUN npm install

# Kopírujeme zvyšok zdrojových kódov
COPY . .

# Build aplikácie (ak by sme mali krok pre kompiláciu TS do JS)
# Momentálne používame tsx na beh, tak stačí export portu
EXPOSE 3000

# Spustenie aplikácie
CMD ["npm", "run", "dev"]


# docker build -t drift-rush .
# docker run -p 3000:3000 drift-rush