const chapters = [
  {
    id: "project-setup",
    label: "初始化：最小项目边界",
    source: "package.json",
    sourcePath: "../package.json",
    minutes: "约 4 分钟",
    lead: "先建立一个足够小、却能稳定运行 SDK 的 TypeScript 项目。项目配置不是前置杂务：Node 版本、ESM 与启动命令决定了示例能不能被正确加载。",
    blocks: [
      {
        heading: "最小依赖集",
        paragraphs: ["核心运行时是 <code>@earendil-works/pi-coding-agent</code>；<code>typescript</code> 负责静态检查，<code>tsx</code> 让 Node 直接运行 TypeScript。项目必须使用 ESM：<code>\"type\": \"module\"</code>。"],
      },
      {
        heading: "先建立两个习惯",
        bullets: [
          "启动时使用 <code>node --env-file=.env --import=tsx</code>，让本机环境变量和 TypeScript loader 明确可见。",
          "每次改示例后运行 <code>npm run check</code>；教程代码应先是可编译的，再讨论如何接入模型。",
          "把 <code>.env</code>、<code>.pi/</code> 和会话 JSONL 加入 .gitignore，认证与历史不属于教程源码。",
        ],
      },
      {
        callout: ["版本是课程的一部分", "本项目固定使用 Pi SDK 0.99.2。SDK 升级后应先运行类型检查，再逐章修订 API 描述，避免读者把不同版本的行为混在一起。"],
      },
    ],
  },
  {
    id: "first-session",
    label: "让一次会话跑起来",
    source: "01-first-session.ts",
    minutes: "约 6 分钟",
    lead: "先别急着配置模型、MCP 或扩展。Pi SDK 的最小单位是一段会话：创建它，交给它一个任务，读取结果，最后释放它。",
    blocks: [
      {
        heading: "你现在要解决什么？",
        paragraphs: [
          "你想在自己的 Node.js 程序里使用一个能读文件、调用工具和回复文本的 coding agent。此时不需要先实现 CLI；SDK 已经把 Agent harness 封装在 <code>AgentSession</code> 里。",
          "<code>createAgentSession()</code> 创建的是“一次对话”，不是整个应用。它有消息历史、模型、工具、排队消息、压缩状态和扩展运行时。一次性脚本最适合配合 <code>SessionManager.inMemory()</code>。",
        ],
      },
      {
        heading: "最小生命周期",
        paragraphs: ["<code>prompt()</code> 会等待本次 Agent run 完成。无论调用是否成功，<code>dispose()</code> 都应放在 <code>finally</code> 中：它会中止未完成工作，并释放会话与扩展关联的资源。"],
        bullets: [
          "创建：选择工作目录与会话存储策略。",
          "运行：<code>await session.prompt(...)</code>。",
          "读取：<code>getLastAssistantText()</code> 获取最终文本。",
          "清理：<code>session.dispose()</code>。",
        ],
      },
      {
        callout: ["先用内存会话", "只有当产品真的需要“恢复昨天的对话”时，才把 SessionManager 换成磁盘持久化。这样测试和单次任务不会留下会话文件。"],
      },
    ],
  },
  {
    id: "observe-session",
    label: "看见消息、流和队列",
    source: "02-observe-a-session.ts",
    minutes: "约 8 分钟",
    lead: "当最小调用跑通后，下一步不是加功能，而是看清它实际维护了什么状态。这样你才能把 SDK 接到自己的 CLI、网页或桌面 UI。",
    blocks: [
      {
        heading: "流式事件与最终结果是两件事",
        paragraphs: [
          "终端里一个字一个字出现的效果来自 <code>session.subscribe()</code>。订阅 <code>message_update</code>，并在 assistant 的 <code>text_delta</code> 事件到来时渲染增量。",
          "这只是呈现通道。一次运行结束后，完整状态仍在 <code>session.state.messages</code>（数组形式）或 <code>session.messages</code>（额外包含自定义类型消息）：一个 JSON 数组，元素按 role 分为 system、user、assistant 三类，每个对象都带 timestamp。最终文本可以从 <code>getLastAssistantText()</code> 读取，不要把临时 delta 当作唯一数据源。",
        ],
      },
      {
        heading: "System 消息：Agent 一开始知道什么？",
        paragraphs: [
          "System 消息由 Pi 组装。<code>preamble</code> 给出角色定位：「You are an expert coding assistant operating inside pi, a coding agent harness...」——它是运行在 Pi 框架内的专家级编码助手，职责是读文件、执行命令、编辑代码和写新文件。",
          "<code>tools</code> 段描述基础工具及其用途，参数 schema 在 <code>toolsAdded</code> 中；<code>rules</code> 是行为规则，<code>docs</code> 指向 Pi 文档，<code>skills</code> 与 <code>cwd</code> 分别是可用技能和当前工作目录。",
        ],
      },
      {
        heading: "基础工具与 toolsAdded",
        table: {
          head: ["工具", "用途"],
          rows: [
            ["<code>read</code>", "读取文件内容"],
            ["<code>bash</code>", "执行 bash 命令（ls、grep、find 等）"],
            ["<code>edit</code>", "精确文本替换编辑，支持一次多段"],
            ["<code>write</code>", "创建 / 覆盖文件"],
          ],
        },
        paragraphs: [
          "如果项目注册了自定义工具，也会一并列出。toolsAdded 进一步给出 read（path/offset/limit）、bash（command/timeout）、edit（path/edits）、write（path/content）的完整参数 schema，每项都带 <code>constrainedSampling: json_schema</code>、<code>strict: prefer</code>。",
        ],
      },
      {
        heading: "rules、docs 与元数据",
        bullets: [
          "<strong>rules</strong>：文件操作用 bash；查看文件用 read 而不是 cat/sed；可检查 <code>PI_*</code> 环境变量获取模型和会话信息；edit 的 <code>oldText</code> 必须精确唯一匹配；多处修改合并为一次 edit 调用；避免重叠或嵌套编辑；保持简洁回复并明确显示工作文件路径。",
          "<strong>docs</strong>：主文档在 <code>node_modules/@earendil-works/pi-coding-agent/README.md</code>，同目录还有 docs 与 examples；涉及 extensions、themes、skills、prompt-templates、TUI、keybindings、SDK、custom-provider、models、packages、environment-variables、MCP servers 等主题时，要求先完整阅读 .md 与交叉引用。",
          "<strong>timestamp</strong>：组装时刻的毫秒时间戳；messages 数组中的每个对象也各自带 timestamp。",
        ],
      },
      {
        heading: "User 消息：一次任务的原始输入",
        paragraphs: ["它的 <code>role</code> 是 user，<code>content</code> 是内容块数组（通常含 text），并带 timestamp。它不是普通字符串数组；保留这种结构，应用以后才能支持图片、工具结果或其他内容类型。"],
      },
      {
        heading: "Assistant 消息：回答之外还有运行事实",
        paragraphs: [
          "Assistant 消息可能同时包含 thinking（思考过程）与 text（实际回复）。除此之外，它还带调用与计费元数据：API、provider、model、token 用量（input / output / cacheRead / cacheWrite / reasoning / totalTokens）以及成本。",
          "下面的示例值来自一次真实的 deepseek 运行；UI 通常只显示 text，监控与计费系统则读取这些运行事实。",
        ],
        table: {
          head: ["字段", "示例值"],
          rows: [
            ["api", "openai-completions"],
            ["provider", "deepseek"],
            ["model", "deepseek-v4-pro"],
            ["usage.input / output", "98 / 193"],
            ["usage.cacheRead / cacheWrite", "3584 / 0"],
            ["usage.reasoning", "122"],
            ["usage.totalTokens", "3875"],
            ["usage.cost.input", "$0.00012936"],
            ["usage.cost.output", "$0.00076428"],
            ["usage.cost.cacheRead", "$0.0001577"],
            ["usage.cost.total", "$0.0010513"],
          ],
        },
      },
      {
        heading: "执行状态元数据",
        table: {
          head: ["字段", "示例值"],
          rows: [
            ["stopReason / rawStopReason", "stop / stop"],
            ["thinkingLevel", "high"],
            ["responseId", "3c5e123b-f37f-2543-9f24-3fcb02456eb0"],
            ["timestamp", "1791282854075"],
          ],
        },
      },
      {
        heading: "会话状态速查",
        diagram: "AgentSession\n├─ state.messages        system / user / assistant 的对话事实\n├─ model / thinkingLevel 当前模型决策\n├─ systemPrompt          组装后的系统上下文\n├─ getActiveToolNames()  实际可用能力\n└─ subscribe()           UI 的实时事件来源",
      },
      {
        heading: "运行中想改主意怎么办？",
        paragraphs: ["不要并发地再发一个普通 <code>prompt()</code>。使用 <code>steer()</code> 把新指令插入当前运行，例如“停止编辑，只检查 src”；使用 <code>followUp()</code> 排到当前运行结束之后。两者分别解决“现在转向”和“稍后继续”。"],
      },
    ],
  },
  {
    id: "model-runtime",
    label: "模型、认证与 ModelRuntime",
    source: "03-model-runtime.ts",
    minutes: "约 9 分钟",
    lead: "会话知道如何推理之前，必须知道该使用哪个模型、哪里读认证、哪些模型真的可以调用。这些不属于 Session 的业务逻辑，而属于 ModelRuntime。",
    blocks: [
      {
        heading: "三种找模型的方式",
        paragraphs: ["<code>ModelRuntime.create()</code> 负责模型目录与认证。找模型有三条路，对应不同的使用场景："],
        bullets: [
          "Option 1：<code>modelRuntime.getModel(\"anthropic\", \"claude-opus-4-5\")</code>，按 provider/id 精确查找内置模型。",
          "Option 2：注册在 <code>models.json</code> 里的自定义模型走同一个入口，如 <code>getModel(\"my-provider\", \"my-model\")</code>。",
          "Option 3：选择不确定时用 <code>getAvailable()</code>；它只返回当前认证有效的模型，适合作为产品默认值。",
          "选好之后显式传入 <code>model</code> 与 <code>thinkingLevel</code>（off / low / medium / high）；复用同一个 <code>modelRuntime</code> 可让会话共享同一套模型与认证上下文。",
        ],
      },
      {
        heading: "为什么要自定义路径？",
        paragraphs: ["宿主应用可以用 <code>authPath</code> 和 <code>modelsPath</code> 把认证、模型配置隔离到自己的目录。开发、测试与生产环境就不会意外读取彼此的凭据或模型清单。临时 Key 也可以在运行时通过 <code>setRuntimeApiKey()</code> 覆盖，而不是写入源码。"],
      },
      {
        callout: ["不要把密钥放进示例", "示例应演示认证边界，而不是包含密钥。提交仓库前检查 .env、auth.json 和任何会话导出文件。"],
      },
    ],
  },
  {
    id: "session-options",
    label: "createAgentSession：配置与队列",
    source: "03-session-options.ts",
    minutes: "约 12 分钟",
    lead: "最小调用跑通后，真正的产品差异都在 createAgentSession 的选项里：它把工作目录、模型、工具、资源、设置和历史存储装配为一次会话。",
    blocks: [
      {
        heading: "最常用的装配参数",
        bullets: [
          "<code>cwd</code>：Agent 工作目录；影响文件工具、项目级配置、上下文文件和会话归属。",
          "<code>model</code> / <code>modelRuntime</code> / <code>thinkingLevel</code>：选择推理能力；未指定模型时，从设置或可用模型中选择，thinkingLevel 最终受模型能力限制。",
          "<code>tools</code>、<code>excludeTools</code>、<code>noTools</code>：控制内置工具；<code>tools</code> 是白名单，<code>noTools</code> 的 <code>\"all\"</code> 禁用全部工具、<code>\"builtin\"</code> 只禁用默认内置工具。",
          "<code>customTools</code>：注入工具定义；更复杂的工具一般经由 Extension 注册。",
          "<code>resourceLoader</code>、<code>settingsManager</code>、<code>sessionManager</code>：分别提供资源、配置与历史策略；不指定 sessionManager 时默认创建磁盘持久化会话。",
        ],
      },
      {
        heading: "返回值不只包含 session",
        paragraphs: ["<code>extensionsResult</code> 描述扩展加载结果，通常由宿主或 UI 用于诊断；<code>modelFallbackMessage</code> 则在恢复旧会话却找不到原模型时提示回退。不要只解构 session 而忽略它们。"],
      },
      {
        heading: "prompt、steer 与 followUp",
        paragraphs: ["<code>prompt()</code> 等待整次运行结束。正在输出时想马上改变路线用 <code>steer()</code>；想在本轮结束后追加任务用 <code>followUp()</code>。这是队列语义，不是同时发多个 prompt。"],
      },
    ],
  },
  {
    id: "isolated-model-runtime",
    label: "隔离认证与模型配置",
    source: "03b-isolated-model-runtime.ts",
    minutes: "约 7 分钟",
    lead: "选择模型回答“用谁”，而认证路径回答“从哪里读配置”。将它们隔离，是把 SDK 从个人脚本变成宿主应用的重要一步。",
    blocks: [
      {
        heading: "ModelRuntime 的两条路径",
        paragraphs: [
          "不传 <code>modelRuntime</code> 时，SDK 使用默认运行时，从 agentDir（如 <code>~/.pi/agent</code>）读取认证与模型清单。",
          "<code>authPath</code> 指向 API Key 或 OAuth 凭据，<code>modelsPath</code> 指向模型清单。显式指定后，开发、测试、生产环境可以互不影响，也不会误读用户的默认 Pi 配置。",
        ],
      },
      {
        heading: "运行时 Key 覆盖",
        paragraphs: ["<code>setRuntimeApiKey(provider, key)</code> 仅修改当前 ModelRuntime。它适合由安全的宿主注入短期凭据；示例里只在环境变量存在时调用，绝不在仓库内放入真实 Key。"],
      },
    ],
  },
  {
    id: "resource-loader",
    label: "ResourceLoader 总览与系统提示词",
    source: "04-resource-loader.ts",
    minutes: "约 15 分钟",
    lead: "Agent 的行为并不只由一段 prompt 决定。项目规则、Skills、模板、扩展与 AGENTS.md 都有自己的发现机制；ResourceLoader 是它们进入会话的边界。本章先搭地图，接下来的四章逐个拆开。",
    blocks: [
      {
        heading: "DefaultResourceLoader 在收集什么？",
        paragraphs: ["它以 <code>cwd</code> 和 <code>agentDir</code> 为根，发现扩展、Skills、提示词模板、主题、AGENTS.md 等资源；随后 <code>reload()</code> 让这些资源成为创建会话时的候选项。<code>cwd</code> 不只是文件工具的工作目录，它也影响项目级设置、上下文文件与会话归属。"],
        diagram: "cwd / agentDir\n├─ AGENTS.md        项目上下文\n├─ skills/          可按需加载的方法\n├─ prompts/         /deploy 之类的文本模板\n├─ extensions/      事件、工具、命令\n└─ settings.json    设置与额外路径\n          ↓\n DefaultResourceLoader → AgentSession",
      },
      {
        heading: "两种改系统提示词的方式",
        paragraphs: ["<code>systemPromptOverride</code> 彻底替换默认提示词，适合完全受控的 Agent；<code>appendSystemPromptOverride</code> 在默认规则后追加要求，适合保留 Pi 内置行为。大多数产品应该优先追加。"],
      },
      {
        heading: "接下来四章分别拆开什么？",
        bullets: [
          "<strong>Skill</strong>：给模型按需读取的专项方法说明；下一章演示筛选与合成 Skill。",
          "<strong>Extension</strong>：在运行时加载的事件、工具与命令；后续会分别讲发现机制和自定义能力。",
          "<strong>AGENTS.md</strong>：项目长期约束，例如代码风格、测试命令与目录说明。",
          "<strong>Prompt Template</strong>：用户输入 <code>/deploy</code> 时注入对话的文本；它与宿主程序直接执行的 Command 不同。",
        ],
      },
      {
        callout: ["资源要先 reload", "构造 DefaultResourceLoader 之后先 await loader.reload()。否则你以为写进来的覆盖规则，可能还没有进入会话。"],
      },
    ],
  },
  {
    id: "skills",
    label: "Skills：筛选与一次性注入",
    source: "04a-skills.ts",
    minutes: "约 10 分钟",
    lead: "Skill 是一份让模型理解专项工作方法的说明。它不是宿主代码，也不是确定性命令；它的价值是把复杂但可复用的工作流从系统提示词中抽离出来。",
    blocks: [
      {
        heading: "默认发现与覆盖回调",
        paragraphs: [
          "<code>DefaultResourceLoader</code> 会先收集它能发现的 Skills。<code>skillsOverride(current)</code> 接到的 <code>current</code> 就是这份候选集合：你可以保留、筛选、补充或替换。",
          "示例只保留名称包含 <code>browser</code> 或 <code>search</code> 的技能，再追加一个合成 Skill；<code>current.diagnostics</code> 里的扫描警告会原样保留，最后通过 <code>loader.getSkills()</code> 打印出来。",
        ],
      },
      {
        heading: "为什么要使用合成来源？",
        paragraphs: ["有时你希望通过 SDK 临时提供一项 Skill，而不在磁盘写入 <code>SKILL.md</code>。此时用 <code>createSyntheticSourceInfo()</code> 标记它的来源；<code>filePath</code> 与 <code>baseDir</code> 仍然要给出清晰的虚拟路径，方便诊断与展示。"],
        bullets: [
          "<code>disableModelInvocation: false</code>：允许模型自行选择并使用它。",
          "设为 <code>true</code>：只允许宿主或系统显式触发，更适合需要严格控制的能力。",
          "先筛选再追加：既能保留必要的既有 Skill，又避免让模型面对无关的说明。",
        ],
      },
      {
        callout: ["Skill 不等于工具", "Skill 告诉模型“怎样做”；工具让模型“实际做”。需要确定性执行或访问外部系统时，应注册工具或由宿主直接调用。"],
      },
    ],
  },
  {
    id: "resource-extensions",
    label: "加载 Extension：文件与内联工厂",
    source: "04b-resource-extensions.ts",
    minutes: "约 10 分钟",
    lead: "在真正注册工具之前，先理解扩展是怎么进入会话的。Pi 支持自动发现、外部路径和内联工厂三种来源。",
    blocks: [
      {
        heading: "默认会到哪里找？",
        paragraphs: [
          "默认 ResourceLoader 会从用户级 <code>~/.pi/agent/extensions/</code>、项目级 <code>&lt;cwd&gt;/.pi/extensions/</code>，以及 settings.json 的 <code>\"extensions\"</code> 数组发现文件。每个扩展文件是 TypeScript 文件，导出默认函数 <code>export default function (pi: ExtensionAPI) { ... }</code>。",
          "扩展不仅能拦截 <code>agent_start</code>、<code>tool_call</code>、<code>agent_end</code> 等事件，还能注册自定义工具与交互命令；能力注册的细节在 Extension 一章展开。",
        ],
      },
      {
        heading: "additionalExtensionPaths 与 extensionFactories",
        bullets: [
          "<code>additionalExtensionPaths</code>：加载外部 TypeScript 文件。它适合可被分享、独立维护的扩展。",
          "<code>extensionFactories</code>：直接传入函数，不落盘；适合 SDK 宿主内置的小型行为。",
          "两者注册出的扩展能力等价，只是来源不同，也可以组合使用；示例同时加载一个文件扩展和一个内联扩展，方便观察它们共享同一个生命周期。",
        ],
      },
      {
        heading: "什么时候扩展真正开始工作？",
        paragraphs: ["<code>loader.reload()</code> 只是完成发现与组装。对需要 session_start 的扩展，调用 <code>session.bindExtensions({})</code> 才会触发生命周期。MCP 连接也是在这个阶段开始。"],
      },
    ],
  },
  {
    id: "agents-context",
    label: "AGENTS.md：项目级上下文",
    source: "04c-context-files.ts",
    minutes: "约 8 分钟",
    lead: "AGENTS.md 是项目对 Agent 说的话：代码风格、工作方式、验证命令以及任何只对当前代码库成立的约束。它应保持短而可执行。",
    blocks: [
      {
        heading: "agentsFilesOverride 是一个变换器",
        paragraphs: ["它接收已经发现的 <code>current.agentsFiles</code>，再返回你希望会话使用的列表。追加虚拟文件时保留原列表；要彻底禁用上下文文件，则返回空数组。"],
      },
      {
        heading: "什么时候该写进 AGENTS.md？",
        bullets: [
          "任何每次修改代码都要遵守的项目约束，例如 TypeScript strict、禁用 any、测试命令与目录边界。",
          "团队特有的术语和不能从代码直接推断的流程。",
          "不要把频繁变化的任务指令写进去；那更适合当前 prompt 或 prompt template。",
        ],
      },
      {
        callout: ["上下文文件不是数据库", "它们会进入模型上下文。把内容限制在对本项目长期有用的操作规则，避免堆积大量生成日志或完整 API 文档。"],
      },
    ],
  },
  {
    id: "prompt-templates",
    label: "Prompt Template：/命令式快捷短语",
    source: "04d-prompt-templates.ts",
    minutes: "约 9 分钟",
    lead: "Prompt Template 解决的是“经常需要模型按一份固定流程工作”。用户输入 /deploy 时，模板内容被注入到对话；模型仍然决定如何调用工具完成任务。",
    blocks: [
      {
        heading: "模板包含什么？",
        paragraphs: ["一个 <code>PromptTemplate</code> 有 name、description、content 和来源信息。通过 <code>promptsOverride</code> 追加到已有模板后，用户能用 <code>/&lt;name&gt;</code> 触发它。"],
      },
      {
        heading: "Prompt Template 和 Command 的分界",
        bullets: [
          "模板：把文本交给模型。模型可以推理、调用工具、追问或偏离流程。",
          "命令：宿主直接执行，例如打开模型选择器或清空 UI；不需要模型参与。",
          "想复用“请检查、构建、总结风险”这类工作说明，用模板；想执行确定性程序动作，用命令。",
        ],
      },
      {
        callout: ["模板要像任务简报", "内容应清楚给出目标、必要步骤和输出要求，但不要伪装成不可违反的安全策略；真正的权限与安全边界应放在工具或 Extension。"],
      },
    ],
  },
  {
    id: "extension",
    label: "Extension：把能力接进运行时",
    source: "05-extension.ts",
    minutes: "约 12 分钟",
    lead: "当你需要记录工具调用、阻止危险操作、注册自定义工具或添加交互命令时，应该使用 Extension，而不是继续把逻辑塞进 system prompt。",
    blocks: [
      {
        heading: "扩展是事件驱动的",
        paragraphs: ["一个扩展是接收 <code>ExtensionAPI</code> 的函数。它可以监听 <code>agent_start</code>、<code>tool_call</code>、<code>agent_end</code> 等生命周期事件。<code>tool_call</code> 回调可以返回阻止结果，因此适合做审计和安全策略。"],
      },
      {
        heading: "注册工具和注册命令的区别",
        paragraphs: ["<code>pi.registerTool()</code> 给模型一个可以在推理中调用的能力，需要 name、description、参数 schema 和 execute。<code>pi.registerCommand()</code> 则给交互宿主添加命令；它由用户触发，直接操作 UI 或程序状态。"],
        bullets: [
          "外部文件：放在默认发现目录，或用 <code>additionalExtensionPaths</code> 添加。",
          "内联函数：通过 <code>extensionFactories</code> 传给 ResourceLoader，适合 SDK 宿主的内置能力。",
          "两者都需要由 ResourceLoader 加载；创建完会话后，按需调用 <code>session.bindExtensions({})</code> 触发生命周期。",
        ],
      },
      {
        callout: ["工具描述也是接口", "写清楚工具的边界、参数含义和返回内容。模型能否稳定地调用一个工具，很大程度取决于这段 description。"],
      },
    ],
  },
  {
    id: "mcp",
    label: "Codemode、Tool Search 与 MCP",
    source: "06-codemode-and-mcp.ts",
    minutes: "约 10 分钟",
    lead: "当工具越来越多时，把所有 schema 都塞进上下文会变得笨重。Pi 的 Codemode、Tool Search 和 MCP 扩展就是为“按需获得能力”准备的。",
    blocks: [
      {
        heading: "三个内置扩展分别解决什么？",
        bullets: [
          "<strong>Codemode</strong>：让 Agent 通过编写和执行代码完成更复杂的操作。",
          "<strong>Tool Search</strong>：工具很多时先搜索再调用，避免工具定义挤满上下文。",
          "<strong>MCP</strong>：连接外部服务器提供的工具与资源。",
        ],
      },
      {
        heading: "默认非激活，以及两种激活方式",
        paragraphs: [
          "codemode 与 tool_search 注册时是未激活（inactive）的，需要满足以下任一条件才启用：一是通过 <code>defaultTools</code> 显式启用；二是由 MCP 扩展自动激活——MCP 服务器配置为 <code>codemode</code> 暴露方式会激活 codemode，配置为 <code>deferred</code> 暴露方式会激活 tool_search。",
          "示例用 <code>defaultTools: [\"+codemode\", \"+tool_search\"]</code> 追加启用；<code>+</code> 表示在默认工具集上增加，而不是替换（无 <code>+</code> 会覆盖原有默认工具）。",
          "激活后 <code>getActiveToolNames()</code> 会显示：<code>read, bash, edit, write, codemode, tool_search</code>——说明它们也是内置工具，只是默认没有启用。",
          "<code>session.bindExtensions({})</code> 会触发 session_start，MCP 服务器随后在后台开始连接。",
        ],
      },
      {
        heading: "为什么不要在这里使用 tools 白名单？",
        paragraphs: ["<code>tools</code> 会把会话限制为指定名称的工具。当 MCP 在运行时暴露新的工具时，这个白名单可能把它们挡在外面。配置 Codemode、Tool Search 与 MCP 时，使用 <code>defaultTools</code> 通常更符合“动态扩展”的目标。"],
      },
    ],
  },
  {
    id: "settings",
    label: "SettingsManager：有效配置与写盘边界",
    source: "11-settings.ts",
    minutes: "约 10 分钟",
    lead: "SettingsManager 管的不是一条会话历史，而是会话启动时应采用的策略：全局与项目配置如何合并、哪些值只临时覆盖、什么时候真的写入磁盘。",
    blocks: [
      {
        heading: "读取、覆盖、创建会话",
        paragraphs: ["<code>SettingsManager.create(cwd)</code> 合并全局和项目设置。<code>applyOverrides()</code> 立即改变内存中的有效配置，适合本次宿主运行的 compaction、retry 等策略；将它传给 createAgentSession 即可让新会话采用这些设置。"],
      },
      {
        heading: "flush 与 drainErrors",
        paragraphs: ["调用 setter 后，设置会排队持久化。需要可靠写入边界时调用 <code>flush()</code>；应用层再用 <code>drainErrors()</code> 取走并展示 I/O 错误。示例默认不写盘，只有显式设置 <code>WRITE_SETTINGS=1</code> 才执行这一步。"],
      },
      {
        heading: "测试不该碰用户设置",
        paragraphs: ["<code>SettingsManager.inMemory()</code> 完全绕过文件 I/O。它适合单元测试、教学示例和短命任务：你能验证 AgentSession 的设置效果，却不会污染用户目录。"],
      },
    ],
  },
  {
    id: "session-manager",
    label: "SessionManager：四种历史模式",
    source: "12-session-manager.ts",
    minutes: "约 12 分钟",
    lead: "SessionManager 决定一段对话是否可恢复、保存到哪里、以及如何从历史中精确打开一条记录。它是“会话事实”的存储策略。",
    blocks: [
      {
        heading: "四种常见模式",
        bullets: [
          "<code>inMemory()</code>：不落盘，适合测试和一次性后台任务。",
          "<code>create(cwd)</code>：创建新的持久化会话，并在 sessionFile 中暴露其路径。",
          "<code>continueRecent(cwd)</code>：恢复最近会话；原模型不可用时检查 modelFallbackMessage。",
          "<code>list(cwd)</code> + <code>open(path)</code>：先列出会话元数据（含 <code>id</code>、<code>firstMessage</code>、<code>path</code>），再按精确路径恢复。",
        ],
      },
      {
        heading: "自定义会话目录",
        paragraphs: ["所有主要操作都可接收第二个 customDir。此时不再按 cwd 编码路径，因此可以将多个项目的会话集中归档；这适合做会话浏览器或跨项目的宿主应用。"],
      },
      {
        callout: ["先选语义，再选目录", "“是否要恢复历史”是产品决定；customDir 只是实现这个决定时的存储位置。不要为了方便调试而意外把一次性会话持久化。"],
      },
    ],
  },
  {
    id: "runtime",
    label: "Runtime：会话可替换的宿主",
    source: "08-session-runtime.ts",
    minutes: "约 15 分钟",
    lead: "如果你的产品支持新建、切换、恢复、分叉或导入会话，直接保存一个 session 变量迟早会出错。此时应该交给 AgentSessionRuntime 管理替换。",
    blocks: [
      {
        heading: "先建立对象模型",
        diagram: "AgentSessionRuntime（长期存在的控制器）\n├─ session       当前会话；会被替换\n├─ services      当前 cwd 的模型、设置、资源\n└─ createRuntime 创建下一套 services + session 的工厂\n\nAgentSession（一次具体对话）\n├─ Agent / 模型调用状态\n├─ extensionRunner / 扩展上下文\n├─ 事件订阅者\n└─ sessionManager\n\nSessionManager（会话事实的存储）\n├─ 会话树、消息条目\n├─ 当前工作目录 cwd\n└─ JSONL 会话文件及持久化逻辑",
      },
      {
        heading: "替换发生时，Runtime 做了什么？",
        paragraphs: ["调用 <code>newSession()</code>、<code>switchSession()</code>、<code>fork()</code> 或导入后，Runtime 会结束旧运行、关闭扩展生命周期、按目标 cwd 创建新的服务与 SessionManager，最后将 <code>runtime.session</code> 指向新会话。"],
      },
      {
        heading: "唯一必须记住的规则",
        paragraphs: ["<strong>每次 session 替换后，重新绑定所有 session-local 资源。</strong> 事件订阅、扩展绑定以及 UI 里缓存的 session 引用都属于旧会话。把绑定逻辑放进一个 <code>bindCurrentSession()</code> 函数，每次切换后重新调用。"],
      },
      {
        heading: "createRuntime：可重复执行的组装工厂",
        paragraphs: ["Runtime 在启动、new、switch、fork、import 时调用同一个工厂。工厂的参数由 Runtime 传入：<code>cwd</code>（新会话关联的工作目录）、<code>sessionManager</code>（历史管理策略）、<code>sessionStartEvent</code>（本次创建的原因，如 new / resume / fork）。工厂先创建服务，再用服务创建 AgentSession，最后返回 <code>{ session, services, diagnostics }</code>。这就是为什么切换后不会错误复用旧项目环境。"],
      },
      {
        heading: "为什么 services 和 session 分两步创建？",
        paragraphs: ["<code>AgentSessionServices</code> 属于项目环境：cwd、agentDir、ModelRuntime、SettingsManager、ResourceLoader 与诊断信息。<code>AgentSession</code> 才把这些环境设施和特定的历史管理器、模型、工具、启动事件结合为一次对话。环境可以随着 cwd 更换，会话也可以在同一环境内再次创建。"],
      },
      {
        heading: "会话 JSONL 的开头长什么样？",
        paragraphs: ["切换或恢复会话时，先读取 JSONL 文件前几行的会话信息；header 里的 cwd 决定要重建哪套项目环境。"],
        diagram: "{\n  \"type\": \"session\",\n  \"version\": \"...\",\n  \"id\": \"...\",\n  \"timestamp\": \"...\",\n  \"cwd\": \"C:\\\\Users\\\\orange\\\\Desktop\\\\study\\\\pi\\\\my-test\",\n  \"parentSession\": \"...\"\n}",
      },
      {
        heading: "从 JSONL 恢复时到底发生了什么？",
        diagram: "JSONL header.cwd\n  ↓\nSessionManager.open(sessionPath)\n  ↓\nRuntime 销毁旧 session\n  ↓\ncreateRuntime({ cwd: header.cwd, ... })\n  ↓\ncreateAgentSessionServices({ cwd })\n  ↓\n重新读取该项目的设置、资源、扩展与认证\n  ↓\nruntime.session 指向新的 AgentSession",
      },
      {
        callout: ["JSONL 保存事实，环境在外部重建", "JSONL 保存历史、会话树、session id 和原 cwd 等“会话事实”；项目目录保存代码、Git 状态和项目级资源；agentDir 保存认证、模型配置和用户级扩展。Runtime 恢复时通过 header 里的 cwd 重新搭建项目环境。"],
      },
    ],
  },
  {
    id: "full-control",
    label: "官方示例：Full Control",
    source: "13-full-control.ts",
    minutes: "约 12 分钟",
    lead: "最后一章回到官方示例：当你不想让 SDK 自动发现任何东西时，手写 ResourceLoader、显式传入模型、设置与工具，把一次会话的每个输入都握在自己手里。",
    blocks: [
      {
        heading: "什么时候需要 Full Control？",
        paragraphs: [
          "默认装配适合大多数应用：<code>DefaultResourceLoader</code> 发现项目资源，<code>ModelRuntime</code> 读取本机认证，<code>SettingsManager</code> 合并全局与项目设置。",
          "Full Control 则相反。官方示例 <code>12-full-control.ts</code> 的注释是 “Replace everything - no discovery, explicit configuration”：替换一切，不做发现，全部显式配置。它适合嵌入到受控产品、测试环境或需要严格复现的宿主程序。",
        ],
        diagram: "默认装配\ncreateAgentSession()\n├─ DefaultResourceLoader 自动发现资源\n├─ ModelRuntime 读取 agentDir 认证\n└─ SettingsManager 合并全局 + 项目\n\nFull Control\ncreateAgentSession({ ...全部显式传入 })\n├─ 手写 ResourceLoader（空发现 + 自有提示词）\n├─ 自定义 ModelRuntime（指定认证与模型文件）\n├─ SettingsManager.inMemory()\n└─ 工具白名单 + 内存会话",
      },
      {
        heading: "手写一个 ResourceLoader",
        paragraphs: [
          "不再 <code>new DefaultResourceLoader()</code>，而是直接实现 <code>ResourceLoader</code> 接口：<code>getExtensions</code> / <code>getSkills</code> / <code>getPrompts</code> / <code>getThemes</code> / <code>getAgentsFiles</code> 全部返回空，<code>getSystemPrompt()</code> 返回自己写的提示词，<code>reload()</code> 是空操作。",
          "这意味着没有任何项目资源、AGENTS.md 或扩展会进入会话——你返回什么，会话就只拥有什么。",
        ],
      },
      {
        heading: "显式装配的六个输入",
        bullets: [
          "<code>model</code>：用 <code>getModel(\"anthropic\", \"claude-sonnet-4-5\")</code> 从内置目录精确取模型。",
          "<code>modelRuntime</code>：自定义 <code>authPath</code> / <code>modelsPath</code>，并用 <code>setRuntimeApiKey()</code> 注入临时 Key。",
          "<code>settingsManager</code>：<code>SettingsManager.inMemory()</code>，不读也不写磁盘 settings.json。",
          "<code>resourceLoader</code>：上面手写的实现，发现结果全部为空。",
          "<code>tools</code>：白名单只留 <code>read</code> 与 <code>bash</code>，工具能力最小化。",
          "<code>sessionManager</code>：<code>SessionManager.inMemory(cwd)</code>，运行结束不留会话文件。",
        ],
      },
      {
        heading: "本项目的对照实现",
        paragraphs: [
          "本章源码 <code>13-full-control.ts</code> 按同样的结构重写了官方示例，并补上中文注释。运行它的方式与其他章一致：<code>npm run example -- src/13-full-control.ts</code>。",
          "官方原文见 <a href=\"https://github.com/earendil-works/pi/blob/main/packages/coding-agent/examples/sdk/12-full-control.ts\">12-full-control.ts</a>。",
        ],
      },
      {
        callout: ["边界越大，责任越大", "Full Control 不会替你发现项目规则、Skills 或扩展，也不会合并用户设置。选择它之前，先确认你确实要自己承担这些装配责任。"],
      },
    ],
  },
];

