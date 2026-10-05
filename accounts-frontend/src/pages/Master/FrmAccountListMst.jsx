import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import SearchableSelect from "@/components/SearchableSelect";
import ShadCNTable from "@/components/ui/table";
import Swal from "sweetalert2";
import { Label } from "@/components/ui/label";
import * as XLSX from "xlsx";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmAccountList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [showTable, setShowTable] = useState(false);
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const [corporationList, setCorporationList] = useState([]);
  const [glList, setGlList] = useState([]);
  const [ledgerOptions, setLedgerOptions] = useState([]);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [excelData, setExcelData] = useState([]);

  const [filters, setFilters] = useState({
    ulbId: "",
    functionCode: "",
    objectCode: "",
  });

  const headers = [
    "निवडा",
    "GL Code",
    "Account No",
    "Old Account No",
    "Account Name",
    "Balance Sheet Group",
  ];

  const keyMapping = {
    निवडा: "select",
    "GL Code": "FUNCTIONCODE",
    "Account No": "OBJECTCODE",
    "Old Account No": "OLDACCNO",
    "Account Name": "name",
    "Balance Sheet Group": "SUBTYPE",
  };

  // ================= CORPORATION =================
  const getCorporations = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/FrmParty/corporation/list`, {
        headers: { Authorization: `Bearer ${user?.token}` },
      });

      const list = res.data?.data?.list || [];
      setCorporationList(list);

      if (user?.ulbId) {
        setFilters((prev) => ({
          ...prev,
          ulbId: user.ulbId.toString(),
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // ================= GL LIST =================
  const loadGLList = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/api/Receipt/searchGLALL`, {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      });

      setGlList(res.data?.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  // ================= LEDGERS =================
  const loadLedgers = async () => {
    try {

      setLedgerLoading(true);

      const res = await axios.post(
        `${BASE_URL}/api/FrmAccount/credit-leasure`,
        {
          corp_id: Number(user?.ulbId),
        },
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        },
      );

      setLedgerOptions(res.data?.data?.rows || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLedgerLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.token) return;
    getCorporations();
    loadGLList();
    loadLedgers();
  }, [user]);

  // ================= SEARCH =================
  const handleSearch = async () => {
    try {
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      setLoading(true);

      const payload = {
        ulbId: Number(filters.ulbId || user?.ulbId),
        ...(filters.functionCode && {
          functionCode: Number(filters.functionCode),
        }) || "",
        ...(filters.objectCode && {
          objectCode: Number(filters.objectCode),
        }) || "",
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmAccount/account-details`,
        payload,
        {
          headers: { Authorization: `Bearer ${user?.token}` },
        },
      );
      console.log("res",res)
      if (!res.data?.ok) {
        throw new Error(res.data?.error || res.data?.message || "Failed to fetch data");
      }

      const list = res.data?.data?.data || res.data?.data?.rows || [];

      setExcelData(list);

      const mapped = list.map((row) => ({
        select: (
          <Button
            variant="link"
            className="text-blue-700 px-0 h-auto"
            onClick={() =>
              navigate("/Masters/FrmAccountMst", {
                state: {
                  accNo: row.OBJECTCODE,
                  oldAccNo: row.OLDACCNO,
                  functionCode: row.FUNCTIONCODE,
                  ulbId: filters.ulbId,
                  balanceSheet: row.ACCSUBTYPE,
                },
              })
            }
          >
            निवडा
          </Button>
        ),
        FUNCTIONCODE: row.FUNCTIONCODE,
        OBJECTCODE: row.OBJECTCODE,
        SUBTYPE: row.ACCSUBTYPE ? row.ACCSUBTYPE.replace(/\t/g, "").split("-").map((p) => p.trim()).join(" - ") : "",
        name: row.VAR_ACCMASTER_ACCNAME,
      }));

      setTableData(mapped);
      setShowTable(true);
      Swal.close();
    } catch (err) {
      console.error("Search Error:", err);
      Swal.close();
      Swal.fire({
        text: err?.response?.data?.message ||  err?.response?.data?.error ||err?.message || "Failed To Fetch Branch List",
      });
    } finally {
      setLoading(false);
      
    }
  };

  useEffect(() => {
    if (user?.ulbId) {
      setFilters((prev) => ({
        ...prev,
        ulbId: String(user.ulbId),
      }));
    }
  }, [user]);

 const handleExportExcel = () => {
  if (!excelData.length) {
    Swal.fire({
      text: "No Data Found",
    });
    return;
  }

  const exportData = excelData.map((row, index) => ({
    "अ.क्र.": index + 1,
    "खाते कोड": row.OBJECTCODE || "",
    "खाते नाव": row.VAR_ACCMASTER_ACCNAME || "",
    "जुना खाते क्र": row.OLDACCNO || "",
    "बजेट तरतूद रक्कम": Number(row.BUDGETAMT || 0),
    "प्रारंभिक शिल्लक": Number(row.OPENINGBAL || 0),
    "सुधारित बजेट": Number(row.REVBUDGETAMT || 0),
  }));

  const worksheet = XLSX.utils.json_to_sheet(exportData);

  worksheet["!cols"] = [
    { wch: 8 }, 
    { wch: 18 }, 
    { wch: 35 }, 
    { wch: 18 }, 
    { wch: 22 }, 
    { wch: 22 }, 
    { wch: 20 }, 
  ];

  const lastRow = exportData.length + 1;

  for (let row = 2; row <= lastRow; row++) {
    if (worksheet[`E${row}`]) {
      worksheet[`E${row}`].z = "0.00";
    }

    if (worksheet[`F${row}`]) {
      worksheet[`F${row}`].z = "0.00";
    }

    if (worksheet[`G${row}`]) {
      worksheet[`G${row}`].z = "0.00";
    }
  }

  const headerStyle = {
    font: {
      bold: true,
      sz: 12,
    },
    alignment: {
      horizontal: "center",
      vertical: "center",
      wrapText: true,
    },
    fill: {
      fgColor: {
        rgb: "FFD966",
      },
    },
    border: {
      top: {
        style: "thin",
        color: { rgb: "000000" },
      },
      bottom: {
        style: "thin",
        color: { rgb: "000000" },
      },
      left: {
        style: "thin",
        color: { rgb: "000000" },
      },
      right: {
        style: "thin",
        color: { rgb: "000000" },
      },
    },
  };

  const headers = [
    "अ.क्र.",
    "खाते कोड",
    "खाते नाव",
    "जुना खाते क्र",
    "बजेट तरतूद रक्कम",
    "प्रारंभिक शिल्लक",
    "सुधारित बजेट",
  ];

  headers.forEach((header, index) => {
    const cellAddress = XLSX.utils.encode_cell({
      r: 0,
      c: index,
    });

    if (worksheet[cellAddress]) {
      worksheet[cellAddress].s = headerStyle;
    }
  });

  for (let row = 1; row <= exportData.length; row++) {
    for (let col = 0; col < headers.length; col++) {
      const cellAddress = XLSX.utils.encode_cell({
        r: row,
        c: col,
      });

      if (!worksheet[cellAddress]) continue;

      worksheet[cellAddress].s = {
        alignment: {
          vertical: "center",
          horizontal:
            col === 0 ||
            col === 1 ||
            col === 3 ||
            col >= 4
              ? "center"
              : "left",
          wrapText: true,
        },
        border: {
          top: {
            style: "thin",
            color: { rgb: "000000" },
          },
          bottom: {
            style: "thin",
            color: { rgb: "000000" },
          },
          left: {
            style: "thin",
            color: { rgb: "000000" },
          },
          right: {
            style: "thin",
            color: { rgb: "000000" },
          },
        },
      };
    }
  }

  worksheet["!rows"] = [
    {
      hpt: 35,
    },
    ...exportData.map(() => ({
      hpt: 28,
    })),
  ];


  worksheet["!freeze"] = {
    xSplit: 0,
    ySplit: 1,
  };

  worksheet["!autofilter"] = {
    ref: `A1:G${lastRow}`,
  };

  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "खाते मास्टर यादी"
  );

  XLSX.writeFile(
    workbook,
    "खाते_मास्टर_यादी.xlsx"
  );
};

const handleExportPDF = async () => {
  if (!excelData.length) {
    Swal.fire({
      text: "No Data Found",
    });
    return;
  }

  try {
    Swal.fire({
      title: "Generating PDF...",
      allowOutsideClick: false,
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const payload = {
      functionCode: filters.functionCode || "",
      ulbId: String(filters.ulbId || user?.ulbId || ""),
      objectCode: filters.objectCode || "",
    };

    console.log("PDF Payload:", payload);

    const res = await axios.post(
      `${BASE_URL}/api/FrmAccount/account-details-pdf`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${user?.token}`,
        },
      }
    );

    console.log("PDF Response:", res.data);

    if (!res.data?.success) {
      throw new Error(
        res.data?.message || "Failed to generate PDF"
      );
    }

    const pdfUrl = res.data?.pdfUrl;

    if (!pdfUrl) {
      throw new Error("PDF URL not received from server");
    }

    Swal.close();

    window.open(pdfUrl, "_blank");
  } catch (err) {
    console.error("PDF Export Error:", err);

    Swal.close();

    Swal.fire({
      text:
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to generate PDF",
    });
  }
};

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="shadow-sm border rounded-lg">
        <CardHeader className="border-b flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">खाते मास्टर यादी</CardTitle>

          <Button onClick={() => navigate("/Masters/FrmAccountMst")}>
            नवीन जोडा
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-8 min-h-[50vh]">
          {/* FORM GRID */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* CORPORATION */}
            <div className="space-y-2">

              <Label text="महानगरपालिका" />
              <Select
                value={filters.ulbId}
                onValueChange={(v) => setFilters({ ...filters, ulbId: v })}
                disabled
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="निवडा" />
                </SelectTrigger>

                <SelectContent>
                  {corporationList.map((c) => (
                    <SelectItem
                      key={c.NUM_CORPORATION_ID}
                      value={String(c.NUM_CORPORATION_ID)}
                    >
                      {c.VAR_CORPORATION_NAME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* GL */}
            <div className="space-y-2">

              <Label text="जी.एल. नांव" />
              <SearchableSelect
                className="w-full"
                options={glList.map((g) => ({
                  label: g.GLSEARCHNAME,
                  value: String(g.GLCODE),
                }))}
                value={filters.functionCode}
                onChange={(v) => {
                  const gl = v?.value || "";
                  setFilters((p) => ({
                    ...p,
                    functionCode: gl,
                    objectCode: "",
                  }));
                }}
              />
            </div>

            {/* LEDGER */}
            <div className="space-y-2">

              <Label text="खाते नांव" />
              <SearchableSelect
                className="w-full"
                options={ledgerOptions.map((l) => ({
                  label: l.ACCNAME,
                  value: String(l.OBJECTCODE),
                }))}
                value={filters.objectCode}
                onChange={(v) =>
                  setFilters((p) => ({
                    ...p,
                    objectCode: v?.value || "",
                  }))
                }
                isLoading={ledgerLoading}
              />
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex flex-col md:flex-row gap-3 justify-center pt-6 border-t">
            <Button
              size="lg"
              className="min-w-30"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? "Loading..." : "शोधा"}
            </Button>

            <Button
              size="lg"
              variant="destructive"
              className="min-w-30"
              onClick={() => {
                setFilters({
                  ulbId: user?.ulbId?.toString() || "",
                  functionCode: "",
                  objectCode: "",
                });
                setShowTable(false);
                setTableData([]);
              }}
              path="/HomePage/FrmHomePage"
            >
              परत
            </Button>
          </div>

          {/* TABLE */}
          {showTable && (
            <div className="space-y-2">
                  {tableData.length > 0 && (
                  <div className="flex justify-end gap-3">
                    <Button
                      onClick={handleExportExcel}
                      className="text-white"
                    >
                      Export to Excel
                    </Button>
                    <Button
                      onClick={handleExportPDF}
                      className="text-white"
                    >
                      Export to PDF
                    </Button>
                  </div>
                )}

            <div className="border rounded-lg overflow-hidden shadow-sm">
              {tableData.length === 0 ? (
                <div className="p-6 text-center text-muted-foreground">
                  No Data Found
                </div>
              ) : (
                <ShadCNTable
                  headers={headers}
                  data={tableData}
                  keyMapping={keyMapping}
                />
              )}
            </div>
          </div>)}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmAccountList;
