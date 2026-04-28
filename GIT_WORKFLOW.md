# Guia Git - Desenvolvimento em Sprint

## Regra de Ouro

**1 User Story = 1 Branch = 1 Pull Request**

- Nunca trabalhe em duas features na mesma branch
- Sempre crie uma branch nova para cada US
- Após o merge em `main`, delete a branch e crie uma nova para a próxima US

## Como Criar Sua Branch

Sempre crie uma branch nova antes de começar a trabalhar:

```bash
git checkout main
git pull origin main
git checkout -b feature/1.1-endpoint-registro-usuario
```

Formato: feature/[número-user-story]-[descrição-curta]

## Exemplos reais:

- feature/1.1-endpoint-registro-usuario
- feature/1.3-pagina-registro-usuario

## Convenções de Commit
Use estes prefixos nos seus commits:

- **feat**: Nova funcionalidade
- **fix**: Correção de bug
- **chore**: Manutenção (dependências, config)
- **docs**: Documentação
- **refactor**: Refatoração de código

## Exemplos:
```bash
git commit -m "feat: adiciona validação de email"
git commit -m "fix: corrige erro no formulário"
git commit -m "chore: atualiza dependências"
```

## Workflow Completo

1. Iniciar Nova US
```bash
git checkout main
git pull origin main
git checkout -b feature/1.1-endpoint-registro-usuario
```

2. Durante o Desenvolvimento
```bash
git add .
git commit -m "feat: implementa endpoint de registro"
git push origin feature/1.1-endpoint-registro-usuario
```

3. Finalizar US
- Push final: git push origin feature/1.1-endpoint-registro-usuario
- Criar Pull Request para main
- Aguardar aprovação e merge

4. Após o Merge
```bash
git checkout main
git pull origin main
git branch -d feature/1.1-endpoint-registro-usuario
# Agora criar nova branch para próxima US
git checkout -b feature/1.3-pagina-registro-usuario
```

## ❌ Nunca Faça Isso
Commitar diretamente em main
Trabalhar em duas US na mesma branch
Reutilizar branch antiga para nova US
Fazer commits sem mensagem clara

## ✅ Sempre Faça Isso
Uma US = uma branch nova
Commits frequentes com mensagens claras
Pull Request após finalizar US
Nova branch após merge em main
