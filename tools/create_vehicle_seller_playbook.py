from reportlab.lib.colors import HexColor, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit
from pathlib import Path

OUT = Path('output/pdf/playbook-vendedor-veiculos-autocatalogo.pdf')
OUT.parent.mkdir(parents=True, exist_ok=True)

W, H = 960, 540
RED, BLACK, CHARCOAL, GRAY, LIGHT, PALE = map(HexColor, ['#E30613','#111111','#262626','#6B7280','#E5E7EB','#F7F7F7'])
FONT = '/System/Library/Fonts/Supplemental/Arial.ttf'
BOLD = '/System/Library/Fonts/Supplemental/Arial Bold.ttf'
pdfmetrics.registerFont(TTFont('A', FONT)); pdfmetrics.registerFont(TTFont('AB', BOLD))

slides = [
('cover', 'PLAYBOOK DO VENDEDOR DE VEÍCULOS', ['Respostas práticas para preço, financiamento, troca e “vou pensar” no WhatsApp.', 'Para vendedores, consultores e equipes comerciais de concessionárias, revendas e lojas de veículos.'], 'Capa preta com faixa vermelha, wordmark AutoCatálogo e ilustração abstrata de veículo.'),
('bullets', 'Como usar este playbook', ['Responda a dúvida real antes de tentar vender.', 'Entenda o contexto do cliente.', 'Faça perguntas curtas de diagnóstico.', 'Sempre indique um próximo passo.'], 'Fluxo visual com quatro etapas e ícones de conversa, lupa, pergunta e seta.'),
('method', 'Uma resposta útil conduz a conversa', ['1. Responda à pergunta.', '2. Investigue a necessidade.', '3. Informe com clareza.', '4. Convide para o próximo passo.'], 'Linha de processo vermelha sobre fundo claro, com cada etapa destacada.'),
('bullets', '“Está caro” pode esconder perguntas diferentes', ['Comparação com outro veículo ou outra condição.', 'Orçamento, entrada ou parcela que não se encaixam.', 'Dúvida sobre o que está incluído na proposta.', 'Necessidade de mais segurança para decidir.'], 'Quatro balões de conversa em torno da frase central “Está caro”.'),
('messages', 'Antes de responder a preço, entenda a comparação', [('Pergunta curta', '“Você está comparando com algum veículo ou condição específica?”'), ('Pergunta curta', '“O ponto principal é o valor total, a entrada ou a parcela?”'), ('Pergunta curta', '“O que seria importante para essa compra fazer sentido para você?”')], 'Caixas de WhatsApp em cinza claro; ícone de etiqueta de preço.'),
('messages', 'Respostas práticas para “Está caro”', [('Resposta-base', '“Entendo. Posso te explicar a condição com clareza e entender o que você está comparando.”'), ('Resposta-base', '“Para eu te orientar melhor, o que ficou fora do esperado: valor, entrada ou parcela?”'), ('Resposta-base', '“Se fizer sentido, montamos uma proposta dentro das possibilidades reais da loja.”')], 'Três mensagens de WhatsApp em sequência, com seta para proposta.'),
('bullets', 'Evite desconto imediato: primeiro, esclareça', ['Não presuma que preço é a única objeção.', 'Não anuncie desconto antes de entender a comparação.', 'Explique a condição disponível de forma transparente.', 'Sugira proposta, visita ou simulação conforme a necessidade.'], 'Semáforo visual: parar para entender, informar, depois avançar.'),
('bullets', 'Financiamento começa com contexto', ['Qual veículo ou faixa de valor interessa?', 'Há entrada disponível ou veículo na troca?', 'Qual prazo o cliente considera?', 'Qual faixa de parcela ele busca?'], 'Ícones de carro, entrada, calendário e calculadora organizados em quatro pontos.'),
('bullets', 'Fale de condição sem prometer aprovação', ['Use linguagem de simulação, não de garantia.', 'Explique que entrada, prazo e análise influenciam a condição.', 'Não afirme aprovação antes da análise aplicável.', 'Convide o cliente para simular com os dados necessários.'], 'Caixa de atenção vermelha: “Simulação não é promessa de aprovação”.'),
('messages', 'Modelos éticos para falar de parcela', [('Resposta-base', '“Posso fazer uma simulação. Você pensa em dar alguma entrada e em qual faixa de parcela?”'), ('Resposta-base', '“A condição depende da entrada, do prazo e da análise. Com esses dados, vejo uma simulação para você.”'), ('Próximo passo', '“Me diga a entrada e a parcela que você considera confortável para começarmos.”')], 'Mensagens de WhatsApp com ícone de calculadora e CTA de simulação.'),
('bullets', 'Na troca, comece pela avaliação inicial', ['Modelo e ano do veículo.', 'Quilometragem.', 'Fotos atuais.', 'Estado geral e informações relevantes para a análise da loja.'], 'Checklist visual com ícone de carro e câmera.'),
('messages', 'Explique a troca com transparência', [('Pedido de dados', '“Para uma avaliação inicial, me envie modelo, ano, quilometragem e algumas fotos atuais.”'), ('Alinhamento', '“Com essas informações conseguimos iniciar a análise; a avaliação final depende da análise da loja.”'), ('Próximo passo', '“Assim que eu receber, verifico a melhor forma de avançarmos com a avaliação.”')], 'Sequência: dados → avaliação inicial → análise da loja.'),
('bullets', '“Vou pensar” é um convite para entender melhor', ['Pode indicar comparação, preço, insegurança, falta de urgência ou decisão compartilhada.', 'Evite pressionar ou criar urgência falsa.', 'Pergunte o que falta para o cliente decidir com segurança.', 'Combine uma retomada de conversa que faça sentido.'], 'Balão “Vou pensar” com cinco possíveis caminhos ao redor.'),
('messages', 'Respostas práticas para “Vou pensar”', [('Pergunta de diagnóstico', '“Claro. Para eu te ajudar melhor, ficou alguma dúvida sobre valor, condição ou o veículo?”'), ('Resposta respeitosa', '“Sem problema. Se quiser, posso deixar a proposta organizada para você comparar com calma.”'), ('Follow-up combinado', '“Posso te chamar novamente depois que você conversar com quem decide junto com você?”')], 'Mensagens em caixas visuais, sem cronômetro ou pressão.'),
('table', 'Biblioteca rápida: preço', [('Situação','Diagnóstico','Resposta-base','Próximo passo'), ('“Está caro”','“Comparando com qual condição?”','“Posso explicar a condição e entender sua comparação.”','Proposta'), ('Valor fora do esperado','“É valor, entrada ou parcela?”','“Vamos identificar o ponto que ficou fora do esperado.”','Simulação'), ('Pede desconto','“O que precisa fazer sentido para você?”','“Antes de falar em condição, quero entender sua necessidade.”','Visita ou proposta')], 'Tabela objetiva em preto, cinza e vermelho; ícone de etiqueta.'),
('table', 'Biblioteca rápida: financiamento', [('Situação','Diagnóstico','Resposta-base','Próximo passo'), ('“Quero financiar”','“Tem entrada ou troca?”','“Posso iniciar uma simulação com esses dados.”','Simulação'), ('“Quanto fica?”','“Qual faixa de parcela busca?”','“Entrada, prazo e análise influenciam a condição.”','Informar dados'), ('Dúvida sobre prazo','“Qual prazo considera?”','“Vamos simular uma possibilidade adequada ao que busca.”','Simulação')], 'Tabela objetiva em preto, cinza e vermelho; ícone de calculadora.'),
('table', 'Biblioteca rápida: troca', [('Situação','Diagnóstico','Resposta-base','Próximo passo'), ('“Tenho usado”','“Qual modelo, ano e km?”','“Envie esses dados para uma avaliação inicial.”','Enviar dados'), ('Quer valor da troca','“Pode enviar fotos atuais?”','“A avaliação final depende da análise da loja.”','Avaliação'), ('Usado entra na negociação','“Como está o estado geral?”','“Com a avaliação inicial, vemos como avançar.”','Proposta')], 'Tabela objetiva em preto, cinza e vermelho; ícone de carro e troca.'),
('table', 'Biblioteca rápida: “Vou pensar”', [('Situação','Diagnóstico','Resposta-base','Próximo passo'), ('Quer comparar','“O que ainda quer comparar?”','“Posso organizar a proposta para sua análise.”','Enviar proposta'), ('Insegurança','“Ficou alguma dúvida?”','“Estou à disposição para esclarecer com clareza.”','Retomar conversa'), ('Decisão compartilhada','“Vai conversar com alguém?”','“Posso chamar você depois dessa conversa?”','Follow-up combinado')], 'Tabela objetiva em preto, cinza e vermelho; ícone de conversa.'),
('bullets', 'Erros que esfriam a conversa', ['Resposta genérica.', 'Ignorar a pergunta do cliente.', 'Falar em desconto antes de entender a objeção.', 'Prometer financiamento ou aprovação.', 'Não combinar um próximo passo.'], 'Cinco sinais de alerta em vermelho, com explicação curta no rodapé.'),
('exercise', 'Treino 1: preço', ['Fala do cliente: “Está caro.”', 'Objetivo: entender a comparação antes de apresentar condição.', 'Resposta esperada: “Entendo. Você está comparando com algum veículo ou condição específica?”', 'Próximo passo: encaminhar para proposta, condição, visita ou simulação conforme a resposta.'], 'Cenário de conversa em WhatsApp com bloco “objetivo”.'),
('exercise', 'Treino 2: preço', ['Fala do cliente: “Consegue melhorar esse valor?”', 'Objetivo: não antecipar desconto e descobrir o que pesa na decisão.', 'Resposta esperada: “Posso verificar a condição real. O que precisa fazer sentido para você: valor, entrada ou parcela?”', 'Próximo passo: montar proposta com informação clara.'], 'Cenário de conversa em WhatsApp com etiqueta de preço.'),
('exercise', 'Treino 3: financiamento', ['Fala do cliente: “Quero financiar.”', 'Objetivo: reunir dados para uma simulação responsável.', 'Resposta esperada: “Posso fazer uma simulação. Você pensa em dar entrada ou usar um veículo na troca?”', 'Próximo passo: pedir entrada, prazo e faixa de parcela.'], 'Cenário de conversa em WhatsApp com calculadora.'),
('exercise', 'Treino 4: financiamento', ['Fala do cliente: “Quanto fica a parcela?”', 'Objetivo: explicar o que compõe a condição sem prometer aprovação.', 'Resposta esperada: “A condição depende de entrada, prazo e análise. Qual faixa de parcela você busca?”', 'Próximo passo: iniciar simulação com os dados necessários.'], 'Cenário de conversa em WhatsApp com aviso de transparência.'),
('exercise', 'Treino 5: troca', ['Fala do cliente: “Tenho veículo na troca.”', 'Objetivo: coletar dados para uma avaliação inicial.', 'Resposta esperada: “Perfeito. Me envie modelo, ano, quilometragem e algumas fotos atuais?”', 'Próximo passo: iniciar avaliação e explicar análise final da loja.'], 'Cenário de conversa em WhatsApp com carro e câmera.'),
('exercise', 'Treino 6: troca', ['Fala do cliente: “Quanto vocês pagam no meu?”', 'Objetivo: alinhar a avaliação inicial e final com clareza.', 'Resposta esperada: “Com os dados e fotos iniciamos a avaliação; a definição final depende da análise da loja.”', 'Próximo passo: solicitar informações e seguir para avaliação.'], 'Cenário de conversa em WhatsApp com lupa sobre veículo.'),
('exercise', 'Treino 7: “Vou pensar”', ['Fala do cliente: “Vou pensar e te aviso.”', 'Objetivo: descobrir a dúvida real sem pressionar.', 'Resposta esperada: “Claro. Ficou alguma dúvida sobre valor, condição ou o veículo que eu possa esclarecer?”', 'Próximo passo: combinar uma retomada de conversa.'], 'Cenário de conversa em WhatsApp com balão de reflexão.'),
('exercise', 'Treino 8: “Vou pensar”', ['Fala do cliente: “Preciso conversar em casa.”', 'Objetivo: respeitar a decisão compartilhada e manter o canal aberto.', 'Resposta esperada: “Perfeito. Posso deixar a proposta organizada e chamar você depois dessa conversa?”', 'Próximo passo: follow-up combinado.'], 'Cenário de conversa em WhatsApp com duas pessoas e balões.'),
('cheat', 'Cola rápida do vendedor', ['PREÇO  |  “O que ficou fora do esperado: valor, entrada ou parcela?”  → proposta ou simulação', 'FINANCIAMENTO  |  “Tem entrada, troca, prazo ou faixa de parcela em mente?”  → simulação', 'TROCA  |  “Qual modelo, ano, km, estado e fotos você consegue enviar?”  → avaliação inicial', '“VOU PENSAR”  |  “Ficou alguma dúvida que eu possa esclarecer?”  → follow-up combinado', 'Regra final: responda com clareza, adapte à condição real da loja e sempre combine o próximo passo.'], 'Página final de consulta rápida: quatro faixas temáticas com ícones e CTA.'),
]

