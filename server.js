import express from "express";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = 3000;
const API_KEY = process.env.OPENROUTER_API_KEY;
const MODEL = "openai/gpt-oss-120b:free";

if (!API_KEY) {
  console.error("Erro: configure OPENROUTER_API_KEY no arquivo .env.");
  process.exit(1);
}

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

app.get("/api/status", (req, res) => {
  res.json({ status: "API local funcionando", model: MODEL });
});

app.post("/api/classificar", async (req, res) => {
  try {
    const { mensagem } = req.body;

    if (!mensagem || mensagem.trim().length === 0) {
      return res.status(400).json({ erro: "O campo mensagem é obrigatório." });
    }

    if (mensagem.length < 20) {
      return res.status(400).json({ erro: "Digite uma mensagem com pelo menos 20 caracteres." });
    }

    if (mensagem.length > 2000) {
      return res.status(400).json({ erro: "Limite máximo de 2000 caracteres." });
    }

    const systemPrompt = `Você é um sistema especializado em triagem de chamados de suporte técnico e atendimento ao cliente.

Ao receber uma mensagem, analise o conteúdo e retorne APENAS um JSON válido, sem texto adicional, sem blocos de código e sem explicações.

O JSON deve seguir exatamente este formato:

{
  "tipo": "<Incidente | Dúvida | Requisição | Reclamação | Elogio>",
  "categoria": "<Login e Acesso | Hardware | Software | Rede | Banco de Dados | Impressoras | Segurança | Outros>",
  "urgencia": "<Crítica | Alta | Média | Baixa>",
  "prioridade": "<P1 | P2 | P3 | P4>",
  "setor": "<Service Desk | Infraestrutura | Redes | Segurança | Banco de Dados | Sistemas | Atendimento>",
  "resumo": "<resumo da mensagem em uma frase objetiva>",
  "acao": "<ação recomendada para o atendente>"
}

Critérios de tipo:
- Incidente: erro, falha, indisponibilidade ou mau funcionamento.
- Dúvida: pergunta sobre uso, procedimento ou orientação.
- Requisição: pedido de acesso, criação, alteração, instalação ou liberação.
- Reclamação: insatisfação com atendimento, sistema ou processo.
- Elogio: feedback positivo.

Critérios de urgência:
- Crítica: sistema fora do ar, perda de dados, impacto total nas operações ou muitos usuários afetados.
- Alta: funcionalidade principal comprometida, impacto parcial nas operações ou prazo imediato.
- Média: problema contornável, impacto limitado.
- Baixa: dúvida, sugestão, elogio ou problema sem impacto operacional imediato.

Critérios de prioridade:
- P1: urgência Crítica.
- P2: urgência Alta.
- P3: urgência Média.
- P4: urgência Baixa.

Seja preciso e não invente informações além do que está na mensagem.`;

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3000",
        "X-OpenRouter-Title": "Classificador de Chamados"
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: mensagem }
        ],
        temperature: 0.2,
        max_completion_tokens: 450,
        response_format: {
          type: "json_object"
        }
      })
    });

    if (!response.ok) {
      const detalhe = await response.text();
      return res.status(502).json({
        erro: "Erro ao consultar o OpenRouter.",
        status: response.status,
        detalhe
      });
    }

    const data = await response.json();
    const rawText = data.choices?.[0]?.message?.content;

    if (!rawText) {
      return res.status(502).json({ erro: "Resposta vazia ou inesperada do modelo." });
    }

    let classificacao;

    try {
      const clean = rawText.replace(/```json|```/g, "").trim();
      classificacao = JSON.parse(clean);
    } catch {
      return res.status(502).json({
        erro: "O modelo retornou uma resposta em formato inválido.",
        raw: rawText
      });
    }

    const resposta = {
      tipo: classificacao.tipo || "Incidente",
      categoria: classificacao.categoria || "Outros",
      urgencia: classificacao.urgencia || "Média",
      prioridade: classificacao.prioridade || "P3",
      setor: classificacao.setor || "Service Desk",
      resumo: classificacao.resumo || "Chamado analisado pela IA.",
      acao: classificacao.acao || classificacao.acao_sugerida || "Analisar o chamado e encaminhar para o setor responsável."
    };

    res.json({
      modelo: MODEL,
      classificacao: resposta,
      uso: data.usage ?? null
    });

  } catch (error) {
    res.status(500).json({ erro: "Erro interno no servidor.", detalhe: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});