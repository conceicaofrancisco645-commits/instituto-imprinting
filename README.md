# Instituto Imprinting — site de captação de investidores

Site estático one-page com formulário interativo em etapas para o **Instituto Imprinting**, startup de DeepTech em saúde mental. Projeto prático da **Escola DNC** (Escola Tech).

- **Site publicado:** https://conceicaofrancisco645-commits.github.io/instituto-imprinting/
- **Repositório:** https://github.com/conceicaofrancisco645-commits/instituto-imprinting
- **Autor:** Francisco Conceição da Silva Santos

## O problema

O instituto tinha um site institucional feito para um edital do CNPq: explicava a pesquisa, mas não falava com investidores e tinha um formulário de contato genérico. Em outubro de 2026 o site estava fora do ar.

O pedido da empresa (Voz do Cliente) foi:

1. Um site mais comercial, que mostre com clareza o que é o negócio.
2. Um formulário em que a pessoa se identifique como **Investidor, Pesquisador, Médico ou Paciente**.

## A solução

| Seção | Objetivo |
| --- | --- |
| Hero | Proposta de valor em uma frase e chamada "Quero investir" |
| Quem somos | Missão e o significado do nome *Imprinting* |
| O problema | Os três problemas que o instituto quer resolver |
| Soluções | Plataforma educacional com IA, NeuroMaps e Imprinting Coin |
| Modelo do fundo | As 4 etapas previstas: interesse, gov.br, tokenização e prestação de contas |
| Para quem | Um atalho para cada um dos 4 perfis |
| Time | Fundador e mentores |
| Formulário | Manifestação de interesse em 4 etapas |
| Dúvidas + rodapé | FAQ, contato, aviso CVM e Política de Privacidade |

### Formulário interativo

- **Etapa 1:** escolha do perfil
- **Etapa 2:** contato (nome, e-mail, celular com máscara, cidade e UF)
- **Etapa 3:** perguntas que **mudam conforme o perfil**
  - Investidor: PF/PJ, experiência (startups, cripto, impacto), faixa de interesse, frente preferida
  - Pesquisador: instituição, área, Lattes, tipo de parceria
  - Médico: especialidade, registro profissional, forma de participação
  - Paciente: faixa etária (bloqueia menores de 18) e canal de contato. Sem perguntas de saúde.
- **Etapa 4:** mensagem opcional, consentimento LGPD obrigatório e, para paciente, consentimento específico para dado sensível
- Barra de progresso, validação em tempo real, mensagens de erro claras, foco acessível entre etapas, campo-armadilha contra robôs

## Tecnologias

| Camada | Escolha |
| --- | --- |
| Front-end | HTML semântico, CSS mobile-first, JavaScript puro (sem framework) |
| Fontes | Bricolage Grotesque (títulos) e Atkinson Hyperlegible (texto, criada para leitura acessível) |
| Banco de dados | Supabase (PostgreSQL) via API REST |
| Hospedagem | GitHub Pages (gratuito, HTTPS); `netlify.toml` pronto caso a empresa prefira Netlify |

### Segurança dos dados

A chave usada no site é pública, então a proteção está no banco:

- **Row Level Security:** o visitante só pode **inserir**; ninguém consegue ler os dados com a chave do site.
- **Validação no banco:** formato de e-mail, telefone, tamanhos máximos, perfis permitidos.
- **Limite de envios:** no máximo 3 por e-mail por hora e 30 por minuto no total, contra robôs.
- **Colunas protegidas:** o visitante só envia os campos do formulário; ID e data não podem ser forjados.
- **Sem HTML nos dados:** os sinais `<` e `>` são recusados no site e no banco.
- **Consentimento obrigatório no banco:** um registro sem consentimento LGPD (ou paciente sem consentimento de saúde) é recusado mesmo que alguém burle o JavaScript.

A estrutura completa está em [`supabase/schema.sql`](supabase/schema.sql).

## Cuidados regulatórios

- **CVM:** o site trata tudo como *manifestação de interesse*. Não mostra preço de token, não promete retorno e avisa que não é oferta pública de valores mobiliários (Parecer de Orientação CVM 40/2022 sobre criptoativos).
- **LGPD:** consentimento explícito, Política de Privacidade, finalidade declarada e direito de exclusão. Dado de paciente é tratado como dado sensível (art. 11).
- **Comunicação em saúde:** sem promessa de cura e sem citar substâncias; o CVV (188) é indicado para quem está em sofrimento.

## Resultados dos testes

| Teste | Resultado |
| --- | --- |
| Lighthouse celular | Performance 97 · Acessibilidade 100 · Boas práticas 96 · SEO 100 |
| Lighthouse desktop | Performance 100 · Acessibilidade 100 · Boas práticas 96 · SEO 100 |
| Fluxo dos 4 perfis (Playwright) | Validação, máscara, etapa condicional e envio OK |
| Segurança do banco | Visitante insere; leitura, alteração e exclusão negadas; consentimento, limite de envios, ID/data forjados e HTML recusados |
| Responsivo | 390 px (celular), 820 px (tablet), 1440 px (desktop), sem rolagem horizontal |

## Como rodar localmente

```bash
git clone <url-do-repositorio>
cd imprinting-site
python3 -m http.server 8000
# abra http://localhost:8000
```

Para usar outro banco, crie um projeto no Supabase, rode `supabase/schema.sql` e troque a URL e a chave em `assets/config.js`.

## Estrutura

```
├── index.html          # página principal
├── privacidade.html    # política de privacidade
├── assets/
│   ├── style.css
│   ├── app.js          # menu, ilustração, formulário em etapas
│   ├── config.js       # URL e chave pública do Supabase
│   ├── favicon.svg
│   └── og.png          # imagem de compartilhamento
├── supabase/schema.sql
└── netlify.toml        # alternativa de publicação no Netlify com cabeçalhos de segurança
```

## Próximos passos sugeridos

- Trocar as iniciais do time por fotos oficiais e aplicar o logo do instituto
- Notificar a equipe por e-mail a cada novo envio (Make ou Supabase Edge Function)
- Painel interno para a equipe acompanhar os contatos por perfil
