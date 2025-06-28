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

项目包含两个主要配置文件：

1. **template.jsonc**: 包含 Xray 的基本配置模板，如日志、入站、出站等基础设置
2. **config.jsonc**: 包含用户自定义的路由规则和代理出站配置

#### config.jsonc 结构

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

### 生成配置

运行以下命令生成配置文件：

```bash
node generate_config.js
```

生成的配置文件将保存在 `build/config.jsonc` 中。

## 配置示例

### 添加代理出站配置

在 `config.jsonc` 中的 `proxyOutBound` 字段添加你的代理配置，例如：

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

在 `config.jsonc` 中修改 `routingRules` 字段：

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

- 确保 `proxyOutBound` 配置正确，否则生成的配置文件可能无法正常工作
- 可以使用 geosite 和 geoip 预定义规则集
- 配置文件使用 JSONC 格式，支持添加注释