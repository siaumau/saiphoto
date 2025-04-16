// 主要應用狀態
const app = {
    canvas: null,
    ctx: null,
    layers: [],
    activeLayerIndex: -1,
    history: [],
    historyIndex: -1,
    currentTool: 'move',
    isDrawing: false,
    lastX: 0,
    lastY: 0,
    brushSize: 5,
    brushColor: '#000000',
    textInput: null,
    textInputContainer: null,
    tempCanvas: document.createElement('canvas'),
    tempCtx: null,
    dragInfo: {
        isDragging: false,
        startX: 0,
        startY: 0,
        layerStartX: 0,
        layerStartY: 0
    }
};

// 圖層類型
const LayerType = {
    BITMAP: 'bitmap',
    TEXT: 'text'
};

// 當頁面加載完成時初始化應用
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

// 更新初始化應用函數以集成新功能
function initApp() {
    app.canvas = document.getElementById('main-canvas');
    app.ctx = app.canvas.getContext('2d');
    app.tempCtx = app.tempCanvas.getContext('2d');
    app.textInput = document.getElementById('text-input');
    app.textInputContainer = document.querySelector('.text-input-container');

    // 初始化鎖定長寬比功能
    app.lockAspectRatio = false;

    // 設置臨時畫布大小
    app.tempCanvas.width = app.canvas.width;
    app.tempCanvas.height = app.canvas.height;

    // 初始化透明背景圖案
    initTransparentBackground();

    // 初始化一個背景圖層
    addLayer('背景', LayerType.BITMAP);

    // 初始化事件監聽器
    initEventListeners();

    // 初始化圖層大小調整功能
    initResizeFeature();

    // 設置尺寸輸入處理器
    setupSizeInputHandlers();

    // 首次渲染
    render();

    // 預設選擇移動工具
    document.getElementById('move-tool').classList.add('active');
    app.currentTool = 'move';
}

// 整合新功能到現有代碼的總結說明

/*
要完整地整合這些新功能到你的編輯器中，需要執行以下步驟：

1. HTML 更新：
   - 在屬性面板中添加圖片屬性部分（包含寬度、高度輸入框和鎖定長寬比複選框）

2. CSS 更新：
   - 添加透明背景棋盤格的樣式
   - 添加圖片屬性面板的樣式

3. JavaScript 更新：
   - 添加鎖定長寬比功能相關代碼
   - 添加透明背景棋盤格相關代碼
   - 更新 render() 函數以支援透明背景顯示
   - 更新 initApp() 函數以初始化新功能

新功能使用說明：

1. 鎖定長寬比功能：
   - 選擇圖片圖層後，在右側屬性面板中找到「圖片屬性」部分
   - 勾選「鎖定長寬比」複選框來啟用/禁用此功能
   - 啟用後，調整大小時將保持原始比例
   - 可以直接在寬度/高度輸入框中輸入精確尺寸

2. 透明背景顯示：
   - 當背景圖層被隱藏時，自動顯示透明棋盤格背景
   - 這僅影響編輯時的顯示效果，不會改變最終匯出的圖片
   - 匯出時，如果背景已隱藏，會生成透明背景的 PNG 圖片
*/
// 添加新圖層
// 修正初始化背景圖層為白色

// 修改 addLayer 函數，為背景圖層填充白色
function addLayer(name, type) {
    const layer = {
        id: Date.now(),
        name: name || `圖層 ${app.layers.length + 1}`,
        type: type || LayerType.BITMAP,
        visible: true,
        opacity: 1,
        blendMode: 'normal',
        x: 0,
        y: 0,
        content: document.createElement('canvas')
    };

    // 設置圖層畫布
    layer.content.width = app.canvas.width;
    layer.content.height = app.canvas.height;

    // 如果是背景圖層，填充白色
    if (name === '背景') {
        const ctx = layer.content.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, layer.content.width, layer.content.height);
    }

    // 如果是文字圖層，添加文字特有屬性
    if (type === LayerType.TEXT) {
        layer.text = '雙擊編輯文字';
        layer.fontFamily = 'Arial';
        layer.fontSize = 20;
        layer.fontColor = '#000000';
        layer.fontBold = false;
        layer.fontItalic = false;
        layer.fontUnderline = false;

        // 渲染初始文字
        const ctx = layer.content.getContext('2d');
        ctx.font = `${layer.fontSize}px ${layer.fontFamily}`;
        ctx.fillStyle = layer.fontColor;
        ctx.fillText(layer.text, 10, 30);
    }

    // 添加到圖層列表
    app.layers.push(layer);
    app.activeLayerIndex = app.layers.length - 1;

    // 更新UI
    updateLayersUI();
    updatePropertiesPanel();

    // 保存歷史記錄
    saveToHistory();

    return layer;
}

// 修改 createNewFile 函數，確保新文件也有白色背景
function createNewFile() {
    const width = parseInt(document.getElementById('new-width').value);
    const height = parseInt(document.getElementById('new-height').value);

    if (width > 0 && height > 0) {
        // 重設畫布大小
        app.canvas.width = width;
        app.canvas.height = height;
        app.tempCanvas.width = width;
        app.tempCanvas.height = height;

        // 重設狀態
        app.layers = [];
        app.activeLayerIndex = -1;
        app.history = [];
        app.historyIndex = -1;

        // 添加背景圖層（白色）
        addLayer('背景', LayerType.BITMAP);

        // 更新畫布尺寸信息
        document.getElementById('canvas-info').textContent = `${width} x ${height} px`;

        // 隱藏對話框
        document.getElementById('new-file-modal').style.display = 'none';
    }
}
// 添加文字圖層
function addTextLayer() {
    addLayer('文字圖層', LayerType.TEXT);
    render();
}

// 刪除活動圖層
// 更新原有的 deleteActiveLayer 函數來調用新的 deleteLayer 函數
function deleteActiveLayer() {
    if (app.activeLayerIndex >= 0) {
        if (confirm(`確定要刪除圖層 "${app.layers[app.activeLayerIndex].name}" 嗎？`)) {
            deleteLayer(app.activeLayerIndex);
        }
    }
}

// 更新圖層UI
// 更新圖層項目 UI 來添加刪除按鈕
function updateLayersUI() {
    const layersList = document.getElementById('layers-list');
    layersList.innerHTML = '';

    // 反向迭代圖層以便上面的圖層在UI中顯示在頂部
    for (let i = app.layers.length - 1; i >= 0; i--) {
        const layer = app.layers[i];
        const layerItem = document.createElement('div');
        layerItem.className = `layer-item ${i === app.activeLayerIndex ? 'active' : ''}`;
        layerItem.dataset.index = i;

        // 圖層可見性圖標
        const visibilityIcon = document.createElement('span');
        visibilityIcon.className = 'layer-visibility';
        visibilityIcon.innerHTML = layer.visible ? '👁️' : '👁️‍🗨️';
        visibilityIcon.dataset.index = i;
        visibilityIcon.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLayerVisibility(parseInt(e.target.dataset.index));
        });

        // 圖層名稱
        const nameSpan = document.createElement('span');
        nameSpan.textContent = layer.name;
        nameSpan.className = 'layer-name';

        // 圖層類型圖標
        const typeIcon = document.createElement('span');
        typeIcon.textContent = layer.type === LayerType.TEXT ? 'T' : '🖌️';
        typeIcon.className = 'layer-type';

        // 刪除按鈕
        const deleteButton = document.createElement('span');
        deleteButton.className = 'layer-delete';
        deleteButton.innerHTML = '🗑️';
        deleteButton.title = '刪除圖層';
        deleteButton.dataset.index = i;
        deleteButton.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`確定要刪除圖層 "${layer.name}" 嗎？`)) {
                deleteLayer(parseInt(e.target.dataset.index));
            }
        });

        // 組裝圖層項
        layerItem.appendChild(visibilityIcon);
        layerItem.appendChild(nameSpan);
        layerItem.appendChild(typeIcon);
        layerItem.appendChild(deleteButton);

        // 添加點擊事件
        layerItem.addEventListener('click', () => {
            setActiveLayer(parseInt(layerItem.dataset.index));
        });

        layersList.appendChild(layerItem);
    }
}

