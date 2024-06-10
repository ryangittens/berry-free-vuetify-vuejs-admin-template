// src/stores/svgStore.js
import { defineStore } from 'pinia';

export const useSvgStore = defineStore('svgStore', {
  state: () => ({
    blocks: [],
    lines: [],
    selectedBlock: null,
    selectedLine: null, // Add this
    isDrawing: false,
    lineType: 'solid',
    lineColor: '#000000',
    currentLine: [],
    activeTool: '',
    svg: null,
    viewBox: { x: 0, y: 0, width: 0, height: 0 },
    zoomLevel: 1,
    gridSize: 20,
    showGrid: true
  }),
  actions: {
    addBlock(block) {
      this.blocks.push(block);
    },
    selectBlock(block) {
      this.selectedBlock = block;
      this.selectedLine = null; // Deselect line when block is selected
    },
    moveBlock(block, dx, dy) {
      const index = this.blocks.findIndex((b) => b.id === block.id);
      if (index !== -1) {
        this.blocks[index].x += dx;
        this.blocks[index].y += dy;
      }
    },
    deleteBlock(block) {
      this.blocks = this.blocks.filter((b) => b.id !== block.id);
      if (this.selectedBlock && this.selectedBlock.id === block.id) {
        this.selectedBlock = null;
      }
    },
    startDrawing() {
      this.isDrawing = true;
      this.activeTool = `${this.lineType}-${this.lineColor}`; // Set the active tool
    },
    addLine(line) {
      if (line) {
        this.lines.push(line);
      }
    },
    stopDrawing(line) {
      if (line) {
        this.addLine(line);
      } else if (this.currentLine.length > 0) {
        let newLine = {
          object: 'line',
          id: Date.now(),
          type: this.lineType,
          color: this.lineColor,
          points: [...this.currentLine]
        };
        this.addLine(newLine);
        this.currentLine = [];
      }
      this.isDrawing = false;
      this.activeTool = '';
    },
    addLinePoint(point) {
      this.currentLine.push(point);
    },
    setLineType(type) {
      this.lineType = type;
    },
    setLineColor(color) {
      this.lineColor = color;
    },
    selectLine(line) {
      this.selectedLine = line;
      this.selectedBlock = null; // Deselect block when line is selected
    },
    deleteLine(line) {
      this.lines = this.lines.filter((l) => l.id !== line.id);
      if (this.selectedLine && this.selectedLine.id === line.id) {
        this.selectedLine = null;
      }
    },
    removeLastLinePoint() {
      if (this.currentLine.length > 0) {
        this.currentLine.pop();
      }
    },
    removeLastLine() {
      if (this.lines.length > 0) {
        this.lines.pop();
      }
    },
    serializeState() {
      return JSON.stringify({
        blocks: this.blocks,
        lines: this.lines,
        viewBox: this.viewBox,
        zoomLevel: this.zoomLevel
      });
    },
    svgToDataUrl(svgElement) {
      const serializer = new XMLSerializer();
      const svgString = serializer.serializeToString(svgElement);
      const encodedData = encodeURIComponent(svgString);
      return `data:image/svg+xml;charset=utf-8,${encodedData}`;
    },
    deserializeState(serializedState) {
      const data = JSON.parse(serializedState);
      const { clientWidth, clientHeight } = this.svg;
      this.blocks = data?.blocks || [];
      this.lines = data?.lines || [];
      this.zoomLevel = data?.zoomLevel || 1; // Restore the zoom level

      if (data?.viewBox) {
        this.viewBox.x = data?.viewBox?.x || 0;
        this.viewBox.y = data?.viewBox?.y || 0;
        this.viewBox.width = clientWidth;
        this.viewBox.height = clientHeight;
      } else {
        this.viewBox = { x: 0, y: 0, width: clientWidth, height: clientHeight };
      }

      // Apply the zoom level to the viewBox
      // this.viewBox.width /= this.zoomLevel;
      // this.viewBox.height /= this.zoomLevel;

      // Re-render the grid if it is enabled
      if (this.showGrid) {
        this.renderGrid();
      }
    },
    setSvgElement(svg) {
      this.svg = svg;
    },
    setViewBox(x, y, width, height) {
      this.viewBox = { x, y, width, height };
    },
    initializeViewBox() {
      if (this.svg) {
        const { clientWidth, clientHeight } = this.svg;
        this.viewBox.x = 0;
        this.viewBox.y = 0;
        this.viewBox.width = clientWidth;
        this.viewBox.height = clientHeight;
      }
    },
    centerSVG() {
      if (this.svg) {
        this.viewBox.x = 0;
        this.viewBox.y = 0;
      }
    },
    fitSVGToExtent() {
      const { minX, minY, maxX, maxY } = calculateBoundingBox(this.lines, this.blocks);

      if (minX === Infinity || minY === Infinity || maxX === -Infinity || maxY === -Infinity) {
        console.error('No elements to fit');
        return;
      }

      const width = maxX - minX;
      const height = maxY - minY;

      // Add some padding
      const padding = 20;
      const viewBoxWidth = width + 2 * padding;
      const viewBoxHeight = height + 2 * padding;

      const containerWidth = this.svg.clientWidth;
      const containerHeight = this.svg.clientHeight;

      // Calculate the aspect ratios
      const contentAspectRatio = viewBoxWidth / viewBoxHeight;
      const containerAspectRatio = containerWidth / containerHeight;

      // Determine the final width and height to maintain the aspect ratio
      let finalWidth, finalHeight;

      if (contentAspectRatio > containerAspectRatio) {
        finalWidth = viewBoxWidth;
        finalHeight = viewBoxWidth / containerAspectRatio;
      } else {
        finalHeight = viewBoxHeight;
        finalWidth = viewBoxHeight * containerAspectRatio;
      }

      // Calculate the offset to center the content
      const offsetX = (finalWidth - viewBoxWidth) / 2;
      const offsetY = (finalHeight - viewBoxHeight) / 2;

      // Save the old viewBox dimensions to calculate the zoom level
      const oldViewBoxWidth = this.viewBox.width;
      const oldViewBoxHeight = this.viewBox.height;

      // Set the viewBox to the calculated dimensions and center it
      this.viewBox.x = minX - padding - offsetX;
      this.viewBox.y = minY - padding - offsetY;
      this.viewBox.width = finalWidth;
      this.viewBox.height = finalHeight;

      // Calculate the new zoom level based on the ratio of the old viewBox dimensions to the new ones
      const scaleX = oldViewBoxWidth / finalWidth;
      const scaleY = oldViewBoxHeight / finalHeight;
      this.zoomLevel = Math.min(scaleX, scaleY) * this.zoomLevel; // Adjust the zoom level accordingly

      // Draw the gridlines over the whole SVG
      this.renderGrid();
    },
    toggleGrid() {
      this.showGrid = !this.showGrid;
      if (this.svgElement) {
        this.renderGrid();
      }
    },
    selectedObject() {
      if (this.selectedBlock) {
        return this.selectBlock;
      }
      if (this.selectedLine) {
        return this.selectLine;
      }
    },
    renderGrid() {
      if (!this.svgElement) return;

      const gridContainer = this.svgElement.querySelector('.grid-container');
      if (gridContainer) {
        gridContainer.innerHTML = '';
      } else {
        const newGridContainer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        newGridContainer.classList.add('grid-container');
        this.svgElement.prepend(newGridContainer);
      }

      if (this.showGrid) {
        const { width, height } = this.viewBox;
        const gridLines = [];

        for (let x = 0; x <= width; x += this.gridSize) {
          gridLines.push(`<line x1="${x}" y1="0" x2="${x}" y2="${height}" stroke="lightgray" stroke-width="0.5" />`);
        }

        for (let y = 0; y <= height; y += this.gridSize) {
          gridLines.push(`<line x1="0" y1="${y}" x2="${width}" y2="${y}" stroke="lightgray" stroke-width="0.5" />`);
        }

        this.svgElement.querySelector('.grid-container').innerHTML = gridLines.join('');
      }
    }
  }
});

// Helper function to calculate the bounding box
const calculateBoundingBox = (lines, blocks) => {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  lines.forEach((line) => {
    line.points.forEach((point) => {
      if (point.x < minX) minX = point.x;
      if (point.y < minY) minY = point.y;
      if (point.x > maxX) maxX = point.x;
      if (point.y > maxY) maxY = point.y;
    });
  });
  blocks.forEach((block) => {
    if (block.x < minX) minX = block.x;
    if (block.y < minY) minY = block.y;
    if (block.x + block.width > maxX) maxX = block.x + block.width;
    if (block.y + block.height > maxY) maxY = block.y + block.height;
  });
  return { minX, minY, maxX, maxY };
};
