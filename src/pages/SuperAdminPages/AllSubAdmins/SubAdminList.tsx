import { useEffect, useState } from "react";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../../../components/ui/table";
import { UserCircleIcon } from "../../../icons";
import Button from "../../../components/ui/button/Button";
import { Link } from "react-router";

// Simple modal (like on Vendor/Supervisor pages)
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center px-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg min-w-[320px] max-w-md w-full">
        {title && <div className="p-4 border-b border-gray-200 font-bold text-lg">{title}</div>}
        <div className="p-4">{children}</div>
        <div className="flex justify-end px-4 pb-4">
          <Button  onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
}

// Simple input
function LabeledInput({
  label,
  value,
  onChange,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-3">
      <label className="block text-sm font-medium mb-1">{label}{required ? <span className="text-red-500">*</span> : null}</label>
      <input
        type={type}
        value={value}
        name={name}
        required={required}
        onChange={onChange}
        className="w-full px-3 py-2 border rounded-lg focus:ring focus:ring-brand-100 text-gray-900 dark:text-white dark:bg-gray-800 dark:border-gray-700"
      />
    </div>
  );
}

// Interface for SubAdmins
interface SubAdmins {
  _id: string;
  name: string;
  email: string;
  phoneNo: string;
  nickName: string;
  address: {
    addressLine: string;
    city: string;
    state: string;
    pincode: string;
  };
  zone: string;
}

