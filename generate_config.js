const fs = require('fs')
const path = require('path')
const jsonc = require('jsonc')

// 读取本地 JSON 文件并解析为 JavaScript 对象
function readLocalRules (filePath) {
  try {
    const data = fs.readFileSync(filePath, 'utf-8')
    // node js 解析 jsonc
    return jsonc.parse(data)
  } catch (error) {
    console.error('读取文件失败:', error)
    return null
  }
}

/**
 * 根据 routingRules 更新 templateConfig 中的 dns 和 routing 配置
 * @param {object} templateConfig - 从 template.jsonc 读取的配置对象
 * @param {object} routingRules - 从 config.jsonc 读取的路由规则对象
 * @returns {object} 更新后的配置对象
 */
function updateConfigWithDomainRules (templateConfig, routingRules) {
  // 更新 dns.servers 配置：
  //  - 第一项：用于代理，domains 使用 routingRules.proxyDomains
  //  - 第二项：用于直连，domains 使用 routingRules.directDomains
  //  - 第三项为默认 fallback 配置
  templateConfig.dns.servers = [
    {
      address: '127.0.0.1',
      port: 5335,
      domains: routingRules.proxyDomains,
      skipFallback: true
    },
    {
      address: '127.0.0.1',
      port: 25564,
      domains: routingRules.directDomains,
      skipFallback: true
    },
    {
      address: '127.0.0.1',
      port: 5335,
      skipFallback: false
    }
  ]

  // 构造 routing.rules 配置，规则按照以下逻辑构建：
  // 1. dns-in 的流量转发到 dns-out
  // 2. 对于域名匹配 proxyDomains 的流量，走 outboundTag 为 proxy
  // 3. 对于域名匹配 directDomains 的流量，走 outboundTag 为 direct
  // 4. 如果配置了 IP 规则，则添加相应的直连/代理规则
  // 5. 保留阻止 bittorrent 协议的规则和对特定 inboundTag 的规则
  const newRoutingRules = []

  // 规则1：dns-in 转发到 dns-out
  newRoutingRules.push({
    type: 'field',
    inboundTag: ['dns-in'],
    outboundTag: 'dns-out'
  })

  // 规则2：代理域名规则 (proxy)
  if (routingRules.proxyDomains && routingRules.proxyDomains.length > 0) {
    newRoutingRules.push({
      type: 'field',
      domain: routingRules.proxyDomains,
      outboundTag: 'proxy'
    })
  }

  // 如果 proxyIPs 有配置则添加代理 IP 规则
  if (routingRules.proxyIPs && routingRules.proxyIPs.length > 0) {
    newRoutingRules.push({
      type: 'field',
      ip: routingRules.proxyIPs,
      outboundTag: 'proxy'
    })
  }

  // 规则3：直连域名规则 (direct)
  if (routingRules.directDomains && routingRules.directDomains.length > 0) {
    newRoutingRules.push({
      type: 'field',
      domain: routingRules.directDomains,
      outboundTag: 'direct'
    })
  }

  // 规则4：直连 IP 规则
  if (routingRules.directIPs && routingRules.directIPs.length > 0) {
    newRoutingRules.push({
      type: 'field',
      ip: routingRules.directIPs,
      outboundTag: 'direct'
    })
  }

  // 规则5：阻止 bittorrent 协议
  newRoutingRules.push({
    type: 'field',
    protocol: ['bittorrent'],
    outboundTag: 'blocked'
  })

  // 规则6：针对特定入站标签的规则，保持使用 proxy 出口
  newRoutingRules.push({
    type: 'field',
    inboundTag: ['REALITY-in'],
    outboundTag: 'proxy'
  })

  templateConfig.routing.rules = newRoutingRules
  return templateConfig
}

// 主流程：读取配置文件和模板，更新配置后写入到新的 JSON 文件
function updateXrayConfig () {
  const configPath = path.join(__dirname, 'config.jsonc')
  const templatePath = path.join(__dirname, 'template.jsonc')

  const configData = readLocalRules(configPath)
  const templateConfig = readLocalRules(templatePath)

  if (!configData || !templateConfig) {
    console.error('加载输入文件失败，请检查文件路径或文件格式。')
    return
  }

  // 确保输出目录存在
  const buildDir = path.join(__dirname, 'build')
  if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true })
  }

  const newConfig = updateConfigWithDomainRules(templateConfig, configData.routingRules)

  // 添加代理出站配置
  if (configData.proxyOutBound && Object.keys(configData.proxyOutBound).length > 0) {
    // 找到 outbounds 数组
    const proxyOutboundIndex = newConfig.outbounds.findIndex(outbound => outbound.tag === 'proxy')
    if (proxyOutboundIndex >= 0) {
      // 如果已存在 proxy 标签的出站，则替换它
      newConfig.outbounds[proxyOutboundIndex] = {
        ...configData.proxyOutBound,
        tag: 'proxy'
      }
    } else {
      // 否则添加到 outbounds 数组的第一位
      newConfig.outbounds.unshift({
        ...configData.proxyOutBound,
        tag: 'proxy'
      })
    }
  } else {
    console.warn('警告: proxyOutBound 配置为空或不存在，请在 config.jsonc 中添加代理出站配置。')
    
    // 移除任何空的 proxy 出站配置
    const proxyOutboundIndex = newConfig.outbounds.findIndex(outbound => 
      outbound.tag === 'proxy' && Object.keys(outbound).length <= 1)
    if (proxyOutboundIndex >= 0) {
      newConfig.outbounds.splice(proxyOutboundIndex, 1)
    }
  }

  const outputPath = path.join(__dirname, 'build', 'config.jsonc')
  try {
    fs.writeFileSync(outputPath, JSON.stringify(newConfig, null, 4))
    console.log('配置文件已成功保存到:', outputPath)
  } catch (error) {
    console.error('写入文件失败:', error)
  }
}

// 执行配置更新
updateXrayConfig()
