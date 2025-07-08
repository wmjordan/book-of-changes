// 卦名数据
const guaData = [
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
const guaOrderMap = {};
guaData.forEach((name, index) => {
	guaOrderMap[name] = index + 1; // 卦序从1开始
});

// 二进制卦序映射
const binaryOrder = [
	"坤", "剥", "比", "观", "豫", "晋", "萃", "否",
	"谦", "艮", "蹇", "渐", "小过", "旅", "咸", "遁",
	"师", "蒙", "坎", "涣", "解", "未济", "困", "讼",
	"升", "蛊", "井", "巽", "恒", "鼎", "大过", "姤",
	"复", "颐", "屯", "益", "震", "噬嗑", "随", "无妄",
	"明夷", "贲", "既济", "家人", "丰", "离", "革", "同人",
	"临", "损", "节", "中孚", "归妹", "睽", "兑", "履",
	"泰", "大畜", "需", "小畜", "大壮", "大有", "夬", "乾"
];

document.addEventListener('DOMContentLoaded', function () {
	const guaContainer = document.getElementById('guaContainer');
	const grassCounter = document.getElementById('grassCounter');
	const processList = document.getElementById('processList');
	const resultText = document.getElementById('resultText');
	const restartBtn = document.getElementById('restartBtn');
	const applyBtn = document.getElementById('applyBtn');
	const originalGuaSelect = document.getElementById('originalGua');
	const changedGuaSelect = document.getElementById('changedGua');
	const detailsTitle = document.getElementById('guaDetailsTitle');

	const saveBtn = document.getElementById('saveBtn');
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

	// 创建50根蓍草对象
	let grasses = [];
	let guaArray = [];
	let changeYaoIndex = -1;
	let processRecords = []; // 存储占筮过程记录
	let startTime = null; // 记录开始占筮的时间

	// 填充卦名下拉列表
	function populateGuaSelects() {
		guaData.forEach((gua, index) => {
			const option1 = document.createElement('option');
			option1.value = gua;
			option1.textContent = `${index + 1}.${gua}`;
			originalGuaSelect.appendChild(option1);

			const option2 = document.createElement('option');
			option2.value = gua;
			option2.textContent = `${index + 1}.${gua}`;
			changedGuaSelect.appendChild(option2);
		});
	}

	// 创建蓍草
	function createGrasses() {
		grasses = [];
		for (let i = 0; i < 50; i++) {
			grasses.push({
				id: i,
				used: false
			});
		}
		updateGrassCounter();
	}

	// 更新蓍草计数器
	function updateGrassCounter() {
		const usedCount = grasses.filter(g => g.used).length;
		grassCounter.textContent = `蓍草: ${50 - usedCount}根`;
	}

	// 初始化爻行
	function initYaoRows() {
		guaContainer.innerHTML = '';
		processRecords = [];
		processList.innerHTML = '';
		resultText.textContent = '-';

		// 清除之前的结果信息
		const resultBar = document.querySelector('.result-bar');
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

			// 设置按钮文本（从初到上）
			const yaoNames = ['初', '二', '三', '四', '五', '上'];
			yaoButton.textContent = `占${yaoNames[i]}爻`;

			// 添加点击事件
			yaoButton.addEventListener('click', () => generateYao(i));

			// 只有初爻（i=0）按钮初始可点击
			yaoButton.disabled = i !== 0;

			yaoRow.appendChild(yaoDisplay);
			yaoRow.appendChild(yaoButton);
			guaContainer.appendChild(yaoRow);
		}
	}

	// 更新占筮过程列表
	function updateProcessList(yaoIndex, steps, finalValue) {
		const yaoNames = ['初', '二', '三', '四', '五', '上'];
		const yaoType = getYaoType(finalValue);

		const processItem = document.createElement('div');
		processItem.className = 'process-item';

		processItem.innerHTML = `
					<span class="yao-name">${yaoNames[yaoIndex]}爻</span>
					<span>${steps[0]}策</span>
					<span>${steps[1]}策</span>
					<span>${steps[2]}策</span>
					<span class="yao-value">${finalValue} (${yaoType})</span>
				`;

		processList.appendChild(processItem);
		processRecords.push({
			yaoIndex,
			steps,
			finalValue,
			yaoType
		});
	}

	// 大衍筮法生成一爻
	function generateYao(yaoIndex) {
		// 禁用当前爻按钮
		const currentBtn = document.getElementById(`yaoBtn${yaoIndex}`);
		currentBtn.disabled = true;

		// 如果是初爻（第一次点击），记录开始时间
		if (yaoIndex === 0) {
			startTime = new Date();
		}
		// 重置蓍草使用状态（除太极草外）
		grasses.forEach(g => {
			if (g.id !== 0) g.used = false;
		});

		// 使用49根蓍草（排除太极草）
		let availableGrasses = grasses.filter(g => !g.used && g.id !== 0);
		let steps = [];

		// 模拟三变过程
		setTimeout(() => {
			// 第一变
			const result1 = performDayanStep(availableGrasses, 49);
			steps.push(result1.remaining);
			updateGrassCounter();

			setTimeout(() => {
				// 第二变
				const result2 = performDayanStep(availableGrasses, result1.remaining);
				steps.push(result2.remaining);
				updateGrassCounter();

				setTimeout(() => {
					// 第三变
					const result3 = performDayanStep(availableGrasses, result2.remaining);
					steps.push(result3.remaining);
					updateGrassCounter();

					// 计算最终结果
					const yaoValue = result3.remaining / 4;

					// 保存爻信息
					guaArray[yaoIndex] = yaoValue;

					// 更新占筮过程
					updateProcessList(yaoIndex, steps, yaoValue);

					// 绘制爻
					drawYao(yaoIndex, yaoValue);

					// 如果是最后一爻（上爻，i=5），显示卦结果
					if (yaoIndex === 5) {
						setTimeout(showGuaResult, 500);
					}
					// 启用下一爻按钮（如果不是最后一爻）
					else {
						const nextYaoIndex = yaoIndex + 1;
						const nextBtn = document.getElementById(`yaoBtn${nextYaoIndex}`);
						nextBtn.disabled = false;
					}
				}, 200);
			}, 200);
		}, 200);
	}

	// 执行大衍筮法的一变
	function performDayanStep(availableGrasses, startingCount) {
		// 获取可用的蓍草
		let unusedGrasses = availableGrasses.filter(g => !g.used);

		// 随机排序
		shuffleArray(unusedGrasses);

		// 分二：随机分成两部分
		const part1Count = Math.floor(Math.random() * (startingCount - 1)) + 1;
		const part1 = unusedGrasses.slice(0, part1Count);
		const part2 = unusedGrasses.slice(part1Count, part1Count + startingCount - part1Count);

		// 挂一：从右边取出一根（随机选择）
		const rightGrass = part2[Math.floor(Math.random() * part2.length)];
		rightGrass.used = true;
		const rightAfterRemove = part2.filter(g => g !== rightGrass);

		// 揲四：分别除以4取余数
		const remainder1 = part1.length % 4 || 4;
		const remainder2 = rightAfterRemove.length % 4 || 4;

		// 随机选择余数草
		const remainderGrasses1 = shuffleArray(part1.slice(0, remainder1));
		const remainderGrasses2 = shuffleArray(rightAfterRemove.slice(0, remainder2));

		// 标记使用的蓍草
		remainderGrasses1.forEach(g => g.used = true);
		remainderGrasses2.forEach(g => g.used = true);
		rightGrass.used = true;

		// 归奇：计算剩余策数
		const removed = 1 + remainder1 + remainder2;
		const remaining = startingCount - removed;

		return { remaining };
	}

	// 随机打乱数组
	function shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	// 获取爻的类型
	function getYaoType(value) {
		if (value === 6) return '老阴';
		if (value === 7) return '少阳';
		if (value === 8) return '少阴';
		if (value === 9) return '老阳';
		return '';
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
		// 确保六爻都已生成
		if (guaArray.length !== 6) return;
		
		// 获取当前爻值
		const currentValue = guaArray[yaoIndex];
		
		// 根据当前状态切换
		switch(currentValue) {
			case 6: // 老阴 -> 少阴
				guaArray[yaoIndex] = 8;
				break;
			case 7: // 少阳 -> 老阳
				guaArray[yaoIndex] = 9;
				break;
			case 8: // 少阴 -> 老阴
				guaArray[yaoIndex] = 6;
				break;
			case 9: // 老阳 -> 少阳
				guaArray[yaoIndex] = 7;
				break;
			default:
				return;
		}
		clearChangeMarker();

		// 重新绘制该爻
		drawYao(yaoIndex, guaArray[yaoIndex]);
		
		// 更新卦象显示和结果
		refreshGuaResult();
	}

	function clearChangeMarker(){
		// 清除所有爻上的变爻标记
		for (let i = 0; i < 6; i++) {
			const yaoDisplay = document.getElementById(`yaoDisplay${i}`);
			const markers = yaoDisplay.querySelectorAll('.change-marker');
			markers.forEach(marker => marker.remove());
		}
	}


	// 根据二进制值查找卦名和卦序
	function findGuaInfo(binary) {
		const index = parseInt(binary, 2);
		const name = binaryOrder[index];
		const order = guaOrderMap[name] || 0;

		return { name, order };
	}

	// 获取卦的上下卦结构
	function getGuaStructure(guaName) {
		const index = binaryOrder.indexOf(guaName);
		if (index === -1) return { upper: null, lower: null };
		
		const binary = index.toString(2).padStart(6, '0');
		const upperBinary = binary.substring(3);
		const lowerBinary = binary.substring(0, 3);
		
		const upperIndex = parseInt(upperBinary, 2);
		const lowerIndex = parseInt(lowerBinary, 2);
		
		return {
			upper: trigrams[upperIndex],
			lower: trigrams[lowerIndex]
		};
	}

	// 显示卦详细信息
	function showGuaDetails(guaName, isOriginal, scroll) {
		const details = guaTexts[guaName] || {};
		const container = document.getElementById('guaDetailsContainer');
		const title = document.getElementById('guaDetailsTitle');
		const content = document.getElementById('guaDetailsContent');

		content.innerHTML = ''; // 清空内容

		// 显示上下卦
		const structure = getGuaStructure(guaName);
		const extraDiv = document.createElement('div');
		extraDiv.className = 'extra-info';
		content.appendChild(extraDiv);
		if (structure.upper && structure.lower) {
			if (structure.upper != structure.lower) {
				title.textContent = `${structure.upper.象}${structure.lower.象}${guaName}`;
				extraDiv.textContent = `${structure.lower.卦形}${structure.lower.名}下${structure.upper.卦形}${structure.upper.名}上`;
			}
			else {
				title.textContent = `${structure.upper.名}为${structure.upper.象}`;
				extraDiv.textContent = `${structure.upper.卦形} 先天${structure.upper.先天方位} 后天${structure.upper.后天方位} ${structure.upper.季} ${structure.upper.身} ${structure.upper.亲} ${structure.upper.兽}`;
			}
		}
		else {
			title.textContent = `${guaName}卦`;
		}

        // 显示世爻信息
        if (details.八宫) {
            const palace = details.八宫;
            extraDiv.textContent += ` ${palace.宫}${palace.卦次}卦`;
            
            // 显示消息卦信息（如果适用）
            if (details.消息) {
                extraDiv.textContent += ` ${details.消息}`;
            }
        }

		// 添加卦辞
		if (details.卦辞) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">卦辞</div><div>${details.卦辞}</div>`;
			content.appendChild(div);
		}

		// 添加彖辞
		if (details.彖) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">彖辞</div><div>${details.彖}</div>`;
			content.appendChild(div);
		}

		// 添加象辞
		if (details.象) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">象辞</div><div>${details.象}</div>`;
			content.appendChild(div);
		}

		// 添加爻辞
		if (details.爻辞) {
			const div = document.createElement('div');
			div.className = 'gua-text';
			div.innerHTML = `<div class="gua-text-title">爻辞</div>`;
			content.appendChild(div);

			details.爻辞.forEach((text, index) => {
				const yaoDiv = document.createElement('div');
				yaoDiv.className = 'yao-item';

				// 检查是否是变爻
				const isChanged = window.changeYaoIndexes && window.changeYaoIndexes.includes(index);
				// 检查是否是宜变之爻
				const isSpecial = window.specialYaoIndex === index;

				if (isChanged) yaoDiv.classList.add('changed');
				if (isSpecial && isChanged) yaoDiv.classList.add('special');

				yaoDiv.innerHTML = `<div class="yao-title">${text}</div>${details.爻象 && details.爻象[index] ? `<div>${details.爻象[index]}</div>` : ''}`;
				div.appendChild(yaoDiv);
			});
		}
		container.style.display = 'block';
		setTimeout(() => {
			container.classList.add('show'); // 延迟触发显示动画
		}, 10);
		const mainWrapper = document.querySelector('.main-wrapper');
		mainWrapper.classList.add('show-details');

		// 滚动到详情区域
		if (scroll) {
			container.scrollIntoView({ behavior: 'smooth' });
		}
	}

	// 显示卦结果
	function showGuaResult() {
		clearChangeMarker();
		refreshGuaResult();

		// 显示保存按钮
		showSaveButton();
	}

	function refreshGuaResult() {
		const resultBar = document.querySelector('.result-bar');

		// 清除之前的结果信息
		const extraInfos = resultBar.querySelectorAll('.result-info');
		extraInfos.forEach(el => el.remove());

		// 计算六爻营数总和
		const total = guaArray.reduce((sum, value) => sum + value, 0);

		// 显示营数总和
		const totalInfo = document.createElement('span');
		totalInfo.className = 'result-info';
		totalInfo.textContent = `六爻营数之和: ${total}`;
		resultBar.appendChild(totalInfo);

		// 生成本卦二进制表示
		let originalBinary = '';
		for (let i = 0; i < 6; i++) {
			originalBinary += (guaArray[i] === 7 || guaArray[i] === 9) ? '1' : '0';
		}

		// 获取本卦信息
		const originalInfo = findGuaInfo(originalBinary);
		originalGuaSelect.value = originalInfo.name;

		// 寻找动爻（6或9）
		const hasChangeYao = guaArray.some(val => val === 6 || val === 9);

		if (hasChangeYao) {
			// 计算余数：大衍之数55 - 营数总和
			let remainder = 55 - total;

			// 显示余数
			const remainderInfo = document.createElement('span');
			remainderInfo.className = 'result-info';
			remainderInfo.textContent = ` 余数: ${remainder}`;
			resultBar.appendChild(remainderInfo);

			// 确定宜变之爻位置
			// 从初爻(0)开始向上数，到上爻(5)折返
			let current = 0;
			let direction = 1; // 1:向上, -1:向下

			// 先数初爻（位置0）
			remainder--;

			while (remainder > 0) {
				// 到达上爻后折返向下
				if (current === 5 && direction === 1) {
					direction = -1;
					current = 4;
				}
				// 到达初爻后折返向上
				else if (current === 0 && direction === -1) {
					direction = 1;
					current = 1;
				}
				// 正常移动
				else {
					current += direction;
				}

				remainder--;
			}

			changeYaoIndex = current;

			// 显示宜变之爻
			const changeInfo = document.createElement('span');
			changeInfo.className = 'result-info change';
			const yaoNames = ['初', '二', '三', '四', '五', '上'];
			changeInfo.textContent = ` 宜变：${yaoNames[changeYaoIndex]}爻`;
			resultBar.appendChild(changeInfo);

			// 计算之卦
			let changedBinary = '';
			for (let i = 0; i < 6; i++) {
				const yaoValue = guaArray[i];
				switch (yaoValue) {
					case 6: // 老阴变阳
					case 7: // 少阳不变
						changedBinary += '1';
						break;
					case 8: // 少阴不变
					case 9: // 老阳变阴
						changedBinary += '0';
						break;
				}
			}

			// 获取之卦信息
			const changedInfo = findGuaInfo(changedBinary);

			// 显示结果
			resultText.innerHTML = `<span class="gua-link" data-gua="${originalInfo.name}" data-type="original">${originalInfo.name}(${originalInfo.order})</span> 之 <span class="gua-link" data-gua="${changedInfo.name}" data-type="changed">${changedInfo.name}(${changedInfo.order})</span>`;
			changedGuaSelect.value = changedInfo.name;
		} else {
			// 全为7、8，无变爻
			resultText.innerHTML = `<span class="gua-link" data-gua="${originalInfo.name}" data-type="original">${originalInfo.name}(${originalInfo.order})</span>（静爻）`;
			changedGuaSelect.value = 'same'; // 静卦
		}

		// 存储变爻索引
		window.changeYaoIndexes = [];
		for (let i = 0; i < 6; i++) {
			if (guaArray[i] === 6 || guaArray[i] === 9) {
				window.changeYaoIndexes.push(i);
			}
		}
		window.specialYaoIndex = changeYaoIndex; // 宜变之爻

		// 添加点击事件
		document.querySelectorAll('.gua-link').forEach(link => {
			link.addEventListener('click', function () {
				const guaName = this.getAttribute('data-gua');
				const type = this.getAttribute('data-type');
				showGuaDetails(guaName, type === 'original', true);
			});
		});

		// 标记宜变之爻
		if (changeYaoIndex !== -1 && (guaArray[changeYaoIndex] === 6 || guaArray[changeYaoIndex] === 9)) {
			const changeMarker = document.createElement('div');
			changeMarker.className = 'change-marker';
			changeMarker.textContent = '变';
			document.getElementById(`yaoDisplay${changeYaoIndex}`).appendChild(changeMarker);
		}

		// 显示本卦卦爻辞
		showGuaDetails(originalInfo.name, true, false);
		// 显示保存按钮
		showSaveButton();
	}

	// 根据卦名获取二进制表示
	function getBinaryForGua(guaName) {
		const index = binaryOrder.indexOf(guaName);
		if (index === -1) return null;

		// 将索引转换为6位二进制字符串
		return index.toString(2).padStart(6, '0');
	}

	// 应用选择的卦象
	function applySelectedGua() {
		const originalGua = originalGuaSelect.value;
		let changedGua = changedGuaSelect.value;
		startTime = new Date();

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

		// 获取本卦和之卦的二进制表示
		const originalBinary = getBinaryForGua(originalGua);
		const changedBinary = getBinaryForGua(changedGua);

		if (!originalBinary || !changedBinary) {
			alert('无法找到卦象信息');
			return;
		}

		// 计算每个爻的营数
		guaArray = [];
		for (let i = 0; i < 6; i++) {
			const originalBit = originalBinary[i];
			const changedBit = changedBinary[i];

			if (originalBit === '0' && changedBit === '0') {
				guaArray[i] = 8; // 少阴
			} else if (originalBit === '0' && changedBit === '1') {
				guaArray[i] = 6; // 老阴（变爻）
			} else if (originalBit === '1' && changedBit === '0') {
				guaArray[i] = 9; // 老阳（变爻）
			} else if (originalBit === '1' && changedBit === '1') {
				guaArray[i] = 7; // 少阳
			}
		}

		// 绘制卦形
		for (let i = 0; i < 6; i++) {
			drawYao(i, guaArray[i]);
		}

		// 禁用所有爻按钮
		for (let i = 0; i < 6; i++) {
			document.getElementById(`yaoBtn${i}`).disabled = true;
		}

		// 清空过程列表
		processList.innerHTML = '';

		// 显示卦结果
		showGuaResult();
	}

	function scrollToResult() {
		resultText.scrollIntoView({ behavior: "smooth" });
	}

	// 历史记录数据结构
	let historyRecords = JSON.parse(localStorage.getItem('dayanHistory')) || [];
	let currentRecordId = null;

	// 显示保存按钮
	function showSaveButton() {
		saveBtn.style.display = 'inline-block';
	}

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
		};
		reader.readAsText(file);
	});

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
			li.className = 'history-item';
			li.dataset.id = record.id;

			li.innerHTML = `
						<span class="time">${record.time}</span>
						<span class="result">${record.originalGua}${record.originalGua !== record.changedGua ? ` → ${record.changedGua}` : '（静爻）'}</span>
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

		// 显示保存按钮
		showSaveButton();
	}

	// 显示保存模态框
	saveBtn.addEventListener('click', () => {
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
	});

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
	// 重置
	function reset() {
		currentYao = 0;
		guaArray = [];
		changeYaoIndex = -1;
		startTime = null;
		currentRecordId = null;

		// 重置选择器
		originalGuaSelect.selectedIndex = 0;
		changedGuaSelect.selectedIndex = 0;

		createGrasses();
		initYaoRows();
		document.getElementById('guaDetailsContainer').style.display = 'none';
		const mainWrapper = document.querySelector('.main-wrapper');
		mainWrapper.classList.remove('show-details');
		document.querySelector('.gua-details-container').classList.remove('show');
		// 隐藏保存按钮
		saveBtn.style.display = 'none';
	}

	// 事件监听
	restartBtn.addEventListener('click', reset);
	applyBtn.addEventListener('click', applySelectedGua);
	detailsTitle.addEventListener('click', scrollToResult);

	// 初始化
	createGrasses();
	initYaoRows();
	populateGuaSelects();
});