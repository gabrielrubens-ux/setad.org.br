# Impressão SETAD — navegador e impressoras de rede/USB

O site **não pode** acessar impressoras diretamente por segurança do navegador. O SETAD usa:

1. **Plugin no site** (`js/setad-impressao.js`) — abre a janela de impressão do Windows/macOS/Linux, onde você escolhe impressora **de rede ou cabo USB**.
2. **SETAD Print Bridge** (`print-bridge/`) — programa **local** no PC da secretaria/direção para listar impressoras e enviar PDF sem abrir o diálogo (opcional).

## Instalar a ponte (Windows — secretaria)

```bash
cd print-bridge
npm install
npm start
```

Mantenha o terminal aberto enquanto usar o site. No painel **Impressão**, clique em **Testar ponte** e **Listar impressoras**.

## Onde está no site

Aba **Impressão** nos painéis: secretaria, coordenação, diretor, contador e professor.

Arquivos: `js/setad-impressao.js` (API), `js/setad-impressao-painel.js` (tela), `print-bridge/` (ponte local).

## O que imprimir

| Tipo | Como |
|------|------|
| Boletos | Secretaria → Boletos → Emitir |
| PDF / imagem | Impressão → escolher arquivo |
| Provas, trabalhos | Exportar ou salvar em PDF → Impressão |
| Word / Excel | Salvar como PDF antes |

## Produção (setad.org.br)

A ponte roda **no computador do usuário**, não no servidor Hostinger. Cada estação da equipe que precisar de impressão direta deve ter a ponte instalada.
