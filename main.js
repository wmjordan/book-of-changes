const IS_FILE_PROTOCOL = window.location.protocol === 'file:';

// 卦名数据
const GUA_DATA = [
	"乾", "坤", "屯", "蒙", "需", "讼", "师", "比",
	"小畜", "履", "泰", "否", "同人", "大有", "谦", "豫",
	"随", "蛊", "临", "观", "噬嗑", "贲", "剥", "复",
	"无妄", "大畜", "颐", "大过", "坎", "离", "咸", "恒",
	"遁", "大壮", "晋", "明夷", "家人", "睽", "蹇", "解",
	"损", "益", "夬", "姤", "萃", "升", "困", "井",
	"革", "鼎", "震", "艮", "渐", "归妹", "丰", "旅",
	"巽", "兑", "涣", "节", "中孚", "小过", "既济", "未济"
];

// 卦序查找表
const GUA_ORDER_MAP = {};
GUA_DATA.forEach((name, index) => {
	GUA_ORDER_MAP[name] = index + 1; // 卦序从1开始
});

// 二进制卦序映射
const BINARY_ORDER = [
	'坤', '复', '师', '临', '谦', '明夷', '升', '泰',
	'豫', '震', '解', '归妹', '小过', '丰', '恒', '大壮',
	'比', '屯', '坎', '节', '蹇', '既济', '井', '需',
	'萃', '随', '困', '兑', '咸', '革', '大过', '夬',
	'剥', '颐', '蒙', '损', '艮', '贲', '蛊', '大畜',
	'晋', '噬嗑', '未济', '睽', '旅', '离', '鼎', '大有',
	'观', '益', '涣', '中孚', '渐', '家人', '巽', '小畜',
	'否', '无妄', '讼', '履', '遁', '同人', '姤', '乾'
];

const trigrams = [
	{ "名": "坤", "卦形": "☷", "象": "地", "德": "顺", "季": "立秋", "先天方位": "北", "后天方位": "西南", "身": "腹", "亲": "母", "兽": "牛" },
	{ "名": "震", "卦形": "☳", "象": "雷", "德": "动", "季": "春分", "先天方位": "东北", "后天方位": "东", "身": "足", "亲": "长兄", "兽": "龙" },
	{ "名": "坎", "卦形": "☵", "象": "水", "德": "陷", "季": "冬至", "先天方位": "西", "后天方位": "北", "身": "耳", "亲": "中男", "兽": "豕" },
	{ "名": "兑", "卦形": "☱", "象": "泽", "德": "悦", "季": "秋分", "先天方位": "东南", "后天方位": "西", "身": "口", "亲": "少女", "兽": "羊" },
	{ "名": "艮", "卦形": "☶", "象": "山", "德": "止", "季": "立春", "先天方位": "西北", "后天方位": "东北", "身": "手", "亲": "少男", "兽": "狗" },
	{ "名": "离", "卦形": "☲", "象": "火", "德": "丽", "季": "夏至", "先天方位": "东", "后天方位": "南", "身": "目", "亲": "中女", "兽": "雉" },
	{ "名": "巽", "卦形": "☴", "象": "风", "德": "入", "季": "立夏", "先天方位": "西南", "后天方位": "东南", "身": "股", "亲": "长女", "兽": "鸡" },
	{ "名": "乾", "卦形": "☰", "象": "天", "德": "健", "季": "立冬", "先天方位": "南", "后天方位": "西北", "身": "首", "亲": "父", "兽": "马" },
];

const quotes = {
	dayanNumbers: "大衍之数五十，其用四十有九。分而为二以象两，挂一以象三，揲之以四以象四时，归奇于扐以象闰。",
	fortune: "彖者，言乎象者也；爻者，言乎变者也。吉凶者，言乎其失得也；悔吝者，言乎其小疵也。无咎者，善补过也。"
};

// 创建卦名到位序的映射
const GUA_NAME_TO_INDEX = {};
BINARY_ORDER.forEach((name, index) => {
	GUA_NAME_TO_INDEX[name] = index;
});


const YAO_NAMES = ['初', '二', '三', '四', '五', '上'];

// 卦爻辞缓存
const guaTextsCache = {};

// 卦爻辞加载状态
const guaTextsLoading = {};

// 卦爻辞加载队列
const guaTextsQueue = [];

// 卦爻辞加载器
class GuaTextsLoader {
	constructor() {
		this.baseUrl = 'gua_texts/';
		this.cache = {};
		this.loading = {};
		this.loadedCount = 0;
	}
	
	// 加载单个卦的爻辞
	async loadGuaText(guaName) {
		// 如果已经在缓存中，直接返回
		if (this.cache[guaName]) {
			return this.cache[guaName];
		}
		
		// 如果正在加载中，等待
		if (this.loading[guaName]) {
			return this.loading[guaName];
		}
		
		// 创建加载Promise
		const loadPromise = this._fetchGuaText(guaName);
		this.loading[guaName] = loadPromise;
		
		try {
			const guaText = await loadPromise;
			this.cache[guaName] = guaText;
			this.loadedCount++;
			return guaText;
		} finally {
			delete this.loading[guaName];
		}
	}
	
	// 预加载多个卦的爻辞
	async preloadGuaTexts(guaNames) {
		const promises = guaNames.map(guaName => this.loadGuaText(guaName));
		return Promise.allSettled(promises);
	}
	
	// 获取卦爻辞（同步，如果已加载）
	getGuaTextSync(guaName) {
		return this.cache[guaName] || null;
	}
	
	// 获取卦爻辞（异步，优先从缓存）
	async getGuaText(guaName) {
		return this.loadGuaText(guaName);
	}
	
	// 获取卦爻辞，带降级处理
	async getGuaTextWithFallback(guaName, fallbackData = null) {
		try {
			const text = await this.loadGuaText(guaName);
			return text;
		} catch (error) {
			console.warn(`加载卦爻辞失败: ${guaName}`, error);
			
			// 返回降级数据
			return fallbackData || {
				卦名: guaName,
				卦序: GUA_ORDER_MAP[guaName] || 0,
				卦辞: `【${guaName}卦】爻辞加载中...`,
				爻辞: Array(6).fill(0).map((_, i) => `${YAO_NAMES[i]}爻: 爻辞加载中...`)
			};
		}
	}
	
	// 内部获取方法
	async _fetchGuaText(guaName) {
		const url = `${this.baseUrl}${guaName}.json`;
		
		// 设置超时
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5秒超时
		
		try {
			const response = await fetch(url, {
				signal: controller.signal
			});
			
			clearTimeout(timeoutId);
			
			if (!response.ok) {
				throw new Error(`HTTP ${response.status}: ${response.statusText}`);
			}
			
			return await response.json();
		} catch (error) {
			clearTimeout(timeoutId);
			
			// 网络错误或超时，尝试从备用位置加载
			if (error.name === 'AbortError') {
				console.warn(`加载超时: ${guaName}`);
			}
			
			// 可以在这里添加重试逻辑或备用数据源
			throw error;
		}
	}
	
	// 清除缓存
	clearCache() {
		this.cache = {};
		this.loadedCount = 0;
	}
	
	// 获取已加载数量
	getLoadedCount() {
		return this.loadedCount;
	}
}

// 创建加载器实例
let guaTextsLoader = null;
if (!IS_FILE_PROTOCOL) {
	guaTextsLoader = new GuaTextsLoader();
}

document.addEventListener('DOMContentLoaded', function () {

	const dayan = new Dayan();

	const resultBar = document.getElementById('resultBar');
	const resultText = document.getElementById('resultText');
	const guaContainer = document.getElementById('guaContainer');
	const processList = document.getElementById('processList');
	const applyBtn = document.getElementById('applyBtn');
	const originalGuaSelect = document.getElementById('originalGua');
	const changedGuaSelect = document.getElementById('changedGua');
	const detailsTitle = document.getElementById('guaDetailsTitle');

	const showProcessBtn = document.getElementById('showProcessBtn');
	const processModal = document.getElementById('processModal');
	const closeProcess = document.querySelector('.close-process');

	const loadBtn = document.getElementById('loadBtn');
	const historyModal = document.getElementById('historyModal');
	const closeModal = document.querySelector('.close');
	const historyList = document.getElementById('historyList');
	const exportBtn = document.getElementById('exportBtn');
	const importBtn = document.getElementById('importBtn');
	const importFile = document.getElementById('importFile');
	const saveModal = document.getElementById('saveModal');
	const closeSave = document.querySelector('.close-save');
	const confirmSave = document.getElementById('confirmSave');
	const cancelSave = document.getElementById('cancelSave');
	const eventInput = document.getElementById('eventInput');
	const noteInput = document.getElementById('noteInput');

	if (!IS_FILE_PROTOCOL) {
		// 预加载常用卦的爻辞（可以在空闲时进行）
		setTimeout(() => {
			// 预加载乾坤两卦（最常用）
			guaTextsLoader.preloadGuaTexts(['乾', '坤']).then(results => {
				console.log('预加载完成:', results.map(r => r.status));
			});
		}, 1000);
	}

	// 获取卦形符号
	function getGuaSymbol(guaName, hexgram) {
		const index = GUA_DATA.indexOf(guaName);
		return index !== -1 ?
			hexgram ? `<span class=".gua-symbol">${String.fromCodePoint(0x4DC0 + index)}</span>` : String.fromCodePoint(0x4DC0 + index)
			: '';
	}

	// 填充卦名下拉列表
	function populateGuaSelects() {
		GUA_DATA.forEach((gua, index) => {
			const symbol = getGuaSymbol(gua, false);
			const option1 = document.createElement('option');
			option1.value = gua;
			option1.textContent = `${index + 1}.${gua} ${symbol}`;
			originalGuaSelect.appendChild(option1);

			const option2 = document.createElement('option');
			option2.value = gua;
			option2.textContent = `${index + 1}.${gua} ${symbol}`;
			changedGuaSelect.appendChild(option2);
		});
	}

	// 初始化爻行
	function initYaoRows() {
		guaContainer.innerHTML = '';
		processList.innerHTML = '';
		resultBar.style.display = 'none';

		// 清除之前的结果信息
		const extraInfos = resultBar.querySelectorAll('.result-info');
		extraInfos.forEach(el => el.remove());

		// 从5（上爻）到0（初爻）倒序创建
		for (let i = 5; i >= 0; i--) {
			const yaoRow = document.createElement('div');
			yaoRow.className = 'yao-row';
			yaoRow.id = `yaoRow${i}`;

			const yaoDisplay = document.createElement('div');
			yaoDisplay.className = 'yao-display';
			yaoDisplay.id = `yaoDisplay${i}`;
			yaoDisplay.addEventListener('click', () => toggleYaoState(i));

			const yaoButton = document.createElement('button');
			yaoButton.className = 'yao-button';
			yaoButton.id = `yaoBtn${i}`;
			// 占筮按钮的功能将在 initYaoButtons 方法实现

			yaoRow.appendChild(yaoDisplay);
			yaoRow.appendChild(yaoButton);
			guaContainer.appendChild(yaoRow);
		}
	}

	// 初始化爻按钮事件
	function initYaoButtons() {
		for (let i = 0; i < 6; i++) {
			const btn = document.getElementById(`yaoBtn${i}`);
			btn.textContent = `占${YAO_NAMES[i]}爻`;
			if (i == 0) {
				btn.classList.add('active-btn');
				btn.focus();
				btn.disabled = false;
			}
			else {
				btn.disabled = true;
			}
			btn.onclick = () => onGenerateYaoClick(i);
		}
	}

	// 更新占筮过程列表
	function updateProcessList() {
		processList.innerHTML = '';

		dayan.processRecords.forEach(record => {
			const yaoType = dayan.getYaoType(record.finalValue);

			const processItem = document.createElement('div');
			processItem.className = 'process-item';
			processItem.innerHTML = `
			<span class="yao-name">${YAO_NAMES[record.yaoIndex]}爻</span>
			<span>${record.steps[0]}策</span>
			<span>${record.steps[1]}策</span>
			<span>${record.steps[2]}策</span>
			<span class="yao-value">${record.finalValue} (${yaoType})</span>
		  `;
			processList.appendChild(processItem);
		});
	}

	// 生成爻按钮点击处理
	function onGenerateYaoClick(yaoIndex) {
		dayan.generateYao(yaoIndex, (yaoIndex, steps, yaoValue) => {
			// 绘制爻
			drawYao(yaoIndex, yaoValue);
			
			// 更新过程列表
			updateProcessList();

			// 禁用当前爻按钮
			const currentBtn = document.getElementById(`yaoBtn${yaoIndex}`);
			currentBtn.disabled = true;
			currentBtn.classList.remove('active-btn');

			// 如果是初爻（第一次点击），记录开始时间
			if (yaoIndex === 0) {
				startTime = new Date();
				document.getElementById('processList').parentNode.style.display = 'block';
				currentBtn.textContent = "重占";
				currentBtn.disabled = false;
				currentBtn.onclick = reset; // 绑定重置
				showProcessBtn.style.display = 'block';
			}
			// 如果是最后一爻，显示结果
			if (yaoIndex === 5) {
				setTimeout(showGuaResult, 500);
			} else {
				// 启用下一爻按钮
				const nextYaoIndex = yaoIndex + 1;
				const nextBtn = document.getElementById(`yaoBtn${nextYaoIndex}`);
				nextBtn.disabled = false;
				nextBtn.classList.add('active-btn');
				nextBtn.focus();
			}
		});
	}

	// 绘制爻（阴爻中间断开）
	function drawYao(yaoIndex, value) {
		const yaoDisplay = document.getElementById(`yaoDisplay${yaoIndex}`);
		yaoDisplay.innerHTML = '';

		// 添加爻值显示
		const valueText = document.createElement('div');
		valueText.style.position = 'absolute';
		valueText.style.left = '15px';
		valueText.style.color = '#f0c060';
		valueText.style.fontWeight = 'bold';
		valueText.style.fontSize = '1.2rem';
		valueText.textContent = value;
		yaoDisplay.appendChild(valueText);

		if (value === 6 || value === 8) {
			// 阴爻（中间断开）
			const yinContainer = document.createElement('div');
			yinContainer.className = 'yin-yao';

			const part1 = document.createElement('div');
			part1.className = 'yin-part';
			if (value === 6) part1.classList.add('old');

			const part2 = document.createElement('div');
			part2.className = 'yin-part';
			if (value === 6) part2.classList.add('old');

			yinContainer.appendChild(part1);
			yinContainer.appendChild(part2);
			yaoDisplay.appendChild(yinContainer);
		} else {
			// 阳爻
			const yang = document.createElement('div');
			yang.className = 'yang-yao';
			if (value === 9) yang.classList.add('old');
			yaoDisplay.appendChild(yang);
		}
	}

	// 切换爻状态（动爻/静爻）
	function toggleYaoState(yaoIndex) {
		if (dayan.toggleYaoState(yaoIndex)) {
			clearChangeMarker();
			drawYao(yaoIndex, dayan.guaArray[yaoIndex]);
			refreshGuaResult();
		}
	}

	function clearChangeMarker(){
		// 清除所有爻上的变爻标记
		for (let i = 0; i < 6; i++) {
			const yaoDisplay = document.getElementById(`yaoDisplay${i}`);
			const markers = yaoDisplay.querySelectorAll('.change-marker');
			markers.forEach(marker => marker.remove());
		}
	}

	// 根据整型索引查找卦名和卦序（使用位操作）
	function findGuaInfo(index) {
		const name = BINARY_ORDER[index];
		const order = GUA_ORDER_MAP[name] || 0;
		return { name, order };
	}

	// 获取卦的上下卦结构（使用位操作）
	function getGuaStructure(guaName) {
		const index = GUA_NAME_TO_INDEX[guaName];
		if (index === undefined) return { upper: null, lower: null };
		
		// 使用位操作提取上下卦
		const lowerIndex = index & 0x7;       // 低3位（下卦）
		const upperIndex = (index >> 3) & 0x7; // 高3位（上卦）
		
		return {
			upper: trigrams[upperIndex],
			lower: trigrams[lowerIndex]
		};
	}

	// 显示卦详细信息
	async function showGuaDetails(guaName, isOriginal, scroll) {
		const container = document.getElementById('guaDetailsContainer');
		const title = document.getElementById('guaDetailsTitle');
		const content = document.getElementById('guaDetailsContent');
		
		// 如果是非file协议，显示加载状态
		if (!IS_FILE_PROTOCOL) {
			content.innerHTML = '<div class="loading-text">加载卦爻辞中...</div>';
		}
		
		// 显示卦基本信息（不依赖爻辞文件）
		const order = GUA_ORDER_MAP[guaName] || '未知';
		const symbol = getGuaSymbol(guaName, true);
		title.innerHTML = `${symbol} ${guaName}卦 (${order})`;
		
		// 显示上下卦信息（从trigrams中获取）
		const structure = getGuaStructure(guaName);
		if (structure.upper && structure.lower) {
			if (structure.upper.名 != structure.lower.名) {
				title.innerHTML = `${symbol} ${structure.upper.象}${structure.lower.象}${guaName} (${order})`;
			} else {
				title.innerHTML = `${symbol} ${guaName}为${structure.upper.象} (${order})`;
			}
		}
		
		container.style.display = 'block';
		setTimeout(() => {
			container.classList.add('show');
		}, 10);
		
		const mainWrapper = document.querySelector('.main-wrapper');
		mainWrapper.classList.add('show-details');
		
		if (IS_FILE_PROTOCOL) {
			// file协议：直接从已加载的guaTexts中获取
			details = guaTexts ? guaTexts[guaName] : null;
			if (!details) {
				content.innerHTML = `<div class="error-text">未找到${guaName}卦的爻辞数据</div>`;
			} else {
				renderGuaDetails(content, guaName, details, isOriginal, structure);
			}
		} else {
			// 非file协议：使用异步加载
			try {
				details = await guaTextsLoader.getGuaTextWithFallback(guaName);
				renderGuaDetails(content, guaName, details, isOriginal, structure);
				
				// 如果加载成功，预加载相关卦
				if (!details.加载失败) {
					preloadRelatedGuaTexts(guaName);
				}
			} catch (error) {
				console.error('加载卦爻辞失败:', error);
				content.innerHTML = `
					<div class="error-text">
						<p>加载卦爻辞失败，请检查网络连接</p>
						<button onclick="retryLoadGuaText('${guaName}', ${isOriginal})">重试加载</button>
						<div class="basic-info">
							<p><strong>${guaName}卦</strong> (${order})</p>
							<p>卦辞加载失败，请稍后重试</p>
						</div>
					</div>
				`;
			}
		}
		
		// 滚动到详情区域
		if (scroll) {
			container.scrollIntoView({ behavior: 'smooth' });
		}
	}

	// 渲染卦详细信息
	async function renderGuaDetails(container, guaName, details, isOriginal, structure) {
		container.innerHTML = '';
		
		// 显示上下卦
		const extraDiv = document.createElement('div');
		extraDiv.className = 'extra-info';
		
		if (structure.upper && structure.lower) {
			if (structure.upper.名 != structure.lower.名) {
				extraDiv.textContent = `${structure.lower.卦形}${structure.lower.名}下${structure.upper.卦形}${structure.upper.名}上 ${structure.lower.德}而${structure.upper.德}`;
			} else {
				extraDiv.textContent = `${structure.upper.卦形} 先天${structure.upper.先天方位} 后天${structure.upper.后天方位} ${structure.upper.德} ${structure.upper.季} ${structure.upper.身} ${structure.upper.亲} ${structure.upper.兽}`;
			}
		}
		container.appendChild(extraDiv);

		if (details.加载失败) {
			const warningDiv = document.createElement('div');
			warningDiv.className = 'warning-text';
			warningDiv.textContent = '注意：爻辞数据尚未完全加载，部分内容可能无法显示';
			container.appendChild(warningDiv);
		}
		
		// 显示八宫信息
		if (details.八宫) {
			const palace = details.八宫;
			extraDiv.textContent += ` ${palace.宫}${palace.卦次}卦`;
			
			// 显示消息卦信息（如果适用）
			if (details.消息) {
				extraDiv.textContent += ` ${details.消息}`;
			}
		}
		
		// 计算并显示覆卦、错卦、互卦
		const guaIndex = BINARY_ORDER.indexOf(guaName);
		if (guaIndex !== -1) {
			let binaryStr = guaIndex.toString(2).padStart(6, '0');
			
			// 覆卦（反卦）：将二进制字符串反转
			const fuBinary = binaryStr.split('').reverse().join('');
			const fuIndex = parseInt(fuBinary, 2);
			const fuName = BINARY_ORDER[fuIndex];
			
			// 错卦：将每一位取反
			const cuoBinary = binaryStr.split('').map(bit => bit === '0' ? '1' : '0').join('');
			const cuoIndex = parseInt(cuoBinary, 2);
			const cuoName = BINARY_ORDER[cuoIndex];
			
			// 互卦：取二、三、四爻为下卦，三、四、五爻为上卦
			const huBinary = binaryStr[1] + binaryStr[2] + binaryStr[3] + binaryStr[2] + binaryStr[3] + binaryStr[4];
			const huIndex = parseInt(huBinary, 2);
			const huName = BINARY_ORDER[huIndex];
			
			const relationsDiv = document.createElement('div');
			relationsDiv.className = 'gua-text';
			relationsDiv.innerHTML = `
				覆卦: <span class="gua-link" data-gua="${fuName}">${fuName}${getGuaSymbol(fuName, true)}</span>
				错卦: <span class="gua-link" data-gua="${cuoName}">${cuoName}${getGuaSymbol(cuoName, true)}</span>
				互卦: <span class="gua-link" data-gua="${huName}">${huName}${getGuaSymbol(huName, true)}</span>
			`;
			container.appendChild(relationsDiv);
			
			// 添加点击事件
			relationsDiv.querySelectorAll('.gua-link').forEach(link => {
				link.addEventListener('click', function () {
					const guaName = this.getAttribute('data-gua');
					showGuaDetails(guaName, false, false);
				});
			});
		}
		
		// 添加卦辞
		if (details.卦辞) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">卦辞</div><div>${details.卦辞}</div>`;
			container.appendChild(div);
		}
		
		// 添加彖辞
		if (details.彖) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">彖辞</div><div>${details.彖}</div>`;
			container.appendChild(div);
		}
		
		// 添加象辞
		if (details.象) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">象辞</div><div>象曰：${details.象}</div>`;
			container.appendChild(div);
		}
		
		// 添加文言
		if (details.文言) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">文言</div>`;
			for (let i = 0; i < details.文言.length; i++) {
				div.appendChild(document.createElement('div')).textContent = details.文言[i];
			}
			container.appendChild(div);
		}
		
		// 添加爻辞
		if (details.爻) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">爻辞</div>`;
			container.appendChild(div);
			
			details.爻.forEach((yaoData, index) => {
				const yaoDiv = document.createElement('div');
				yaoDiv.className = 'yao-item';
				
				// 检查是否是变爻
				const isChanged = window.changeYaoIndexes && window.changeYaoIndexes.includes(index);
				// 检查是否是宜变之爻
				const isSpecial = window.specialYaoIndex === index;
				
				if (isChanged) yaoDiv.classList.add('changed');
				if (isSpecial && isChanged) yaoDiv.classList.add('special');
				
				yaoDiv.innerHTML = `<div class="yao-title">${yaoData.辞}</div>`;
				if (yaoData.象) {
					yaoDiv.innerHTML += `<div>象曰：${yaoData.象}</div>`;
				}
				
				if (yaoData.文言) {
					yaoDiv.appendChild(document.createElement('div')).textContent = "文言：";
					yaoData.文言.forEach((t, i) => {
						yaoDiv.appendChild(document.createElement('div')).textContent = t;
					});
				}
				
				if (isOriginal && isChanged) {
					const relations = calculateYaoRelations(index, dayan.guaArray);
					const relationDiv = document.createElement('div');
					relationDiv.className = 'yao-relations';
					relationDiv.innerHTML = `<strong>爻位：</strong>${relations.join('；')}`;
					yaoDiv.appendChild(relationDiv);
				}
				
				div.appendChild(yaoDiv);
			});
		}
		
		// 添加序卦
		if (details.序卦) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">序卦</div><div>${details.序卦}</div>`;
			container.appendChild(div);
		}
		
		// 添加杂卦
		if (details.杂卦) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">杂卦</div><div>${details.杂卦}</div>`;
			container.appendChild(div);
		}
	}

	// 预加载相关卦的爻辞
	function preloadRelatedGuaTexts(guaName) {
		if (IS_FILE_PROTOCOL || !guaTextsLoader) return;
		
		const guaIndex = BINARY_ORDER.indexOf(guaName);
		if (guaIndex === -1) return;
		
		// 计算相关卦
		let binaryStr = guaIndex.toString(2).padStart(6, '0');
		
		// 覆卦
		const fuBinary = binaryStr.split('').reverse().join('');
		const fuIndex = parseInt(fuBinary, 2);
		const fuName = BINARY_ORDER[fuIndex];
		
		// 错卦
		const cuoBinary = binaryStr.split('').map(bit => bit === '0' ? '1' : '0').join('');
		const cuoIndex = parseInt(cuoBinary, 2);
		const cuoName = BINARY_ORDER[cuoIndex];
		
		// 互卦
		const huBinary = binaryStr[1] + binaryStr[2] + binaryStr[3] + binaryStr[2] + binaryStr[3] + binaryStr[4];
		const huIndex = parseInt(huBinary, 2);
		const huName = BINARY_ORDER[huIndex];
		
		// 预加载相关卦
		const relatedGua = [fuName, cuoName, huName].filter(name => name && name !== guaName);
		if (relatedGua.length > 0) {
			guaTextsLoader.preloadGuaTexts(relatedGua);
		}
	}

	// 重试加载函数（暴露给全局）
	window.retryLoadGuaText = function(guaName, isOriginal) {
		if (!IS_FILE_PROTOCOL) {
			showGuaDetails(guaName, isOriginal, false);
		}
	};

	// 计算爻位关系
	function calculateYaoRelations(yaoIndex, guaArray) {
		const relations = [];
		const currentYao = guaArray[yaoIndex];
		const isYin = currentYao === 6 || currentYao === 8;

		// 1. 承（阴爻在阳爻之下）
		// 2. 乘（阴爻在阳爻之上）
		if (yaoIndex < 5) {
			const upperYao = guaArray[yaoIndex + 1];
			const upperIsYang = upperYao === 7 || upperYao === 9;

			if (isYin) {
				if (upperIsYang) {
					relations.push(`承${YAO_NAMES[yaoIndex + 1]}爻`);
				}
			}
			else {
				if (!upperIsYang) {
					relations.push(`为${YAO_NAMES[yaoIndex + 1]}爻所乘`);
				}
			}
		}

		if (yaoIndex > 0) {
			const lowerYao = guaArray[yaoIndex - 1];
			const lowerIsYang = lowerYao === 7 || lowerYao === 9;

			if (isYin) {
				if (lowerIsYang) {
					relations.push(`乘${YAO_NAMES[yaoIndex - 1]}爻`);
				}
			}
			else {
				if (!lowerIsYang) {
					relations.push(`得${YAO_NAMES[yaoIndex - 1]}爻所承`);
				}
			}
		}

		// 3. 应（相应位置的关系）
		const responsePairs = [[0, 3], [1, 4], [2, 5]];
		for (const [a, b] of responsePairs) {
			if (yaoIndex === a || yaoIndex === b) {
				const otherIndex = yaoIndex === a ? b : a;
				const otherYao = guaArray[otherIndex];
				const otherIsYang = otherYao === 7 || otherYao === 9;

				if (isYin === otherIsYang) {
					relations.push(`应${YAO_NAMES[otherIndex]}爻`);
				} else {
					relations.push("无应");
				}
				break;
			}
		}

		// 4. 当位（阴爻在偶位，阳爻在奇位）
		const positionType = yaoIndex % 2 === 0 ? '阳位' : '阴位';
		const correctPosition = (isYin && positionType === '阴位') ||
			(!isYin && positionType === '阳位');

		relations.push(`${correctPosition ? '当位' : '不当位'}（${YAO_NAMES[yaoIndex]}为${positionType}）`);

		return relations;
	}

	// 显示卦结果
	function showGuaResult() {
		clearChangeMarker();
		refreshGuaResult();
		document.getElementById('xici-quote').textContent = quotes.fortune;
		resultBar.style.display = 'block';
		const lastBtn = document.getElementById('yaoBtn5');
		lastBtn.textContent = "保存";
		lastBtn.disabled = false;
		lastBtn.classList.add('active-btn');
		lastBtn.focus();
		lastBtn.onclick = showSaveDialog; // 触发保存模态框
		
		// 如果是非file协议，预加载相关爻辞
		if (!IS_FILE_PROTOCOL && guaTextsLoader) {
			const originalElement = document.querySelector('.gua-link[data-type="original"]');
			const changedElement = document.querySelector('.gua-link[data-type="changed"]');
			
			if (originalElement) {
				const originalGua = originalElement.getAttribute('data-gua');
				const changedGua = changedElement ? changedElement.getAttribute('data-gua') : originalGua;
				
				// 预加载本卦和之卦的爻辞
				const guasToPreload = [originalGua];
				if (changedGua !== originalGua) {
					guasToPreload.push(changedGua);
				}
				
				// 异步预加载，不阻塞主线程
				setTimeout(() => {
					guaTextsLoader.preloadGuaTexts(guasToPreload).then(() => {
						console.log(`预加载完成，已加载${guaTextsLoader.getLoadedCount()}个卦的爻辞`);
					});
				}, 100);
			}
		}
	}

	function refreshGuaResult() {
		let guaArray = dayan.guaArray;

		// 清除之前的结果信息
		const extraInfos = resultBar.querySelectorAll('.result-info');
		extraInfos.forEach(el => el.remove());

		// 显示营数总和
		const totalInfo = document.createElement('span');
		totalInfo.className = 'result-info';
		totalInfo.textContent = `六爻营数之和: ${dayan.total}`;
		resultBar.appendChild(totalInfo);

		// 生成本卦索引（使用位操作）
		let originalIndex = 0;
		for (let i = 0; i < 6; i++) {
			if (guaArray[i] === 7 || guaArray[i] === 9) {
				originalIndex |= (1 << i); // 设置对应位
			}
		}

		// 获取本卦信息（直接使用整型索引）
		const originalInfo = findGuaInfo(originalIndex);
		originalGuaSelect.value = originalInfo.name;

		// 寻找动爻（6或9）
		const hasChangeYao = guaArray.some(val => val === 6 || val === 9);

		if (hasChangeYao) {
			// 计算余数：大衍之数55 - 营数总和
			let remainder = 55 - dayan.total;

			// 显示余数
			const remainderInfo = document.createElement('span');
			remainderInfo.className = 'result-info';
			remainderInfo.textContent = ` 余数: ${remainder}`;
			resultBar.appendChild(remainderInfo);

			// 显示宜变之爻
			const changeInfo = document.createElement('span');
			changeInfo.className = 'result-info change';
			changeInfo.textContent = ` 宜变：${YAO_NAMES[dayan.changeYaoIndex]}爻`;
			resultBar.appendChild(changeInfo);

			// 计算之卦索引（使用位操作）
			let changedIndex = 0;
			for (let i = 0; i < 6; i++) {
				const yaoValue = guaArray[i];
				switch (yaoValue) {
					case 6: // 老阴变阳
					case 7: // 少阳不变
						changedIndex |= (1 << i);
						break;
					case 8: // 少阴不变
					case 9: // 老阳变阴
						// 默认0，无需设置
						break;
				}
			}

			// 获取之卦信息（直接使用整型索引）
			const changedInfo = findGuaInfo(changedIndex);

			// 显示结果
			resultText.innerHTML = `<span class="gua-link" data-gua="${originalInfo.name}" data-type="original">${originalInfo.name}${getGuaSymbol(originalInfo.name, true)}(${originalInfo.order})</span> 之 <span class="gua-link" data-gua="${changedInfo.name}" data-type="changed">${changedInfo.name}${getGuaSymbol(changedInfo.name, true)}(${changedInfo.order})</span>`;
			changedGuaSelect.value = changedInfo.name;
		} else {
			// 全为7、8，无变爻
			resultText.innerHTML = `<span class="gua-link" data-gua="${originalInfo.name}" data-type="original">${originalInfo.name}${getGuaSymbol(originalInfo.name, true)}(${originalInfo.order})</span>（静爻）`;
			changedGuaSelect.value = 'same'; // 静卦
		}

		// 存储变爻索引
		window.changeYaoIndexes = [];
		for (let i = 0; i < 6; i++) {
			if (guaArray[i] === 6 || guaArray[i] === 9) {
				window.changeYaoIndexes.push(i);
			}
		}
		window.specialYaoIndex = dayan.changeYaoIndex; // 宜变之爻

		// 添加点击事件
		resultBar.querySelectorAll('.gua-link').forEach(link => {
			link.addEventListener('click', function () {
				const guaName = this.getAttribute('data-gua');
				const type = this.getAttribute('data-type');
				showGuaDetails(guaName, type === 'original', true);
			});
		});

		// 标记宜变之爻
		if (dayan.changeYaoIndex !== -1 && (guaArray[dayan.changeYaoIndex] === 6 || guaArray[dayan.changeYaoIndex] === 9)) {
			const changeMarker = document.createElement('div');
			changeMarker.className = 'change-marker';
			changeMarker.textContent = '宜变';
			document.getElementById(`yaoDisplay${dayan.changeYaoIndex}`).appendChild(changeMarker);
		}

		// 显示本卦卦爻辞
		showGuaDetails(originalInfo.name, true, false);
	}

	// 应用选择的卦象（使用位操作优化）
	function applySelectedGua() {
		const originalGua = originalGuaSelect.value;
		let changedGua = changedGuaSelect.value;
		startTime = new Date();
		document.getElementById('processList').parentNode.style.display = 'none';

		if (!originalGua) {
			alert('请选择本卦');
			return;
		}

		// 处理之卦选项
		if (changedGua === "same") {
			changedGua = originalGua;
		} else if (!changedGua) {
			changedGua = originalGua;
		}

		// 获取本卦和之卦的索引（使用位操作）
		const originalIndex = GUA_NAME_TO_INDEX[originalGua];
		const changedIndex = GUA_NAME_TO_INDEX[changedGua];

		if (originalIndex === undefined || changedIndex === undefined) {
			alert('无法找到卦象信息');
			return;
		}

		dayan.calculateGuaArrayFromIndex(originalIndex, changedIndex);
		// 计算总营数和宜变之爻
		dayan.calculateTotalAndChangeIndex();

		// 绘制卦形
		for (let i = 0; i < 6; i++) {
			drawYao(i, dayan.guaArray[i]);
		}

		const firstBtn = document.getElementById('yaoBtn0');
		firstBtn.disabled = false;
		firstBtn.textContent = '重占';
		firstBtn.onclick = reset;

		// 禁用二到四爻按钮
		for (let i = 1; i < 5; i++) {
			document.getElementById(`yaoBtn${i}`).disabled = true;
		}

		// 清空过程列表
		processList.innerHTML = '';
		showProcessBtn.style.display = 'none';

		// 显示卦结果
		showGuaResult();
	}

	function scrollToResult() {
		resultText.scrollIntoView({ behavior: "smooth" });
	}

	// 历史记录数据结构
	let historyRecords = JSON.parse(localStorage.getItem('dayanHistory')) || [];
	let currentRecordId = null;

	// 加载记录
	loadBtn.addEventListener('click', () => {
		renderHistoryList();
		historyModal.style.display = 'block';
	});

	// 关闭模态框
	closeModal.addEventListener('click', () => {
		historyModal.style.display = 'none';
	});

	// 导出记录
	exportBtn.addEventListener('click', () => {
		const dataStr = JSON.stringify(historyRecords, null, 2);
		const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

		const exportFileDefaultName = `大衍筮法历史记录_${new Date().toISOString().slice(0, 10)}.json`;

		const linkElement = document.createElement('a');
		linkElement.setAttribute('href', dataUri);
		linkElement.setAttribute('download', exportFileDefaultName);
		linkElement.click();
	});

	// 导入记录
	importBtn.addEventListener('click', () => {
		importFile.click();
	});

	importFile.addEventListener('change', (e) => {
		const file = e.target.files[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			try {
				const importedRecords = JSON.parse(event.target.result);

				// 验证导入数据格式
				if (!Array.isArray(importedRecords)) throw new Error('无效格式');
				if (importedRecords.length > 0 && !importedRecords[0].id) throw new Error('无效格式');

				// 合并记录（去重）
				const newRecords = importedRecords.filter(imported =>
					!historyRecords.some(existing => existing.id === imported.id)
				);

				historyRecords = [...historyRecords, ...newRecords];
				saveHistory();
				renderHistoryList();

				alert(`成功导入 ${newRecords.length} 条记录`);
			} catch (err) {
				alert('导入失败: 文件格式无效');
				console.error(err);
			}
			importFile.value = '';
		};
		reader.readAsText(file);
	});

	// 显示保存模态框
	function showSaveDialog() {
		// 如果有当前记录，填充数据
		if (currentRecordId) {
			const record = historyRecords.find(r => r.id === currentRecordId);
			eventInput.value = record.event || '';
			noteInput.value = record.note || '';
		} else {
			eventInput.value = '';
			noteInput.value = '';
		}
		saveModal.style.display = 'block';
	};

	// 保存记录到存储
	function saveRecord(event, note) {
		const resultText = document.getElementById('resultText').textContent;
		let originalGua, changedGua;

		// 提取卦名（从HTML元素中获取更可靠）
		const originalElement = document.querySelector('.gua-link[data-type="original"]');
		const changedElement = document.querySelector('.gua-link[data-type="changed"]');

		if (originalElement) {
			originalGua = originalElement.getAttribute('data-gua');
			changedGua = changedElement ? changedElement.getAttribute('data-gua') : originalGua;
		} else {
			// 静卦情况
			const staticMatch = resultText.match(/(.*?)（静爻/);
			if (staticMatch) {
				originalGua = staticMatch[1].trim();
				changedGua = originalGua;
			} else {
				alert('无法获取卦名');
				return;
			}
		}

		// 更新或添加记录
		if (currentRecordId) {
			// 更新现有记录
			const index = historyRecords.findIndex(r => r.id === currentRecordId);
			historyRecords[index] = {
				...historyRecords[index],
				changedGua,
				event,
				note
			};
		} else {
			// 创建新记录
			historyRecords.unshift({
				id: currentRecordId = Date.now().toString(),
				time: startTime.toLocaleString('zh-CN'),
				originalGua,
				changedGua,
				event,
				note
			});
		}

		saveHistory();
		saveModal.style.display = 'none'; // 关闭模态框
	}

	// 保存到本地存储
	function saveHistory() {
		localStorage.setItem('dayanHistory', JSON.stringify(historyRecords));
	}

	// 渲染历史记录列表
	function renderHistoryList() {
		historyList.innerHTML = '';

		if (historyRecords.length === 0) {
			historyList.innerHTML = '<li style="text-align:center; color:#a9a085;">暂无历史记录</li>';
			return;
		}

		historyRecords.sort((a, b) => b.id - a.id).forEach(record => {
			const li = document.createElement('li');
			const original = record.originalGua + getGuaSymbol(record.originalGua, true);
			const changed = record.originalGua !== record.changedGua ? (" → "+ record.changedGua + getGuaSymbol(record.changedGua, true)) : '（静爻）';
			li.className = 'history-item';
			li.dataset.id = record.id;

			li.innerHTML = `
						<span class="time">${record.time}</span>
						<span class="result">${original}${changed}</span>
						${record.event ? `<span class="event">${record.event}</span>` : ''}
						${record.note ? `<div class="note">${record.note}</div>` : ''}
						<div><button class="delete-btn">删除</button></div>
					`;

			historyList.appendChild(li);

			// 添加点击事件
			li.querySelector('.delete-btn').addEventListener('click', (e) => {
				e.stopPropagation();
				deleteRecord(record.id);
			});

			li.addEventListener('click', () => {
				loadRecord(record);
				historyModal.style.display = 'none';
			});
		});
	}

	// 删除记录
	function deleteRecord(id) {
		if (confirm('确定删除此记录吗？')) {
			historyRecords = historyRecords.filter(record => record.id !== id);
			saveHistory();
			renderHistoryList();
		}
	}

	// 加载记录
	function loadRecord(record) {
		// 设置当前记录ID用于更新
		currentRecordId = record.id;
		// 重置开始时间（使用记录中的时间）
		startTime = new Date(record.time);

		// 查找卦名
		const originalGua = record.originalGua.replace(/\(.*\)/, '');
		const changedGua = record.changedGua.replace(/\(.*\)/, '');

		// 设置下拉框
		originalGuaSelect.value = originalGua;
		changedGuaSelect.value = originalGua === changedGua ? 'same' : changedGua;

		// 应用卦象
		applySelectedGua();
	}

	// 关闭保存模态框
	closeSave.addEventListener('click', () => saveModal.style.display = 'none');
	cancelSave.addEventListener('click', () => saveModal.style.display = 'none');

	// 确认保存
	confirmSave.addEventListener('click', () => {
		const event = eventInput.value.trim();
		const note = noteInput.value.trim();

		if (!event) {
			alert('请输入占筮事项');
			return;
		}

		saveRecord(event, note);
		saveModal.style.display = 'none';
	});
	// 显示占筮过程
	showProcessBtn.addEventListener('click', () => {
		processModal.style.display = 'block';
	});

	// 关闭过程模态框
	closeProcess.addEventListener('click', () => {
		processModal.style.display = 'none';
	});

	// 点击模态框外部关闭
	window.addEventListener('click', (e) => {
		if (e.target === processModal) {
			processModal.style.display = 'none';
		}
	});
	// 重置
	function reset() {
		dayan.reset();
		currentRecordId = null;

		// 重置选择器
		originalGuaSelect.selectedIndex = 0;
		changedGuaSelect.selectedIndex = 0;

		initYaoRows();
		initYaoButtons();
		document.getElementById('guaDetailsContainer').style.display =
			document.getElementById('processList').parentNode.style.display =
			showProcessBtn.style.display =
			resultBar.style.display = 'none';
		const mainWrapper = document.querySelector('.main-wrapper');
		mainWrapper.classList.remove('show-details');
		document.querySelector('.gua-details-container').classList.remove('show');
		document.getElementById('xici-quote').textContent = quotes.dayanNumbers;
	}

	// 事件监听
	applyBtn.addEventListener('click', applySelectedGua);
	detailsTitle.addEventListener('click', scrollToResult);

	// 初始化
	initYaoRows();
	initYaoButtons();
	populateGuaSelects();

	// 如果是非file协议，在控制台显示提示
	if (!IS_FILE_PROTOCOL) {
		console.log('网络环境：使用按需加载卦爻辞模式');
		console.log('卦爻辞文件位于: gua_texts/ 目录');
	} else {
		console.log('本地文件环境：使用完整卦爻辞数据');
	}
});