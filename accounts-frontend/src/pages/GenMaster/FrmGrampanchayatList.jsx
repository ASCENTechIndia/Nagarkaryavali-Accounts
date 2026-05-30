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

  /* FETCH ZONES */
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

      if (res.data?.ok && Array.isArray(res.data?.data?.list)) {
        setZones(res.data.data.list);
      } else {
        setZones([]);
      }
    } catch (error) {
      Swal.close();
      console.error("Zone list error:", error);

      setZones([]);

      Swal.fire({
        // icon: "error",
        title: "Error loading zones",
      });
    }
  };

  /* FETCH GRAMPANCHAYAT LIST */
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

      if (res.data?.ok && Array.isArray(res.data?.data?.list)) {
        setList(res.data.data.list);
      } else {
        setList([]);
      }
    } catch (error) {
      Swal.close();
      console.error("Grampanchayat list error:", error);

      setList([]);

      Swal.fire({
        // icon: "error",
        title: "Error loading list",
      });
    }
  };

  /* LOAD ZONES */
  useEffect(() => {
    if (user?.token) {
      fetchZones();
    }
  }, [user?.token]);

  /* LOAD LIST WHEN ZONE CHANGES */
  useEffect(() => {
    if (selectedZone) {
      fetchList(selectedZone);
    } else {
      setList([]);
    }
  }, [selectedZone]);

  /* TABLE DATA */
  const tableData = list.map((row, index) => ({
    id: row.NUM_GRAMPANCH_ID || index,
    select: (
      <Button
        type="button"
        variant="link"
        size="sm"
        className="text-blue-700 px-0"
        onClick={() =>
          navigate("/Masters/FrmGramPanchayat", {
            state: {
              mode: 2,
              data: row,
            },
          })
        }
      >
        निवडा
      </Button>
    ),
    name: row.VAR_GRAMPANCH_GRAMPANCH?.trim() || "-",
    nameMarathi: row.VAR_GRAMPANCH_MARATHINAME?.trim() || "-",
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto mt-6"
    >
      <Card className="shadow-sm border rounded-lg">
        {/* Header */}
        <CardHeader className="border-b flex flex-row justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            ग्रामपंचायत यादी
          </CardTitle>

          <Button
            type="button"
            onClick={() =>
              navigate("/Masters/FrmGramPanchayat", {
                state: {
                  mode: 1,
                },
              })
            }
          >
            नवीन जोडा
          </Button>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6 space-y-6">
          {/* Zone Dropdown */}
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Label>झोन नाव :</Label>

            <Select
              value={selectedZone}
              onValueChange={(value) => setSelectedZone(value)}
            >
              <SelectTrigger className="w-full sm:w-72">
                <SelectValue placeholder="निवडा" />
              </SelectTrigger>

              <SelectContent>
                {zones.map((zone) => (
                  <SelectItem
                    key={zone.VALUE}
                    value={zone.VALUE.toString()}
                  >
                    {zone.LABEL}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table / No Data Message */}
          {selectedZone ? (
            tableData.length > 0 ? (
              <div className="border rounded-md overflow-hidden">
                <ShadCNTable
                  headers={headers}
                  data={tableData}
                  keyMapping={keyMapping}
                  pagination={true}
                />
              </div>
            ) : (
              <div className="text-center py-10 text-gray-500 font-medium border rounded-md">
                Data not found 
              </div>
            )
          ) : (
            <div className="text-center py-10 text-gray-500 font-medium border rounded-md">
              कृपया झोन निवडा
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmGramPanchayatList;