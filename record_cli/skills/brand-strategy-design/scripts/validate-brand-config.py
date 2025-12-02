#!/usr/bin/env python3
"""
品牌配置验证脚本
验证 brand-config.json 的格式和内容
"""

import json
import sys
import re
from typing import Dict, List, Tuple

def hex_to_rgb(hex_color: str) -> Tuple[int, int, int]:
    """将十六进制颜色转换为 RGB"""
    hex_color = hex_color.lstrip('#')
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))

def calculate_luminance(rgb: Tuple[int, int, int]) -> float:
    """计算颜色亮度"""
    r, g, b = [x / 255.0 for x in rgb]
    r = r / 12.92 if r <= 0.03928 else ((r + 0.055) / 1.055) ** 2.4
    g = g / 12.92 if g <= 0.03928 else ((g + 0.055) / 1.055) ** 2.4
    b = b / 12.92 if b <= 0.03928 else ((b + 0.055) / 1.055) ** 2.4
    return 0.2126 * r + 0.7152 * g + 0.0722 * b

def calculate_contrast_ratio(color1: str, color2: str) -> float:
    """计算两个颜色的对比度"""
    lum1 = calculate_luminance(hex_to_rgb(color1))
    lum2 = calculate_luminance(hex_to_rgb(color2))
    lighter = max(lum1, lum2)
    darker = min(lum1, lum2)
    return (lighter + 0.05) / (darker + 0.05)

def validate_hex_color(color: str) -> bool:
    """验证十六进制颜色格式"""
    pattern = r'^#[0-9A-Fa-f]{6}$'
    return bool(re.match(pattern, color))

def validate_brand_config(config: Dict) -> List[str]:
    """验证品牌配置"""
    errors = []
    
    # 验证必需字段
    required_fields = ['brand', 'colors', 'author']
    for field in required_fields:
        if field not in config:
            errors.append(f"❌ 缺少必需字段: {field}")
    
    # 验证品牌信息
    if 'brand' in config:
        brand = config['brand']
        if 'name' not in brand:
            errors.append("❌ 缺少品牌名称 (brand.name)")
        if 'tagline' not in brand:
            errors.append("❌ 缺少品牌标语 (brand.tagline)")
        if 'domain' not in brand:
            errors.append("❌ 缺少域名 (brand.domain)")
    
    # 验证配色系统
    if 'colors' in config:
        colors = config['colors']
        
        # 验证主色
        if 'primary' in colors and 'main' in colors['primary']:
            primary = colors['primary']['main']
            if not validate_hex_color(primary):
                errors.append(f"❌ 主色格式错误: {primary}")
        else:
            errors.append("❌ 缺少主色 (colors.primary.main)")
        
        # 验证背景色
        if 'background' in colors and 'light' in colors['background']:
            bg_light = colors['background']['light']
            if 'primary' in bg_light:
                bg_color = bg_light['primary']
                if not validate_hex_color(bg_color):
                    errors.append(f"❌ 背景色格式错误: {bg_color}")
                
                # 检查对比度
                if 'primary' in colors and 'main' in colors['primary']:
                    primary = colors['primary']['main']
                    if validate_hex_color(primary) and validate_hex_color(bg_color):
                        contrast = calculate_contrast_ratio(primary, bg_color)
                        if contrast < 4.5:
                            errors.append(f"⚠️  主色与背景色对比度不足: {contrast:.2f} (建议 > 4.5)")
    
    # 验证作者信息
    if 'author' in config:
        author = config['author']
        if 'id' not in author:
            errors.append("❌ 缺少作者 ID (author.id)")
        if 'name' not in author:
            errors.append("❌ 缺少作者名称 (author.name)")
    
    return errors

def main():
    if len(sys.argv) < 2:
        print("使用方法: python validate-brand-config.py <config.json>")
        sys.exit(1)
    
    config_file = sys.argv[1]
    
    try:
        with open(config_file, 'r', encoding='utf-8') as f:
            config = json.load(f)
    except FileNotFoundError:
        print(f"❌ 文件不存在: {config_file}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ JSON 格式错误: {e}")
        sys.exit(1)
    
    print(f"🔍 验证品牌配置: {config_file}\n")
    
    errors = validate_brand_config(config)
    
    if not errors:
        print("✅ 配置验证通过!")
        
        # 显示配色对比度信息
        if 'colors' in config:
            colors = config['colors']
            if 'primary' in colors and 'main' in colors['primary']:
                primary = colors['primary']['main']
                if 'background' in colors and 'light' in colors['background']:
                    bg = colors['background']['light']['primary']
                    if validate_hex_color(primary) and validate_hex_color(bg):
                        contrast = calculate_contrast_ratio(primary, bg)
                        print(f"\n📊 配色对比度:")
                        print(f"   主色 ({primary}) vs 背景 ({bg}): {contrast:.2f}")
                        if contrast >= 7.0:
                            print(f"   ✅ AAA 级别 (优秀)")
                        elif contrast >= 4.5:
                            print(f"   ✅ AA 级别 (良好)")
                        else:
                            print(f"   ⚠️  不符合 WCAG 标准")
        
        sys.exit(0)
    else:
        print("❌ 配置验证失败:\n")
        for error in errors:
            print(f"   {error}")
        sys.exit(1)

if __name__ == '__main__':
    main()
