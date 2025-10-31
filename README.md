# Link Canvas

> [日本語版 README はこちら / Japanese README](./README.ja.md)

Link Canvas is a VS Code extension that visualizes code dependencies, references, and relationships on an infinite canvas. Explore your codebase interactively with OS-window-style code viewers that support zooming, panning, and direct navigation to definitions and references.

## Features

- **Infinite Canvas**: Navigate through your code on a boundless canvas with smooth zooming and panning
- **Interactive Code Windows**: OS-style windows with drag, resize, and Monaco Editor integration
- **Dependency Visualization**: See how functions, classes, and files are connected
- **Quick Navigation**: Right-click context menu for jumping to definitions and references
- **File Tree Integration**: Browse your project structure directly in the sidebar
- **Style Customization**: Fully customizable themes, window styles, and fonts ([details](STYLE_CUSTOMIZATION.md))

## Installation

### Prerequisites

- Node.js 16 or higher
- VS Code 1.80.0 or higher

### From Source (Development)

1. Clone the repository

```bash
git clone https://github.com/is0692vs/link-canvas.git
cd link-canvas
```

2. Install dependencies

```bash
npm install
```

3. Build the extension

```bash
npm run build
```

4. Install in VS Code

- Open the project in VS Code
- Press F5 to launch extension development host
- Or package and install manually

## Usage

1. Click the "Link Canvas" icon in the VS Code activity bar
2. Browse your project files in the sidebar
3. Click on a file to open it on the canvas
4. Zoom in to see full code with Monaco Editor, zoom out for overview
5. Right-click in any editor to jump to definitions or references on the canvas

### Style Customization

Link Canvas allows you to customize themes, window styles, and fonts via VSCode settings (settings.json).

```json
{
  "linkCanvas.theme": "dark",
  "linkCanvas.window.borderColor": "#666666",
  "linkCanvas.window.borderRadius": 8,
  "linkCanvas.font.size": 14
}
```

See the [Style Customization Guide](STYLE_CUSTOMIZATION.md) for detailed configuration options.

## Screenshots

<!-- TODO: Add screenshots here -->
<!-- Recommended: -->
<!-- 1. Full canvas view (zoomed out state) -->
<!-- 2. Code window zoomed in (showing Monaco Editor) -->
<!-- 3. GIF of right-click menu to jump to definition/references -->
<!-- 4. GIF of dragging files from file tree to canvas -->

_Screenshots and demo GIFs will be added soon._

## System Requirements

- VS Code 1.80.0+
- Node.js 16+ (for development)

## License

MIT

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.
