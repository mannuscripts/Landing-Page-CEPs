# CEP Barbacena

Landing page canônica para consulta de endereços de Barbacena, MG, desenvolvida para a atividade prática de Sistemas de Informação da UEMG. O design usa uma linguagem editorial sóbria, com a rosa como referência discreta à Cidade das Rosas.

## Funcionalidades

- Consulta direta de CEP com máscara `00000-000`.
- Busca de ruas, avenidas, praças e bairros por nome.
- Autocomplete a partir de 3 caracteres digitados.
- Sugestões reais da base consolidada, com navegação por mouse, `↑`, `↓`, `Enter` e `Esc`.
- Exibição de logradouro, bairro, cidade, UF e CEP.
- Aviso quando o CEP consultado pertence a outro município.
- Estados de validação, carregamento, erro e resultado não encontrado.
- Interface responsiva, sem frameworks, com foco visível e suporte a `prefers-reduced-motion`.

## Tecnologias

- HTML5 semântico
- CSS3 puro
- JavaScript Vanilla
- JSON local consolidado em `data/ceps.json`
- API ViaCEP para consulta de endereços em tempo real

## Executar localmente

Como o navegador bloqueia `fetch` de arquivos locais, sirva a pasta com qualquer servidor HTTP estático. Por exemplo:

```bash
python -m http.server 8000
```

Depois, acesse `http://localhost:8000`.

## Publicação

O projeto é compatível com GitHub Pages e Vercel. No GitHub, habilite Pages usando a branch principal e a pasta raiz. Todos os recursos utilizam caminhos relativos para funcionar em ambos os ambientes.

## Consultas e dados

`data/ceps.json` mantém 143 registros locais usados pela busca reativa. Eles foram consolidados a partir dos três endpoints obrigatórios da ViaCEP:

- `https://viacep.com.br/ws/MG/Barbacena/Rua/json/` — 50 registros
- `https://viacep.com.br/ws/MG/Barbacena/Avenida/json/` — 43 registros
- `https://viacep.com.br/ws/MG/Barbacena/Praca/json/` — 50 registros

O campo de CEP consulta em tempo real:

```text
https://viacep.com.br/ws/{CEP}/json/
```

A busca por rua, avenida ou praça consulta:

```text
https://viacep.com.br/ws/MG/Barbacena/{logradouro}/json/
```

O autocomplete e a busca por bairro utilizam `data/ceps.json`, pois a rota de logradouro da ViaCEP não retorna bairros de forma consistente. Quando a API não encontra resultados, a aplicação pesquisa o termo na base local consolidada.

## Estrutura

```text
.
├── index.html
├── styles.css
├── script.js
├── data/
│   └── ceps.json
├── assets/
└── scripts/
    └── atualizar-ceps.js
```

O script `scripts/atualizar-ceps.js` refaz as consultas de Rua, Avenida e Praça e atualiza o arquivo consolidado local.

## Hashtag da atividade

`#sistemasuemgcarangola2p20262`
