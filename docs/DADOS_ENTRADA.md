# Dados de entrada para implementação

Quando formos implementar **import de extrato**, **conciliação**, **parse de NF** (foto) ou **sync com planilha**, será necessário que o Founder envie **arquivos de exemplo** (podem ser anonimizados):

| Tipo | Uso no Dino |
|------|--------------|
| **Extratos da conta** | Conciliação (OFX/CSV), import em lote |
| **Faturas do cartão de crédito** | Parser de lançamentos, categorização |
| **Fotos de NF** | API parse-document (Claude/OCR) |
| **Planilha de orçamento/lançamentos** | Sync Google Sheets, mapeamento de colunas |

**Quando pedir:** ao iniciar as issues #14 (conciliação), #21 (import CSV), #9 (pipeline IA / parse document) ou #10 (Sheets). O time avisa: *“Estamos na fase X — pode enviar os arquivos de exemplo conforme `docs/DADOS_ENTRADA.md`.”*
