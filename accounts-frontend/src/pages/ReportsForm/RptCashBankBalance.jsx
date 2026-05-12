import { Formik, Form } from "formik";
import { useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { DatePicker } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import ShadCNTable from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";

const getInitialValues = () => {
  return {
    asOnDate: new Date(),
  };
};

const Row = ({ label, children }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center">
    <Label className="text-sm sm:text-right sm:pr-2 font-medium">
      {label} :
    </Label>
    {children}
  </div>
);

const RptCashBankBalance = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;

  const BASE_URL = import.meta.env.VITE_BASE_URL;
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf");
  const [tableData, setTableData] = useState([]);

  const formatDateForAPI = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleString('en', { month: 'short' }).toUpperCase();
    const year = d.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const handleSearch = async (values) => {
    try {
      setLoading(true);

      const payload = {
        toDate: formatDateForAPI(values.asOnDate),
        ulbId: ulbId,
      };

      const res = await axios.post(
        `${BASE_URL}/api/BankBalRpt/account-balance`,
        payload,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const list = res.data?.data?.list || [];

      if (!list.length) {
        Swal.fire("No Data", "No records found", "warning");
        return;
      }

      setTableData(list);

    } catch (err) {
      console.error(err);
      Swal.fire("Error", "Something went wrong", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    if (num === null || num === undefined) return "0";
    return Number(num).toLocaleString("en-IN");
  };

  const handleExportExcel = () => {
    if (!tableData || tableData.length === 0) {

      Swal.fire(
        "No Data",
        "No records found",
        "warning"
      );

      return;
    }
    
    const excelData = tableData.map((row) => {

      const balance = Number(row.BALANCE || 0);

      return {
        BALSCODE: row.BALSCODE || "",

        SUBTYPE: row.SUBTYPE || "",

        GLCODE: row.GLCODE || "",

        GLNAME: row.GLNAME || "",

        ACCNO: row.ACCNO || "",

        ACCNAME: row.ACCNAME || "",

        OBJECTCODE: row.OBJECTCODE || "",

        FUNCTIONCODE: row.FUNCTIONCODE || "",

        BALANCE: Math.abs(balance),

        "Cr/Dr":
          balance < 0
            ? "Dr."
            : "Cr."
      };
    });
    
    const worksheet =
      XLSX.utils.json_to_sheet(excelData);

    worksheet["!cols"] = [
      { wch: 12 }, // BALSCODE
      { wch: 12 }, // SUBTYPE
      { wch: 10 }, // GLCODE
      { wch: 35 }, // GLNAME
      { wch: 18 }, // ACCNO
      { wch: 40 }, // ACCNAME
      { wch: 18 }, // OBJECTCODE
      { wch: 18 }, // FUNCTIONCODE
      { wch: 15 }, // BALANCE
      { wch: 10 }, // Cr/Dr
    ];

    const workbook =
      XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(
      workbook,
      worksheet,
      "CashBankBalance"
    );

    const fileName =
      `Cash_Bank_Balance_${formatDateForAPI(new Date())}.xlsx`;

    XLSX.writeFile(
      workbook,
      fileName
    );
  };

  const handlePDFExport = async (values) => {
    try {

      setLoading(true);

      const payload = {
        toDate: formatDateForAPI(values.asOnDate),
        ulbId: Number(ulbId),
      };

      const res = await axios.post(
        `${BASE_URL}/api/BankBalRpt/accountbalancepdf`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.data?.success) {
        Swal.fire("Error", "PDF generation failed", "error");
        return;
      }

      window.open(res.data.pdfUrl, "_blank");

    } catch (err) {

      console.error(err);

      Swal.fire(
        "Error",
        err?.response?.data?.message || "PDF generation failed",
        "error"
      );

    } finally {
      setLoading(false);
    }
  };

  const headers = [
    "निवडा",
    "खाते क्र.",
    "खात्याचे नांव",
    "रक्कम",
  ];
  
  const keyMapping = {
    निवडा: "select",
    "खाते क्र.": "accNo",
    "खात्याचे नांव": "accName",
    "रक्कम": "amount",
  };

  const handleSelectVoucher = (row) => {
    navigate("/ReportsForm/FrmLedgerDetailRpt", {
      state: {
        data: row
      },
    });
  };
  
  const tableRows = [
    ...tableData.map((row) => ({
      select: (
        <Button
          variant="link"
          size="sm"
          className="text-blue-700 px-0"
          disabled={loading}
           onClick={() => handleSelectVoucher(row)}
        >
          निवडा
        </Button>
      ),
      accNo: row.OBJECTCODE || "",
      accName: row.ACCNAME || "",
      amount: row.BALANCE ? formatNumber(row.BALANCE) : "0",
    }))
  ];

  return (
    <Formik initialValues={getInitialValues()} onSubmit={handleSearch}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <Card className="shadow-sm border rounded-lg">

            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">
                रोख बँक शिल्लक अहवाल
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">

              <div className="grid md:grid-cols-2 gap-4">
                <Row label="दिनांक">
                  <DatePicker
                    value={values.asOnDate}
                    onChange={(date) => setFieldValue("asOnDate", date)}
                  />
                </Row>
              </div>

              <div className="flex gap-3 justify-center">
                <Button type="submit" disabled={loading}>
                  {loading ? "Loading..." : "प्रक्रिया"}
                </Button>

                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    resetForm();
                    setTableData([]);
                  }}
                >
                  हटवा
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/dashboard")}
                >
                  बाहेर जा
                </Button>
              </div>

              {tableData.length > 0 && (
                <>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="Export To" />
                        <span>:</span>
                      </div>
                      <div className="flex items-center gap-4 ml-2">
                        <div className="flex items-center gap-2">
                          <Input
                            type="radio"
                            id="exportPdf"
                            name="exportFormat"
                            value="pdf"
                            checked={exportFormat === "pdf"}
                            onChange={(e) => setExportFormat(e.target.value)}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="exportPdf" className="font-medium text-gray-700 cursor-pointer">
                            PDF
                          </Label>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="radio"
                            id="exportExcel"
                            name="exportFormat"
                            value="excel"
                            checked={exportFormat === "excel"}
                            onChange={(e) => setExportFormat(e.target.value)}
                            className="h-4 w-4"
                          />
                          <Label htmlFor="exportExcel" className="font-medium text-gray-700 cursor-pointer">
                            Excel
                          </Label>
                        </div>
                      </div>
                    </div>

                    <Button
                      type="button"
                      className="bg-blue-900"
                      onClick={() => {
                        if (exportFormat === "pdf") {
                          handlePDFExport(values);
                        } else {
                          handleExportExcel();
                        }
                      }}
                    >
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

            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default RptCashBankBalance;