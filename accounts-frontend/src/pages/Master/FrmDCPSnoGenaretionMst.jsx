import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";

const FrmDCPSnoGenaretionMst = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token || localStorage.getItem("token") || "";
  const ulbId = user?.ulbId || localStorage.getItem("ulbId") || "930";

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [employeeNo, setEmployeeNo] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSearched, setIsSearched] = useState(false);

  const [employeeData, setEmployeeData] = useState({
    name: "",
    dob: "",
    address: "",
    mobileNo: "",
    emailId: "",
    designation: "",
    doj: "",
    confirmationDate: "",
    nomineeName: "",
  });


  const [openingDcpsBalance, setOpeningDcpsBalance] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const formatDate = (dateVal) => {
    if (!dateVal) return "";
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      const dd = String(d.getDate()).padStart(2, "0");
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const yyyy = d.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    } catch {
      return String(dateVal);
    }
  };


  const handleSearchEmployee = async () => {
    const trimmedNo = employeeNo?.trim();
    if (!trimmedNo) {
      Swal.fire({
        text: "कृपया शोधण्यासाठी प्रथम कर्मचारी क्रमांक प्रविष्ट करा.",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    setIsSearching(true);

    try {
      Swal.fire({
        title: "Loading ...",
        text: "माहिती शोधत आहे...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      let found = null;

      try {
        const currentToken = token || localStorage.getItem("token") || "";
        const currentUlbId = ulbId || localStorage.getItem("ulbId") || 930;

        const reqHeaders = {};
        if (currentToken && currentToken !== "undefined" && currentToken !== "null") {
          reqHeaders.Authorization = `Bearer ${currentToken}`;
        }

        const res = await axios.post(
          `${BASE_URL}/api/FrmDCPSnoGenarationMst/getEmployeeByNo`,
          {
            employeeNo: trimmedNo,
            employeeId: !isNaN(trimmedNo) ? parseInt(trimmedNo, 10) : null,
            ulbId: currentUlbId,
          },
          { headers: reqHeaders }
        );

        console.log("📥 API Response getEmployeeByNo:", res.data);

        const resPayload = res.data?.data;
        let emp = resPayload?.data;

       
        if (resPayload?.list && resPayload.list.length > 0) {
          const matchUlb = resPayload.list.find(
            (r) => String(r.NUM_EMPLOYEE_ULBID) === String(currentUlbId)
          );
          if (matchUlb) {
            emp = {
              ...emp,
              employeeId: matchUlb.NUM_EMPLOYEE_EMPID,
              ulbId: matchUlb.NUM_EMPLOYEE_ULBID,
              name: matchUlb.EMPLOYEENAME || matchUlb.VAR_EMPLOYEE_ENGNAME || emp?.name || "",
              dob: formatDate(matchUlb.DATE_EMPLOYEE_DOB) || emp?.dob || "",
              address: matchUlb.VAR_EMPLOYEE_PSNTADDRESS || emp?.address || "",
              mobileNo: matchUlb.NUM_EMPLOYEE_MOBILENO ? String(matchUlb.NUM_EMPLOYEE_MOBILENO) : emp?.mobileNo || "",
              nomineeName: matchUlb.VAR_NOMINEE_NAME || emp?.nomineeName || "",
              emailId: matchUlb.VAR_EMPLOYEE_EMAILID || emp?.emailId || "",
              designation: matchUlb.DESIGNATION || emp?.designation || "",
              doj: formatDate(matchUlb.DATE_EMPLOYEE_JOINDATE) || emp?.doj || "",
              confirmationDate: formatDate(matchUlb.DATE_EMPLOYEE_CONFIRMDATE) || emp?.confirmationDate || "",
              dcpsNo: matchUlb.VAR_DCPSNOGEN_DCPSNO || emp?.dcpsNo || "",
              openingDcpsBalance: matchUlb.NUM_DCPSNOGEN_OPENINGBAL !== null && matchUlb.NUM_DCPSNOGEN_OPENINGBAL !== undefined
                ? matchUlb.NUM_DCPSNOGEN_OPENINGBAL
                : emp?.openingDcpsBalance || "",
            };
          }
        }

        if (emp && (emp.name || emp.employeeId || emp.designation)) {
          found = {
            employeeId: emp.employeeId || trimmedNo,
            ulbId: emp.ulbId || currentUlbId,
            name: emp.name || "",
            dob: emp.dob || "",
            address: emp.address || "",
            mobileNo: emp.mobileNo || "",
            emailId: emp.emailId || "",
            designation: emp.designation || "",
            doj: emp.doj || "",
            confirmationDate: emp.confirmationDate || "",
            nomineeName: emp.nomineeName || "",
            dcpsNo: emp.dcpsNo || "",
            openingDcpsBalance: emp.openingDcpsBalance !== null && emp.openingDcpsBalance !== undefined ? emp.openingDcpsBalance : "",
          };
        }
      } catch (apiErr) {
        console.error("API Search Error:", apiErr?.response?.data || apiErr.message);
      }


      Swal.close();

      if (found) {
        setEmployeeData(found);
        setOpeningDcpsBalance(found.openingDcpsBalance || "");
        setIsSearched(true);

        if (found.dcpsNo) {
          Swal.fire({
            icon: "info",
            title: "डीसीपीएस क्रमांक आधीच तयार आहे",
            text: `या कर्मचाऱ्याचा डीसीपीएस क्रमांक आधीच तयार करण्यात आला आहे: ${found.dcpsNo}`,
            confirmButtonColor: "#1e3a8a",
          });
        }
      } else {
        Swal.fire({
          text: `कर्मचारी क्रमांक "${trimmedNo}" ची माहिती आढळली नाही.`,
          confirmButtonColor: "#1e3a8a",
        });
      }
    } catch (err) {
      Swal.close();
      console.error("Search Error:", err);
      Swal.fire({
        text: "कर्मचारी माहिती शोधताना अडचण आली. कृपया पुन्हा प्रयत्न करा.",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleReset = () => {
    setEmployeeNo("");
    setIsSearched(false);
    setEmployeeData({
      name: "",
      dob: "",
      address: "",
      mobileNo: "",
      emailId: "",
      designation: "",
      doj: "",
      confirmationDate: "",
      nomineeName: "",
    });
    setOpeningDcpsBalance("");
  };


  const handleGenerateDCPSNo = async () => {
    if (!openingDcpsBalance && openingDcpsBalance !== 0) {
      Swal.fire({
        text: "कृपया आरंभीची डीसीपीएस शिल्लक (Opening DCPS Balance) प्रविष्ट करा.",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    setIsGenerating(true);

    try {
      Swal.fire({
        title: "Saving...",
        text: "कृपया प्रतीक्षा करा",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const currentYear = new Date().getFullYear();
      const randomSeq = Math.floor(1000 + Math.random() * 9000);
      const newDcpsNumber = `DCPS/${currentYear}/${ulbId}/${employeeNo.trim()}-${randomSeq}`;

      const currentToken = token || localStorage.getItem("token") || "";
      const reqHeaders = {};
      if (currentToken && currentToken !== "undefined" && currentToken !== "null") {
        reqHeaders.Authorization = `Bearer ${currentToken}`;
      }

      const res = await axios.post(
        `${BASE_URL}/api/FrmDCPSnoGenarationMst/SaveDCPS`,
        {
          employeeId: employeeData.employeeId || employeeNo.trim(),
          openingBalance: Number(openingDcpsBalance),
          userId: user?.userName || user?.userId || localStorage.getItem("username") || "Admin",
          ulbId: employeeData.ulbId || user?.ulbId || ulbId || 930,
        },
        { headers: reqHeaders }
      );

      Swal.close();

      const resultData = res.data?.data;
      if (resultData?.success) {
        Swal.fire({
          title: "यशस्वी!",
          text: resultData.message || "डीसीपीएस क्रमांक यशस्वीरित्या तयार झाला आहे.",
          icon: "success",
          confirmButtonColor: "#1e3a8a",
        });
        if (resultData.generatedDcpsNo) {
          setEmployeeData((prev) => ({
            ...prev,
            dcpsNo: resultData.generatedDcpsNo,
          }));
        }
      } else {
        Swal.fire({
          title: "सूचना",
          text: resultData?.message || res.data?.message || "काही अडचण आली.",
          icon: "warning",
          confirmButtonColor: "#1e3a8a",
        });
      }
    } catch (err) {
      Swal.close();
      console.error("Generate DCPS Error:", err);
      Swal.fire({
        text: err?.response?.data?.message || "डीसीपीएस क्रमांक तयार करताना त्रुटी आली.",
        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="px-2 sm:px-4 mt-4 sm:mt-6"
    >
      <Card className="border shadow-sm">
        <CardHeader className="border-b">
          <CardTitle className="text-lg font-semibold">
            DCPS No Generation - डीसीपीएस क्रमांक निर्मिती
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 items-center">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">Employee No :</Label>
              <Input
                name="employeeNo"
                placeholder="कर्मचारी क्रमांक प्रविष्ट करा"
                value={employeeNo}
                onChange={(e) => {
                  setEmployeeNo(e.target.value);
                  if (isSearched) {
                    setIsSearched(false);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleSearchEmployee();
                  }
                }}
                className="w-full sm:flex-1 text-gray-950 font-semibold border-gray-400 bg-white"
              />
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleSearchEmployee}
                disabled={isSearching}
                className="bg-blue-900 text-white px-6 w-full sm:w-auto"
              >
                {isSearching ? "शोधत आहे..." : "शोधा"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleReset}
                className="px-6 w-full sm:w-auto"
              >
                साफ करा
              </Button>
            </div>
          </div>
          <AnimatePresence>
            {isSearched && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="space-y-6 pt-4 border-t"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">Name :</Label>
                    <Input
                      name="name"
                      value={employeeData.name}
                      readOnly
                      disabled
                      className="w-full sm:flex-1 bg-slate-100 text-gray-950 font-semibold border-gray-400 disabled:opacity-100 disabled:text-gray-950 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-none"
                    />
                  </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">DOB :</Label>
                    <Input
                      name="dob"
                      value={employeeData.dob}
                      readOnly
                      disabled
                      className="w-full sm:flex-1 bg-slate-100 text-gray-950 font-semibold border-gray-400 disabled:opacity-100 disabled:text-gray-950 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-none"
                    />
                  </div>
                </div>

          
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">Address :</Label>
                    <Input
                      name="address"
                      value={employeeData.address}
                      readOnly
                      disabled
                      className="w-full sm:flex-1 bg-slate-100 text-gray-950 font-semibold border-gray-400 disabled:opacity-100 disabled:text-gray-950 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">Mobile No :</Label>
                    <Input
                      name="mobileNo"
                      value={employeeData.mobileNo}
                      readOnly
                      disabled
                      className="w-full sm:flex-1 bg-slate-100 text-gray-950 font-semibold border-gray-400 disabled:opacity-100 disabled:text-gray-950 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">Email Id :</Label>
                    <Input
                      name="emailId"
                      value={employeeData.emailId}
                      readOnly
                      disabled
                      className="w-full sm:flex-1 bg-slate-100 text-gray-950 font-semibold border-gray-400 disabled:opacity-100 disabled:text-gray-950 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-none"
                    />
                  </div>

               
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">Designation :</Label>
                    <Input
                      name="designation"
                      value={employeeData.designation}
                      readOnly
                      disabled
                      className="w-full sm:flex-1 bg-slate-100 text-gray-950 font-semibold border-gray-400 disabled:opacity-100 disabled:text-gray-950 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">DOJ :</Label>
                    <Input
                      name="doj"
                      value={employeeData.doj}
                      readOnly
                      disabled
                      className="w-full sm:flex-1 bg-slate-100 text-gray-950 font-semibold border-gray-400 disabled:opacity-100 disabled:text-gray-950 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">Dt of confirmation :</Label>
                    <Input
                      name="confirmationDate"
                      value={employeeData.confirmationDate}
                      readOnly
                      disabled
                      className="w-full sm:flex-1 bg-slate-100 text-gray-950 font-semibold border-gray-400 disabled:opacity-100 disabled:text-gray-950 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-none"
                    />
                  </div>
                </div>

                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
               
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">Name of the Nominee :</Label>
                    <Input
                      name="nomineeName"
                      value={employeeData.nomineeName}
                      readOnly
                      disabled
                      className="w-full sm:flex-1 bg-slate-100 text-gray-950 font-semibold border-gray-400 disabled:opacity-100 disabled:text-gray-950 disabled:bg-slate-100 disabled:cursor-not-allowed shadow-none"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className="sm:w-44 text-gray-900 font-semibold text-sm shrink-0">Opening DCPS Balance :</Label>
                    <Input
                      type="number"
                      name="openingDcpsBalance"
                      placeholder="Enter Amount"
                      value={openingDcpsBalance}
                      onChange={(e) => setOpeningDcpsBalance(e.target.value)}
                      className="w-full sm:flex-1 bg-white text-gray-950 font-semibold border-gray-400 placeholder:text-gray-400 focus:border-blue-700"
                    />
                  </div>
                </div>

            
                <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 pt-4 border-t">
                  <Button
                    type="button"
                    onClick={handleGenerateDCPSNo}
                    disabled={isGenerating}
                    className="bg-blue-900 text-white px-6 w-full sm:w-auto"
                  >
                    Generate DCPS No
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    className="px-6 w-full sm:w-auto"
                    onClick={() => navigate("/HomePage/FrmHomePage")}
                  >
                    परत
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmDCPSnoGenaretionMst;
