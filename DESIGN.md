# MarcFlow design system

## Direção

Aplicação operacional de CRM e WhatsApp: densa o bastante para equipes de atendimento, com superfícies calmas, hierarquia previsível e uma única cor de ação por tema.

## Temas

- Claro: azul para ações, foco e seleção. Fundos azulados muito sutis e cartões brancos.
- Escuro: amarelo para ações, foco e seleção. Superfícies azul-grafite, sem verdes fluorescentes.
- Estados de sucesso, alerta e erro permanecem semânticos; não devem depender apenas de cor.

## Componentes

- Navegação usa tokens `sidebar-*`, nunca cores hex fixas.
- Ação principal usa `primary`; superfícies usam `background`, `card`, `muted` e `popover`.
- Bordas são discretas, raios de 10-14px e foco permanece visível via `ring`.
- Estados vazios explicam a próxima ação em linguagem direta.
