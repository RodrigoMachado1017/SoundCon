# RELATÓRIO PARCIAL DE ATIVIDADES

**Curso:** Bacharelado em Ciência da Computação  
**Disciplina:** Práticas de Extensão I (ajustar conforme turma)  
**Professor(a):** (preencher)  
**Aluno(a):** Rodrigo (preencher nome completo)  
**Integrantes do grupo:** (preencher em ordem alfabética, se houver)  
**Local:** Pinhais  
**Ano:** 2026  
**Subtítulo:** Evolução técnica do SoundCon: backend de áudio com FFmpeg e remodelação completa do frontend React

## 1 INTRODUÇÃO

Este relatório parcial apresenta as atividades executadas no projeto SoundCon ao longo desta etapa de desenvolvimento. O trabalho concentrou-se na evolução funcional e estrutural da aplicação, com foco principal em duas frentes: (i) robustez no backend para processamento de áudio com mudança de tonalidade (pitch shift) e (ii) remodelação do frontend em React, com melhoria de experiência do usuário, navegação por rotas e padronização visual.

A motivação central foi transformar o projeto em uma plataforma mais consistente, segura e alinhada ao uso real, mantendo compatibilidade com o que já existia e adicionando funcionalidades solicitadas durante as revisões.

## 1.1 OBJETIVO

Desenvolver uma versão parcial aprimorada do SoundCon, contemplando:
- processamento de áudio com transposição em cents no backend;
- validações e controle de qualidade de saída;
- redesign do frontend com navegação funcional por páginas;
- melhoria dos fluxos de autenticação e perfil de usuário;
- manutenção de estabilidade por testes e build de validação.

## 2 CONTEXTUALIZAÇÃO

O SoundCon é uma aplicação web para conversão de áudio e ajuste de tonalidade. Na versão inicial, o backend realizava conversão básica de formato e o frontend apresentava fluxos essenciais de acesso e envio de arquivos. Com a evolução da demanda, tornou-se necessário ampliar a confiabilidade do processamento, reduzir riscos de erro no uso de FFmpeg e oferecer uma interface mais organizada para separar os casos de uso (welcome, conversão, pitch e perfil).

Para isso, foram aplicadas práticas de engenharia incremental: validação de parâmetros, fallback técnico para limitações do ambiente, isolamento de responsabilidades por módulos e revisão de UX baseada em referência visual adaptada ao contexto do produto.

## 3 DESCRIÇÕES DAS ATIVIDADES REALIZADAS

## 3.1 MATERIAIS

- Node.js + Express (backend);
- SQLite3 para persistência local;
- FFmpeg via `@ffmpeg-installer/ffmpeg`;
- React + React Router (frontend);
- Vite para build do cliente;
- Testes com `node --test`;
- Documentação oficial FFmpeg (filtros e resampler).

## 3.2 MÉTODO

As atividades foram executadas em ciclos de análise, implementação e validação:

1. **Levantamento do estado atual do projeto**  
   Leitura da arquitetura existente no backend (`/login`, `/cadastro`, `/audio/convert`) e no frontend (rotas e telas principais).

2. **Refatoração técnica do backend de áudio**  
   - criação de módulo dedicado para regras de pitch (`audio-processing.js`);
   - inclusão de `pitchCents` no endpoint de conversão;
   - validação de formato e faixa permitida (±900 cents);
   - classificação de qualidade por nível (`safe`, `caution`, `high_risk`);
   - execução de FFmpeg via `spawn` (mais segura que `exec`);
   - timeout e limpeza de arquivos temporários;
   - fallback automático quando `rubberband` não está disponível.

3. **Evolução de observabilidade e banco**  
   - ampliação da tabela de logs com colunas específicas de conversão (`pitch_cents`, `engine`, `quality_level`, `duration_ms`);
   - registro estruturado de operação para rastreabilidade.

4. **Testes de unidade e integração no backend**  
   - testes de parsing, validação, fórmula de ratio e política de qualidade;
   - testes de endpoint para cenários de sucesso, aviso e bloqueio;
   - execução da suíte com todos os testes aprovados.

5. **Remodelação do frontend em React**  
   - criação de layout reutilizável com menu lateral e topo;
   - rotas funcionais: `welcome`, `conversão`, `pitch`, `usuário`, `login`, `cadastro`;
   - separação entre página de conversão e página dedicada de pitch;
   - página de usuário para edição local de dados;
   - revisão da home para mensagem de boas-vindas e atalhos de ação.

6. **Ajustes de UX solicitados em revisão**  
   - retorno da identidade visual para tons roxos;
   - remoção de termos não aderentes ao produto;
   - botão de mostrar/ocultar senha no login e cadastro;
   - campo “confirmar senha” com validação client-side no cadastro;
   - correção de navegação das abas do menu lateral.

7. **Validação final do frontend**  
   - build de produção (`npm run build`) sem falhas após as alterações.

## 4 RESULTADOS E DISCUSSÕES

### 4.1 Backend

A API de conversão passou a suportar mudança de tonalidade de forma robusta e previsível. O usuário recebe metadados sobre qualidade e o sistema aplica proteção contra transposições extremas, reduzindo risco de saídas com artefatos severos. A mudança de `exec` para `spawn` fortaleceu segurança operacional e controle de erro.

### 4.2 Frontend

A interface evoluiu de um fluxo linear para uma estrutura multipágina, com navegação clara por funcionalidade. O redesign manteve a linguagem visual consistente com o projeto, melhorou legibilidade e adicionou controles de autenticação mais completos (visibilidade de senha e confirmação no cadastro).

### 4.3 Qualidade técnica

A combinação de modularização, validações e testes automatizados elevou a confiabilidade da entrega parcial. O build do frontend e os testes do backend foram utilizados como critérios objetivos de verificação.

## 5 CONSIDERAÇÕES FINAIS

O objetivo parcial desta etapa foi atingido com sucesso. O SoundCon passou a contar com uma base mais madura tanto em processamento de áudio quanto em experiência de uso. A entrega atual já permite utilização prática com separação de fluxos, feedback de qualidade e navegação funcional.

Como continuidade recomendada:
- implementar endpoint real de atualização de usuário para substituir o modo local da página de perfil;
- ampliar histórico de operações no frontend consumindo logs do backend;
- evoluir a camada de autenticação para sessão/token com controle de acesso entre rotas.

## 6 REFERÊNCIAS

- FFmpeg. *FFmpeg Filters Documentation*. Disponível em: https://ffmpeg.org/ffmpeg-filters.html. Acesso em: 27 maio 2026.
- FFmpeg. *FFmpeg Resampler Documentation*. Disponível em: https://ffmpeg.org/ffmpeg-resampler.html. Acesso em: 27 maio 2026.
- Repositório local SoundCon: arquivos de backend e frontend modificados nesta etapa (`server.js`, `audio-processing.js`, testes em `backend/test`, rotas e páginas em `frontend/src`).
