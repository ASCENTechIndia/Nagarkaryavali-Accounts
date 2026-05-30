import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
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
import { Label } from "@/components/ui/label";;
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import apiService from "@/apiService";
import axios from "axios";
import Swal from "sweetalert2";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const FrmBudgetPrepration = () => {
  const { user } = useAuth()
  const token = user?.token;
  const ulbId = user?.ulbId;
  const userId = user?.userId;

  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedCorporation, setSelectedCorporation] = useState("");
  const [corporations, setCorporations] = useState([]);
  const [subTypes, setSubTypes] = useState([]);
  const [selectedSubType, setSelectedSubType] = useState("");
  const [subtypeLoading, setSubtypeLoading] = useState(false);
  const [preparationLoading, setPreparationLoading] = useState(false);
  const [tableData, setTableData] = useState([]);
  
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchCorporation = async () => {
    try {
        const res = await axios.get(`${BASE_URL}/api/FrmParty/corporation/list`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Corporation List: ", res);

        if (res?.data?.data?.success) {
            const formatted = res.data.data.list.map((s) => ({
                value: s.NUM_CORPORATION_ID.toString(),  
                label: s.VAR_CORPORATION_MNAME,
            }));
            setCorporations(formatted);

            const matched = formatted.find(
                (c) => c.value === ulbId?.toString()
            );

            if (matched) {
                setSelectedCorporation(matched.value);
            }
        }
    } catch (err) {
        console.error("Error fetching corporations:", err);
    }
  };
  
  const fetchAccountSubType = async () => {
    try {
      setSubtypeLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/BudgetPrepration/budgetsubtypelist`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      console.log("Account Subtype: ", res);

      if (res?.data?.data?.success) {
        const formatted = res.data.data.list.map((d) => ({
          value: d.NUM_ACCSUBTYPEMST_ACCSUBTYPEID.toString(),
          label: d.ACCSUBTYPE,
        }));
        setSubTypes(formatted);
      }
    } catch (err) {
      console.error("Error fetching sub types:", err);
    } finally {
      setSubtypeLoading(false);
    }
  };

  const fetchPreparationList = async (subTypeId) => {
    try {
        setPreparationLoading(true);

        const res = await axios.get(
        `${BASE_URL}/api/BudgetPrepration/budgetpre`,
        {
            headers: { Authorization: `Bearer ${token}` },
            params: { subTypeId },
        }
        );

        console.log("Preparation List: ", res);

        if (res?.data?.data?.success) {
        const preparationData = res.data.data.list.map((item, index) => ({
            id: index + 1,
            ...item,
        }));

        console.log("Preparation Data: ", preparationData);

        setTableData(preparationData);
        }
    } catch (err) {
        console.error("Preparation List API Error:", err);
    } finally {
        setPreparationLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSubType) {
      fetchPreparationList(selectedSubType);
    }
  }, [selectedSubType]);

  useEffect(() => {
    fetchCorporation();
    fetchAccountSubType();
  }, []);
  
  useEffect(() => {
    if (selectedCorporation) {
      setSelectedSubType("");
    }
  }, [selectedCorporation]);

  const handleBudgetChange = (id, value) => {
    setTableData((prev) =>
        prev.map((row) =>
        row.id === id ? { ...row, BUDGETAMT: value } : row
        )
    );
  };

  const handleRevBudgetChange = (id, value) => {
    setTableData((prev) =>
        prev.map((row) =>
        row.id === id ? { ...row, REVBUDGETAMT: value } : row
        )
    );
  };

  const handleSubmit = async () => {
    let loaderSwal;
    try {
        if (tableData.length === 0) {
            Swal.fire({
                text: 'No data to save',
                confirmButtonColor: '#1e3a8a'
            });
            return;
        }
        
        loaderSwal = Swal.fire({
            title: "Saving Data...",
            text: "Please wait while we save your budget",
            allowOutsideClick: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            },
        });

        const paramStr = tableData
        .map((row) =>
            [
            row.GLCODE,
            row.ACCNO,
            row.ACCSUBTYPEID,
            row.BUDGETAMT || 0,
            row.REVBUDGETAMT || 0,
            ].join("#")
        )
        .join("$");


        const payload = {
            userId: userId,
            ulbId: ulbId,
            paramStr,
        };

        const res = await axios.post(
        `${BASE_URL}/api/BudgetPrepration/budgetsave`,
        payload,
        {
            headers: { Authorization: `Bearer ${token}` },
        }
        );

        loaderSwal.close();

        if (res?.data?.data?.success) {
            Swal.fire({
                text: res.data.data.message || "Saved successfully",
                confirmButtonColor: '#1e3a8a'
            });

            setSelectedSubType("");
            setTableData([]);
        }
    } catch (err) {
        console.error("Save Error:", err);
        Swal.fire({
            text: "Error while saving data",
            confirmButtonColor: '#1e3a8a'
        });
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
    //   className="p-4 sm:p-6 min-h-screen bg-gray-100"
    >
      <Card className=" shadow-sm border">

        <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <CardTitle className="text-lg font-semibold">
                Budget Prepration
            </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <motion.div
            variants={item}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {/* <Label lassName='w-36 shrink-0' text="महानगरपालिका :" /> */}
                <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label text="महानगरपालिका" />
                    <span>:</span>
                </div>
                <Select
                    value={selectedCorporation}
                    onValueChange={(v) => setSelectedCorporation(v)}
                    disabled
                    >
                    <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="-- विकल्प निवडा --" />
                    </SelectTrigger>
                    <SelectContent>
                        {corporations.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {/* <Label lassName='w-36 shrink-0' text="Account SubType :" /> */}
                <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                    <Label text="Account SubType" className="sm:whitespace-nowrap" />
                    <span>:</span>
                </div>
              <Select
                value={selectedSubType}
                onValueChange={(v) => setSelectedSubType(v)}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="-- विकल्प निवडा --" />
                </SelectTrigger>
                <SelectContent>
                  {subTypes.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <div className="rounded-lg bg-white overflow-hidden">
            {preparationLoading && selectedSubType && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                माहिती लोड होत आहे...
              </div>
            )}

            {!preparationLoading && selectedSubType && tableData.length > 0 && (
                <>
                    <div className="border rounded-lg overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table className="w-full max-md:min-w-380 [&_thead_tr:hover]:bg-[#083c76]">
                            
                            <TableHeader>
                                <TableRow className="bg-blue-900">
                                <TableHead className="text-white text-center p-2">GL Code</TableHead>
                                <TableHead className="text-white text-center p-2">GL Name</TableHead>
                                <TableHead className="text-white text-center p-2">Acc No</TableHead>
                                <TableHead className="text-white text-center p-2">Acc Name</TableHead>
                                <TableHead className="text-white text-center p-2">Budget Amt</TableHead>
                                <TableHead className="text-white text-center p-2">Revised Budget Amt</TableHead>
                                </TableRow>
                            </TableHeader>

                            <TableBody>
                                {tableData.map((row) => (
                                <TableRow key={row.id} className="hover:bg-gray-50">
                                    <TableCell className="p-2 text-center">
                                    {row.GLCODE}
                                    </TableCell>
                                    <TableCell className="p-2">
                                    {row.GLNAME}
                                    </TableCell>
                                    <TableCell className="p-2 text-center">
                                    {row.OBJECTCODE}
                                    </TableCell>
                                    <TableCell className="p-2">
                                    {row.ACCNAME}
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <Input
                                            type="number"
                                            value={row.BUDGETAMT || 0}
                                            onChange={(e) =>
                                            handleBudgetChange(row.id, e.target.value)
                                            }
                                            className="w-full h-9 text-right"
                                        />
                                    </TableCell>
                                    <TableCell className="p-2">
                                        <Input
                                            type="number"
                                            value={row.REVBUDGETAMT || 0}
                                            onChange={(e) =>
                                            handleRevBudgetChange(row.id, e.target.value)
                                            }
                                            className="w-full h-9 text-right bg-blue-50"
                                        />
                                    </TableCell>
                                </TableRow>
                                ))}

                                {tableData.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-6 text-gray-500">
                                    कोणतीही माहिती उपलब्ध नाही
                                    </TableCell>
                                </TableRow>
                                )}
                            </TableBody>

                            </Table>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center flex-wrap gap-3 pt-4">
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            className="bg-blue-900 hover:bg-blue-800 text-white"
                        >
                            साठवा
                        </Button>
                        <Button type="button" variant="outline" path="/HomePage/FrmHomePage">
                            परत
                        </Button>
                    </div>
                </>
              
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmBudgetPrepration;