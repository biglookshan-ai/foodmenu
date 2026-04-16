# 🥗 健康菜谱应用 (FoodMenu)

一个帮助你管理健康饮食的全栈应用。

## 功能模块

### 1. 菜谱库
- 通过网页链接导入菜谱
- 支持图片/视频 AI 识别菜谱
- 完整的菜谱信息：主图、步骤、用量、营养成分

### 2. 执行中心
- 一日三餐计划
- 从菜谱库快速添加
- 打钩完成记录
- 周视图 + 历史回顾

### 3. 数据报告
- 每日热量/营养摄入追踪
- 周报/月报可视化
- 营养趋势分析

## 技术栈

- **前端**: React + TypeScript + TailwindCSS + Vite
- **后端**: Python FastAPI + SQLAlchemy
- **数据库**: SQLite (开发) / PostgreSQL (生产)
- **AI**: MiniMax Token Plan API

## 快速开始

### 前置要求
- Node.js 20+
- Python 3.11+
- MiniMax API Key

### 安装

```bash
# 克隆仓库
git clone https://github.com/biglookshan-ai/foodmenu.git
cd foodmenu

# 启动后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload

# 启动前端 (新终端)
cd frontend
npm install
npm run dev
```

## 部署

项目配置了 GitHub Actions，支持自动部署到：
- **前端**: Vercel
- **后端**: Railway

需要在 GitHub Secrets 中配置：
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`
- `RAILWAY_API_TOKEN`
- `MINIMAX_API_KEY`

## 开发

### 项目结构
```
foodmenu/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI 入口
│   │   ├── models/          # 数据模型
│   │   ├── routers/         # API 路由
│   │   └── services/        # 业务逻辑
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React 组件
│   │   ├── pages/           # 页面
│   │   └── App.tsx          # 应用入口
│   └── package.json
├── .github/workflows/      # CI/CD 配置
└── docker-compose.yml
```

## License

MIT
