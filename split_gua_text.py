import json
import os
import re

def split_gua_texts_for_web(text_js_file, output_dir='gua_texts'):
    """
    将text.js中的卦爻辞数据拆分为64个单独的JSON文件，用于网络环境
    """
    # 创建输出目录
    os.makedirs(output_dir, exist_ok=True)
    
    # 读取text.js文件
    with open(text_js_file, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 使用正则表达式提取guaTexts对象
    pattern = r'const guaTexts\s*=\s*({.*?});'
    match = re.search(pattern, content, re.DOTALL)
    
    if not match:
        print("未找到guaTexts对象")
        return
    
    gua_texts_str = match.group(1)
    
    # 处理JavaScript对象，使其成为有效的JSON
    # 移除尾随逗号
    gua_texts_str = re.sub(r',\s*}', '}', gua_texts_str)
    gua_texts_str = re.sub(r',\s*]', ']', gua_texts_str)
    
    # 替换单引号为双引号
    gua_texts_str = re.sub(r"'", '"', gua_texts_str)
    
    # 将未加引号的属性名加上引号
    def add_quotes_to_property_names(match):
        return match.group(1) + '"' + match.group(2) + '"' + match.group(3)
    
    gua_texts_str = re.sub(r'([{,]\s*)([a-zA-Z\u4e00-\u9fa5]+)(\s*:)', add_quotes_to_property_names, gua_texts_str)
    
    try:
        gua_texts = json.loads(gua_texts_str)
    except json.JSONDecodeError as e:
        print(f"JSON解析错误: {e}")
        print("尝试使用ast.literal_eval...")
        import ast
        try:
            # 替换所有键为双引号
            gua_texts_str = re.sub(r'([{,])\s*([^"\s]+)\s*:', r'\1"\2":', gua_texts_str)
            gua_texts = ast.literal_eval(gua_texts_str)
        except Exception as e2:
            print(f"备用解析也失败: {e2}")
            # 尝试手动修复常见问题
            gua_texts_str = gua_texts_str.replace('\n', ' ').replace('\r', ' ')
            gua_texts_str = re.sub(r'\s+', ' ', gua_texts_str)
            try:
                gua_texts = ast.literal_eval(gua_texts_str)
            except:
                print("无法解析卦爻辞数据")
                return
    
    # 64卦列表
    gua_list = [
        "乾", "坤", "屯", "蒙", "需", "讼", "师", "比",
        "小畜", "履", "泰", "否", "同人", "大有", "谦", "豫",
        "随", "蛊", "临", "观", "噬嗑", "贲", "剥", "复",
        "无妄", "大畜", "颐", "大过", "坎", "离", "咸", "恒",
        "遁", "大壮", "晋", "明夷", "家人", "睽", "蹇", "解",
        "损", "益", "夬", "姤", "萃", "升", "困", "井",
        "革", "鼎", "震", "艮", "渐", "归妹", "丰", "旅",
        "巽", "兑", "涣", "节", "中孚", "小过", "既济", "未济"
    ]
    
    processed = 0
    missing = []
    
    # 为每个卦创建单独的JSON文件
    for gua_name in gua_list:
        if gua_name in gua_texts:
            gua_data = gua_texts[gua_name]
            
            # 添加卦名和卦序信息
            enhanced_data = {
                "卦名": gua_name,
                "卦序": gua_list.index(gua_name) + 1,
                **gua_data
            }
            
            # 保存为JSON文件
            output_file = os.path.join(output_dir, f"{gua_name}.json")
            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(enhanced_data, f, ensure_ascii=False, indent='\t')
            
            processed += 1
            print(f"已生成: {gua_name}.json")
        else:
            missing.append(gua_name)
            print(f"警告: 未找到卦 '{gua_name}' 的数据")
    
    # 创建索引文件
    index_data = {
        "卦名列表": gua_list,
        "卦名映射": {gua: f"{gua}.json" for gua in gua_list if gua in gua_texts},
        "总卦数": len(gua_list),
        "已生成文件数": processed
    }
    
    index_file = os.path.join(output_dir, "_index.json")
    with open(index_file, 'w', encoding='utf-8') as f:
        json.dump(index_data, f, ensure_ascii=False, indent='\t')
    
    print(f"\n处理完成!")
    print(f"成功拆分: {processed} 个卦的爻辞")
    if missing:
        print(f"缺少的卦: {', '.join(missing)}")
    print(f"输出目录: {output_dir}")
    print(f"索引文件: {index_file}")
    
    # 生成部署说明
    readme_content = """# 卦爻辞文件部署说明

## 文件结构
gua_texts/
├── 乾.json
├── 坤.json
├── ...
└── _index.json

## 使用方式
1. 将所有JSON文件上传到服务器的gua_texts/目录
2. 确保Web服务器正确设置MIME类型：.json -> application/json
3. 确保主程序中的baseUrl路径正确

## 注意事项
- 这些文件只在网络环境下使用
- 本地文件环境(file://)会直接使用完整的text.js文件
- 如果卦爻辞加载失败，程序会显示降级内容
"""
    
    readme_file = os.path.join(output_dir, "README.md")
    with open(readme_file, 'w', encoding='utf-8') as f:
        f.write(readme_content)
    
    print(f"\n已生成部署说明: {readme_file}")

if __name__ == "__main__":
    split_gua_texts_for_web("text.js")