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

const FrmGLMaster = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const mode = location.state?.mode;
  const editData = location.state?.data;
  
  const [formData, setFormData] = useState({
    deptCode: "",
    deptNameMarathi: "",
    deptNameEnglish: "",
  });

  const [loading, setLoading] = useState(false);

  /* 🔥 FETCH SINGLE RECORD */
  const fetchGLDetails = async (id) => {
    try {
      setLoading(true);

      const res = await axios.get(`${BASE_URL}/api/master/glmaster/${id}`);

      if (res.data?.ok && res.data?.data?.data) {
        const data = res.data.data.data;

        setFormData({
          deptCode: data.GLCODE || "",
          deptNameMarathi: data.GLMARATHI || "",
          deptNameEnglish: data.GLENGLISH || "",
        });
      }
    } catch (err) {
      console.error("Error fetching GL details:", err);
    } finally {
      setLoading(false);
    }
  };

  /* 🔥 LOAD DATA IN EDIT MODE */
  useEffect(() => {
    if (mode === 2 && editData?.GLCODE) {
      fetchGLDetails(editData.GLCODE);
    }
  }, [mode, editData]);

  /* 🔥 SUBMIT HANDLER */

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const userId = user?.userId ;

      const payload = {
        glcodeid: Number(values.deptCode || 0),
        glname: values.deptNameMarathi,
        glnameeng: values.deptNameEnglish,
        glsubtype: 1,
        userId: userId,
        mode: mode === 2 ? 2 : 1,
      };

      console.log("📤 SUBMIT PAYLOAD:", payload);

      // 🔄 Show loading
      Swal.fire({
        title: "Saving...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(`${BASE_URL}/api/master/glmaster`, payload);

      console.log("📥 RESPONSE:", res.data);

      Swal.close(); // close loader

      if (res.data?.ok) {
        await Swal.fire({
          icon: "success",
          title: res.data.message,
          confirmButtonColor: "#1e3a8a",
        });

        navigate("/Masters/FrmGLMasterList");
        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          title: res.data?.message || "Something went wrong",
        });
      }
    } catch (err) {
      console.error("❌ Save error:", err);

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
    <Formik
      enableReinitialize
      initialValues={formData}
      onSubmit={handleSubmit} // ✅ FIXED
    >
      {({ values, handleChange, resetForm, isSubmitting }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-7xl mx-auto mt-6"
          >
            <Card className="shadow-sm border rounded-lg">
              {/* Header */}
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  {mode === 2
                    ? "सामान्य खातेवही अपडेट"
                    : "सामान्य खातेवही नोंद"}
                </CardTitle>
              </CardHeader>

              {/* Content */}
              <CardContent className="p-6 space-y-6">
                <div className="p-4">
                  <div className="grid gap-x-16 gap-y-6">
                    {/* CODE */}
                    <div className="flex items-center gap-6">
                      <Label className="w-52 text-right font-medium">
                        विभाग कोड :
                      </Label>
                      <Input
                        name="deptCode"
                        value={values.deptCode}
                        onChange={handleChange}
                        className="w-72 h-9"
                        disabled={mode === 2}
                      />
                    </div>

                    {/* MARATHI */}
                    <div className="flex items-center gap-6">
                      <Label className="w-52 text-right font-medium">
                        विभाग नाव (मराठी) :
                      </Label>
                      <Input
                        name="deptNameMarathi"
                        value={values.deptNameMarathi}
                        onChange={handleChange}
                        className="w-72 h-9"
                      />
                    </div>

                    {/* ENGLISH (FULL WIDTH) */}
                    <div className="flex items-center gap-6 ">
                      <Label className="w-52 text-right font-medium">
                        विभाग नाव (इंग्रजी) :
                      </Label>
                      <Input
                        name="deptNameEnglish"
                        value={values.deptNameEnglish}
                        onChange={handleChange}
                        className="w-72 h-9"
                      />
                    </div>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex justify-center gap-4 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-900 text-white px-6"
                  >
                    {isSubmitting ? "Saving..." : "साठवा"}
                  </Button>

                  <Button type="button" variant="outline" onClick={resetForm}>
                    बदल करा
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() => navigate("/Masters/FrmGLMasterList")}
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

export default FrmGLMaster;
