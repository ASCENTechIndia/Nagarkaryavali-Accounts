import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Form, Formik } from "formik";
import { useState } from "react";
import Swal from "sweetalert2";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import ShadCNTable from "@/components/ui/table";

const getInitialValues = () => {
  return {
    selectType: "transaction",
    transactionNo: "",
  };
};

const FrmTransactionUpdate = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const userId = user?.userId;
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [loading, setLoading] = useState(false);
  const [showTable, setShowTable] = useState(false);
  
  const [transactionData, setTransactionData] = useState([]);
  const [voucherData, setVoucherData] = useState([]);
  const [tableData, setTableData] = useState([]);
  const [currentDataType, setCurrentDataType] = useState("");
  
  const [revokeReason, setRevokeReason] = useState("");

  const headers = [
    "व्यवहार प्रकार",
    "व्यवहार तारीख",
    "मेजर",
    "मेजर कोड नाव",
    "मायनर",
    "मायनर कोड नाव",
    "क्रेडिट",
    "डेबिट",
    "तपशील",
    "पार्टी",
  ];

  const keyMapping = {
    "व्यवहार प्रकार": "transactionType",
    "व्यवहार तारीख": "transactionDate",
    मेजर: "majorCode",
    "मेजर कोड नाव": "majorName",
    मायनर: "minorCode",
    "मायनर कोड नाव": "minorName",
    क्रेडिट: "creditAmount",
    डेबिट: "debitAmount",
    तपशील: "narration",
    पार्टी: "partyName",
  };

  const formatTableData = (data) => {
    return data.map((row, index) => ({
      transactionType: row.transactionType || "",
      transactionDate: row.transactionDate ? new Date(row.transactionDate).toLocaleDateString('en-IN') : "",
      majorCode: row.majorCode || "",
      majorName: row.majorName || "",
      minorCode: row.minorCode || "",
      minorName: row.minorName || "",
      creditAmount: parseFloat(row.creditAmount || 0).toLocaleString('en-IN'),
      debitAmount: parseFloat(row.debitAmount || 0).toLocaleString('en-IN'),
      narration: row.narration || "",
      partyName: row.partyName || "",
    }));
  };
  
  const handleTransactionSearch = async (transactionNo) => {
    setLoading(true);
    try {
        const response = await axios.get(`${BASE_URL}/api/Tranrevoke/gettransview?transno=${transactionNo}&ulbid=${ulbId}`, 
        {
        headers: { Authorization: `Bearer ${token}` }
        });

        console.log("response: ", response);

        if (response.data?.data?.rows && response.data.data.rows.length > 0) {
        const mappedData = response.data.data.rows.map(item => ({
            transactionType: item.TRNSTYPE || "",
            transactionDate: item.TRNSDATE,
            majorCode: item.GLCODE || "",
            majorName: item.GLNAME || "",
            minorCode: item.ACCNAME || "",
            minorName: item.ACCNAME || "",
            creditAmount: item.CREDIT || 0,
            debitAmount: item.DEBIT || 0,
            narration: item.NARRATION || "",
            partyName: item.PARTYNAME || "",
            id: item.TRANSNO,
            docNo: item.DOCNO,
            zoneName: item.ZONEENAME,
            grampanch: item.GRAMPANCH
        }));
        
        setTransactionData(mappedData);
        setCurrentDataType("transaction");
        const formattedData = formatTableData(mappedData);
        setTableData(formattedData);
        setShowTable(true);
        } else {
        setShowTable(false);
        setTableData([]);
        setTransactionData([]);
        await Swal.fire({
            text: "No Data Found",
            confirmButtonColor: '#1e3a8a'
        });
        }
    } catch (error) {
        console.error("Transaction Search Error:", error);
        Swal.fire({
        text: error.response?.data?.message || "Error fetching transaction",
        confirmButtonColor: "#1e3a8a",
        });
        setShowTable(false);
    } finally {
        setLoading(false);
    }
  };

  const handleVoucherSearch = async (transactionNo) => {
    setLoading(true);
    try {
        const response = await axios.get(`${BASE_URL}/api/Tranrevoke/getvchgentransview?transno=${transactionNo}&ulbid=${ulbId}`, 
        {
        headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data?.data?.rows && response.data.data.rows.length > 0) {
        const mappedData = response.data.data.rows.map(item => ({
            transactionType: item.TRNSTYPE || "",
            transactionDate: item.TRNSDATE,
            majorCode: item.GLCODE || "",
            majorName: item.GLNAME || "",
            minorCode: item.ACCNAME || "",
            minorName: item.ACCNAME || "",
            creditAmount: item.CREDIT || 0,
            debitAmount: item.DEBIT || 0,
            narration: item.NARRATION || "",
            partyName: item.PARTYNAME || "",
            id: item.TRANSNO,
            docNo: item.DOCNO,
            zoneName: item.ZONEENAME,
            grampanch: item.GRAMPANCH
        }));
        
        setVoucherData(mappedData);
        setCurrentDataType("voucher");
        const formattedData = formatTableData(mappedData);
        setTableData(formattedData);
        setShowTable(true);
        } else {
        setShowTable(false);
        setTableData([]);
        setVoucherData([]);
        await Swal.fire({
            text: "No Data Found",
            confirmButtonColor: '#1e3a8a'
        });
        }
    } catch (error) {
        console.error("Voucher Search Error:", error);
        Swal.fire({
        text: error.response?.data?.message || "Error fetching voucher",
        confirmButtonColor: "#1e3a8a",
        });
        setShowTable(false);
    } finally {
        setLoading(false);
    }
  };

  const handleSubmit = (values) => {
    if (!values.transactionNo) {
      Swal.fire({
        text: "कृपया व्यवहार क्रमांक प्रविष्ट करा",
        confirmButtonColor: "#1e3a8a",
      });
      return;
    }

    if (values.selectType === "transaction") {
      handleTransactionSearch(values.transactionNo);
    } else if (values.selectType === "voucher") {
      handleVoucherSearch(values.transactionNo);
    } else {
      Swal.fire({
        text: "Voucher Generation is currently disabled",
        confirmButtonColor: "#1e3a8a",
      });
    }
  };

  const handleDelete = async (formikValues) => {
    if (!formikValues.transactionNo) {
        Swal.fire({
        text: "No transaction number found",
        confirmButtonColor: "#1e3a8a",
        });
        return;
    }

    if (!revokeReason) {
        Swal.fire({
        text: "कृपया रद्द करण्याचे कारण निवडा",
        confirmButtonColor: "#1e3a8a",
        });
        return;
    }

    const result = await Swal.fire({
        title: "निश्चिती?",
        text: "हा व्यवहार हटवायचा आहे का?",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "होय, हटवा",
        cancelButtonText: "रद्द करा",
    });

    if (result.isConfirmed) {
        setLoading(true);
        try {
        let mode;
        if (currentDataType === "transaction") {
            mode = "1";
        } else if (currentDataType === "voucher") {
            mode = "4"; 
        }
        
        const response = await axios.post(
            `${BASE_URL}/api/Tranrevoke/deletetransaction`,
            {
            userid: userId,
            transno: formikValues.transactionNo,
            mode: mode,
            remarks: revokeReason,
            delrevflag: "D"
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log("delete response: ", response)

        if (response.data?.ok) {
            Swal.fire({
            text: response.data?.data?.errorMsg,
            confirmButtonColor: "#1e3a8a",
            });
            handleReset();
        } else {
            throw new Error(response.data?.message || "Delete failed");
        }
        } catch (error) {
        console.error("Delete Error:", error);
        Swal.fire({
            text: error.response?.data?.message || "व्यवहार हटवताना त्रुटी",
            confirmButtonColor: "#1e3a8a",
        });
        } finally {
        setLoading(false);
        }
    }
  };

  const handleRevoke = async (formikValues) => {
    if (!formikValues.transactionNo) {
        Swal.fire({
        text: "No transaction number found",
        confirmButtonColor: "#1e3a8a",
        });
        return;
    }

    if (!revokeReason) {
        Swal.fire({
        text: "कृपया रद्द करण्याचे कारण निवडा",
        confirmButtonColor: "#1e3a8a",
        });
        return;
    }

    const result = await Swal.fire({
        title: "निश्चिती?",
        text: "हा व्यवहार रद्द करायचा आहे का?",
        showCancelButton: true,
        confirmButtonColor: "#dc2626",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "होय, रद्द करा",
        cancelButtonText: "रद्द करा",
    });

    if (result.isConfirmed) {
        setLoading(true);
        try {
        let mode;
        if (currentDataType === "transaction") {
            mode = "2";
        } else if (currentDataType === "voucher") {
            mode = "3"; 
        }
        
        const response = await axios.post(
            `${BASE_URL}/api/Tranrevoke/deletetransaction`,
            {
            userid: userId,
            transno: formikValues.transactionNo,
            mode: mode,
            remarks: revokeReason,
            delrevflag: "R"
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data?.ok) {
            Swal.fire({
            text: response.data?.data?.errorMsg,
            confirmButtonColor: "#1e3a8a",
            });
            handleReset();
        } else {
            throw new Error(response.data?.message || "Revoke failed");
        }
        } catch (error) {
        console.error("Revoke Error:", error);
        Swal.fire({
            text: error.response?.data?.message || "व्यवहार रद्द करताना त्रुटी",
            confirmButtonColor: "#1e3a8a",
        });
        } finally {
        setLoading(false);
        }
    }
  };

  const handleReset = () => {
    setShowTable(false);
    setTableData([]);
    setTransactionData([]);
    setVoucherData([]);
    setRevokeReason("");
    setCurrentDataType("");
  };

  return (
    <Formik initialValues={getInitialValues()} onSubmit={handleSubmit}>
      {({ values, setFieldValue, resetForm }) => (
        <Form>
          <Card className="shadow-sm border rounded-lg">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">Transaction Revoke</CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label>Select Type</Label>
                    <span>:</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="radio"
                        id="transaction"
                        name="selectType"
                        value="transaction"
                        checked={values.selectType === "transaction"}
                        onChange={(e) => setFieldValue("selectType", e.target.value)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="transaction" className="font-medium cursor-pointer">
                        Transaction
                      </Label>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="radio"
                        id="voucher"
                        name="selectType"
                        value="voucher"
                        checked={values.selectType === "voucher"}
                        onChange={(e) => setFieldValue("selectType", e.target.value)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="voucher" className="font-medium cursor-pointer">
                        Voucher
                      </Label>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                  <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label>Transaction No</Label>
                    <span>:</span>
                  </div>
                  <Input
                    name="transactionNo"
                    value={values.transactionNo}
                    onChange={(e) => setFieldValue("transactionNo", e.target.value)}
                    type="text"
                    className="w-full h-9"
                  />
                </div>
              </div>

              <div className="flex justify-center gap-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-blue-900 hover:bg-blue-800"
                >
                  {loading ? "लोड करत आहे..." : "Search"}
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    resetForm();
                    handleReset();
                  }}
                  disabled={loading}
                >
                  Reset
                </Button>
              </div>

              {showTable && tableData.length > 0 && (
                <div className="border rounded-md overflow-x-auto mt-6">
                  <ShadCNTable
                    headers={headers}
                    data={tableData}
                    keyMapping={keyMapping}
                    className="min-w-[1200px]"
                  />

                  <div className="p-4 border-t space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                        <div className="sm:w-48 shrink-0 flex justify-start sm:justify-between items-center">
                            <Label className="font-semibold">Delete/Revoke reason</Label>
                            <span>:</span>
                        </div>
                        <div className="flex-1">
                            <Input
                                type="text"
                                id="revokeReason"
                                name="revokeReason"
                                value={revokeReason}
                                onChange={(e) => setRevokeReason(e.target.value)}
                                placeholder="Enter reason for delete/revoke"
                                className="w-[50%]"
                            />
                        </div>
                    </div>

                    <div className="flex justify-center gap-4 pt-4">
                      <Button
                        type="button"
                        onClick={() => handleDelete(values)}
                        disabled={loading}
                         className="bg-blue-900 hover:bg-blue-800"
                      >
                        Delete
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleRevoke(values)}
                        disabled={loading}
                        className="bg-blue-900 hover:bg-blue-800"
                      >
                        Revoke
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        path="/HomePage/FrmHomePage"
                      >
                        Exit
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </Form>
      )}
    </Formik>
  );
};

export default FrmTransactionUpdate;