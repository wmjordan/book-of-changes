import json
import re
import argparse

def read_text_js(file_path):
    """读取text.js文件，提取guaTexts部分的JSON数据"""
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 提取JSON部分
    start = content.find('const guaTexts = {')
    if start == -1:
        start = content.find('guaTexts = {')
    
    # 找到对应的结束位置（通过大括号计数）
    if start != -1:
        start = content.find('{', start)
        brace_count = 0
        end = start
        for i, char in enumerate(content[start:], start):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end = i + 1
                    break
        
        # 提取JSON字符串，移除可能存在的注释
        json_str = content[start:end]
        
        # 移除单行注释（如 // ....）
        json_str = re.sub(r'//.*', '', json_str)
        
        try:
            gua_texts = json.loads(json_str)
            return gua_texts, content
        except json.JSONDecodeError as e:
            print(f"JSON解析错误: {e}")
            return None, content
    return None, content

def read_data_file(file_path):
    """读取数据文件（如序卦.txt），返回字典
    
    文件格式：{卦名: {字段名: 值}}
    例如：{"乾": {"序卦": "..."}, "坤": {"序卦": "..."}}
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    return json.loads(content)

def merge_data_to_text(gua_texts, source_data, field_mapping=None):
    """将数据合并到每个卦中
    
    Args:
        gua_texts: text.js中的guaTexts数据
        source_data: 源数据字典，格式为 {卦名: {字段名: 值}}
        field_mapping: 字段映射字典，格式为 {源字段名: 目标字段名}
                       如果为None，则直接使用源字段名
    
    Returns:
        更新后的gua_texts数据
    """
    for gua_name, gua_data in gua_texts.items():
        if gua_name in source_data:
            source_fields = source_data[gua_name]
            
            # 遍历源数据中的所有字段
            for source_field, value in source_fields.items():
                # 如果有字段映射，使用映射后的目标字段名
                if field_mapping and source_field in field_mapping:
                    target_field = field_mapping[source_field]
                else:
                    target_field = source_field
                
                # 将字段添加到卦数据中
                gua_data[target_field] = value
    
    return gua_texts

def write_new_text_js(original_content, gua_texts, output_path):
    """将更新后的guaTexts写回text.js文件"""
    # 将更新后的guaTexts转回JSON字符串，保持原有的格式风格
    new_gua_texts_str = json.dumps(gua_texts, ensure_ascii=False, indent='\t')
    
    # 替换原文件中的guaTexts部分
    start = original_content.find('const guaTexts = {')
    if start == -1:
        start = original_content.find('guaTexts = {')
    
    if start != -1:
        start = original_content.find('{', start)
        brace_count = 0
        end = start
        for i, char in enumerate(original_content[start:], start):
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    end = i + 1
                    break
        
        new_content = original_content[:start] + new_gua_texts_str + original_content[end:]
        
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return True
    return False

def main():
    """主函数，支持命令行参数"""
    parser = argparse.ArgumentParser(description='合并数据到text.js文件')
    parser.add_argument('--text-js', default='text.js', help='text.js文件路径')
    parser.add_argument('--source', default='data.txt', help='源数据文件路径')
    parser.add_argument('--output', default='text_updated.js', help='输出文件路径')
    parser.add_argument('--field-map', help='可选，字段映射JSON字符串，例如: {"序": "序卦"}')
    
    args = parser.parse_args()
    
    # 读取文件
    print("正在读取文件...")
    gua_texts, original_content = read_text_js(args.text_js)
    source_data = read_data_file(args.source)
    
    if gua_texts is None:
        print(f"错误：无法解析{args.text_js}文件")
        return
    
    print(f"✓ 读取到 {len(gua_texts)} 个卦")
    print(f"✓ 从 {args.source} 读取到 {len(source_data)} 条数据")
    
    # 解析字段映射
    field_mapping = None
    if args.field_map:
        try:
            field_mapping = json.loads(args.field_map)
            print(f"✓ 字段映射: {field_mapping}")
        except json.JSONDecodeError as e:
            print(f"警告：字段映射JSON解析错误: {e}，将使用默认映射")
    
    # 合并数据
    print("\n正在合并数据...")
    
    # 统计要合并的字段
    if source_data:
        sample_gua = next(iter(source_data.values()))
        fields = list(sample_gua.keys())
        print(f"  要合并的字段: {', '.join(fields)}")
    
    updated_gua_texts = merge_data_to_text(gua_texts, source_data, field_mapping)
    
    # 写入新文件
    print("正在写入文件...")
    success = write_new_text_js(original_content, updated_gua_texts, args.output)
    
    if success:
        print(f"\n{'='*50}")
        print(f"✓ 成功！数据已合并到text.js文件中。")
        print(f"输出文件：{args.output}")
        print(f"{'='*50}")
        
        # 显示示例
        if source_data:
            sample_gua_name = list(source_data.keys())[0]
            if sample_gua_name in updated_gua_texts:
                sample_fields = list(source_data[sample_gua_name].keys())
                print(f"\n示例 - {sample_gua_name}卦:")
                for field in sample_fields:
                    target_field = field_mapping.get(field, field) if field_mapping else field
                    if target_field in updated_gua_texts[sample_gua_name]:
                        value = updated_gua_texts[sample_gua_name][target_field]
                        print(f"  {target_field}: {value}")
    else:
        print("错误：无法写入输出文件")

if __name__ == "__main__":
    main()
