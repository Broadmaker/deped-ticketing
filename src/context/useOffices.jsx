// src/context/useOffices.jsx
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { api } from "../lib/api.js";

const OfficesContext = createContext(null);

export function OfficesProvider({ children }) {
  const [offices, setOffices] = useState([]);
  const [servicesMap, setServicesMap] = useState({}); // { officeId: [service, ...] }
  const [loading, setLoading] = useState(false);

  const fetchOffices = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get("/offices");
      // Normalize services: API returns .description, frontend uses .desc
      const normalize = (svcs) =>
        (svcs || []).map((s) => ({ ...s, desc: s.description }));
      setOffices(
        data.map((o) => ({
          ...o,
          comingSoon: !o.is_active, // map backend field to frontend convention
        })),
      );
      // Build servicesMap from nested services array
      const map = {};
      data.forEach((o) => {
        map[o.id] = normalize(o.services);
      });
      setServicesMap(map);
    } catch (err) {
      console.error("Failed to load offices:", err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOffices();
  }, [fetchOffices]);

  // ── Offices ───────────────────────────────────────────────────────────────

  async function addOffice(data) {
    const id = data.name
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    const office = await api.post("/offices", {
      id,
      name: data.name,
      icon: data.icon || "🏢",
      description: data.description || "",
    });
    await fetchOffices();
    return office;
  }

  async function updateOffice(id, data) {
    await api.patch(`/offices/${id}`, {
      name: data.name,
      icon: data.icon,
      description: data.description,
    });
    await fetchOffices();
  }

  async function toggleOfficeStatus(id) {
    const office = offices.find((o) => o.id === id);
    if (!office) return;
    await api.patch(`/offices/${id}`, { is_active: !!office.comingSoon }); // comingSoon=true means inactive, so toggling to active
    await fetchOffices();
  }

  async function deleteOffice(id) {
    await api.delete(`/offices/${id}`);
    await fetchOffices();
  }

  // ── Services ──────────────────────────────────────────────────────────────

  function getServices(officeId) {
    return servicesMap[officeId] || [];
  }

  async function addService(officeId, data) {
    const id =
      data.label
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_]/g, "") +
      "_" +
      Date.now().toString(36).slice(-4);
    const service = await api.post(`/offices/${officeId}/services`, {
      id,
      label: data.label,
      icon: data.icon || "🔧",
      description: data.desc || "",
      sort_order: (servicesMap[officeId] || []).length,
    });
    await fetchOffices();
    return service;
  }

  async function updateService(officeId, serviceId, data) {
    await api.patch(`/offices/${officeId}/services/${serviceId}`, {
      label: data.label,
      icon: data.icon,
      description: data.desc,
    });
    await fetchOffices();
  }

  async function deleteService(officeId, serviceId) {
    await api.delete(`/offices/${officeId}/services/${serviceId}`);
    await fetchOffices();
  }

  async function reorderService(officeId, fromIdx, toIdx) {
    // Optimistic update locally
    const list = [...(servicesMap[officeId] || [])];
    const [moved] = list.splice(fromIdx, 1);
    list.splice(toIdx, 0, moved);
    setServicesMap((prev) => ({ ...prev, [officeId]: list }));
    // Persist new sort_order for each service
    await Promise.all(
      list.map((svc, i) =>
        api.patch(`/offices/${officeId}/services/${svc.id}`, { sort_order: i }),
      ),
    );
  }

  return (
    <OfficesContext.Provider
      value={{
        offices,
        servicesMap,
        loading,
        fetchOffices,
        addOffice,
        updateOffice,
        toggleOfficeStatus,
        deleteOffice,
        getServices,
        addService,
        updateService,
        deleteService,
        reorderService,
      }}
    >
      {children}
    </OfficesContext.Provider>
  );
}

export function useOffices() {
  const ctx = useContext(OfficesContext);
  if (!ctx) throw new Error("useOffices must be used within OfficesProvider");
  return ctx;
}
