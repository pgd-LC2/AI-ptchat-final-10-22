# Orbital Chat

一个连接世界顶尖AI大模型的统一聊天平台，支持 GPT、Claude、Gemini、DeepSeek 等多种模型。

## 功能特性

- 🤖 **多模型支持**: 一个界面访问多个 AI 提供商的模型
- 🌊 **实时流式响应**: 流畅的打字机效果聊天体验
- 💾 **会话历史管理**: 自动保存和管理聊天记录
- 🎨 **未来感UI设计**: 霓虹主题的极简设计
- 🔒 **安全的API调用**: 通过 Supabase Edge Functions 保护 API 密钥

## 技术栈

- **前端**: React + TypeScript + Tailwind CSS
- **后端**: Supabase Edge Functions (Deno)
- **状态管理**: Zustand
- **AI API**: OpenRouter (统一多模型接口)
- **动画**: Framer Motion

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd orbital-chat
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

1. 复制环境变量模板：
```bash
cp .env.example .env
```

2. 配置 Supabase：
   - 在 [Supabase](https://supabase.com) 创建新项目
   - 获取项目 URL 和匿名密钥
   - 更新 `.env` 文件中的 `VITE_SUPABASE_URL` 和 `VITE_SUPABASE_ANON_KEY`

3. 配置 OpenRouter API：
   - 在 [OpenRouter](https://openrouter.ai) 注册并获取 API 密钥
   - 在 Supabase 项目的 Edge Functions 环境变量中设置 `OPENROUTER_API_KEY`

### 4. 部署 Edge Functions

Edge Functions 会自动部署到 Supabase。确保你的 API 密钥已在 Supabase 项目设置中配置。

### 5. 启动开发服务器

```bash
npm run dev
```

## Edge Functions 说明

项目包含两个 Supabase Edge Functions：

### `openrouter-chat`
处理普通的聊天完成请求，适用于一次性对话。

### `openrouter-stream`  
处理流式聊天完成请求，提供实时打字机效果。

### 环境变量

Edge Functions 需要以下环境变量：
- `OPENROUTER_API_KEY`: 你的 OpenRouter API 密钥

## 支持的模型

通过 OpenRouter 支持的模型包括：
- **OpenAI**: GPT-4, GPT-3.5-turbo
- **Anthropic**: Claude 3.5 Sonnet, Claude 3 Haiku
- **Google**: Gemini 1.5 Pro, Gemini 1.5 Flash
- **DeepSeek**: DeepSeek Chat, DeepSeek Coder
- 以及更多...

## 项目结构

```
src/
├── components/          # React 组件
│   ├── chat/           # 聊天相关组件
│   ├── sidebar/        # 侧边栏组件  
│   ├── topbar/         # 顶部栏组件
│   └── ui/             # 通用UI组件
├── lib/                # 核心逻辑
│   ├── store.ts        # Zustand 状态管理
│   ├── api.ts          # API 调用
│   └── openrouter-api.ts # OpenRouter 集成
├── types/              # TypeScript 类型定义
└── ...

supabase/
└── functions/          # Edge Functions
    ├── openrouter-chat/    # 普通聊天处理
    └── openrouter-stream/  # 流式聊天处理
```

## 构建和部署

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License