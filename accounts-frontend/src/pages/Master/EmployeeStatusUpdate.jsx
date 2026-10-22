import React, { useEffect, useMemo, useState } from "react";

import { Formik, Form } from "formik";

import { useLocation, useNavigate } from "react-router-dom";

import { motion } from "framer-motion";

import Swal from "sweetalert2";

import axios from "axios";

import { Search } from "lucide-react";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import { DatePicker } from "@/components/ui/calendar";

import { useAuth } from "@/context/AuthContext";

// Format the date without changing the selected calendar day.

const formatDateForPayload = (date) => {
  if (!date) return "";

  if (typeof date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }

  const parsed = date instanceof Date ? date : new Date(date);

  if (Number.isNaN(parsed.getTime())) return "";

  const year = parsed.getFullYear();

  const month = String(parsed.getMonth() + 1).padStart(2, "0");

  const day = String(parsed.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

// Normalize the employee search API response.

const unwrapEmployeeResponse = (input, currentUlbId) => {
  const root = input?.data ?? input;

  const payload = root?.data ?? root;

  const list = payload?.list ?? root?.list ?? [];

  let employee =
    payload?.employee ??
    payload?.employeeData ??
    payload?.data ??
    (Array.isArray(payload) ? payload[0] : payload);

  if (Array.isArray(list) && list.length) {
    employee =
      list.find(
        (row) =>
          String(row.NUM_EMPLOYEE_ULBID ?? row.ulbId) === String(currentUlbId),
      ) ??
      employee ??
      list[0];
  }

  if (!employee || typeof employee !== "object") return null;

  const employeeId =
    employee.employeeId ??
    employee.empId ??
    employee.NUM_EMPLOYEE_EMPID ??
    employee.id ??
    employee.EMPLOYEEID;

  const employeeUlbId =
    employee.ulbId ??
    employee.NUM_EMPLOYEE_ULBID ??
    employee.ULBID ??
    currentUlbId;

  const name =
    employee.name ??
    employee.employeeName ??
    employee.EMPLOYEENAME ??
    employee.VAR_EMPLOYEE_ENGNAME ??
    employee.VAR_EMPLOYEE_NAME ??
    "";

  if (
    employeeId == null &&
    !name &&
    !employee.designation &&
    !employee.DESIGNATION
  ) {
    return null;
  }

  return {
    ...employee,

    employeeId: employeeId != null ? String(employeeId) : "",

    ulbId: employeeUlbId ?? "",

    name,

    department:
      employee.department ??
      employee.DEPARTMENT ??
      employee.VAR_DEPARTMENT_NAME ??
      "",

    designation:
      employee.designation ??
      employee.DESIGNATION ??
      employee.VAR_DESIGNATION_NAME ??
      "",

    mobileNo:
      employee.mobileNo ??
      employee.NUM_EMPLOYEE_MOBILENO ??
      employee.mobile ??
      "",
  };
};

const unwrapApiResult = (response) => {
  let result = response?.data ?? response;

  for (let i = 0; i < 3; i += 1) {
    if (result && typeof result === "object" && result.data !== undefined) {
      result = result.data;
    } else {
      break;
    }
  }

  return result;
};

const EmployeeStatusUpdate = ({
  onSearchEmployee,
  onSubmit,
  initialEmployee: initialEmployeeProp = null,
  statusUpdateId = null,
  backPath,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const initialEmployee =
    initialEmployeeProp ?? location.state?.employee ?? null;

  const BASE_URL = (import.meta.env.VITE_BASE_URL || "").replace(/\/$/, "");

  const token = user?.token || localStorage.getItem("token") || "";

  const ulbId = user?.ulbId || localStorage.getItem("ulbId") || "";

  const [employeeNo, setEmployeeNo] = useState(
    initialEmployee?.employeeId ??
      initialEmployee?.empId ??
      initialEmployee?.NUM_EMPLOYEE_EMPID ??
      "",
  );

  const [employee, setEmployee] = useState(initialEmployee);

  const [searching, setSearching] = useState(false);

  const [employeeVerified, setEmployeeVerified] = useState(
    Boolean(initialEmployee),
  );

  const recordId =
    statusUpdateId ??
    location.state?.statusUpdateId ??
    initialEmployee?.statusUpdateId ??
    initialEmployee?.NUM_EMPSTATUSUPD_ID ??
    initialEmployee?.NUM_EMPSTATUSUPD_STATUSID ??
    initialEmployee?.empStatusUpdateId ??
    null;

  const isEditMode =
    location.state?.mode === 2 ||
    (recordId !== null && recordId !== undefined && recordId !== "");

  const mode = isEditMode ? 2 : 1;

  const initialValues = useMemo(
    () => ({
      employeeId: String(
        initialEmployee?.employeeId ??
          initialEmployee?.empId ??
          initialEmployee?.NUM_EMPLOYEE_EMPID ??
          "",
      ),

      status: ["Y", "ACTIVE"].includes(
        String(
          initialEmployee?.status ??
            initialEmployee?.VAR_EMPSTATUSUPD_STATUS ??
            "",
        ).toUpperCase(),
      )
        ? "Y"
        : ["N", "INACTIVE"].includes(
              String(
                initialEmployee?.status ??
                  initialEmployee?.VAR_EMPSTATUSUPD_STATUS ??
                  "",
              ).toUpperCase(),
            )
          ? "N"
          : "",
      effectiveDate:
        (initialEmployee?.effectiveDate ??
        initialEmployee?.statusDate ??
        initialEmployee?.DATE_EMPSTATUSUPD_STATUSDT)
          ? new Date(
              initialEmployee?.effectiveDate ??
                initialEmployee?.statusDate ??
                initialEmployee?.DATE_EMPSTATUSUPD_STATUSDT,
            )
          : null,

      reason:
        initialEmployee?.reason ??
        initialEmployee?.VAR_EMPSTATUSUPD_REASON ??
        "",
    }),

    [initialEmployee],
  );

  useEffect(() => {
    setEmployee(initialEmployee);

    setEmployeeVerified(Boolean(initialEmployee));

    setEmployeeNo(
      initialEmployee?.employeeId ??
        initialEmployee?.empId ??
        initialEmployee?.NUM_EMPLOYEE_EMPID ??
        "",
    );
  }, [initialEmployee]);

  const requestHeaders = () => {
    const headers = {
      "Content-Type": "application/json",
    };

    if (token && token !== "undefined" && token !== "null") {
      headers.Authorization = `Bearer ${token}`;
    }

    return headers;
  };

  // Search employee by employee number.

  const handleSearch = async (searchValue) => {
    const trimmedEmployeeNo = String(searchValue ?? "").trim();

    if (!trimmedEmployeeNo) {
      await Swal.fire({
        icon: "warning",

        title: "Required",

        text: "Please enter an Employee ID.",

        confirmButtonColor: "#1e3a8a",
      });

      return;
    }

    setSearching(true);

    setEmployeeVerified(false);

    setEmployee(null);

    Swal.fire({
      title: "Searching employee...",

      text: "Please wait",

      allowOutsideClick: false,

      didOpen: () => Swal.showLoading(),
    });

    try {
      const currentUlbId = ulbId;

      let result = null;

      if (onSearchEmployee) {
        const externalResult = await onSearchEmployee(trimmedEmployeeNo);

        result =
          externalResult?.employee ?? externalResult?.data ?? externalResult;
      } else {
        if (!BASE_URL) {
          throw new Error("VITE_BASE_URL is not configured.");
        }

        const response = await axios.post(
          `${BASE_URL}/api/FrmDCPSnoGenarationMst/getEmployeeByNo`,

          {
            employeeNo: trimmedEmployeeNo,

            employeeId: /^\d+$/.test(trimmedEmployeeNo)
              ? Number.parseInt(trimmedEmployeeNo, 10)
              : null,

            ulbId: currentUlbId,
          },

          {
            headers: requestHeaders(),
          },
        );

        console.log("Employee search API response:", response.data);

        const responseRoot = response?.data;

        const responsePayload = responseRoot?.data ?? responseRoot;

        const list = responsePayload?.list ?? responseRoot?.list ?? [];

        const preferredUlbRecord = Array.isArray(list)
          ? list.find(
              (row) =>
                String(row.NUM_EMPLOYEE_ULBID ?? row.ulbId) ===
                String(currentUlbId),
            )
          : null;

        result = preferredUlbRecord
          ? {
              ...(responsePayload?.data ?? {}),

              ...preferredUlbRecord,

              employeeId:
                preferredUlbRecord.NUM_EMPLOYEE_EMPID ??
                preferredUlbRecord.employeeId,

              ulbId:
                preferredUlbRecord.NUM_EMPLOYEE_ULBID ??
                preferredUlbRecord.ulbId,
            }
          : (responsePayload?.data ??
            responsePayload?.employee ??
            responsePayload?.employeeData ??
            (Array.isArray(responsePayload) ? responsePayload[0] : null));
      }

      const normalizedEmployee = unwrapEmployeeResponse(
        result,

        currentUlbId,
      );

      Swal.close();

      if (!normalizedEmployee) {
        setEmployeeVerified(false);

        setEmployee(null);

        await Swal.fire({
          icon: "warning",

          title: "Not found",

          text: `No employee found for ID "${trimmedEmployeeNo}".`,

          confirmButtonColor: "#1e3a8a",
        });

        return;
      }

      setEmployee(normalizedEmployee);

      setEmployeeVerified(true);

      setEmployeeNo(normalizedEmployee.employeeId || trimmedEmployeeNo);

      await Swal.fire({
        icon: "success",

        title: "Employee found",

        text: normalizedEmployee.name
          ? `Employee: ${normalizedEmployee.name}`
          : "Employee details loaded.",

        timer: 1400,

        showConfirmButton: false,
      });
    } catch (error) {
      Swal.close();

      console.error(
        "Employee search failed:",

        error?.response?.data ?? error,
      );

      setEmployee(null);

      setEmployeeVerified(false);

      await Swal.fire({
        icon: "error",

        title: "Search failed",

        text:
          error?.response?.data?.message ??
          error?.message ??
          "Unable to search for this employee.",

        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setSearching(false);
    }
  };

  // Insert or update employee status.

  const handleSubmit = async (
    values,

    { resetForm, setSubmitting },
  ) => {
    if (!employeeVerified || !employee) {
      await Swal.fire(
        "Required",

        "Please search and verify the employee first.",

        "warning",
      );

      return;
    }

    if (!values.status) {
      await Swal.fire(
        "Required",

        "Please select employee status.",

        "warning",
      );

      return;
    }

    const statusDate = formatDateForPayload(values.effectiveDate);

    if (!statusDate) {
      await Swal.fire(
        "Required",

        "Please select a valid date.",

        "warning",
      );

      return;
    }

    const reason = String(values.reason ?? "").trim();

    if (values.status === "N" && !reason) {
      await Swal.fire(
        "Required",

        "Please enter a reason when employee status is Inactive.",

        "warning",
      );

      return;
    }

    const userId =
      user?.userId ??
      user?.userName ??
      user?.username ??
      localStorage.getItem("username") ??
      "Admin";

    const currentUlbId = employee.ulbId || ulbId;

    const payload = {
      userId,

      ulbId: Number(currentUlbId),

      empId: Number(employee.employeeId),

      status: values.status, // Y = Active, N = Inactive

      statusDate,

      reason,

      mode, // 1 = Insert, 2 = Update
    };

    if (isEditMode) {
      payload.id = Number(recordId);
    }

    if (!Number.isFinite(payload.empId) || payload.empId <= 0) {
      await Swal.fire(
        "Invalid employee",

        "The searched employee ID is invalid.",

        "error",
      );

      return;
    }

    if (!Number.isFinite(payload.ulbId) || payload.ulbId <= 0) {
      await Swal.fire(
        "Missing ULB",

        "Organization/ULB ID is not available.",

        "error",
      );

      return;
    }

    if (isEditMode && (!Number.isFinite(payload.id) || payload.id <= 0)) {
      await Swal.fire(
        "Invalid record",

        "The employee status record ID is invalid.",

        "error",
      );

      return;
    }

    if (!BASE_URL && !onSubmit) {
      await Swal.fire(
        "Configuration error",

        "VITE_BASE_URL is not configured.",

        "error",
      );

      return;
    }

    setSubmitting(true);

    Swal.fire({
      title: isEditMode
        ? "Updating employee status..."
        : "Saving employee status...",

      text: "Please wait",

      allowOutsideClick: false,

      didOpen: () => Swal.showLoading(),
    });

    try {
      let response;

      if (onSubmit) {
        response = await onSubmit({
          ...payload,

          employee,

          employeeId: payload.empId,

          effectiveDate: payload.statusDate,

          operation: isEditMode ? "update" : "insert",
        });
      } else {
        response = await axios.post(
          `${BASE_URL}/api/employee-status/SaveEmpStatusUpdate`,

          payload,

          {
            headers: requestHeaders(),
          },
        );
      }

      console.log("Employee Status Update Payload:", payload);

      console.log(
        "Employee Status Update Response:",

        response?.data ?? response,
      );

      const result = unwrapApiResult(response);

      Swal.close();

      // The database procedure is expected to return -100 on success.

      const errorCode = Number(result?.errorCode ?? result?.out_ErrorCode);

      const success =
        result?.success === true || result?.ok === true || errorCode === -100;

      if (!success) {
        await Swal.fire({
          icon: "error",

          title: "Failed",

          text:
            result?.message ??
            result?.out_ErrorMsg ??
            "Employee status could not be saved.",

          confirmButtonColor: "#1e3a8a",
        });

        return;
      }

      await Swal.fire({
        icon: "success",

        title: isEditMode ? "Updated successfully" : "Saved successfully",

        text:
          result?.message ??
          result?.out_ErrorMsg ??
          (isEditMode
            ? "Employee status updated successfully."
            : "Employee status saved successfully."),

        confirmButtonColor: "#1e3a8a",
      });

      resetForm();

      setEmployeeNo("");

      setEmployee(null);

      setEmployeeVerified(false);
    } catch (error) {
      Swal.close();

      console.error(
        "Employee Status Update API Error:",

        error?.response?.data ?? error,
      );

      await Swal.fire({
        icon: "error",

        title: "Request failed",

        text:
          error?.response?.data?.message ??
          error?.message ??
          "Unable to save employee status.",

        confirmButtonColor: "#1e3a8a",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = (resetForm) => {
    resetForm();

    setEmployeeNo("");

    setEmployee(null);

    setEmployeeVerified(false);
  };

  return (
    <Formik
      enableReinitialize
      initialValues={initialValues}
      onSubmit={handleSubmit}
    >
      {({
        values,

        handleChange,

        setFieldValue,

        resetForm,

        isSubmitting,
      }) => (
        <Form>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="px-2 mt-4 sm:px-4 sm:mt-6"
          >
            <Card>
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  Employee Status Update
                </CardTitle>
              </CardHeader>

              <CardContent className="w-full space-y-6 p-4 sm:p-6">
                <div className="w-full space-y-6 rounded-lg border p-4 sm:p-6 md:p-8">
                  {/* Employee search */}

                  <div className="grid w-full grid-cols-1 items-start gap-2 sm:grid-cols-12 sm:items-center sm:gap-x-4">
                    <div className="flex w-full items-center sm:col-span-2 sm:justify-end">
                      <Label htmlFor="employeeId" className="w-full sm:w-auto">
                        Employee ID <span className="text-red-600">*</span>
                      </Label>
                    </div>

                    <div className="flex w-full min-w-0 flex-col gap-4 sm:col-span-4 sm:flex-row sm:items-center">
                      <Input
                        id="employeeId"
                        name="employeeId"
                        value={employeeNo}
                        onChange={(event) => {
                          setEmployeeNo(event.target.value);

                          setFieldValue(
                            "employeeId",

                            event.target.value,
                          );

                          setEmployeeVerified(false);

                          setEmployee(null);
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();

                            handleSearch(employeeNo);
                          }
                        }}
                        placeholder="Enter Employee ID"
                        autoComplete="off"
                        className="h-10 w-full min-w-0 flex-1"
                      />

                      <Button
                        type="button"
                        onClick={() => handleSearch(employeeNo)}
                        disabled={searching}
                        className="h-10 w-full shrink-0 bg-blue-900 text-white hover:bg-blue-800 sm:w-32"
                      >
                        <Search className="mr-2 h-4 w-4" />

                        {searching ? "Searching..." : "Search"}
                      </Button>
                    </div>
                  </div>

                  {/* Status fields appear after successful employee search */}

                  {employeeVerified && employee && (
                    <div className="space-y-5 border-t pt-5">
                      <div className="grid w-full grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {/* Employee Status */}

                        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="flex w-full shrink-0 items-center justify-between sm:w-40">
                            <Label text="Employee Status" required />

                            <span>:</span>
                          </div>

                          <Select
                            value={values.status}
                            onValueChange={(value) =>
                              setFieldValue("status", value)
                            }
                          >
                            <SelectTrigger id="status" className="h-9 w-full">
                              <SelectValue placeholder="Select Employee Status" />
                            </SelectTrigger>

                            <SelectContent>
                              <SelectItem value="Y">Active</SelectItem>

                              <SelectItem value="N">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {/* Effective Date */}

                        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="flex w-full shrink-0 items-center justify-between sm:w-40">
                            <Label text="Effective Date" required />

                            <span>:</span>
                          </div>

                          <DatePicker
                            value={values.effectiveDate}
                            onChange={(date) =>
                              setFieldValue(
                                "effectiveDate",

                                date || null,
                              )
                            }
                            className="w-full"
                          />
                        </div>

                        {/* Reason */}

                        <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-center">
                          <div className="flex w-full shrink-0 items-center justify-between sm:w-40">
                            <Label
                              text="Reason"
                              required={values.status === "N"}
                            />

                            <span>:</span>
                          </div>

                          <Textarea
                            id="reason"
                            name="reason"
                            value={values.reason}
                            onChange={handleChange}
                            placeholder="Enter reason"
                            rows={1}
                            className="min-h-9 w-full resize-y"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action buttons */}

                <div className="flex w-full flex-col justify-center gap-3 pt-5 sm:flex-row sm:gap-4">
                  {employeeVerified && employee && (
                    <Button
                      type="submit"
                      disabled={isSubmitting || searching}
                      className="w-full bg-blue-900 text-white hover:bg-blue-800 sm:w-auto sm:min-w-32"
                    >
                      {isSubmitting
                        ? isEditMode
                          ? "Updating..."
                          : "Submitting..."
                        : isEditMode
                          ? "Update"
                          : "Submit"}
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleReset(resetForm)}
                    className="w-full sm:w-auto sm:min-w-28"
                  >
                    Reset
                  </Button>

                  <Button
                    type="button"
                    variant="destructive"
                    onClick={() =>
                      backPath ? navigate(backPath) : navigate(-1)
                    }
                    className="w-full sm:w-auto sm:min-w-28"
                  >
                    Back
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </Form>
      )}
    </Formik>
  );
};

export default EmployeeStatusUpdate;
