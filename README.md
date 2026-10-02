# Allivia

Aplicativo mobile que ajuda pessoas com alergias alimentares a se alimentarem com mais segurança. Projeto da Etec de Taboão da Serra.

O Allivia filtra receitas pelas alergias de cada pessoa, analisa produtos pelo código de barras e indica restaurantes que atendem às suas restrições. Ele é uma ferramenta de apoio: não substitui a leitura do rótulo nem a orientação de profissionais de saúde.

## Funcionalidades

- **Conta:** cadastro com aceite dos Termos de Uso e da Política de Privacidade, login, recuperação de senha e exclusão da conta.
- **Perfil alimentar:** alergias do catálogo (leite, ovo, amendoim, castanhas, glúten, soja, peixes e frutos do mar), alergias digitadas pela pessoa e preferências (sem lactose, sem glúten, vegetariana e vegana), editáveis a qualquer momento.
- **Receitas:** lista que já exclui as receitas com os alergênicos do perfil, filtros por refeição, tempo, dieta e ingredientes, receita aberta com aviso de segurança e receitas salvas.
- **Scanner:** leitura do código de barras pela câmera ou por digitação, análise dos ingredientes do produto em relação ao perfil e resultado com aviso legal. Dados incompletos nunca resultam em "seguro".
- **Plano premium:** fluxo de assinatura do scanner **simulado**. Nenhum pagamento é feito e nenhum dado de cartão é armazenado ou enviado.
- **Restaurantes:** restaurantes cadastrados pela equipe que atendem às alergias do perfil, ordenados pela distância, com mapa, busca, categorias, rota no Google Maps e favoritos. A localização da pessoa é usada só no aparelho.

## Stack

- Expo (React Native) com TypeScript estrito e Expo Router
- Supabase: autenticação e PostgreSQL com regras de acesso (RLS)
- TanStack Query e Zustand para dados e estado
- expo-camera, expo-location e react-native-maps
- Open Food Facts como fonte de dados de produtos
- Jest e React Native Testing Library

## Como rodar

O app fica em `app/`. Instale as dependências, configure o `.env` a partir do `.env.example` e inicie com `npx expo start`. O passo a passo, a explicação de cada variável e a configuração do banco estão em [`app/README.md`](app/README.md).

## Estrutura

```
app/                 aplicativo (Expo)
├── src/
│   ├── app/         telas e rotas (Expo Router)
│   ├── components/  componentes de interface
│   ├── features/    regras de cada funcionalidade
│   ├── services/    acesso ao Supabase e às APIs externas
│   ├── hooks/       hooks de dados
│   ├── store/       estado local
│   ├── theme/       cores, tipografia e medidas
│   ├── constants/   textos e catálogos
│   └── utils/       funções auxiliares
├── assets/          ícones e imagens
├── supabase/        schema, migrações e seeds do banco
├── scripts/         scripts de verificação e de carga de dados
└── __tests__/       testes
documentacao/        documentação técnica
```

## Documentação técnica

A documentação técnica está em [`documentacao/index.html`](documentacao/index.html). O GitHub mostra o código do arquivo: para ler a documentação, baixe o arquivo e abra no navegador.

## Equipe

Etec de Taboão da Serra

- Lavínia Manzan
- Mirella Ferreira
- Rihana Ferreira
- Sophia Félix
- Vicente da Silva

Contato: alliviafood@gmail.com
