export function buildAnswerSheetPrompt(
  questionCount: number,
  alternatives: string[],
) {
  return `
Leia a folha de respostas da imagem.

SUA ÚNICA TAREFA É IDENTIFICAR AS ALTERNATIVAS MARCADAS PELO ALUNO.

Você NÃO deve corrigir a prova, descobrir a resposta correta ou usar conhecimento da matéria.

DADOS DA PROVA:
- Questões: ${questionCount}
- Alternativas válidas: ${alternatives.join(", ")}

COMO ANALISAR:

1. Localize visualmente cada questão e suas respectivas alternativas.
2. Analise cada questão de forma independente.
3. Identifique a marcação feita pelo aluno.
4. Considere uma alternativa marcada somente quando houver evidência visual clara.
5. Se houver exatamente uma marcação claramente identificável, retorne essa alternativa.
6. Se houver duas ou mais marcações, retorne null.
7. Se nenhuma alternativa estiver marcada, retorne null.
8. Se a marcação estiver ilegível, cortada, borrada ou ambígua, retorne null.
9. Nunca escolha uma alternativa por proximidade ou por padrão esperado.
10. Nunca invente uma resposta.
11. Nunca use o gabarito para determinar a resposta marcada.
12. Não confunda marcações de questões vizinhas.
13. Preserve exatamente a numeração das questões.
14. A resposta deve representar O QUE O ALUNO MARCOU, mesmo que esteja errada.

ATENÇÃO:

Uma questão pode estar marcada com:
- preenchimento;
- X;
- ✓;
- círculo;
- risco;
- outro tipo evidente de marcação.

O formato da marcação não importa. O que importa é haver evidência visual suficiente de que aquela alternativa foi selecionada.

Se não for possível determinar com segurança qual alternativa foi marcada, use null.

ANTES DE RESPONDER:

Verifique se:
- todas as ${questionCount} questões foram analisadas;
- cada questão aparece apenas uma vez;
- os números das questões estão corretos;
- cada resposta é uma das alternativas válidas ou null;
- nenhuma resposta foi adivinhada;
- você identificou a marcação do aluno, e não a resposta correta.

RETORNE SOMENTE JSON VÁLIDO.

Formato:

{
  "answers": [
    {
      "question": 1,
      "answer": "A"
    },
    {
      "question": 2,
      "answer": null
    }
  ],
  "image_quality": "boa",
  "notes": ""
}

image_quality deve ser obrigatoriamente:
"boa", "regular" ou "ruim".

Use "notes" somente para informar problemas relevantes na imagem.
`;
}
