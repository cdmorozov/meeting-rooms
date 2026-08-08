### запуск через docker 
docker compose up --build  
фронт http://localhost:5173  
API http://localhost:3000/api  

міграції та сід запускаються автоматично

Облікові записи з сіда  
alice@example.com password123  
bob@example.com password123  

Запуск локально:
cp .env.example .env  
npm install  
docker compose up -d postgres  
npm run migrate -w server  
npm run seed -w server  
npm run dev  

### Реалізовані бонуси

