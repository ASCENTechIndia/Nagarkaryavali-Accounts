import React, { useState, useEffect } from "react";
import axios from "axios";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

const ModalWrapper = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div className="bg-[#e8e1d8] rounded-lg shadow-xl w-[95%] max-w-5xl">
      {/* HEADER */}
      <div className="flex justify-between items-center px-4 py-3 border-b">
        <h2 className="text-lg font-semibold">{title}</h2>
        <button onClick={onClose} className="text-red-500 text-lg">
          ✖
        </button>
      </div>

      {/* BODY */}
      <div className="max-h-[400px] overflow-auto p-3">{children}</div>

      {/* FOOTER */}
      <div className="flex justify-center gap-3 p-3 border-t">
        <Button className="bg-green-600 hover:bg-green-700">OK</Button>
       
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
  const [selectedZone, setSelectedZone] = useState("-1");

  const [lekhaData, setLekhaData] = useState([]);
  const [lekhaLoading, setLekhaLoading] = useState(false);

  const [pavatiData, setPavatiData] = useState([]);
  const [pavatiLoading, setPavatiLoading] = useState(false);

  const [deptList, setDeptList] = useState([]);
  const [selectedDept, setSelectedDept] = useState("-1");

  const [loading, setLoading] = useState(false);

  /* ================= API ================= */

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

  const fetchZone = async (deptId) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Bankdeposit/dropdown`,
        {
          deptId: deptId && deptId !== "-1" ? deptId : "",
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      console.log("ZONE API RESPONSE:", res.data); // 🔍 DEBUG

      if (res.data?.ok) {
        setZoneList(res.data?.data?.list || []);
      } else {
        setZoneList([]);
      }
    } catch (err) {
      console.error("Zone API Error:", err);
      setZoneList([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/Bankdeposit/department?ulbId=${ulbId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.ok) {
        setDeptList(res.data?.data?.list || []);
      }
    } catch (err) {
      console.error("Department API Error:", err);
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchGL();
      fetchDepartments();
      fetchZone(selectedDept); // ✅ pass dept
    }
  }, [ulbId, selectedDept]);

  const handleSearch = async (values) => {
    debugger;
    if (!values.fromDate || !values.toDate) {
      alert("Please select From Date and To Date");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/Bankdeposit/summary-bankDeposit`,
        {
          ulbId: Number(ulbId),
          fromDate: values.fromDate,
          toDate: values.toDate,

          zoneId: "",
          deptId: "",
          collectionId: "",

          receiptNos: [],
          accountNos: [],
          challanNos: [],

          rmode: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.ok && res.data?.data?.success) {
        const list = res.data?.data?.list || [];

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
      } else {
        setTableData([]);
        setShowTable(true);
      }
    } catch (err) {
      console.error("Search API Error:", err);
      setTableData([]);
      setShowTable(true);
    } finally {
      setLoading(false);
    }
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

          zoneId: selectedZone === "-1" ? "" : selectedZone,
          deptId: selectedDept === "-1" ? "" : selectedDept,
          collectionId: "",

          rmode: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.ok && res.data?.data?.success) {
        const list = res.data?.data?.list || [];

        const mapped = list.map((item, index) => ({
          id: index + 1,
          checked: false,
          accountCode: item.ACCNO,
          giName: item.GLNAME,
          accountName: item.ACCOUNTNAME,
          challanNo: item.CHALLANO,
          date: item.RECDATE?.split("T")[0],
          paymode: item.RMODE,
          amount: Math.abs(Number(item.AMOUNT || 0)),
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

      const res = await axios.post(
        `${BASE_URL}/api/Bankdeposit/challan`,
        {
          ulbId: Number(ulbId),
          fromDate: values.fromDate,
          toDate: values.toDate,

          zoneId: selectedZone === "-1" ? "" : selectedZone,
          deptId: selectedDept === "-1" ? "" : selectedDept,
          collectionId: "",

          rmode: [],
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.ok && res.data?.data?.success) {
        const list = res.data?.data?.list || [];

        const mapped = list.map((item, index) => ({
          id: index + 1,
          checked: false,
          receiptNo: item.RECNO,
          challanNo: item.CHALLANO,
          date: item.RECDATE?.split("T")[0],
          paymode: item.RMODE,
          amount: Math.abs(Number(item.AMOUNT || 0)),
        }));

        setPavatiData(mapped);
      } else {
        setPavatiData([]);
      }
    } catch (err) {
      console.error("Challan API Error:", err);
      setPavatiData([]);
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

    // ================= HEADER (paramStr) =================
    const paramStr = [
      formattedDate,                      // TransDate
      Date.now(),                         // VoucherNo (dynamic)
      2,                                  // TransType (same as .NET)
      selectedZone === "-1" ? 0 : selectedZone,
      0,
      selectedGL.value,                   // Debit GL
      selectedLedger.value,               // Debit Account
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
          row.id,                         // RECNO (use id if not available)
          formattedDate,                  // RECDATE
          8,                              // MODE (BANK = 8)
          row.departmentId || 0,          // DEPARTMENT
          Math.abs(row.amount || 0),      // AMOUNT
          selectedZone === "-1" ? 0 : selectedZone,
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
        fromDate: "",
        toDate: "",
      }}
      onSubmit={handleSearch}
    >
      {({ values, handleChange }) => (
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
                          value={selectedDept}
                          onValueChange={(val) => {
                            setSelectedDept(val);
                            setSelectedZone("-1"); 
                          }}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="-- निवडा --" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="-1">All</SelectItem>

                            {(deptList || []).map((dept) => {
                              if (!dept?.DEPTID) return null;

                              return (
                                <SelectItem
                                  key={dept.DEPTID}
                                  value={dept.DEPTID.toString()}
                                >
                                  {dept.DEPTNAME}
                                </SelectItem>
                              );
                            })}
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
                      <Input
                        type="date"
                        name="fromDate"
                        onChange={handleChange}
                        value={values.fromDate}
                      />
                    </div>

                    {/* Collection */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                      <div className="flex items-center gap-1 sm:w-[150px] shrink-0">
                        <Label className="whitespace-nowrap">Collection</Label>
                        <span>:</span>
                      </div>
                      <div className="flex-1 min-w-[200px]">
                        <Select>
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="-- निवडा --" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="nagpur">Nagapur</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
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
                          value={selectedZone}
                          onValueChange={(val) => setSelectedZone(val)}
                        >
                          <SelectTrigger className="w-full h-9">
                            <SelectValue placeholder="-- निवडा --" />
                          </SelectTrigger>

                          <SelectContent>
                            <SelectItem value="-1">All</SelectItem>

                            {zoneList.map((zone) => (
                              <SelectItem
                                key={zone.ID}
                                value={zone.ID.toString()}
                              >
                                {zone.NAME}
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
                      <Input
                        type="date"
                        name="toDate"
                        onChange={handleChange}
                        value={values.toDate}
                      />
                    </div>
                  </div>
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
                    onClick={() => {
                      if (!values.fromDate || !values.toDate) {
                        alert("Select dates first");
                        return;
                      }
                      fetchChallan(values); // 🔥 call API
                      setShowPavatiModal(true);
                    }}
                  >
                    पावती तपशील
                  </Button>

                  <Button
                    onClick={() => {
                      if (!values.fromDate || !values.toDate) {
                        alert("Select dates first");
                        return;
                      }
                      fetchAccountWise(values); // 🔥 call API
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
              >
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[800px]">
                    {pavatiLoading ? (
                      <div className="text-center py-10">Loading...</div>
                    ) : (
                      <ShadCNTable
                        headers={[
                          "Select",
                          "Receipt no",
                          "Challan no",
                          "Date",
                          "Paymode",
                          "Amount",
                        ]}
                        data={pavatiData}
                        keyMapping={{
                          Select: "checked",
                          "Receipt no": "receiptNo",
                          "Challan no": "challanNo",
                          Date: "date",
                          Paymode: "paymode",
                          Amount: "amount",
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
                    )}
                  </div>
                </div>
              </ModalWrapper>
            )}

            {showLekhaModal && (
              <ModalWrapper
                title="लेखाशीर्ष तपशील"
                onClose={() => setShowLekhaModal(false)}
              >
                <div className="w-full overflow-x-auto">
                  <div className="min-w-[1000px]">
                    {lekhaLoading ? (
                      <div className="text-center py-10">Loading...</div>
                    ) : (
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
                            prev.map((r) => ({ ...r, checked })),
                          );
                        }}
                      />
                    )}
                  </div>
                </div>
              </ModalWrapper>
            )}

            {/* 🟢 AFTER SEARCH */}
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

                      <Input type="date" className="flex-1 min-w-[180px]" />
                    </div>
                  </div>

                  {/* TABLE */}
                  <div className="w-full overflow-x-auto rounded-lg border">
                    <div className="min-w-[900px]">
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
                    </div>
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
                    <Button variant="outline">Close</Button>
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
