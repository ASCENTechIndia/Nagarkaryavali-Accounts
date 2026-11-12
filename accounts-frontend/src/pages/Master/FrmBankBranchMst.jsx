import React, { useEffect, useState, useRef } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import Swal from "sweetalert2";

const initialValues = {
  bankName: "",
  branchName: "",
  micr: "",
  ifsc: "",
  branchMobileNo: "",
  branchAddress: "",
  state: "",
  district: "",
  city: "",
};

const FrmBankBranchMst = () => {
  const { user } = useAuth();
  const formikRef = useRef(null);
  const token = user?.token;
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, data } = location.state || {};

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [bankList, setBankList] = useState([]);

  const [stateList, setStateList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [cityList, setCityList] = useState([]);

  const fetchBankList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Bankbranch/banklist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setBankList(res.data?.data?.list || []);
    } catch (err) {
      console.error("Bank List Error:", err);
    }
  };

  const fetchStateList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/CityList/statelist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setStateList(res.data?.data?.list || []);
    } catch (err) {
      console.error("State List Error:", err);
    }
  };

 const fetchDistrictList = async (stateId) => {
  try {
    if (!stateId) {
      setDistrictList([]);
      return [];
    }

    const res = await axios.get(
      `${BASE_URL}/api/CityList/districtbystate?stateId=${stateId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const list = res.data?.data?.list || [];
    setDistrictList(list);

    return list;
  } catch (err) {
    console.error("District List Error:", err);
    setDistrictList([]);
    return [];
  }
};

 const fetchCityList = async (districtId) => {
  try {
    if (!districtId) {
      setCityList([]);
      return [];
    }

    const res = await axios.get(
      `${BASE_URL}/api/CityList/citybydistrict?districtId=${districtId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("FULL CITY API RESPONSE:", res.data);

    const list = res.data?.data?.list || [];

    console.log("CITY LIST:", list);
    console.log(
      "CITY ID 42 FOUND:",
      list.find((city) => String(city.CITYID).trim() === "42")
    );

    setCityList(list);
    return list;
  } catch (err) {
    console.error("City List Error:", err);
    setCityList([]);
    return [];
  }
};

  const fetchBranchById = async (id, setValues) => {
  try {
    Swal.fire({
      title: "Loading ...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading(),
    });

    const res = await axios.get(
      `${BASE_URL}/api/Bankbranch/branch/${id}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const apiData = res.data?.data?.data;

    if (apiData) {
     const stateId = String(apiData.STATE || "");
const districtId = String(apiData.DISTRICT || "");
const cityId = String(apiData.CITY || "");

// Fetch dependent dropdown data
await fetchDistrictList(stateId);

const cities = await fetchCityList(districtId);

// Verify city exists in returned list
const selectedCity = cities.find(
  (city) => String(city.CITYID) === cityId
);

console.log("Selected City:", selectedCity);

// Populate Formik
setValues({
  bankName: String(apiData.BANKID || ""),
  branchName: apiData.BRANCHNAME?.trim() || "",
  micr: apiData.MICR || "",
  ifsc: apiData.IFSC || "",
  branchAddress: apiData.BRANCHADDRESS || "",
  state: stateId,
  district: districtId,
  city: selectedCity ? String(selectedCity.CITYID) : "",
  branchMobileNo: String(apiData.BRANCHMOBILE || ""),
});
    }
  } catch (err) {
    console.error("Autofill Error:", err);

    Swal.fire({
      text: err?.response?.data?.message || "Failed to fetch branch details",
    });
  } finally {
    Swal.close();
  }
};

  const handleSubmit = async (values) => {
    try {

      const payload = {
        bankId: Number(values.bankName),
        branchId: Number(data?.id) || null,
        branchName: values.branchName,
        micr: values.micr,
        ifsc: values.ifsc,
        branchAddress: values.branchAddress,
        state: values.state,
        district: values.district,
        city: values.city,
        branchMobileNo: values.branchMobileNo,
        userId: user?.userId,
        mode: mode === 2 ? 2 : 1,
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
        `${BASE_URL}/api/Bankbranch/branchmaster`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      Swal.close();

      if (res.data?.ok) {
        Swal.fire({
          text: res.data.message,
          confirmButtonColor: "#1e3a8a",
        }).then(() => {
          navigate("/Masters/FrmBankBranchList");
        });
      }
    } catch (err) {
      console.error("Save Error:", err);
      Swal.fire({
        text:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          "Something went wrong",
        confirmButtonColor: "#1e3a8a",
      }).then(() => {
        navigate("/Masters/FrmBankBranchList");
      });
    }
  };

  useEffect(() => {
    fetchBankList();
    fetchStateList();
  }, []);

  useEffect(() => {
  if (
    mode === 2 &&
    data?.id &&
    bankList.length > 0 &&
    stateList.length > 0 &&
    formikRef.current
  ) {
    fetchBranchById(data.id, formikRef.current.setValues);
  }
}, [mode, data?.id, bankList.length, stateList.length]);

  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      enableReinitialize
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, setFieldValue, setValues }) => {

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
                    बँक शाखा मास्टर
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-6 space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">बँकेचे नाव :</Label>

                      <Select
                        value={values.bankName}
                        onValueChange={(v) => setFieldValue("bankName", v)}
                        disabled={mode === 2}
                      >
                        <SelectTrigger className="w-full sm:flex-1">
                          <SelectValue placeholder="-- पर्याय निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {bankList.map((bank) => (
                            <SelectItem
                              key={bank.VALUE}
                              value={bank.VALUE.toString()}
                            >
                              {bank.LABEL}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">आयएफएससी संकेतांक :</Label>
                      <Input
                        name="ifsc"
                        value={values.ifsc}
                        onChange={handleChange}
                        className="w-full sm:flex-1"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">एमआयसीआर संकेतांक :</Label>
                      <Input
                        name="micr"
                        value={values.micr}
                        onChange={handleChange}
                        className="w-full sm:flex-1"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">शाखेचे नाव :</Label>
                      <Input
                        name="branchName"
                        value={values.branchName}
                        onChange={handleChange}
                        className="w-full sm:flex-1"
                      />
                    </div>

                    {/* dsfgbgfsdfsasdf */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">शाखेचे पत्ता :</Label>
                      <Input
                        name="branchAddress"
                        value={values.branchAddress}
                        onChange={handleChange}
                        className="w-full sm:flex-1"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">राज्य :</Label>

                      <Select
                        value={values.state}
                        onValueChange={(v) => {
                          setFieldValue("state", v);
                          setFieldValue("district", "");
                          setFieldValue("city", "");

                          setDistrictList([]);
                          setCityList([]);

                          fetchDistrictList(v);
                        }}
                      >
                        <SelectTrigger className="w-full sm:flex-1">
                          <SelectValue placeholder="-- राज्य निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {stateList.map((state) => (
                            <SelectItem
                              key={state.STATE_ID}
                              value={state.STATE_ID.toString()}
                            >
                              {state.STATE_NAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">जिल्हा :</Label>

                      <Select
                        value={values.district}
                        onValueChange={(v) => {
                          setFieldValue("district", v);
                          setFieldValue("city", "");

                          setCityList([]);

                          fetchCityList(v);
                        }}
                        disabled={!values.state}
                      >
                        <SelectTrigger className="w-full sm:flex-1">
                          <SelectValue placeholder="-- पर्याय निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {districtList.map((district) => (
                            <SelectItem
                              key={district.DISTRICT_ID}
                              value={district.DISTRICT_ID.toString()}
                            >
                              {district.DISTRICT_NAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">शहर :</Label>

                      <Select
  value={values.city || ""}
  onValueChange={(v) => setFieldValue("city", v)}
  disabled={!values.district}
>
  <SelectTrigger className="w-full sm:flex-1">
    <SelectValue placeholder="-- पर्याय निवडा --" />
  </SelectTrigger>

  <SelectContent>
    {cityList.map((city) => (
      <SelectItem
        key={String(city.CITYID)}
        value={String(city.CITYID)}
      >
        {city.CITYNAME}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <Label className="sm:w-40">शाखा संपर्क क्र :</Label>
                      <Input
                      type="tel"
                        name="branchMobileNo"
                        value={values.branchMobileNo}
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
                      onClick={() => navigate("/Masters/FrmBankBranchList")}
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

export default FrmBankBranchMst;
