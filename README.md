# Pi SDK from Scratch

> 不是 API 字典，而是沿着一次真实 Agent 会话，从零建立 Pi Coding Agent SDK 的心智模型。

Pi SDK 的能力很多：模型、工具、Skills、扩展、MCP、持久化会话、Runtime……直接按 API 或官方示例的文件顺序阅读，常常会知道“有什么”，却不知道“什么时候该用”。

这个项目把作者的学习笔记重新编排为一条使用路线：先让 Agent 跑起来，再看清一次会话里发生了什么，最后才进入资源、扩展和多会话宿主应用。每章既能读，也能运行。

**在线教程在本地启动后打开：** `http://localhost:4173/web/`

## 学习路线

```text
01 初始化：最小项目边界
        ↓
02 让一次会话跑起来
        ↓
03 看见消息、流和队列
        ↓
04 模型、认证与 ModelRuntime
        ↓
05 createAgentSession：配置与队列
        ↓
06 隔离认证与模型配置
        ↓
07 ResourceLoader 总览与 System Prompt
        ↓
08 Skills：筛选与一次性注入
        ↓
09 加载 Extension：文件与内联工厂
        ↓
10 AGENTS.md：项目级上下文
        ↓
11 Prompt Template：/命令式快捷短语
        ↓
12 Extension：事件、工具和命令
        ↓
13 Codemode、Tool Search 与 MCP
        ↓
14 SettingsManager：有效配置与写盘边界
        ↓
15 SessionManager：四种历史模式
        ↓
16 AgentSessionRuntime：支持新建、切换、恢复和分叉的宿主
        ↓
17 官方示例：Full Control
```

这不是官方示例的重排序：尤其在 ResourceLoader 部分，本项目把系统提示词、Skills、扩展发现、`AGENTS.md` 和 Prompt Template 拆为五个连续章节。每一章先解释“你正在解决的产品问题”，再给出最小代码和运行边界。详细的互动阅读页在 [`web/`](web/)；可运行示例在 [`src/`](src/)。

## 快速开始

需要 **Node.js 22.19+**，以及一个已经配置好的 Pi Provider。

```bash
git clone <your-repository-url>
cd pi-sdk-from-scratch
npm install

# 阅读网站：文章与对应源码并排显示
npm run dev

# 运行第一章
npm run example -- src/01-first-session.ts

# 验证所有示例的 TypeScript 类型
npm run check
```

示例不会读取或提交任何密钥。认证、模型注册和 MCP 配置由本机 Pi 环境管理；[`.env.example`](.env.example) 仅用于提醒，不包含配置值。

## 先抓住三个边界

| 边界 | 负责什么 | 典型 API |
| --- | --- | --- |
| 一次对话 | 消息、模型、工具、队列、订阅 | `AgentSession` |
| 项目环境 | 设置、资源、认证、可发现内容 | `ModelRuntime`、`ResourceLoader`、`SettingsManager` |
| 可替换会话的宿主 | new / switch / fork / import 之后重建环境 | `AgentSessionRuntime` |

最容易犯的错误是把它们混在一起：`AgentSession` 是一次对话，不是应用；`AgentSessionRuntime` 是稳定的控制器，而 `runtime.session` 才是会被替换的当前对话。

## 项目结构

```text
├─ src/                  # 与教程章节一一对应的可运行 TypeScript 示例
├─ web/                  # 不依赖打包器的本地互动教程
├─ scripts/serve.mjs     # 仅用于本地预览的静态服务器
├─ package.json
└─ README.md
```

## 内容来源与边界

- 讲解顺序、重点和中文说明来自作者的 `pi-test.md` 学习整理，并为本项目重新组织、改写。
- 示例使用 Pi SDK 的公开 API；部分用法与 [Pi 官方 SDK examples](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/sdk) 对照验证。
- 教学网站的“文章 + 源码并排、循序推进”体验受到 [SaladDay/pi-from-scratch](https://github.com/SaladDay/pi-from-scratch) 启发；本项目不复制其代码或文本，主题聚焦 Pi SDK 的使用，而不是手写 Agent。

## 贡献

Pi SDK 演进很快。欢迎提交版本兼容性修复、可复现的最小例子和更清晰的中文解释。请不要提交 API Key、OAuth 凭据、`.pi/` 内容或会话 JSONL。

## License

[MIT](LICENSE)