def wordmark(c, x, y, scale=1, dark=False):
    c.setFillColor(RED); c.roundRect(x, y, 38*scale, 30*scale, 8*scale, fill=1, stroke=0)
    c.setFillColor(white); c.setFont('AB', 15*scale); c.drawCentredString(x+19*scale, y+8*scale, 'A')
    c.setFont('AB', 22*scale); c.setFillColor(RED); c.drawString(x+48*scale, y+2*scale, 'auto')
    c.setFillColor(white if dark else BLACK); c.drawString(x+96*scale, y+2*scale, 'catálogo')

def footer(c, n):
    c.setStrokeColor(LIGHT); c.line(42, 30, W-42, 30)
    c.setFont('A', 8); c.setFillColor(GRAY); c.drawString(42, 17, 'Fonte: briefing do projeto fornecido pelo solicitante. Exemplos são modelos adaptáveis, sem promessas de condição ou aprovação.')
    c.drawRightString(W-42, 17, f'{n:02d}')

def title(c, t):
    c.setFillColor(BLACK); c.setFont('AB', 28)
    c.drawString(44, H-63, t)
    c.setFillColor(RED); c.rect(44, H-76, 74, 4, fill=1, stroke=0)

def wrap(c, text, x, y, width, size=17, leading=23, color=CHARCOAL, font='A'):
    c.setFillColor(color); c.setFont(font, size)
    for line in simpleSplit(text, font, size, width):
        c.drawString(x, y, line); y -= leading
    return y

