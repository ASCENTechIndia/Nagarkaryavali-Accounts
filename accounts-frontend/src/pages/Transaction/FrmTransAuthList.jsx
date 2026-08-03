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
import { Label } from "@/components/ui/label";
import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import apiService from "@/apiService";
import axios from "axios";
import { DatePicker } from "@/components/ui/calendar";
import config from "@/utils/config";
import Swal from "sweetalert2";

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const FrmTransAuthList = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const userId = user?.userId;

  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  
  const [selectedPrabhag, setSelectedPrabhag] = useState("-1");
  const [selectedTransType, setSelectedTransType] = useState("1");
  // const [selectedUser, setSelectedUser] = useState("-1");
  const [selectedUser, setSelectedUser] = useState(userId || "");
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date());
  
  const [zones, setZones] = useState([]);
  const [users, setUsers] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const transTypeOptions = [
    { value: "1", label: "Receipt" },
    { value: "2", label: "Payment" },
    { value: "5", label: "Transfer" },
    { value: "8", label: "Contra Entry" },
    { value: "9", label: "Bank Transaction" },
  ];

  const headers = [
    "निवडा",
    "रेसंदर्भ क्र.",
    "दिनांक",
    "वाउचर नं.",
    "व्यवहार प्रकार",
    "प्रभाग",
    "पार्टी नाम",
    "युजर",
    "दिनांक/ वेळ",
    "रक्कम",
  ];

  const keyMapping = {
    निवडा: "select",
    "रेसंदर्भ क्र.": "refno",
    दिनांक: "trnsdate",
    "वाउचर नं.": "docno",
    "व्यवहार प्रकार": "trnstype",
    प्रभाग: "zonename",
    "पार्टी नाम": "partyname",
    युजर: "username",
    "दिनांक/ वेळ": "datetime",
    रक्कम: "amount",
  };

  const fetchZones = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        {
          corp_id: ulbId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (res?.data) {
        setZones(res.data.data);
      }
    } catch (err) {
      console.error("Error fetching zones:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.post(
        `${BASE_URL}/api/FrmTransAuthList/user-list`,
        {
          ulbId: Number(ulbId),
          deptId: config.deptId
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("Response User: ", response);

      if (response?.data?.success) {
        // setUsers(response.data.rows || []);
        const userList = response.data.rows || [];
        setUsers(userList);
        const loggedInUser = userList.find(
            (u) => u.USERID === userId
        );

        if (loggedInUser) {
            setSelectedUser(loggedInUser.USERID);
        }
      }
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  const fetchTransactionList = async () => {
    try {
      if (!ulbId) return;
      if (!selectedTransType) {
        setData([]);
        setFilteredData([]);
        return;
      }

      setLoading(true);

      const requestBody = {
        fromDate: formatDate(fromDate),
        toDate: formatDate(toDate),
        zoneId: selectedPrabhag || "-1",
        ulbId: Number(ulbId),
        budgetId: null,
        userId: selectedUser === "-1" ? null : selectedUser,
        nidhiId: null,
        transType: selectedTransType,
      };

      const response = await axios.post(
        `${BASE_URL}/api/FrmTransAuthList/transaction-list`,
        requestBody,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response?.data) {
        const responseData = response.data;
        // Handle both response structures (with success flag or direct array)
        if (responseData.success && responseData.rows) {
          setData(responseData.rows || []);
          setFilteredData(responseData.rows || []);
        } else if (Array.isArray(responseData)) {
          setData(responseData);
          setFilteredData(responseData);
        } else if (responseData.data && Array.isArray(responseData.data)) {
          setData(responseData.data);
          setFilteredData(responseData.data);
        } else {
          setData([]);
          setFilteredData([]);
        }
      }
    } catch (error) {
      console.error("Error fetching transaction list", error);
      setData([]);
      setFilteredData([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  useEffect(() => {
    if (ulbId) {
      fetchZones();
      fetchUsers();
    }
  }, [user]);

  useEffect(() => {
    let filtered = [...data];

    if (searchText) {
      filtered = filtered.filter(
        (item) =>
          (item.REFNO?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
            item.DOCNO?.toString().toLowerCase().includes(searchText.toLowerCase()) ||
            item.PARTYNAME?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.ZONENAME?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.USERNAME?.toLowerCase().includes(searchText.toLowerCase()) ||
            item.TRNSTYPE?.toLowerCase().includes(searchText.toLowerCase()))
      );
    }

    setFilteredData(filtered);
  }, [searchText, data]);

  const handleSelectVoucher = (row) => {
    const selectedTransTypeObj = transTypeOptions.find(
      (item) => item.value === selectedTransType
    );

    navigate("/Transactions/FrmTransAuthMst", {
        state: {
        voucherData: {
            refno: row.REFNO,
            docno: row.DOCNO,
            zoneid: row.ZONEID,
            amount: row.AMOUNT,
            partyname: row.PARTYNAME,
            trnsdate: row.TRNSDATE,
            trnstypeid: row.TRNSTYPEID,
            trnstype: row.TRNSTYPE,
            username: row.USERNAME,
            datetime: row.DATETIME,
        },
        transvalue: selectedTransTypeObj?.value,
        },
    });
  };

  const tableRows = filteredData.map((row) => ({
    select: (
      <Button
        variant="link"
        size="sm"
        className="text-blue-700 font-medium px-0 cursor-pointer hover:text-blue-900"
        onClick={() => handleSelectVoucher(row)}
      >
        निवडा
      </Button>
    ),
    refno: row.REFNO,
    trnsdate: row.TRNSDATE ? new Date(row.TRNSDATE).toLocaleDateString("en-GB") : "-",
    docno: row.DOCNO || "-",
    trnstype: row.TRNSTYPE || "-",
    zonename: row.ZONENAME || "-",
    partyname: row.PARTYNAME || "-",
    username: row.USERNAME || "-",
    datetime: row.DATETIME ? new Date(row.DATETIME).toLocaleString() : "-",
    amount: row.AMOUNT?.toLocaleString("en-IN") || "0",
  }));

  const prabhagOptions = [
    { value: "-1", label: "-- सर्व प्रभाग --" },
    ...(zones.map((z) => ({
      value: z.ZONEID?.toString(),
      label: z.ZONEENAME,
    })) || []),
  ];

  const userOptions = [
    { value: "-1", label: "-- सर्व वापरकर्ता --" },
    ...(users?.map((u) => ({
      value: u.USERID?.toString(),
      label: u.USERNAME,
    })) || []),
  ];

  const totalAmount = filteredData.reduce(
    (sum, row) => sum + (Number(row.AMOUNT) || 0),
    0
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <Card className="shadow-sm border">
        <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <CardTitle className="text-lg font-semibold">
            व्यवहार अधिकृतता
          </CardTitle>
        </CardHeader>

        <CardContent className="p-4 space-y-4">

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="sm:w-32 shrink-0 flex justify-start sm:justify-between items-center">
                <Label text="प्रभाग" />
                <span>:</span>
              </div>
              <Select
                value={selectedPrabhag}
                onValueChange={(v) => setSelectedPrabhag(v)}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="-- विकल्प निवडा --" />
                </SelectTrigger>
                <SelectContent>
                  {prabhagOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="sm:w-32 shrink-0 flex justify-start sm:justify-between items-center">
                <Label text="व्यवहार प्रकार" />
                <span>:</span>
              </div>
              <Select
                value={selectedTransType}
                onValueChange={(v) => setSelectedTransType(v)}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="-- विकल्प निवडा --" />
                </SelectTrigger>
                <SelectContent>
                  {transTypeOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <div className="sm:w-32 shrink-0 flex justify-start sm:justify-between items-center">
                <Label text="वापरकर्ता" />
                <span>:</span>
              </div>
              <Select
                value={selectedUser}
                onValueChange={setSelectedUser}
                disabled
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue placeholder="-- विकल्प निवडा --" />
                </SelectTrigger>
                <SelectContent>
                  {userOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="sm:w-32 shrink-0 flex justify-start sm:justify-between items-center">
                <Label text="दिनांका पासुन" />
                <span>:</span>
              </div>
              <DatePicker
                value={fromDate}
                onChange={(d) => setFromDate(d)}
                className="w-full h-9"
              />
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <div className="sm:w-32 shrink-0 flex justify-start sm:justify-between items-center">
                <Label text="दिनांका पर्यंत" />
                <span>:</span>
              </div>
              <DatePicker
                value={toDate}
                onChange={(d) => setToDate(d)}
                className="w-full h-9"
              />
            </div>
          </div>

          <div className="flex items-center justify-center">
            <Button
                onClick={() => {
                    setHasSearched(true); 
                    fetchTransactionList()
                }}
                className="w-full sm:w-auto"
            >
                {loading ? "लोड करत आहे..." : "शोधा"}
            </Button>
          </div>

          <div className="border rounded-lg bg-white overflow-hidden">
            {loading && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                माहिती लोड होत आहे...
              </div>
            )}
            {!loading && hasSearched && filteredData.length === 0 && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                कोणतीही माहिती उपलब्ध नाही
              </div>
            )}
            {!loading && filteredData.length > 0 && (
                <>
                    <ShadCNTable
                        headers={headers}
                        data={tableRows}
                        keyMapping={keyMapping}
                        className="max-md:min-w-380"
                    />

                    <div className="flex justify-end items-center gap-3 p-3 border-t ">
                        {/* <Label className="font-semibold text-base">Total :</Label> */}
                        <div className="sm:w-32 shrink-0 flex justify-start sm:justify-between items-center">
                          <Label text="Total" />
                          <span>:</span>
                        </div>
                        <Input
                            value={totalAmount.toLocaleString("en-IN")}
                            readOnly
                            className="w-40 text-right h-9"
                        />
                    </div>
                </>
              
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmTransAuthList;