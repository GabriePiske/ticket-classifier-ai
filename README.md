# Classificador de Chamados com IA

Aplicação que analisa mensagens de suporte e retorna automaticamente:

- **Tipo** do chamado (Incidente, Dúvida, Requisição, Reclamação ou Elogio)
- **Urgência** (Crítica, Alta, Média ou Baixa)
- **Resumo** objetivo da mensagem
- **Ação sugerida** para o atendente

Utiliza a API do [OpenRouter](https://openrouter.ai/) com o modelo `openai/gpt-oss-120b:free`.

---

## Estrutura do projeto

```
classificador-chamados/
├── package.json
├── server.js
├── .env               ← criado por você, não vai ao repositório
└── public/
    └── index.html
```

---

## Instalação

### 1. Clonar ou baixar o projeto

```bash
cd classificador-chamados
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Criar o arquivo `.env`

Crie um arquivo `.env` na raiz do projeto com o seguinte conteúdo:

```
OPENROUTER_API_KEY=sua_chave_aqui
```

> Obtenha sua chave em: https://openrouter.ai/keys  
> Nunca publique o `.env` em repositórios públicos.

---

## Execução

```bash
npm start
```

Acesse no navegador:

```
http://localhost:3000
```

---

## Teste via cURL

```bash
curl -X POST http://localhost:3000/api/classificar \
  -H "Content-Type: application/json" \
  -d '{"mensagem":"O sistema está fora do ar desde as 8h e ninguém consegue acessar."}'
```

Resposta esperada:

```json
{
  "modelo": "openai/gpt-oss-120b:free",
  "classificacao": {
    "tipo": "Incidente",
    "urgencia": "Crítica",
    "resumo": "Sistema inacessível desde as 8h afetando todos os usuários.",
    "acao_sugerida": "Escalar imediatamente para a equipe de infraestrutura e abrir bridge de emergência."
  }
}
```

---

## Como funciona

1. O usuário cola uma mensagem na interface web.
2. O front-end envia a mensagem para `/api/classificar` (back-end local).
3. O `server.js` adiciona o system prompt e encaminha para o OpenRouter.
4. O modelo retorna um JSON estruturado com tipo, urgência, resumo e ação.
5. A interface exibe o resultado de forma visual.

A chave da API **nunca é exposta no front-end** — ela fica protegida no `.env` e só é usada pelo servidor.

---

## Erros comuns

| Erro | Causa provável |
|------|---------------|
| `Erro: configure OPENROUTER_API_KEY` | Arquivo `.env` ausente ou variável com nome errado |
| `401` | Chave de API inválida |
| `429` | Limite de requisições atingido (free tier) |
| Resposta vazia | Falha temporária no modelo ou formato inesperado |
