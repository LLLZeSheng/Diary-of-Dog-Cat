# Love Site (H5)

这是一个可长期维护的 H5 图文纪念站模板。内容都在 `assets/content.json` 中，你只需要替换文字与媒体即可。

## 目录结构

- `index.html` 页面主体
- `assets/styles.css` 视觉样式
- `assets/app.js` 数据渲染逻辑
- `assets/content.json` 文字与媒体配置
- `assets/media/` 图片与视频文件

## 编辑内容

1. 打开 `assets/content.json`，按项目替换文字。
2. 把图片/视频放到 `assets/media/`，并在 JSON 中填写对应路径。
3. 若要添加新年份，在 `timeline.items` 里继续增加对象。

### 图片建议

- 建议比例：3:4 或 9:16
- 建议宽度：1200 ~ 1600px
- 单张大小：200 ~ 500KB

### 视频建议

- 建议格式：MP4 (H.264)
- 单段时长：30 ~ 120 秒
- 可设置 `poster` 作为封面图

## 本地预览

在项目根目录运行一个简单静态服务器（任选其一）：

```bash
python -m http.server 8000
```

或

```bash
npx serve .
```

然后打开 `http://localhost:8000/love-site/`。

## 部署说明（概览）

此项目为纯静态站点，可部署在任意静态托管平台：

1. 将 `love-site/` 整体上传
2. 绑定你的域名并开启 HTTPS
3. 更新时只需替换 `content.json` 和媒体文件

如需接入可视化后台或更复杂的长期维护方案，可继续扩展。
