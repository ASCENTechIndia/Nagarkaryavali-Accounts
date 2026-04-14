import { Formik, Form } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { useAuth } from "@/context/AuthContext";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmBalanceSheetSubGroupMst = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mode = location.state?.mode || 1;
  const editData = location.state?.data;

  const [groupList, setGroupList] = useState([]);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    groupId: "",
    subGroupId: "",
    subGroupName: "",
  });

  const api = axios.create({ baseURL: BASE_URL });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  // ✅ Initialization with Swal Loader
  useEffect(() => {
    const initializePage = async () => {
      try {
        setLoading(true);

        Swal.fire({
          title: "लोड होत आहे...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        // Fetch Group List
        const resList = await api.get("/api/SubGroup/balgrouplist");
        if (resList.data?.ok && resList.data?.data?.list) {
          setGroupList(resList.data.data.list);
        }

        // Edit Mode Autofill
        if (mode === 2 && editData) {
          const subId = editData.BALANCESUBGRPID;

          if (subId) {
            const resDetail = await api.get(
              `/api/SubGroup/balsubgroup/${subId}`
            );

            if (resDetail.data?.ok && resDetail.data?.data?.data) {
              const apiData = resDetail.data.data.data;

              setFormData({
                groupId: String(apiData.BALANCEGRPID || ""),
                subGroupId: String(apiData.BALANCESUBGRPID || ""),
                subGroupName: apiData.BALANCESUBGRPNAME || "",
              });
            } else {
              setFormData({
                groupId: String(editData.BALANCEGRPID || ""),
                subGroupId: String(editData.BALANCESUBGRPID || ""),
                subGroupName: editData.BALANCESUBGRPNAME || "",
              });
            }
          }
        }

        Swal.close();
      } catch (err) {
        Swal.close();
        console.error("Initialization Error:", err);
        Swal.fire("Error", "माहिती लोड करताना त्रुटी आली", "error");
      } finally {
        setLoading(false);
      }
    };

    initializePage();
  }, [mode, editData]);

  // ✅ Submit Handler
  const handleSubmit = async (values, { resetForm }) => {
    try {
      const payload = {
        groupId: Number(values.groupId),
        subGroupId: Number(values.subGroupId || 0),
        subGroupName: values.subGroupName,
        userId: user?.userId || 1,
        mode: mode === 2 ? 2 : 1,
      };

      Swal.fire({
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await api.post(
        `/api/SubGroup/balsubgroupmaster`,
        payload
      );

      Swal.close();

      if (res.data?.ok) {
        await Swal.fire(
          "Success",
          res.data.message || "साठवले यशस्वीरित्या",
          "success"
        );
        resetForm();
        navigate("/Masters/FrmBalanceSheetSubGroupList");
      } else {
        Swal.fire("Error", res.data?.message, "error");
      }
    } catch (err) {
      Swal.close();
      Swal.fire(
        "Error",
        err.response?.data?.message || "Server error",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-lg font-medium">
        कृपया थांबा, लोड होत आहे...
      </div>
    );
  }

  return (
    <Formik
      enableReinitialize
      initialValues={formData}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, setFieldValue, isSubmitting }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="shadow-sm border rounded-lg">
              
              {/* HEADER */}
              <CardHeader className="border-b flex justify-between items-center">
                <CardTitle className="text-lg font-semibold">
                  ताळमेळ पत्रक उप गट मास्टर
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 md:p-8 space-y-6">
                <div className="max-w-3xl mx-auto space-y-6">

                  {/* GROUP ID */}
                  <div className="grid grid-cols-1 md:grid-cols-[220px_20px_1fr] gap-2 items-center">
                    <Label className="md:text-right font-semibold w-full">
                      शिल्लकपत्रक गट संकेतांक
                    </Label>
                    <span className="hidden md:block text-center font-bold">:</span>
                    <Input
                      name="groupId"
                      value={values.groupId || ""}
                      readOnly
                      className="cursor-not-allowed"
                    />
                  </div>

                  {/* GROUP NAME */}
                  <div className="grid grid-cols-1 md:grid-cols-[220px_20px_1fr] gap-2 items-center">
                    <Label className="md:text-right font-semibold w-full">
                      शिल्लकपत्रक गटचे नाव
                    </Label>
                    <span className="hidden md:block text-center font-bold">:</span>
                    <Select
                      value={
                        values.groupId ? String(values.groupId) : undefined
                      }
                      onValueChange={(val) =>
                        setFieldValue("groupId", val)
                      }
                      disabled={mode === 2}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- निवडा --" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupList.map((grp) => (
                          <SelectItem
                            key={grp.VALUE}
                            value={String(grp.VALUE)}
                          >
                            {grp.LABEL}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* SUBGROUP NAME */}
                  <div className="grid grid-cols-1 md:grid-cols-[220px_20px_1fr] gap-2 items-center">
                    <Label className="md:text-right font-semibold w-full">
                      शिल्लकपत्रक उप गटचे नाव
                    </Label>
                    <span className="hidden md:block text-center font-bold">:</span>
                    <Input
                      name="subGroupName"
                      placeholder="उप गटाचे नाव प्रविष्ट करा"
                      value={values.subGroupName || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 pt-8 border-t">
                  <Button
                    type="submit"
                    className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto"
                    disabled={isSubmitting || loading}
                  >
                    {isSubmitting ? "प्रक्रिया सुरू आहे..." : "साठवा"}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={() =>
                      navigate("/Masters/FrmBalanceSheetSubGroupList")
                    }
                  >
                    परत
                  </Button>
                </div>

              </CardContent>
            </Card>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default FrmBalanceSheetSubGroupMst;