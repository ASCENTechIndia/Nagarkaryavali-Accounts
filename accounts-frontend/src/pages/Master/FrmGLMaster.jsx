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

  /* 🔥 FETCH DATA */
  const fetchGLDetails = async (id) => {
    try {
      setLoading(true);

      const res = await axios.get(`${BASE_URL}/api/master/glmaster/${id}`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      if (res.data?.ok && res.data?.data?.data) {
        const data = res.data.data.data;

        setFormData({
          deptCode: data.GLCODE || "",
          deptNameMarathi: data.GLMARATHI || "",
          deptNameEnglish: data.GLENGLISH || "",
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {
  if (!user?.token) return;

  if (mode === 2 && editData?.GLCODE) {
    fetchGLDetails(editData.GLCODE);
  }
}, [mode, editData, user?.token]);
  /* 🔥 SUBMIT */
  const handleSubmit = async (values, { resetForm }) => {
    
    try {
      const payload = {
        glcodeid: Number(values.deptCode || 0),
        glname: values.deptNameMarathi,
        glnameeng: values.deptNameEnglish,
        glsubtype: 1,
        userId: user?.userId,
        mode: mode === 2 ? 2 : 1,
      };

      Swal.fire({
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.post(`${BASE_URL}/api/master/glmaster`, payload, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      Swal.close();

      if (res.data?.ok) {
        await Swal.fire({
          icon: "success",
          title: res.data.message,
        });

        navigate("/Masters/FrmGLMasterList");
        resetForm();
      } else {
        Swal.fire("Error", res.data?.message, "error");
      }
    } catch (err) {
      Swal.close();
      Swal.fire("Error", "Server error", "error");
    }
  };

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  return (
    <Formik enableReinitialize initialValues={formData} onSubmit={handleSubmit}>
      {({ values, handleChange, resetForm, isSubmitting }) => (
        <Form>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="shadow-sm border rounded-lg">
              {/* HEADER */}
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  {mode === 2
                    ? "सामान्य खातेवही अपडेट"
                    : "सामान्य खातेवही नोंद"}
                </CardTitle>
              </CardHeader>

              {/* BODY */}
              <CardContent className="p-6 space-y-4">
                {/* FIELD 1 */}
                <div className="grid grid-cols-[180px_10px_1fr] items-center gap-2">
                  <Label className="text-sm font-medium">विभाग कोड</Label>
                  <span>:</span>
                  <Input
                    name="deptCode"
                    value={values.deptCode}
                    onChange={handleChange}
                    disabled={mode === 2}
                    className="max-w-xs"
                  />
                </div>

                {/* FIELD 2 */}
                <div className="grid grid-cols-[180px_10px_1fr] items-center gap-2">
                  <Label className="text-sm font-medium">
                    विभाग नाव (मराठी)
                  </Label>
                  <span>:</span>
                  <Input
                    name="deptNameMarathi"
                    value={values.deptNameMarathi}
                    onChange={handleChange}
                    className="max-w-xs"
                  />
                </div>

                {/* FIELD 3 */}
                <div className="grid grid-cols-[180px_10px_1fr] items-center gap-2">
                  <Label className="text-sm font-medium">
                    विभाग नाव (इंग्रजी)
                  </Label>
                  <span>:</span>
                  <Input
                    name="deptNameEnglish"
                    value={values.deptNameEnglish}
                    onChange={handleChange}
                    className="max-w-xs"
                  />
                </div>

                {/* BUTTONS */}
                <div className="flex flex-wrap justify-center gap-3 pt-4 border-t">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="bg-blue-900 text-white"
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
