# Sync Clipboard Tauri

## 项目简介

本项目是一个使用 Tauri 和 Vue 构建的安卓客户端应用，作为 [Jeric-X/SyncClipboard](https://github.com/Jeric-X/SyncClipboard) 项目的配套应用，实现跨设备的剪贴板内容同步功能。

## 系统需求

本项目对 [Android System Webview](https://play.google.com/store/apps/details?id=com.google.android.webview&hl=zh&pli=1) 版本需求较高（需要至少 120 以上版本）。如果打开应用发现屏幕一片白，什么信息都没有，请通过应用商店更新 [webview](https://play.google.com/store/apps/details?id=com.google.android.webview&hl=zh&pli=1) 版本。

> [!NOTE]
> 小米系统可能无法直接更新 webview。需要先在开发者选项中临时关闭系统优化（原 MIUI 优化），安装 webview 更新后再打开系统优化即可。

## 功能特性

- **剪贴板上传**: 将剪贴板内容上传到 SyncClipboard 服务器
- **剪贴板下载**: 从 SyncClipboard 服务器下载文本并写入到剪贴板
- **文件同步**: 支持单个文件的上传和下载
- **文件组下载**: 支持 group 类型的下载（但是不支持 group 的上传，这个需求很难实现也很小众）
- **即用即走**: 上传/下载剪贴板以后，将自动退出 app（可在设置里配置延迟时间）

## 使用步骤

1. 下载最新版本的 [sync-clipboard-tauri](https://github.com/bling-yshs/sync-clipboard-tauri/releases/latest) 并安装
2. 打开 app，填写 SyncClipboard 服务器信息（支持 webdav 服务器）

    <img height="500" src="https://raw.githubusercontent.com/bling-yshs/ys-image-host/main/img/PixPin_2025-10-05_13-35-50.jpg" alt="pic"/>

3. 打开控制中心，添加磁贴「剪贴板上传」与「剪贴板下载」

    <img height="500" src="https://raw.githubusercontent.com/bling-yshs/ys-image-host/main/img/PixPin_2025-10-05_13-41-13.jpg"  alt="pic"/>

4. 点击磁贴开始使用

    <img height="500" src="https://raw.githubusercontent.com/bling-yshs/ys-image-host/main/img/Screenshot_20251005_133057.jpg"  alt="pic"/>

## 项目结构

```
sync-clipboard-tauri/
├── src/                    # Vue 前端源码
│   ├── components/         # UI 组件
│   ├── entities/           # 数据实体定义
│   ├── router/             # 路由配置
│   ├── services/           # 业务服务
│   ├── utils/              # 工具函数
│   └── views/              # 页面视图
├── src-tauri/              # Tauri 后端源码
├── plugins-workspace/      # Tauri 插件工作区（我修改了 tauri clipboard 插件的源码，所以需要把它包含在仓库里）
└── tauri-plugin-quicktile/ # 自定义快速磁贴插件（其实也包含别的功能，但是懒得改名了）
```

## 许可证

本项目采用 [MIT](LICENSE) 开源许可证。
