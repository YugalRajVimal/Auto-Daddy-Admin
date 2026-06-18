import React, { useEffect, useMemo, useState } from "react";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";

const API_BASE = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api/admin/tasks`
  : "/api/admin/tasks";

type TaskType = {
  _id: string;
  name: string;
  description?: string;
  link: string;
  createdAt?: string;
  updatedAt?: string;
};

type Pagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const Tasks: React.FC = () => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10);
  const [pagination, setPagination] = useState<Pagination | null>(null);

  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [addName, setAddName] = useState<string>("");
  const [addDescription, setAddDescription] = useState<string>("");
  const [addLink, setAddLink] = useState<string>("");

  const [bulkTasksInput, setBulkTasksInput] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<boolean>(false);

  const fetchTasks = async (pg = page) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_BASE}?page=${pg}&limit=${limit}`, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data.data || []);
      setPagination(data.pagination || null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not load tasks";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        name: addName.trim(),
        description: addDescription.trim(),
        link: addLink.trim(),
      };
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add task");
      setShowAdd(false);
      setAddName("");
      setAddDescription("");
      setAddLink("");
      fetchTasks(1);
      setPage(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not add task";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBulkAddTasks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const bulkArray = bulkTasksInput
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, link, ...rest] = line.split(",");
        const description = rest.join(",").trim();
        return {
          name: name?.trim() || "",
          link: link?.trim() || "",
          description,
        };
      })
      .filter((t) => t.name && t.link);

    if (bulkArray.length === 0) {
      setError("Please enter at least one task in the correct format.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/multiple`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ tasks: bulkArray }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Bulk add failed.");
      setBulkTasksInput("");
      fetchTasks(1);
      setPage(1);
      setShowAdd(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not add tasks in bulk";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this task?")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete");
      fetchTasks(page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not delete";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected tasks?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/delete/selected`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Bulk delete failed");
      setSelectedIds(new Set());
      fetchTasks(page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not bulk delete";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm("Delete ALL tasks? This action cannot be undone.")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/delete/all`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Bulk delete all failed");
      setSelectedIds(new Set());
      fetchTasks(1);
      setPage(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not bulk delete all";
      setError(message);
    } finally {
      setDeleting(false);
    }
  };

  const tableColumns = useMemo(
    () => [
      {
        key: "name",
        label: "Name",
        render: (task: TaskType) => tableCell(<span style={{ fontWeight: 500 }}>{task.name}</span>),
        exportValue: (task: TaskType) => task.name,
      },
      {
        key: "description",
        label: "Description",
        render: (task: TaskType) => tableCell(task.description || "-"),
        exportValue: (task: TaskType) => task.description || "-",
      },
      {
        key: "link",
        label: "Link",
        render: (task: TaskType) =>
          tableCell(
            <a href={task.link} rel="noopener noreferrer" target="_blank" style={{ color: "#1e40af" }}>
              {task.link}
            </a>
          ),
        exportValue: (task: TaskType) => task.link,
      },
      {
        key: "createdAt",
        label: "Created At",
        render: (task: TaskType) =>
          tableCell(
            task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-"
          ),
        exportValue: (task: TaskType) =>
          task.createdAt ? new Date(task.createdAt).toLocaleDateString() : "-",
      },
    ],
    []
  );

  return (
    <div className="min-h-0 flex-1 overflow-y-auto bg-white py-4 md:py-5">
      <h1 className="mb-4 text-xl font-bold text-ad-green md:text-2xl">Manage Tasks</h1>

      <div className="mb-5 flex flex-col md:flex-row gap-2 items-start md:items-center">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          onClick={() => setShowAdd((show) => !show)}
        >
          {showAdd ? "Close Add Form" : "Add Task"}
        </button>
        {tasks.length > 0 && (
          <button
            className="ml-2 bg-rose-700 hover:bg-rose-800 text-white px-3 py-1.5 rounded text-sm"
            onClick={handleDeleteAll}
            disabled={deleting}
          >
            Delete All
          </button>
        )}
      </div>

      {showAdd && (
        <div className="mb-6">
          <form
            onSubmit={handleAddTask}
            className="mb-4 space-y-3 bg-slate-50 p-4 rounded border"
          >
            <h2 className="font-medium mb-1 text-slate-700">Add New Task</h2>
            <div className="flex flex-col gap-2">
              <input
                className="border rounded px-3 py-1"
                type="text"
                placeholder="Task Name"
                value={addName}
                disabled={submitting}
                required
                onChange={(e) => setAddName(e.target.value)}
              />
              <input
                className="border rounded px-3 py-1"
                type="url"
                placeholder="Task Link (must start with http/https)"
                value={addLink}
                required
                disabled={submitting}
                onChange={(e) => setAddLink(e.target.value)}
              />
              <textarea
                className="border rounded w-full h-12 px-3 py-1"
                placeholder="Task Description (optional)"
                value={addDescription}
                disabled={submitting}
                onChange={(e) => setAddDescription(e.target.value)}
              />
              <button
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm mt-2"
                type="submit"
                disabled={submitting}
              >
                Add Task
              </button>
            </div>
          </form>
          <div className="my-4 text-slate-400 text-center text-sm">— or —</div>
          <form
            onSubmit={handleBulkAddTasks}
            className="space-y-3 bg-slate-50 p-4 rounded border"
            autoComplete="off"
          >
            <h2 className="font-medium mb-1 text-slate-700">Bulk Add Tasks</h2>
            <textarea
              className="border rounded w-full h-28 px-3 py-2"
              placeholder={`Enter one task per line in CSV format: name, link, [optional description]\nLike our page, https://facebook.com/xyz, Like main FB page`}
              value={bulkTasksInput}
              onChange={(e) => setBulkTasksInput(e.target.value)}
              disabled={submitting}
            />
            <button
              className="bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded text-sm"
              type="submit"
              disabled={submitting}
            >
              Add Multiple Tasks
            </button>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-700 rounded text-sm">
          {error}
        </div>
      )}

      <AdminDataTable
        items={tasks}
        columns={tableColumns}
        getRowId={(task) => task._id}
        loading={loading}
        emptyMessage="No tasks found."
        serverPaginated
        totalItemCount={pagination?.total ?? 0}
        currentPage={page}
        onCurrentPageChange={setPage}
        pageSize={limit}
        showSearch={false}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        exportFilename="tasks"
        extraToolbarActions={[
          {
            label: "Delete Selected",
            color: "#e74c3c",
            minSelected: 1,
            onClick: (ids) => handleBulkDelete(ids),
          },
        ]}
        renderActions={(task) => (
          <button
            type="button"
            className="text-rose-700 hover:underline"
            disabled={deleting}
            onClick={() => handleDelete(task._id)}
          >
            Delete
          </button>
        )}
      />
    </div>
  );
};

export default Tasks;
