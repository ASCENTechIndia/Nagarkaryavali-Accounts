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
  municipality: "",
  depositCode: "",
  depositName: "",
};

const FrmDepositTypeMst = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, data } = location.state || {};

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [corporations, setCorporations] = useState([]);

  const fetchDepositById = async (id, setValues) => {
    try {

      Swal.fire({
        title: "Loading ...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/frmDepositType/DepositTypeById`,
        {
          depId: id,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Deposit Autofill Response:", res.data);

      const apiData = res.data?.data?.data?.[0];

      if (apiData) {
        setValues({
          municipality: apiData.NUM_DEPOSITMST_ULBID?.toString() || "",
          depositCode: apiData.DEPID || "",
          depositName: apiData.DEPNAME?.trim() || "",
        });
      }
      Swal.close();
    } catch (err) {
      console.error("Autofill API Error:", err);
      Swal.close();
    }
  };

  const fetchCorporations = async (setFieldValue) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/corporation`,
        { corp_id: ulbId },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const corpData = res.data.data || [];
      setCorporations(corpData);

      if (corpData.length > 0) {
        const defaultCorp = corpData[0].CORPORATIONID.toString();
        setFieldValue("municipality", defaultCorp);
      }
    } catch (err) {
      console.error("Corporation API Error:", err);
    }
  };

  const handleSubmit = async (values) => {
    try {
      const payload = {
        mode: mode === 2 ? 2 : 1,
        depName: values.depositName,
        userId: user?.userId,
        ulbId: ulbId,
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
        `${BASE_URL}/api/frmDepositType/SaveDepositType`,
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
          text: res.data?.data?.message,
          confirmButtonColor: "#1e3a8a",
        });

        navigate("/Masters/FrmDepositTypeList");
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
      {({ values, handleChange, setValues, setFieldValue }) => {
        useEffect(() => {
          fetchCorporations(setFieldValue);
          if (mode === 2 && data?.id) {
            fetchDepositById(data.id, setValues);
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
                  <CardTitle className="text-lg font-semibold">ठेव मास्टर</CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    {/* Municipality (auto-selected, disabled) */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">नगरपालिकेचे नाव :</Label>
                      <Select
                        value={values.municipality}
                        disabled
                        onValueChange={(v) => setFieldValue("municipality", v)}
                      >
                        <SelectTrigger className="w-full sm:flex-1">
                          <SelectValue placeholder="-- पर्याय निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {corporations.map((corp) => (
                            <SelectItem
                              key={corp.CORPORATIONID}
                              value={corp.CORPORATIONID.toString()}
                            >
                              {corp.CORPORATIONNAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Deposit Code */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">ठेव प्रकार संकेतांक :</Label>
                      <Input
                        name="depositCode"
                        value={values.depositCode}
                        onChange={handleChange}
                        disabled
                        className="w-full sm:flex-1"
                      />
                    </div>

                    {/* Deposit Name */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">ठेव प्रकार नाव :</Label>
                      <Input
                        name="depositName"
                        value={values.depositName}
                        onChange={handleChange}
                        className="w-full sm:flex-1"
                      />
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4">
                    <Button type="submit" className="bg-blue-900 text-white px-6 w-full sm:w-auto">
                      साठवा
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      className="px-6 w-full sm:w-auto"
                      onClick={() => navigate("/Masters/FrmDepositTypeList")}
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

export default FrmDepositTypeMst;
