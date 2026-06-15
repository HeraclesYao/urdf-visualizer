<div align="center"> 
<img src="./media/images/URDF-Visualizer-banner.jpg" alt="icon"/>

<h1>Urdf Visualizer</h1>

English / [简体中文](./README_zh-CN.md)

A VSCode extension for visualizing URDF files and xacro files.

用于可视化 URDF 和 xacro 文件的 VSCode 扩展.

![License](https://img.shields.io/github/license/MorningFrog/urdf-visualizer?color=blue)
[![Version](https://vsmarketplacebadges.dev/version/MorningFrog.urdf-visualizer.svg?color=blue)](https://marketplace.visualstudio.com/items?itemName=MorningFrog.urdf-visualizer)
[![Installs](https://vsmarketplacebadges.dev/installs/MorningFrog.urdf-visualizer.svg?color=blue)](https://marketplace.visualstudio.com/items?itemName=MorningFrog.urdf-visualizer)
[![Downloads](https://vsmarketplacebadges.dev/downloads/MorningFrog.urdf-visualizer.svg?color=blue)](https://marketplace.visualstudio.com/items?itemName=MorningFrog.urdf-visualizer)
[![Rating](https://vsmarketplacebadges.dev/rating/MorningFrog.urdf-visualizer.svg?color=blue)](https://marketplace.visualstudio.com/items?itemName=MorningFrog.urdf-visualizer)
![Stars](https://img.shields.io/github/stars/MorningFrog/urdf-visualizer?style=social)
</div>

## Features

![demonstration](media/images/demonstration.gif)

- Preview and inspection: visualize URDF and Xacro files, switch visual/collision/inertia display, toggle each link, and inspect joint/link names and frames.
- Xacro compatibility: improved ROS 2-friendly xacro parsing, including scoped/lazy properties, top-level property evaluation, and `xacro.load_yaml()` support for workspace files.
- Interaction: drag joints directly in the viewer, keep the camera view between files, optionally restore joint values, and lock a xacro preview while editing included child files.
- Measurement: measure coordinates, distance, angle, and area, with configurable defaults.
- Interface and localization: new UI with dedicated Control, Links, Joints, and Settings panels, tree/flat Link views, plus English and Simplified Chinese support.
  > If you need more language support, you can raise it in the issue of the repository

## URDF Controller Features

This fork extends the base URDF Visualizer with trajectory animation capabilities:

### CSV Trajectory Animation
- Load a CSV file defining joint angle trajectories for each URDF joint
- Play animation at configurable frame rate (supports the CSV's native FPS, typically 30Hz)
- Playback controls: Play/Pause, Stop, Step Forward/Backward, Seek via progress slider
- Playback speed adjustment: 0.5x, 1x, 2x
- Loop playback support
- Linear interpolation between frames for smooth motion
- Joint limit clamping respected during playback
- CSV format: `timestamp,joint1,joint2,...` with timestamp in seconds and joint values in radians

### LeRobot V3.0 Dataset Support
- Load LeRobot V3.0 format datasets directly (supports both `action` and `observation.state` data sources)
- Automatic parquet file reading via bundled Python helper (requires Python 3 with `pyarrow`)
- Interactive joint mapping configuration UI:
  - Select data source (action or observation.state)
  - Map dataset dimension indices to URDF joint names
  - Optional per-joint offset and scale transforms
- Mapping saved to `lerobot_mapping.json` alongside the dataset for reuse
- Plays at the dataset's native FPS (typically 30Hz)

### Local Installation
- `npm run package:local` — Build and package the extension into a `.vsix` file
- `npm run install:local` — Install the `.vsix` into VSCode locally (requires `code` CLI)
- See [DEVELOPING.md](./DEVELOPING.md) for detailed local installation instructions

### Usage
1. Open a URDF file and click the 👁 preview button
2. In the animation control bar at the top:
   - **Load CSV**: Select a CSV trajectory file
   - **Load LeRobot**: Select a LeRobot dataset directory (contains `meta/` and `data/`)
3. For LeRobot datasets without a mapping file, a configuration dialog appears to set up joint mapping
4. Use the playback controls to animate the robot

## Extension Settings

This extension contributes the following settings, grouped by purpose:

### Package Resolution

- `urdf-visualizer.packages`
  
  Maps ROS/ROS2 package names to local folders so `package://<package_name>` paths in URDF/Xacro files can be resolved. It is recommended to set this in your workspace `.vscode/settings.json`, where **the key is the package name** and **the value is its path**. Example:

  ```json
  // settings.json
  {
    // other settings
    "urdf-visualizer.packages": {
        "fake_robot": "src/fake_robot"
    },
    // other settings
  }
  ```
  Equivalent to:
  ```json
  {
    // other settings
    "urdf-visualizer.packages": {
        "fake_robot": "${workspaceFolder}/src/fake_robot"
    },
    // other settings
  }
  ```

  Supported special path variables:
  - `${workspaceFolder}` represents the absolute path of the workspace
  - `${workspaceFolder:<workspace_name>}` represents the path of a specific workspace in a multi-root workspace.
  - `${env:<environment_variables>}` represents the value of the environment variable `<environment_variables>`
  
  > In URDF Visualizer ≥4.4.0, you can directly use relative paths to represent paths relative to the workspace, without needing the `${workspaceFolder}/` prefix.

### Reload and Caching

- `urdf-visualizer.renderOnSave`: Re-render when the current file is saved.

- `urdf-visualizer.reRenderWhenSwitchFile`: Re-render when switching between active files.

- `urdf-visualizer.cacheCameraView`: Remember and restore the camera view for each file.

- `urdf-visualizer.cacheJointValues`: Remember and restore joint values for each file.

- `urdf-visualizer.cacheMesh`: Cache mesh resources to speed up repeated loads.

### Default Preview State

All `urdf-visualizer.default.*` settings define the initial state of a newly opened preview. They can still be changed later in the webview UI.

- Geometry and frames: `urdf-visualizer.default.showVisual`, `urdf-visualizer.default.showCollision`, `urdf-visualizer.default.showInertia`, `urdf-visualizer.default.showInertiaWhenHover`, `urdf-visualizer.default.showWorldFrame`, `urdf-visualizer.default.showJointFrames`, `urdf-visualizer.default.jointFrameSize`, `urdf-visualizer.default.showLinkFrames`, `urdf-visualizer.default.linkFrameSize`

- Units and colors: `urdf-visualizer.default.lengthUnit`, `urdf-visualizer.default.angleUnit`, `urdf-visualizer.default.collisionColor`, `urdf-visualizer.default.inertiaColor`

- Measurement defaults: `urdf-visualizer.default.measurement.precision`, `urdf-visualizer.default.measurement.useSciNotation`, `urdf-visualizer.default.measurement.labelSize`, `urdf-visualizer.default.measurement.labelColor`, `urdf-visualizer.default.measurement.lineColor`, `urdf-visualizer.default.measurement.lineThickness`, `urdf-visualizer.default.measurement.pointColor`, `urdf-visualizer.default.measurement.pointSize`, `urdf-visualizer.default.measurement.surfaceColor`

### Appearance and Interaction

- `urdf-visualizer.backgroundColor`: Set the background color of the 3D viewer. It must be a hexadecimal color code starting with `#`.

- `urdf-visualizer.showTips`: Show or hide the operation tips.

- `urdf-visualizer.highlightJointWhenHover`: Highlight the joint frame at the top when hovering.

- `urdf-visualizer.highlightLinkWhenHover`: Highlight the link frame at the top when hovering.

## Instructions

> [!IMPORTANT]
> Open VSCode in a folder that contains all resources required by the URDF/Xacro file. Opening only the single URDF/Xacro file may prevent mesh resources from being found.

There are two ways to start previewing URDF or Xacro files:
- In VSCode, use `Ctrl+Shift+P` to open the Command Panel and enter `URDF Visualizer: Preview URDF/Xacro`.
- Click the <img src="media/images/view_icon.png" alt="view icon" style="height:1em; vertical-align:middle;"> button in the upper right corner of the file.
> Both operations require the URDF/Xacro file to be in an active state.

Operations:
- View control: hold the left mouse button and drag in blank space to rotate; hold the right mouse button and drag to move the view.
- Joint control: hold the left mouse button and drag on the link directly connected to the joint.
- Measurement: click one of the four buttons in the upper right corner to measure coordinates, distance, angle, or area.

![measure](media/images/measure.gif)

## Install

This is a fork with additional features. Installation methods:

- **Local build**: Run `npm run package:local` then `npm run install:local` (requires `code` CLI)
- **Manual VSIX**: Build with `npm run package:local`, then in VSCode Extensions panel → `...` → `Install from VSIX...`, select `urdf-controller-*.vsix`
- **Original extension**: Search "URDF Visualizer" in VSCode extensions or use `ext install morningfrog.urdf-visualizer`

See [DEVELOPING.md](./DEVELOPING.md) for full build instructions.

## Known Issues

- When measuring area, if concave polygons appear, the area result may be incorrect

## Release Notes

### 5.2

Added (thanks to @legalaspro):

- Improved ROS 2 xacro compatibility with property handling closer to Python xacro, including local property scoping, lazy property evaluation, top-level property evaluation, and substitution-aware property resolution.
- Support `xacro.load_yaml()` for reading YAML configuration files inside the workspace and using them in xacro expressions.
- Xacro preview lock. When locked, saving included child xacro files re-renders the current top-level preview instead of switching to the saved child file.
- Support switching the Link list between tree view and flat view.

### 5.1

Added:

- Support interia visualization, with settings `urdf-visualizer.default.showInertia` and `urdf-visualizer.default.showInertiaWhenHover`.

### 5.0

Added:

- New UI design
- Toggle the visibility of each link
- Default configurations for preview and measurement settings, adjustable through VSCode settings
- Preserve camera view and joint angle states when switching files (configurable with `urdf-visualizer.cacheCameraView` and `urdf-visualizer.cacheJointValues`)
- Support for `**` operator (exponentiation) in xacro parsing, thanks to @IvanFan-Van (#19)

### 4.x

- Added multilingual support, configurable operation tips, world frame toggle, and richer joint information in the sidebar.
- Improved model inspection with hover names, joint/link frame visualization and highlighting, joint axis display, and coordinate measurement.
- Expanded measurement features with configurable units, precision, scientific notation, and style settings.
- Improved compatibility and usability with relative package paths, broader math expression support, and friendlier package-not-found prompts.
- Added mesh caching and camera view caching to improve loading speed and file-switching workflow.

### 3.x

- Add measurement functions for distance/angle/area.
- Add operation prompts

### 2.x

- Add the visualization of joint angles.
- Optimized the extension's experience.

### 1.x

Initial release of URDF Visualizer.