// 設置活動圖層
function setActiveLayer(index) {
    app.activeLayerIndex = index;
    updateLayersUI();
    updatePropertiesPanel();
    // 隱藏文字輸入框
    app.textInputContainer.style.display = 'none';
}

// 切換圖層可見性
// 更新 toggleLayerVisibility 函數，當背景圖層切換時，強制重新渲染
// 更新 toggleLayerVisibility 函數以強制重新渲染
// 當點擊圖層可見性時，強制重新渲染
function toggleLayerVisibility(index) {
    app.layers[index].visible = !app.layers[index].visible;
    updateLayersUI();
    render(); // 重新渲染畫布
    saveToHistory();
}

// 此外，確保在 CSS 中將畫布背景設為透明
// .canvas-container 背景應為灰色或其他顏色，而不是棋盤格
// canvas { background-color: transparent; }
// 在 app 中添加鎖定比例相關狀態
app.lockAspectRatio = false;  // 預設不鎖定比例

// 更新屬性面板，添加鎖定長寬比選項
function updatePropertiesPanel() {
    if (app.activeLayerIndex < 0) return;

    const layer = app.layers[app.activeLayerIndex];

    // 更新基本屬性
    document.getElementById('layer-name').value = layer.name;
    document.getElementById('layer-opacity').value = layer.opacity * 100;
    document.getElementById('blend-mode').value = layer.blendMode;

    // 更新文字屬性面板
    const textProperties = document.getElementById('text-properties');
    if (layer.type === LayerType.TEXT) {
        textProperties.style.display = 'block';
        document.getElementById('font-family').value = layer.fontFamily;
        document.getElementById('font-size').value = layer.fontSize;
        document.getElementById('font-color').value = layer.fontColor;

        // 更新文字樣式按鈕狀態
        document.getElementById('font-bold').classList.toggle('active', layer.fontBold);
        document.getElementById('font-italic').classList.toggle('active', layer.fontItalic);
        document.getElementById('font-underline').classList.toggle('active', layer.fontUnderline);
    } else {
        textProperties.style.display = 'none';
    }

    // 顯示或隱藏圖片屬性面板
    const imageProperties = document.getElementById('image-properties');
    if (layer.type === LayerType.BITMAP && imageProperties) {
        imageProperties.style.display = 'block';
        document.getElementById('lock-aspect-ratio').checked = app.lockAspectRatio;

        // 更新尺寸顯示
        const width = layer.width || layer.content.width;
        const height = layer.height || layer.content.height;
        document.getElementById('layer-width').value = Math.round(width);
        document.getElementById('layer-height').value = Math.round(height);
    } else if (imageProperties) {
        imageProperties.style.display = 'none';
    }
}
// 更新文字圖層樣式
function updateTextLayerStyle() {
    if (app.activeLayerIndex < 0 || app.layers[app.activeLayerIndex].type !== LayerType.TEXT) return;

    const layer = app.layers[app.activeLayerIndex];
    layer.fontFamily = document.getElementById('font-family').value;
    layer.fontSize = parseInt(document.getElementById('font-size').value);
    layer.fontColor = document.getElementById('font-color').value;

    // 重新渲染文字
    renderTextLayer(layer);
    render();
    saveToHistory();
}

// 切換文字粗體
function toggleFontBold() {
    if (app.activeLayerIndex < 0 || app.layers[app.activeLayerIndex].type !== LayerType.TEXT) return;

    const layer = app.layers[app.activeLayerIndex];
    layer.fontBold = !layer.fontBold;

    // 更新按鈕狀態
    document.getElementById('font-bold').classList.toggle('active', layer.fontBold);

    // 重新渲染文字
    renderTextLayer(layer);
    render();
    saveToHistory();
}

// 切換文字斜體
function toggleFontItalic() {
    if (app.activeLayerIndex < 0 || app.layers[app.activeLayerIndex].type !== LayerType.TEXT) return;

    const layer = app.layers[app.activeLayerIndex];
    layer.fontItalic = !layer.fontItalic;

    // 更新按鈕狀態
    document.getElementById('font-italic').classList.toggle('active', layer.fontItalic);

    // 重新渲染文字
    renderTextLayer(layer);
    render();
    saveToHistory();
}

// 切換文字底線
function toggleFontUnderline() {
    if (app.activeLayerIndex < 0 || app.layers[app.activeLayerIndex].type !== LayerType.TEXT) return;

    const layer = app.layers[app.activeLayerIndex];
    layer.fontUnderline = !layer.fontUnderline;

    // 更新按鈕狀態
    document.getElementById('font-underline').classList.toggle('active', layer.fontUnderline);

    // 重新渲染文字
    renderTextLayer(layer);
    render();
    saveToHistory();
}

// 渲染文字圖層
function renderTextLayer(layer) {
    const ctx = layer.content.getContext('2d');
    ctx.clearRect(0, 0, layer.content.width, layer.content.height);

    // 設置字型
    let fontStyle = '';
    if (layer.fontItalic) fontStyle += 'italic ';
    if (layer.fontBold) fontStyle += 'bold ';

    ctx.font = `${fontStyle}${layer.fontSize}px ${layer.fontFamily}`;
    ctx.fillStyle = layer.fontColor;

    // 繪製文字
    ctx.fillText(layer.text, 10, 30);

    // 繪製底線
    if (layer.fontUnderline) {
        const textWidth = ctx.measureText(layer.text).width;
        ctx.beginPath();
        ctx.moveTo(10, 32);
        ctx.lineTo(10 + textWidth, 32);
        ctx.lineWidth = 1;
        ctx.strokeStyle = layer.fontColor;
        ctx.stroke();
    }
}

// 渲染畫布
// 更新 render 函數以支援透明背景棋盤格
// 修正透明背景棋盤格顯示

