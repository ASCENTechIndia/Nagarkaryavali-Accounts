import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";

const BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

const FORM_ROUTE = "/Masters/EmployeeStatusUpdate";

const getRowsFromResponse = (response) => {
  const result = response?.data?.data;
  return Array.isArray(result?.data) ? result.data : [];
};

const formatDate = (value) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
};

const getStatusLabel = (value) => {
  const status = String(value ?? "")
    .trim()
    .toUpperCase();
  if (status === "Y" || status === "ACTIVE") return "Active";
  if (status === "N" || status === "INACTIVE") return "Inactive";
  return value || "-";
};

const FrmEmployeeUpdateList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;

  const [tableData, setTableData] = useState([]);
  const [searchText, setSearchText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchEmployeeUpdates = useCallback(async () => {
    if (!ulbId) {
      setTableData([]);
      setErrorMessage(
        "Organization ID is not available. Please sign in again.",
      );
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const response = await axios.get(
        `${BASE_URL}/api/employee-status/EmpStatusUpdateList`,
        {
          params: { ulbId },
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        },
      );
      const rows = getRowsFromResponse(response);
      console.log("Employee status API response:", response.data);
      setTableData(rows);
    } catch (error) {
      console.error("Error fetching employee status updates:", error);
      setTableData([]);
      setErrorMessage(
        error?.response?.data?.message ||
          "Failed to load employee update records. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }, [token, ulbId]);

  useEffect(() => {
    fetchEmployeeUpdates();
  }, [fetchEmployeeUpdates]);

  const filteredRows = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return tableData;

    return tableData.filter((row) => {
      const employeeId =
        row.EMPLOYEE_ID ?? row.NUM_EMPSTATUSUPD_EMPID ?? row.employeeId ?? "";
      const employeeName =
        row.EMPLOYEE_NAME ??
        row.VAR_EMPLOYEE_ENGNAME ??
        row.VAR_EMPLOYEE_MARNAME ??
        row.employeeName ??
        "";
      const status = getStatusLabel(row.VAR_EMPSTATUSUPD_STATUS ?? row.status);
      return [employeeId, employeeName, status].some((value) =>
        String(value).toLowerCase().includes(query),
      );
    });
  }, [tableData, searchText]);

  const handleSelectEmployee = (row) => {
    const employeeId =
      row.EMPLOYEE_ID ?? row.NUM_EMPSTATUSUPD_EMPID ?? row.employeeId ?? "";

    const statusUpdateId =
      row.NUM_EMPSTATUSUPD_ID ??
      row.NUM_EMPSTATUSUPD_STATUSID ??
      row.statusUpdateId ??
      row.empStatusUpdateId ??
      null;

    if (!employeeId) {
      setErrorMessage("Employee ID is missing from the selected record.");
      return;
    }

    if (statusUpdateId == null || statusUpdateId === "") {
      setErrorMessage("Status update record ID is missing.");
      return;
    }

    const selectedEmployee = {
      ...row,
      employeeId: String(employeeId),
      empId: String(employeeId),
      statusUpdateId,
      name:
        row.EMPLOYEE_NAME ??
        row.VAR_EMPLOYEE_ENGNAME ??
        row.VAR_EMPLOYEE_MARNAME ??
        row.employeeName ??
        "",
      ulbId: row.NUM_EMPSTATUSUPD_ULBID ?? row.ulbId ?? ulbId,
      status: String(
        row.VAR_EMPSTATUSUPD_STATUS ?? row.status ?? "",
      ).toUpperCase(),
      effectiveDate:
        row.DATE_EMPSTATUSUPD_STATUSDT ??
        row.statusDate ??
        row.effectiveDate ??
        null,
      reason: row.VAR_EMPSTATUSUPD_REASON ?? row.reason ?? "",
    };

    navigate(FORM_ROUTE, {
      state: {
        mode: 2,
        employee: selectedEmployee,
        statusUpdateId,
      },
    });
  };

  const headers = [
    "Employee ID",
    "Employee Name",
    "Employee Status",
    "Status Date",
    "निवडा",
  ];

  const keyMapping = {
    "Employee ID": "employeeId",
    "Employee Name": "employeeName",
    "Employee Status": "employeeStatus",
    "Status Date": "statusDate",
    निवडा: "select",
  };

  const displayRows = filteredRows.map((row) => ({
    employeeId:
      row.EMPLOYEE_ID ?? row.NUM_EMPSTATUSUPD_EMPID ?? row.employeeId ?? "-",
    employeeName:
      row.EMPLOYEE_NAME ??
      row.VAR_EMPLOYEE_ENGNAME ??
      row.VAR_EMPLOYEE_MARNAME ??
      row.employeeName ??
      "-",
    employeeStatus: getStatusLabel(row.VAR_EMPSTATUSUPD_STATUS ?? row.status),
    statusDate: formatDate(
      row.DATE_EMPSTATUSUPD_STATUSDT ?? row.statusDate ?? row.effectiveDate,
    ),
    select: (
      <Button
        type="button"
        size="sm"
        className="bg-blue-900 text-white hover:bg-blue-800"
        onClick={() => handleSelectEmployee(row)}
      >
        निवडा
      </Button>
    ),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <Card className="border shadow-sm">
        <CardHeader className="border-b">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg font-semibold">
              Employee Update List
            </CardTitle>

            <Button
              type="button"
              className="bg-blue-900 text-white hover:bg-blue-800 w-full sm:w-auto"
              onClick={() =>
                navigate(FORM_ROUTE, {
                  state: { mode: 1 },
                })
              }
            >
              नविन जोडा
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <Input
              type="search"
              value={searchText}
              onChange={(event) => setSearchText(event.target.value)}
              placeholder="Search by employee ID, name, or status..."
              className="h-9 w-full sm:max-w-md"
              aria-label="Search employee update records"
            />
            <span className="text-sm text-gray-600">
              Total Records: {tableData.length}
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-blue-900">
              Loading employee records...
            </div>
          ) : errorMessage ? (
            <div className="space-y-3 rounded-md border border-red-200 bg-red-50 p-4 text-center text-sm text-red-700">
              <p>{errorMessage}</p>
              <Button
                type="button"
                variant="outline"
                onClick={fetchEmployeeUpdates}
                disabled={loading}
              >
                Try Again
              </Button>
            </div>
          ) : displayRows.length > 0 ? (
            <div className="overflow-x-auto">
              <ShadCNTable
                headers={headers}
                data={displayRows}
                keyMapping={keyMapping}
                pagination={true}
                rowsPerPage={10}
              />
            </div>
          ) : (
            <div className="rounded-md border py-8 text-center text-gray-600">
              {tableData.length === 0
                ? "No employee update records found."
                : "No records match your search."}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmEmployeeUpdateList;
