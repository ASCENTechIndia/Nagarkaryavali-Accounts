import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { ReceiptSchema } from "../validations/global.validation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Swal from "sweetalert2";
import { DatePicker } from "@/components/ui/calendar";
import ShadCNTable from "@/components/ui/table";
import SearchableSelect from "@/components/SearchableSelect";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useLocation } from "react-router-dom";



/* ---------------- ZOD VALIDATOR ---------------- */
// const validateWithZod = (values) => {
//   const result = ReceiptSchema.safeParse(values);

//   if (result.success) return {};

//   const errors = {};
//   result.error.errors.forEach((err) => {
//     errors[err.path[0]] = err.message;
//   });

//   return errors;
// };

const FrmReceipt = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const refNo = location.state?.receiptNo;
  const ulbId = user?.ulbId;

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zones, setZones] = useState([]);
  const [transTypes, setTransTypes] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [remarks, setRemarks] = useState([]);
  const [glList, setGlList] = useState([]);
  const [partyList, setPartyList] = useState([]);
  const [entryHeadList, setEntryHeadList] = useState([]);
  const [partyMasterList, setPartyMasterList] = useState([]);
  const [tempHead, setTempHead] = useState(null);
  const [glAllList, setGlAllList] = useState([]);
  const [tableData, setTableData] = useState([]);


  const handleAddRow = (values, setFieldValue) => {
    if (!values.entryDeptCode || !values.entryHead || !values.entryAmount) {
      Swal.fire({
        text: "Please fill all required fields",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    const selectedDept = glAllList.find(
      (g) => g.value === values.entryDeptCode
    );

    const selectedHead = entryHeadList.find(
      (h) => h.value === values.entryHead
    );

    const newRow = {
      delete: (
        <button
          onClick={() => handleDeleteRow(tableData.length)}
          className="text-red-600 font-semibold"
        >
          Delete
        </button>
      ),
      deptCode: values.entryDeptCode,
      deptName: selectedDept?.label || "",
      head: values.entryHead,
      headName: selectedHead?.label || "",
      remark: values.remark,
      amount: values.entryAmount,
    };

    setTableData((prev) => [...prev, newRow]);

    const updatedTotal =
      (Number(values.totalAmount) || 0) + Number(values.entryAmount || 0);

    setFieldValue("totalAmount", updatedTotal);

    setFieldValue("entryDeptCode", "");
    setFieldValue("entryHead", "");
    setFieldValue("entryAmount", "");
  };

  const handleDeleteRow = (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete?");

    if (!confirmDelete) return;

    setTableData((prev) => prev.filter((_, i) => i !== index));
  };

  const fetchZones = async () => {
    try {
      debugger;
      const res = await axios.post(`${BASE_URL}/api/Receipt/zones`, {
        corp_id: ulbId,
      },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      setZones(res.data.data || []);
    } catch (err) {
      console.error("Zones API Error:", err);
    }
  };

  const fetchTransTypes = async () => {
    try {
      debugger;
      const res = await axios.get(`${BASE_URL}/api/Receipt/transType`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      setTransTypes(res.data.data || []);
    } catch (err) {
      console.error("Transaction Type API Error:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/departments`, {
        ulbid: ulbId,
      },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      setDepartments(res.data.data || []);
    } catch (err) {
      console.error("Department API Error:", err);
    }
  };

  const fetchRemarks = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/narration`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      setRemarks(res.data.data || []);
    } catch (err) {
      console.error("Remarks API Error:", err);
    }
  };

  const fetchPartyMaster = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/api/Receipt/party`, {
        ulbid: ulbId,
      },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

      const data = res.data.data || [];

      const formatted = data.map((item) => ({
        label: item.PARTYNAME,
        value: item.NUM_PARTYMST_PARTYID.toString(),
      }));

      setPartyMasterList(formatted);
    } catch (err) {
      console.error("Party API Error:", err);
    }
  };

  const fetchGLAll = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

      const data = res.data.data || [];

      const formatted = data.map((item) => ({
        label: item.GLSEARCHNAME,
        value: item.GLFUNCTION.toString(),
      }));

      setGlAllList(formatted);
    } catch (err) {
      console.error("GL ALL API Error:", err);
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchZones();
      fetchTransTypes();
      fetchDepartments();
      fetchRemarks();
      fetchPartyMaster();
      fetchGLAll();
    }
  }, [ulbId]);


  const fetchGLList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGL`,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
      setGlList(res.data.data || []);
    } catch (err) {
      console.error("GL API Error:", err);
    }
  };

  const fetchCreditLeasure = async (glcode, type) => {
    try {
      debugger;
      const res = await axios.post(`${BASE_URL}/api/FrmTransfer/credit-leasure`, {
        corp_id: ulbId,
        glcode: glcode,
      },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

      const data = res.data?.data?.rows || [];

      const formatted = data.map((item) => ({
        label: item.ACCNAME,
        value: item.OBJECTCODE.toString(),
      }));

      if (type === "party") {
        setPartyList(formatted);
      } else if (type === "entryHead") {
        setEntryHeadList(formatted);
      }
    } catch (err) {
      console.error("Credit Leasure API Error:", err);
    }
  };


  const fetchReceiptDetails = async (refNo, setFieldValue) => {
    try {
      Swal.fire({
        title: "Loading ...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const res = await axios.post(`${BASE_URL}/api/Receipt/receiptDetails`, {
        RefNo: refNo,
      },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

      const data = res.data.data || [];

      if (data.length === 0) return;

      const first = data[0];

      setFieldValue("zoneId", first.ZONEID?.toString());
      setFieldValue("transactionType", first.TRNSTYPEID?.toString());
      setFieldValue("reciptNo", first.RECNO);
      setFieldValue("date", new Date(first.TRNSDATE));
      setFieldValue("department", first.ACCDEPTID?.toString());
      setFieldValue("remark", first.NARRATION);

      setFieldValue("wardCode", first.DRGL?.toString()); // for UI
      setTempHead(first.ACCNO?.toString());

      fetchCreditLeasure(first.GLCODE?.toString(), "party");

      const total = data.reduce((sum, item) => sum + Number(item.CREDIT || 0), 0);
      setFieldValue("totalAmount", total);

      const tableFormatted = data.map((item, index) => ({
        delete: (
          <button
            onClick={() => handleDeleteRow(index)}
            className="text-red-600 font-semibold"
          >
            Delete
          </button>
        ),
        deptCode: item.GLCODE,
        deptName: item.GLNAME,
        head: item.ACCNO,
        headName: item.ACCOUNTNAME,
        remark: item.NARRATION,
        amount: item.CREDIT,
      }));

      setTableData(tableFormatted);

    } catch (err) {
      console.error("Receipt Details API Error:", err);
    } finally {
      Swal.close();
    }
  };

  const handleSave = async (values) => {
    try {

      if (!values.zoneId || values.zoneId === "0") {
        Swal.fire({
          text: "प्रभाग रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (!values.transactionType || values.transactionType === "0") {
        Swal.fire({
          text: "व्यवहार प्रकार रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (!values.date) {
        Swal.fire({
          text: "तारीख रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (!values.reciptNo) {
        Swal.fire({
          text: "चलन/पावती क्र रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (!values.wardCode) {
        Swal.fire({
          text: "डेबिट GL रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (!values.head) {
        Swal.fire({
          text: "डेबिट खाते रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (!values.totalAmount) {
        Swal.fire({
          text: "एकूण रक्कम रिक्त असू शकत नाही",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      if (tableData.length === 0) {
        Swal.fire({
          text: "व्यवहार सूची रिक्त आहे",
          confirmButtonColor: "#1e3a8a",
        });
        return;
      }

      const formatDate = (date) => {
        const d = new Date(date);
        return d.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }).replace(/ /g, "-");
      };

      const TransDate = formatDate(values.date);

      const InMode = refNo ? 2 : 1;
      const RefNo = refNo || 0;

      const paramStr = [
        TransDate,
        values.reciptNo,
        values.transactionType,
        values.zoneId,
        0,
        values.wardCode,
        values.head,
        InMode,
        RefNo,
        "",
        "",
        1,
        1,
      ].join("~");

      const paramStr2 = tableData
        .map((row) => {
          return [
            row.deptCode,
            row.head,
            row.amount,
            row.remark || "",
            row.partyId || 0,
          ].join("#");
        })
        .join("$");


      const res = await axios.post(`${BASE_URL}/api/Receipt/receiptInsertUpdate`, {
        In_UserId: user?.userId,
        In_ParamStr: paramStr,
        In_ParamStr2: paramStr2,
        In_ParamStr3: "",
        In_ParamStr4: "",
        In_ParamStr5: "",
        In_ParamStr6: "",
      },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

      console.log("API RESPONSE:", res.data);

      Swal.fire({
        text: res.data?.message,
        confirmButtonColor: "#1e3a8a",
      });

    } catch (err) {
      console.error("SAVE ERROR:", err);
      Swal.fire({
        text: "Error while saving",
        confirmButtonColor: "#1e3a8a",
      });
    }
  };

  const headers = [
    "Delete",
    "विभाग कोड",
    "विभाग संकेतांकचे नाव",
    "लेखाशीर्ष",
    "लेखाशीर्ष नाव",
    "तपशील",
    "रक्कम",
  ];

  const keyMapping = {
    Delete: "delete",
    "विभाग कोड": "deptCode",
    "विभाग संकेतांकचे नाव": "deptName",
    लेखाशीर्ष: "head",
    "लेखाशीर्ष नाव": "headName",
    तपशील: "remark",
    रक्कम: "amount",
  };

  const dummyData = tableData;

  const initialValues = {
    zoneId: "",
    transactionType: "",
    department: "",
    reciptNo: "",
    wardCode: "",
    remark: "",
    status: "",
    date: new Date(),
  };



  return (
    <Formik
      initialValues={initialValues}
      // validate={validateWithZod}
      onSubmit={(values) => {
        handleSave(values);
      }}
    >
      {({
        values,
        handleChange,
        setFieldValue,
        errors,
        touched,
      }) => {
        useEffect(() => {
          if (
            refNo &&
            ulbId &&
            zones.length &&
            transTypes.length &&
            departments.length
          ) {
            fetchReceiptDetails(refNo, setFieldValue);
          }
        }, [refNo, ulbId, zones, transTypes, departments]);

        useEffect(() => {
          if (values.transactionType) {
            fetchGLList();
          } else {
            setGlList([]);
          }
        }, [values.transactionType]);

        useEffect(() => {
          if (values.wardCode) {
            fetchCreditLeasure(values.wardCode, "party");
          } else {
            setPartyList([]);
          }
        }, [values.wardCode]);

        useEffect(() => {
          if (partyList.length > 0 && tempHead) {
            const exists = partyList.find(
              (item) => item.value?.trim() === tempHead?.trim()
            );

            if (exists) {
              setFieldValue("head", exists.value); // ✅ set value
              setTempHead(null);
            }
          }
        }, [partyList]);

        console.log("partyList:", partyList);


        useEffect(() => {
          if (values.entryDeptCode) {
            fetchCreditLeasure(values.entryDeptCode, "entryHead");
          } else {
            setEntryHeadList([]);
          }
        }, [values.entryDeptCode]);

        const finalTotal = tableData.reduce(
          (sum, row) => sum + Number(row.amount || 0),
          0
        );

        useEffect(() => {
          setFieldValue("finalTotal", finalTotal);
        }, [tableData]);


        return (

          <Form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    पावती
                  </CardTitle>
                </CardHeader>

                <CardContent className="px-4 sm:px-6 space-y-3">

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <Label text="प्रभाग :" />
                      <Select
                        value={values.zoneId}
                        onValueChange={(v) => setFieldValue("zoneId", v)}
                      >
                        <SelectTrigger className="w-full border rounded-md">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {zones.map((z) => (
                            <SelectItem
                              key={z.ZONEID}
                              value={z.ZONEID.toString()}
                            >
                              {z.ZONEENAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.zoneId && touched.zoneId && (
                        <p className="mt-1 text-sm text-red-500">{errors.zoneId}</p>
                      )}
                    </div>

                    <div>
                      <Label text="व्यवहार प्रकार :" />
                      <Select
                        value={values.transactionType}
                        onValueChange={(v) => setFieldValue("transactionType", v)}
                      >
                        <SelectTrigger className="w-full border rounded-md">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {transTypes.map((t) => (
                            <SelectItem
                              key={t.VALUEFIELD}
                              value={t.VALUEFIELD.toString()}
                            >
                              {t.DISPLAYTEXT}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label text="दिनांक :" />
                      <DatePicker
                        value={values.date}
                        onChange={(d) => setFieldValue("date", d)}
                      />
                    </div>

                    <div>
                      <Label text="चलन/पावती क्र :" />
                      <Input
                        name="reciptNo"
                        value={values.reciptNo}
                        onChange={handleChange}
                      />
                      {errors.reciptNo && touched.reciptNo && (
                        <p className="mt-1 text-sm text-red-500">{errors.reciptNo}</p>
                      )}
                    </div>

                    <div>
                      <Label text="विभाग संकेतांक :" />
                      <SearchableSelect
                        options={glList.map((g) => ({
                          label: g.GLNAME,
                          value: g.GLCODE.toString(),
                        }))}
                        name="wardCode"
                        value={values.wardCode}
                        onChange={(val) => setFieldValue("wardCode", val.value)}
                      />
                      {errors.wardCode && touched.wardCode && (
                        <p className="mt-1 text-sm text-red-500">{errors.wardCode}</p>
                      )}
                    </div>

                    <div>
                      <Label text="लेखाशीर्ष :" />
                      <SearchableSelect
                        key={values.head}
                        options={partyList}
                        name="head"
                        value={values.head}
                        onChange={(val) => setFieldValue("head", val.value)}
                      />
                    </div>

                    <div>
                      <Label text="एकूण रक्कम :" />
                      <Input name="totalAmount" value={values.totalAmount} onChange={handleChange} />
                    </div>

                    <div>
                      <Label text="विभाग :" />
                      <Select
                        value={values.department}
                        onValueChange={(v) => setFieldValue("department", v)}
                      >
                        <SelectTrigger className="w-full border rounded-md">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {departments.map((d) => (
                            <SelectItem
                              key={d.DEPTID}
                              value={d.DEPTID.toString()}
                            >
                              {d.DEPTNAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <hr />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                    <div>
                      <Label text="विभाग संकेतांक :" />
                      <SearchableSelect
                        options={glAllList}
                        name="entryDeptCode"
                        value={values.entryDeptCode}
                        onChange={(val) => setFieldValue("entryDeptCode", val.value)}
                      />
                    </div>

                    <div>
                      <Label text="लेखाशीर्ष :" />
                      <SearchableSelect
                        options={entryHeadList}
                        name="entryHead"
                        value={values.entryHead}
                        onChange={(val) => setFieldValue("entryHead", val.value)}
                      />
                    </div>

                    <div>
                      <Label text="Select Remark :" />
                      <Select
                        onValueChange={(v) => setFieldValue("remark", v)}
                      >
                        <SelectTrigger className="w-full border rounded-md">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {remarks.map((r, index) => (
                            <SelectItem
                              key={index}
                              value={r.VAR_NARRATION_REMARK}
                            >
                              {r.VAR_NARRATION_REMARK}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label text="रक्कम :" />
                      <div className="flex gap-2">
                        <Input name="entryAmount" onChange={handleChange} />
                        <Select defaultValue="credit">
                          <SelectTrigger className="w-30 border rounded-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="credit">Credit</SelectItem>
                            <SelectItem value="debit">Debit</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label text="तपशील :" />
                      <Input
                        name="remark"
                        value={values.remark}
                        onChange={handleChange}
                      />
                      {errors.remark && touched.remark && (
                        <p className="mt-1 text-sm text-red-500">{errors.remark}</p>
                      )}
                    </div>

                    <div>
                      <Label text="पार्टी संकेतांक :" />
                      <Select
                        value={values.partyId}
                        onValueChange={(v) => setFieldValue("partyId", v)}
                      >
                        <SelectTrigger className="w-full border rounded-md">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {partyMasterList.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Button
                      type="button"
                      onClick={() => handleAddRow(values, setFieldValue)}
                    >
                      यादीत जोडा
                    </Button>
                  </div>

                  <hr />

                  <div className="w-full overflow-x-auto">
                    <ShadCNTable
                      headers={headers}
                      data={dummyData}
                      keyMapping={keyMapping}
                      pagination={false}
                    />
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-4">

                    <div className="flex items-center gap-2">
                      <Label text="एकूण रक्कम :" />
                      <Input
                        className="w-50"
                        name="finalTotal"
                        value={values.finalTotal || 0}
                        readOnly
                      />
                    </div>

                    <div className="flex gap-3">
                      <Button type="submit" className="bg-blue-900 text-white">
                        साठवा
                      </Button>
                      <Button type="button" variant="destructive" onClick={() => navigate("/Transactions/FrmPaymentList")}>
                        रद्द
                      </Button>
                    </div>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          </Form>
        )
      }}
    </Formik>
  );
};

export default FrmReceipt;