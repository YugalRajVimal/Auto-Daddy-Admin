import React, { useEffect, useState, ChangeEvent, FormEvent } from "react";
import axios, { AxiosError } from "axios";

const API_BASE = `${import.meta.env.VITE_API_URL}/api`;

interface City {
  _id: string;
  name: string;
  createdAt?: string;
}

const Cities: React.FC = () => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [newCity, setNewCity] = useState<string>("");
  const [editingCity, setEditingCity] = useState<City | null>(null);
  const [editName, setEditName] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string>("");
  const [successMsg, setSuccessMsg] = useState<string>("");

  // Fetch all cities
  const fetchCities = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get<{ data: City[] }>(`${API_BASE}/admin/cities`);
      setCities(res.data.data || []);
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setError(
        axErr?.response?.data?.message ||
          axErr?.message ||
          "Failed to fetch cities"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // Add new city
  const handleAddCity = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setActionLoading(true);
    setActionError("");
    setSuccessMsg("");
    try {
      await axios.post(`${API_BASE}/admin/cities`, { name: newCity.trim() });
      setSuccessMsg("City added successfully");
      setNewCity("");
      fetchCities();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setActionError(
        axErr?.response?.data?.message ||
          axErr?.message ||
          "Failed to add city"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Begin editing a city
  const handleEditInit = (city: City) => {
    setEditingCity(city);
    setEditName(city.name);
    setActionError("");
    setSuccessMsg("");
  };

  // Submit edit
  const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editName.trim() || !editingCity) return;
    setActionLoading(true);
    setActionError("");
    setSuccessMsg("");
    try {
      await axios.patch(`${API_BASE}/admin/cities/${editingCity._id}`, { name: editName.trim() });
      setSuccessMsg("City updated successfully");
      setEditingCity(null);
      setEditName("");
      fetchCities();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setActionError(
        axErr?.response?.data?.message ||
          axErr?.message ||
          "Failed to update city"
      );
    } finally {
      setActionLoading(false);
    }
  };

  // Delete city
  const handleDeleteCity = async (cityId: string) => {
    if (!window.confirm("Are you sure you want to delete this city?")) return;
    setActionLoading(true);
    setActionError("");
    setSuccessMsg("");
    try {
      await axios.delete(`${API_BASE}/admin/cities/${cityId}`);
      setSuccessMsg("City deleted successfully");
      fetchCities();
    } catch (err) {
      const axErr = err as AxiosError<{ message?: string }>;
      setActionError(
        axErr?.response?.data?.message ||
          axErr?.message ||
          "Failed to delete city"
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="h-[85vh] overflow-y-auto bg-gray-50 px-2 py-6 sm:px-8">
      <div className="mb-6 flex items-center justify-between flex-wrap gap-x-4 gap-y-2">
        <h2 className="text-2xl font-bold text-gray-700">Cities</h2>
        <form
          className="flex w-full sm:w-auto mt-3 sm:mt-0 gap-2"
          onSubmit={handleAddCity}
        >
          <input
            type="text"
            className="border rounded px-3 py-2 outline-none focus:ring-2 focus:ring-blue-300"
            placeholder="Add new city"
            value={newCity}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setNewCity(e.target.value)}
            disabled={actionLoading}
            required
          />
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition disabled:bg-blue-400"
            disabled={actionLoading || !newCity.trim()}
          >
            {actionLoading ? "Adding..." : "Add City"}
          </button>
        </form>
      </div>
      {error && (
        <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {error}
        </div>
      )}
      {actionError && (
        <div className="mb-4 text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {actionError}
        </div>
      )}
      {successMsg && (
        <div className="mb-4 text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">
          {successMsg}
        </div>
      )}
      <div className="overflow-x-auto mt-2">
        <table className="w-full border rounded overflow-hidden bg-white shadow-sm">
          <thead className="bg-gradient-to-br from-gray-100 to-gray-50">
            <tr>
              <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">City Name</th>
              <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Created</th>
              <th className="py-3 px-3 font-semibold text-left text-gray-700 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : cities.length === 0 ? (
              <tr>
                <td colSpan={3} className="p-6 text-center text-gray-500">
                  No cities found.
                </td>
              </tr>
            ) : (
              cities.map((city) => (
                <tr
                  key={city._id}
                  className="transition border-b group last:border-b-0 hover:bg-blue-50"
                >
                  <td className="px-3 py-3 whitespace-nowrap font-medium">
                    {/* Edit input if editing */}
                    {editingCity && editingCity._id === city._id ? (
                      <form className="flex gap-2" onSubmit={handleEditSubmit}>
                        <input
                          value={editName}
                          onChange={(e: ChangeEvent<HTMLInputElement>) => setEditName(e.target.value)}
                          className="border px-2 py-1 rounded focus:ring-1 focus:ring-blue-400"
                          required
                          disabled={actionLoading}
                          autoFocus
                        />
                        <button
                          type="submit"
                          className="text-blue-700 font-semibold px-2 hover:underline disabled:opacity-50"
                          disabled={actionLoading || !editName.trim()}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCity(null);
                            setEditName("");
                          }}
                          className="text-gray-400 px-2 hover:text-gray-700"
                          disabled={actionLoading}
                        >
                          Cancel
                        </button>
                      </form>
                    ) : (
                      city.name
                    )}
                  </td>
                  <td className="px-3 py-3 whitespace-nowrap text-sm text-gray-500">
                    {city.createdAt
                      ? new Date(city.createdAt).toLocaleDateString()
                      : ""}
                  </td>
                  <td className="px-3 py-3">
                    {!editingCity || editingCity._id !== city._id ? (
                      <>
                        <button
                          onClick={() => handleEditInit(city)}
                          className="text-blue-700 font-medium px-2 hover:underline disabled:opacity-50"
                          disabled={actionLoading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteCity(city._id)}
                          className="text-red-600 font-medium px-2 hover:underline ml-3 disabled:opacity-50"
                          disabled={actionLoading}
                        >
                          Delete
                        </button>
                      </>
                    ) : null}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Cities;