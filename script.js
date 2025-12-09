document.addEventListener('DOMContentLoaded', () => {
    // ================= 配置区域 =================
    const API_KEYS = [
        'sk-mgautpnzqpyqaozrlyaomvraeyuerfuzgkonywapmgdeogaf',
        'sk-ykrpietpflbcxxkyktxzszknujwiwotjvaawxxstsfyhoedu',
        'sk-uildpgtsholekudhgxdervbxsphjdvmqdyoleyokvmzuuicl',
        'sk-rvzmgspkgfdkpwopaxknkjhkdypmyznsnkdvsmunpiuzrvbh',
        'sk-bxgjnzbzsloaxdihidrwdvxgqvmsruisrrlrhwzawpvogqyn',
        'sk-yyigxcvujpefivwiqacvkpoqinrawbcaicrnmsxzkylvvgki',
        'sk-prsxchpcqqzcjbrngzkxksdnitgliydnikzdfqfmqmwnqhug'
    ];
    const API_URL = 'https://api.siliconflow.cn/v1/chat/completions';

    // ================= 全局状态 =================
    let state = {
        messages: [],
        systemPrompt: "你是一个AI助手，负责满足user的需求。",
        model: 'zai-org/GLM-4.6',
        isProcessing: false,
        params: {
            temperature: 0.7,
            top_p: 0.9,
            frequency_penalty: 0,
            presence_penalty: 0
        },
        hasCreatedHistoryItem: false // 标记当前会话是否已在左侧创建了历史条目
    };

    // ================= DOM 元素 =================
    const UI = {
        userInput: document.getElementById('user-input-textarea'),
        sendBtn: document.querySelector('.send'),
        chatArea: document.querySelector('.chat-messages-area'),

        leftToggle: document.getElementById('left-sidebar-toggle'),
        rightToggle: document.getElementById('right-sidebar-toggle'),
        leftSidebar: document.querySelector('.left-side'),
        rightSidebar: document.querySelector('.right-side'),


        // 模型选择
        modelBtn: document.getElementById('topic-model-selection-button'),
        modelMenu: document.getElementById('model-dropdown-menu'),
        modelSpan: document.querySelector('#topic-model-selection-button span'),

        // 系统提示词 (ID已在HTML中修复)
        sysTrigger: document.getElementById('sys-prompt-trigger'),
        sysPanel: document.getElementById('sys-prompt-panel'),
        sysClose: document.getElementById('sys-prompt-close'),
        sysSave: document.getElementById('sys-save-btn'),
        sysInput: document.getElementById('system-prompt-input'),
        // 左侧栏
        historyContainer: document.getElementById('dynamic-history-container'),
        newChatBtn: document.querySelector('.new-chat'),
        userMenuBtn: document.getElementById('user-menu-btn'),
        userPopup: document.getElementById('user-popup'),

        // 滑块
        sliders: {
            temp: document.getElementById('temp-slider'),
            topp: document.getElementById('topp-slider'),
            freq: document.getElementById('freq-slider'),
            pres: document.getElementById('pres-slider')
        },
        displays: {
            temp: document.getElementById('temp-value'),
            topp: document.getElementById('topp-value'),
            freq: document.getElementById('freq-value'),
            pres: document.getElementById('pres-value')
        }
    };

    // ================= 系统提示词面板逻辑 (修复) =================
    UI.sysTrigger.addEventListener('click', (e) => {
        e.stopPropagation(); // 防止冒泡
        UI.sysInput.value = state.systemPrompt;
        UI.sysPanel.classList.add('show');
    });

    UI.sysClose.addEventListener('click', () => {
        UI.sysPanel.classList.remove('show');
    });

    UI.sysSave.addEventListener('click', () => {
        state.systemPrompt = UI.sysInput.value.trim();
        UI.sysPanel.classList.remove('show');
        // 可选：在聊天区提示
        appendSystemLog(`System Prompt updated.`);
    });

    // =================左下角菜单逻辑 (修复) =================
    UI.userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.userPopup.classList.toggle('show');
    });

    window.addEventListener('click', () => {
        // 点击任意位置关闭所有弹窗
        UI.userPopup.classList.remove('show');
        UI.modelMenu.classList.remove('show');
        // UI.sysPanel.classList.remove('show'); // 面板最好手动关
    });

    // ================= 左侧历史记录逻辑 =================

    // 点击“New Chat”
    UI.newChatBtn.addEventListener('click', () => {
        if (state.messages.length > 0) {
            if (!confirm("Start new chat? Current context will be cleared.")) return;
        }
        resetChat();
    });

    function resetChat() {
        state.messages = [];
        state.hasCreatedHistoryItem = false;
        UI.chatArea.innerHTML = '';
        
        //确保使用当前最新的 state.model
        appendSystemLog(`✨ New session started. Current Model: ${state.model}`);
    }

    // 动态添加历史记录条目
    function addHistoryItem(firstMessage) {
        if (state.hasCreatedHistoryItem) return;

        const title = firstMessage.length > 15 ? firstMessage.substring(0, 15) + '...' : firstMessage;

        const btn = document.createElement('button');
        btn.className = 'history-block';
        btn.innerHTML = `<span class="history-text">💬 ${title}</span>`;

        // 动态生成的记录绑定点击事件
        btn.addEventListener('click', () => {
            alert("无服务器支持，无法保存聊天记录");
        });

        // 插入到容器最顶部
        UI.historyContainer.prepend(btn);
        state.hasCreatedHistoryItem = true;
    }

    // 获取示例
    const staticHistoryBtns = document.querySelectorAll('.history-block');
    staticHistoryBtns.forEach(btn => {
        // 防止重复绑定
        btn.addEventListener('click', () => {
            alert("无服务器支持，无法保存聊天记录");
        });
    });

    // ========= 常规交互逻辑 =======

    // 模型切换
    UI.modelBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        UI.modelMenu.classList.toggle('show');
    });

    document.querySelectorAll('.modelid').forEach(opt => {
        opt.addEventListener('click', () => {
            const oldModel = state.model;
            state.model = opt.innerText.trim();
            const displayName = state.model.includes('/') ? state.model.split('/').pop() : state.model;
            UI.modelSpan.innerText = displayName;
            
            if (oldModel !== state.model) {
                appendSystemLog(`🔄 Model switched to: ${state.model}`);
            }
            
            UI.modelMenu.classList.remove('show'); // 选完自动关闭菜单
        });
    });

    // 滑块绑定
    const paramMap = { 'temp': 'temperature', 'topp': 'top_p', 'freq': 'frequency_penalty', 'pres': 'presence_penalty' };
    Object.keys(UI.sliders).forEach(k => {
        UI.sliders[k].addEventListener('input', (e) => {
            const val = parseFloat(e.target.value);
            UI.displays[k].innerText = val;
            state.params[paramMap[k]] = val;
        });
    });

    // 发送消息
    UI.sendBtn.addEventListener('click', handleSend);
    UI.userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });

    // 自动高度
    UI.userInput.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        if (this.value === '') this.style.height = 'auto';
    });

    // 复制/删除
    UI.chatArea.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;

        const row = btn.closest('.user-message') || btn.closest('.model-message');
        if (!row) return;

        if (btn.classList.contains('copy')) {
            const text = row.querySelector('.message-text').innerText;
            navigator.clipboard.writeText(text);
            const icon = btn.querySelector('span');
            const old = icon.innerText;
            icon.innerText = 'OK';
            setTimeout(() => icon.innerText = old, 1000);
        } else if (btn.classList.contains('delete')) {
            row.remove();
        }
    });

    // ======= 发送 ====

    async function handleSend() {
        const text = UI.userInput.value.trim();
        if (!text || state.isProcessing) return;

        // 界面更新
        appendMessage('user', text);
        addHistoryItem(text); // 尝试添加历史记录

        UI.userInput.value = '';
        UI.userInput.style.height = 'auto';

        state.isProcessing = true;
        UI.sendBtn.disabled = true;
        UI.sendBtn.innerHTML = '<span class="send-text">...</span>';

        // 准备消息列表
        const apiMsgs = [
            { role: 'system', content: state.systemPrompt },
            ...state.messages
        ];

        try {
            const loadingId = appendLoading();
            const reply = await fetchWithRetry(apiMsgs, 0);
            removeElement(loadingId);
            appendMessage('model', reply);
        } catch (err) {
            removeElement('loading-bubble'); // 兜底
            appendMessage('model', `Error: ${err.message}`);
        } finally {
            state.isProcessing = false;
            UI.sendBtn.disabled = false;
            UI.sendBtn.innerHTML = `
                <svg style="width:16px;height:16px;margin-right:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
                </svg>
                <span class="send-text">Send</span>`;
        }
    }

    async function fetchWithRetry(messages, keyIndex) {
        if (keyIndex >= API_KEYS.length) throw new Error("Keys exhausted.");

        try {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${API_KEYS[keyIndex]}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: state.model,
                    messages: messages,
                    stream: false,
                    ...state.params
                })
            });

            if (!res.ok) {
                if ([429, 402, 500, 503].includes(res.status)) {
                    return await fetchWithRetry(messages, keyIndex + 1);
                }
                const err = await res.json();
                throw new Error(err.message || res.statusText);
            }
            const data = await res.json();
            return data.choices[0].message.content;
        } catch (e) {
            console.warn(e);
            return await fetchWithRetry(messages, keyIndex + 1);
        }
    }

    // =========== 辅助函数 =========

    function appendMessage(role, text) {
        state.messages.push({ role: role === 'user' ? 'user' : 'assistant', content: text });

        const div = document.createElement('div');
        div.className = role === 'user' ? 'user-message' : 'model-message';

        let displayHtml = escapeHtml(text);
        if (role === 'model') {
            displayHtml = displayHtml.replace(
                /&lt;think&gt;([\s\S]*?)&lt;\/think&gt;/gi,
                '<details class="thinking-process"><summary>Thinking Process</summary><p>$1</p></details>'
            );
            displayHtml = displayHtml.replace(/<\/details>\n+/g, '</details>');
        }

        div.innerHTML = `
            <div class="${role === 'user' ? 'user-icon' : 'model-icon'}"></div>
            <div class="message-text">${displayHtml}</div>
            <div class="copy-delete">
                <button class="copy"><span>copy</span></button>
                <button class="delete"><span>del</span></button>
            </div>
        `;
        UI.chatArea.appendChild(div);
        scrollToBottom();
    }

    function appendLoading() {
        const id = 'loading-' + Date.now();
        const div = document.createElement('div');
        div.className = 'model-message';
        div.id = id;
        div.innerHTML = `
            <div class="model-icon"></div>
            <div class="message-text" style="color:#aaa;">Thinking...</div>
        `;
        UI.chatArea.appendChild(div);
        scrollToBottom();
        return id;
    }

    function appendSystemLog(text) {
        const div = document.createElement('div');
        div.style.textAlign = 'center';
        div.style.fontSize = '12px';
        div.style.color = '#555';
        div.style.margin = '10px 0';
        div.innerText = text;
        UI.chatArea.appendChild(div);
    }

    function removeElement(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }

    function scrollToBottom() {
        UI.chatArea.scrollTop = UI.chatArea.scrollHeight;
    }

    function escapeHtml(text) {
        return text.replace(/[&<>"']/g, function (m) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m];
        });
    }
    // ================= 侧边栏开关逻辑 =================
    
    if (UI.leftToggle && UI.leftSidebar) {
        UI.leftToggle.addEventListener('click', () => {
            // 切换 closed 类，CSS实现动画
            UI.leftSidebar.classList.toggle('closed');
        });
    }

    // 右侧栏开关
    if (UI.rightToggle && UI.rightSidebar) {
        UI.rightToggle.addEventListener('click', () => {
            UI.rightSidebar.classList.toggle('closed');
        });
    }

    // 初始化确保侧边栏关闭
    if (window.innerWidth < 800) {
        UI.leftSidebar.classList.add('closed');
        UI.rightSidebar.classList.add('closed');
    }
});

