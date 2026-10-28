# MVL Fogões — PRD

## Problema original
App de CRM e Ordens de Serviço para assistência técnica de fogões (baseado no PDF MVL-Fogoes-codigo-completo.pdf). Funcional, sem bugs, visual futurista. Instalável no Android (PWA). Flyer de lembrete de agendamento para WhatsApp.

## Arquitetura
FastAPI + MongoDB (motor) / React 19 + Vite + Tailwind v4 / PWA (manifest + sw.js) / html2canvas para o flyer.

## Implementado
- Dashboard, Clientes, Ordens, Agenda, Mídias, WhatsApp, Garantias, Config, relatório, backup/restore
- PWA instalável
- 2026-06: Flyer em formato de papel timbrado: campos preenchidos e editáveis na tela, tamanho 9:16 (405x720), PNG em alta resolução 1215x2160 para dar zoom com os dedos, envio da imagem pelo compartilhamento do celular (navigator.share) e, se não for possível, download + link do WhatsApp
- Correções: links do WhatsApp via api.whatsapp.com (emojis preservados), comprovante com '%', data local / UTC-3, botão de Config no celular, nome de cliente obrigatório, data-testids, toasts na parte de baixo
- 2026-06: Caixa de serviço do flyer marcada de forma visível (caixa laranja com ✓), tipo pré-marcado pelo agendamento ou deduzido do texto do serviço
- 2026-06: Etiquetas de cidade (Bicas, Mar de Espanha, Pequeri, Maripá de Minas, Guarará, Rochedo de Minas) em Clientes e WhatsApp, com filtro e busca. Ao tocar no cliente na Central WhatsApp: abrir conversa, enviar flyer ou montar o flyer com dados da conversa (colar texto, preencher automático, selecionar trecho → campo)
- Limitação: o WhatsApp não permite que apps leiam conversas/etiquetas; os dados vêm copiados e colados
- 2026-06: Seleção de cidade (botões) no cadastro/edição de cliente
- 2026-06: Flyers de Orçamento e Recibo (Central WhatsApp → cliente). Orçamento: até 5 itens com valor + texto livre (valores com R$ somam), total automático, validade e pagamento. Recibo: valor + extenso automático, garantia em dias manual, "Bicas, MG __ de ____ de 20__", assinatura do técnico. Arquitetura: flyerParts.js (peças visuais), flyerModelos.js (agenda/orcamento/recibo), FlyerModal.js genérico (prop modelo)
- 2026-06: Fotos do fogão por cliente (Emergent Object Storage, coleção `fotos`, soft-delete), miniaturas na ficha e no cadastro, visualizador em tela cheia com zoom de pinça (ZoomViewer)
- 2026-06: Flyers enviados só como imagem (sem texto). Datas automáticas no orçamento (Data) e recibo (dia/mês/ano). Botão Guardar → coleção `documentos` + imagem no storage; seção "Arquivo" na ficha do cliente com filtros, reenviar, baixar, imprimir, excluir
- 2026-06: Imprimir (orçamento/recibo, também no arquivo): gera PNG e abre a tela de impressão do sistema (A4); o celular lista as impressoras Wi-Fi (Mopria/AirPrint)

## Backlog
- P2: pequeno desalinhamento dos ícones no PNG exportado (html2canvas)
- P2: logo personalizada no flyer
