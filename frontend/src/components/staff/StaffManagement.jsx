import { useState, useEffect } from "react";
import Button from "../common/Button.jsx";
import Badge from "../common/Badge.jsx";
import Loader from "../common/Loader.jsx";
import { getHotelStaff, addHotelStaff, removeHotelStaff } from "../../api/adminApi.js";

export default function StaffManagement({ hotelId, token, onRefresh }) {
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "front_desk",
    password: ""
  });

  async function loadStaff() {
    if (!token || !hotelId) return;
    setLoading(true);
    try {
      const staffList = await getHotelStaff(token, hotelId);
      setStaff(staffList);
      setError("");
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to load staff");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
  }, [hotelId, token]);

  async function handleAddStaff(e) {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      setError("All fields are required");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      await addHotelStaff(token, hotelId, formData);
      setSuccess("Staff member added successfully!");
      setFormData({ name: "", email: "", phone: "", role: "front_desk", password: "" });
      setShowForm(false);
      await loadStaff();
      onRefresh?.();
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to add staff member");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveStaff(staffId) {
    if (!confirm("Are you sure you want to remove this staff member?")) return;

    setSaving(true);
    setError("");

    try {
      await removeHotelStaff(token, hotelId, staffId);
      setSuccess("Staff member removed successfully!");
      await loadStaff();
    } catch (err) {
      setError(err.response?.data?.error?.message || "Failed to remove staff member");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Hotel Staff</h3>
        <Button
          onClick={() => setShowForm(!showForm)}
          variant="primary"
          size="sm"
        >
          {showForm ? "Cancel" : "+ Add Staff"}
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/50 bg-red-500/10 p-4 text-red-200">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500/50 bg-green-500/10 p-4 text-green-200">
          {success}
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAddStaff} className="space-y-4 rounded-lg border border-white/10 bg-white/5 p-6">
          <div>
            <label className="block text-sm font-medium text-slate-300">Staff Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              placeholder="john@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              placeholder="+91 98765 43210"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Role</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white focus:border-amber-500 focus:outline-none"
            >
              <option value="front_desk">Front Desk</option>
              <option value="housekeeper">Housekeeper</option>
              <option value="manager">Manager</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Password</label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={saving}
            fullWidth
          >
            {saving ? "Adding..." : "Add Staff Member"}
          </Button>
        </form>
      )}

      <div className="space-y-3">
        {staff.length === 0 ? (
          <div className="rounded-lg border border-white/10 bg-white/5 p-8 text-center">
            <p className="text-slate-400">No staff members assigned yet</p>
          </div>
        ) : (
          staff.map((member) => (
            <div key={member.staffId} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex-1">
                <p className="font-medium text-white">{member.name}</p>
                <p className="text-sm text-slate-400">{member.email}</p>
                {member.phone && <p className="text-sm text-slate-400">{member.phone}</p>}
              </div>
              <div className="flex items-center gap-3">
                <Badge tone={member.role === "manager" ? "warning" : "neutral"}>
                  {member.role.replace("_", " ")}
                </Badge>
                <button
                  onClick={() => handleRemoveStaff(member.staffId)}
                  disabled={saving}
                  className="rounded-lg bg-red-500/20 px-3 py-1 text-xs font-medium text-red-300 hover:bg-red-500/30 disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
