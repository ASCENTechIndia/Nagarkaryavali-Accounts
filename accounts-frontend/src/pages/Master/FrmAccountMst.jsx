import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/Components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/Components/ui/button";

/* ================= FIELD ================= */
const Field = ({ label, children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
    <span className="sm:text-right font-medium">{label} :</span>
    <div>{children}</div>
  </div>
);

const FrmNidhiConfig = () => {
  const { user } = useAuth();
  const token = user?.token;

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [corporations, setCorporations] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [nidhiList, setNidhiList] = useState([]);

  const [selectedCorp, setSelectedCorp] = useState(user?.ulbId?.toString() || "");
  const [selectedBudget, setSelectedBudget] = useState("");

  /* ================= LOAD CORPORATION ================= */
  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/FrmParty/corporation/list`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCorporations(res.data?.data?.list || []);
      })
      .catch(() => Swal.fire("Corporation load failed"));
  }, []);

  /* ================= LOAD BUDGET ================= */
  useEffect(() => {
    if (!selectedCorp) return;

    axios
      .get(`${BASE_URL}/api/BudgetHeadConfig/head`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setBudgets(res.data?.data?.data || []);
      })
      .catch(() => Swal.fire("Budget load failed"));
  }, [selectedCorp]);

  /* ================= FETCH NIDHI MASTER ================= */
  const fetchNidhiMaster = async (budgetId) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmNidhiConfig/nidhi-master-config`,
        {
          ulbId: selectedCorp,
          budgetId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const master = res.data?.data?.list || [];

      const updated = master.map((n) => ({
        ...n,
        checked: false,
      }));

      // 🔥 fetch config
      fetchNidhiConfig(budgetId, updated);
    } catch {
      Swal.fire("Nidhi master load failed");
    }
  };

  /* ================= FETCH CONFIG ================= */
  const fetchNidhiConfig = async (budgetId, masterList) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmNidhiConfig/nidhi-config-list`,
        {
          ulbId: selectedCorp,
          budgetId,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const config = res.data?.data?.list || [];

      const updated = masterList.map((n) => ({
        ...n,
        checked: config.some((c) => c.NIDHIID === n.NIDHIID),
      }));

      setNidhiList(updated);
    } catch {
      console.error("Config load failed");
    }
  };

  /* ================= CHECK ================= */
  const toggleCheck = (index, checked) => {
    const updated = [...nidhiList];
    updated[index].checked = checked;
    setNidhiList(updated);
  };

  const handleSelectAll = (checked) => {
    setNidhiList(nidhiList.map((n) => ({ ...n, checked })));
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
      const selected = nidhiList.filter((n) => n.checked);

      if (!selected.length) {
        Swal.fire("किमान एक निधी निवडा");
        return;
      }

      const nidhiCfgStr = selected
        .map((n) => `${n.NIDHIID}#N#Y`)
        .join("$");

      await axios.post(
        `${BASE_URL}/api/FrmNidhiConfig/nidhi-config-insert`,
        {
          userId: user?.userId,
          ulbId: selectedCorp,
          budgetId: selectedBudget,
          nidhiCfgStr,
          mode: "1",
          ipAddress: "127.0.0.1",
          source: "RW",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Saved successfully");
    } catch {
      Swal.fire("Save failed");
    }
  };

  return (
    <div className="p-6 bg-white rounded shadow space-y-6">

      <h2 className="text-lg font-semibold">Nidhi Configuration</h2>

      {/* ================= CORPORATION ================= */}
      <Field label="महानगरपालिका">
        <Select
          value={selectedCorp}
          onValueChange={(v) => {
            setSelectedCorp(v);
            setSelectedBudget("");
            setNidhiList([]);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Corporation" />
          </SelectTrigger>

          <SelectContent>
            {corporations.map((c) => (
              <SelectItem
                key={c.NUM_CORPORATION_ID}
                value={c.NUM_CORPORATION_ID.toString()}
              >
                {c.VAR_CORPORATION_NAME}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* ================= BUDGET ================= */}
      <Field label="Budget">
        <Select
          value={selectedBudget}
          onValueChange={(v) => {
            setSelectedBudget(v);
            fetchNidhiMaster(v);
          }}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select Budget" />
          </SelectTrigger>

          <SelectContent>
            {budgets.map((b) => (
              <SelectItem key={b.HEADID} value={String(b.HEADID)}>
                {b.BUDGETNAME}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {/* ================= TABLE ================= */}
      <div className="border rounded">

        {/* HEADER */}
        <div className="grid grid-cols-[50px_1fr] bg-blue-900 text-white p-2">
          <div className="flex justify-center">
            <Checkbox
              checked={nidhiList.length > 0 && nidhiList.every((n) => n.checked)}
              onCheckedChange={handleSelectAll}
            />
          </div>
          <div>Nidhi</div>
        </div>

        {/* BODY */}
        {nidhiList.map((n, i) => (
          <div key={n.NIDHIID} className="grid grid-cols-[50px_1fr] p-2 border-b">
            <div className="flex justify-center">
              <Checkbox
                checked={n.checked}
                onCheckedChange={(checked) => toggleCheck(i, checked)}
              />
            </div>
            <div>{n.NIDHINAME}</div>
          </div>
        ))}

        {nidhiList.length === 0 && (
          <div className="p-4 text-center text-red-500">
            No records found
          </div>
        )}
      </div>

      {/* ================= SAVE ================= */}
      <div className="text-center">
        <Button onClick={handleSave} className="bg-blue-900 text-white">
          Save
        </Button>
      </div>
    </div>
  );
};

export default FrmNidhiConfig;