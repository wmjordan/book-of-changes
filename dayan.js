// dayan.js - 大衍筮法核心类

class Dayan {
	constructor() {
		this.guaArray = []; // 存储六爻的数组
		this.processRecords = []; // 存储占筮过程记录
		this.startTime = null; // 记录开始占筮的时间
		this.changeYaoIndex = -1; // 宜变之爻索引
		this.total = 0; // 六爻营数总和

		// 创建50根蓍草对象
		this.grasses = this.createGrasses();
	}

	// 创建蓍草
	createGrasses() {
		const grasses = [];
		for (let i = 0; i < 50; i++) {
			grasses.push({
				id: i,
				used: false
			});
		}
		return grasses;
	}

	// 重置占筮状态
	reset() {
		this.guaArray = [];
		this.processRecords = [];
		this.startTime = null;
		this.changeYaoIndex = -1;
		this.total = 0;
		this.grasses = this.createGrasses();
	}

	// 大衍筮法生成一爻
	generateYao(yaoIndex, callback) {
		// 如果是初爻（第一次点击），记录开始时间
		if (yaoIndex === 0) {
			this.startTime = new Date();
		}

		// 重置蓍草使用状态（除太极草外）
		this.grasses.forEach(g => {
			if (g.id !== 0) g.used = false;
		});

		// 使用49根蓍草（排除太极草）
		let availableGrasses = this.grasses.filter(g => !g.used && g.id !== 0);
		let steps = [];

		// 模拟三变过程
		setTimeout(() => {
			// 第一变
			const result1 = this.performDayanStep(availableGrasses, 49);
			steps.push(result1.remaining);

			setTimeout(() => {
				// 第二变
				const result2 = this.performDayanStep(availableGrasses, result1.remaining);
				steps.push(result2.remaining);

				setTimeout(() => {
					// 第三变
					const result3 = this.performDayanStep(availableGrasses, result2.remaining);
					steps.push(result3.remaining);

					// 计算最终结果
					const yaoValue = result3.remaining / 4;

					// 保存爻信息
					this.guaArray[yaoIndex] = yaoValue;

					// 更新占筮过程
					this.updateProcessRecord(yaoIndex, steps, yaoValue);

					// 如果是最后一爻，计算总营数和宜变之爻
					if (yaoIndex === 5) {
						this.calculateTotalAndChangeIndex();
					}

					// 回调返回结果
					if (callback) {
						callback(yaoIndex, steps, yaoValue);
					}
				}, 200);
			}, 200);
		}, 200);
	}

	// 计算每个爻的营数（使用位操作）
	calculateGuaArrayFromIndex(originalIndex, changedIndex) {
		for (let i = 0; i < 6; i++) {
			const originalBit = (originalIndex >> i) & 1;
			const changedBit = (changedIndex >> i) & 1;

			if (originalBit === 0 && changedBit === 0) {
				this.guaArray[i] = 8; // 少阴
			} else if (originalBit === 0 && changedBit === 1) {
				this.guaArray[i] = 6; // 老阴（变爻）
			} else if (originalBit === 1 && changedBit === 0) {
				this.guaArray[i] = 9; // 老阳（变爻）
			} else if (originalBit === 1 && changedBit === 1) {
				this.guaArray[i] = 7; // 少阳
			}
		}
	}

	// 计算六爻营数总和及宜变之爻
	calculateTotalAndChangeIndex() {
		// 计算六爻营数总和
		this.total = this.guaArray.reduce((sum, value) => sum + value, 0);

		// 计算余数：大衍之数55 - 营数总和
		let remainder = 55 - this.total;

		// 确定宜变之爻位置
		let current = 0;
		let direction = 1; // 1:向上, -1:向下
		remainder--; // 先数初爻（位置0）

		while (remainder > 0) {
			if (current === 5 && direction === 1) {
				direction = -1;
				current = 4;
			} else if (current === 0 && direction === -1) {
				direction = 1;
				current = 1;
			} else {
				current += direction;
			}
			remainder--;
		}

		this.changeYaoIndex = current;
	}

	// 执行大衍筮法的一变
	performDayanStep(availableGrasses, startingCount) {
		// 获取可用的蓍草
		let unusedGrasses = availableGrasses.filter(g => !g.used);

		// 随机排序
		this.shuffleArray(unusedGrasses);

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
		const remainderGrasses1 = this.shuffleArray(part1.slice(0, remainder1));
		const remainderGrasses2 = this.shuffleArray(rightAfterRemove.slice(0, remainder2));

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
	shuffleArray(array) {
		for (let i = array.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[array[i], array[j]] = [array[j], array[i]];
		}
		return array;
	}

	// 更新占筮过程记录
	updateProcessRecord(yaoIndex, steps, finalValue) {
		this.processRecords.push({
			yaoIndex,
			steps,
			finalValue,
			yaoType: this.getYaoType(finalValue)
		});
	}

	// 获取爻的类型
	getYaoType(value) {
		if (value === 6) return '老阴';
		if (value === 7) return '少阳';
		if (value === 8) return '少阴';
		if (value === 9) return '老阳';
		return '';
	}

	// 切换爻状态（动爻/静爻）
	toggleYaoState(yaoIndex) {
		// 确保六爻都已生成
		if (this.guaArray.length !== 6) return false;

		// 获取当前爻值
		const currentValue = this.guaArray[yaoIndex];
		let newValue = currentValue;

		// 根据当前状态切换
		switch (currentValue) {
			case 6: // 老阴 -> 少阴
				newValue = 8;
				break;
			case 7: // 少阳 -> 老阳
				newValue = 9;
				break;
			case 8: // 少阴 -> 老阴
				newValue = 6;
				break;
			case 9: // 老阳 -> 少阳
				newValue = 7;
				break;
			default:
				return false;
		}

		this.guaArray[yaoIndex] = newValue;

		// 重新计算总营数和宜变之爻
		this.calculateTotalAndChangeIndex();
		return true;
	}
}