// 更新透明背景棋盤格顯示方法
function render() {
    // 清除主畫布
    app.ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);

    // 檢查背景圖層是否可見
    const backgroundLayer = app.layers.find(layer => layer.name === '背景');
    const isBackgroundVisible = backgroundLayer && backgroundLayer.visible;

    // 如果背景不可見，繪製透明棋盤格
    if (!isBackgroundVisible) {
        // 直接在畫布上繪製棋盤格
        const size = 16; // 棋盤格大小
        const canvas = app.canvas;

        // 保存當前狀態
        app.ctx.save();

        // 繪製棋盤格
        for (let x = 0; x < canvas.width; x += size) {
            for (let y = 0; y < canvas.height; y += size) {
                const isEvenCell = ((x / size) + (y / size)) % 2 === 0;
                app.ctx.fillStyle = isEvenCell ? '#ffffff' : '#cccccc';
                app.ctx.fillRect(x, y, size, size);
            }
        }

        // 恢復狀態
        app.ctx.restore();
    }

    // 按順序繪製每個可見圖層
    for (let i = 0; i < app.layers.length; i++) {
        const layer = app.layers[i];
        if (layer.visible) {
            app.ctx.globalAlpha = layer.opacity;
            app.ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode);

            // 檢查是否有自定義大小
            if (layer.width && layer.height) {
                app.ctx.drawImage(
                    layer.content,
                    0, 0, layer.content.width, layer.content.height,
                    layer.x, layer.y, layer.width, layer.height
                );
            } else {
                app.ctx.drawImage(layer.content, layer.x, layer.y);
            }
        }
    }

    // 重置畫布狀態
    app.ctx.globalAlpha = 1;
    app.ctx.globalCompositeOperation = 'source-over';
}

// 將混合模式轉換為 Canvas 的 globalCompositeOperation
function getCompositeOperation(blendMode) {
    const modeMap = {
        'normal': 'source-over',
        'multiply': 'multiply',
        'screen': 'screen',
        'overlay': 'overlay',
        // 可以添加更多混合模式
    };
    return modeMap[blendMode] || 'source-over';
}

// 保存到歷史記錄
function saveToHistory() {
    // 深拷貝圖層狀態
    const layersClone = app.layers.map(layer => {
        const layerClone = {...layer};

        // 複製畫布內容
        const canvasClone = document.createElement('canvas');
        canvasClone.width = layer.content.width;
        canvasClone.height = layer.content.height;
        const ctx = canvasClone.getContext('2d');
        ctx.drawImage(layer.content, 0, 0);
        layerClone.content = canvasClone;

        return layerClone;
    });

    // 如果我們在歷史記錄中間進行了操作，刪除之後的歷史
    if (app.historyIndex < app.history.length - 1) {
        app.history = app.history.slice(0, app.historyIndex + 1);
    }

    // 添加到歷史記錄
    app.history.push({
        layers: layersClone,
        activeLayerIndex: app.activeLayerIndex
    });

    // 限制歷史記錄長度
    if (app.history.length > 20) {
        app.history.shift();
    }

    app.historyIndex = app.history.length - 1;
}

// 撤銷操作
function undo() {
    if (app.historyIndex > 0) {
        app.historyIndex--;
        restoreFromHistory();
    }
}

// 重做操作
function redo() {
    if (app.historyIndex < app.history.length - 1) {
        app.historyIndex++;
        restoreFromHistory();
    }
}

// 從歷史記錄恢復
function restoreFromHistory() {
    const state = app.history[app.historyIndex];
    app.layers = state.layers.map(layer => {
        const layerClone = {...layer};

        // 複製畫布內容
        const canvasClone = document.createElement('canvas');
        canvasClone.width = layer.content.width;
        canvasClone.height = layer.content.height;
        const ctx = canvasClone.getContext('2d');
        ctx.drawImage(layer.content, 0, 0);
        layerClone.content = canvasClone;

        return layerClone;
    });

    app.activeLayerIndex = state.activeLayerIndex;

    // 更新UI
    updateLayersUI();
    updatePropertiesPanel();
    render();
}


// 初始化事件監聽器
function initEventListeners() {
    // 工具按鈕
    document.querySelectorAll('.tool-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const toolId = e.target.id;
            if (toolId === 'add-layer') {
                addLayer();
                render();
                return;
            }

            if (toolId.includes('tool')) {
                document.querySelectorAll('.tool-button').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                app.currentTool = toolId.replace('-tool', '');
                document.getElementById('tool-info').textContent = `工具: ${app.currentTool}`;

                // 隱藏文字輸入框
                app.textInputContainer.style.display = 'none';
            }
        });
    });

    // 畫筆大小選擇
    document.getElementById('brush-size').addEventListener('change', (e) => {
        app.brushSize = parseInt(e.target.value);
    });

    // 顏色選擇器
    document.getElementById('color-picker').addEventListener('change', (e) => {
        app.brushColor = e.target.value;
    });

    // 圖層屬性變更
    document.getElementById('layer-name').addEventListener('change', (e) => {
        if (app.activeLayerIndex >= 0) {
            app.layers[app.activeLayerIndex].name = e.target.value;
            updateLayersUI();
            saveToHistory();
        }
    });

    document.getElementById('layer-opacity').addEventListener('input', (e) => {
        if (app.activeLayerIndex >= 0) {
            app.layers[app.activeLayerIndex].opacity = parseInt(e.target.value) / 100;
            render();
        }
    });

    document.getElementById('layer-opacity').addEventListener('change', () => {
        saveToHistory();
    });

    document.getElementById('blend-mode').addEventListener('change', (e) => {
        if (app.activeLayerIndex >= 0) {
            app.layers[app.activeLayerIndex].blendMode = e.target.value;
            render();
            saveToHistory();
        }
    });

    // 文字屬性變更
    document.getElementById('font-family').addEventListener('change', updateTextLayerStyle);
    document.getElementById('font-size').addEventListener('change', updateTextLayerStyle);
    document.getElementById('font-color').addEventListener('change', updateTextLayerStyle);
    document.getElementById('font-bold').addEventListener('click', toggleFontBold);
    document.getElementById('font-italic').addEventListener('click', toggleFontItalic);
    document.getElementById('font-underline').addEventListener('click', toggleFontUnderline);

    // 畫布事件
    app.canvas.addEventListener('mousedown', handleCanvasMouseDown);
    app.canvas.addEventListener('mousemove', handleCanvasMouseMove);
    app.canvas.addEventListener('mouseup', handleCanvasMouseUp);
    app.canvas.addEventListener('dblclick', handleCanvasDoubleClick);
    app.canvas.addEventListener('mousemove', updatePositionInfo);

    // 文字輸入事件
    app.textInput.addEventListener('blur', applyTextInput);

    // 菜單事件
    document.getElementById('new-file').addEventListener('click', showNewFileDialog);
    document.getElementById('open-file').addEventListener('click', openFile);
    document.getElementById('save-file').addEventListener('click', saveFile);
    document.getElementById('export-file').addEventListener('click', exportToPNG);
    document.getElementById('undo').addEventListener('click', undo);
    document.getElementById('redo').addEventListener('click', redo);
    document.getElementById('delete-layer').addEventListener('click', deleteActiveLayer);
    document.getElementById('add-text-layer').addEventListener('click', addTextLayer);
    document.getElementById('add-image-layer').addEventListener('click', addImageLayer);

    // 處理下拉選單的延遲隱藏
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        let timeoutId;

        // 滑鼠移入時
        item.addEventListener('mouseenter', () => {
            clearTimeout(timeoutId);

            // 先隱藏所有其他選單
            document.querySelectorAll('.dropdown-content').forEach(menu => {
                menu.classList.remove('show');
            });

            // 顯示當前選單
            const dropdown = item.querySelector('.dropdown-content');
            if (dropdown) dropdown.classList.add('show');
        });

        // 滑鼠移出時
        item.addEventListener('mouseleave', () => {
            const dropdown = item.querySelector('.dropdown-content');
            if (dropdown) {
                timeoutId = setTimeout(() => {
                    dropdown.classList.remove('show');
                }, 500); // 設定500毫秒的延遲
            }
        });
    });

    // 新建檔案對話框
    document.getElementById('new-file-cancel').addEventListener('click', () => {
        document.getElementById('new-file-modal').style.display = 'none';
    });

    document.getElementById('new-file-confirm').addEventListener('click', createNewFile);

    // 檔案上傳
    document.getElementById('file-input').addEventListener('change', handleFileUpload);

    // 防止頁面離開時資料遺失
    window.addEventListener('beforeunload', (e) => {
        const confirmationMessage = '您有未保存的更改，確定要離開嗎？';
        e.returnValue = confirmationMessage;
        return confirmationMessage;
    });
}

