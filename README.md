# Envio de Cupons

Desktop app em Electron para envio massivo de emails com SendGrid, com filas robustas, preview local, importacao XLSX, historico em SQLite e dashboard em tempo real.

## Stack

- Electron
- React + Vite
- Node.js
- SQLite via `node:sqlite`
- SendGrid `v3/mail/send`
- dotenv

## O que o app faz

- Importa contatos de `.xlsx` com coluna obrigatoria `email`
- Destaca emails invalidos, permite exclusao de linhas e guarda o buffer temporariamente em SQLite
- Importa templates `.html` e `.eml`
- Suporta dois modos de template:
  - Conteudo local com preview renderizado no app
  - Template dinamico do SendGrid com `template_id` `d-*`
- Suporta envios `TO`, `CC` e `BCC`
- Suporta modo individual por contato e modo `BCC` compartilhado
- Envia testes para um ou mais emails antes da campanha
- Mostra progresso ao vivo, logs operacionais, ETA e lote atual
- Gera relatorio final e exporta CSV
- Salva historico agregado em SQLite

## Regras importantes de SendGrid implementadas

- Todo envio usa `Authorization: Bearer <SENDGRID_API_KEY>` no backend
- O frontend nunca acessa a API key
- O tamanho do lote e validado entre `1` e `1000`
- Templates dinamicos exigem `template_id` iniciando com `d-`
- Headers reservados do SendGrid sao bloqueados no editor de headers
- No modo `BCC` compartilhado, a personalizacao por contato e desativada
- Para template local com personalizacao, o app usa uma requisicao por contato porque `content` e nivel de mensagem no `mail/send`
- O dashboard/report v1 considera sucesso como `202 Accepted` do SendGrid, mais falhas locais e falhas de API; eventos de entrega nao fazem parte desta versao

## Estrutura principal

```text
main/
  main.js
  preload.js
  ipc.js
  services/
    database.js
    emailService.js
    fileParser.js
    queueManager.js
    reportService.js
    templateEngine.js
    validation.js
renderer/
  index.html
  src/
shared/
  constants.js
test/
```

## Configuracao

1. Instale dependencias:

```bash
npm install
```

2. Copie o arquivo de exemplo:

```bash
copy .env.example .env
```

3. Preencha o `.env`:

```env
SENDGRID_API_KEY=your_sendgrid_api_key_here
SENDGRID_BASE_URL=https://api.sendgrid.com
```

Use `https://api.eu.sendgrid.com` somente se a conta/subuser estiver configurada para envio regional na UE.

## Como rodar

```bash
npm start
```

Isso sobe o Vite para o renderer e inicia o Electron em modo desktop.

## Como testar

```bash
npm test
```

## Como gerar o app

```bash
npm run build
```

Saidas esperadas:

- `dist/release/win-unpacked/`
- `dist/release/Envio de Cupons Setup 1.0.0.exe`

Observacao: o build atual usa o icone padrao do Electron. Se quiser branding proprio, adicione um `icon.ico` e ajuste o `build.win` no `package.json`.

## Fluxo recomendado de uso

1. Importe a planilha `.xlsx`
2. Revise linhas invalidas ou exclua contatos do envio
3. Importe o template `.html` ou `.eml`, ou informe um `template_id` dinamico
4. Ajuste remetente, assunto, lote, delay, headers e listas CC/BCC
5. Envie um teste
6. Inicie a campanha
7. Acompanhe o dashboard
8. Exporte o CSV final e, se desejar, apague os detalhes sensiveis

## Persistencia

- O banco SQLite fica no diretório `userData` do Electron
- O buffer de contatos temporarios pode ser apagado automaticamente ao fim da campanha
- O historico agregado permanece salvo
- Os detalhes por destinatario podem ser purgados pela tela de relatorio

## Limitacoes conhecidas desta versao

- Templates dinamicos remotos nao podem ser renderizados localmente sem outra API do SendGrid; por isso o app mostra o payload e o resultado do teste, nao o HTML final
- Cancelar uma campanha interrompe apenas lotes ainda nao enviados; lotes ja aceitos pelo SendGrid nao podem ser recolhidos localmente
- O build foi validado para Windows
