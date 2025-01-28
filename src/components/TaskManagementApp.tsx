import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const generateId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
};

type Task = {
  id: string;
  text: string;
};

const COLUMNS = {
  BRAIN_DUMP: "brainDump",
  TODO_TODAY: "todoToday",
} as const;

const TaskManagementApp = () => {
  const [columns, setColumns] = useState<{ [key: string]: Task[] }>({
    [COLUMNS.BRAIN_DUMP]: [],
    [COLUMNS.TODO_TODAY]: [],
  });
  const [inputValues, setInputValues] = useState({
    [COLUMNS.BRAIN_DUMP]: "",
    [COLUMNS.TODO_TODAY]: "",
  });
  const [draggingTask, setDraggingTask] = useState<{
    id: string;
    column: string;
  } | null>(null);

  useEffect(() => {
    const loadData = () => ({
      [COLUMNS.BRAIN_DUMP]: loadFromLocalStorage(COLUMNS.BRAIN_DUMP) || [],
      [COLUMNS.TODO_TODAY]: loadFromLocalStorage(COLUMNS.TODO_TODAY) || [],
    });
    setColumns(loadData());
  }, []);

  useEffect(() => {
    saveToLocalStorage(COLUMNS.BRAIN_DUMP, columns[COLUMNS.BRAIN_DUMP]);
    saveToLocalStorage(COLUMNS.TODO_TODAY, columns[COLUMNS.TODO_TODAY]);
  }, [columns]);

  const handleSubmit = (column: string) => (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputValues[column].trim();
    if (text) {
      setColumns((prev) => ({
        ...prev,
        [column]: [...prev[column], { id: generateId(), text }],
      }));
      setInputValues((prev) => ({ ...prev, [column]: "" }));
    }
  };

  const handleDelete = (taskId: string, column: string) => {
    setColumns((prev) => ({
      ...prev,
      [column]: prev[column].filter((task) => task.id !== taskId),
    }));
  };

  const handleDragStart = (taskId: string, column: string) => {
    setDraggingTask({ id: taskId, column });
  };

  const handleDragOver = (
    e: React.DragEvent,
    column: string,
    index: number
  ) => {
    e.preventDefault();
    if (!draggingTask || draggingTask.column !== column) return;

    const items = [...columns[column]];
    const draggedItemIndex = items.findIndex(
      (item) => item.id === draggingTask.id
    );

    if (draggedItemIndex !== index) {
      const [removed] = items.splice(draggedItemIndex, 1);
      items.splice(index, 0, removed);
      setColumns((prev) => ({ ...prev, [column]: items }));
    }
  };

  const handleDrop = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    if (!draggingTask) return;

    const taskListContainer = document.querySelector(
      `[data-column="${column}"]`
    ) as HTMLElement;
    if (!taskListContainer) return;

    const tasksElements = Array.from(
      taskListContainer.querySelectorAll<HTMLElement>("[data-task]")
    );
    const dragY = e.clientY;
    const containerRect = taskListContainer.getBoundingClientRect();
    const relativeY = dragY - containerRect.top;

    let targetIndex = tasksElements.length;
    for (let i = 0; i < tasksElements.length; i++) {
      const taskRect = tasksElements[i].getBoundingClientRect();
      const taskMiddle =
        (taskRect.top + taskRect.bottom) / 2 - containerRect.top;
      if (relativeY < taskMiddle) {
        targetIndex = i;
        break;
      }
    }

    if (draggingTask.column !== column) {
      setColumns((prev) => {
        const sourceColumn = [...prev[draggingTask.column]];
        const targetColumn = [...prev[column]];
        const taskIndex = sourceColumn.findIndex(
          (t) => t.id === draggingTask.id
        );

        if (taskIndex === -1) return prev;

        const [movedTask] = sourceColumn.splice(taskIndex, 1);
        targetColumn.splice(targetIndex, 0, movedTask);

        return {
          ...prev,
          [draggingTask.column]: sourceColumn,
          [column]: targetColumn,
        };
      });
    }

    setDraggingTask(null);
  };

  return (
    <div className="min-h-screen bg-white p-4 md:p-8">
      <h1 className="text-2xl font-light text-center mb-12 text-gray-800">
        brain 2.0
      </h1>

      <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        <TaskColumn
          title="thoughts"
          column={COLUMNS.BRAIN_DUMP}
          tasks={columns[COLUMNS.BRAIN_DUMP]}
          inputValue={inputValues[COLUMNS.BRAIN_DUMP]}
          onInputChange={(value) =>
            setInputValues((prev) => ({ ...prev, [COLUMNS.BRAIN_DUMP]: value }))
          }
          onSubmit={handleSubmit(COLUMNS.BRAIN_DUMP)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDelete={handleDelete}
          draggingTask={draggingTask}
        />

        <TaskColumn
          title="today's to do"
          column={COLUMNS.TODO_TODAY}
          tasks={columns[COLUMNS.TODO_TODAY]}
          inputValue={inputValues[COLUMNS.TODO_TODAY]}
          onInputChange={(value) =>
            setInputValues((prev) => ({ ...prev, [COLUMNS.TODO_TODAY]: value }))
          }
          onSubmit={handleSubmit(COLUMNS.TODO_TODAY)}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onDelete={handleDelete}
          draggingTask={draggingTask}
        />
      </div>
    </div>
  );
};

