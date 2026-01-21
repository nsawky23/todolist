# 待办清单 (Todo List)

一个现代化的 macOS 桌面待办事项管理应用，使用 Electron + Vue 3 + TypeScript 构建。

![App Screenshot](./screenshots/app.png)

## ✨ 功能特点

- 📝 **待办事项管理** - 创建、编辑、删除待办事项
- ✅ **一键完成** - 点击勾选框即可标记完成
- 📊 **已完成查看** - 查看所有已完成事项及时间记录
- 🏷️ **分组管理** - 自定义分组并选择颜色
- 🔍 **搜索功能** - 快速搜索待办事项
- 🎨 **现代 UI** - 精美的暗色主题界面
- 💾 **本地存储** - 使用 SQLite 数据库持久化存储

## 🛠️ 技术栈

- **Electron** - 跨平台桌面应用框架
- **Vue 3** - 渐进式 JavaScript 框架
- **TypeScript** - 类型安全的 JavaScript
- **Vite** - 下一代前端构建工具
- **SQLite (better-sqlite3)** - 本地数据库
- **CSS Variables** - 主题化样式系统

## 🚀 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建应用

```bash
npm run build
```

构建后的安装包将在 `release/` 目录中生成。

## 📁 项目结构

```
todolist/
├── electron/           # Electron 主进程代码
│   ├── main/          # 主进程入口和数据库
│   └── preload/       # 预加载脚本
├── src/               # Vue 渲染进程代码
│   ├── components/    # Vue 组件
│   ├── types.ts       # TypeScript 类型定义
│   ├── style.css      # 全局样式
│   ├── App.vue        # 主应用组件
│   └── main.ts        # 渲染进程入口
├── public/            # 静态资源
└── index.html         # HTML 入口
```

## 📝 使用说明

1. **创建待办** - 点击右上角「新建待办」按钮
2. **完成待办** - 点击待办事项前的复选框
3. **编辑待办** - 将鼠标悬停在待办事项上，点击编辑图标
4. **删除待办** - 将鼠标悬停在待办事项上，点击删除图标
5. **管理分组** - 在侧边栏点击「+」按钮创建新分组
6. **查看已完成** - 在侧边栏点击「已完成」查看历史记录

## 📄 License

MIT