const nav = document.querySelector("#chapter-nav");
const article = document.querySelector("#article");
const sourceCode = document.querySelector("#source-code code");
const sourceName = document.querySelector("#source-name");
const sourceLink = document.querySelector("#source-link");
const progress = document.querySelector("#reading-progress");
const previous = document.querySelector("#previous");
const next = document.querySelector("#next");

const escapeHtml = (value) => value.replace(/[&<>"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;",
}[character]));

function renderBlocks(blocks) {
  return blocks.map((block) => {
    if (block.callout) {
      return `<aside class="callout"><b>${block.callout[0]}</b><p>${block.callout[1]}</p></aside>`;
    }
    const paragraphs = (block.paragraphs ?? []).map((paragraph) => `<p>${paragraph}</p>`).join("");
    const bullets = block.bullets
      ? `<ul>${block.bullets.map((bullet) => `<li>${bullet}</li>`).join("")}</ul>`
      : "";
    const table = block.table
      ? `<div class="table-wrap"><table><thead><tr>${block.table.head
          .map((cell) => `<th>${cell}</th>`)
          .join("")}</tr></thead><tbody>${block.table.rows
          .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
          .join("")}</tbody></table></div>`
      : "";
    const diagram = block.diagram ? `<pre class="diagram">${block.diagram}</pre>` : "";
    return `<section class="lesson"><h3>${block.heading}</h3>${paragraphs}${bullets}${table}${diagram}</section>`;
  }).join("");
}

