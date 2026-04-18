import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";

const initialValues = {
  budgetId: "",
  nidhiName: "",
  activeFlag: "Y",
};

const FrmNidhiMaster = () => {
  const { user } = useAuth();
  const token = user?.token;
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, data } = location.state || {};

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [budgetList, setBudgetList] = useState([]);
  const [formValues, setFormValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const fetchBudget = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/budget-heads`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res?.data?.ok) {
        const formatted = res.data.data.map((b) => ({
          value: b.NUM_BUDGETCONFIG_HEADID.toString(),
          label: b.VAR_BUDGETCONFIG_BUDGETNAME,
        }));
        setBudgetList(formatted);
      }
    } catch (err) {
      console.error("Budget API Error:", err);
    }
  };

  const fetchNidhiById = async (id) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/NidhiList/nidhi/${id}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const apiData = res?.data?.data?.data;

      if (apiData) {
        setFormValues({
          budgetId: apiData.NUM_BUDGETCONFIG_HEADID?.toString() || "",
          nidhiName: apiData.VAR_NIDHI_NIDHINAME || "",
          activeFlag: apiData.VAR_NIDHI_FLAG || "Y",
        });
      }
    } catch (err) {
      console.error("Autofill Error:", err);
    }
  };

  const handleSubmit = async (values) => {
    try {
      setSubmitLoading(true);
      const payload = {
        mode: mode === 2 ? 2 : 1,
        userId: user?.userId,
        nidhiId: mode === 2 ? data?.nidhiId : null,
        nidhiName: values.nidhiName,
        budgetId: Number(values.budgetId),
        activeFlag: values.activeFlag,
      };

      const res = await axios.post(
        `${BASE_URL}/api/NidhiList/nidhi-master`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res?.data?.ok && res?.data?.data?.success) {
        Swal.fire({
          icon: "success",
          text: res?.data?.data?.errorMsg || "Saved successfully",
          confirmButtonColor: "#1e3a8a",
        });

        navigate("/Masters/FrmNidhiList");
      } else {
        Swal.fire({
          icon: "error",
          text: res?.data?.data?.errorMsg || "Something went wrong",
        });
      }
    } catch (err) {
      console.log("Save Error:", err);
      const errorMsg =
        err?.response?.data?.message ||  
        err?.response?.data?.error || 
        err.message || 
        "Something went wrong";

      Swal.fire({
        icon: "error",
        text: errorMsg,
      });
    } finally {
        setSubmitLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      await fetchBudget();

      if (mode === 2 && data?.nidhiId) {
        await fetchNidhiById(data.nidhiId);
      }

      setLoading(false);
    };

    init();
  }, []);

  if (loading) {
    return (
        <div className="flex justify-center items-center h-64">
        <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
        </div>
    );
  }

  return (
    <Formik initialValues={formValues} enableReinitialize onSubmit={handleSubmit}>
      {({ values, handleChange, setFieldValue }) => {

        return (
          <Form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 sm:px-4 mt-4 sm:mt-6"
            >
              <Card className="border shadow-sm">
                <CardHeader className="flex sm:flex-row flex-col items-center justify-between gap-4 border-b">
                    <CardTitle className="text-lg font-semibold">
                        Nidhi Master
                    </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Budget" />
                        <span>:</span>
                      </div>
                        <Select
                            value={values.budgetId}
                            onValueChange={(v) => setFieldValue("budgetId", v)}
                        >
                            <SelectTrigger className="w-full h-9">
                                <SelectValue placeholder="-- विकल्प निवडा --" />
                            </SelectTrigger>
                            <SelectContent>
                                {budgetList.map((b) => (
                                    <SelectItem key={b.value} value={b.value}>
                                    {b.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Nidhi" />
                        <span>:</span>
                      </div>
                      <Input
                        name="nidhiName"
                        value={values.nidhiName}
                        onChange={handleChange}
                        className="w-full h-9"
                       />
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Active" />
                        <span>:</span>
                        </div>
                        <div className="flex items-center gap-4 ml-2">
                            <div className="flex items-center gap-2">
                                <Input
                                    type="radio"
                                    name="activeFlag"
                                    value="Y"
                                    checked={values.activeFlag === "Y"}
                                    onChange={handleChange}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor="yes" className="font-medium text-gray-700 cursor-pointer">
                                Yes
                                </Label>
                            </div>
                            <div className="flex items-center gap-2">
                                <Input
                                    type="radio"
                                    name="activeFlag"
                                    value="N"
                                    checked={values.activeFlag === "N"}
                                    onChange={handleChange}
                                    className="h-4 w-4"
                                />
                                <Label htmlFor="no" className="font-medium text-gray-700 cursor-pointer">
                                No
                                </Label>
                            </div>
                        </div>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
                    <Button 
                        type="submit" 
                        className="bg-blue-900 text-white px-6 w-full sm:w-auto" 
                        disable={submitLoading}
                    >
                      {submitLoading ? "Submitting..": "Submit"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="px-6 w-full sm:w-auto"
                      onClick={() => navigate("/Masters/FrmNidhiList")}
                    >
                      Back
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default FrmNidhiMaster;
