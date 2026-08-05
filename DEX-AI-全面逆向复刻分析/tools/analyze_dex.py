import struct
import sys
import os
import re

def analyze_dex(filepath):
    print(f"\n===== 分析: {os.path.basename(filepath)} =====")
    print(f"文件大小: {os.path.getsize(filepath)} bytes")
    
    with open(filepath, 'rb') as f:
        data = f.read()
    
    # DEX 文件头
    magic = data[0:8]
    checksum = struct.unpack('<I', data[8:12])[0]
    signature = data[12:32].hex()
    file_size = struct.unpack('<I', data[32:36])[0]
    header_size = struct.unpack('<I', data[36:40])[0]
    endian_tag = struct.unpack('<I', data[40:44])[0]
    link_size = struct.unpack('<I', data[44:48])[0]
    link_off = struct.unpack('<I', data[48:52])[0]
    map_off = struct.unpack('<I', data[52:56])[0]
    string_ids_size = struct.unpack('<I', data[56:60])[0]
    string_ids_off = struct.unpack('<I', data[60:64])[0]
    type_ids_size = struct.unpack('<I', data[64:68])[0]
    type_ids_off = struct.unpack('<I', data[68:72])[0]
    proto_ids_size = struct.unpack('<I', data[72:76])[0]
    proto_ids_off = struct.unpack('<I', data[76:80])[0]
    field_ids_size = struct.unpack('<I', data[80:84])[0]
    field_ids_off = struct.unpack('<I', data[84:88])[0]
    method_ids_size = struct.unpack('<I', data[88:92])[0]
    method_ids_off = struct.unpack('<I', data[92:96])[0]
    class_defs_size = struct.unpack('<I', data[96:100])[0]
    class_defs_off = struct.unpack('<I', data[100:104])[0]
    data_size = struct.unpack('<I', data[104:108])[0]
    data_off = struct.unpack('<I', data[108:112])[0]
    
    print(f"DEX 版本: {magic[4:8].decode('ascii', errors='replace')}")
    print(f"文件大小: {file_size} bytes")
    print(f"String IDs: {string_ids_size}")
    print(f"Type IDs: {type_ids_size}")
    print(f"Proto IDs: {proto_ids_size}")
    print(f"Field IDs: {field_ids_size}")
    print(f"Method IDs: {method_ids_size}")
    print(f"Class Defs: {class_defs_size}")
    
    # 提取所有字符串
    print(f"\n提取字符串 (前200个):")
    string_offsets = []
    for i in range(min(string_ids_size, 5000)):
        off = struct.unpack('<I', data[string_ids_off + i*4 : string_ids_off + i*4 + 4])[0]
        string_offsets.append(off)
    
    strings = []
    for off in string_offsets:
        # 读取 uleb128 长度
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
    
    # 过滤并显示关键字符串
    keywords = ['mobile', 'codex', 'deecodex', 'compose', 'activity', 'service', 'fragment', 
                'http', 'https', 'api', 'token', 'login', 'auth', 'websocket', 'grpc',
                'tailscale', 'headscale', 'ilink', 'weixin', 'wechat', 'companion',
                'viewmodel', 'repository', 'database', 'room', 'datastore',
                'MainActivity', 'Application', 'notification', 'firebase', 'fcm',
                'gson', 'json', 'serialize', 'protobuf', 'navigation', 'jetpack',
                'coil', 'glide', 'coroutine', 'flow', 'state', 'mutable',
                'config', 'setting', 'preference', 'account', 'device',
                'connect', 'disconnect', 'sync', 'message', 'conversation']
    
    found = set()
    for s in strings:
        for kw in keywords:
            if kw.lower() in s.lower():
                found.add(s)
                break
    
    # 按长度排序，显示最相关的
    sorted_strings = sorted(found, key=len)
    for s in sorted_strings[:100]:
        if len(s) < 200:
            print(f"  {s[:150]}")

def main():
    apk_dir = sys.argv[1]
    dex_files = sorted([f for f in os.listdir(apk_dir) if f.endswith('.dex')])
    for dex in dex_files:
        analyze_dex(os.path.join(apk_dir, dex))

if __name__ == '__main__':
    main()
