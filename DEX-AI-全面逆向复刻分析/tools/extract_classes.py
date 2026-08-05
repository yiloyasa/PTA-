import struct
import os

def extract_dex_classes(filepath):
    print(f"\n===== 提取类名: {os.path.basename(filepath)} =====")
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # 解析 DEX 头
    string_ids_off = struct.unpack('<I', data[60:64])[0]
    string_ids_size = struct.unpack('<I', data[56:60])[0]
    type_ids_off = struct.unpack('<I', data[68:72])[0]
    type_ids_size = struct.unpack('<I', data[64:68])[0]
    class_defs_off = struct.unpack('<I', data[100:104])[0]
    class_defs_size = struct.unpack('<I', data[96:100])[0]
    
    # 读取所有字符串
    string_offsets = []
    for i in range(string_ids_size):
        off = struct.unpack('<I', data[string_ids_off + i*4 : string_ids_off + i*4 + 4])[0]
        string_offsets.append(off)
    
    strings = []
    for off in string_offsets:
        pos = off
        length = 0
        shift = 0
        while True:
            byte = data[pos]
            length |= (byte & 0x7F) << shift
            shift += 7
            pos += 1
            if (byte & 0x80) == 0:
                break
        try:
            s = data[pos:pos+length].decode('utf-8', errors='replace')
            strings.append(s)
        except:
            strings.append('')
    
    # 读取所有类型
    type_strings = []
    for i in range(type_ids_size):
        idx = struct.unpack('<I', data[type_ids_off + i*4 : type_ids_off + i*4 + 4])[0]
        if idx < len(strings):
            type_strings.append(strings[idx])
    
    # 读取所有类定义
    classes = []
    for i in range(class_defs_size):
        off = class_defs_off + i * 32
        class_idx = struct.unpack('<I', data[off + 0:off + 4])[0]
        access_flags = struct.unpack('<I', data[off + 4:off + 8])[0]
        superclass_idx = struct.unpack('<I', data[off + 8:off + 12])[0]
        if class_idx < len(type_strings):
            class_name = type_strings[class_idx]
            superclass = type_strings[superclass_idx] if superclass_idx < len(type_strings) else ""
            classes.append((class_name, superclass, access_flags))
    
    # 过滤出有意义的类（应用自己的类，不是第三方库）
    app_packages = ['com.deecodex', 'com.mobilecodex', 'mobilecodex', 'deecodex']
    app_classes = []
    for cls_name, superclass, flags in classes:
        for pkg in app_packages:
            if pkg.lower() in cls_name.lower():
                app_classes.append((cls_name, superclass, flags))
                break
    
    if app_classes:
        print(f"找到 {len(app_classes)} 个应用类:")
        for cls_name, superclass, flags in sorted(app_classes, key=lambda x: x[0]):
            flag_str = ""
            if flags & 0x1: flag_str += "public "
            if flags & 0x2: flag_str += "private "
            if flags & 0x200: flag_str += "interface "
            if flags & 0x400: flag_str += "abstract "
            print(f"  {flag_str}{cls_name}")
            if superclass and superclass != "Ljava/lang/Object;" and "java.lang.Object" not in superclass:
                print(f"    extends {superclass}")
    else:
        print("未找到应用类，列出所有类的前20个:")
        for cls_name, superclass, flags in classes[:20]:
            print(f"  {cls_name}")

def main():
    apk_dir = r'G:\项目two\DEX-AI-全面逆向复刻分析\extracted\MobileCodex-APK'
    dex_files = sorted([f for f in os.listdir(apk_dir) if f.endswith('.dex')])
    for dex in dex_files:
        extract_dex_classes(os.path.join(apk_dir, dex))

if __name__ == '__main__':
    main()