const TaskColumn = ({
  title,
  column,
  tasks,
  inputValue,
  onInputChange,
  onSubmit,
  onDragStart,
  onDragOver,
  onDrop,
  onDelete,
  draggingTask,
}: {
  title: string;
  column: string;
  tasks: Task[];
  inputValue: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onDragStart: (taskId: string, column: string) => void;
  onDragOver: (e: React.DragEvent, column: string, index: number) => void;
  onDrop: (e: React.DragEvent, column: string) => void;
  onDelete: (taskId: string, column: string) => void;
  draggingTask: { id: string; column: string } | null;
}) => (
  <div
    className="bg-gray-50/50 rounded-xl p-6 h-[70vh] flex flex-col"
    onDrop={(e) => onDrop(e, column)}
    onDragOver={(e) => e.preventDefault()}
  >
    <h2 className="text-sm font-medium text-gray-500 mb-6 tracking-wide uppercase">
      {title}
    </h2>

    <div className="flex flex-col flex-1">
      <form onSubmit={onSubmit} className="flex gap-2 mb-4">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder="Add something..."
          className="rounded-lg bg-white/80 border-0 shadow-sm placeholder:text-gray-300 focus-visible:ring-1 focus-visible:ring-gray-200"
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-lg bg-gray-900 text-white hover:bg-gray-800 shadow-sm"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div
        data-column={column}
        className="space-y-2 flex-1 overflow-y-auto"
        onDragOver={(e) => {
          e.preventDefault();
          if (!draggingTask) return;

          const taskListContainer = e.currentTarget as HTMLElement;
          const tasksElements = Array.from(
            taskListContainer.querySelectorAll<HTMLElement>("[data-task]")
          );
          const dragY = e.clientY;
          const containerRect = taskListContainer.getBoundingClientRect();

          // Auto-scroll logic
          const scrollThreshold = 50;
          const scrollSpeed = 10;
          const deltaTop = dragY - containerRect.top;
          const deltaBottom = containerRect.bottom - dragY;

          if (deltaTop < scrollThreshold) {
            taskListContainer.scrollTop -= scrollSpeed;
          } else if (deltaBottom < scrollThreshold) {
            taskListContainer.scrollTop += scrollSpeed;
          }

          // Calculate target index
          const relativeY = dragY - containerRect.top;
          let targetIndex = tasksElements.length;

          for (let i = 0; i < tasksElements.length; i++) {
            const taskRect = tasksElements[i].getBoundingClientRect();
            const taskMiddle =
              (taskRect.top + taskRect.bottom) / 2 - containerRect.top;
            if (relativeY < taskMiddle) {
              targetIndex = i;
              break;
            }
          }

          if (draggingTask.column === column) {
            onDragOver(e, column, targetIndex);
          }
        }}
      >
        {tasks.map((task, index) => (
          <TaskItem
            key={task.id}
            task={task}
            column={column}
            index={index}
            onDragStart={onDragStart}
            onDelete={onDelete}
            isDragging={draggingTask?.id === task.id}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-gray-300 text-sm py-8 text-center italic">
            No tasks yet
          </div>
        )}
      </div>
    </div>
  </div>
);

const TaskItem = ({
  task,
  column,
  index,
  onDragStart,
  onDelete,
  isDragging,
}: {
  task: Task;
  column: string;
  index: number;
  onDragStart: (taskId: string, column: string) => void;
  onDelete: (taskId: string, column: string) => void;
  isDragging: boolean;
}) => {
  const isTodoColumn = column === COLUMNS.TODO_TODAY;

  return (
    <div
      data-task
      draggable
      onDragStart={() => onDragStart(task.id, column)}
      className={cn(
        "group flex items-center p-3 bg-white/80 rounded-lg",
        "cursor-grab active:cursor-grabbing shadow-sm hover:shadow-md",
        "transition-all duration-200 ease-in-out",
        "border border-transparent hover:border-gray-100",
        isDragging && "opacity-50"
      )}
    >
      {isTodoColumn ? (
        <span className="w-6 h-6 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-xs font-medium mr-3">
          {index + 1}
        </span>
      ) : (
        <GripVertical className="h-4 w-4 mr-3 text-gray-200 group-hover:text-gray-400" />
      )}
      <span className="flex-1 text-gray-600 text-sm font-light">
        {task.text}
      </span>
      <button
        onClick={() => onDelete(task.id, column)}
        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-gray-50 rounded-md"
      >
        <X className="h-3.5 w-3.5 text-gray-300 hover:text-gray-400" />
      </button>
    </div>
  );
};

const saveToLocalStorage = (key: string, data: Task[]) => {
  if (typeof window !== "undefined") {
    localStorage.setItem(key, JSON.stringify(data));
  }
};

const loadFromLocalStorage = (key: string): Task[] => {
  if (typeof window !== "undefined") {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  }
  return [];
};

export default TaskManagementApp;
