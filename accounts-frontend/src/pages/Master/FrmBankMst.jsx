import React, { useEffect } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";

const initialValues = {
  bankCode: "",
  bankName: "",
};

const FrmBankMst = () => {
  const { user } = useAuth();
  const token = user?.token;
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, data } = location.state || {};

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchBankById = async (id, setValues) => {
    try {

      Swal.fire({
        title: "Loading ...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmBanList/BankById`,
        {
          bankId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Autofill Response:", res.data);

      const apiData = res.data?.data?.data?.[0];

      if (apiData) {
        setValues({
          bankCode: apiData.BANKID,
          bankName: apiData.BANKNAME?.trim() || "",
        });
      }
      Swal.close();
    } catch (err) {
      console.error("Autofill API Error:", err);
      Swal.close();
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        mode: mode === 2 ? 2 : 1,
        bankName: values.bankName,
        userId: user?.userId,
        bankId: values.bankCode || null,
      };

      Swal.fire({
        title: "Saving...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmBanList/SaveBank`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      Swal.close();

      if (res.data?.ok) {
        Swal.fire({
          text: res.data?.data?.message || "Success",
          confirmButtonColor: "#1e3a8a",
        }).then(() => {
          navigate("/Masters/FrmBanList");
        });
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
    <Formik initialValues={initialValues} enableReinitialize onSubmit={handleSubmit}>
      {({ values, handleChange, setValues }) => {
        useEffect(() => {
          if (mode === 2 && data?.id) {
            fetchBankById(data.id, setValues);
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
                  <CardTitle className="text-lg font-semibold">बँक मास्टर</CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">बँक संकेतांक :</Label>
                      <Input
                        name="bankCode"
                        value={values.bankCode}
                        onChange={handleChange}
                        disabled
                        className="w-full sm:flex-1"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">बँकेचे नाव :</Label>
                      <Input
                        name="bankName"
                        value={values.bankName}
                        onChange={handleChange}
                        className="w-full sm:flex-1"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
                    <Button type="submit" className="bg-blue-900 text-white px-6 w-full sm:w-auto">
                      साठवा
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="px-6 w-full sm:w-auto"
                      onClick={() => navigate("/Masters/FrmBanList")}
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

export default FrmBankMst;
