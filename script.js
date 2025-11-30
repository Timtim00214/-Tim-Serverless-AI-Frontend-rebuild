document.addEventListener('DOMContentLoaded', () => {
    //顶栏交互

    // 获取元素
    const modelBtn = document.getElementById('topic-model-selection-button');
    const modelDropdown = document.getElementById('model-dropdown-menu');
    const modelOptions = document.querySelectorAll('.modelid');
    const modelBtnTextSpan = modelBtn.querySelector('span'); // 获取按钮里的文字span

    //点击按钮，切换下拉菜单的显示/隐藏
    modelBtn.addEventListener('click', (e) => {
        // 阻止冒泡：防止点击按钮时触发下面的 window 点击事件
        e.stopPropagation(); 
        // 切换 .show 类,展示模型选择栏
        modelDropdown.classList.toggle('show');
    });

    // 点击外部区域，关闭模型选择栏
    window.addEventListener('click', () => {
        if (modelDropdown.classList.contains('show')) {
            modelDropdown.classList.remove('show');
        }
    });

    // 点击模型选项
    modelOptions.forEach(option => {
    option.addEventListener('click', () => {
        const fullModelName = option.dataset.fullname || option.innerText;
        const displayName = fullModelName.includes('/') 
            ? fullModelName.split('/').pop() 
            : fullModelName;

        modelBtnTextSpan.innerText = displayName;
        modelDropdown.classList.remove('show');

        console.log(`用户切换模型: ${fullModelName} (显示为: ${displayName})`);
    });
});
});