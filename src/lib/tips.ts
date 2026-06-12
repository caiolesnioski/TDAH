import type { LucideIcon } from 'lucide-react';
import { Brain, EyeOff, Zap, Settings2, Shield, Target, Coffee } from 'lucide-react';

export interface Tip {
  id: number;
  shortTitle: string; // título curto para o toast/card
  fullMessage: string; // mensagem completa
  howToApply: string; // como aplicar na prática (2-3 parágrafos)
  icon: string; // nome do ícone Lucide
  color: string; // cor do token CSS
  suggestedTask: {
    title: string;
    estimatedMinutes: number;
    category: number; // TaskCategory
    priority: number; // TaskPriority
  };
}

export const TIPS: Tip[] = [
  {
    id: 1,
    shortTitle: 'Cérebro economiza energia',
    fullMessage:
      'O nosso cérebro quer evitar esforço, busca prazeres rápidos e vai sempre economizar energia.',
    howToApply:
      'Seu cérebro não é preguiçoso — ele é eficiente. Quando uma tarefa parece difícil de começar, é porque o custo percebido é alto demais.\n\nA solução: reduza o custo de entrada. Prepare tudo que precisa para amanhã ainda hoje, com a mente calma. Deixe o caderno aberto, o documento já na tela, a roupa separada.\n\nAssim, quando chegar a hora, seu cérebro não precisará gastar energia para decidir o que fazer — ele simplesmente começa.',
    icon: 'Brain',
    color: 'var(--color-reward)',
    suggestedTask: {
      title: 'Preparar tudo para amanhã antes de dormir',
      estimatedMinutes: 15,
      category: 5,
      priority: 2,
    },
  },
  {
    id: 2,
    shortTitle: 'Tire as distrações do caminho',
    fullMessage:
      'Tire todas as distrações perto de você. Mantenha o ambiente limpo. O que não está na vista não compete pela sua atenção.',
    howToApply:
      'O TDAH não tem filtro natural para ignorar estímulos. Se o celular está na mesa, parte do seu cérebro sempre estará lá.\n\nAntes de começar qualquer tarefa: coloque o celular em outro cômodo, feche abas desnecessárias, deixe só o que você precisa para aquela tarefa específica na sua frente.\n\nUm ambiente limpo não é estética — é uma ferramenta cognitiva. Cada objeto desnecessário é uma micro-decisão que consome energia.',
    icon: 'EyeOff',
    color: 'var(--color-focus)',
    suggestedTask: {
      title: 'Organizar o ambiente de trabalho antes de começar',
      estimatedMinutes: 10,
      category: 2,
      priority: 1,
    },
  },
  {
    id: 3,
    shortTitle: 'Quando o custo cai, a resistência some',
    fullMessage:
      'Quando o custo de começar cai, a resistência desaparece. Isso está fácil de começar?',
    howToApply:
      "A procrastinação raramente é preguiça — é aversão ao esforço de iniciar. A tarefa parece grande demais, confusa demais, ou você não sabe por onde começar.\n\nPergunta poderosa: 'Qual é o menor passo possível para avançar nisso?' Não 'fazer o projeto' — mas 'abrir o documento'. Não 'estudar' — mas 'pegar o livro'.\n\nQuando a primeira ação tem custo zero, o cérebro não resiste. E uma vez em movimento, continuar fica muito mais fácil.",
    icon: 'Zap',
    color: 'var(--color-action)',
    suggestedTask: {
      title: 'Definir o menor passo possível para minha tarefa principal',
      estimatedMinutes: 5,
      category: 5,
      priority: 2,
    },
  },
  {
    id: 4,
    shortTitle: 'Reprograme seu ambiente',
    fullMessage:
      'Reprograme seu ambiente para que o comportamento correto seja o caminho de menor gasto de energia.',
    howToApply:
      "Não confie na força de vontade — ela é limitada e se esgota. Em vez disso, projete seu ambiente para que fazer a coisa certa seja automático.\n\nExemplos práticos: deixe o copo d'água na mesa (vai beber mais água), coloque o livro no travesseiro (vai ler antes de dormir), deixe o tênis na porta (vai sair para caminhar).\n\nO ambiente certo transforma bons comportamentos em o caminho de menor resistência — e é isso que o seu cérebro sempre vai escolher.",
    icon: 'Settings2',
    color: 'var(--color-done)',
    suggestedTask: {
      title: 'Reorganizar o ambiente para facilitar minha meta principal',
      estimatedMinutes: 20,
      category: 2,
      priority: 1,
    },
  },
  {
    id: 5,
    shortTitle: 'Torne o que distrai difícil',
    fullMessage:
      'Torne aquilo que te distrai difícil. Adicione fricção entre você e a distração.',
    howToApply:
      'Assim como você remove barreiras para bons hábitos, adicione barreiras para os ruins. Se você passa horas no Instagram, desinstale o app e só acesse pelo browser — o custo extra de logar toda vez é suficiente para quebrar o hábito automático.\n\nOutras ideias: coloque o celular no modo avião durante o foco, use um bloqueador de sites, deixe o controle remoto em outro cômodo.\n\nVocê não precisa de mais força de vontade — precisa de mais fricção no caminho errado.',
    icon: 'Shield',
    color: 'var(--color-alert)',
    suggestedTask: {
      title: 'Identificar e bloquear minha principal fonte de distração',
      estimatedMinutes: 10,
      category: 5,
      priority: 2,
    },
  },
  {
    id: 6,
    shortTitle: 'Uma tarefa de cada vez',
    fullMessage:
      'Multitarefas é um mito para o TDAH. Alternar entre tarefas custa mais energia do que terminar uma de cada vez.',
    howToApply:
      'Cada vez que você troca de tarefa, seu cérebro precisa recarregar o contexto — quem eram os personagens, onde estava no raciocínio, qual era o próximo passo. Esse custo se acumula.\n\nEscolha UMA tarefa para o próximo bloco de tempo. Feche tudo relacionado às outras. Trate a tarefa atual como a única que existe agora.\n\nSe outra ideia surgir, anote num papel e volte depois. Seu cérebro vai confiar que você não vai esquecer — e vai parar de interromper.',
    icon: 'Target',
    color: 'var(--color-focus)',
    suggestedTask: {
      title: 'Escolher UMA tarefa prioritária para as próximas 2 horas',
      estimatedMinutes: 5,
      category: 5,
      priority: 2,
    },
  },
  {
    id: 7,
    shortTitle: 'Pausa é parte do trabalho',
    fullMessage:
      'Descanso não é o oposto da produtividade — é o que torna a produtividade possível. Cérebro cansado toma decisões ruins.',
    howToApply:
      'O TDAH frequentemente cria dois extremos: hiperfoco (trabalhar horas sem parar) ou completa paralisia. Nenhum dos dois é sustentável.\n\nPausa programada é diferente de procrastinação. Quando você para conscientemente por 5 minutos após 25 de trabalho, está gerenciando energia — não fugindo.\n\nLevante, beba água, olhe para longe. Quando voltar, seu foco estará renovado em vez de degradado.',
    icon: 'Coffee',
    color: 'var(--color-done)',
    suggestedTask: {
      title: 'Programar pausas de 5min a cada 25min de trabalho hoje',
      estimatedMinutes: 5,
      category: 3,
      priority: 1,
    },
  },
];

// Mapeia o nome do ícone (string) para o componente Lucide correspondente.
export const TIP_ICONS: Record<string, LucideIcon> = {
  Brain,
  EyeOff,
  Zap,
  Settings2,
  Shield,
  Target,
  Coffee,
};

// Retorna a dica do dia baseada na data (muda todo dia, rotativa)
export function getTodayTip(): Tip {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return TIPS[dayOfYear % TIPS.length];
}