export default function SubAdminList() {
  const [subadmins, setSubAdmins] = useState<SubAdmins[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filtering state
  const [filter, setFilter] = useState<string>("");

  // For Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubAdmin, setEditingSubAdmin] = useState<SubAdmins | null>(null);
  const [editValues, setEditValues] = useState({
    name: "",
    nickName: "",
    email: "",
    phoneNo: "",
    zone: "",
    addressLine: "",
    city: "",
    state: "",
    pincode: "",
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSuccess, setEditSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubAdmins = async () => {
      try {
        const token = localStorage.getItem("admin-token");
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/admin/get-all-sub-admins`,
          {
            headers: {
              Authorization: `${token}`,
            },
          }
        );
        setSubAdmins(res.data.subadmins || []);
      } catch (err: any) {
        console.error("Error fetching subadmins:", err);
        setError(
          err.response?.data?.message ||
            "Failed to fetch subadmins. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchSubAdmins();
  }, []);

  // When edit modal opens, fill the form
  const handleEditClick = (subadmin: SubAdmins) => {
    setEditingSubAdmin(subadmin);
    setEditValues({
      name: subadmin.name || "",
      nickName: subadmin.nickName || "",
      email: subadmin.email || "",
      phoneNo: subadmin.phoneNo || "",
      zone: subadmin.zone || "",
      addressLine: subadmin.address?.addressLine || "",
      city: subadmin.address?.city || "",
      state: subadmin.address?.state || "",
      pincode: subadmin.address?.pincode || "",
    });
    setEditError(null);
    setEditSuccess(null);
    setEditModalOpen(true);
  };

  // Save edit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditSubmitting(true);
    setEditError(null);
    setEditSuccess(null);

    try {
      const token = localStorage.getItem("admin-token");
      const res = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/admin/update-sub-admin/${editingSubAdmin?._id}`,
        {
          name: editValues.name,
          nickName: editValues.nickName,
          email: editValues.email,
          phoneNo: editValues.phoneNo,
          zone: editValues.zone,
          addressLine: editValues.addressLine,
          city: editValues.city,
          state: editValues.state,
          pincode: editValues.pincode,
        },
        {
          headers: {
            Authorization: `${token}`,
          },
        }
      );
      setEditSuccess("Sub Admin updated successfully!");
      // Update list locally
      setSubAdmins((prev) =>
        prev.map((sa) =>
          sa._id === editingSubAdmin?._id
            ? {
                ...sa,
                ...res.data.subAdmin,
                address: {
                  addressLine: res.data.subAdmin.address?.addressLine || "",
                  city: res.data.subAdmin.address?.city || "",
                  state: res.data.subAdmin.address?.state || "",
                  pincode: res.data.subAdmin.address?.pincode || "",
                },
              }
            : sa
        )
      );
      setTimeout(() => {
        setEditModalOpen(false);
      }, 1200);
    } catch (err: any) {
      setEditError(
        err.response?.data?.message || "Failed to update Sub Admin. Please try again."
      );
    } finally {
      setEditSubmitting(false);
    }
  };

  // Filtering logic
  const filteredSubAdmins = filter.trim()
    ? subadmins.filter((subadmin) => {
        const filterText = filter.toLowerCase();
        return (
          subadmin.name?.toLowerCase().includes(filterText) ||
          subadmin.email?.toLowerCase().includes(filterText) ||
          subadmin.phoneNo?.toLowerCase().includes(filterText) ||
          subadmin.nickName?.toLowerCase().includes(filterText) ||
          subadmin._id?.toLowerCase().includes(filterText)
        );
      })
    : subadmins;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="w-10 h-10 border-4 border-t-4 border-gray-200 border-t-brand-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-red-600 bg-red-100 border border-red-300 rounded-md">
        {error}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="max-w-full overflow-x-auto">
        {/* Filter Input */}
        <div className="p-4">
          <input
            type="text"
            className="w-full max-w-md px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 dark:bg-gray-900 dark:text-gray-200 dark:border-gray-700"
            placeholder="Search by Name, Email, Phone No, Nick Name, or ID..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <Table>
          {/* Table Header */}
          <TableHeader className="border-b border-gray-100 dark:border-white/[0.05]">
            <TableRow>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-gray-500"
              >
                Sub Admin Id
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-gray-500"
              >
                Name & Nick Name
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-gray-500"
              >
                Zone
              </TableCell>

              <TableCell
                isHeader
                className="px-5 py-3 text-start text-gray-500"
              >
                Email & Phone No.
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-gray-500"
              >
                Address Line
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-gray-500"
              >
                City
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-gray-500"
              >
                State
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-gray-500"
              >
                Pin Code
              </TableCell>
              <TableCell
                isHeader
                className="px-5 py-3 text-start text-gray-500"
              >
                Action
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}
          <TableBody className="divide-y divide-gray-100 dark:divide-white/[0.05]">
            {filteredSubAdmins.length === 0 ? (
              <TableRow>
                <TableCell className="px-4 py-4 text-gray-500 text-center">
                  No sub-admins found.
                </TableCell>
              </TableRow>
            ) : (
              filteredSubAdmins.map((subadmin) => (
                <TableRow key={subadmin._id}>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {subadmin._id}
                  </TableCell>
                  <TableCell className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex justify-center items-center rounded-full">
                        <UserCircleIcon width={28} height={28} />
                      </div>
                      <span className="font-medium text-gray-800 dark:text-white">
                        {subadmin.name} <br /> {subadmin.nickName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {subadmin.zone}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    <a
                      href={`mailto:${subadmin.email}`}
                      className="hover:underline text-blue-800 dark:text-blue-400"
                    >
                      {subadmin.email}
                    </a>
                    <br />
                    <a
                      href={`tel:${subadmin.phoneNo}`}
                      className="hover:underline text-blue-800 dark:text-blue-400"
                    >
                      {subadmin.phoneNo}
                    </a>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {subadmin.address?.addressLine}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {subadmin.address?.city}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {subadmin.address?.state}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                    {subadmin.address?.pincode}
                  </TableCell>
                  <TableCell className="px-4 py-3 flex flex-col gap-2 justify-center items-center text-gray-600 dark:text-gray-400 space-x-2">
                    <Link
                      to="/admin/issue-assets-to-sub-admin"
                      state={{ subAdminId: subadmin._id }}
                    >
                      <Button className="!px-4 !py-2 bg-blue-500 whitespace-nowrap">Issue Assets</Button>
                    </Link>
                    <Button className="!px-4 !py-2 bg-red-500" onClick={() => handleEditClick(subadmin)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      {/* Edit Modal */}
      <Modal
        open={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        title="Edit Sub Admin"
      >
        <form onSubmit={handleEditSubmit}>
          <LabeledInput
            label="Name"
            name="name"
            value={editValues.name}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, name: e.target.value }))
            }
            required
          />
          <LabeledInput
            label="Nick Name"
            name="nickName"
            value={editValues.nickName}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, nickName: e.target.value }))
            }
          />
          <LabeledInput
            label="Email"
            name="email"
            value={editValues.email}
            type="email"
            onChange={(e) =>
              setEditValues((v) => ({ ...v, email: e.target.value }))
            }
            required
          />
          <LabeledInput
            label="Phone No"
            name="phoneNo"
            value={editValues.phoneNo}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, phoneNo: e.target.value }))
            }
            required
          />
          <LabeledInput
            label="Zone"
            name="zone"
            value={editValues.zone}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, zone: e.target.value }))
            }
          />
          <LabeledInput
            label="Address Line"
            name="addressLine"
            value={editValues.addressLine}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, addressLine: e.target.value }))
            }
          />
          <LabeledInput
            label="City"
            name="city"
            value={editValues.city}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, city: e.target.value }))
            }
          />
          <LabeledInput
            label="State"
            name="state"
            value={editValues.state}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, state: e.target.value }))
            }
          />
          <LabeledInput
            label="Pin Code"
            name="pincode"
            value={editValues.pincode}
            onChange={(e) =>
              setEditValues((v) => ({ ...v, pincode: e.target.value }))
            }
          />
          {editError && (
            <div className="p-2 text-sm text-red-600">{editError}</div>
          )}
          {editSuccess && (
            <div className="p-2 text-sm text-green-600">{editSuccess}</div>
          )}
          <div className="flex justify-end mt-4">
            <Button
              disabled={editSubmitting}
              className="min-w-[110px]"
            >
              {editSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
