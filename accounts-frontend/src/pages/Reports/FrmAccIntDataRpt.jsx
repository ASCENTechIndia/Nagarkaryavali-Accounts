import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Form, Formik } from "formik";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import * as XLSX from "xlsx";
import { FrmAccIntDataRptValidationSchema } from "../validations/global.validation";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const FrmAccIntDataRpt = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const [accIntData, setAccIntData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [corporationOptions, setCorporationOptions] = useState([]);
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const initialFormValues = {
    corporation: "",
    status: "-1",
    department: "-1",
    fromDate: new Date(),
    toDate: new Date(),
  };

  const statusOptions = [
    {value: "-1", label: "ALL"},
    {value: "A", label: "Present"},
    {value: "D", label: "Deleted"}
  ]

  const fetchCorporation = async () => {
    try {
      if (!ulbId) return;
      
      const res = await axios.post(
        `${BASE_URL}/api/FrmAccIntDataRpt/corporation-info`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.data?.success) {
        const formatted = res.data.data.rows.map((l) => ({
          label: l.CORPORATIONNAME,
          value: String(l.CORPORATIONID),
        }));

        setCorporationOptions(formatted);
      }
    } catch (err) {
      console.error("Error fetching department:", err);
    }
  };

  const fetchDepartment = async () => {
    try {
      if (!ulbId) return;
      
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/departments`,
        { ulbid: Number(ulbId)},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (res?.data?.ok) {
        const formatted = res.data.data.map((l) => ({
          label: l.DEPTNAME,
          value: String(l.DEPTID),
        }));

        const allFormarted = [
            { value: "-1", label: "-- ALL --" },
            ...formatted
        ]

        console.log("All Formated Department :", allFormarted);

        setDepartmentOptions(allFormarted);
      }
    } catch (err) {
      console.error("Error fetching department:", err);
    }
  };

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString('en', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleFormSubmit = async (values, { setSubmitting }) => {
    try {
        setLoading(true);
        setHasSearched(true);

        const validationResult = FrmAccIntDataRptValidationSchema.safeParse(values);
        if (!validationResult.success) {
            const firstError = validationResult.error.issues[0];
            console.log("Validation error:", firstError);
            await Swal.fire({
                text: firstError.message,
                confirmButtonColor: '#1e3a8a'
            });
            setSubmitting(false);
            setLoading(false);
            return;
        }

        const payload = {
            ulbid: Number(values.corporation),
            status: values.status,
            deptId: values.department,
            fromDate: formatDateForAPI(values.fromDate),
            toDate: formatDateForAPI(values.toDate),
        };

        const res = await axios.post(
            `${BASE_URL}/api/FrmAccIntDataRpt/department-transactions`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (res?.data?.ok && res?.data?.data?.success) {
            const fetchedData = res.data.data.rows.map((item) => ({
                deptName: item.DEPT_NAME,
                drDate: item.TRANSDATE,
                payMode: item.RECMODE,
                description: item.DESCRIPTION,
                receiptNo: item.RECEIPTNO,
                challanNo: item.CHALANNO,
                discount: item.DISCOUNT,
                advance: item.ADVANCE,
                collection: item.COLLECTION,
                status: item.STATUSFLAG,
            }));

            setAccIntData(fetchedData);
        } else {
            setAccIntData([]);
            Swal.fire({
                text: "माहिती उपलब्ध नाही",
                confirmButtonColor: '#1e3a8a',
            });
        }


    } catch (err) {
      console.error("Fetch Error:", err);
      Swal.fire({
        text: "सर्व्हर त्रुटी निर्माण झाली आहे",
        confirmButtonColor: '#1e3a8a',
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const handleResetForm = (resetForm) => {
    Swal.fire({
      title: 'निश्चिती?',
      text: "सर्व माहिती हटवायची आहे का?",
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'होय, हटवा',
      cancelButtonText: 'रद्द करा'
    }).then((result) => {
      if (result.isConfirmed) {
        resetForm();
        setAccIntData([]);
        setSelectedFormValues(null);
        setLoading(false);
        setSubmitting(false);
        Swal.fire({
          text: "फॉर्म रीसेट झाला",
          confirmButtonColor: '#1e3a8a',
          timer: 1500
        });
      }
    });
  };

  useEffect(() => {
    if (ulbId) {
      fetchCorporation();
      fetchDepartment();
    }
  }, [ulbId]);

  const exportToExcel = () => {
    if (accIntData.length === 0) return;
    const excelData = accIntData.map((row) => ({
      "Department Name": row.deptName,
      "Date": row.drDate, 
      "PayMode": row.payMode,
      "Description": row.description,
      "Receipt No": row.receiptNo,
      "Challan No": row.challanNo,
      "Discount": row.discount,
      "Advance": row.advance,
      "Collection": row.collection,
      "Status": row.status,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);

    ws['!cols'] = [
      { wch: 20 }, 
      { wch: 15 }, 
      { wch: 12 }, 
      { wch: 30 }, 
      { wch: 20 }, 
      { wch: 15 }, 
      { wch: 10 },
      { wch: 10 }, 
      { wch: 15 },
      { wch: 12 },
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transactions");
    XLSX.writeFile(wb, `Account_Report_${formatDateForAPI(new Date())}.xlsx`);
  };

  const headers = [
    "Department Name",
    "Date",
    "PayMode",
    "Description",
    "Receipt No",
    "Challan No",
    "Discount",
    "Advance",
    "Collection",
    "Status",
  ];

  const keyMapping = {
    "Department Name": "deptName",
    Date: "date",
    "PayMode": "payMode",
    "Description": "description",
    "Receipt No": "receiptNo",
    "Challan No": "challanNo",
    "Discount": "discount",
    "Advance": "advance",
    "Collection": "collection",
    "Status": "status",
  };

  const tableRows = accIntData.map((row) => ({
    deptName: row.deptName,
    date: row.drDate ? formatDateForAPI(row.drDate) : "",
    payMode: row.payMode || "",
    description: row.description || "",
    receiptNo: row.receiptNo || "",
    challanNo: row.challanNo || "",
    discount: row.discount || "0",   
    advance: row.advance || "0",   
    collection: row.collection || "",
    status: row.status || "",
  }))

  return (
    <Formik
      initialValues={initialFormValues}
      enableReinitialize={false}
      onSubmit={handleFormSubmit}
    >
      {({ values, setFieldValue, isSubmitting, handleSubmit, resetForm }) => {
        return (
          <Form onSubmit={handleSubmit}>
            <motion.div variants={container} initial="hidden" animate="show">
              <Card className="shadow-sm border">
                <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <CardTitle className="text-lg font-semibold">
                    Account Integrated Data Report
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="नगरपालिकेचे नांव" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.corporation}
                        onValueChange={(v) => setFieldValue("corporation", v)}
                      >
                        <SelectTrigger className="!w-full h-9 overflow-hidden">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {corporationOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="दिनांका पासुन" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.fromDate}
                        onChange={(d) => setFieldValue("fromDate", d)}
                        className="w-full h-9"
                      />
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="दिनांका पर्यंत" />
                        <span>:</span>
                      </div>
                      <DatePicker
                        value={values.toDate}
                        onChange={(d) => setFieldValue("toDate", d)}
                        className="w-full h-9"
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="स्थिती" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.status}
                        onValueChange={(v) => setFieldValue("status", v)}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {statusOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Department" />
                        <span>:</span>
                      </div>
                      <Select
                        value={values.department}
                        onValueChange={(v) => setFieldValue("department", v)}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>
                        <SelectContent>
                          {departmentOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    <Button type="submit" disabled={isSubmitting || loading}>
                      {loading ? "लोड करत आहे..." : "प्रक्रिया"}
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => handleResetForm(resetForm)}
                      disabled={loading}
                    >
                      हटवा
                    </Button>
                    <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                      बाहेर
                    </Button>
                  </div>

                  <div className="border rounded-lg bg-white">
                    {loading && (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        माहिती लोड होत आहे...
                      </div>
                    )}

                    {!loading && hasSearched && accIntData.length === 0 && (
                      <div className="py-10 text-center text-sm text-muted-foreground">
                        कोणतीही माहिती उपलब्ध नाही
                      </div>
                    )}

                    {!loading && (accIntData.length > 0) && (
                      <>
                        <div className="flex justify-end items-center mb-4">
                            <Button 
                              type="button"  
                              onClick={exportToExcel} className="bg-blue-900 hover:bg-blue-800 text-white px-8">
                              Export
                            </Button>
                        </div>

                        <ShadCNTable
                          headers={headers}
                          data={tableRows}
                          keyMapping={keyMapping}
                          className="max-sm:min-w-95"
                        />
                      </>
                    )}
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

export default FrmAccIntDataRpt;