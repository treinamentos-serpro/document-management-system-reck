---
description: "Gera e executa testes E2E da interface web com Playwright."
name: gerar-testes-interface
argument-hint: "URL da aplicação e fluxos prioritários (opcional)"
agent: "Playwright Tester Mode"
---

# Gerar testes de interface com Playwright

Crie testes E2E para a interface disponível em `${input:url:http://localhost:5173}`. Considere estes fluxos prioritários, se informados: `${input:fluxos:upload, listagem e download de documentos}`.

Antes de escrever código:

- Explore a aplicação com Playwright como uma pessoa usuária: navegue pela URL, observe a página e identifique os fluxos e estados disponíveis.
- Leia as instruções do repositório, a especificação em `docs/specs/dms-spec.md` e os testes/configurações de frontend existentes.
- Confirme como a aplicação e o backend devem ser iniciados. Não presuma que o servidor ou a infraestrutura de testes já estejam configurados.

Requisitos para os testes:

- Use Playwright Test e JavaScript, seguindo a convenção do repositório; não introduza TypeScript.
- Priorize seletores acessíveis e estáveis, como `getByRole`, `getByLabel` e `getByText`; evite seletores dependentes de classes de estilo.
- Cubra os fluxos principais observados, incluindo estados de carregamento, sucesso, lista vazia e erro quando aplicável.
- Para o DMS, verifique seleção e envio de arquivo, atualização da listagem, troca do identificador de usuário e ação de download.
- Isole os testes de serviços externos e do estado compartilhado. Prefira interceptar `/api` com `page.route` para respostas controladas; inclua teste de integração real somente se a configuração existente oferecer uma forma confiável de iniciar e limpar o backend e o armazenamento local.
- Não dependa de documentos persistidos por execuções anteriores. Use arquivos de teste pequenos e dados determinísticos.
- Não altere código de produção para facilitar os testes. Se Playwright ou a configuração de testes não existirem, prepare apenas a configuração mínima de testes E2E, mantendo-a separada do build da aplicação.
- Execute os testes criados, corrija falhas relacionadas a eles e informe o comando usado e os fluxos cobertos. Se não for possível executar, explique claramente o pré-requisito ausente.
