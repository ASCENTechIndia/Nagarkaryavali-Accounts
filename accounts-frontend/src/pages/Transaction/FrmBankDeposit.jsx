import React, { useState, useEffect } from "react";
import axios from "axios";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/calendar";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from "@/components/SearchableSelect";
import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";

const ModalWrapper = ({ title, onClose, onConfirm, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-[#fdfbf8] rounded-lg shadow-xl w-[95%] max-w-5xl">
      <div className="flex justify-between items-center px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="text-red-500 text-lg">
          ✖
        </button>
      </div>

      <div className="max-h-[400px] overflow-auto p-3 no-scrollbar">{children}</div>

      <div className="flex justify-center gap-3 p-3 border-t">
        <Button onClick={onConfirm}>
          Add Selected
        </Button>

        <Button variant="destructive" onClick={onClose}>
          Close
        </Button>
      </div>
    </div>
  </div>
);

const BankDeposit = () => {
  const { user } = useAuth();
  const ulbId = user?.ulbId;
  const token = user?.token;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [glList, setGlList] = useState([]);
  const [creditList, setCreditList] = useState([]);

  const [selectedGL, setSelectedGL] = useState(null);
  const [selectedLedger, setSelectedLedger] = useState(null);

  const [tableData, setTableData] = useState([]);
  const [showTable, setShowTable] = useState(false);

  const [showPavatiModal, setShowPavatiModal] = useState(false);
  const [showLekhaModal, setShowLekhaModal] = useState(false);

  const [zoneList, setZoneList] = useState([]);
  const [lekhaData, setLekhaData] = useState([]);
  const [lekhaLoading, setLekhaLoading] = useState(false);

  const [pavatiData, setPavatiData] = useState([]);
  const [pavatiLoading, setPavatiLoading] = useState(false);

  const [departmentList, setDepartmentList] = useState([]);

  const [collectionList, setCollectionList] = useState([]);

  const [loading, setLoading] = useState(false);

  const authHeaders = {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };

  const fetchGL = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.data?.ok) setGlList(res.data.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadCredit = async (glCode) => {
    if (!glCode) return;

    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransfer/credit-leasure`,
        {
          corp_id: Number(ulbId),
          glcode: Number(glCode),
        },
        { headers: { Authorization: `Bearer ${token}` } },
      );

      setCreditList(res.data?.data?.rows || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDepartments = async () => {
    try {
      Swal.fire({
        title: "Loading Departments...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.get(
        `${BASE_URL}/api/Bankdeposit/department?ulbId=${ulbId}`,
        authHeaders,
      );

      const list = res?.data?.data?.list || [];

      setDepartmentList(
        list.map((item) => ({
          value: String(item.DEPTID),
          label: item.DEPTNAME,
        })),
      );
    } catch (error) {
      console.error("Department fetch error:", error);
      setDepartmentList([]);
    } 
      Swal.close();
    
  };

  const fetchZones = async (departmentId) => {
    try {
      if (!departmentId) {
        setZoneList([]);
        return;
      }

      Swal.fire({
        title: "Loading Zone...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmCashDeposit/zones-by-department`,
        {
          deptId: String(departmentId),
          ulbId: Number(ulbId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      const list = res?.data?.data?.list || [];

      setZoneList(
        list.map((zone) => ({
          value: String(zone.ID),
          label: zone.NAME,
        })),
      );
    } catch (err) {
      console.error("Error fetching zones by department:", err);
      setZoneList([]);
    } finally {
      Swal.close();
    }
  };

  const fetchCollectionCenters = async (prabhagId) => {
    try {
      if (!prabhagId) {
        setCollectionList([]);
        return;
      }
      Swal.fire({
        title: "Loading Collection...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const collectionPrabhagId = Number(prabhagId) - 1282;

      const res = await axios.get(
        `${BASE_URL}/api/ChequeDepo/collectioncenter/${collectionPrabhagId}`,
        authHeaders,
      );

      const rows = res?.data?.data?.rows || [];

      setCollectionList(
        rows.map((item) => ({
          value: String(item.VAR_COLLCEN_COLLCENID),
          label: item.VAR_COLLCEN_COLLCENNAME,
        })),
      );
    } catch (error) {
      console.error("Error fetching collection centers:", error);
      setCollectionList([]);
    } finally {
      Swal.close();
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchGL();
      fetchDepartments();
    }
  }, [ulbId]);

  const handleSearch = async (values) => {
    const formatDate = (date) => {
      if (!date) return "";

      const d = new Date(date);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");

      return `${yyyy}-${mm}-${dd}`;
    };

    const fromDate = values?.fromDate ? formatDate(values.fromDate) : "";
    const toDate = values?.toDate ? formatDate(values.toDate) : "";

    if (!fromDate || !toDate) {
      Swal.fire({
        icon: "warning",
        title: "Warning",
        text: "Please select From Date and To Date",
      });
      return;
    }

    const payload = {
      ulbId: Number(ulbId),
      fromDate,
      toDate,
      deptId: values.department || null,
      zoneId: values.zone || null,
      collectionId:
        values.department === "7" ? values.collection || null : null,
      receiptNos: [],
      accountNos: [],
      challanNos: [],
      rmode: [],
    };

    try {
      setLoading(true);

      Swal.fire({
        title: "Searching...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/Bankdeposit/summary-bankDeposit`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      
      Swal.close();

      // API failed
      if (!res.data?.ok || !res.data?.data?.success) {
        const message =
          res.data?.data?.message ||
          res.data?.message ||
          "No records available for the selected criteria.";

        setTableData([]);
        setShowTable(false);

        Swal.fire({
          icon: "warning",
          title: "No Data Found",
          text: message,
        });
        return;
      }

      const list = res.data?.data?.list || [];

      // No data
      if (list.length === 0) {
        setTableData([]);
        setShowTable(false);

        Swal.fire({
          // icon: "warning",
          title: "No Data Found",
          // text: "No records available for the selected criteria.",
        });
        return;
      }

      // Map data
      const mapped = list.map((item, index) => ({
        id: index + 1,
        checked: false,
        department: item.DEPARTMENT || "",
        departmentId: item.DEPTID || "",
        accountCode: item.ACCNO || "",
        accountHead: item.ACCOUNTNAME || "",
        amount: Math.abs(Number(item.AMOUNT || 0)),
        glcodeg: item.GLCODEG || "",
        accnog: item.ACCNOG || "",
      }));

      setTableData(mapped);
      setShowTable(true);

      Swal.fire({
        icon: "success",
        title: "Success",
        text: `${mapped.length} record(s) found.`,
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Search API Error:", err);

      Swal.close();

      setTableData([]);
      setShowTable(false);

      const message =
        err?.response?.data?.data?.message ||
        err?.response?.data?.message ||
        "Failed to fetch data";

      Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
      });
    } finally {
      setLoading(false);
    }
    Swal.close(); 
  };

  const handleAddPavati = () => {
    const selected = pavatiData.filter((r) => r.checked);

    if (selected.length === 0) {
      Swal.fire("Warning", "Please select at least one row", "warning");
      return;
    }

    const mapped = selected.map((r) => ({
      id: `P-${r.id}`,
      department: "Pavati",
      departmentId: "",
      accountCode: r.receiptNo,
      accountHead: r.challanNo,
      amount: r.amount,
      glcodeg: "",
      accnog: "",
      checked: false,
    }));

    setTableData((prev) => {
      // Keep only rows that were added from modals
      const previousModalRows = prev.filter(
        (row) =>
          String(row.id).startsWith("P-") || String(row.id).startsWith("L-"),
      );

      // Prevent duplicate modal rows
      const existingIds = new Set(previousModalRows.map((row) => row.id));

      const newRows = mapped.filter((row) => !existingIds.has(row.id));

      return [...previousModalRows, ...newRows];
    });
    
    setShowTable(true);
    setShowPavatiModal(false);

    // Clear modal selection
    setPavatiData((prev) => prev.map((row) => ({ ...row, checked: false })));
  };

  const handleAddLekha = () => {
    const selected = lekhaData.filter((r) => r.checked);

    if (selected.length === 0) {
      Swal.fire("Warning", "Please select at least one row", "warning");
      return;
    }

    const mapped = selected.map((r) => ({
      id: `L-${r.id}`,
      department: r.giName,
      departmentId: "-",
      accountCode: r.accountCode,
      accountHead: r.accountName,
      amount: r.amount,


      glcodeg: r.glcodeg || "",
      accnog: r.accnog || "",

      checked: false,
    }));

    console.log("Selected Lekha rows to add:", mapped);

    setTableData((prev) => {
      const previousModalRows = prev.filter(
        (row) =>
          String(row.id).startsWith("P-") || String(row.id).startsWith("L-"),
      );

      const existingIds = new Set(previousModalRows.map((row) => row.id));

      const newRows = mapped.filter((row) => !existingIds.has(row.id));

      return [...previousModalRows, ...newRows];
    });

    setShowTable(true);
    setShowLekhaModal(false);

    setLekhaData((prev) => prev.map((row) => ({ ...row, checked: false })));
  };

  const fetchAccountWise = async (values) => {
    try {
      setLekhaLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/Bankdeposit/account-wise`,
        {
          ulbId: Number(ulbId),
          fromDate: values.fromDate,
          toDate: values.toDate,

          zoneId: values.zone || null,
          deptId: values.department || null,
          collectionId:
            values.department === "7" ? values.collection || null : null,

          rmode: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.ok && res.data?.data?.success) {
        const list = res.data?.data?.list || [];
        console.log("Account Wise API Response List:", list);

        const mapped = list.map((item, index) => ({
          id: index + 1,
          checked: false,
          accountCode: item.ACCNO || "",
          giName: item.GLNAME || "",
          accountName: item.ACCOUNTNAME || "",
          challanNo: item.CHALLANO || "",
          date: item.RECDATE?.split("T")[0] || "",
          paymode: item.RMODE || "",
          amount: Math.abs(Number(item.AMOUNT || 0)),
          glcodeg: item.GLCODE || "", // ✅ correct field
          accnog: item.ACCNO || "", // ✅ correct field
        }));

        setLekhaData(mapped);
      } else {
        setLekhaData([]);
      }
    } catch (err) {
      console.error("Account Wise API Error:", err);
      setLekhaData([]);
    } finally {
      setLekhaLoading(false);
    }
  };

  const fetchChallan = async (values) => {
    try {
      setPavatiLoading(true);

      const formatDateForChallan = (date) => {
        if (!date) return "";

        const d = new Date(date);
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");

        return `${yyyy}-${mm}-${dd}`;
      };

      const res = await axios.post(
        `${BASE_URL}/api/Bankdeposit/challan`,
        {
          ulbId: Number(ulbId),

          fromDate: formatDateForChallan(values.fromDate),
          toDate: formatDateForChallan(values.toDate),

          deptId: values.department || null,
          zoneId: values.zone || null,
          collectionId:
            values.department === "7" ? values.collection || null : null,

          rmode: [],
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );

      if (res.data?.ok && res.data?.data?.success) {
        const list = res.data?.data?.list || [];
     

        const mapped = list.map((item, index) => ({
          id: index + 1,
          checked: false,
          receiptNo: item.RECNO || "",
          challanNo: item.CHALLANO || "",
          date: item.RECDATE?.split("T")[0] || "",
          paymode: item.RMODE || "",
          amount: Math.abs(Number(item.AMOUNT || 0)),
        }));

        setPavatiData(mapped);
      } else {
        setPavatiData([]);
      }
    } catch (err) {
      console.error("Challan API Error:", err);
      setPavatiData([]);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Failed to fetch challan details",
      });
    } finally {
      setPavatiLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return "";

    const d = new Date(date);

    return d
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
      .replace(/ /g, "-")
      .toUpperCase();
  };

  const handleSave = async (values) => {
    const selectedRows = tableData.filter((r) => r.checked);

    if (selectedRows.length === 0) {
      Swal.fire({
        icon: "warning",
        title: "No rows selected",
        text: "Please select at least one record",
      });
      return;
    }

    if (!values.fromDate || !values.toDate) {
      Swal.fire({
        icon: "warning",
        title: "Missing Dates",
        text: "Please select From Date and To Date",
      });
      return;
    }

    if (!selectedGL?.value || !selectedLedger?.value) {
      Swal.fire({
        icon: "warning",
        title: "Missing GL / Ledger",
        text: "Please select GL Code and Ledger",
      });
      return;
    }

    try {
      setLoading(true);

      const formattedDate = formatDate(values.fromDate);

      const paramStr = [
        formattedDate,
        Date.now(),
        2,
        values.zone || 0,
        0,
        selectedGL.value,
        selectedLedger.value,
        5,
        0,
        "",
        "",
        0,
      ].join("~");

      // ================= DETAILS (paramStr2) =================
      const paramStr2 = selectedRows
        .map((row) => {
          return [
            row.id, // RECNO (use id if not available)
            formattedDate, // RECDATE
            8, // MODE (BANK = 8)
            row.departmentId || 0, // DEPARTMENT
            Math.abs(row.amount || 0), // AMOUNT
            values.zone || 0,
            "Bank",
            "",
            "",
            "",
            row.glcodeg || 0,
            row.accnog || 0,
            row.glcodeg || 0,
            row.accnog || 0,
          ].join("#");
        })
        .join("$");

      // ================= API CALL =================
      const res = await axios.post(
        `${BASE_URL}/api/Bankdeposit/insert-cashier-receipt`,
        {
          userId: user?.userId || user?.username,
          ulbId: Number(ulbId),
          paramStr,
          paramStr2,
          paramStr3: "",
          fromDate: formattedDate,
          toDate: formatDate(values.toDate),
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      // ================= RESPONSE =================
      if (res.data?.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data?.data?.message,
        });

        setTableData([]);
        setShowTable(false);
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data?.message || "Insert failed",
        });
      }
    } catch (err) {
      console.error("SAVE ERROR:", err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || "Insert failed",
      });
    } finally {
      setLoading(false);
    }
  };

  const totalAmount = tableData
    .filter((r) => r.checked)
    .reduce((sum, r) => sum + r.amount, 0);

  const handleRowCheck = (row, checked) => {
    setTableData((prev) =>
      prev.map((r) => (r.id === row.id ? { ...r, checked } : r)),
    );
  };

  const handleSelectAll = (checked) => {
    setTableData((prev) => prev.map((r) => ({ ...r, checked })));
  };

  return (
    <Formik
      initialValues={{
        department: "",
        zone: "",
        collection: "ALL",
        fromDate: new Date(),
        toDate: new Date(),
        depositDate: new Date(),
      }}
      onSubmit={handleSearch}
    >
      {({ values, setFieldValue }) => (
        <Form>


          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {/* 🔵 TOP FILTER CARD */}
            <Card>
              <CardHeader className="border-b">
                <CardTitle>Bank Deposit</CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6">
                <div className="grid md:grid-cols-2 gap-x-10 gap-y-4">
                  {/* LEFT COLUMN */}
                  <div className="space-y-4">
                    {/* विभाग */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-1 sm:w-[150px] shrink-0">
                        <Label className="whitespace-nowrap">विभाग</Label>
                        <span>:</span>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <Select
                          value={values.department}
                          onValueChange={async (value) => {
                            setFieldValue("department", value);
                            setFieldValue("zone", "");
                            setFieldValue("collection", "");

                            setZoneList([]);
                            setCollectionList([]);

                            await fetchZones(value);
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="-- Select --" />
                          </SelectTrigger>

                          <SelectContent>
                            {departmentList.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* दिनांक पासून */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-1 sm:w-[150px] shrink-0">
                        <Label className="whitespace-nowrap">
                          दिनांक पासून
                        </Label>
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.fromDate}
                        onChange={(date) => setFieldValue("fromDate", date)}
                      />
                    </div>
                  </div>

                  {/* RIGHT COLUMN */}
                  <div className="space-y-4">
                    {/* प्रभाग */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-1 sm:w-[150px] shrink-0">
                        <Label className="whitespace-nowrap">प्रभाग</Label>
                        <span>:</span>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <Select
                          value={values.zone}
                          onValueChange={async (value) => {
                            setFieldValue("zone", value);
                            setFieldValue("collection", "");

                            setCollectionList([]);

                            if (values.department === "7") {
                              await fetchCollectionCenters(value);
                            }
                          }}
                        >
                          <SelectTrigger
                            className="w-full"
                            disabled={!values.department}
                          >
                            <SelectValue placeholder="-- Select --" />
                          </SelectTrigger>

                          <SelectContent>
                            {zoneList.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* दिनांक पर्यंत */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-1 sm:w-[150px] shrink-0">
                        <Label className="whitespace-nowrap">
                          दिनांक पर्यंत
                        </Label>
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.toDate}
                        onChange={(date) => setFieldValue("toDate", date)}
                      />
                    </div>
                  </div>

                  {values.department === "7" && (
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-1 sm:w-[150px] shrink-0">
                        <Label className="whitespace-nowrap">Collection</Label>
                        <span>:</span>
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <Select
                          value={values.collection}
                          onValueChange={(value) =>
                            setFieldValue("collection", value)
                          }
                        >
                          <SelectTrigger
                            className="w-full"
                            disabled={!values.zone}
                          >
                            <SelectValue placeholder="-- Select --" />
                          </SelectTrigger>

                          <SelectContent>
                            {collectionList.map((item) => (
                              <SelectItem key={item.value} value={item.value}>
                                {item.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>

                {/* 🔵 BUTTONS */}
                <div className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto"
                  >
                    {loading ? "Loading..." : "Search"}
                  </Button>

                  <Button
                    type="reset"
                    variant="destructive"
                    className="w-full sm:w-auto"
                    onClick={() => {
                      setTableData([]);
                      setShowTable(false);
                    }}
                  >
                    Reset
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      if (!values.fromDate || !values.toDate) {
                        alert("Select dates first");
                        return;
                      }

                      fetchChallan(values);
                      setShowPavatiModal(true);
                    }}
                  >
                    पावती तपशील
                  </Button>

                  <Button
                    type="button"
                    onClick={() => {
                      if (!values.fromDate || !values.toDate) {
                        alert("Select dates first");
                        return;
                      }

                      fetchAccountWise(values);
                      setShowLekhaModal(true);
                    }}
                  >
                    लेखाशीर्ष तपशील
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showPavatiModal && (
              <ModalWrapper
                title="पावती तपशील"
                onClose={() => setShowPavatiModal(false)}
                onConfirm={handleAddPavati}
              >
                 <div >
                  {pavatiLoading ? (
                    <div className="flex items-center justify-center py-10 text-sm font-medium">
                      Loading...
                    </div>
                  ) : (
                    <>
                      <ShadCNTable
                        headers={[
                          "Select",
                          "Receipt no",
                          "Challan no",
                          "Date",
                          "Paymode",
                          "Amount",
                          "Gl Codeg",
                          "Acc No g",
                        ]}
                        data={pavatiData}
                        keyMapping={{
                          Select: "checked",
                          "Receipt no": "receiptNo",
                          "Challan no": "challanNo",
                          Date: "date",
                          Paymode: "paymode",
                          Amount: "amount",
                          "Gl Codeg": "glcodeg",
                          "Acc No g": "accnog",
                        }}
                        onRowCheckChange={(row, checked) => {
                          setPavatiData((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, checked } : r,
                            ),
                          );
                        }}
                        onSelectAllChange={(checked) => {
                          setPavatiData((prev) =>
                            prev.map((r) => ({ ...r, checked })),
                          );
                        }}
                      />
                    </>
                  )}
                </div>
              </ModalWrapper>
            )}

            {showLekhaModal && (
              <ModalWrapper
                title="लेखाशीर्ष तपशील"
                onClose={() => setShowLekhaModal(false)}
                onConfirm={handleAddLekha}
              >
                <div >
                  {lekhaLoading ? (
                    <div className="flex items-center justify-center py-10 text-sm font-medium">
                      Loading...
                    </div>
                  ) : (
                    <>
                      <ShadCNTable
                        headers={[
                          "Select",
                          "Account Code",
                          "GI Name",
                          "Account Name",
                          "Challan no",
                          "Date",
                          "Paymode",
                          "Amount",
                        ]}
                        data={lekhaData}
                        keyMapping={{
                          Select: "checked",
                          "Account Code": "accountCode",
                          "GI Name": "giName",
                          "Account Name": "accountName",
                          "Challan no": "challanNo",
                          Date: "date",
                          Paymode: "paymode",
                          Amount: "amount",
                        }}
                        onRowCheckChange={(row, checked) => {
                          setLekhaData((prev) =>
                            prev.map((r) =>
                              r.id === row.id ? { ...r, checked } : r,
                            ),
                          );
                        }}
                        onSelectAllChange={(checked) => {
                          setLekhaData((prev) =>
                            prev.map((r) => ({
                              ...r,
                              checked,
                            })),
                          );
                        }}
                      />
                    </>
                  )}
                </div>
              </ModalWrapper>
            )}

            {showTable && (
              <Card className="mt-4">
                <CardContent className="p-6">
                  {/* 🔥 GL + LEDGER SECTION */}
                  <div className="flex flex-col lg:flex-row gap-4 mb-4">
                    {/* GL */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1">
                      <div className="flex items-center gap-1 sm:w-[160px] shrink-0">
                        <Label className="whitespace-nowrap">
                          विभाग संकेतांक
                        </Label>
                        <span>:</span>
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <SearchableSelect
                          options={glList.map((g) => ({
                            label: g.GLSEARCHNAME,
                            value: g.GLCODE.toString(),
                          }))}
                          value={selectedGL?.value || ""}
                          onChange={(val) => {
                            if (!val?.value) return;
                            setSelectedGL(val);
                            setSelectedLedger(null);
                            loadCredit(val.value);
                          }}
                        />
                      </div>
                    </div>

                    {/* LEDGER */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1">
                      <div className="flex items-center gap-1 sm:w-[160px] shrink-0">
                        <Label className="whitespace-nowrap">लेखाशीर्ष</Label>
                        <span>:</span>
                      </div>

                      <div className="flex-1 min-w-[200px]">
                        <SearchableSelect
                          options={creditList.map((c) => ({
                            label: c.ACCNAME,
                            value: c.OBJECTCODE.toString(),
                          }))}
                          value={selectedLedger?.value || ""}
                          onChange={(val) => setSelectedLedger(val)}
                        />
                      </div>
                    </div>

                    {/* DATE */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 flex-1">
                      <div className="flex items-center gap-1 sm:w-[160px] shrink-0">
                        <Label className="whitespace-nowrap">
                          Deposit Date
                        </Label>
                        <span>:</span>
                      </div>

                      <DatePicker
                        value={values.depositDate}
                        onChange={(date) => setFieldValue("depositDate", date)}
                      />
                    </div>
                  </div>

                  {/* TABLE */}
                  <div >
                    <>
                      <ShadCNTable
                        headers={[
                          "Select",
                          "Department",
                          "Department ID",
                          "Account Code",
                          "Account Head",
                          "Amount",
                          "glcodeg",
                          "accnog",
                        ]}
                        data={tableData}
                        keyMapping={{
                          Select: "checked",
                          Department: "department",
                          "Department ID": "departmentId",
                          "Account Code": "accountCode",
                          "Account Head": "accountHead",
                          Amount: "amount",
                          glcodeg: "glcodeg",
                          accnog: "accnog",
                        }}
                        onRowCheckChange={handleRowCheck}
                        onSelectAllChange={handleSelectAll}
                      />
                    </>
                  </div>

                  {/* TOTAL */}
                  <div className="mt-4">
                    <Label className="w-full">Total Selected Amount</Label>
                    <Input
                      value={totalAmount}
                      readOnly
                      className="border p-2 w-60"
                    />
                  </div>

                  {/* ACTION BUTTONS */}
                  <div className="flex justify-center gap-4 mt-6">
                    <Button
                      onClick={() => handleSave(values)}
                      disabled={loading}
                    >
                      {loading ? "Saving..." : "Save"}
                    </Button>
                    <Button type="button" variant="outline">
                      Close
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default BankDeposit;
