// "Seus números estão à vista?" quiz: questions, score, result band and tips (pure, tested).
(function (root) {
  "use strict";

  // Each option is worth 2, 1 or 0 points; 5 questions give a score from 0 to 10.
  const QUESTIONS = [
    {
      key: "lucro",
      text: "Você sabe quanto a empresa lucrou no mês passado?",
      options: [
        ["Sei o valor exato", 2],
        ["Tenho uma ideia, mas não o número", 1],
        ["Só descubro quando sobra ou falta dinheiro", 0],
      ],
    },
    {
      key: "dados",
      text: "Onde ficam os números de vendas, contas e estoque?",
      options: [
        ["Num sistema de gestão ou na plataforma da loja", 2],
        ["Em planilhas", 1],
        ["No caderno, no extrato do banco ou de cabeça", 0],
      ],
    },
    {
      key: "margem",
      text: "Você sabe quais produtos ou serviços deixam mais lucro?",
      options: [
        ["Sim, com a margem de cada um", 2],
        ["Sei os que mais vendem, não os que mais lucram", 1],
        ["Não sei", 0],
      ],
    },
    {
      key: "receber",
      text: "Você sabe quem está te devendo e há quanto tempo?",
      options: [
        ["Sim, a qualquer momento (ou recebo tudo na hora)", 2],
        ["Só quando paro para conferir", 1],
        ["Não acompanho", 0],
      ],
    },
    {
      key: "tempo",
      text: "Quanto tempo por semana você gasta juntando números?",
      options: [
        ["Menos de 1 hora", 2],
        ["De 1 a 3 horas", 1],
        ["Mais de 3 horas, ou não junto", 0],
      ],
    },
  ];

  const BANDS = [
    { min: 9, name: "Números à vista",
      text: "Você conhece bem os seus números. O próximo passo é decidir antes: olhar a tendência do mês e entender quem são os seus clientes." },
    { min: 7, name: "Quase à vista",
      text: "Você acompanha bem o negócio. Falta pouco para ter tudo num lugar só, sem montar relatório à mão." },
    { min: 4, name: "Números pela metade",
      text: "Você já tem parte dos números, mas eles dão trabalho e chegam tarde. Juntar tudo num lugar só é o que falta." },
    { min: 0, name: "Números no escuro",
      text: "Hoje as decisões saem mais do palpite do que dos números. A boa notícia: os primeiros passos são simples." },
  ];

  // Tip per weak answer: [question key][points] (2 points = no tip needed).
  const TIPS = {
    lucro: {
      0: ["Feche o resultado de todo mês", "Some o que entrou e tire o custo dos produtos, as taxas e as despesas fixas. Com esse número no dia 1, você decide preço e gasto pelo que sobrou, não pelo saldo da conta."],
      1: ["Troque a ideia pelo número", "Uma ideia do lucro esconde o mês ruim até ele virar dois. Feche o resultado no dia 1 de cada mês, sempre da mesma forma."],
    },
    dados: {
      0: ["Tire os números da cabeça", "Comece por uma planilha simples, com as vendas e as contas de cada dia. Número anotado vira resposta; de memória, vira palpite."],
      1: ["Junte as planilhas num lugar só", "Planilhas soltas dão trabalho e erram fácil. Um painel junta as planilhas e os relatórios dos seus sistemas num lugar só."],
    },
    margem: {
      0: ["Descubra o que dá lucro", "Calcule quanto sobra de cada produto ou serviço depois de custo, taxas, frete e imposto. É comum o mais vendido ser o que menos deixa dinheiro."],
      1: ["Olhe a margem, não só a venda", "O que mais vende pode ser o que menos lucra, depois de taxas, frete e imposto. Confira a margem de cada item pelo menos uma vez por mês."],
    },
    receber: {
      0: ["Acompanhe quem te deve", "Liste o que você tem a receber, com a data de vencimento. Conta com mais de 30 dias de atraso pede cobrança, e quanto antes, melhor."],
      1: ["Veja o atraso sem precisar conferir", "Quando a lista de quem deve só aparece quando você para, o atraso cresce sem ninguém ver. O ideal é ela estar sempre pronta, separada por dias de atraso."],
    },
    tempo: {
      0: ["Pare de montar relatório à mão", "Horas juntando números toda semana são horas fora da venda. Dá para juntar tudo num painel e gastar o tempo só com a parte de decidir."],
      1: ["Ganhe de volta as horas da semana", "Até 3 horas por semana viram mais de um dia de trabalho por mês. Com os números já juntos num painel, sobra a parte de decidir."],
    },
  };

  // When fewer than 3 answers are weak, these fill the list, in this order.
  const NEXT_STEPS = [
    ["Olhe 3 números toda semana", "Faturamento, margem e caixa. Cinco minutos toda segunda bastam para ver um problema antes de ele crescer."],
    ["Guarde o histórico", "Com os meses anteriores organizados, dá para comparar cada mês com o mesmo período e ver a tendência antes de o mês fechar."],
    ["Converse sobre os números todo mês", "Uma conversa curta, com os números na tela, transforma o resumo do mês em duas ou três decisões."],
  ];

  // answers: { key: points }. Returns null until every question is answered.
  function score(answers) {
    let total = 0;
    for (const q of QUESTIONS) {
      const points = answers && answers[q.key];
      if (points !== 0 && points !== 1 && points !== 2) return null;
      total += points;
    }
    return total;
  }

  function band(total) {
    return BANDS.find((b) => total >= b.min);
  }

  // The 3 tips for the weakest answers (0 before 1, then question order), topped up with NEXT_STEPS.
  function tips(answers) {
    const weak = QUESTIONS
      .map((q, i) => ({ q, i, points: answers[q.key] }))
      .filter((a) => a.points < 2)
      .sort((a, b) => a.points - b.points || a.i - b.i)
      .map((a) => TIPS[a.q.key][a.points]);
    return weak.concat(NEXT_STEPS).slice(0, 3);
  }

  // Hidden fields for the Tally form: the score and a compact, readable list of the answers.
  function leadFields(answers) {
    return {
      origem: "teste",
      nota: String(score(answers)),
      respostas: QUESTIONS.map((q) => `${q.key} ${answers[q.key]}`).join(", "),
    };
  }

  root.DavTeste = { QUESTIONS, BANDS, TIPS, NEXT_STEPS, score, band, tips, leadFields };
})(typeof window !== "undefined" ? window : globalThis);
