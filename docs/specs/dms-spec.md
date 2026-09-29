# Especificação - Document Management System

## 1. Objetivo

Permitir que usuários enviem, listem e baixem seus documentos por meio de uma aplicação web, armazenando os arquivos no filesystem local e mantendo os metadados em memória.

## 2. Escopo

### Dentro do escopo

- Upload de documentos associado a um usuário.
- Listagem dos documentos do usuário.
- Download de um documento pelo identificador, respeitando seu proprietário.
- Interface web para upload, listagem e download.
- Armazenamento de arquivos em `backend/storage`, usando Multer com `diskStorage`.
- Armazenamento dos metadados em memória durante a execução do backend.

### Fora do escopo

- Armazenamento externo ou em nuvem.
- Versionamento, edição ou exclusão de documentos.
- Persistência de metadados em banco de dados.
- Cadastro, autenticação ou recuperação de conta.
- Compartilhamento de documentos entre usuários.
- Pré-visualização ou processamento do conteúdo dos arquivos.

## 3. Requisitos funcionais

| ID | Requisito |
| --- | --- |
| RF-01 | O sistema deve aceitar um arquivo enviado como `multipart/form-data`, no campo `file`. |
| RF-02 | O sistema deve associar cada documento a um identificador de usuário recebido no cabeçalho `X-User-Id`. |
| RF-03 | O sistema deve gerar um identificador único para cada documento. |
| RF-04 | O sistema deve gravar o conteúdo do arquivo em `backend/storage` usando Multer com `diskStorage`. |
| RF-05 | O sistema deve manter em memória os metadados do documento: identificador, nome original, tamanho, data de upload e proprietário. |
| RF-06 | O sistema deve listar somente os documentos associados ao usuário da requisição. |
| RF-07 | O sistema deve permitir o download de um documento pelo identificador, somente quando pertencer ao usuário da requisição. |
| RF-08 | O sistema deve rejeitar upload sem arquivo, sem identificador de usuário ou acima do limite configurado. |
| RF-09 | O sistema deve retornar erros em formato JSON nos endpoints que não entregam conteúdo binário. |
| RF-10 | A interface deve permitir enviar documentos, visualizar a lista retornada pela API e solicitar o download de um documento. |
| RF-11 | A interface deve apresentar estados de carregamento e mensagens de sucesso ou erro para as operações de upload, listagem e download. |

## 4. Requisitos não funcionais

| ID | Requisito |
| --- | --- |
| RNF-01 | Os arquivos devem ser armazenados exclusivamente no filesystem local da aplicação, em `backend/storage`, por meio de Multer `diskStorage`. |
| RNF-02 | Os metadados devem ficar em memória; eles serão perdidos quando o processo do backend reiniciar. |
| RNF-03 | O backend deve ser implementado em Node.js e Express, usando CommonJS. |
| RNF-04 | O frontend deve usar React e Vite, com chamadas HTTP por `fetch` sob o prefixo `/api`. |
| RNF-05 | As configurações operacionais devem usar variáveis de ambiente, incluindo porta e tamanho máximo de upload. |
| RNF-06 | O nome original do arquivo não deve ser usado como caminho de armazenamento. O backend deve gerar um nome interno seguro e único. |
| RNF-07 | O download deve ser entregue como anexo, sem executar ou interpretar o conteúdo do arquivo. |
| RNF-08 | O backend deve manter as responsabilidades separadas conforme `routes -> controllers -> services -> repositories`. |
| RNF-09 | O backend deve ter testes automatizados com `node:test` para contratos HTTP, validações, isolamento por usuário e falhas de arquivo. |
| RNF-10 | A identidade recebida em `X-User-Id` não constitui autenticação. A solução é apropriada somente para desenvolvimento ou ambientes controlados até que autenticação seja definida. |

## 5. Modelo de dados

### Metadados expostos pela API

| Campo | Tipo | Descrição |
| --- | --- | --- |
| `id` | string | Identificador UUID do documento. |
| `originalName` | string | Nome original informado no upload. |
| `size` | number | Tamanho do arquivo em bytes. |
| `uploadedAt` | string | Data e hora do upload em ISO 8601 UTC. |
| `owner` | string | Identificador do usuário proprietário. |

Exemplo:

```json
{
  "id": "8c9487a6-799b-4fb7-8347-4e63fd47c450",
  "originalName": "relatorio.pdf",
  "size": 48213,
  "uploadedAt": "2026-09-29T12:00:00.000Z",
  "owner": "usuario-123"
}
```

### Dados internos de armazenamento

Além dos metadados expostos, o repositório deve manter internamente o nome ou caminho gerado para o arquivo. Esse valor não deve ser incluído nas respostas da API. O caminho deve permanecer dentro do diretório de armazenamento local; nomes enviados pelo usuário não podem determinar o caminho final.

A representação em memória pode ser uma coleção indexada por `id`. O repositório é responsável por registrar e consultar os metadados e localizar o arquivo associado.

## 6. Contratos de API

Todas as rotas de documentos são expostas sob `/api`. O proxy de desenvolvimento do Vite remove esse prefixo ao encaminhar as requisições ao backend. As rotas correspondentes no Express são `/upload` e `/documents`.

As rotas de documentos exigem o cabeçalho:

```http
X-User-Id: usuario-123
```

O backend deve rejeitar cabeçalho ausente ou vazio com `400 Bad Request`. O valor identifica o proprietário para esta versão, mas não autentica o solicitante.

### `POST /api/upload`

Envia um documento.

**Requisição**

- `Content-Type: multipart/form-data`
- Campo obrigatório: `file`
- Cabeçalho obrigatório: `X-User-Id`

**Resposta `201 Created`**

