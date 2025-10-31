"use client";

import {
  ChangeEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { PointerEvent as ReactPointerEvent, WheelEvent as ReactWheelEvent } from "react";
import { useDebouncedCallback } from "use-debounce";
import {
  Download,
  Eraser,
  Grid2x2,
  Layers,
  Loader2,
  Minus,
  Pen,
  RectangleHorizontal,
  Plus,
  Redo2,
  Square,
  TextCursor,
  Trash2,
  Undo2,
  Upload,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type DrawingEditorProps = {
  documentId: string;
  initialDrawing: unknown;
  initialTitle: string;
};

type Status = "idle" | "saving" | "saved" | "error";
type Tool = "select" | "brush" | "eraser";

type BaseShape = {
  id: string;
  name: string;
  type: string;
};

type BrushShape = BaseShape & {
  type: "brush";
  points: Array<[number, number]>;
  color: string;
  size: number;
};

type EraserShape = BaseShape & {
  type: "eraser";
  points: Array<[number, number]>;
  size: number;
};

type RectShape = BaseShape & {
  type: "rect";
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  cornerRadius: number;
};

type EllipseShape = BaseShape & {
  type: "ellipse";
  x: number;
  y: number;
  radiusX: number;
  radiusY: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

type TextShape = BaseShape & {
  type: "text";
  x: number;
  y: number;
  width: number;
  text: string;
  fontSize: number;
  color: string;
};

type ImageShape = BaseShape & {
  type: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  src: string;
};

type Shape = BrushShape | EraserShape | RectShape | EllipseShape | TextShape | ImageShape;

type CanvasSnapshot = {
  version: "canvas-v1";
  background: string;
  grid: boolean;
  shapes: Shape[];
};

type LegacyElement = {
  id: string;
  type: "sticky" | "circle";
  text?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
};

type LegacyDrawing = {
  metadata?: { background?: string };
  elements?: LegacyElement[];
};

const DEFAULT_BACKGROUND = "#ffffff";
const SNAPSHOT_VERSION = "canvas-v1";
const MAX_HISTORY = 60;

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `shape-${Math.random().toString(36).slice(2, 10)}`;
}

function deepClone<T>(value: T): T {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

function isCanvasSnapshot(value: unknown): value is CanvasSnapshot {
  return Boolean(
    value &&
      typeof value === "object" &&
      (value as CanvasSnapshot).version === SNAPSHOT_VERSION &&
      Array.isArray((value as CanvasSnapshot).shapes),
  );
}

function isLegacyDrawing(value: unknown): value is LegacyDrawing {
  const candidate = value as LegacyDrawing;
  return Boolean(
    candidate &&
      typeof candidate === "object" &&
      Array.isArray(candidate.elements),
  );
}

function convertLegacyDrawing(legacy: LegacyDrawing): CanvasSnapshot {
  const shapes: Shape[] = [];
  (legacy.elements ?? []).forEach((element) => {
    if (element.type === "circle") {
      shapes.push({
        id: element.id ?? generateId(),
        name: "Circle",
        type: "ellipse",
        x: element.x ?? 0,
        y: element.y ?? 0,
        radiusX: (element.width ?? 80) / 2,
        radiusY: (element.height ?? 80) / 2,
        fill: element.color ?? "#60a5fa",
        stroke: "#1f2937",
        strokeWidth: 2,
      });
    } else {
      shapes.push({
        id: element.id ?? generateId(),
        name: "Rectangle",
        type: "rect",
        x: element.x ?? 0,
        y: element.y ?? 0,
        width: element.width ?? 180,
        height: element.height ?? 140,
        fill: element.color ?? "#facc15",
        stroke: "#1f2937",
        strokeWidth: 2,
        cornerRadius: 12,
      });
      if (element.text) {
        const defaultWidth = (element.width ?? 180) - 32;
        shapes.push({
          id: generateId(),
          name: "Text",
          type: "text",
          x: (element.x ?? 0) + 16,
          y: (element.y ?? 0) + 16,
          width: defaultWidth > 60 ? defaultWidth : 120,
          text: element.text,
          fontSize: 24,
          color: "#1f2937",
        });
      }
    }
  });

  return {
    version: SNAPSHOT_VERSION,
    background: legacy.metadata?.background ?? DEFAULT_BACKGROUND,
    grid: false,
    shapes,
  };
}

function parseInitialSnapshot(initial: unknown): CanvasSnapshot {
  let parsed: unknown = initial;
  if (typeof initial === "string") {
    try {
      parsed = JSON.parse(initial);
    } catch {
      parsed = null;
    }
  }

  if (isCanvasSnapshot(parsed)) {
    return parsed;
  }

  if (isLegacyDrawing(parsed)) {
    return convertLegacyDrawing(parsed);
  }

  return {
    version: SNAPSHOT_VERSION,
    background: DEFAULT_BACKGROUND,
    grid: false,
    shapes: [],
  };
}

type CanvasDimensions = {
  width: number;
  height: number;
  scale: number;
  offsetX: number;
  offsetY: number;
};

const initialDimensions: CanvasDimensions = {
  width: 1280,
  height: 720,
  scale: 1,
  offsetX: 0,
  offsetY: 0,
};

type LayerItem = {
  id: string;
  label: string;
  isActive: boolean;
};

function drawShape(ctx: CanvasRenderingContext2D, shape: Shape) {
  if (shape.type === "brush") {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = shape.color;
    ctx.lineWidth = shape.size;

    ctx.beginPath();
    shape.points.forEach(([x, y], index) => {
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (shape.type === "eraser") {
    ctx.save();
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(0,0,0,1)";
    ctx.lineWidth = shape.size;
    ctx.beginPath();
    shape.points.forEach(([x, y], index) => {
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();
    ctx.restore();
    return;
  }

  if (shape.type === "rect") {
    ctx.save();
    ctx.fillStyle = shape.fill;
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth;

    if (shape.strokeWidth <= 0) {
      ctx.strokeStyle = "transparent";
    }

    ctx.beginPath();
    const radius = Math.min(shape.cornerRadius ?? 12, Math.abs(shape.width) / 2, Math.abs(shape.height) / 2);
    const x = shape.x;
    const y = shape.y;
    const w = shape.width;
    const h = shape.height;

    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
    ctx.fill();
    if (shape.strokeWidth > 0) {
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (shape.type === "ellipse") {
    ctx.save();
    ctx.fillStyle = shape.fill;
    ctx.strokeStyle = shape.stroke;
    ctx.lineWidth = shape.strokeWidth;
    ctx.beginPath();
    ctx.ellipse(shape.x, shape.y, shape.radiusX, shape.radiusY, 0, 0, Math.PI * 2);
    ctx.fill();
    if (shape.strokeWidth > 0) {
      ctx.stroke();
    }
    ctx.restore();
    return;
  }

  if (shape.type === "text") {
    ctx.save();
    ctx.font = `${shape.fontSize}px Inter, system-ui, sans-serif`;
    ctx.fillStyle = shape.color;
    ctx.textBaseline = "top";
    const lines = shape.text.split(/\r?\n/);
    lines.forEach((line, index) => {
      ctx.fillText(line, shape.x, shape.y + index * shape.fontSize * 1.4);
    });
    ctx.restore();
    return;
  }

  if (shape.type === "image") {
    const element = document.getElementById(`canvas-image-${shape.id}`) as HTMLImageElement | null;
    if (element && element.complete) {
      ctx.drawImage(element, shape.x, shape.y, shape.width, shape.height);
    }
  }
}

function drawGrid(ctx: CanvasRenderingContext2D, width: number, height: number, offsetX: number, offsetY: number, scale: number) {
  ctx.save();
  ctx.strokeStyle = "rgba(148, 163, 184, 0.2)";
  ctx.lineWidth = 1;
  const gridSize = 32 * scale;
  const startX = offsetX % gridSize;
  const startY = offsetY % gridSize;
  for (let x = startX; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = startY; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

function useCanvasRenderer(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  shapes: Shape[],
  background: string,
  gridEnabled: boolean,
  dimensions: CanvasDimensions,
  selectedId: string | null,
) {
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      return;
    }

    const devicePixelRatio = typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1;
    const scaledWidth = dimensions.width * devicePixelRatio;
    const scaledHeight = dimensions.height * devicePixelRatio;
    canvas.width = scaledWidth;
    canvas.height = scaledHeight;
    canvas.style.width = `${dimensions.width}px`;
    canvas.style.height = `${dimensions.height}px`;

    ctx.reset();
    ctx.scale(devicePixelRatio, devicePixelRatio);

    ctx.fillStyle = background;
    ctx.fillRect(0, 0, dimensions.width, dimensions.height);

    if (gridEnabled) {
      drawGrid(ctx, dimensions.width, dimensions.height, dimensions.offsetX, dimensions.offsetY, dimensions.scale);
    }

    ctx.save();
    ctx.translate(dimensions.offsetX, dimensions.offsetY);
    ctx.scale(dimensions.scale, dimensions.scale);

    shapes.forEach((shape) => drawShape(ctx, shape));

    if (selectedId) {
      const shape = shapes.find((item) => item.id === selectedId);
      if (shape) {
        const bounds = getShapeBounds(shape);
        const padding = 6;
        ctx.save();
        ctx.setLineDash([10 / dimensions.scale, 6 / dimensions.scale]);
        ctx.lineWidth = 2 / dimensions.scale;
        ctx.strokeStyle = "rgba(59, 130, 246, 0.9)";
        ctx.strokeRect(
          bounds.x - padding,
          bounds.y - padding,
          bounds.width + padding * 2,
          bounds.height + padding * 2,
        );
        ctx.restore();
      }
    }

    ctx.restore();
  }, [canvasRef, shapes, background, gridEnabled, dimensions, selectedId]);
}

function downloadDataURL(dataUrl: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

function createSnapshot(shapes: Shape[], background: string, grid: boolean): CanvasSnapshot {
  return {
    version: SNAPSHOT_VERSION,
    background,
    grid,
    shapes: deepClone(shapes),
  };
}

function updateShapePosition<T extends Shape>(
  shape: T,
  deltaX: number,
  deltaY: number,
): T {
  if (shape.type === "brush" || shape.type === "eraser") {
    return {
      ...shape,
      points: shape.points.map(([x, y]) => [x + deltaX, y + deltaY]) as Array<[number, number]>,
    };
  }

  if (shape.type === "rect" || shape.type === "ellipse" || shape.type === "text" || shape.type === "image") {
    return {
      ...shape,
      x: shape.x + deltaX,
      y: shape.y + deltaY,
    } as T;
  }

  return shape;
}

type Bounds = { x: number; y: number; width: number; height: number };

function getShapeBounds(shape: Shape): Bounds {
  switch (shape.type) {
    case "brush":
    case "eraser": {
      if (!shape.points.length) {
        return { x: 0, y: 0, width: 0, height: 0 };
      }
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      shape.points.forEach(([x, y]) => {
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
      });
      const padding = (shape.type === "brush" ? shape.size : shape.size) / 2;
      return {
        x: minX - padding,
        y: minY - padding,
        width: maxX - minX + padding * 2,
        height: maxY - minY + padding * 2,
      };
    }
    case "rect": {
      const width = shape.width;
      const height = shape.height;
      const x = width >= 0 ? shape.x : shape.x + width;
      const y = height >= 0 ? shape.y : shape.y + height;
      return { x, y, width: Math.abs(width), height: Math.abs(height) };
    }
    case "ellipse": {
      return {
        x: shape.x - shape.radiusX,
        y: shape.y - shape.radiusY,
        width: shape.radiusX * 2,
        height: shape.radiusY * 2,
      };
    }
    case "text": {
      const lines = shape.text.split(/\r?\n/);
      const height = lines.length * shape.fontSize * 1.4;
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height,
      };
    }
    case "image": {
      return {
        x: shape.x,
        y: shape.y,
        width: shape.width,
        height: shape.height,
      };
    }
    default:
      return { x: 0, y: 0, width: 0, height: 0 };
  }
}

function hitTestShape(shape: Shape, x: number, y: number): boolean {
  const bounds = getShapeBounds(shape);
  if (
    x < bounds.x ||
    y < bounds.y ||
    x > bounds.x + bounds.width ||
    y > bounds.y + bounds.height
  ) {
    return false;
  }

  if (shape.type === "ellipse") {
    const normX = (x - shape.x) / shape.radiusX;
    const normY = (y - shape.y) / shape.radiusY;
    return normX * normX + normY * normY <= 1;
  }

  return true;
}

function isDraggableShape(shape: Shape): boolean {
  return shape.type === "rect" || shape.type === "ellipse" || shape.type === "text" || shape.type === "image";
}

function getLayerLabel(shape: Shape): string {
  switch (shape.type) {
    case "brush":
      return "Brush stroke";
    case "eraser":
      return "Eraser";
    case "rect":
      return "Rectangle";
    case "ellipse":
      return "Ellipse";
    case "text":
      return "Text";
    case "image":
      return "Image";
    default:
      return "Layer";
  }
}

function usePreloadImages(shapes: Shape[]) {
  useEffect(() => {
    shapes.forEach((shape) => {
      if (shape.type === "image") {
        const id = `canvas-image-${shape.id}`;
        if (!document.getElementById(id)) {
          const img = new Image();
          img.id = id;
          img.src = shape.src;
          img.crossOrigin = "anonymous";
          img.style.display = "none";
          document.body.appendChild(img);
        }
      }
    });
    return () => {
      shapes.forEach((shape) => {
        if (shape.type === "image") {
          const element = document.getElementById(`canvas-image-${shape.id}`);
          element?.remove();
        }
      });
    };
  }, [shapes]);
}

export function DrawingEditor({
  documentId,
  initialDrawing,
  initialTitle,
}: DrawingEditorProps) {
  const initialSnapshot = useMemo(
    () => parseInitialSnapshot(initialDrawing),
    [initialDrawing],
  );

  const [shapes, setShapes] = useState<Shape[]>(() => deepClone(initialSnapshot.shapes));
  const [backgroundColor, setBackgroundColor] = useState(initialSnapshot.background ?? DEFAULT_BACKGROUND);
  const [gridEnabled, setGridEnabled] = useState(initialSnapshot.grid ?? false);
  const [title, setTitle] = useState(initialTitle || "Untitled Drawing");
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<Tool>("select");
  const [brushColor, setBrushColor] = useState("#1f2937");
  const [brushSize, setBrushSize] = useState(6);
  const [eraserSize, setEraserSize] = useState(24);
  const [shapeFill, setShapeFill] = useState("#f97316");
  const [strokeColor, setStrokeColor] = useState("#1f2937");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<CanvasDimensions>(initialDimensions);

  const undoStackRef = useRef<CanvasSnapshot[]>([initialSnapshot]);
  const redoStackRef = useRef<CanvasSnapshot[]>([]);
  const latestSnapshotRef = useRef<CanvasSnapshot>(initialSnapshot);
  const latestTitleRef = useRef(title || "Untitled Drawing");

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const drawingIdRef = useRef<string | null>(null);
  const drawingPointsRef = useRef<Array<[number, number]>>([]);
  const draggingRef = useRef<{ id: string; startX: number; startY: number; shape: Shape; moved: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useCanvasRenderer(canvasRef, shapes, backgroundColor, gridEnabled, dimensions, selectedId);
  usePreloadImages(shapes);

  useEffect(() => {
    latestTitleRef.current = title || "Untitled Drawing";
  }, [title]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }
    const resize = () => {
      const rect = container.getBoundingClientRect();
      setDimensions((prev) => ({
        ...prev,
        width: rect.width,
        height: rect.height,
      }));
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(container);
    return () => {
      observer.disconnect();
    };
  }, []);

  const persistSnapshot = useCallback(async (payload: CanvasSnapshot) => {
    if (!documentId) {
      return;
    }
    setStatus("saving");
    setError(null);
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "PUT",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: JSON.stringify(payload),
          title: latestTitleRef.current,
        }),
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(data?.error ?? "Failed to save drawing");
      }

      setStatus("saved");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save drawing");
    }
  }, [documentId]);

  const saveDrawing = useDebouncedCallback((snapshot?: CanvasSnapshot) => {
    const payload = snapshot ?? latestSnapshotRef.current;
    if (!payload) {
      return;
    }
    void persistSnapshot(payload);
  }, 600);

  const commitSnapshot = useCallback(
    (nextShapes: Shape[], backgroundOverride?: string, gridOverride?: boolean) => {
      const snapshot = createSnapshot(
        nextShapes,
        backgroundOverride ?? backgroundColor,
        gridOverride ?? gridEnabled,
      );
      undoStackRef.current.push(snapshot);
      if (undoStackRef.current.length > MAX_HISTORY) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
      latestSnapshotRef.current = snapshot;
      saveDrawing(snapshot);
    },
    [backgroundColor, gridEnabled, saveDrawing],
  );

  const replaceShapes = useCallback(
    (updater: (prev: Shape[]) => Shape[], commit = true) => {
      setShapes((prev) => {
        const next = updater(prev);
        shapesRef.current = next;
        if (commit) {
          commitSnapshot(next);
        }
        return next;
      });
    },
    [commitSnapshot],
  );
  const shapesRef = useRef(shapes);
  useEffect(() => {
    shapesRef.current = shapes;
  }, [shapes]);

  const setShapesDirect = useCallback((updater: (prev: Shape[]) => Shape[]) => {
    setShapes((prev) => {
      const next = updater(prev);
      shapesRef.current = next;
      return next;
    });
  }, []);

  const layers = useMemo<LayerItem[]>(
    () =>
      shapes.map((shape) => ({
        id: shape.id,
        label: shape.name || getLayerLabel(shape),
        isActive: selectedId === shape.id,
      })),
    [shapes, selectedId],
  );

  const handleToolChange = useCallback((nextTool: Tool) => {
    setTool(nextTool);
    if (nextTool !== "select") {
      setSelectedId(null);
    }
  }, []);

  const addRectangle = useCallback(() => {
    const id = generateId();
    const shape: RectShape = {
      id,
      name: "Rectangle",
      type: "rect",
      x: dimensions.width / 2 - 110,
      y: dimensions.height / 2 - 80,
      width: 220,
      height: 160,
      fill: shapeFill,
      stroke: strokeColor,
      strokeWidth: 2,
      cornerRadius: 12,
    };
    replaceShapes((prev) => [...prev, shape]);
    setSelectedId(id);
    setTool("select");
  }, [dimensions.height, dimensions.width, replaceShapes, shapeFill, strokeColor]);

  const addEllipse = useCallback(() => {
    const id = generateId();
    const shape: EllipseShape = {
      id,
      name: "Ellipse",
      type: "ellipse",
      x: dimensions.width / 2,
      y: dimensions.height / 2,
      radiusX: 100,
      radiusY: 70,
      fill: shapeFill,
      stroke: strokeColor,
      strokeWidth: 2,
    };
    replaceShapes((prev) => [...prev, shape]);
    setSelectedId(id);
    setTool("select");
  }, [dimensions.height, dimensions.width, replaceShapes, shapeFill, strokeColor]);

  const addText = useCallback(() => {
    const id = generateId();
    const shape: TextShape = {
      id,
      name: "Text",
      type: "text",
      x: dimensions.width / 2 - 150,
      y: dimensions.height / 2 - 20,
      text: "Double-click to edit text",
      fontSize: 28,
      color: strokeColor,
      width: 300,
    };
    replaceShapes((prev) => [...prev, shape]);
    setSelectedId(id);
    setTool("select");
  }, [dimensions.height, dimensions.width, replaceShapes, strokeColor]);

  const addImageFromFile = useCallback((file: File, src: string) => {
    const id = generateId();
    const shape: ImageShape = {
      id,
      name: file.name || "Image",
      type: "image",
      x: dimensions.width / 2 - 160,
      y: dimensions.height / 2 - 120,
      width: 320,
      height: 240,
      src,
    };
    replaceShapes((prev) => [...prev, shape]);
    setSelectedId(id);
    setTool("select");
  }, [dimensions.height, dimensions.width, replaceShapes]);

  const handleImageFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) {
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const src = typeof reader.result === "string" ? reader.result : null;
      if (src) {
        addImageFromFile(file, src);
      }
    };
    reader.readAsDataURL(file);
  }, [addImageFromFile]);

  const handleImageUploadClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleManualSave = useCallback(async () => {
    setLoading(true);
    try {
      const snapshot = createSnapshot(shapesRef.current, backgroundColor, gridEnabled);
      undoStackRef.current.push(snapshot);
      if (undoStackRef.current.length > MAX_HISTORY) {
        undoStackRef.current.shift();
      }
      redoStackRef.current = [];
      latestSnapshotRef.current = snapshot;
      await persistSnapshot(snapshot);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to save drawing");
    } finally {
      setLoading(false);
    }
  }, [backgroundColor, gridEnabled, persistSnapshot]);

  const handleExport = useCallback((format: "png" | "jpeg") => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    try {
      const dataUrl = canvas.toDataURL(`image/${format}`);
      downloadDataURL(dataUrl, `${title || "drawing"}.${format}`);
    } catch (err) {
      console.error(err);
      setStatus("error");
      setError(err instanceof Error ? err.message : "Failed to export drawing");
    }
  }, [title]);

  const handleTitleChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setTitle(value);
    latestTitleRef.current = value || "Untitled Drawing";
    saveDrawing();
  }, [saveDrawing]);

  const handleLayerSelect = useCallback((id: string) => {
    setSelectedId(id);
    setTool("select");
  }, []);

  const handleLayerDelete = useCallback((id: string) => {
    replaceShapes((prev) => prev.filter((shape) => shape.id !== id));
    if (selectedId === id) {
      setSelectedId(null);
    }
  }, [replaceShapes, selectedId]);

  const handleLayerMove = useCallback((id: string, direction: "up" | "down") => {
    replaceShapes((prev) => {
      const index = prev.findIndex((shape) => shape.id === id);
      if (index === -1) {
        return prev;
      }
      const next = [...prev];
      const [item] = next.splice(index, 1);
      const newIndex = direction === "up" ? Math.min(index + 1, next.length) : Math.max(index - 1, 0);
      next.splice(newIndex, 0, item);
      return next;
    });
  }, [replaceShapes]);

  const getCanvasPoint = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return null;
      }
      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left - dimensions.offsetX) / dimensions.scale;
      const y = (event.clientY - rect.top - dimensions.offsetY) / dimensions.scale;
      return { x, y };
    },
    [dimensions],
  );

  const findShapeAtPoint = useCallback(
    (x: number, y: number) => {
      const items = shapesRef.current;
      for (let index = items.length - 1; index >= 0; index -= 1) {
        const shape = items[index];
        if (hitTestShape(shape, x, y)) {
          return shape;
        }
      }
      return null;
    },
    [],
  );

  const handleEditText = useCallback(
    (shape: TextShape) => {
      const updatedText = window.prompt("Edit text", shape.text);
      if (typeof updatedText === "string") {
        replaceShapes((prev) =>
          prev.map((item) => (item.id === shape.id ? { ...shape, text: updatedText } : item)),
        );
      }
    },
    [replaceShapes],
  );

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      event.preventDefault();
       event.currentTarget.setPointerCapture(event.pointerId);
      if (event.button !== 0 && event.pointerType !== "touch") {
        return;
      }
      const point = getCanvasPoint(event);
      if (!point) {
        return;
      }

      if (tool === "brush" || tool === "eraser") {
        const id = generateId();
        const points: Array<[number, number]> = [[point.x, point.y]];
        const shape: Shape =
          tool === "brush"
            ? {
                id,
                name: "Brush stroke",
                type: "brush",
                points,
                color: brushColor,
                size: brushSize,
              }
            : {
                id,
                name: "Eraser",
                type: "eraser",
                points,
                size: eraserSize,
              };
        drawingIdRef.current = id;
        drawingPointsRef.current = points;
        setShapesDirect((prev) => [...prev, shape]);
        setSelectedId(id);
        return;
      }

      const shape = findShapeAtPoint(point.x, point.y);
      if (shape) {
        setSelectedId(shape.id);
        if (event.detail === 2 && shape.type === "text") {
          handleEditText(shape);
          return;
        }
        if (isDraggableShape(shape)) {
          draggingRef.current = {
            id: shape.id,
            startX: point.x,
            startY: point.y,
            shape: deepClone(shape),
            moved: false,
          };
        }
      } else {
        setSelectedId(null);
        draggingRef.current = null;
      }
    },
    [brushColor, brushSize, eraserSize, findShapeAtPoint, getCanvasPoint, handleEditText, setShapesDirect, tool],
  );

  const handlePointerMove = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (!drawingIdRef.current && !draggingRef.current) {
        return;
      }
      const point = getCanvasPoint(event);
      if (!point) {
        return;
      }

      if (drawingIdRef.current) {
        drawingPointsRef.current.push([point.x, point.y]);
        const id = drawingIdRef.current;
        setShapesDirect((prev) =>
          prev.map((shape) => {
            if (shape.id !== id) {
              return shape;
            }
            if (shape.type === "brush" || shape.type === "eraser") {
              return {
                ...shape,
                points: [...shape.points, [point.x, point.y]] as Array<[number, number]>,
              } as Shape;
            }
            return shape;
          }),
        );
        return;
      }

      const drag = draggingRef.current;
      if (drag) {
        const deltaX = point.x - drag.startX;
        const deltaY = point.y - drag.startY;
        const updatedShape = updateShapePosition(drag.shape, deltaX, deltaY);
        setShapesDirect((prev) => prev.map((item) => (item.id === drag.id ? updatedShape : item)));
        draggingRef.current = { ...drag, moved: drag.moved || Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0 };
      }
    },
    [getCanvasPoint, setShapesDirect],
  );

  const finalizeInteraction = useCallback(
    (commit: boolean) => {
      const hasBrush = Boolean(drawingIdRef.current);
      const drag = draggingRef.current;
      if (commit && (hasBrush || (drag && drag.moved))) {
        commitSnapshot(shapesRef.current);
      }
      drawingIdRef.current = null;
      drawingPointsRef.current = [];
      draggingRef.current = null;
    },
    [commitSnapshot],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLCanvasElement>) => {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      if (drawingIdRef.current || draggingRef.current) {
        finalizeInteraction(true);
      }
    },
    [finalizeInteraction],
  );

  const handlePointerLeave = useCallback(() => {
    if (drawingIdRef.current || draggingRef.current) {
      finalizeInteraction(true);
    }
  }, [finalizeInteraction]);

  const handleWheel = useCallback(
    (event: ReactWheelEvent<HTMLCanvasElement>) => {
      event.preventDefault();
      const factor = event.deltaY > 0 ? 1 / 1.1 : 1.1;
      setDimensions((prev) => {
        const nextScale = Math.min(4, Math.max(0.4, prev.scale * factor));
        if (nextScale === prev.scale) {
          return prev;
        }
        return {
          ...prev,
          scale: nextScale,
        };
      });
    },
    [],
  );

  const handleZoom = useCallback((factor: number) => {
    setDimensions((prev) => {
      const nextScale = Math.min(4, Math.max(0.4, prev.scale * factor));
      return { ...prev, scale: nextScale };
    });
  }, []);

  const handleZoomIn = useCallback(() => handleZoom(1.2), [handleZoom]);
  const handleZoomOut = useCallback(() => handleZoom(1 / 1.2), [handleZoom]);
  const handleResetView = useCallback(
    () => setDimensions((prev) => ({ ...prev, scale: 1, offsetX: 0, offsetY: 0 })),
    [],
  );

  const gridStyle = useMemo(() => {
    if (!gridEnabled) {
      return undefined;
    }
    const size = 32 * dimensions.scale;
    return {
      backgroundImage:
        "linear-gradient(to right, rgba(148, 163, 184, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(148, 163, 184, 0.1) 1px, transparent 1px)",
      backgroundSize: `${size}px ${size}px`,
    };
  }, [gridEnabled, dimensions.scale]);

  const orderedLayers = useMemo(() => [...layers].reverse(), [layers]);

  const handleBackgroundChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const color = event.target.value;
      setBackgroundColor(color);
      commitSnapshot(shapesRef.current, color, undefined);
    },
    [commitSnapshot],
  );

  const handleToggleGrid = useCallback(() => {
    const next = !gridEnabled;
    setGridEnabled(next);
    commitSnapshot(shapesRef.current, undefined, next);
  }, [commitSnapshot, gridEnabled]);

  const handleClearCanvas = useCallback(() => {
    replaceShapes(() => []);
    setSelectedId(null);
  }, [replaceShapes]);

  const handleUndo = useCallback(() => {
    if (undoStackRef.current.length <= 1) {
      return;
    }
    const current = undoStackRef.current.pop();
    if (current) {
      redoStackRef.current.push(current);
    }
    const previous = undoStackRef.current[undoStackRef.current.length - 1];
    if (!previous) {
      return;
    }
    const cloned = deepClone(previous.shapes);
    setShapes(cloned);
    shapesRef.current = cloned;
    setBackgroundColor(previous.background);
    setGridEnabled(previous.grid);
    latestSnapshotRef.current = previous;
    setSelectedId(null);
    setStatus("saved");
    saveDrawing(previous);
  }, [saveDrawing]);

  const handleRedo = useCallback(() => {
    const next = redoStackRef.current.pop();
    if (!next) {
      return;
    }
    undoStackRef.current.push(next);
    const cloned = deepClone(next.shapes);
    setShapes(cloned);
    shapesRef.current = cloned;
    setBackgroundColor(next.background);
    setGridEnabled(next.grid);
    latestSnapshotRef.current = next;
    setSelectedId(null);
    setStatus("saved");
    saveDrawing(next);
  }, [saveDrawing]);

  const footerMessage = useMemo(() => {
    if (status === "saving") {
      return "Saving…";
    }
    if (status === "saved") {
      return "All changes saved";
    }
    if (status === "error") {
      return error ?? "Failed to save";
    }
    return "Changes will save automatically";
  }, [status, error]);

  return (
    <Card className="border border-slate-200 bg-white shadow-sm">
      <CardHeader className="space-y-4 border-b border-slate-200 bg-slate-50/60">
        <Input
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled drawing"
          className="h-12 border-0 bg-transparent px-0 text-2xl font-semibold text-slate-900 focus-visible:ring-0"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualSave}
            disabled={loading || status === "saving"}
          >
            {loading || status === "saving" ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving…
              </span>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Save now
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("png")}>
            Export PNG
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport("jpeg")}>
            Export JPEG
          </Button>
          <Button variant="outline" size="sm" onClick={handleUndo}>
            <Undo2 className="mr-2 h-4 w-4" />
            Undo
          </Button>
          <Button variant="outline" size="sm" onClick={handleRedo}>
            <Redo2 className="mr-2 h-4 w-4" />
            Redo
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomOut}>
            <Minus className="mr-2 h-4 w-4" />
            Zoom out
          </Button>
          <Button variant="outline" size="sm" onClick={handleZoomIn}>
            <Plus className="mr-2 h-4 w-4" />
            Zoom in
          </Button>
          <Button variant="outline" size="sm" onClick={handleResetView}>
            Reset view
          </Button>
          <Button variant="outline" size="sm" onClick={handleToggleGrid}>
            <Grid2x2 className="mr-2 h-4 w-4" />
            {gridEnabled ? "Disable grid" : "Enable grid"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleClearCanvas}>
            <Eraser className="mr-2 h-4 w-4" />
            Clear canvas
          </Button>
          <label className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-1 text-sm text-slate-600">
            <Layers className="h-4 w-4" />
            Background
            <input
              type="color"
              value={backgroundColor}
              onChange={handleBackgroundChange}
              className="h-7 w-12 cursor-pointer rounded border border-slate-200"
            />
          </label>
          <Button variant="outline" size="sm" onClick={handleImageUploadClick}>
            <Upload className="mr-2 h-4 w-4" />
            Insert image
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
          <div className="flex items-center gap-2">
            <Button
              variant={tool === "select" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolChange("select")}
            >
              Select
            </Button>
            <Button
              variant={tool === "brush" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolChange("brush")}
            >
              <Pen className="mr-2 h-4 w-4" />
              Brush
            </Button>
            <Button
              variant={tool === "eraser" ? "default" : "outline"}
              size="sm"
              onClick={() => handleToolChange("eraser")}
            >
              <Eraser className="mr-2 h-4 w-4" />
              Eraser
            </Button>
          </div>
          <div className="flex items-center gap-3 pl-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              Brush
              <input
                type="color"
                value={brushColor}
                onChange={(event) => setBrushColor(event.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-slate-200"
              />
              <input
                type="range"
                min={1}
                max={60}
                value={brushSize}
                onChange={(event) => setBrushSize(Number(event.target.value) || 1)}
                className="w-24"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              Eraser
              <input
                type="range"
                min={10}
                max={160}
                value={eraserSize}
                onChange={(event) => setEraserSize(Number(event.target.value) || 10)}
                className="w-24"
              />
            </label>
          </div>
          <div className="flex items-center gap-2 pl-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              Fill
              <input
                type="color"
                value={shapeFill}
                onChange={(event) => setShapeFill(event.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-slate-200"
              />
            </label>
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              Stroke
              <input
                type="color"
                value={strokeColor}
                onChange={(event) => setStrokeColor(event.target.value)}
                className="h-7 w-10 cursor-pointer rounded border border-slate-200"
              />
            </label>
          </div>
          <div className="flex items-center gap-2 pl-3">
            <Button variant="outline" size="sm" onClick={addRectangle}>
              <RectangleHorizontal className="mr-2 h-4 w-4" />
              Rectangle
            </Button>
            <Button variant="outline" size="sm" onClick={addEllipse}>
              <Square className="mr-2 h-4 w-4" />
              Ellipse
            </Button>
            <Button variant="outline" size="sm" onClick={addText}>
              <TextCursor className="mr-2 h-4 w-4" />
              Text
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-0 md:flex-row">
        <div className="relative flex-1">
          <div
            ref={containerRef}
            className="relative h-[720px] w-full overflow-hidden"
            style={{ backgroundColor, ...gridStyle }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerLeave={handlePointerLeave}
              onWheel={handleWheel}
              onContextMenu={(event) => event.preventDefault()}
            />
            <div className="pointer-events-none absolute inset-0 bg-transparent" />
          </div>
        </div>
        <aside className="w-full border-t border-slate-200 bg-slate-50/80 px-4 py-4 md:w-72 md:border-l md:border-t-0">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Layers</h3>
            <span className="text-xs text-slate-500">{orderedLayers.length}</span>
          </div>
          {orderedLayers.length === 0 ? (
            <p className="mt-4 text-xs text-slate-500">
              Add brush strokes, shapes, or images to see them listed here.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs">
              {orderedLayers.map((layer) => (
                <li
                  key={layer.id}
                  className={`rounded-md border bg-white px-3 py-2 shadow-sm transition ${
                    layer.isActive
                      ? "border-slate-500 text-slate-900"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleLayerSelect(layer.id)}
                      className="flex-1 text-left font-medium"
                    >
                      {layer.label}
                    </button>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Bring forward"
                        onClick={() => handleLayerMove(layer.id, "up")}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        aria-label="Send backward"
                        onClick={() => handleLayerMove(layer.id, "down")}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        ▼
                      </button>
                      <button
                        type="button"
                        aria-label="Delete layer"
                        onClick={() => handleLayerDelete(layer.id)}
                        className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-rose-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </CardContent>
      <CardFooter className="flex items-center justify-between bg-slate-50/80 px-6 py-3 text-xs text-slate-500">
        <span>{footerMessage}</span>
        {status === "error" ? <span className="text-rose-500">{error}</span> : null}
      </CardFooter>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleImageFileChange}
      />
    </Card>
  );
}
