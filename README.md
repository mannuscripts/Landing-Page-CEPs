# CEP Barbacena

Landing page canônica para consulta de CEPs de Barbacena, MG, desenvolvida para a atividade prática de Sistemas de Informação da UEMG. O design usa uma linguagem editorial sóbria, com a rosa como referência discreta à Cidade das Rosas.

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

## Dados

`data/ceps.json` mantém 143 registros locais usados pela busca reativa. Eles foram consolidados a partir dos três endpoints obrigatórios da ViaCEP:

- `https://viacep.com.br/ws/MG/Barbacena/Rua/json/` — 50 registros
- `https://viacep.com.br/ws/MG/Barbacena/Avenida/json/` — 43 registros
- `https://viacep.com.br/ws/MG/Barbacena/Praca/json/` — 50 registros

O campo de consulta usa `fetch` diretamente em `https://viacep.com.br/ws/{CEP}/json/`, exibindo logradouro, bairro, cidade e UF. A base local consolidada permanece versionada como referência dos logradouros de Barbacena e para atender à etapa de dados da atividade.

## Hashtag da atividade

`#sistemasuemgcarangola2p20262`
