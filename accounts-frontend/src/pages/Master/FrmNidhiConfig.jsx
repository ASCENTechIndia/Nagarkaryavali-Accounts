import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import ShadCNTable from "@/components/ui/table";

/* ================= ALIGNMENT ================= */
const Field = ({ label, children }) => (
  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
    <Label className="w-40 font-medium text-gray-700">{label} :</Label>
    <div className="w-full">{children}</div>
  </div>
);

const FrmNidhiConfig = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [corporations, setCorporations] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [selectedCorp, setSelectedCorp] = useState(ulbId?.toString());
  const [selectedBudget, setSelectedBudget] = useState("");

  const [nidhiList, setNidhiList] = useState([]);

  /* ================= LOADER ================= */
  const showLoader = (text = "Loading...") => {
    Swal.fire({
      title: text,
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });
  };

  const closeLoader = () => Swal.close();

  /* ================= CORPORATION ================= */
  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/FrmParty/corporation/list`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        setCorporations(res.data?.data?.list || []);
      });
  }, []);

  /* ================= BUDGET ================= */
  useEffect(() => {
    if (!selectedCorp) return;

    const loadBudget = async () => {
      try {
        showLoader("Loading Budget...");

        const res = await axios.get(
          `${BASE_URL}/api/BudgetHeadConfig/head`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const list = res.data?.data?.data || [];
        setBudgets(list);

        if (list.length > 0) {
          const first = list[0].HEADID.toString();
          setSelectedBudget(first);
          await fetchNidhi(first);
        }

      } catch {
        Swal.fire("Budget load failed");
      } finally {
        closeLoader();
      }
    };

    loadBudget();
  }, [selectedCorp]);

  /* ================= FETCH NIDHI ================= */
  const fetchNidhi = async (budgetId) => {
    try {
      showLoader("Loading Nidhi...");

      const masterRes = await axios.post(
        `${BASE_URL}/api/FrmNidhiConfig/nidhi-master-config`,
        { ulbId: selectedCorp, budgetId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const configRes = await axios.post(
        `${BASE_URL}/api/FrmNidhiConfig/nidhi-config-list`,
        { ulbId: selectedCorp, budgetId },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const master = masterRes.data?.data?.list || [];
      const config = configRes.data?.data?.list || [];

      const merged = master.map((n) => {
        const isSelected = config.some((c) => c.NIDHIID === n.NIDHIID);

        return {
          ...n,
          checked: isSelected,
          previousStatus: isSelected ? "Y" : "N", // 🔥 important
        };
      });

      setNidhiList(merged);

    } catch {
      Swal.fire("Nidhi load failed");
    } finally {
      closeLoader();
    }
  };

  /* ================= TABLE ================= */
  const headers = ["निवडा", "निधी"];
  const keyMapping = {
    निवडा: "checked",
    निधी: "name",
  };

  const tableData = nidhiList.map((n) => ({
    checked: n.checked,
    name: n.NIDHINAME,
    original: n,
  }));

  /* ================= CHECK ================= */
  const handleSelectAll = (checked) => {
    setNidhiList((prev) =>
      prev.map((n) => ({ ...n, checked }))
    );
  };

  const handleRowCheck = (row, checked) => {
    setNidhiList((prev) =>
      prev.map((n) =>
        n.NIDHIID === row.original.NIDHIID
          ? { ...n, checked }
          : n
      )
    );
  };

  /* ================= SAVE ================= */
  const handleSave = async () => {
    try {
      showLoader("Saving...");

      let hasChecked = false;

      const nidhiCfgStr = nidhiList
        .map((n) => {
          if (n.checked) hasChecked = true;

          return `${n.NIDHIID}#${n.previousStatus}#${n.checked ? "Y" : "N"}`;
        })
        .join("$");

      if (!hasChecked) {
        closeLoader();
        Swal.fire("Select Atleast One CheckBox!");
        return;
      }

      await axios.post(
        `${BASE_URL}/api/FrmNidhiConfig/nidhi-config-insert`,
        {
          userId: user?.userId,
          ulbId: selectedCorp,
          budgetId: selectedBudget,
          nidhiCfgStr,
          mode: nidhiList.some(n => n.previousStatus === "Y") ? "2" : "1",
          ipAddress: "127.0.0.1",
          source: "RW",
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Swal.fire("Saved successfully");

    } catch {
      Swal.fire("Save failed");
    } finally {
      closeLoader();
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className="shadow-sm border rounded-lg">

        <CardHeader className="border-b">
          <CardTitle>निधी कॉन्फिगरेशन</CardTitle>
        </CardHeader>

        <CardContent className="p-5 space-y-5">

          {/* FORM */}
          <div className="space-y-4">

            {/* CORPORATION */}
            <Field label="महानगरपालिका">
              <Select
                value={selectedCorp}
                onValueChange={(v) => setSelectedCorp(v)}
                disabled={!!ulbId}
              >
                <SelectTrigger>
                  <SelectValue />
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

            {/* BUDGET */}
            <Field label="Budget">
              <Select
                value={selectedBudget}
                onValueChange={(v) => {
                  setSelectedBudget(v);
                  fetchNidhi(v);
                }}
              >
                <SelectTrigger className="w-72">
                  <SelectValue />
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

          </div>

          {/* TABLE */}
          <ShadCNTable
            headers={headers}
            data={tableData}
            keyMapping={keyMapping}
            pagination={true}
            rowsPerPage={5}
            onSelectAllChange={handleSelectAll}
            onRowCheckChange={handleRowCheck}
          />

          {/* SAVE */}
          <div className="flex justify-center">
            <Button className="bg-blue-900 text-white" onClick={handleSave}>
              Save
            </Button>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmNidhiConfig;