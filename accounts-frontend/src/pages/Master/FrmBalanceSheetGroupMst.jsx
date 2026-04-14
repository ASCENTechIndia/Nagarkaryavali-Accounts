import { Formik, Form } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmBalanceSheetGroupMst = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mode = location.state?.mode;
  const editData = location.state?.data;

  const [formData, setFormData] = useState({
    balGrpId: "",
    balGrpName: "",
  });

  const [loading, setLoading] = useState(false);

  /* 🔥 AXIOS WITH TOKEN */
  const api = axios.create({
    baseURL: BASE_URL,
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  /* 🔥 FETCH SINGLE (AUTOFILL) */
  const fetchGroupDetails = async (id) => {
    try {
      setLoading(true);

      const res = await api.get(`/api/Balancesheet/balgroup/${id}`);

      if (res.data?.ok) {
        const data = res.data.data.data;

        setFormData({
          balGrpId: data.BALGRPID,
          balGrpName: data.BALGRPNAME,
        });
      }
    } catch (err) {
      console.error("❌ Error fetching group:", err);
    } finally {
      setLoading(false);
    }
  };

  /* 🔥 LOAD EDIT DATA */
  useEffect(() => {
    if (mode === 2 && editData?.BALGRPID) {
      fetchGroupDetails(editData.BALGRPID);
    }
  }, [mode, editData]);

  /* 🔥 SUBMIT */
  const handleSubmit = async (values, { resetForm }) => {
    try {
      const payload = {
        balgrpId: Number(values.balGrpId || 0), // for update
        balgrpName: values.balGrpName,
        userId: user?.userId || localStorage.getItem("userId"),
        mode: mode === 2 ? 2 : 1,
      };

      Swal.fire({
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await api.post(
        `/api/Balancesheet/balgroupmaster`,
        payload
      );

      Swal.close();

      if (res.data?.ok) {
        await Swal.fire({
          icon: "success",
          title: res.data.message || "Saved successfully",
        });

        navigate("/Masters/FrmBalanceSheetGroupList");
        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: res.data?.message || "Error",
        });
      }
    } catch (err) {
      Swal.close();

      Swal.fire({
        icon: "error",
        title: err.response?.data?.message || "Server error",
      });
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <Formik enableReinitialize initialValues={formData} onSubmit={handleSubmit}>
      {({ values, handleChange, isSubmitting }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto mt-6"
          >
            <Card className="shadow-sm border rounded-lg">

              {/* HEADER */}
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  ताळमेळ पत्रक गटची मास्टर
                </CardTitle>
              </CardHeader>

              <CardContent className="p-6">
                <div className="p-8 space-y-6">

                  {/* ID */}
                  <div className="flex items-center gap-6">
                    <Label className="w-60 text-right font-medium">
                      शिल्लकपत्रक गट संकेतांक :
                    </Label>

                    <Input
                      name="balGrpId"
                      value={values.balGrpId}
                      onChange={handleChange}
                      className="w-80 h-9"
                      disabled={mode === 2} // 🔥 disable in edit
                    />
                  </div>

                  {/* NAME */}
                  <div className="flex items-center gap-6">
                    <Label className="w-60 text-right font-medium">
                      शिल्लकपत्रक गट नांव :
                    </Label>

                    <Input
                      name="balGrpName"
                      value={values.balGrpName}
                      onChange={handleChange}
                      className="w-80 h-9"
                    />
                  </div>

                </div>

                {/* BUTTONS */}
                <div className="flex justify-center gap-4 mt-10 border-t pt-6">
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Saving..." : "साठवा"}
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() =>
                      navigate("/Masters/FrmBalanceSheetGroupList")
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

export default FrmBalanceSheetGroupMst;