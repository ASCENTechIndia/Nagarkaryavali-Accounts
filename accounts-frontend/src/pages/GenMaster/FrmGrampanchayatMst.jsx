import { Formik, Form } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmGrampanchayatMst = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mode = location.state?.mode || 1;
  const editData = location.state?.data;

  const [zones, setZones] = useState([]);
  const [formData, setFormData] = useState({
    zoneId: "",
    gpCode: "",
    gpName: "",
    gpNameMarathi: "",
  });

  const [loading, setLoading] = useState(false);

  /* ================= FETCH ZONES ================= */
  const fetchZones = async () => {
    try {
      Swal.fire({
        title: "Loading Zones...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.get(`${BASE_URL}/api/Grampanchayat/deptlist`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      Swal.close();

      if (res.data?.ok && res.data?.data?.list) {
        setZones(res.data.data.list);
      }
    } catch (err) {
      Swal.close();
      console.error(err);
      Swal.fire("Error loading zones");
    }
  };

  /* ================= FETCH DETAILS ================= */
  const fetchDetails = async (id) => {
    try {
      Swal.fire({
        title: "Loading Data...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.get(
        `${BASE_URL}/api/Grampanchayat/grampanch/${id}`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );

      Swal.close();

      if (res.data?.ok && res.data?.data?.data) {
        const d = res.data.data.data;

        setFormData({
          zoneId: String(d.NUM_GRAMPANCH_DEPTID || ""),
          gpCode: d.NUM_GRAMPANCH_GRAMPANCHID || "",
          gpName: d.VAR_GRAMPANCH_GRAMPANCH?.trim() || "",
          gpNameMarathi: d.VAR_GRAMPANCH_MARATHINAME?.trim() || "",
        });
      }
    } catch (err) {
      Swal.close();
      console.error(err);
      Swal.fire("Error loading data");
    }
  };

  /* ================= INIT ================= */
  useEffect(() => {
    fetchZones();

    if (mode === 2 && editData?.NUM_GRAMPANCH_GRAMPANCHID) {
      fetchDetails(editData.NUM_GRAMPANCH_GRAMPANCHID);
    }
  }, []);

  /* ================= SUBMIT ================= */
  const handleSubmit = async (values, { resetForm }) => {
    try {
      if (!values.zoneId) return Swal.fire("प्रभाग निवडा");
      if (!values.gpName) return Swal.fire("नाव भरा");

      const payload = {
        grampanchId: mode === 2 ? Number(values.gpCode) : 0, // ✅ FIX

        deptId: Number(values.zoneId),
        grampanchName: values.gpName,
        marathiName: values.gpNameMarathi,
        userId: user?.userName || "admin",
        mode: mode === 2 ? 2 : 1,
      };

      Swal.fire({
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(
        `${BASE_URL}/api/Grampanchayat/grampanchmaster`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        },
      );

      Swal.close();

      if (res.data?.ok) {
        await Swal.fire({
          // icon: "success",
          title: res.data.message || "Saved Successfully",
        });

        navigate("/Masters/FrmGramPanchayatList");
        resetForm();
      } else {
        Swal.fire(res.data?.message || "Error");
      }
    } catch (err) {
      Swal.close();
      console.error(err);
      Swal.fire("Server error");
    }
  };

  /* ================= LOADING ================= */
  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <Formik enableReinitialize initialValues={formData} onSubmit={handleSubmit}>
      {({ values, handleChange, setFieldValue, resetForm, isSubmitting }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="max-w-7xl mx-auto mt-6"
          >
            <Card className="border shadow-sm rounded-lg">
              {/* HEADER */}
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  ग्रामपंचायत मास्टर
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                {/* FORM SECTION */}
                <div className="border rounded-lg p-4 sm:p-6 space-y-5">
                  {/* ZONE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 items-center">
                    <Label className="text-sm sm:text-right">
                      प्रभाग नाव :
                    </Label>

                    <div className="sm:col-span-2">
                      <Select
                        value={values.zoneId}
                        onValueChange={(v) => setFieldValue("zoneId", v)}
                        disabled={mode === 2}
                      >
                        <SelectTrigger className="w-full">
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
                  </div>

                  {/* CODE */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 items-center">
                    <Label className="text-sm sm:text-right w-full">
                      ग्रामपंचायत संकेतांक :
                    </Label>

                    <div className="sm:col-span-2">
                      <Input
                        name="gpCode"
                        value={values.gpCode}
                        onChange={handleChange}
                        disabled={mode === 2}
                      />
                    </div>
                  </div>

                  {/* NAME */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 items-center">
                    <Label className="text-sm sm:text-right">
                      ग्रामपंचायत नाव :
                    </Label>

                    <div className="sm:col-span-2">
                      <Input
                        name="gpName"
                        value={values.gpName}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* MARATHI */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 items-center">
                    <Label className="text-sm sm:text-right w-full">
                      ग्रामपंचायत मराठी नाव :
                    </Label>

                    <div className="sm:col-span-2">
                      <Input
                        name="gpNameMarathi"
                        value={values.gpNameMarathi}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* BUTTONS */}
                <div className="flex flex-wrap justify-center gap-3 sm:gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-900 text-white w-full sm:w-auto"
                  >
                    {isSubmitting ? "Saving..." : "साठवा"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    className="w-full sm:w-auto"
                  >
                    रद्द
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => navigate("/Masters/FrmGramPanchayatList")}
                    className="w-full sm:w-auto"
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

export default FrmGrampanchayatMst;
