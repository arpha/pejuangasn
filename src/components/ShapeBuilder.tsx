'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import React, { useRef, useState, useEffect } from 'react';
import { 
  Square, Circle, Triangle, Type, Eraser, 
  Trash2, Undo, Save, X, Edit3, Minimize2,
  ArrowRight, ArrowLeftRight, Moon, Star, Sun, Hexagon, Diamond,
  MousePointer, Move, Copy, FlipHorizontal, FlipVertical, RotateCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ShapeBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (blob: Blob) => void;
  title?: string;
}

type Tool = 'select' | 'pencil' | 'line' | 'arrow' | 'arrow-double' | 'arrow-block' | 'rectangle' | 'trapezium' | 'rhombus' | 'circle' | 'semicircle' | 'triangle' | 'triangle-equilateral' | 'triangle-right' | 'polygon' | 'star' | 'crescent' | 'sun' | 'text' | 'eraser' | 'oval' | 'semioval';

interface Point {
  x: number;
  y: number;
}

interface Shape {
  id: string;
  type: Tool;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  fillColor: string;
  lineWidth: number;
  text?: string;
  sides?: number; // polygon sides count
  points?: Point[]; // pencil / eraser path points
  flippedH?: boolean;
  flippedV?: boolean;
  rotation?: number; // rotation in degrees
  lineStyle?: 'solid' | 'dashed';
}

interface DragOffset {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  points: Point[];
}