```json
{
  "document": {
    "id": "8c9487a6-799b-4fb7-8347-4e63fd47c450",
    "originalName": "relatorio.pdf",
    "size": 48213,
    "uploadedAt": "2026-09-29T12:00:00.000Z",
    "owner": "usuario-123"
  }
}
```

**Erros**

- `400 Bad Request`: arquivo ausente ou `X-User-Id` ausente/vazio.
- `413 Payload Too Large`: arquivo excede o limite.
- `500 Internal Server Error`: falha de gravação ou erro inesperado.

### `GET /api/documents`

Lista os documentos do usuário.

**Requisição**

- Cabeçalho obrigatório: `X-User-Id`

**Resposta `200 OK`**

```json
{
  "documents": [
    {
      "id": "8c9487a6-799b-4fb7-8347-4e63fd47c450",
      "originalName": "relatorio.pdf",
      "size": 48213,
      "uploadedAt": "2026-09-29T12:00:00.000Z",
      "owner": "usuario-123"
    }
  ]
}
```

A lista vazia deve ser representada por `"documents": []`. A ordem padrão é do upload mais recente para o mais antigo.

**Erros**

- `400 Bad Request`: `X-User-Id` ausente ou vazio.
- `500 Internal Server Error`: erro inesperado.

### `GET /api/documents/:id/download`

Baixa um documento do usuário.

**Requisição**

- Parâmetro `id`: identificador do documento.
- Cabeçalho obrigatório: `X-User-Id`

**Resposta `200 OK`**

- Corpo binário do arquivo.
- `Content-Disposition: attachment`, com o nome original como nome sugerido para download.
- `Content-Type` apropriado quando puder ser determinado; caso contrário, `application/octet-stream`.

**Erros**

- `400 Bad Request`: `X-User-Id` ausente ou vazio.
- `404 Not Found`: documento inexistente, arquivo ausente ou documento pertencente a outro usuário. A resposta não deve revelar se um documento de outro usuário existe.
- `500 Internal Server Error`: erro inesperado ao ler o arquivo.

### Formato de erro

Respostas de erro JSON devem seguir um formato consistente:

```json
{
  "error": {
    "code": "FILE_REQUIRED",
    "message": "Envie um arquivo para continuar."
  }
}
```

O campo `code` deve ser estável para consumo pela interface. A mensagem pode ser exibida ao usuário, sem incluir detalhes internos do filesystem.

## 7. Decisões arquiteturais

- `routes/`: define os endpoints e encaminha requisições aos controllers.
- `controllers/`: lê cabeçalhos, parâmetros e arquivos; valida a entrada HTTP; define status e formato da resposta.
- `services/`: aplica regras de negócio, incluindo associação ao proprietário e autorização de acesso ao documento.
- `repositories/`: grava e lê arquivos locais e mantém os metadados em memória.
- Multer deve usar `diskStorage` com diretório local `backend/storage` e nome interno gerado pelo servidor.
- A aplicação deve limitar o tamanho máximo do upload. Valor inicial proposto: 10 MiB, configurável por `MAX_UPLOAD_BYTES`.
- O armazenamento local deve ter um limite total de 1 GiB por processo, configurável por `MAX_STORAGE_BYTES`; uploads que excedam o limite devem ser removidos e rejeitados com `413 Payload Too Large`.
- `PORT` configura a porta do backend. O diretório pode usar `STORAGE_DIR`, cujo padrão deve ser `backend/storage`; qualquer configuração continua restrita a filesystem local.
- O frontend acessa a API com `fetch` usando `/api`, conforme o proxy já configurado no Vite.
- O endpoint existente `GET /health` permanece independente das rotas de documentos.
- Se o registro dos metadados falhar depois da gravação, o arquivo recém-gravado deve ser removido para evitar arquivo órfão.
- A ausência de autenticação é uma limitação explícita: um cliente pode falsificar `X-User-Id`. Não se deve apresentar essa identificação como controle de segurança em produção.

## 8. Plano de execução

As etapas abaixo são planejamento futuro. Nesta solicitação, o único artefato previsto é `docs/specs/dms-spec.md`; nenhum arquivo do backend ou frontend deve ser implementado ou alterado.

1. **Aprovar a especificação e as premissas.** Artefato: `docs/specs/dms-spec.md`. Critério de aceite: contratos, ownership, limite de upload e limitações de autenticação revisados e aceitos.
2. **Implementar o backend.** Arquivos previstos: módulos em `backend/src/routes/`, `controllers/`, `services/` e `repositories/`, além da composição em `backend/src/app.js`. Critério de aceite: upload, listagem por proprietário e download funcionam conforme os contratos; arquivos permanecem em storage local; erros e isolamento têm testes.
3. **Implementar a interface.** Arquivos previstos: componentes e serviço de API em `frontend/src/components/` e `frontend/src/services/`, integrados por `frontend/src/App.jsx`. Critério de aceite: usuário consegue enviar, listar e baixar documentos e recebe estados e erros compreensíveis.
4. **Verificar integração e documentação de execução.** Arquivos previstos: testes existentes em `backend/test/` e documentação operacional no `README.md`, se necessário. Critério de aceite: comandos de execução, variáveis de ambiente e fluxo integrado estão documentados; testes do backend e build do frontend passam.

## 9. Riscos e premissas

- Reiniciar o backend apaga os metadados em memória, embora os arquivos possam continuar no disco. Nesta fase, não há mecanismo de recuperação ou limpeza automática.
- `X-User-Id` permite separar documentos por identificador, mas não prova a identidade de quem faz a requisição. Autenticação deve ser definida antes de disponibilizar o sistema em ambiente não confiável.
- O limite de 10 MiB é uma proposta inicial e pode precisar de ajuste conforme o uso esperado.
- Não há política de tipos MIME ou extensões nesta versão; arquivos são armazenados como bytes e baixados como anexos.