// 更新位置信息
function updatePositionInfo(e) {
    const rect = app.canvas.getBoundingClientRect();
    const x = Math.floor(e.clientX - rect.left);
    const y = Math.floor(e.clientY - rect.top);
    document.getElementById('position-info').textContent = `位置: ${x}, ${y}`;
}

// 處理畫布滑鼠按下事件
function handleCanvasMouseDown(e) {
    const rect = app.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    app.lastX = x;
    app.lastY = y;

    if (app.activeLayerIndex < 0) return;

    switch (app.currentTool) {
        case 'move':
            // 開始拖動
            if (app.activeLayerIndex >= 0) {
                app.dragInfo.isDragging = true;
                app.dragInfo.startX = x;
                app.dragInfo.startY = y;
                app.dragInfo.layerStartX = app.layers[app.activeLayerIndex].x;
                app.dragInfo.layerStartY = app.layers[app.activeLayerIndex].y;
            }
            break;
        case 'brush':
        case 'eraser':
            app.isDrawing = true;
            drawOnLayer(x, y, false);
            break;
        case 'text':
            // 只有在文字圖層上才能開始文字編輯
            if (app.layers[app.activeLayerIndex].type === LayerType.TEXT) {
                showTextInput(x, y);
            }
            break;
    }
}

// 處理畫布滑鼠移動事件
function handleCanvasMouseMove(e) {
    const rect = app.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (app.dragInfo.isDragging) {
        // 移動圖層
        const layer = app.layers[app.activeLayerIndex];
        layer.x = app.dragInfo.layerStartX + (x - app.dragInfo.startX);
        layer.y = app.dragInfo.layerStartY + (y - app.dragInfo.startY);
        render();
    } else if (app.isDrawing) {
        // 繪製
        drawOnLayer(x, y, true);
    }

    app.lastX = x;
    app.lastY = y;
}

// 處理畫布滑鼠鬆開事件
function handleCanvasMouseUp() {
    if (app.dragInfo.isDragging || app.isDrawing) {
        saveToHistory();
    }

    app.dragInfo.isDragging = false;
    app.isDrawing = false;
}

// 在圖層上繪製
function drawOnLayer(x, y, isMove) {
    if (app.activeLayerIndex < 0) return;

    const layer = app.layers[app.activeLayerIndex];
    if (layer.type !== LayerType.BITMAP) return;

    const ctx = layer.content.getContext('2d');

    // 設置繪製參數
    ctx.lineWidth = app.brushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (app.currentTool === 'brush') {
        ctx.strokeStyle = app.brushColor;
        ctx.globalCompositeOperation = 'source-over';
    } else if (app.currentTool === 'eraser') {
        ctx.strokeStyle = '#ffffff';
        ctx.globalCompositeOperation = 'destination-out';
    }

    // 開始繪製
    if (!isMove) {
        ctx.beginPath();
        ctx.moveTo(x - layer.x, y - layer.y);
        ctx.lineTo(x - layer.x + 0.1, y - layer.y + 0.1);
        ctx.stroke();
    } else {
        ctx.beginPath();
        ctx.moveTo(app.lastX - layer.x, app.lastY - layer.y);
        ctx.lineTo(x - layer.x, y - layer.y);
        ctx.stroke();
    }

    // 重置繪圖環境
    ctx.globalCompositeOperation = 'source-over';

    render();
}

// 處理畫布雙擊事件
function handleCanvasDoubleClick(e) {
    const rect = app.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (app.activeLayerIndex >= 0 && app.layers[app.activeLayerIndex].type === LayerType.TEXT) {
        showTextInput(x, y);
    }
}

// 顯示文字輸入框
function showTextInput(x, y) {
    const layer = app.layers[app.activeLayerIndex];

    // 設置文字輸入框位置
    app.textInputContainer.style.display = 'block';
    app.textInputContainer.style.left = (layer.x + 10) + 'px';
    app.textInputContainer.style.top = (layer.y + 10) + 'px';

    // 設置文字輸入框樣式
    app.textInput.style.fontFamily = layer.fontFamily;
    app.textInput.style.fontSize = layer.fontSize + 'px';
    app.textInput.style.color = layer.fontColor;
    app.textInput.style.fontWeight = layer.fontBold ? 'bold' : 'normal';
    app.textInput.style.fontStyle = layer.fontItalic ? 'italic' : 'normal';
    app.textInput.style.textDecoration = layer.fontUnderline ? 'underline' : 'none';

    // 設置文字內容
    app.textInput.textContent = layer.text;

    // 聚焦文字輸入框
    app.textInput.focus();
}

// 應用文字輸入
function applyTextInput() {
    if (app.activeLayerIndex < 0 || app.layers[app.activeLayerIndex].type !== LayerType.TEXT) return;

    const layer = app.layers[app.activeLayerIndex];
    layer.text = app.textInput.textContent || '雙擊編輯文字';

    // 重新渲染文字
    renderTextLayer(layer);
    render();

    // 隱藏文字輸入框
    app.textInputContainer.style.display = 'none';

    saveToHistory();
}

// 顯示新建檔案對話框
function showNewFileDialog() {
    document.getElementById('new-file-modal').style.display = 'block';
}

