import React, { useState, useEffect, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  rectSortingStrategy,
  useSortable,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ---------------- TYPES ----------------
interface TileProps {
  id: number;
  image: string;
  grid: number;
  boardSize: number;
  isDraggingAny: boolean;
}

// ---------------- MAIN ----------------
const Puzzle = () => {
  const [grid, setGrid] = useState(3);
  const [boardSize, setBoardSize] = useState(380);
  const [image, setImage] = useState<string | null>(null);
  const [tiles, setTiles] = useState<number[]>([]);
  const [time, setTime] = useState(0);
  const [moves, setMoves] = useState(0);
  const [solved, setSolved] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  // ---------------- RESPONSIVE ----------------
  useEffect(() => {
    const resize = () => {
      const w = window.innerWidth;
      if (w < 400) setBoardSize(300);
      else if (w < 768) setBoardSize(340);
      else setBoardSize(420);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, []);

  // ---------------- TIMER ----------------
  useEffect(() => {
    let interval: any;
    if (image && !solved) {
      interval = setInterval(() => setTime((t) => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [image, solved]);

  // ---------------- SENSORS (MOBILE + DESKTOP) ----------------
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ---------------- DRAG ----------------
  const handleDragStart = (event: any) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) return;

    setTiles((items) => {
      const oldIndex = items.indexOf(active.id);
      const newIndex = items.indexOf(over.id);
      const newArr = arrayMove(items, oldIndex, newIndex);

      setMoves((m) => m + 1);

      if (newArr.every((id, index) => id === index)) {
        setSolved(true);
      }

      return newArr;
    });
  };

  // ---------------- START GAME ----------------
  const startGame = useCallback(
    (img: string, g = grid) => {
      const arr = Array.from({ length: g * g }, (_, i) => i);
      let shuffled = [...arr].sort(() => Math.random() - 0.5);

      while (shuffled.every((v, i) => v === i)) {
        shuffled = [...arr].sort(() => Math.random() - 0.5);
      }

      setTiles(shuffled);
      setImage(img);
      setTime(0);
      setMoves(0);
      setSolved(false);
    },
    [grid]
  );

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      startGame(url);
    }
  };

  const changeGrid = (g: number) => {
    setGrid(g);
    if (image) startGame(image, g);
  };

  // ---------------- UI ----------------
  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">

      {/* TITLE */}
      <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight bg-gradient-to-r from-white to-gray-500 bg-clip-text text-transparent">
        Puzzle Engine
      </h1>

      {/* GRID SELECT */}
      <div className="flex gap-2 mb-6">
        {[3, 4, 6, 8].map((g) => (
          <button
            key={g}
            onClick={() => changeGrid(g)}
            className={`px-3 py-1 rounded-full text-sm font-bold border ${
              grid === g
                ? "bg-white text-black"
                : "border-gray-600 text-gray-400"
            }`}
          >
            {g}x{g}
          </button>
        ))}
      </div>

      {/* UPLOAD */}
      {!image ? (
        <label className="border border-gray-700 px-6 py-10 rounded-xl cursor-pointer hover:border-white transition">
          Upload Image
          <input type="file" hidden onChange={handleUpload} />
        </label>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8 items-center">

          {/* GAME BOARD */}
          <div className="flex flex-col items-center">
            <div className="flex gap-6 mb-2 text-sm text-gray-400">
              <span>⏱ {time}s</span>
              <span>🎯 {moves}</span>
            </div>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={tiles} strategy={rectSortingStrategy}>
                <div
                  className="grid gap-1 bg-white/5 p-1 rounded-xl"
                  style={{
                    width: boardSize,
                    height: boardSize,
                    gridTemplateColumns: `repeat(${grid}, 1fr)`,
                  }}
                >
                  {tiles.map((id) => (
                    <Tile
                      key={id}
                      id={id}
                      image={image}
                      grid={grid}
                      boardSize={boardSize}
                      isDraggingAny={activeId !== null}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            <button
              onClick={() => startGame(image)}
              className="mt-4 px-4 py-2 bg-white text-black rounded-full text-sm font-bold"
            >
              Reset
            </button>
          </div>

          {/* PREVIEW */}
          <div className="flex flex-col items-center">
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="mb-3 text-xs text-gray-400"
            >
              {showPreview ? "Hide Preview" : "Show Preview"}
            </button>

            {showPreview && (
              <div
                className="border border-gray-700 rounded-xl"
                style={{
                  width: 220,
                  height: 220,
                  backgroundImage: `url(${image})`,
                  backgroundSize: "contain",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
              />
            )}
          </div>
        </div>
      )}

      {/* SOLVED SCREEN */}
      {solved && (
        <div className="fixed inset-0 bg-black/90 flex flex-col items-center justify-center text-center">
          <h2 className="text-4xl font-bold mb-4">🎉 Solved!</h2>
          <p className="text-gray-400 mb-6">
            Time: {time}s | Moves: {moves}
          </p>
          <button
            onClick={() => startGame(image!)}
            className="px-6 py-3 bg-white text-black rounded-full font-bold"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
};

// ---------------- TILE ----------------
function Tile({ id, image, grid, boardSize, isDraggingAny }: TileProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id });

  const size = boardSize / grid;

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    transition,
    width: size,
    height: size,
    touchAction: "none", // ✅ IMPORTANT FOR MOBILE
  };

  const row = Math.floor(id / grid);
  const col = id % grid;

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={style}
      className={`overflow-hidden rounded-md border ${
        isDragging ? "scale-110 z-50" : ""
      } ${!isDragging && isDraggingAny ? "opacity-50" : ""}`}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundImage: `url(${image})`,
          backgroundSize: `${boardSize}px ${boardSize}px`,
          backgroundPosition: `-${col * size}px -${row * size}px`,
          backgroundRepeat: "no-repeat",
        }}
      />
    </div>
  );
}

export default Puzzle;