function renderNav(active) {
  nav.innerHTML = chapters.map((chapter, index) => `
    <button class="${index === active ? "active" : ""}" data-index="${index}" type="button">
      <span class="number">${String(index + 1).padStart(2, "0")}</span>
      <span>${chapter.label}</span>
    </button>
  `).join("");
  nav.querySelectorAll("button").forEach((button) => {
    button.addEventListener("click", () => selectChapter(Number(button.dataset.index), true));
  });
}

async function renderSource(chapter) {
  const path = chapter.sourcePath ?? `../src/${chapter.source}`;
  sourceName.textContent = chapter.source;
  sourceLink.href = path;
  sourceCode.textContent = "加载源码中…";
  try {
    const response = await fetch(path, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    sourceCode.innerHTML = text.split("\n").map((line) => `<span>${escapeHtml(line)}</span>`).join("");
  } catch (error) {
    sourceCode.textContent = `源码加载失败：${error.message}`;
  }
}

function selectChapter(index, scrollToArticle = false) {
  const chapter = chapters[index];
  if (!chapter) return;
  location.hash = chapter.id;
  document.title = `${chapter.label} · Pi SDK from Scratch`;
  article.innerHTML = `
    <p class="chapter-kicker">CHAPTER ${String(index + 1).padStart(2, "0")} · ${chapter.minutes}</p>
    <h2>${chapter.label}</h2>
    <p class="lead">${chapter.lead}</p>
    ${renderBlocks(chapter.blocks)}
  `;
  progress.textContent = `${String(index + 1).padStart(2, "0")} / ${String(chapters.length).padStart(2, "0")}`;
  previous.disabled = index === 0;
  next.disabled = index === chapters.length - 1;
  previous.onclick = () => selectChapter(index - 1, true);
  next.onclick = () => selectChapter(index + 1, true);
  renderNav(index);
  renderSource(chapter);
  if (scrollToArticle) article.scrollIntoView({ behavior: "smooth", block: "start" });
}

function selectFromHash() {
  const id = location.hash.slice(1);
  const index = Math.max(0, chapters.findIndex((chapter) => chapter.id === id));
  selectChapter(index);
}

window.addEventListener("hashchange", selectFromHash);
selectFromHash();
