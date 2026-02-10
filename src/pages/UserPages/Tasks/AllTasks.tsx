import  { useEffect, useState, ChangeEvent } from 'react';
import axios from 'axios';

// Tailwind-based StatusChip
const StatusChip = ({
  completed,
  completedAt,
}: {
  completed: boolean;
  completedAt: string | null;
}) => (
  completed ? (
    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full font-semibold text-sm">
      Completed
      {completedAt && (
        <span className="font-normal text-gray-500 text-xs ml-2">
          ({new Date(completedAt).toLocaleString()})
        </span>
      )}
    </span>
  ) : (
    <span className="inline-block px-4 py-1 bg-yellow-100 text-yellow-600 rounded-full font-semibold text-sm">
      Pending
    </span>
  )
);

interface Task {
  _id?: string;
  name: string;
  description: string;
  link: string;
  date: string;
  completed: boolean;
  completedAt: string | null;
}

const AllTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  // State for screenshot uploads
  // Screenshot for each task being marked complete: { [taskId]: File|null }
  const [screenshots, setScreenshots] = useState<Record<string, File | null>>({});
  const [submitStatus, setSubmitStatus] = useState<Record<string, { loading: boolean; error?: string }> >({});

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      setError(null);
      setMessage(null);
      try {
        const token = localStorage.getItem('user-token');
        const apiUrl = `${import.meta.env.VITE_API_URL}/api/user/tasks`;
        const response = await axios.get(apiUrl, {
          headers: {
            Authorization: token ? `${token}` : '',
          },
        });
        setTasks(response.data.data || []);
        setMessage(response.data.message || null);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
          err.message ||
          'Failed to fetch tasks.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchTasks();
  }, []);

  // Handle file input
  const handleScreenshotChange = (taskId: string, e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setScreenshots((prev) => ({
        ...prev,
        [taskId]: e.target.files![0],
      }));
    }
  };

  // Handle submit for completing a task (with screenshot required)
  const handleCompleteTask = async (task: Task) => {
    const taskId = task._id as string;
    setSubmitStatus((prev) => ({
      ...prev,
      [taskId]: { loading: true }
    }));
    // Validate screenshot present
    if (!screenshots[taskId]) {
      setSubmitStatus((prev) => ({
        ...prev,
        [taskId]: { loading: false, error: 'Please upload a screenshot before completing.' }
      }));
      return;
    }

    try {
      const token = localStorage.getItem('user-token');
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/user/complete-task`;
      await axios.post(apiUrl, { taskId }, {
        headers: {
          Authorization: token ? `${token}` : '',
        },
      });

      setSubmitStatus((prev) => ({
        ...prev,
        [taskId]: { loading: false }
      }));
      // Refresh tasks after successful completion
      setMessage('Task marked as completed successfully.');
      setTimeout(() => setMessage(null), 2000);
      // Refresh the tasks list
      setTasks((currTasks) =>
        currTasks.map((t) =>
          t._id === taskId
            ? { ...t, completed: true, completedAt: new Date().toISOString() }
            : t
        )
      );
    } catch (err: any) {
      setSubmitStatus((prev) => ({
        ...prev,
        [taskId]: {
          loading: false,
          error:
            err.response?.data?.message ||
            err.message ||
            'Failed to mark as complete.'
        }
      }));
    }
  };

  return (
    <div className=" mx-auto mt-7 p-8 bg-gradient-to-tr from-[#f7fafc] via-[#ecf1fa] to-[#ecf1fa] rounded-xl shadow-[0_5px_24px_rgba(43,73,135,0.11),0_1.5px_7px_rgba(80,70,185,0.07)]">
      <h2 className="text-3xl font-extrabold mb-5 tracking-tight bg-gradient-to-r from-[#5fa8e1] to-[#9fcfd6] bg-clip-text text-transparent">
        Your Weekly Tasks
      </h2>

      {loading && (
        <div className="my-8 text-center text-blue-600 font-semibold text-lg tracking-wide flex items-center justify-center">
          <span className="inline-block w-6 h-6 border-4 border-blue-100 border-t-4 border-t-blue-500 rounded-full animate-spin mr-3"></span>
          Loading your tasks...
        </div>
      )}

      {error && (
        <div className="text-red-600 bg-red-50 border border-red-200 px-5 py-3 rounded-md font-semibold text-base my-5">
          {error}
        </div>
      )}

      {!loading && message && (
        <div
          className={`rounded-md px-6 py-3 font-semibold shadow-sm mb-6 text-base
            ${
              message.includes('contact admin')
                ? 'bg-gradient-to-r from-yellow-100 to-yellow-50 text-yellow-800 border border-yellow-200 shadow-[0_2px_14px_rgba(255,226,152,0.12)]'
                : 'bg-gradient-to-r from-green-50 via-green-100 to-green-50 text-green-700 border border-green-100 shadow-[0_1px_7px_rgba(182,245,233,0.07)]'
            }`}
        >
          {message}
        </div>
      )}

      {!loading && (!tasks || tasks.length === 0) && (
        <div className="text-slate-400 text-lg font-medium tracking-tight py-9 text-center">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none" className="block mx-auto mb-4">
            <rect width="44" height="44" rx="14.5" fill="#f6f7fb" />
            <path d="M13 22L19.5 28.5L31 17" stroke="#bad0e6" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          No tasks assigned yet. <br /> Check back soon!
        </div>
      )}

      {!loading && tasks && tasks.length > 0 && (
        <div className="overflow-x-auto mt-2">
          <table className="min-w-[900px] w-full bg-white rounded-xl shadow-[0_2px_12px_rgba(195,212,236,0.15)] font-sans text-[15px] border-separate border-spacing-0">
            <thead>
              <tr className="bg-gradient-to-r from-blue-100 via-blue-50 to-blue-50 font-extrabold text-blue-600 text-[15px] tracking-wide">
                <th className="py-4 px-5 text-left rounded-tl-xl">#</th>
                <th className="py-4 px-3 text-left">Task Name</th>
                <th className="py-4 px-3 text-left min-w-[160px]">Description</th>
                <th className="py-4 px-3 text-left min-w-[80px]">Link</th>
                <th className="py-4 px-3 text-left min-w-[120px]">Assigned Date</th>
                <th className="py-4 px-3 text-left min-w-[120px]">Status</th>
                <th className="py-4 px-3 text-left min-w-[180px] rounded-tr-xl">Action</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task, idx) => (
                <tr
                  key={task._id || task.link}
                  className={`transition-colors ${
                    idx % 2 === 0
                      ? 'bg-gradient-to-r from-blue-50 via-white to-slate-50'
                      : 'bg-gradient-to-r from-slate-100 via-blue-50 to-white'
                  }`}
                >
                  <td className="py-3 pl-5 pr-3 font-bold text-blue-500 border-0 border-b border-slate-100">{idx + 1}</td>
                  <td className="py-3 px-3 font-bold text-slate-800 border-0 border-b border-slate-100">{task.name}</td>
                  <td className="py-3 px-3 text-blue-gray-500 break-words border-0 border-b border-slate-100">{task.description}</td>
                  <td className="py-3 px-3 border-0 border-b border-slate-100">
                    <a
                      href={task.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 bg-blue-50 hover:bg-blue-200 rounded-md px-4 py-1 font-bold transition-colors"
                    >
                      Open
                    </a>
                  </td>
                  <td className="py-3 px-3 text-blue-900 font-medium border-0 border-b border-slate-100">
                    {task.date
                      ? new Date(task.date).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })
                      : 'N/A'}
                  </td>
                  <td className="py-3 px-5 border-0 border-b border-slate-100">
                    <StatusChip completed={task.completed} completedAt={task.completedAt} />
                  </td>
                  <td className="py-3 px-3 border-0 border-b border-slate-100">
                    {!task.completed ? (
                      <div className="flex flex-col gap-2 items-start">
                        <div className="flex gap-2 items-center">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleScreenshotChange(task._id as string, e)}
                            id={`upload-screenshot-${task._id}`}
                            className="block w-full text-sm text-gray-500 file:mr-3 file:py-1 file:px-2 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            style={{ maxWidth: 170 }}
                            disabled={!!submitStatus[task._id || ""]?.loading}
                          />
                          {screenshots[task._id || ""] ? (
                            <span className="text-green-600 text-xs font-bold">Uploaded</span>
                          ) : null}
                        </div>
                        <button
                          className={`mt-1 rounded-md px-4 py-1 font-bold transition-colors bg-blue-600 text-white hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed`}
                          onClick={() => handleCompleteTask(task)}
                          disabled={
                            !!submitStatus[task._id || ""]?.loading
                          }
                        >
                          {submitStatus[task._id || ""]?.loading ? 'Submitting...' : 'Mark as Complete'}
                        </button>
                        {submitStatus[task._id || ""]?.error && (
                          <span className="text-red-500 text-xs">{submitStatus[task._id || ""]?.error}</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-green-500 font-semibold">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AllTasks;