def message(c, x, y, label, msg, width=390):
    c.setFillColor(PALE); c.roundRect(x, y-76, width, 76, 10, fill=1, stroke=0)
    c.setFillColor(RED); c.setFont('AB', 10); c.drawString(x+14, y-18, label.upper())
    wrap(c, msg, x+14, y-39, width-28, 14, 18)

def bullet_slide(c, t, items):
    title(c,t); y=H-125
    for item in items:
        c.setFillColor(RED); c.circle(61,y+4,5,fill=1,stroke=0)
        y=wrap(c,item,80,y+10,760,18,27)-18

def table_slide(c, t, rows):
    title(c,t); x=43; y=H-116; widths=[135,180,340,190]; rh=[35,68,68,68]
    for r,row in enumerate(rows):
        h=rh[r]; xx=x
        for col,cell in enumerate(row):
            c.setFillColor(BLACK if r==0 else (white if r%2 else PALE)); c.rect(xx,y-h,widths[col],h,fill=1,stroke=0)
            color=white if r==0 else CHARCOAL; font='AB' if r==0 else 'A'; sz=11 if r==0 else 10
            wrap(c,cell,xx+8,y-15,widths[col]-14,sz,13,color,font); xx+=widths[col]
        y-=h

def exercise(c,t,items):
    title(c,t); y=H-125
    for i,item in enumerate(items):
        c.setFillColor(PALE if i != 2 else HexColor('#FFF0F1')); c.roundRect(44,y-62,850,54,9,fill=1,stroke=0)
        wrap(c,item,60,y-28,810,14,18,CHARCOAL,'AB' if i in (0,1) else 'A'); y-=73

