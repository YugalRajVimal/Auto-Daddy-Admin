import React, { useEffect, useState } from "react";

// Set your API base URL; can be overridden by VITE_API_URL env
const API_BASE =
  import.meta.env.VITE_API_URL
    ? `${import.meta.env.VITE_API_URL}/api/admin/tasks`
    : "/api/admin/tasks";

// TypeScript type for a Task object
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
  // State
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // For pagination
  const [page, setPage] = useState<number>(1);
  const [limit] = useState<number>(10); // default items per page
  const [pagination, setPagination] = useState<Pagination | null>(null);

  // For creating or bulk-adding
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [addName, setAddName] = useState<string>("");
  const [addDescription, setAddDescription] = useState<string>("");
  const [addLink, setAddLink] = useState<string>("");

  const [bulkTasksInput, setBulkTasksInput] = useState<string>(""); // Multiline for bulk add
  const [submitting, setSubmitting] = useState<boolean>(false);

  // For selection/bulk deletion
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState<boolean>(false);

  // Fetch tasks with pagination
  const fetchTasks = async (pg = page) => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `${API_BASE}?page=${pg}&limit=${limit}`,
        { credentials: "include" }
      );
      if (!res.ok) throw new Error("Failed to fetch tasks");
      const data = await res.json();
      setTasks(data.data || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      setError(err.message ?? "Could not load tasks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Add new single task
  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const body = {
        name: addName.trim(),
        description: addDescription.trim(),
        link: addLink.trim()
      };
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to add task");
      setShowAdd(false);
      setAddName(""); setAddDescription(""); setAddLink("");
      fetchTasks(1);
      setPage(1);
    } catch (err: any) {
      setError(err.message || "Could not add task");
    } finally {
      setSubmitting(false);
    }
  };

  // Bulk add multiple tasks (expects multi-line input, CSV or JSON array not required)
  const handleBulkAddTasks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Accept multi-line input: each line "Task Name, link, [optional description]"
    // E.g. "Like our page, https://facebook.com/xyz, Like the main FB page"
    // Do minimal parsing (could improve with CSV parser if needed)
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
          description
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
        body: JSON.stringify({ tasks: bulkArray })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Bulk add failed.");
      setBulkTasksInput("");
      fetchTasks(1);
      setPage(1);
      setShowAdd(false);
    } catch (err: any) {
      setError(err.message || "Could not add tasks in bulk");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete single task
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
    } catch (err: any) {
      setError(err.message || "Could not delete");
    } finally {
      setDeleting(false);
    }
  };

  // Bulk delete selected
  const handleBulkDelete = async () => {
    if (selected.size === 0) return;
    if (!window.confirm(`Delete ${selected.size} selected tasks?`)) return;
    setDeleting(true);
    setError(null);
    try {
      const ids = Array.from(selected);
      const res = await fetch(`${API_BASE}/delete/selected`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Bulk delete failed");
      setSelected(new Set());
      fetchTasks(page);
    } catch (err: any) {
      setError(err.message || "Could not bulk delete");
    } finally {
      setDeleting(false);
    }
  };

  // Delete all tasks
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
      setSelected(new Set());
      fetchTasks(1);
      setPage(1);
    } catch (err: any) {
      setError(err.message || "Could not bulk delete all");
    } finally {
      setDeleting(false);
    }
  };

  // Bulk select support
  const handleToggleSelect = (id: string) => {
    setSelected((old) => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSelectAllPage = () => {
    if (!tasks.length) return;
    const pageIds = tasks.map((t) => t._id);
    const allSelected = pageIds.every((id) => selected.has(id));
    if (allSelected) {
      setSelected((old) => {
        const next = new Set(old);
        pageIds.forEach((id) => next.delete(id));
        return next;
      });
    } else {
      setSelected((old) => {
        const next = new Set(old);
        pageIds.forEach((id) => next.add(id));
        return next;
      });
    }
  };

  return (
    <div className="min-h-screen py-6 px-4 md:px-8">
      <h1 className="text-xl md:text-2xl font-bold text-slate-800 mb-5">
        Manage Tasks
      </h1>

      <div className="mb-5 flex flex-col md:flex-row gap-2 items-start md:items-center">
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm"
          onClick={() => setShowAdd((show) => !show)}
        >
          {showAdd ? "Close Add Form" : "Add Task"}
        </button>
        {selected.size > 0 && (
          <button
            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded text-sm ml-2"
            onClick={handleBulkDelete}
            disabled={deleting}
          >
            Delete Selected ({selected.size})
          </button>
        )}
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
          {/* Single Task Add Form */}
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
          {/* Divider */}
          <div className="my-4 text-slate-400 text-center text-sm">— or —</div>
          {/* Bulk Add */}
          <form
            onSubmit={handleBulkAddTasks}
            className="space-y-3 bg-slate-50 p-4 rounded border"
            autoComplete="off"
          >
            <h2 className="font-medium mb-1 text-slate-700">
              Bulk Add Tasks
            </h2>
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

      <div className="bg-white border rounded-lg overflow-x-auto">
        {loading ? (
          <div className="p-6 text-center text-slate-400">Loading...</div>
        ) : tasks.length === 0 ? (
          <div className="p-6 text-center text-slate-400">No tasks found.</div>
        ) : (
          <table className="w-full text-sm table-auto min-w-max">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-2 py-2">
                  <input
                    type="checkbox"
                    aria-label="select all"
                    checked={
                      tasks.length > 0 &&
                      tasks.every((t) => selected.has(t._id))
                    }
                    onChange={handleSelectAllPage}
                  />
                </th>
                <th className="px-2 py-2 text-left">Name</th>
                <th className="px-2 py-2 text-left">Link</th>
                <th className="px-2 py-2 text-left">Description</th>
                <th className="px-2 py-2 text-left">Created</th>
                <th className="px-2 py-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task._id} className="border-t hover:bg-slate-50">
                  <td className="px-2 py-2">
                    <input
                      type="checkbox"
                      checked={selected.has(task._id)}
                      onChange={() => handleToggleSelect(task._id)}
                      aria-label={`Select ${task.name}`}
                    />
                  </td>
                  <td className="px-2 py-2">
                    <span className="font-medium text-slate-800">
                      {task.name}
                    </span>
                  </td>
                  <td className="px-2 py-2 underline text-blue-800 break-all">
                    <a href={task.link} rel="noopener noreferrer" target="_blank">
                      {task.link}
                    </a>
                  </td>
                  <td className="px-2 py-2 text-slate-700">
                    {task.description || "-"}
                  </td>
                  <td className="px-2 py-2 text-xs text-slate-500">
                    {task.createdAt
                      ? new Date(task.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="px-2 py-2 text-right">
                    <button
                      className="text-rose-700 hover:underline"
                      disabled={deleting}
                      onClick={() => handleDelete(task._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex gap-2 items-center">
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm"
            disabled={page <= 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
          >
            Prev
          </button>
          <span className="text-sm">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm"
            disabled={page >= pagination.totalPages}
            onClick={() =>
              setPage(p => Math.min(pagination.totalPages, p + 1))
            }
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default Tasks;