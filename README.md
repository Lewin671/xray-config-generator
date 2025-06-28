# Custom Xray 配置生成器

这是一个用于生成 Xray 代理工具配置文件的自动化工具。通过简单的配置文件修改，可以快速生成适用于不同场景的 Xray 配置。

## 功能特点

- 自动合并模板配置和用户自定义规则
- 支持自定义路由规则（代理域名、直连域名、IP规则等）
- 支持自定义代理出站配置
- 配置文件使用 JSONC 格式，支持注释
- 自动生成最终配置到 build 目录

## 使用方法

### 安装依赖

```bash
npm install
```

### 配置文件说明

项目包含以下主要配置文件：

1. **template.jsonc**: 包含 Xray 的基本配置模板，如日志、入站、出站等基础设置
2. **config.jsonc.backup**: 包含示例的路由规则和代理出站配置，用于初始配置参考
3. **config.jsonc**: 最终使用的配置文件，包含用户自定义的路由规则和代理出站配置

#### 配置文件结构

```jsonc
{
    "routingRules": {
        "proxyDomains": ["需要代理的域名列表"],
        "directDomains": ["直连的域名列表"],
        "directIPs": ["直连的IP列表"],
        "proxyIPs": ["需要代理的IP列表"]
    },
    "proxyOutBound": {
        // 代理出站配置
    }
}
```

### 配置步骤

1. 复制 `config.jsonc.backup` 文件并根据自己的需求进行修改
2. 将修改后的文件重命名为 `config.jsonc`
3. 运行以下命令生成最终配置文件：

```bash
node generate_config.js
```

生成的配置文件将保存在 `build/config.jsonc` 中。

## 配置示例

### 修改配置文件

1. 首先复制 `config.jsonc.backup` 文件作为起点
2. 根据以下示例修改配置

### 添加代理出站配置

在配置文件中的 `proxyOutBound` 字段修改为你的代理配置，例如：

```jsonc
"proxyOutBound": {
    "protocol": "vless",
    "settings": {
        "vnext": [
            {
                "address": "your-server-address",
                "port": 443,
                "users": [
                    {
                        "id": "your-uuid",
                        "encryption": "none",
                        "flow": "xtls-rprx-vision"
                    }
                ]
            }
        ]
    },
    "streamSettings": {
        "network": "tcp",
        "security": "reality",
        "realitySettings": {
            "show": false,
            "fingerprint": "chrome",
            "serverName": "your-sni",
            "publicKey": "your-public-key",
            "shortId": "your-short-id",
            "spiderX": "your-spider-x"
        }
    }
}
```

### 自定义路由规则

在配置文件中修改 `routingRules` 字段：

```jsonc
"routingRules": {
    "proxyDomains": [
        "google.com",
        "github.com",
        "geosite:geolocation-!cn"
    ],
    "directDomains": [
        "baidu.com",
        "geosite:cn"
    ],
    "directIPs": [
        "geoip:cn",
        "geoip:private"
    ],
    "proxyIPs": [
        "8.8.8.8/32"
    ]
}
```

## 注意事项

- 必须将修改后的配置文件重命名为 `config.jsonc`，否则生成脚本无法正确读取
- 确保 `proxyOutBound` 配置正确，否则生成的配置文件可能无法正常工作
- 可以使用 geosite 和 geoip 预定义规则集
- 配置文件使用 JSONC 格式，支持添加注释
- 如需重新配置，可以随时参考 `config.jsonc.backup` 文件