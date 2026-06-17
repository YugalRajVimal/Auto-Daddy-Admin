import { useState } from "react";
import { useNavigate } from "react-router";
import AdminPage from "../../../components/admin/AdminPage";
import { PanelFooter } from "../../../components/admin/ContentPanel";

export default function ThoughtOfDayNewPage() {
  const navigate = useNavigate();
  const [date, setDate] = useState("2026-06-16");
  const [country, setCountry] = useState("Canada");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState(
    "A goodman is always a best friend and, soonest to be choosen, longer to be retained it in-deed and, never to be parted with."
  );

  const handleSave = () => {
    navigate("/admin/thought-of-day");
  };

  const handleCancel = () => {
    navigate("/admin/thought-of-day");
  };

  return (
    <AdminPage
      title="New Note"
      panelTitle="New Note"
      footer={
        <PanelFooter
          message="You are creating a new note"
          actionLabel="Save"
          onAction={handleSave}
          cancelLabel="Cancel"
          onCancel={handleCancel}
        />
      }
    >
      <div className="space-y-4">
        <div>
          <label className="mb-1 block font-serif italic text-sm text-black">Date</label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full max-w-xs rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-ad-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block font-serif italic text-sm text-black">Country</label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full max-w-xs rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-ad-purple focus:outline-none"
          >
            <option value="Canada">Canada</option>
            <option value="USA">USA</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block font-serif italic text-sm text-black">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-ad-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block font-serif italic text-sm text-black">Note</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={6}
            className="w-full rounded border border-gray-300 bg-white px-3 py-2 shadow-sm focus:border-ad-purple focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block font-serif italic text-sm text-black">Attachment</label>
          <label className="inline-block cursor-pointer rounded border border-gray-400 bg-gray-200 px-4 py-1.5 text-sm text-gray-700 hover:bg-gray-300">
            Upload File
            <input type="file" className="hidden" />
          </label>
        </div>
      </div>
    </AdminPage>
  );
}
