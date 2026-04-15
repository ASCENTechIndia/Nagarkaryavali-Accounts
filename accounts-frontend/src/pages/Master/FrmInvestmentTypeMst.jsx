
import React, { useEffect } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const initialValues = {
  investmentCode: "",
  investmentType: "",
};

const FrmInvestmentTypeMst = () => {
  const { user } = useAuth();
  const token = user?.token;
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, data } = location.state || {};

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchInvestmentById = async (id, setValues) => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/Investment/investment/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const apiData = res.data?.data?.data;

      if (apiData) {
        setValues({
          investmentCode: apiData.INVESTID,
          investmentType: apiData.INVESTNAME.trim(),
        });
      }
    } catch (err) {
      console.error("Autofill API Error:", err);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        InvestId: values.investmentCode,
        investName: values.investmentType,
        userId: user?.userId,
        mode: mode === 2 ? 2 : 1,
      };

      const res = await axios.post(
        `${BASE_URL}/api/Investment/investmentmaster`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res.data?.ok) {
        Swal.fire({
          text: res.data.message,
          confirmButtonColor: "#1e3a8a",
        });
        navigate("/Masters/FrmInvestmentTypeList");
      }
    } catch (err) {
      console.error("Save API Error:", err);
      Swal.fire({
        text: "Something went wrong",
        confirmButtonColor: "#1e3a8a",
      });
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, setValues }) => {
        useEffect(() => {
          if (mode === 2 && data?.id) {
            fetchInvestmentById(data.id, setValues);
          }
        }, [mode, data]);

        return (
          <Form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 sm:px-4 mt-4 sm:mt-6"
            >
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    गुंतवणूक प्रकार मास्टर
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">
                        गुंतवणूक संकेतांक :
                      </Label>
                      <Input
                        name="investmentCode"
                        value={values.investmentCode}
                        onChange={handleChange}
                        disabled={mode === 2} // ✅ disable in edit
                        className="w-full sm:flex-1"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">
                        गुंतवणूक प्रकार :
                      </Label>
                      <Input
                        name="investmentType"
                        value={values.investmentType}
                        onChange={handleChange}
                        className="w-full sm:flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
                    <Button
                      type="submit"
                      className="bg-blue-900 text-white px-6 w-full sm:w-auto"
                    >
                      साठवा
                    </Button>

                    <Button
                      type="button"
                      variant="destructive"
                      className="px-6 w-full sm:w-auto"
                      onClick={() =>
                        navigate("/Masters/FrmInvestmentTypeList")
                      }
                    >
                      परत
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

export default FrmInvestmentTypeMst;