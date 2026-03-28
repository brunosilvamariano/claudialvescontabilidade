/* ========================================
   AMILTON CONTABILIDADE - ASSISTENTE
   Foco: Conversão rápida para WhatsApp
   ======================================== */

class AmiltonAssistant {
    constructor() {
        // Elementos do DOM
        this.floatingBtn    = document.getElementById('botFloatingButton');
        this.chatContainer  = document.getElementById('botChatContainer');
        this.closeBtn       = document.getElementById('botCloseButton');
        this.messagesList   = document.getElementById('botMessagesList');
        this.typingIndicator    = document.getElementById('typingIndicator');
        this.nameInputContainer = document.getElementById('nameInputContainer');
        this.nameInput      = document.getElementById('botNameInput');

        // Estado simplificado
        this.isOpen    = false;
        this.isTyping  = false;

        this.selectedOptions = {
            situacaoEmpresa: null,
            tipoServico:     null,
            faturamento:     null,
            nome:            null
        };

        // ⚠️ ALTERE AQUI — número com código do país + DDD
        this.whatsappNumber = '5547991597258';

        this.init();
    }

    init() {
        this.attachEventListeners();
        this.showInitialMessage();
    }

    attachEventListeners() {
        this.floatingBtn.addEventListener('click', () => this.toggleChat());
        this.closeBtn.addEventListener('click',   () => this.closeChat());

        // Enter no nome = enviar
        this.nameInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendToWhatsApp();
        });
    }

    toggleChat() {
        this.isOpen ? this.closeChat() : this.openChat();
    }

    openChat() {
        this.isOpen = true;
        this.chatContainer.classList.add('active');
    }

    closeChat() {
        this.isOpen = false;
        this.chatContainer.classList.add('closing');
        setTimeout(() => {
            this.chatContainer.classList.remove('active', 'closing');
        }, 300);
    }

    // ===============================
    // INÍCIO DO FLUXO (VENDA)
    // ===============================
    showInitialMessage() {
        setTimeout(() => {
            this.addBotMessage(
                '👋 Olá! Seja bem-vindo à Amilton Contabilidade.\n\n' +
                'Vamos encontrar a solução ideal para o seu negócio em poucos cliques! 😊\n\n' +
                '📋 Qual é a sua situação atual?'
            );

            this.showQuickReplies([
                { text: '🚀 Quero abrir uma empresa',   value: 'abertura' },
                { text: '🔄 Já tenho empresa ativa',    value: 'ativa' },
                { text: '😓 Estou com problemas fiscais', value: 'problemas' },
                { text: '❓ Ainda não sei ao certo',    value: 'indefinido' }
            ], 'situacaoEmpresa');
        }, 400);
    }

    sendMessage(userText, value, step) {
        this.addUserMessage(userText);
        this.selectedOptions[step] = value;

        this.showTypingIndicator();

        setTimeout(() => {
            this.hideTypingIndicator();
            this.generateBotResponse(step);
        }, 700);
    }

    generateBotResponse(step) {
        switch (step) {

            // ── Passo 1: situação da empresa ──
            case 'situacaoEmpresa':
                this.addBotMessage(
                    'Entendido! 👍\n\nQual serviço você precisa agora?'
                );

                // Opções variam conforme a situação escolhida
                const servicosPorSituacao = {
                    abertura: [
                        { text: '🏢 Abertura de empresa (CNPJ)',  value: 'abertura_empresa' },
                        { text: '📄 MEI — Microempreendedor',     value: 'mei' },
                        { text: '📊 Escolha do regime tributário', value: 'regime' }
                    ],
                    ativa: [
                        { text: '📑 Contabilidade mensal',         value: 'contabilidade_mensal' },
                        { text: '💰 Folha de pagamento (RH)',      value: 'folha' },
                        { text: '📊 Planejamento tributário',      value: 'planejamento' },
                        { text: '📂 Declarações (IR / DCTF…)',     value: 'declaracoes' }
                    ],
                    problemas: [
                        { text: '⚠️ Dívidas fiscais / parcelamento', value: 'regularizacao' },
                        { text: '🔍 Auditoria ou revisão contábil',  value: 'auditoria' },
                        { text: '📋 Certidões negativas',            value: 'certidoes' }
                    ],
                    indefinido: [
                        { text: '💬 Quero falar com um especialista', value: 'consulta_geral' },
                        { text: '📊 Diagnóstico gratuito',           value: 'diagnostico' }
                    ]
                };

                const situacao = this.selectedOptions.situacaoEmpresa;
                const opcoes   = servicosPorSituacao[situacao] || servicosPorSituacao['indefinido'];

                this.showQuickReplies(opcoes, 'tipoServico');
                break;

            // ── Passo 2: tipo de serviço ──
            case 'tipoServico':
                this.addBotMessage(
                    'Ótimo! Para personalizar nossa proposta 👇\n\n' +
                    'Qual a faixa de faturamento mensal da empresa?'
                );

                this.showQuickReplies([
                    { text: '💼 Ainda não tenho / MEI',   value: 'sem_faturamento' },
                    { text: '📈 Até R$ 30 mil / mês',    value: 'ate_30k' },
                    { text: '📈 R$ 30k – R$ 100k / mês', value: '30k_100k' },
                    { text: '📈 Acima de R$ 100k / mês', value: 'acima_100k' }
                ], 'faturamento');
                break;

            // ── Passo 3: faturamento → pede o nome ──
            case 'faturamento':
                this.addBotMessage(
                    'Perfeito! Último passo 😊\n\nQual é o seu nome?'
                );
                this.showNameInput();
                break;
        }
    }

    // ===============================
    // UI — MENSAGENS
    // ===============================
    addUserMessage(text) {
        const div = document.createElement('div');
        div.className  = 'message user';
        div.textContent = text;
        this.messagesList.appendChild(div);
        this.scrollToBottom();
    }

    addBotMessage(text) {
        const div = document.createElement('div');
        div.className  = 'message bot';
        div.textContent = text;
        this.messagesList.appendChild(div);
        this.scrollToBottom();
    }

    showQuickReplies(replies, step) {
        const container = document.createElement('div');
        container.className = 'action-buttons';

        replies.forEach(r => {
            const btn = document.createElement('button');
            btn.className   = 'action-btn';
            btn.textContent = r.text;

            btn.addEventListener('click', () => {
                this.sendMessage(r.text, r.value, step);
                container.remove();
            });

            container.appendChild(btn);
        });

        this.messagesList.appendChild(container);
        this.scrollToBottom();
    }

    showNameInput() {
        this.nameInputContainer.style.display = 'flex';
        this.nameInput.focus();
        this.scrollToBottom();
    }

    // ===============================
    // WHATSAPP — CONVERSÃO FINAL
    // ===============================
    sendToWhatsApp() {
        const nome = this.nameInput.value.trim();

        if (!nome) {
            alert('Por favor, informe seu nome 😊');
            this.nameInput.focus();
            return;
        }

        this.selectedOptions.nome = nome;
        this.addUserMessage(nome);

        const message = this.buildWhatsAppMessage();
        const url     = `https://wa.me/${this.whatsappNumber}?text=${encodeURIComponent(message)}`;

        this.showTypingIndicator();

        setTimeout(() => {
            this.hideTypingIndicator();

            this.addBotMessage(
                '✅ Tudo certo! Clique abaixo para falar com um de nossos especialistas direto no WhatsApp 👇'
            );

            const container = document.createElement('div');
            container.className = 'action-buttons';

            const btn       = document.createElement('button');
            btn.className   = 'action-btn';
            btn.innerHTML   = '💬 Falar no WhatsApp agora';
            btn.style.background = '#25D366';
            btn.style.color      = '#fff';

            btn.addEventListener('click', () => {
                window.open(url, '_blank');
            });

            container.appendChild(btn);
            this.messagesList.appendChild(container);
            this.scrollToBottom();

        }, 700);

        this.nameInput.value = '';
        this.nameInputContainer.style.display = 'none';
    }

    buildWhatsAppMessage() {
        const situacao    = this.getDisplayName('situacaoEmpresa', this.selectedOptions.situacaoEmpresa);
        const servico     = this.getDisplayName('tipoServico',     this.selectedOptions.tipoServico);
        const faturamento = this.getDisplayName('faturamento',     this.selectedOptions.faturamento);
        const nome        = this.selectedOptions.nome;

        return `
Olá, Amilton Contabilidade! 👋

Me chamo *${nome}* e gostaria de mais informações.

📋 Situação: ${situacao}
🗂️ Serviço de interesse: ${servico}
💰 Faturamento mensal: ${faturamento}

Poderia me passar mais detalhes e disponibilidade para uma conversa? 😊
        `.trim();
    }

    getDisplayName(type, value) {
        const map = {
            situacaoEmpresa: {
                abertura:   'Quero abrir uma empresa',
                ativa:      'Já tenho empresa ativa',
                problemas:  'Estou com problemas fiscais',
                indefinido: 'Ainda não sei ao certo'
            },
            tipoServico: {
                abertura_empresa:    'Abertura de empresa (CNPJ)',
                mei:                 'MEI — Microempreendedor',
                regime:              'Escolha do regime tributário',
                contabilidade_mensal:'Contabilidade mensal',
                folha:               'Folha de pagamento (RH)',
                planejamento:        'Planejamento tributário',
                declaracoes:         'Declarações (IR / DCTF…)',
                regularizacao:       'Dívidas fiscais / parcelamento',
                auditoria:           'Auditoria ou revisão contábil',
                certidoes:           'Certidões negativas',
                consulta_geral:      'Consulta com especialista',
                diagnostico:         'Diagnóstico gratuito'
            },
            faturamento: {
                sem_faturamento: 'Ainda não tenho / MEI',
                ate_30k:         'Até R$ 30 mil / mês',
                '30k_100k':      'R$ 30k – R$ 100k / mês',
                acima_100k:      'Acima de R$ 100k / mês'
            }
        };

        return map[type]?.[value] || value;
    }

    // ===============================
    // UX
    // ===============================
    showTypingIndicator() {
        this.typingIndicator.style.display = 'flex';
        this.scrollToBottom();
    }

    hideTypingIndicator() {
        this.typingIndicator.style.display = 'none';
    }

    scrollToBottom() {
        setTimeout(() => {
            this.messagesList.scrollTop = this.messagesList.scrollHeight;
        }, 0);
    }
}

// INIT
document.addEventListener('DOMContentLoaded', () => {
    new AmiltonAssistant();
});