// ================= 左下角菜单功能逻辑 =================
    
    const popup = document.getElementById('user-popup');
    const rightBar = document.getElementById('right-sidebar'); // 获取右侧边栏
    
    // 获取菜单里的三个选项按钮
    const menuOptions = document.querySelectorAll('#user-popup .popup-options');

    if (menuOptions.length >= 3 && popup) {
        const btnSettings = menuOptions[0]; 
        const btnClear = menuOptions[1];    
        const btnLogout = menuOptions[2];   

        // Settings 按钮逻辑
        btnSettings.onclick = function(e) { // 使用 onclick 覆盖旧逻辑
            e.preventDefault();
            e.stopPropagation(); // 防冒泡
            
            // 关闭自身弹窗
            popup.classList.remove('show');
            
            // 打开右侧边栏
            if (rightBar) {
                rightBar.classList.remove('closed');
            }
        };

        //Clear All Context 按钮逻辑
        btnClear.onclick = function(e) {
            e.stopPropagation(); // 禁止冒泡
            if(confirm('确认清除上下文并跳转?')) {
                window.location.href = 'https://realtim.life';
            }
        };

        //Log out 按钮逻辑
        btnLogout.onclick = function(e) {
            e.stopPropagation(); // 禁止冒泡
            window.location.href = 'https://tim.lat';
        };
    }