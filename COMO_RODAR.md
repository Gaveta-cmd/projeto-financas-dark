# Como rodar o VibeFinance em casa

O app tem três partes, todas na sua máquina:

| Parte | Tecnologia | Porta |
|---|---|---|
| Banco de dados | MySQL 8.4 (Docker) | 3306 (só local) |
| API | Spring Boot 4 + Java 25 (`backend/`) | 8080 |
| Site | React + Vite | 5173 |

## Primeira vez

1. Copie `.env.example` para `.env` e troque as duas senhas.
2. Suba o banco:

   ```bash
   docker compose up -d
   ```

3. Suba a API (ela cria as tabelas sozinha na primeira execução). As variáveis do `.env`
   precisam estar no ambiente do terminal — no PowerShell:

   ```powershell
   Get-Content .env | Where-Object { $_ -match '^\w+=' } | ForEach-Object { $k, $v = $_ -split '=', 2; Set-Item "env:$k" $v }
   cd backend
   .\mvnw.cmd spring-boot:run
   ```

4. Em outro terminal, suba o site:

   ```bash
   npm install
   npm run dev
   ```

5. Abra http://localhost:5173, crie sua conta e o grupo da família. Os outros moradores
   criam a conta deles e entram com o código de convite.

Depois que todos se cadastrarem, mude `SIGNUP_ENABLED=false` no `.env` e reinicie a API:
ninguém mais consegue criar conta.

## Acessar pelo celular

Com o site rodando, abra `http://IP-DO-PC:5173` em qualquer aparelho no mesmo Wi-Fi
(o IP aparece no terminal do `npm run dev`, na linha "Network").

## Backup

Os dados ficam no volume Docker `vibefinance-mysql`. Para gerar um arquivo de backup:

```bash
docker exec vibefinance-mysql sh -c 'mysqldump -u root -p"$MYSQL_ROOT_PASSWORD" vibefinance' > backup.sql
```

## Testes

```bash
npm test
```
