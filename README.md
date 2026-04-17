# FoodMenu - 健康菜谱应用

**技术栈：** React + Vercel (前端) | Flask + Vercel Serverless (后端) | Supabase (数据库)

## 项目状态

- 前端部署：https://foodmenu-teal.vercel.app
- 数据库：Supabase (PostgreSQL)

## 开发

```bash
cd frontend
npm install
npm run dev
```

## API 端点

- `/api/recipes/` - 菜谱 CRUD
- `/api/mealplans/` - 膳食计划
- `/api/nutrition/` - 营养数据

## 环境变量

前端 (Vercel):
- `VITE_API_URL` - API 地址（留空则使用相对路径）

后端 (Vercel Serverless):
- `SUPABASE_URL` - Supabase 项目地址
- `SUPABASE_SERVICE_KEY` - Supabase service_role key

## 架构

```
Vercel (前端 + API Functions)
       ↓
Supabase (PostgreSQL)
```

## 功能

- 菜谱导入（下厨房、美食天下）
- AI 营养识别
- 膳食计划管理
- 营养数据追踪