c=canvas.Canvas(str(OUT),pagesize=(W,H)); c.setTitle('Playbook do Vendedor de Veículos | AutoCatálogo')
for n,(kind,t,content,visual) in enumerate(slides,1):
    c.setFillColor(white); c.rect(0,0,W,H,fill=1,stroke=0)
    if kind=='cover':
        c.setFillColor(BLACK); c.rect(0,0,W,H,fill=1,stroke=0)
        c.setFillColor(RED); c.rect(0,0,18,H,fill=1,stroke=0); c.rect(44,100,8,260,fill=1,stroke=0)
        c.setFillColor(white); c.setFont('AB',40); c.drawString(78,350,t)
        wrap(c,content[0],78,300,610,23,30,HexColor('#E5E7EB'))
        wrap(c,content[1],78,205,560,14,20,HexColor('#BFC3C8'))
        c.setFillColor(RED); c.roundRect(700,126,170,185,20,fill=1,stroke=0)
        c.setFillColor(white); c.setFont('AB',72); c.drawCentredString(785,176,'A')
        wordmark(c,78,64,1.1,True)
        c.setFillColor(HexColor('#999999')); c.setFont('A',9); c.drawRightString(W-42,25,'Material de consulta para conversas no WhatsApp')
    elif kind=='bullets': bullet_slide(c,t,content); footer(c,n)
    elif kind=='method':
        title(c,t); xs=[74,286,498,710]
        for i,(x,txt) in enumerate(zip(xs,content)):
            c.setFillColor(RED if i in (0,3) else BLACK); c.circle(x+65,242,57,fill=1,stroke=0)
            c.setFillColor(white); c.setFont('AB',17); 
            for j,line in enumerate(simpleSplit(txt,'AB',17,105)): c.drawCentredString(x+65,247-j*20,line)
            if i<3: c.setStrokeColor(RED); c.setLineWidth(4); c.line(x+126,242,x+197,242)
        footer(c,n)
    elif kind=='messages':
        title(c,t); y=H-125
        for lab,msg in content: message(c,68,y,lab,msg,780); y-=100
        footer(c,n)
    elif kind=='table': table_slide(c,t,content); footer(c,n)
    elif kind=='exercise': exercise(c,t,content); footer(c,n)
    elif kind=='cheat':
        title(c,t); y=H-125
        for i,line in enumerate(content):
            c.setFillColor(RED if i<4 else BLACK); c.roundRect(44,y-45,872,40,8,fill=1,stroke=0)
            wrap(c,line,60,y-28,840,13,16,white,'AB' if i<4 else 'A'); y-=55
        footer(c,n)
    c.showPage()
c.save()
print(OUT)