export function ShapeBuilder({
  isOpen,
  onClose,
  onSave,
  title = 'Pembuat Bentuk & Diagram'
}: ShapeBuilderProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const contextRef = useRef<CanvasRenderingContext2D | null>(null);
  const [tool, setTool] = useState<Tool>('pencil');
  
  // Customization states
  const [strokeColor, setStrokeColor] = useState('#000000');
  const [fillColor, setFillColor] = useState('transparent');
  const [lineWidth, setLineWidth] = useState(3);
  const [lineStyle, setLineStyle] = useState<'solid' | 'dashed'>('solid');
  const [textInput, setTextInput] = useState('');
  const [polygonSides, setPolygonSides] = useState(5);
  const [showGrid, setShowGrid] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);
  
  // Vector shapes state
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapeIds, setSelectedShapeIds] = useState<string[]>([]);
  const [copiedShapes, setCopiedShapes] = useState<Shape[]>([]);
  
  // Selection box state for multi-select block
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  
  // Draw / Drag interaction states
  const [isInteracting, setIsInteracting] = useState(false);
  const [activeShape, setActiveShape] = useState<Shape | null>(null);
  
  // Selection drag mode: 'none' | 'move' | 'resize' | 'select-box'
  const [dragMode, setDragMode] = useState<'none' | 'move' | 'resize' | 'select-box'>('none');
  const [dragStartMouseX, setDragStartMouseX] = useState(0);
  const [dragStartMouseY, setDragStartMouseY] = useState(0);
  
  // Multi-drag start offsets
  const [multiDragOffsets, setMultiDragOffsets] = useState<DragOffset[]>([]);
  
  // Resize offset (for single shape resizing)
  const [shapeDragOffset, setShapeDragOffset] = useState({ startX: 0, startY: 0, endX: 0, endY: 0 });
  const [shapePointsOffset, setShapePointsOffset] = useState<Point[]>([]);

  // History stack for Undo
  const [history, setHistory] = useState<Shape[][]>([]);

  // Push new state to history stack
  const saveToHistory = (newShapes: Shape[]) => {
    setHistory(prev => [...prev, newShapes]);
  };

  // Set default background fill
  const redrawCanvas = () => {
    if (!canvasRef.current || !contextRef.current) return;
    const canvas = canvasRef.current;
    const ctx = contextRef.current;

    // Clear and fill canvas with white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw Grid Overlay
    if (showGrid) {
      ctx.save();
      ctx.strokeStyle = '#e5e7eb'; // Light gray tailwind gray-200
      ctx.lineWidth = 0.5;
      const gridSize = 20;
      
      // Vertical grid lines
      for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      
      // Horizontal grid lines
      for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Render all shapes
    shapes.forEach(shape => drawShape(ctx, shape));

    // Render currently active drawing shape (if any)
    if (activeShape) {
      drawShape(ctx, activeShape);
    }

    // Render active selection box (block select)
    if (tool === 'select' && selectionBox) {
      ctx.save();
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.fillStyle = 'rgba(59, 130, 246, 0.08)';
      const x = Math.min(selectionBox.startX, selectionBox.endX);
      const y = Math.min(selectionBox.startY, selectionBox.endY);
      const w = Math.abs(selectionBox.startX - selectionBox.endX);
      const h = Math.abs(selectionBox.startY - selectionBox.endY);
      ctx.fillRect(x, y, w, h);
      ctx.strokeRect(x, y, w, h);
      ctx.restore();
    }

    // Render selection overlay borders around all selected shapes
    if (tool === 'select' && selectedShapeIds.length > 0) {
      selectedShapeIds.forEach(id => {
        const selectedShape = shapes.find(s => s.id === id);
        if (selectedShape) {
          // Render resize handles only if exactly ONE shape is selected
          const showHandles = selectedShapeIds.length === 1;
          drawSelectionOverlay(ctx, selectedShape, showHandles);
        }
      });
    }
  };

  // Trigger redraw on shapes/activeShape/selection update
  useEffect(() => {
    redrawCanvas();
  }, [shapes, activeShape, selectedShapeIds, selectionBox, tool, showGrid]);

  // Handle color/linewidth/rotation changes dynamically on selected shapes
  useEffect(() => {
    if (selectedShapeIds.length > 0) {
      // Avoid circular updates when states are set from selecting a shape
      const updated = shapes.map(s => {
        if (selectedShapeIds.includes(s.id)) {
          return {
            ...s,
            color: strokeColor,
            fillColor: fillColor,
            lineWidth: lineWidth,
            sides: polygonSides,
            lineStyle: lineStyle
          };
        }
        return s;
      });
      
      // Only set and save if there's an actual difference
      const hasChanged = JSON.stringify(shapes) !== JSON.stringify(updated);
      if (hasChanged) {
        setShapes(updated);
        saveToHistory(updated);
      }
    }
  }, [strokeColor, fillColor, lineWidth, polygonSides, lineStyle]);

  // Set values when first selected shape changes (load properties to sidebar)
  useEffect(() => {
    if (selectedShapeIds.length > 0) {
      const shape = shapes.find(s => s.id === selectedShapeIds[0]);
      if (shape) {
        setStrokeColor(shape.color);
        setFillColor(shape.fillColor);
        setLineWidth(shape.lineWidth);
        if (shape.sides) setPolygonSides(shape.sides);
        if (shape.lineStyle) setLineStyle(shape.lineStyle);
      }
    }
  }, [selectedShapeIds]);

  // Callback ref for context initialization
  const onCanvasMount = React.useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) {
      canvasRef.current = null;
      contextRef.current = null;
      return;
    }
    canvasRef.current = canvas;
    canvas.width = 600;
    canvas.height = 400;
    
    const context = canvas.getContext('2d');
    if (!context) return;
    
    context.lineCap = 'round';
    context.lineJoin = 'round';
    contextRef.current = context;

    // Redraw on mount
    redrawCanvas();
  }, [shapes, activeShape, selectedShapeIds, selectionBox]);

  // Bounding box calculations
  const getShapeBounds = (shape: Shape) => {
    let minX = Math.min(shape.startX, shape.endX);
    let maxX = Math.max(shape.startX, shape.endX);
    let minY = Math.min(shape.startY, shape.endY);
    let maxY = Math.max(shape.startY, shape.endY);

    if (shape.type === 'pencil' || shape.type === 'eraser') {
      if (shape.points && shape.points.length > 0) {
        const xs = shape.points.map(p => p.x);
        const ys = shape.points.map(p => p.y);
        minX = Math.min(...xs);
        maxX = Math.max(...xs);
        minY = Math.min(...ys);
        maxY = Math.max(...ys);
      }
    } else if (shape.type === 'circle' || shape.type === 'polygon' || shape.type === 'star' || shape.type === 'crescent' || shape.type === 'sun' || shape.type === 'triangle-equilateral' || shape.type === 'semicircle') {
      const radius = Math.sqrt(Math.pow(shape.startX - shape.endX, 2) + Math.pow(shape.startY - shape.endY, 2));
      minX = shape.startX - radius;
      maxX = shape.startX + radius;
      minY = shape.startY - radius;
      maxY = shape.startY + radius;
    } else if (shape.type === 'text') {
      minX = shape.startX - 5;
      maxX = shape.startX + (shape.text ? shape.text.length * shape.lineWidth * 3.5 : 80);
      minY = shape.startY - shape.lineWidth * 3;
      maxY = shape.startY + shape.lineWidth * 3;
    }

    return { minX, maxX, minY, maxY };
  };

  const drawSelectionOverlay = (ctx: CanvasRenderingContext2D, shape: Shape, showHandles: boolean) => {
    const { minX, maxX, minY, maxY } = getShapeBounds(shape);
    const width = maxX - minX;
    const height = maxY - minY;

    ctx.save();
    
    // If shape is rotated, apply rotation to selection bounds visual overlay as well!
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    ctx.translate(cx, cy);
    if (shape.rotation) {
      ctx.rotate((shape.rotation * Math.PI) / 180);
    }
    ctx.translate(-cx, -cy);

    // Bounding Box Dashed Line
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(minX - 6, minY - 6, width + 12, height + 12);

    // Bounding corners resize handle (bottom-right)
    if (showHandles) {
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(maxX + 6, maxY + 6, 6, 0, 2 * Math.PI);
      ctx.fill();
    }
    ctx.restore();
  };

  // Find shape containing point (checking top-down)
  const findShapeAtPoint = (x: number, y: number): string | null => {
    for (let i = shapes.length - 1; i >= 0; i--) {
      const shape = shapes[i];
      const { minX, maxX, minY, maxY } = getShapeBounds(shape);
      if (x >= minX - 10 && x <= maxX + 10 && y >= minY - 10 && y <= maxY + 10) {
        return shape.id;
      }
    }
    return null;
  };

  // Coordinate calculations
  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    const offsetX = e.nativeEvent.offsetX !== undefined ? e.nativeEvent.offsetX : (e.clientX - rect.left);
    const offsetY = e.nativeEvent.offsetY !== undefined ? e.nativeEvent.offsetY : (e.clientY - rect.top);
    
    let x = (offsetX / rect.width) * canvas.width;
    let y = (offsetY / rect.height) * canvas.height;

    // Snap to grid if enabled (20px intervals)
    if (snapToGrid) {
      const gridSize = 20;
      x = Math.round(x / gridSize) * gridSize;
      y = Math.round(y / gridSize) * gridSize;
    }

    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { x, y } = getCoordinates(e);
    setIsInteracting(true);

    if (tool === 'select') {
      // 1. Check resize handle first (only valid when exactly ONE shape is selected)
      if (selectedShapeIds.length === 1) {
        const shape = shapes.find(s => s.id === selectedShapeIds[0]);
        if (shape) {
          const { maxX, maxY } = getShapeBounds(shape);
          const distToHandle = Math.sqrt(Math.pow(x - (maxX + 6), 2) + Math.pow(y - (maxY + 6), 2));
          
          if (distToHandle <= 15) {
            setDragMode('resize');
            setDragStartMouseX(x);
            setDragStartMouseY(y);
            setShapeDragOffset({ startX: shape.startX, startY: shape.startY, endX: shape.endX, endY: shape.endY });
            setShapePointsOffset(shape.points ? [...shape.points] : []);
            return;
          }
        }
      }

      // 2. Check if clicked inside a shape
      const clickedId = findShapeAtPoint(x, y);
      
      if (clickedId) {
        let newSelection = [...selectedShapeIds];
        
        if (e.shiftKey) {
          // Shift toggles selection
          if (newSelection.includes(clickedId)) {
            newSelection = newSelection.filter(id => id !== clickedId);
          } else {
            newSelection.push(clickedId);
          }
        } else {
          // If clicked shape is NOT already selected, select it solely.
          // If it IS already selected, keep current selection to allow dragging multiple objects.
          if (!newSelection.includes(clickedId)) {
            newSelection = [clickedId];
          }
        }
        
        setSelectedShapeIds(newSelection);
        setDragMode('move');
        setDragStartMouseX(x);
        setDragStartMouseY(y);
        
        // Record starting offsets for all selected shapes for multi-dragging
        const offsets = shapes
          .filter(s => newSelection.includes(s.id))
          .map(s => ({
            id: s.id,
            startX: s.startX,
            startY: s.startY,
            endX: s.endX,
            endY: s.endY,
            points: s.points ? [...s.points] : []
          }));
        setMultiDragOffsets(offsets);
      } else {
        // Clicked on empty space: start selection box dragging (block select)
        if (!e.shiftKey) {
          setSelectedShapeIds([]);
        }
        setDragMode('select-box');
        setDragStartMouseX(x);
        setDragStartMouseY(y);
        setSelectionBox({ startX: x, startY: y, endX: x, endY: y });
      }
    } else {
      // Create new shape template
      const newShape: Shape = {
        id: `shape-${Math.random().toString(36).substring(2)}-${Date.now()}`,
        type: tool,
        startX: x,
        startY: y,
        endX: x,
        endY: y,
        color: strokeColor,
        fillColor: fillColor,
        lineWidth: lineWidth,
        sides: polygonSides,
        lineStyle: lineStyle,
        points: (tool === 'pencil' || tool === 'eraser') ? [{ x, y }] : []
      };

      if (tool === 'text') {
        if (textInput.trim() === '') {
          toast.warning('Ketik isi teks terlebih dahulu di sidebar!');
          setIsInteracting(false);
          return;
        }
        newShape.text = textInput;
        setTextInput('');
        setShapes(prev => {
          const updated = [...prev, newShape];
          saveToHistory(updated);
          return updated;
        });
        setIsInteracting(false);
      } else {
        setActiveShape(newShape);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInteracting) return;
    const { x, y } = getCoordinates(e);

    if (tool === 'select') {
      const dx = x - dragStartMouseX;
      const dy = y - dragStartMouseY;

      if (dragMode === 'move' && selectedShapeIds.length > 0) {
        // Move all selected shapes together
        setShapes(prev => prev.map(s => {
          const offset = multiDragOffsets.find(o => o.id === s.id);
          if (!offset) return s;

          const updated = {
            ...s,
            startX: offset.startX + dx,
            startY: offset.startY + dy,
            endX: offset.endX + dx,
            endY: offset.endY + dy,
          };
          if (s.points && offset.points.length > 0) {
            updated.points = offset.points.map(p => ({ x: p.x + dx, y: p.y + dy }));
          }
          return updated;
        }));
      } else if (dragMode === 'resize' && selectedShapeIds.length === 1) {
        // Resize only the single selected shape
        setShapes(prev => prev.map(s => {
          if (s.id !== selectedShapeIds[0]) return s;

          const width = shapeDragOffset.endX - shapeDragOffset.startX;
          const height = shapeDragOffset.endY - shapeDragOffset.startY;
          
          const newWidth = shapeDragOffset.endX - shapeDragOffset.startX + dx;
          const newHeight = shapeDragOffset.endY - shapeDragOffset.startY + dy;

          const scaleX = width === 0 ? 1 : newWidth / width;
          const scaleY = height === 0 ? 1 : newHeight / height;

          const updated = {
            ...s,
            endX: shapeDragOffset.endX + dx,
            endY: shapeDragOffset.endY + dy
          };

          if (s.points && shapePointsOffset.length > 0) {
            updated.points = shapePointsOffset.map(p => ({
              x: s.startX + (p.x - s.startX) * scaleX,
              y: s.startY + (p.y - s.startY) * scaleY
            }));
          }
          return updated;
        }));
      } else if (dragMode === 'select-box') {
        // Update selection box bounds
        setSelectionBox(prev => {
          if (!prev) return null;
          return {
            ...prev,
            endX: x,
            endY: y
          };
        });
      }
    } else if (activeShape) {
      if (tool === 'pencil' || tool === 'eraser') {
        setActiveShape(prev => {
          if (!prev) return null;
          return {
            ...prev,
            points: [...(prev.points || []), { x, y }]
          };
        });
      } else {
        setActiveShape(prev => {
          if (!prev) return null;
          return {
            ...prev,
            endX: x,
            endY: y
          };
        });
      }
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isInteracting) return;
    setIsInteracting(false);

    if (tool === 'select') {
      if (dragMode === 'select-box' && selectionBox) {
        // Calculate block selection intersection
        const xMin = Math.min(selectionBox.startX, selectionBox.endX);
        const xMax = Math.max(selectionBox.startX, selectionBox.endX);
        const yMin = Math.min(selectionBox.startY, selectionBox.endY);
        const yMax = Math.max(selectionBox.startY, selectionBox.endY);

        const width = xMax - xMin;
        const height = yMax - yMin;

        // If it was just a tiny click, selection is already handled by mousedown.
        // Otherwise, find all intersecting shapes:
        if (width >= 4 || height >= 4) {
          const newlySelected: string[] = [];
          shapes.forEach(shape => {
            const { minX, maxX, minY, maxY } = getShapeBounds(shape);
            const intersects = !(maxX < xMin || minX > xMax || maxY < yMin || minY > yMax);
            if (intersects) {
              newlySelected.push(shape.id);
            }
          });
          
          if (e.shiftKey) {
            // Add unique IDs to current selection
            setSelectedShapeIds(prev => Array.from(new Set([...prev, ...newlySelected])));
          } else {
            setSelectedShapeIds(newlySelected);
          }
        }
        setSelectionBox(null);
      }
      setDragMode('none');
      saveToHistory(shapes);
    } else if (activeShape) {
      setShapes(prev => {
        const updated = [...prev, activeShape];
        saveToHistory(updated);
        return updated;
      });
      setActiveShape(null);
    }
  };

  const handleUndo = () => {
    if (history.length <= 1) {
      setShapes([]);
      setHistory([]);
      setSelectedShapeIds([]);
      return;
    }
    const newHistory = [...history];
    newHistory.pop(); // Remove current shapes layout
    const prevState = newHistory[newHistory.length - 1] || [];
    setShapes(prevState);
    setHistory(newHistory);
    setSelectedShapeIds([]);
  };

  const handleClear = () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua gambar di kanvas?')) {
      setShapes([]);
      setSelectedShapeIds([]);
      saveToHistory([]);
    }
  };

  const handleDeleteSelected = () => {
    if (selectedShapeIds.length > 0) {
      const updated = shapes.filter(s => !selectedShapeIds.includes(s.id));
      setShapes(updated);
      setSelectedShapeIds([]);
      saveToHistory(updated);
      toast.success(`${selectedShapeIds.length} elemen berhasil dihapus.`);
    }
  };

  const handleCopy = () => {
    if (selectedShapeIds.length > 0) {
      const selected = shapes.filter(s => selectedShapeIds.includes(s.id));
      setCopiedShapes(selected);
      toast.success(`${selected.length} elemen disalin.`);
    }
  };

  const handlePaste = () => {
    if (copiedShapes.length > 0) {
      const pastedShapes: Shape[] = copiedShapes.map(s => {
        const newId = `shape-${Math.random().toString(36).substring(2)}-${Date.now()}`;
        const pasted: Shape = {
          ...s,
          id: newId,
          startX: s.startX + 25,
          startY: s.startY + 25,
          endX: s.endX + 25,
          endY: s.endY + 25,
        };
        if (s.points) {
          pasted.points = s.points.map(p => ({ x: p.x + 25, y: p.y + 25 }));
        }
        return pasted;
      });

      setShapes(prev => {
        const updated = [...prev, ...pastedShapes];
        saveToHistory(updated);
        return updated;
      });
      setSelectedShapeIds(pastedShapes.map(s => s.id)); // auto-select newly pasted shapes
      toast.success(`${pastedShapes.length} elemen ditempel.`);
    }
  };

  const handleDuplicate = () => {
    if (selectedShapeIds.length > 0) {
      const duplicates: Shape[] = shapes
        .filter(s => selectedShapeIds.includes(s.id))
        .map(s => {
          const newId = `shape-${Math.random().toString(36).substring(2)}-${Date.now()}`;
          const duplicated: Shape = {
            ...s,
            id: newId,
            startX: s.startX + 25,
            startY: s.startY + 25,
            endX: s.endX + 25,
            endY: s.endY + 25,
          };
          if (s.points) {
            duplicated.points = s.points.map(p => ({ x: p.x + 25, y: p.y + 25 }));
          }
          return duplicated;
        });

      setShapes(prev => {
        const updated = [...prev, ...duplicates];
        saveToHistory(updated);
        return updated;
      });
      setSelectedShapeIds(duplicates.map(s => s.id));
      toast.success(`${duplicates.length} elemen diduplikasi.`);
    }
  };

  const handleFlipHorizontal = () => {
    if (selectedShapeIds.length > 0) {
      const updated = shapes.map(s => {
        if (selectedShapeIds.includes(s.id)) {
          return { ...s, flippedH: !s.flippedH };
        }
        return s;
      });
      setShapes(updated);
      saveToHistory(updated);
      toast.success('Elemen dibalik secara horisontal.');
    }
  };

  const handleFlipVertical = () => {
    if (selectedShapeIds.length > 0) {
      const updated = shapes.map(s => {
        if (selectedShapeIds.includes(s.id)) {
          return { ...s, flippedV: !s.flippedV };
        }
        return s;
      });
      setShapes(updated);
      saveToHistory(updated);
      toast.success('Elemen dibalik secara vertikal.');
    }
  };

  const handleRotateChange = (deg: number) => {
    if (selectedShapeIds.length > 0) {
      const updated = shapes.map(s => {
        if (selectedShapeIds.includes(s.id)) {
          return { ...s, rotation: deg };
        }
        return s;
      });
      setShapes(updated);
    }
  };

  const handleRotateChangeEnd = () => {
    saveToHistory(shapes);
  };

  const handleRotate90 = () => {
    if (selectedShapeIds.length > 0) {
      const updated = shapes.map(s => {
        if (selectedShapeIds.includes(s.id)) {
          const currentRot = s.rotation || 0;
          return { ...s, rotation: (currentRot + 90) % 360 };
        }
        return s;
      });
      setShapes(updated);
      saveToHistory(updated);
      toast.success('Elemen diputar 90°.');
    }
  };

  const handleSave = () => {
    if (!canvasRef.current) return;
    
    // De-select any elements before export so selection border is NOT exported inside PNG
    setSelectedShapeIds([]);
    
    // Temporarily turn off grid for clean export
    const wasGridVisible = showGrid;
    if (wasGridVisible) {
      setShowGrid(false);
    }
    
    // Force canvas refresh to hide handles and grid before export
    setTimeout(() => {
      if (!canvasRef.current) return;
      canvasRef.current.toBlob((blob) => {
        if (blob) {
          onSave(blob);
        }
        // Restore grid visibility if it was active
        if (wasGridVisible) {
          setShowGrid(true);
        }
      }, 'image/png');
    }, 120);
  };

  // Keyboard shortcuts (Copy, Paste, Duplicate, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Prevent shortcut trigger when typing in inputs/textareas
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') return;

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;

      if (tool === 'select') {
        if (selectedShapeIds.length > 0 && (e.key === 'Delete' || e.key === 'Backspace')) {
          e.preventDefault();
          handleDeleteSelected();
        } else if (isCtrlOrMeta && e.key.toLowerCase() === 'c') {
          e.preventDefault();
          handleCopy();
        } else if (isCtrlOrMeta && e.key.toLowerCase() === 'v') {
          e.preventDefault();
          handlePaste();
        } else if (isCtrlOrMeta && e.key.toLowerCase() === 'd') {
          e.preventDefault();
          handleDuplicate();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedShapeIds, tool, shapes, copiedShapes]);

  // Actual vector drawing function
  const drawShape = (ctx: CanvasRenderingContext2D, shape: Shape) => {
    ctx.save();

    const { minX, maxX, minY, maxY } = getShapeBounds(shape);
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    // Translate to center of bounding box and apply rotation & flip matrix transformations
    ctx.translate(cx, cy);
    if (shape.rotation) {
      ctx.rotate((shape.rotation * Math.PI) / 180);
    }
    ctx.scale(shape.flippedH ? -1 : 1, shape.flippedV ? -1 : 1);
    ctx.translate(-cx, -cy);

    ctx.lineWidth = shape.lineWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = shape.type === 'eraser' ? '#ffffff' : shape.color;
    ctx.fillStyle = shape.fillColor === 'transparent' ? 'rgba(0,0,0,0)' : shape.fillColor;

    if (shape.lineStyle === 'dashed') {
      ctx.setLineDash([10, 10]);
    } else {
      ctx.setLineDash([]);
    }

    const { startX, startY, endX, endY } = shape;

    if (shape.type === 'pencil' || shape.type === 'eraser') {
      if (!shape.points || shape.points.length === 0) {
        ctx.restore();
        return;
      }
      ctx.beginPath();
      ctx.moveTo(shape.points[0].x, shape.points[0].y);
      for (let i = 1; i < shape.points.length; i++) {
        ctx.lineTo(shape.points[i].x, shape.points[i].y);
      }
      ctx.stroke();
    } else if (shape.type === 'line') {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();
    } else if (shape.type === 'arrow') {
      const angle = Math.atan2(endY - startY, endX - startX);
      const headLength = Math.max(12, shape.lineWidth * 3);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = shape.color;
      ctx.fill();
    } else if (shape.type === 'arrow-double') {
      const angle = Math.atan2(endY - startY, endX - startX);
      const headLength = Math.max(12, shape.lineWidth * 3);
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      // End arrowhead (at endX, endY)
      ctx.beginPath();
      ctx.moveTo(endX, endY);
      ctx.lineTo(endX - headLength * Math.cos(angle - Math.PI / 6), endY - headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(endX - headLength * Math.cos(angle + Math.PI / 6), endY - headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = shape.color;
      ctx.fill();

      // Start arrowhead (at startX, startY)
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(startX + headLength * Math.cos(angle - Math.PI / 6), startY + headLength * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(startX + headLength * Math.cos(angle + Math.PI / 6), startY + headLength * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fillStyle = shape.color;
      ctx.fill();
    } else if (shape.type === 'arrow-block') {
      const dx = endX - startX;
      const dy = endY - startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 5) {
        const angle = Math.atan2(dy, dx);
        
        // Define dimensions relative to size
        const headLength = Math.min(dist * 0.4, 40);
        const headWidth = Math.min(dist * 0.3, 30);
        const shaftWidth = Math.min(dist * 0.12, 12);
        
        // Calculations for base of arrowhead
        const bx = endX - headLength * Math.cos(angle);
        const by = endY - headLength * Math.sin(angle);
        
        // Normal vector for width offsets
        const nx = -Math.sin(angle);
        const ny = Math.cos(angle);
        
        // Vertices
        const p1x = startX + shaftWidth * nx;
        const p1y = startY + shaftWidth * ny;
        
        const p2x = bx + shaftWidth * nx;
        const p2y = by + shaftWidth * ny;
        
        const p3x = bx + headWidth * nx;
        const p3y = by + headWidth * ny;
        
        const p4x = endX;
        const p4y = endY;
        
        const p5x = bx - headWidth * nx;
        const p5y = by - headWidth * ny;
        
        const p6x = bx - shaftWidth * nx;
        const p6y = by - shaftWidth * ny;
        
        const p7x = startX - shaftWidth * nx;
        const p7y = startY - shaftWidth * ny;
        
        ctx.beginPath();
        ctx.moveTo(p1x, p1y);
        ctx.lineTo(p2x, p2y);
        ctx.lineTo(p3x, p3y);
        ctx.lineTo(p4x, p4y);
        ctx.lineTo(p5x, p5y);
        ctx.lineTo(p6x, p6y);
        ctx.lineTo(p7x, p7y);
        ctx.closePath();
        
        if (shape.fillColor !== 'transparent') {
          ctx.fill();
        }
        ctx.stroke();
      }
    } else if (shape.type === 'rectangle') {
      ctx.beginPath();
      const rx = Math.min(startX, endX);
      const ry = Math.min(startY, endY);
      const w = Math.abs(startX - endX);
      const h = Math.abs(startY - endY);
      ctx.rect(rx, ry, w, h);
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'trapezium') {
      ctx.beginPath();
      const rx = Math.min(startX, endX);
      const ry = Math.min(startY, endY);
      const w = Math.abs(startX - endX);
      const h = Math.abs(startY - endY);
      
      const topWidth = w * 0.6;
      const topOffset = (w - topWidth) / 2;
      
      ctx.moveTo(rx + topOffset, ry);
      ctx.lineTo(rx + topOffset + topWidth, ry);
      ctx.lineTo(rx + w, ry + h);
      ctx.lineTo(rx, ry + h);
      ctx.closePath();
      
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'rhombus') {
      ctx.beginPath();
      const rx = Math.min(startX, endX);
      const ry = Math.min(startY, endY);
      const w = Math.abs(startX - endX);
      const h = Math.abs(startY - endY);
      
      ctx.moveTo(rx + w / 2, ry);
      ctx.lineTo(rx + w, ry + h / 2);
      ctx.lineTo(rx + w / 2, ry + h);
      ctx.lineTo(rx, ry + h / 2);
      ctx.closePath();
      
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'circle') {
      ctx.beginPath();
      const radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
      ctx.arc(startX, startY, radius, 0, 2 * Math.PI);
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'oval') {
      ctx.beginPath();
      const cx = (startX + endX) / 2;
      const cy = (startY + endY) / 2;
      const rx = Math.abs(startX - endX) / 2;
      const ry = Math.abs(startY - endY) / 2;
      ctx.ellipse(cx, cy, rx, ry, 0, 0, 2 * Math.PI);
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'semioval') {
      ctx.beginPath();
      const cx = (startX + endX) / 2;
      const cy = (startY + endY) / 2;
      const rx = Math.abs(startX - endX) / 2;
      const ry = Math.abs(startY - endY) / 2;
      // Draw top half semi-ellipse
      ctx.ellipse(cx, cy, rx, ry, 0, Math.PI, 0, false);
      ctx.closePath();
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'semicircle') {
      const radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
      ctx.beginPath();
      ctx.arc(startX, startY, radius, -Math.PI / 2, Math.PI / 2, false);
      ctx.closePath();
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'triangle') {
      ctx.beginPath();
      ctx.moveTo(startX + (endX - startX) / 2, startY);
      ctx.lineTo(endX, endY);
      ctx.lineTo(startX, endY);
      ctx.closePath();
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'triangle-equilateral') {
      const radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
      ctx.beginPath();
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        const px = startX + Math.cos(angle) * radius;
        const py = startY + Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'triangle-right') {
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      ctx.lineTo(endX, startY);
      ctx.lineTo(endX, endY);
      ctx.closePath();
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'polygon') {
      const sides = shape.sides || 5;
      const radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
      ctx.beginPath();
      for (let i = 0; i < sides; i++) {
        const angle = (i * 2 * Math.PI) / sides - Math.PI / 2;
        const px = startX + Math.cos(angle) * radius;
        const py = startY + Math.sin(angle) * radius;
        if (i === 0) {
          ctx.moveTo(px, py);
        } else {
          ctx.lineTo(px, py);
        }
      }
      ctx.closePath();
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'star') {
      const radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
      const spikes = shape.sides || 5;
      let rot = Math.PI / 2 * 3;
      const step = Math.PI / spikes;
      // Calculate precise inner radius ratios for geometric stars:
      // - 5 spikes: perfect pentagram (0.382)
      // - 6 spikes: perfect hexagram / two triangles (1/sqrt(3) ≈ 0.577)
      // - 8 spikes: perfect octagram / two squares (cos(45)/cos(22.5) ≈ 0.765)
      let ratio = 0.4;
      if (spikes === 3) ratio = 0.33;
      else if (spikes === 4) ratio = 0.5;
      else if (spikes === 5) ratio = 0.382;
      else if (spikes === 6) ratio = 0.577;
      else if (spikes === 7) ratio = 0.65;
      else if (spikes === 8) ratio = 0.765;
      else ratio = 0.5 + (spikes - 5) * 0.05;
      
      const innerRadius = radius * ratio;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY - radius);
      for (let i = 0; i < spikes; i++) {
        let px = startX + Math.cos(rot) * radius;
        let py = startY + Math.sin(rot) * radius;
        ctx.lineTo(px, py);
        rot += step;

        px = startX + Math.cos(rot) * innerRadius;
        py = startY + Math.sin(rot) * innerRadius;
        ctx.lineTo(px, py);
        rot += step;
      }
      ctx.lineTo(startX, startY - radius);
      ctx.closePath();
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'crescent') {
      const radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
      ctx.beginPath();
      // Outer arc (from top tip -90° to bottom tip +90°)
      ctx.arc(startX, startY, radius, -Math.PI / 2, Math.PI / 2, false);
      // Inner curve (back from bottom tip to top tip)
      ctx.quadraticCurveTo(startX + radius * 0.45, startY, startX, startY - radius);
      ctx.closePath();
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'sun') {
      const radius = Math.sqrt(Math.pow(startX - endX, 2) + Math.pow(startY - endY, 2));
      
      const rays = 8;
      ctx.beginPath();
      for (let i = 0; i < rays; i++) {
        const angle = (i * 2 * Math.PI) / rays;
        const startXRay = startX + Math.cos(angle) * (radius * 0.75);
        const startYRay = startY + Math.sin(angle) * (radius * 0.75);
        const endXRay = startX + Math.cos(angle) * (radius * 1.1);
        const endYRay = startY + Math.sin(angle) * (radius * 1.1);
        ctx.moveTo(startXRay, startYRay);
        ctx.lineTo(endXRay, endYRay);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(startX, startY, radius * 0.6, 0, 2 * Math.PI);
      if (shape.fillColor !== 'transparent') {
        ctx.fill();
      }
      ctx.stroke();
    } else if (shape.type === 'text') {
      ctx.fillStyle = shape.color;
      ctx.font = `bold ${shape.lineWidth * 5}px sans-serif`;
      ctx.textBaseline = 'middle';
      ctx.fillText(shape.text || '', startX, startY);
    }
    ctx.restore();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        {...{
          onInteractOutside: (e: any) => e.preventDefault(),
          onEscapeKeyDown: (e: any) => e.preventDefault(),
        } as any}
        className="sm:max-w-5xl lg:max-w-6xl bg-card border border-border shadow-2xl rounded-3xl overflow-hidden p-0 gap-0"
      >
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
          <DialogTitle className="text-base font-extrabold text-foreground flex items-center gap-2">
            <Edit3 className="h-5 w-5 text-indigo-500" /> {title}
          </DialogTitle>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Workspace Body */}
        <div className="grid grid-cols-1 md:grid-cols-4 h-[530px]">
          
          {/* Left Control Panel / Toolbar */}
          <div className="md:col-span-1 border-r border-border p-4 bg-muted/10 space-y-4 overflow-y-auto h-full shrink-0">
            
            {/* Selection Tool */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Kursor / Pilih</Label>
              <Button
                type="button"
                variant={tool === 'select' ? 'default' : 'outline'}
                onClick={() => setTool('select')}
                className={`h-9 text-xs font-bold flex items-center gap-2 justify-start px-3 rounded-lg border-border w-full ${
                  tool === 'select' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-background hover:bg-muted text-foreground'
                }`}
              >
                <MousePointer className="h-4 w-4 shrink-0" />
                Pilih & Blok Objek
              </Button>
              <p className="text-[10px] text-slate-500 leading-snug">Drag pada area kosong untuk memblok / memilih beberapa objek sekaligus secara bersamaan.</p>
            </div>

            {/* Shapes / Drawing Tools */}
            <div className="space-y-2 pt-2 border-t border-border/40">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Pilih Gambar Bentuk</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { id: 'pencil', label: 'Pensil', icon: Edit3 },
                  { id: 'line', label: 'Garis', icon: Minimize2 },
                  { id: 'arrow', label: 'Panah', icon: ArrowRight },
                  { id: 'arrow-double', label: 'Panah 2 Arah', icon: ArrowLeftRight },
                  { id: 'arrow-block', label: 'Panah Tebal', icon: ArrowRight },
                  { id: 'rectangle', label: 'Kotak', icon: Square },
                  { id: 'trapezium', label: 'Trapesium', icon: Square },
                  { id: 'rhombus', label: 'B. Ketupat', icon: Diamond },
                  { id: 'circle', label: 'Lingkaran', icon: Circle },
                  { id: 'oval', label: 'Oval', icon: Circle },
                  { id: 'semicircle', label: '1/2 Lingkaran', icon: Circle },
                  { id: 'semioval', label: '1/2 Oval', icon: Circle },
                  { id: 'triangle', label: 'S. Sama Kaki', icon: Triangle },
                  { id: 'triangle-equilateral', label: 'S. Sama Sisi', icon: Triangle },
                  { id: 'triangle-right', label: 'S. Siku-Siku', icon: Triangle },
                  { id: 'polygon', label: 'Segi Banyak', icon: Hexagon },
                  { id: 'star', label: 'Bintang', icon: Star },
                  { id: 'crescent', label: 'Bulan Sabit', icon: Moon },
                  { id: 'sun', label: 'Matahari', icon: Sun },
                  { id: 'text', label: 'Teks', icon: Type },
                  { id: 'eraser', label: 'Penghapus', icon: Eraser },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = tool === t.id;
                  return (
                    <Button
                      key={t.id}
                      type="button"
                      variant={isActive ? 'default' : 'outline'}
                      onClick={() => {
                        setTool(t.id as Tool);
                        setSelectedShapeIds([]); // de-select when shifting to draw tools
                      }}
                      className={`h-8 text-[10px] font-extrabold flex items-center gap-1 justify-start px-2 rounded-lg border-border w-full ${
                        isActive ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-background hover:bg-muted text-foreground'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{t.label}</span>
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Customizations */}
            <div className="space-y-4 pt-3 border-t border-border/60">
              
              {tool === 'select' && selectedShapeIds.length > 0 && (
                <div className="space-y-2 p-2 bg-indigo-500/5 border border-indigo-500/20 rounded-xl animate-fade-in flex flex-col gap-1.5">
                  <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400">
                    {selectedShapeIds.length} Elemen Terpilih
                  </span>
                  
                  {/* Copy & Delete */}
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDuplicate}
                      className="h-8 flex-1 border-indigo-500/30 hover:bg-indigo-500/10 text-indigo-600 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1"
                    >
                      <Copy className="h-3 w-3" /> Duplikat
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteSelected}
                      className="h-8 flex-1 border-rose-500/30 hover:border-rose-500/50 hover:bg-rose-500/5 text-rose-600 font-bold text-[10px] rounded-lg flex items-center justify-center gap-1"
                    >
                      <Trash2 className="h-3 w-3" /> Hapus
                    </Button>
                  </div>

                  {/* Mirroring / Flipping shapes */}
                  <div className="flex gap-1.5 pt-1 border-t border-indigo-500/10">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFlipHorizontal}
                      className="h-8 flex-1 border-border bg-background hover:bg-muted text-foreground font-bold text-[10px] rounded-lg flex items-center justify-center gap-1"
                      title="Balik Horisontal"
                    >
                      <FlipHorizontal className="h-3.5 w-3.5" /> Cermin H
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleFlipVertical}
                      className="h-8 flex-1 border-border bg-background hover:bg-muted text-foreground font-bold text-[10px] rounded-lg flex items-center justify-center gap-1"
                      title="Balik Vertikal"
                    >
                      <FlipVertical className="h-3.5 w-3.5" /> Cermin V
                    </Button>
                  </div>

                  {/* Rotation control */}
                  <div className="flex flex-col gap-1.5 pt-1.5 border-t border-indigo-500/10">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground flex items-center gap-1">
                        <RotateCw className="h-3 w-3 animate-spin-slow" /> Rotasi Objek
                      </span>
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={handleRotate90}
                        className="h-5 px-1.5 text-[9px] font-extrabold text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50/50"
                      >
                        +90°
                      </Button>
                    </div>
                    <div className="flex items-center gap-3">
                      <input 
                        type="range" 
                        min="0" 
                        max="360" 
                        value={shapes.find(s => s.id === selectedShapeIds[0])?.rotation || 0} 
                        onChange={(e) => handleRotateChange(Number(e.target.value))}
                        onMouseUp={handleRotateChangeEnd}
                        onTouchEnd={handleRotateChangeEnd}
                        className="flex-1 h-1 bg-muted rounded appearance-none cursor-pointer accent-indigo-600"
                      />
                      <div className="flex items-center gap-1 shrink-0">
                        <input
                          type="number"
                          min="0"
                          max="360"
                          value={shapes.find(s => s.id === selectedShapeIds[0])?.rotation || 0}
                          onChange={(e) => {
                            let val = Number(e.target.value);
                            if (val < 0) val = 0;
                            if (val > 360) val = 360;
                            handleRotateChange(val);
                          }}
                          onBlur={handleRotateChangeEnd}
                          className="w-12 h-6 text-center text-xs font-bold border border-border bg-background rounded-md focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <span className="text-[10px] font-extrabold text-muted-foreground">°</span>
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Stroke thickness */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Ketebalan Garis / Font</Label>
                <div className="flex items-center gap-3">
                  <input 
                    type="range" 
                    min="1" 
                    max="15" 
                    value={lineWidth} 
                    onChange={(e) => setLineWidth(Number(e.target.value))}
                    className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <span className="text-xs font-bold text-foreground w-4 text-right">{lineWidth}</span>
                </div>
              </div>

              {/* Stroke style */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Gaya Garis Tepi</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={lineStyle === 'solid' ? 'default' : 'outline'}
                    onClick={() => setLineStyle('solid')}
                    className={`h-8 text-xs font-extrabold flex-1 border-border rounded-lg ${
                      lineStyle === 'solid' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    Biasa
                  </Button>
                  <Button
                    type="button"
                    variant={lineStyle === 'dashed' ? 'default' : 'outline'}
                    onClick={() => setLineStyle('dashed')}
                    className={`h-8 text-xs font-extrabold flex-1 border-border rounded-lg ${
                      lineStyle === 'dashed' ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-background hover:bg-muted text-foreground'
                    }`}
                  >
                    Putus-putus
                  </Button>
                </div>
              </div>

              {/* Stroke color */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Warna Garis & Teks</Label>
                <div className="flex gap-1.5 flex-wrap">
                  {['#000000', '#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setStrokeColor(color)}
                      style={{ backgroundColor: color }}
                      className={`h-6 w-6 rounded-full border transition-all ${
                        strokeColor === color ? 'ring-2 ring-indigo-500 border-slate-400 scale-110' : 'border-border hover:scale-105'
                      }`}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={strokeColor} 
                    onChange={(e) => setStrokeColor(e.target.value)}
                    className="h-6 w-6 rounded-full border border-border cursor-pointer p-0 overflow-hidden"
                  />
                </div>
              </div>

              {/* Fill color */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-muted-foreground">Warna Isi (Fill)</Label>
                <div className="flex gap-1.5 flex-wrap items-center">
                  <button
                    type="button"
                    onClick={() => setFillColor('transparent')}
                    className={`h-6 w-6 rounded-full border text-[10px] font-black text-rose-500 flex items-center justify-center bg-background border-border transition-all ${
                      fillColor === 'transparent' ? 'ring-2 ring-indigo-500 scale-110' : 'hover:bg-muted'
                    }`}
                  >
                    X
                  </button>
                  {['#000000', '#FFFFFF', '#FEE2E2', '#DBEAFE', '#D1FAE5', '#FEF3C7', '#EDE9FE'].map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFillColor(color)}
                      style={{ backgroundColor: color }}
                      className={`h-6 w-6 rounded-full border transition-all ${
                        fillColor === color ? 'ring-2 ring-indigo-500 border-white scale-110' : 'border-border hover:scale-105'
                      }`}
                    />
                  ))}
                  <input 
                    type="color" 
                    value={fillColor === 'transparent' ? '#ffffff' : fillColor} 
                    onChange={(e) => setFillColor(e.target.value)}
                    className="h-6 w-6 rounded-full border border-border cursor-pointer p-0 overflow-hidden"
                  />
                </div>
              </div>

              {/* Text Tool Inputs */}
              {tool === 'text' && (
                <div className="space-y-1.5 pt-2 border-t border-border/40 animate-fade-in">
                  <Label htmlFor="draw-text" className="text-xs font-bold text-muted-foreground">Isi Label Teks</Label>
                  <Input
                    id="draw-text"
                    type="text"
                    placeholder="Ketik teks lalu klik kanvas..."
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    className="h-8 text-xs bg-background border-border"
                  />
                  <p className="text-[10px] text-slate-500 leading-snug">Ketik teks di atas, lalu klik di lokasi kanvas tempat Anda ingin meletakkan teks.</p>
                </div>
              )}

              {/* Polygon / Star sides count slider */}
              {(tool === 'polygon' || tool === 'star') && (
                <div className="space-y-1.5 pt-2 border-t border-border/40 animate-fade-in">
                  <Label htmlFor="polygon-sides" className="text-xs font-bold text-muted-foreground">
                    {tool === 'star' ? 'Jumlah Sudut Bintang' : 'Jumlah Sudut Segi-N'}
                  </Label>
                  <div className="flex items-center gap-3">
                    <input 
                      id="polygon-sides"
                      type="range" 
                      min={tool === 'star' ? "3" : "3"} 
                      max="12" 
                      value={polygonSides} 
                      onChange={(e) => setPolygonSides(Number(e.target.value))}
                      className="w-full h-1.5 bg-muted rounded-lg appearance-none cursor-pointer accent-indigo-600"
                    />
                    <span className="text-xs font-bold text-foreground w-4 text-right">{polygonSides}</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-snug">
                    {tool === 'star' 
                      ? 'Geser untuk mengubah jumlah sudut bintang (bintang bersudut 5, 8, dll.).' 
                      : 'Geser untuk mengubah jumlah sudut (segi-5, segi-6, segi-8, dll.).'}
                  </p>
                </div>
              )}

            </div>

          </div>

          {/* Right Drawing Canvas Workspace */}
          <div className="md:col-span-3 p-6 flex flex-col justify-between bg-muted/5 items-center h-full overflow-y-auto">
            
            {/* Canvas Area Container */}
            <div className="w-full flex-1 flex items-center justify-center p-2">
              <div className="border-2 border-dashed border-border rounded-2xl overflow-hidden bg-white shadow-md flex items-center justify-center w-full max-w-[600px] aspect-[3/2]">
                <canvas
                  ref={onCanvasMount}
                  width={600}
                  height={400}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  className="cursor-crosshair bg-white w-full h-full block"
                />
              </div>
            </div>

            {/* Undo & Clear Buttons toolbar */}
            <div className="flex gap-3 justify-center items-center mt-4 w-full border-t border-border/60 pt-4 flex-wrap">
              
              {/* Grid & Snap Toggles */}
              <div className="flex items-center gap-4 mr-auto">
                <label className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showGrid}
                    onChange={(e) => setShowGrid(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                  Tampilkan Grid
                </label>
                <label className="flex items-center gap-2 text-xs font-extrabold text-muted-foreground cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={snapToGrid}
                    onChange={(e) => setSnapToGrid(e.target.checked)}
                    className="h-4 w-4 rounded border-border text-indigo-600 focus:ring-indigo-500 accent-indigo-600 cursor-pointer"
                  />
                  Paskan ke Grid (Snap)
                </label>
              </div>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUndo}
                className="h-9 px-4 rounded-lg font-bold border-border bg-background hover:bg-muted text-foreground flex items-center gap-1.5"
              >
                <Undo className="h-4 w-4" /> Undo
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="h-9 px-4 rounded-lg font-bold border-border bg-background hover:text-rose-600 hover:bg-rose-500/5 text-foreground flex items-center gap-1.5"
              >
                <Trash2 className="h-4 w-4" /> Bersihkan Kanvas
              </Button>
            </div>

          </div>

        </div>

        {/* Footer */}
        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 flex items-center justify-end gap-2.5">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="font-bold border-border bg-background hover:bg-muted"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 flex items-center gap-2 rounded-xl"
          >
            <Save className="h-4 w-4" /> Simpan Gambar ke Formulir
          </Button>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
