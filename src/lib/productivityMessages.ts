// Mensagens para quando completou 80%+ das tarefas
export const HIGH_PRODUCTIVITY = [
  { title: 'Você foi INCRÍVEL hoje! 🔥', subtitle: 'Pouquíssimas pessoas têm essa disciplina. Você está construindo algo real.' },
  { title: 'Dia perfeito! ⭐', subtitle: 'Cada tarefa concluída é uma prova de que você é capaz. E você provou hoje.' },
  { title: 'Isso é consistência! 🚀', subtitle: 'Não para. Amanhã você vai ser ainda melhor do que foi hoje.' },
  { title: 'Produtividade máxima! 💪', subtitle: 'Seu cérebro trabalhou duro hoje. Você merece descansar bem essa noite.' },
];

// Mensagens para quando completou 50-79%
export const MID_PRODUCTIVITY = [
  { title: 'Bom trabalho hoje! 👏', subtitle: 'Você fez mais do que parecia possível. Continue assim amanhã.' },
  { title: 'Progresso real! ✨', subtitle: 'Cada tarefa feita é um passo à frente. Você está no caminho certo.' },
  { title: 'Você se moveu hoje! 🌱', subtitle: 'Não importa quantas — o que importa é que você não parou.' },
];

// Mensagens para quando completou 1-49%
export const LOW_PRODUCTIVITY = [
  { title: 'Você começou — e isso importa! 💛', subtitle: 'Começar é a parte mais difícil. Amanhã você vai ainda mais longe.' },
  { title: 'Um passo de cada vez! 🌟', subtitle: 'Hoje você plantou uma semente. Continue regando amanhã.' },
  { title: 'Você mostrou que consegue! 🤍', subtitle: 'Mesmo nos dias difíceis, você tentou. Isso já é extraordinário.' },
];

// Frases do lembrete de amanhã
export const TOMORROW_REMINDERS = [
  'Que tal preparar agora o que você vai fazer amanhã? Leva só 5 minutos e deixa seu amanhã muito mais fácil. 💡',
  'Seu eu do amanhã vai agradecer se você planejar agora. Bora preparar o próximo dia? 🗓️',
  'A melhor coisa que você pode fazer agora é preparar amanhã. Quer fazer isso juntos?',
];

export function getProductivityMessage(completionRate: number) {
  const rand = Math.floor(Math.random() * 4);
  if (completionRate >= 0.8) return HIGH_PRODUCTIVITY[rand % HIGH_PRODUCTIVITY.length];
  if (completionRate >= 0.5) return MID_PRODUCTIVITY[rand % MID_PRODUCTIVITY.length];
  return LOW_PRODUCTIVITY[rand % LOW_PRODUCTIVITY.length];
}

export function getTomorrowReminder() {
  return TOMORROW_REMINDERS[Math.floor(Math.random() * TOMORROW_REMINDERS.length)];
}
