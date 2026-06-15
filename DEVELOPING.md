# Developing

## 开发环境

- 操作系统：Linux / Windows / MacOS
- 编辑器：VSCode
- 必要工具:
    - Node.js (推荐版本 16 及以上)
    - npm (Node.js 自带)

## 编译与测试

1. 克隆代码库到本地:

   ```bash
   git clone https://github.com/MorningFrog/urdf-visualizer.git
   ```

2. 进入项目目录:

   ```bash
   cd urdf-visualizer
   ```

3. 安装依赖:

   ```bash
   npm install
   npm --prefix webview install
   ```

4. 编译扩展:

   ```bash
   npm run compile
   ```

5. 测试扩展：在 VSCode 中按 `F5` 启动扩展开发主机进行测试。如果更新了代码，可以通过在测试主机中按 `Ctrl+R` (或 `Cmd+R` 在 MacOS 上) 来重新加载扩展。

## 提交与发布规范

从 `5.2.0` 版本开始，提交信息使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范，例如:

```text
feat: add inertia visualization
fix: preserve inline code in release notes
docs: update developing guide
```

从 `5.2.0` 版本开始，Git tag 使用带 `v` 前缀的版本号，例如 `v5.2.0`，而不是以前的 `5.2.0`。

## 本地安装 (Local Installation)

### 方法一：命令行安装

1. 编译并打包扩展:

   ```bash
   npm run package:local
   ```

   这会在项目根目录生成 `urdf-visualizer-local.vsix` 文件。

2. 安装到 VSCode:

   ```bash
   npm run install:local
   ```

   或手动安装:

   ```bash
   code --install-extension urdf-visualizer-local.vsix --force
   ```

> **注意**: 使用 `code` 命令需要先在 VSCode 中安装命令行工具:
> - 打开 VSCode
> - 按 `Cmd+Shift+P` (macOS) 或 `Ctrl+Shift+P` (Windows/Linux)
> - 输入 `Shell Command: Install 'code' command in PATH`

### 方法二：从 VSCode 界面安装

1. 编译并打包扩展:

   ```bash
   npm run package:local
   ```

2. 在 VSCode 中:
   - 打开扩展面板 (`Cmd+Shift+X` / `Ctrl+Shift+X`)
   - 点击右上角的 `...` 菜单
   - 选择 `Install from VSIX...`
   - 选择生成的 `urdf-visualizer-local.vsix` 文件

### 方法三：开发模式运行

在 VSCode 中按 `F5` 启动扩展开发主机 (Extension Development Host)，
即可在调试模式下运行扩展。修改代码后在开发主机中按 `Cmd+R` (macOS) 或 `Ctrl+R` (Windows/Linux) 重新加载。
