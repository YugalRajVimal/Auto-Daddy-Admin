import React, { useEffect, useMemo, useState } from "react";
import { adminNotify } from "../../../utils/adminNotify";
import AdminPage from "../../../components/admin/AdminPage";
import { AdminDataTable, tableCell } from "../../../components/admin/AdminDataTable";
import { AdminDeletedBanner, AdminDeletedToggle } from "../../../components/admin/AdminDeletedView";
import { useAdminDeletedView } from "../../../hooks/useAdminDeletedView";

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

  const resetTableControls = () => {
    setPage(1);
    setSelectedIds(new Set());
  };

  const {
    viewMode,
    isDeletedView,
    toggleViewMode,
    deletedStash,
    stashDeleted,
    restoreStashed,
  } = useAdminDeletedView<TaskType>({
    onToggle: resetTableControls,
    storageKey: "admin_deleted_view:tasks",
  });

  const displayTasks = isDeletedView ? deletedStash : tasks;

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
      adminNotify.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isDeletedView) return;
    fetchTasks(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, isDeletedView]);

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
      adminNotify.success("Task added.");
      setShowAdd(false);
      setAddName("");
      setAddDescription("");
      setAddLink("");
      fetchTasks(1);
      setPage(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not add task";
      setError(message);
      adminNotify.error(message);
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
      const message = "Please enter at least one task in the correct format.";
      setError(message);
      adminNotify.error(message);
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
      adminNotify.success(`${bulkArray.length} task(s) added.`);
      setBulkTasksInput("");
      fetchTasks(1);
      setPage(1);
      setShowAdd(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not add tasks in bulk";
      setError(message);
      adminNotify.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this task?")) return;
    const row = tasks.find((t) => t._id === id);
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to delete");
      if (row) stashDeleted(row);
      adminNotify.success("Task deleted.");
      fetchTasks(page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not delete";
      setError(message);
      adminNotify.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    if (ids.length === 0) return;
    if (!window.confirm(`Delete ${ids.length} selected tasks?`)) return;
    const toStash = tasks.filter((t) => ids.includes(t._id));
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
      if (toStash.length > 0) stashDeleted(toStash);
      adminNotify.success(`${ids.length} task(s) deleted.`);
      setSelectedIds(new Set());
      fetchTasks(page);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not bulk delete";
      setError(message);
      adminNotify.error(message);
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (ids: string[]) => {
    if (ids.length === 0) return;
    const toRestore = deletedStash.filter((t) => ids.includes(t._id));
    if (toRestore.length === 0) return;
    if (!window.confirm(`Restore ${toRestore.length} task(s)?`)) return;
    setDeleting(true);
    setError(null);
    let allSucceeded = true;
    try {
      for (const task of toRestore) {
        try {
          const res = await fetch(API_BASE, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({
              name: task.name,
              description: task.description || "",
              link: task.link,
            }),
          });
          if (!res.ok) throw new Error();
          restoreStashed((item) => item._id === task._id);
        } catch {
          allSucceeded = false;
        }
      }
      setSelectedIds(new Set());
      adminNotify[allSucceeded ? "success" : "error"](
        allSucceeded ? "Task(s) restored." : "Some tasks failed to restore."
      );
      if (!isDeletedView) fetchTasks(page);
      else fetchTasks(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not restore";
      setError(message);
      adminNotify.error(message);
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
      adminNotify.success("All tasks deleted.");
      setSelectedIds(new Set());
      fetchTasks(1);
      setPage(1);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not bulk delete all";
      setError(message);
      adminNotify.error(message);
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
        render: (task: TaskType) => tableCell(task.description || "-", undefined, { wrap: true }),
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
    <AdminPage
      title={isDeletedView ? "Deleted Tasks" : "Manage Tasks"}
      noPanel
      headerAction={
        !isDeletedView ? (
          <div className="flex flex-wrap items-center gap-2">
            <button
              className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
              onClick={() => setShowAdd((show) => !show)}
            >
              {showAdd ? "Close Add Form" : "Add Task"}
            </button>
            {tasks.length > 0 ? (
              <button
                className="rounded bg-rose-700 px-3 py-1.5 text-sm text-white hover:bg-rose-800"
                onClick={handleDeleteAll}
                disabled={deleting}
              >
                Delete All
              </button>
            ) : null}
          </div>
        ) : undefined
      }
    >
      {showAdd && !isDeletedView && (
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
        items={displayTasks}
        columns={tableColumns}
        getRowId={(task) => task._id}
        loading={loading && !isDeletedView}
        emptyMessage={isDeletedView ? "No deleted tasks found." : "No tasks found."}
        banner={
          isDeletedView ? (
            <AdminDeletedBanner count={deletedStash.length} entityLabel="tasks" />
          ) : undefined
        }
        serverPaginated={!isDeletedView}
        totalItemCount={isDeletedView ? deletedStash.length : pagination?.total ?? 0}
        currentPage={page}
        onCurrentPageChange={setPage}
        pageSize={limit}
        showSearch={false}
        selectedIds={selectedIds}
        onSelectedIdsChange={setSelectedIds}
        exportFilename="tasks"
        extraToolbarActions={
          isDeletedView
            ? [
                {
                  label: "Restore",
                  color: "#27ae60",
                  minSelected: 1,
                  onClick: (ids) => handleRestore(ids),
                },
              ]
            : [
                {
                  label: "Delete Selected",
                  color: "#e74c3c",
                  minSelected: 1,
                  onClick: (ids) => handleBulkDelete(ids),
                },
              ]
        }
        footerRight={
          <AdminDeletedToggle
            viewMode={viewMode}
            onToggle={toggleViewMode}
            activeLabel="Active Tasks"
          />
        }
        renderActions={(task) =>
          isDeletedView ? (
            <button
              type="button"
              className="text-ad-green hover:underline"
              disabled={deleting}
              onClick={() => handleRestore([task._id])}
            >
              Restore
            </button>
          ) : (
            <button
              type="button"
              className="text-rose-700 hover:underline"
              disabled={deleting}
              onClick={() => handleDelete(task._id)}
            >
              Delete
            </button>
          )
        }
      />
    </AdminPage>
  );
};

export default Tasks;
