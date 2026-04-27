import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
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
import SearchableSelect from "@/components/SearchableSelect";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";

const initialValues = {
  zone: "",
  bankGL: "",
  bankAccount: "",
  chequeFrom: "",
  chequeTo: "",
  chequeCount: "",
  chequeBookNo: "",
  employeeName: "",
};

const FrmChequeBookMst = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const userId = user?.userId;

  const navigate = useNavigate();
  const location = useLocation();
  const { mode, chequeData } = location.state || {};

  const [zones, setZones] = useState([]);
  const [bankGLOptions, setBankGLOptions] = useState([]);
  const [bankAccountOptions, setBankAccountOptions] = useState([]);
  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedBankGL, setSelectedBankGL] = useState("");

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchZones = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/zones`, 
        { corp_id: ulbId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data?.data) {
        setZones(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
  };

  const fetchBankGLOptions = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data?.data) {
        const formatted = res.data.data.map((g) => ({
          label: g.GLSEARCHNAME,
          value: g.GLCODE.toString(),
        }));
        setBankGLOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching bank GL options:", err);
    }
  };

  const fetchBankAccountOptions = async (glCode) => {
    try {
      const res = await axios.post(`${BASE_URL}/api/FrmTransfer/credit-leasure`,
        {
          corp_id: Number(ulbId),
          glcode: Number(glCode),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data?.data?.success) {
        const formatted = res.data.data.rows.map((l) => ({
          label: l.ACCNAME,
          value: l.OBJECTCODE,
        }));

        setBankAccountOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching bank accounts:", err);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/FrmChequeBook/GetUserDetails`,
        { ulbId: Number(ulbId), userId: userId},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("fetchEmployees: ", res);

      if (res?.data?.data) {
        const formatted = res.data.data.data.map((emp) => ({
          label: emp.VAR_USER_USERNAME,
          value: emp.NUM_USER_USERID.toString(),
        }));
        setEmployeeOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const fetchNextChequeBookNo = async (glCode, accNo) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmChequeBook/NextChequeBookNo`,
        {
          glCode: Number(glCode),
          accNo: Number(accNo),
          ulbId: Number(ulbId),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res?.data?.data?.success) {
        return res.data.data.data.CHEQBOOKNO;
      }
    } catch (err) {
      console.error("Error fetching cheque book number:", err);
    }
    return "";
  };

  useEffect(() => {
    fetchZones();
    fetchBankGLOptions();
    fetchEmployees();
  }, []);

  useEffect(() => {
    if (selectedBankGL) {
      fetchBankAccountOptions(selectedBankGL);
    }
  }, [selectedBankGL]);

  const handleSubmit = async (values, { resetForm }) => {
    if (!values.zone || !values.bankGL || !values.bankAccount || !values.employeeName) {
      Swal.fire({
        text: "Please fill all required fields",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    if (values.chequeFrom && values.chequeTo) {
      if (values.chequeFrom.length !== 6 || values.chequeTo.length !== 6) {
        Swal.fire({
          text: "Cheque from and Cheque to must be 6 digits",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (parseInt(values.chequeFrom) > parseInt(values.chequeTo)) {
        Swal.fire({
          text: "Cheque From should be less than Cheque To",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }
    }

    setLoading(true);

    try {
      const selectedEmp = employeeOptions.find(
        (emp) => emp.value === values.employeeName
      );

      const payload = {
        empName: selectedEmp?.label || "",
        glCode: Number(values.bankGL),
        bankAcc: Number(values.bankAccount),
        chqNoFrom: Number(values.chequeFrom),
        chqNoTo: Number(values.chequeTo),
        totalChq: Number(values.chequeCount),
        userId: userId,
        chqBookNo: Number(values.chequeBookNo),
        zoneId: Number(values.zone),
        empId: values.employeeName,
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmChequeBook/SaveChequeBook`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      console.log("Response: ", res);

      if (res?.data?.ok && res?.data?.data?.success) {
        Swal.fire({
          icon: "success",
          text: res.data.data.message || "Cheque book saved successfully",
          confirmButtonColor: "#1e3a8a",
        });

        resetForm();
      } else {
        Swal.fire({
          icon: "error",
          text: res?.data?.data?.message || "Something went wrong",
          confirmButtonColor: "#1e3a8a",
        });
      }
    } catch (err) {
      console.error("Error saving cheque book:", err);
      Swal.fire({
        icon: "error",
        text: "Error saving data",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, handleChange, setFieldValue, resetForm  }) => {
        useEffect(() => {
          const from = parseInt(values?.chequeFrom);
          const to = parseInt(values?.chequeTo);

          if (!isNaN(from) && !isNaN(to) && to >= from) {
            const count = to - from + 1;
            setFieldValue("chequeCount", count.toString());
          } else {
            setFieldValue("chequeCount", "");
          }
        }, [values.chequeFrom, values.chequeTo]);

        const handleReset = () => {
          Swal.fire({
            text: "Do you want to reset the form?",
            showCancelButton: true,
            confirmButtonColor: "#1e3a8a",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes",
          }).then((result) => {
            if (result.isConfirmed) {
              resetForm();
              setBankAccountOptions([]);
              setSelectedBankGL("");
            }
          });
        };
      
      return (
        <Form>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  धनादेश पुस्तक मास्टर
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                    {/* <Label className='w-36 shrink-0' text="झोन :" /> */}
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="झोन" />
                      <span>:</span>
                    </div>
                    <Select
                      value={values.zone}
                      onValueChange={(v) => setFieldValue("zone", v)}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="-- Select Zone --" />
                      </SelectTrigger>
                      <SelectContent>
                        {zones.map((zone) => (
                          <SelectItem key={zone.ZONEID} value={zone.ZONEID.toString()}>
                            {zone.ZONEENAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                    {/* <Label className='w-36 shrink-0' text="बँक जी.एल. :" /> */}
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="बँक जी.एल." />
                      <span>:</span>
                    </div>
                    <SearchableSelect
                      options={bankGLOptions}
                      value={bankGLOptions.find(opt => opt.value === values.bankGL) || null}
                      onChange={(option) => {
                        const value = option?.value || "";
                        setFieldValue("bankGL", value);
                        setFieldValue("bankAccount", "");
                        setFieldValue("chequeBookNo", "");
                        setSelectedBankGL(value);
                      }}
                      placeholder="Select Bank GL"
                      className="w-full h-9"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                    {/* <Label className='w-36 shrink-0' text="बँक खाते :" /> */}
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="बँक खाते" />
                      <span>:</span>
                    </div>
                    {/* <SearchableSelect
                      options={bankAccountOptions}
                      value={values.bankAccount}
                      onChange={(option) => setFieldValue("bankAccount", option?.value || "")}
                      placeholder="Select Bank Account"
                      className="w-full h-9"
                      disabled={!values.bankGL}
                    /> */}
                    <SearchableSelect
                      options={bankAccountOptions}
                      value={bankAccountOptions.find(opt => opt.value === values.bankAccount) || null}
                      onChange={async (option) => {
                        const accNo = option?.value || "";
                        setFieldValue("bankAccount", accNo);

                        if (values.bankGL && accNo) {
                          const bookNo = await fetchNextChequeBookNo(values.bankGL, accNo);
                          setFieldValue("chequeBookNo", bookNo);
                        }
                      }}
                      placeholder="Select Bank Account"
                      className="w-full h-9"
                      disabled={!values.bankGL}
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                    {/* <Label className='w-36 shrink-0' text="धनादेश पासून :" /> */}
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="धनादेश पासून" />
                      <span>:</span>
                    </div>
                    <Input
                      name="chequeFrom"
                      value={values.chequeFrom}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                        setFieldValue("chequeFrom", value);
                      }}
                      placeholder="6 digits"
                      type="text"
                      maxLength={6}
                      className="w-full h-9"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                    {/* <Label className='w-36 shrink-0' text="धनादेश पर्यंत :" /> */}
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="धनादेश पर्यंत" />
                      <span>:</span>
                    </div>
                    <Input
                      name="chequeTo"
                      value={values.chequeTo}
                      onChange={(e) => {
                        const value = e.target.value.replace(/[^0-9]/g, "").slice(0, 6);
                        setFieldValue("chequeTo", value);
                      }}
                      placeholder="6 digits"
                      type="text"
                      maxLength={6}
                      className="w-full h-9"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                    {/* <Label className='w-36 shrink-0' text="चेक संख्या :" /> */}
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="चेक संख्या" />
                      <span>:</span>
                    </div>
                    <Input
                      name="chequeCount"
                      value={values.chequeCount}
                      onChange={handleChange}
                      className="w-full h-9"
                      disabled
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                    {/* <Label className='w-36 shrink-0' text="धनादेश पुस्तिका क्रमांक :" /> */}
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="धनादेश पुस्तिका क्रमांक " />
                      <span>:</span>
                    </div>
                    <Input
                      name="chequeBookNo"
                      value={values.chequeBookNo}
                      className="w-full h-9"
                      disabled
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                    {/* <Label className='w-36 shrink-0' text="कर्मचारी नांव :" /> */}
                    <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                      <Label text="कर्मचारी नांव" />
                      <span>:</span>
                    </div>
                    <Select
                      value={values.employeeName}
                      onValueChange={(v) => setFieldValue("employeeName", v)}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="-- Select Employee --" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeeOptions.map((emp) => (
                          <SelectItem key={emp.value} value={emp.value}>
                            {emp.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="bg-blue-900 hover:bg-blue-800 text-white px-8"
                    disabled={loading}
                  >
                    {loading ? "साठवा..." : "साठवा"}
                  </Button>
                  <Button 
                    type="button" 
                    className="bg-blue-900 hover:bg-blue-800 text-white px-8"
                    disabled={loading}
                    onClick={handleReset}
                  >
                    रीसेट
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="px-8"
                    onClick={() => navigate("/HomePage/FrmHomePage")}
                  >
                    परत
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Form>
      )}}
    </Formik>
  );
};

export default FrmChequeBookMst;