// 創建新檔案
// 修改 createNewFile 函數，確保新文件也有白色背景
function createNewFile() {
    const width = parseInt(document.getElementById('new-width').value);
    const height = parseInt(document.getElementById('new-height').value);

    if (width > 0 && height > 0) {
        // 重設畫布大小
        app.canvas.width = width;
        app.canvas.height = height;
        app.tempCanvas.width = width;
        app.tempCanvas.height = height;

        // 重設狀態
        app.layers = [];
        app.activeLayerIndex = -1;
        app.history = [];
        app.historyIndex = -1;

        // 添加背景圖層（白色）
        addLayer('背景', LayerType.BITMAP);

        // 更新畫布尺寸信息
        document.getElementById('canvas-info').textContent = `${width} x ${height} px`;

        // 隱藏對話框
        document.getElementById('new-file-modal').style.display = 'none';
    }
}
// 打開檔案功能
function openFile() {
    // 創建一個用於開啟檔案的隱藏輸入元素
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.psc,image/*'; // 接受專案檔和所有圖片格式

    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 檢查檔案類型
        if (file.name.toLowerCase().endsWith('.psc')) {
            // 處理專案檔案
            openProjectFile(file);
        } else {
            // 處理圖片檔案（作為新圖層導入）
            openImageFile(file);
        }
    });

    // 模擬點擊開啟檔案對話框
    document.body.appendChild(fileInput);
    fileInput.click();
    document.body.removeChild(fileInput);
}

// 開啟專案檔案 (.psc)
function openProjectFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            // 解析 JSON 檔案
            const fileData = JSON.parse(event.target.result);

            // 驗證檔案版本
            if (!fileData.version || !fileData.layers) {
                throw new Error('無效的專案檔格式');
            }

            // 重設畫布大小
            app.canvas.width = fileData.width || 800;
            app.canvas.height = fileData.height || 600;
            app.tempCanvas.width = app.canvas.width;
            app.tempCanvas.height = app.canvas.height;

            // 更新畫布尺寸信息
            document.getElementById('canvas-info').textContent = `${app.canvas.width} x ${app.canvas.height} px`;

            // 重設狀態
            app.layers = [];
            app.activeLayerIndex = -1;
            app.history = [];
            app.historyIndex = -1;

            // 載入圖層
            const loadImagePromises = [];

            fileData.layers.forEach((layerData, index) => {
                const promise = new Promise((resolve) => {
                    const layer = {
                        id: layerData.id || Date.now() + index,
                        name: layerData.name || `圖層 ${index + 1}`,
                        type: layerData.type || LayerType.BITMAP,
                        visible: layerData.visible !== undefined ? layerData.visible : true,
                        opacity: layerData.opacity !== undefined ? layerData.opacity : 1,
                        blendMode: layerData.blendMode || 'normal',
                        x: layerData.x || 0,
                        y: layerData.y || 0,
                        content: document.createElement('canvas')
                    };

                    // 設置圖層畫布
                    layer.content.width = app.canvas.width;
                    layer.content.height = app.canvas.height;

                    // 載入圖層內容
                    if (layerData.contentData) {
                        const img = new Image();
                        img.onload = function() {
                            const ctx = layer.content.getContext('2d');
                            ctx.drawImage(img, 0, 0);

                            // 如果是文字圖層，添加文字特有屬性
                            if (layer.type === LayerType.TEXT) {
                                layer.text = layerData.text || '雙擊編輯文字';
                                layer.fontFamily = layerData.fontFamily || 'Arial';
                                layer.fontSize = layerData.fontSize || 20;
                                layer.fontColor = layerData.fontColor || '#000000';
                                layer.fontBold = layerData.fontBold || false;
                                layer.fontItalic = layerData.fontItalic || false;
                                layer.fontUnderline = layerData.fontUnderline || false;
                            }

                            app.layers.push(layer);
                            resolve();
                        };
                        img.onerror = function() {
                            console.error('載入圖層圖像失敗', layerData.name);
                            // 即使圖像載入失敗，仍添加圖層
                            app.layers.push(layer);
                            resolve();
                        };
                        img.src = layerData.contentData;
                    } else {
                        // 沒有內容數據，添加空圖層
                        app.layers.push(layer);
                        resolve();
                    }
                });

                loadImagePromises.push(promise);
            });

            // 當所有圖層載入完成後，更新UI並渲染
            Promise.all(loadImagePromises).then(() => {
                if (app.layers.length > 0) {
                    app.activeLayerIndex = 0;
                }

                // 更新UI
                updateLayersUI();
                updatePropertiesPanel();
                render();

                // 保存歷史記錄
                saveToHistory();

                alert('專案檔載入成功');
            });

        } catch (error) {
            console.error('載入專案檔失敗:', error);
            alert('載入專案檔失敗: ' + error.message);
        }
    };

    reader.onerror = function() {
        alert('讀取檔案時發生錯誤');
    };

    reader.readAsText(file);
}

// 開啟圖片檔案作為新圖層
// 修改 openImageFile 函數，移除成功提示
function openImageFile(file) {
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // 創建新圖層
            const layer = addLayer(file.name, LayerType.BITMAP);

            // 將圖片繪製到圖層上
            const ctx = layer.content.getContext('2d');

            // 計算縮放比例，確保圖片完全顯示在畫布中
            const scale = Math.min(
                app.canvas.width / img.width,
                app.canvas.height / img.height
            );

            // 計算縮放後的尺寸
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;

            // 計算居中位置
            const x = (app.canvas.width - scaledWidth) / 2;
            const y = (app.canvas.height - scaledHeight) / 2;

            // 清空圖層
            ctx.clearRect(0, 0, layer.content.width, layer.content.height);

            // 繪製圖片
            ctx.drawImage(img, 0, 0, img.width, img.height, x, y, scaledWidth, scaledHeight);

            // 更新畫布
            render();
            saveToHistory();

            // 移除成功提示
            // alert('圖片已成功載入為新圖層');
        };
        img.onerror = function() {
            alert('載入圖片失敗');
        };
        img.src = event.target.result;
    };

    reader.onerror = function() {
        alert('讀取圖片檔案時發生錯誤');
    };

    reader.readAsDataURL(file);
}
// 儲存檔案
function saveFile() {
    try {
        // 創建一個包含所有必要數據的對象
        const fileData = {
            version: '1.0',
            width: app.canvas.width,
            height: app.canvas.height,
            layers: app.layers.map(layer => {
                // 克隆圖層但不包含畫布
                const layerClone = { ...layer };
                delete layerClone.content;

                // 將畫布內容轉換為 base64 字符串
                const dataURL = layer.content.toDataURL('image/png');
                layerClone.contentData = dataURL;

                return layerClone;
            })
        };

        // 將數據轉換為 JSON 字符串
        const jsonString = JSON.stringify(fileData);

        // 創建一個 Blob 對象
        const blob = new Blob([jsonString], { type: 'application/json' });

        // 創建一個下載鏈接
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'photoshop_clone_project.psc';

        // 模擬點擊下載
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('保存檔案時出錯:', error);
        alert('保存檔案失敗');
    }
}

// 匯出為 PNG
function exportToPNG() {
    try {
        // 創建一個臨時畫布
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = app.canvas.width;
        exportCanvas.height = app.canvas.height;
        const ctx = exportCanvas.getContext('2d');

        // 清除畫布（透明背景）
        ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

        // 檢查是否所有圖層都是隱藏的
        const allLayersHidden = app.layers.every(layer => !layer.visible);

        // 如果所有圖層都隱藏了，提醒用戶
        if (allLayersHidden) {
            if (!confirm('目前所有圖層都是隱藏的，匯出的圖片將是完全透明的。是否繼續？')) {
                return;
            }
        }

        // 繪製所有可見圖層
        for (let i = 0; i < app.layers.length; i++) {
            const layer = app.layers[i];
            if (layer.visible) {
                ctx.globalAlpha = layer.opacity;
                ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode);
                ctx.drawImage(layer.content, layer.x, layer.y);
            }
        }

        // 將畫布轉換為 PNG 並下載
        const link = document.createElement('a');
        link.href = exportCanvas.toDataURL('image/png');
        link.download = 'photoshop_clone_export.png';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('匯出 PNG 時出錯:', error);
        alert('匯出 PNG 失敗');
    }
}

// 添加圖片圖層
function addImageLayer() {
    // 觸發文件選擇對話框
    document.getElementById('file-input').click();
}

// 處理文件上傳
// 同樣需要修改 handleFileUpload 函數，移除成功提示
function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            // 創建新圖層
            const layer = addLayer(file.name, LayerType.BITMAP);

            // 將圖片繪製到圖層上
            const ctx = layer.content.getContext('2d');

            // 計算縮放比例，確保圖片完全顯示在畫布中
            const scale = Math.min(
                app.canvas.width / img.width,
                app.canvas.height / img.height
            );

            // 計算縮放後的尺寸
            const scaledWidth = img.width * scale;
            const scaledHeight = img.height * scale;

            // 計算居中位置
            const x = (app.canvas.width - scaledWidth) / 2;
            const y = (app.canvas.height - scaledHeight) / 2;

            // 繪製圖片
            ctx.drawImage(img, 0, 0, img.width, img.height, x, y, scaledWidth, scaledHeight);

            // 更新畫布
            render();
            saveToHistory();

            // 移除成功提示
            // alert('圖片已成功載入為新圖層');
        };
        img.src = event.target.result;
    };
    reader.readAsDataURL(file);

    // 重置文件輸入框，使得相同文件可以再次被選擇
    e.target.value = '';
}

// 圖層大小調整相關功能

// 在 app 中添加調整大小相關狀態
app.resizeInfo = {
    isResizing: false,
    handle: '', // 'tl', 'tr', 'bl', 'br', 'ml', 'mr', 'tm', 'bm'
    startX: 0,
    startY: 0,
    layerStartX: 0,
    layerStartY: 0,
    layerStartWidth: 0,
    layerStartHeight: 0,
    resizeHandles: []
};

// 創建調整大小的控制點
function createResizeHandles() {
    // 清除現有的控制點
    app.resizeInfo.resizeHandles.forEach(handle => {
        if (handle.parentNode) {
            handle.parentNode.removeChild(handle);
        }
    });
    app.resizeInfo.resizeHandles = [];

    if (app.activeLayerIndex < 0) return;

    const layer = app.layers[app.activeLayerIndex];
    const canvasWrapper = document.getElementById('canvas-wrapper');

    // 獲取圖層的邊界
    const layerRect = {
        left: layer.x,
        top: layer.y,
        right: layer.x + (layer.width || layer.content.width),
        bottom: layer.y + (layer.height || layer.content.height)
    };

    // 控制點位置
    const handlePositions = [
        { id: 'tl', left: layerRect.left, top: layerRect.top, cursor: 'nw-resize' },
        { id: 'tm', left: (layerRect.left + layerRect.right) / 2, top: layerRect.top, cursor: 'n-resize' },
        { id: 'tr', left: layerRect.right, top: layerRect.top, cursor: 'ne-resize' },
        { id: 'ml', left: layerRect.left, top: (layerRect.top + layerRect.bottom) / 2, cursor: 'w-resize' },
        { id: 'mr', left: layerRect.right, top: (layerRect.top + layerRect.bottom) / 2, cursor: 'e-resize' },
        { id: 'bl', left: layerRect.left, top: layerRect.bottom, cursor: 'sw-resize' },
        { id: 'bm', left: (layerRect.left + layerRect.right) / 2, top: layerRect.bottom, cursor: 's-resize' },
        { id: 'br', left: layerRect.right, top: layerRect.bottom, cursor: 'se-resize' }
    ];

    // 創建控制點元素
    handlePositions.forEach(pos => {
        const handle = document.createElement('div');
        handle.className = 'resize-handle';
        handle.id = `resize-handle-${pos.id}`;
        handle.dataset.handle = pos.id;

        handle.style.position = 'absolute';
        handle.style.width = '10px';
        handle.style.height = '10px';
        handle.style.backgroundColor = '#007bff';
        handle.style.border = '1px solid white';
        handle.style.borderRadius = '50%';
        handle.style.transform = 'translate(-50%, -50%)';
        handle.style.cursor = pos.cursor;
        handle.style.zIndex = '20';

        handle.style.left = `${pos.left}px`;
        handle.style.top = `${pos.top}px`;

        handle.addEventListener('mousedown', startResize);

        canvasWrapper.appendChild(handle);
        app.resizeInfo.resizeHandles.push(handle);
    });

    // 添加邊框來顯示選中的圖層
    const border = document.createElement('div');
    border.className = 'layer-border';
    border.style.position = 'absolute';
    border.style.left = `${layerRect.left}px`;
    border.style.top = `${layerRect.top}px`;
    border.style.width = `${layerRect.right - layerRect.left}px`;
    border.style.height = `${layerRect.bottom - layerRect.top}px`;
    border.style.border = '1px dashed #007bff';
    border.style.pointerEvents = 'none';
    border.style.zIndex = '19';

    canvasWrapper.appendChild(border);
    app.resizeInfo.resizeHandles.push(border);
}

// 開始調整大小
function startResize(e) {
    e.preventDefault();
    e.stopPropagation();

    if (app.activeLayerIndex < 0) return;

    const layer = app.layers[app.activeLayerIndex];

    app.resizeInfo.isResizing = true;
    app.resizeInfo.handle = e.target.dataset.handle;
    app.resizeInfo.startX = e.clientX;
    app.resizeInfo.startY = e.clientY;
    app.resizeInfo.layerStartX = layer.x;
    app.resizeInfo.layerStartY = layer.y;
    app.resizeInfo.layerStartWidth = layer.width || layer.content.width;
    app.resizeInfo.layerStartHeight = layer.height || layer.content.height;

    document.addEventListener('mousemove', resizeLayer);
    document.addEventListener('mouseup', endResize);
}

// 調整圖層大小
// 修改調整圖層大小函數以支援鎖定長寬比
function resizeLayer(e) {
    if (!app.resizeInfo.isResizing || app.activeLayerIndex < 0) return;

    const layer = app.layers[app.activeLayerIndex];
    const deltaX = e.clientX - app.resizeInfo.startX;
    const deltaY = e.clientY - app.resizeInfo.startY;

    // 原始尺寸和比例
    const originalWidth = app.resizeInfo.layerStartWidth;
    const originalHeight = app.resizeInfo.layerStartHeight;
    const aspectRatio = originalWidth / originalHeight;

    // 根據不同的控制點計算新尺寸和位置
    let newX = layer.x;
    let newY = layer.y;
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    switch (app.resizeInfo.handle) {
        case 'tl': // 左上
            newX = app.resizeInfo.layerStartX + deltaX;
            newY = app.resizeInfo.layerStartY + deltaY;
            newWidth = originalWidth - deltaX;
            newHeight = originalHeight - deltaY;

            // 鎖定比例時調整
            if (app.lockAspectRatio) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    newHeight = newWidth / aspectRatio;
                    newY = app.resizeInfo.layerStartY + (originalHeight - newHeight);
                } else {
                    newWidth = newHeight * aspectRatio;
                    newX = app.resizeInfo.layerStartX + (originalWidth - newWidth);
                }
            }
            break;
        case 'tm': // 上中
            newY = app.resizeInfo.layerStartY + deltaY;
            newHeight = originalHeight - deltaY;

            // 鎖定比例時調整
            if (app.lockAspectRatio) {
                newWidth = newHeight * aspectRatio;
                newX = app.resizeInfo.layerStartX + (originalWidth - newWidth) / 2;
            }
            break;
        case 'tr': // 右上
            newY = app.resizeInfo.layerStartY + deltaY;
            newWidth = originalWidth + deltaX;
            newHeight = originalHeight - deltaY;

            // 鎖定比例時調整
            if (app.lockAspectRatio) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    newHeight = newWidth / aspectRatio;
                    newY = app.resizeInfo.layerStartY + (originalHeight - newHeight);
                } else {
                    newWidth = newHeight * aspectRatio;
                }
            }
            break;
        case 'ml': // 左中
            newX = app.resizeInfo.layerStartX + deltaX;
            newWidth = originalWidth - deltaX;

            // 鎖定比例時調整
            if (app.lockAspectRatio) {
                newHeight = newWidth / aspectRatio;
                newY = app.resizeInfo.layerStartY + (originalHeight - newHeight) / 2;
            }
            break;
        case 'mr': // 右中
            newWidth = originalWidth + deltaX;

            // 鎖定比例時調整
            if (app.lockAspectRatio) {
                newHeight = newWidth / aspectRatio;
                newY = app.resizeInfo.layerStartY + (originalHeight - newHeight) / 2;
            }
            break;
        case 'bl': // 左下
            newX = app.resizeInfo.layerStartX + deltaX;
            newWidth = originalWidth - deltaX;
            newHeight = originalHeight + deltaY;

            // 鎖定比例時調整
            if (app.lockAspectRatio) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newWidth = newHeight * aspectRatio;
                    newX = app.resizeInfo.layerStartX + (originalWidth - newWidth);
                }
            }
            break;
        case 'bm': // 下中
            newHeight = originalHeight + deltaY;

            // 鎖定比例時調整
            if (app.lockAspectRatio) {
                newWidth = newHeight * aspectRatio;
                newX = app.resizeInfo.layerStartX + (originalWidth - newWidth) / 2;
            }
            break;
        case 'br': // 右下
            newWidth = originalWidth + deltaX;
            newHeight = originalHeight + deltaY;

            // 鎖定比例時調整
            if (app.lockAspectRatio) {
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    newHeight = newWidth / aspectRatio;
                } else {
                    newWidth = newHeight * aspectRatio;
                }
            }
            break;
    }

    // 確保尺寸不小於最小值
    newWidth = Math.max(20, newWidth);
    newHeight = Math.max(20, newHeight);

    // 更新圖層屬性
    layer.x = newX;
    layer.y = newY;
    layer.width = newWidth;
    layer.height = newHeight;

    // 更新調整大小控制點的位置
    updateResizeHandlePositions();

    // 更新尺寸顯示
    if (document.getElementById('layer-width')) {
        document.getElementById('layer-width').value = Math.round(newWidth);
        document.getElementById('layer-height').value = Math.round(newHeight);
    }

    // 渲染畫布
    render();
}

// 結束調整大小
function endResize() {
    if (app.resizeInfo.isResizing) {
        app.resizeInfo.isResizing = false;

        // 保存操作到歷史記錄
        saveToHistory();

        // 移除事件監聽器
        document.removeEventListener('mousemove', resizeLayer);
        document.removeEventListener('mouseup', endResize);
    }
}

// 更新調整大小控制點的位置
function updateResizeHandlePositions() {
    if (app.activeLayerIndex < 0) return;

    const layer = app.layers[app.activeLayerIndex];

    // 獲取圖層的邊界
    const layerRect = {
        left: layer.x,
        top: layer.y,
        right: layer.x + (layer.width || layer.content.width),
        bottom: layer.y + (layer.height || layer.content.height)
    };

    // 控制點位置
    const handlePositions = {
        'tl': { left: layerRect.left, top: layerRect.top },
        'tm': { left: (layerRect.left + layerRect.right) / 2, top: layerRect.top },
        'tr': { left: layerRect.right, top: layerRect.top },
        'ml': { left: layerRect.left, top: (layerRect.top + layerRect.bottom) / 2 },
        'mr': { left: layerRect.right, top: (layerRect.top + layerRect.bottom) / 2 },
        'bl': { left: layerRect.left, top: layerRect.bottom },
        'bm': { left: (layerRect.left + layerRect.right) / 2, top: layerRect.bottom },
        'br': { left: layerRect.right, top: layerRect.bottom }
    };

    // 更新控制點元素位置
    app.resizeInfo.resizeHandles.forEach(handle => {
        if (handle.className === 'resize-handle') {
            const pos = handlePositions[handle.dataset.handle];
            if (pos) {
                handle.style.left = `${pos.left}px`;
                handle.style.top = `${pos.top}px`;
            }
        } else if (handle.className === 'layer-border') {
            handle.style.left = `${layerRect.left}px`;
            handle.style.top = `${layerRect.top}px`;
            handle.style.width = `${layerRect.right - layerRect.left}px`;
            handle.style.height = `${layerRect.bottom - layerRect.top}px`;
        }
    });
}

// 顯示或隱藏調整大小控制點
function toggleResizeHandles(show) {
    if (show) {
        createResizeHandles();
    } else {
        app.resizeInfo.resizeHandles.forEach(handle => {
            if (handle.parentNode) {
                handle.parentNode.removeChild(handle);
            }
        });
        app.resizeInfo.resizeHandles = [];
    }
}

// 更新渲染函數來處理圖層大小調整
// 更新 render 函數以確保透明背景的棋盤格正確顯示
function render() {
    // 清除主畫布
    app.ctx.clearRect(0, 0, app.canvas.width, app.canvas.height);

    // 檢查背景圖層是否可見
    const backgroundLayer = app.layers.find(layer => layer.name === '背景');
    const isBackgroundVisible = backgroundLayer && backgroundLayer.visible;

    // 如果背景不可見，繪製透明棋盤格
    if (!isBackgroundVisible) {
        // 直接在畫布上繪製棋盤格
        const size = 16; // 棋盤格大小

        // 保存當前狀態
        app.ctx.save();

        // 繪製棋盤格模式
        for (let y = 0; y < app.canvas.height; y += size) {
            for (let x = 0; x < app.canvas.width; x += size) {
                // 交替填充白色和淺灰色
                if ((Math.floor(x / size) + Math.floor(y / size)) % 2 === 0) {
                    app.ctx.fillStyle = '#FFFFFF';
                } else {
                    app.ctx.fillStyle = '#CCCCCC';
                }
                app.ctx.fillRect(x, y, size, size);
            }
        }

        // 恢復狀態
        app.ctx.restore();
    }

    // 按順序繪製每個可見圖層
    for (let i = 0; i < app.layers.length; i++) {
        const layer = app.layers[i];
        if (layer.visible) {
            app.ctx.globalAlpha = layer.opacity;
            app.ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode);

            // 檢查是否有自定義大小
            if (layer.width && layer.height) {
                app.ctx.drawImage(
                    layer.content,
                    0, 0, layer.content.width, layer.content.height,
                    layer.x, layer.y, layer.width, layer.height
                );
            } else {
                app.ctx.drawImage(layer.content, layer.x, layer.y);
            }
        }
    }

    // 重置畫布狀態
    app.ctx.globalAlpha = 1;
    app.ctx.globalCompositeOperation = 'source-over';
}

// 更新匯出功能以確保真正的透明背景
function exportToPNG() {
    try {
        // 創建一個臨時畫布
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = app.canvas.width;
        exportCanvas.height = app.canvas.height;
        const ctx = exportCanvas.getContext('2d', { alpha: true }); // 確保支援透明度

        // 清除畫布（透明背景）
        ctx.clearRect(0, 0, exportCanvas.width, exportCanvas.height);

        // 檢查是否所有圖層都是隱藏的
        const allLayersHidden = app.layers.every(layer => !layer.visible);

        // 如果所有圖層都隱藏了，提醒用戶
        if (allLayersHidden) {
            if (!confirm('目前所有圖層都是隱藏的，匯出的圖片將是完全透明的。是否繼續？')) {
                return;
            }
        }

        // 繪製所有可見圖層
        for (let i = 0; i < app.layers.length; i++) {
            const layer = app.layers[i];
            if (layer.visible) {
                ctx.globalAlpha = layer.opacity;
                ctx.globalCompositeOperation = getCompositeOperation(layer.blendMode);

                // 檢查是否有自定義大小
                if (layer.width && layer.height) {
                    ctx.drawImage(
                        layer.content,
                        0, 0, layer.content.width, layer.content.height,
                        layer.x, layer.y, layer.width, layer.height
                    );
                } else {
                    ctx.drawImage(layer.content, layer.x, layer.y);
                }
            }
        }

        // 將畫布轉換為 PNG 並下載
        const link = document.createElement('a');
        link.href = exportCanvas.toDataURL('image/png');
        link.download = 'photoshop_clone_export.png';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch (error) {
        console.error('匯出 PNG 時出錯:', error);
        alert('匯出 PNG 失敗');
    }
}

// 修改設置活動圖層函數，顯示調整大小控制點
function setActiveLayer(index) {
    // 先隱藏現有的控制點
    toggleResizeHandles(false);

    app.activeLayerIndex = index;
    updateLayersUI();
    updatePropertiesPanel();

    // 隱藏文字輸入框
    app.textInputContainer.style.display = 'none';

    // 如果選中的是圖片圖層，顯示調整大小控制點
    if (index >= 0 && app.layers[index].type === LayerType.BITMAP) {
        toggleResizeHandles(true);
    }
}

// 更新事件監聽器
function updateEventListeners() {
    // 當工具切換時，更新控制點顯示
    document.querySelectorAll('.tool-button').forEach(button => {
        if (button.id && button.id.includes('tool')) {
            button.addEventListener('click', (e) => {
                // 如果活動圖層是圖片類型，且當前工具是移動工具，顯示控制點
                if (app.activeLayerIndex >= 0 &&
                    app.layers[app.activeLayerIndex].type === LayerType.BITMAP &&
                    e.target.id === 'move-tool') {
                    toggleResizeHandles(true);
                } else {
                    toggleResizeHandles(false);
                }
            });
        }
    });

    // 畫布點擊時，如果不是在調整大小，移除控制點
    app.canvas.addEventListener('mousedown', (e) => {
        if (!app.resizeInfo.isResizing && app.currentTool !== 'move') {
            toggleResizeHandles(false);
        }
    });
}

// 修改現有的 handleCanvasMouseUp 函數
function handleCanvasMouseUp() {
    if (app.dragInfo.isDragging || app.isDrawing) {
        saveToHistory();
    }

    app.dragInfo.isDragging = false;
    app.isDrawing = false;

    // 如果活動圖層是圖片類型，且當前工具是移動工具，更新控制點
    if (app.activeLayerIndex >= 0 &&
        app.layers[app.activeLayerIndex].type === LayerType.BITMAP &&
        app.currentTool === 'move') {
        updateResizeHandlePositions();
    }
}

// 初始化調整大小功能
function initResizeFeature() {
    // 將調整大小功能集成到現有代碼中
    updateEventListeners();
}


// 添加從輸入框直接調整尺寸的功能
function setupSizeInputHandlers() {
    const widthInput = document.getElementById('layer-width');
    const heightInput = document.getElementById('layer-height');

    if (widthInput && heightInput) {
        widthInput.addEventListener('change', function(e) {
            if (app.activeLayerIndex < 0) return;

            const layer = app.layers[app.activeLayerIndex];
            const newWidth = parseInt(e.target.value);

            if (isNaN(newWidth) || newWidth < 20) return;

            const originalWidth = layer.width || layer.content.width;
            const originalHeight = layer.height || layer.content.height;
            const aspectRatio = originalWidth / originalHeight;

            layer.width = newWidth;

            // 如果鎖定比例，同時調整高度
            if (app.lockAspectRatio) {
                layer.height = newWidth / aspectRatio;
                heightInput.value = Math.round(layer.height);
            }

            updateResizeHandlePositions();
            render();
            saveToHistory();
        });

        heightInput.addEventListener('change', function(e) {
            if (app.activeLayerIndex < 0) return;

            const layer = app.layers[app.activeLayerIndex];
            const newHeight = parseInt(e.target.value);

            if (isNaN(newHeight) || newHeight < 20) return;

            const originalWidth = layer.width || layer.content.width;
            const originalHeight = layer.height || layer.content.height;
            const aspectRatio = originalWidth / originalHeight;

            layer.height = newHeight;

            // 如果鎖定比例，同時調整寬度
            if (app.lockAspectRatio) {
                layer.width = newHeight * aspectRatio;
                widthInput.value = Math.round(layer.width);
            }

            updateResizeHandlePositions();
            render();
            saveToHistory();
        });
    }

    // 鎖定長寬比切換
    const lockAspectRatioCheckbox = document.getElementById('lock-aspect-ratio');
    if (lockAspectRatioCheckbox) {
        lockAspectRatioCheckbox.addEventListener('change', function(e) {
            app.lockAspectRatio = e.target.checked;
        });
    }
}

// 透明背景棋盤格效果實現

// 創建透明背景圖案
function createTransparentPattern() {
    // 創建一個小畫布來繪製棋盤格圖案
    const patternCanvas = document.createElement('canvas');
    const patternSize = 16; // 每個格子的大小
    patternCanvas.width = patternSize * 2;
    patternCanvas.height = patternSize * 2;

    const patternCtx = patternCanvas.getContext('2d');

    // 繪製棋盤格
    patternCtx.fillStyle = '#ffffff'; // 白色格子
    patternCtx.fillRect(0, 0, patternSize * 2, patternSize * 2);

    patternCtx.fillStyle = '#cccccc'; // 灰色格子
    patternCtx.fillRect(0, 0, patternSize, patternSize);
    patternCtx.fillRect(patternSize, patternSize, patternSize, patternSize);

    // 創建圖案對象
    return patternCanvas;
}

// 初始化時創建透明背景圖案
function initTransparentBackground() {
    app.transparentPattern = createTransparentPattern();
}

// 添加圖層刪除功能

// 刪除指定圖層
function deleteLayer(index) {
    // 確保至少有一個圖層
    if (app.layers.length <= 1) {
        alert('無法刪除最後一個圖層。');
        return;
    }

    // 刪除圖層
    app.layers.splice(index, 1);

    // 更新當前活動圖層
    if (app.activeLayerIndex >= app.layers.length) {
        app.activeLayerIndex = app.layers.length - 1;
    } else if (app.activeLayerIndex === index) {
        app.activeLayerIndex = Math.min(index, app.layers.length - 1);
    }

    // 更新 UI
    updateLayersUI();
    updatePropertiesPanel();

    // 隱藏調整大小控制點
    toggleResizeHandles(false);

    // 重新渲染
    render();

    // 保存到歷史記錄
    saveToHistory();
}
