import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="min-h-screen bg-slate-50 p-8">
      <h1 className="text-3xl font-light text-center mb-8 text-slate-700">
        Task Dump
      </h1>

      <div className="grid md:grid-cols-2 gap-5 max-w-6xl mx-auto">
        <TaskColumn
          title="Brain Dump"
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
          title="To Do Today"
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
  <Card
    className="bg-white shadow-sm rounded-lg border border-slate-200"
    onDrop={(e) => onDrop(e, column)}
    onDragOver={(e) => e.preventDefault()}
  >
    <CardHeader className="pb-2">
      <CardTitle className="text-base font-medium text-slate-600">
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3 min-h-[500px]">
      <form onSubmit={onSubmit} className="flex gap-2 mb-3">
        <Input
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          placeholder={`Add to ${title.toLowerCase()}...`}
          className="rounded-md bg-white border-slate-200 focus:border-slate-300"
        />
        <Button
          type="submit"
          size="icon"
          className="rounded-md bg-slate-800 text-white hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </form>

      <div
        data-column={column}
        className="space-y-1.5"
        onDragOver={(e) => {
          e.preventDefault();
          if (!draggingTask) return;

          const taskListContainer = e.currentTarget as HTMLElement;
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
            onDragStart={onDragStart}
            onDelete={onDelete}
            isDragging={draggingTask?.id === task.id}
          />
        ))}
        {tasks.length === 0 && (
          <div className="text-slate-400 text-sm py-3 text-center">
            No tasks yet
          </div>
        )}
      </div>
    </CardContent>
  </Card>
);

const TaskItem = ({
  task,
  column,
  onDragStart,
  onDelete,
  isDragging,
}: {
  task: Task;
  column: string;
  onDragStart: (taskId: string, column: string) => void;
  onDelete: (taskId: string, column: string) => void;
  isDragging: boolean;
}) => (
  <div
    data-task
    draggable
    onDragStart={() => onDragStart(task.id, column)}
    className={cn(
      "group flex items-center p-2.5 bg-white border border-slate-200 rounded-md",
      "cursor-grab active:cursor-grabbing shadow-xs hover:shadow-sm",
      "transition-all duration-150",
      isDragging && "opacity-50"
    )}
  >
    <GripVertical className="h-4 w-4 mr-2 text-slate-400 group-hover:text-slate-500" />
    <span className="flex-1 text-slate-600 text-sm">{task.text}</span>
    <button
      onClick={() => onDelete(task.id, column)}
      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 -mr-1 hover:bg-slate-100 rounded"
    >
      <X className="h-4 w-4 text-slate-400 hover:text-slate-500" />
    </button>
  </div>
);

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
