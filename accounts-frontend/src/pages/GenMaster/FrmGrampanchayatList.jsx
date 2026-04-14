import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import ShadCNTable from "@/components/ui/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmGramPanchayatList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState("");
  const [list, setList] = useState([]);

  const headers = ["निवडा", "ग्रामपंचायतीचे नाव", "मराठी नाव"];

  const keyMapping = {
    निवडा: "select",
    "ग्रामपंचायतीचे नाव": "name",
    "मराठी नाव": "nameMarathi",
  };

  /* 🔥 FETCH ZONES */
  const fetchZones = async () => {
    try {
      Swal.fire({
        title: "Loading Zones...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.get(
        `${BASE_URL}/api/Grampanchayat/deptlist`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      Swal.close();

      if (res.data?.ok && res.data?.data?.list) {
        setZones(res.data.data.list);
      }
    } catch (err) {
      Swal.close();
      Swal.fire("Error loading zones");
    }
  };

  /* 🔥 FETCH LIST */
  const fetchList = async (zoneId) => {
    try {
      Swal.fire({
        title: "Loading Data...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.get(
        `${BASE_URL}/api/Grampanchayat/grampanchlist?deptId=${zoneId}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      Swal.close();

      if (res.data?.ok && res.data?.data?.list) {
        setList(res.data.data.list);
      } else {
        setList([]);
      }
    } catch (err) {
      Swal.close();
      Swal.fire("Error loading list");
    }
  };

  useEffect(() => {
    fetchZones();
  }, []);

  useEffect(() => {
    if (selectedZone) fetchList(selectedZone);
    else setList([]);
  }, [selectedZone]);

  const tableData = list.map((row) => ({
    select: (
      <Button
        variant="link"
        size="sm"
        className="text-blue-700 px-0"
        onClick={() =>
          navigate("/Masters/FrmGramPanchayat", {
            state: { mode: 2, data: row },
          })
        }
      >
        निवडा
      </Button>
    ),
    name: row.VAR_GRAMPANCH_GRAMPANCH?.trim(),
    nameMarathi: row.VAR_GRAMPANCH_MARATHINAME?.trim(),
  }));

  return (
    <motion.div className="max-w-7xl mx-auto mt-6">
      <Card className="shadow-sm border rounded-lg">
        <CardHeader className="border-b flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">ग्रामपंचायत यादी</CardTitle>

          <Button onClick={() => navigate("/Masters/FrmGramPanchayat")}>
            नवीन जोडा
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-6">

          {/* SEARCH */}
          <div className="flex gap-4 items-center">
            <Label>झोन नाव :</Label>

            <Select
              value={selectedZone}
              onValueChange={(val) => setSelectedZone(val)}
            >
              <SelectTrigger className="w-72">
                <SelectValue placeholder="निवडा" />
              </SelectTrigger>

              <SelectContent>
                {zones.map((z) => (
                  <SelectItem
                    key={z.VALUE}
                    value={z.VALUE.toString()}
                  >
                    {z.LABEL}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* TABLE */}
          <ShadCNTable
            headers={headers}
            data={
              list.length > 0
                ? tableData
                : [
                    {
                      select: "",
                      name: "डेटा उपलब्ध नाही",
                      nameMarathi: "",
                    },
                  ]
            }
            keyMapping={keyMapping}
            pagination={list.length > 0}
          />

        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmGramPanchayatList;