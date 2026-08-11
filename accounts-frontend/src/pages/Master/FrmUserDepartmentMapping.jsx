import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import config from "@/utils/config.jsx";
import Swal from "sweetalert2";
import ShadCNTable from "@/components/ui/table";

const initialValues = {
  zoneId: "",
  wardCode: "",
  userId: "",
  selectedDepartments: [],
};

const FrmUserDepartmentMapping = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const deptId = config.deptId;
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zoneList, setZoneList] = useState([]);
  const [userList, setUserList] = useState([]);
  const [departments, setDepartments] = useState([]);

  const fetchZones = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.ok) {
        setZoneList(res.data.data || []);
      }
    } catch (err) {
      console.error("Zone API Error:", err);
    }
  };

  const fetchUsers = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransactionEntryStatusRpt/username-list`,
        {
          ulbId: ulbId,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (res.data?.success) {
        setUserList(res.data.rows || []);
      }
    } catch (err) {
      console.error("User API Error:", err);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/Receipt/departments`,
        {
          ulbid: ulbId,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      const data = res.data.data || [];

      const formattedData = data.map((dept) => ({
        deptId: dept.DEPTID,
        deptName: dept.DEPTNAME,
        checked: false,
      }));

      setDepartments(formattedData);
    } catch (err) {
      console.error("Department API Error:", err);
    }
  };

  const fetchDepartmentConfig = async (userId, zoneId) => {
    try {
      if (!userId || !zoneId || zoneId === "-1") {
        return;
      }

      const res = await axios.post(
        `${BASE_URL}/api/FrmUserDepartmentMapping/deptconfigbyid`,
        {
          userId: userId,
          zoneId: Number(zoneId),
          ulbId: Number(ulbId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      console.log("Department Config Response:", res.data);

      if (res.data?.ok && res.data?.data?.success) {
        const rows = res.data?.data?.rows || [];

        const mappedDepartmentIds = rows.map((dept) => Number(dept.DEPTID));

        console.log("Mapped Department IDs:", mappedDepartmentIds);

        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            checked: mappedDepartmentIds.includes(Number(dept.deptId)),
          })),
        );

        return mappedDepartmentIds;
      }

      setDepartments((prev) =>
        prev.map((dept) => ({
          ...dept,
          checked: false,
        })),
      );

      return [];
    } catch (err) {
      console.error("Department Configuration API Error:", err);

      setDepartments((prev) =>
        prev.map((dept) => ({
          ...dept,
          checked: false,
        })),
      );

      return [];
    }
  };

  useEffect(() => {
    fetchZones();
    fetchUsers();
    fetchDepartments();
  }, [ulbId]);

  const departmentHeaders = ["Select", "Department Name"];

  const departmentKeyMapping = {
    Select: "checked",
    "Department Name": "deptName",
  };

  const departmentColumnStyles = {
    Select: {
      width: "100px",
    },
    "Department Name": {
      width: "auto",
    },
  };

  const handleSubmit = async (values, { resetForm }) => {
    try {
      if (!values.userId) {
        Swal.fire({
          title: "Validation",
          text: "Please select User",
        });
        return;
      }

      if (!values.zoneId || values.zoneId === "-1") {
        Swal.fire({
          title: "Validation",
          text: "Please select Zone",
        });
        return;
      }

      if (
        !values.selectedDepartments ||
        values.selectedDepartments.length === 0
      ) {
        Swal.fire({
          title: "Validation",
          text: "Please select at least one Department",
        });
        return;
      }

      const userZoneDeptStr = values.selectedDepartments.join("$");

      const payload = {
        userId: values.userId,
        ulbId: Number(ulbId),
        zoneId: Number(values.zoneId),
        userZoneDeptStr,
        mode: 1,
        loginUserId: user?.userId?.toString() || "",
        ipAddress: "192.168.1.10",
        source: "WEB",
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmUserDepartmentMapping/user-zone-dept-master`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      if (res.data?.ok) {
        Swal.fire({
          title: "Success",
          text: res.data?.data?.message,
        });

        resetForm();

        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            checked: false,
          })),
        );
      } else {
        Swal.fire({
          title: "Error",
          text:
            res.data?.data?.errorMsg ||
            res.data?.message ||
            "Failed to save configuration",
        });
      }
    } catch (error) {
      console.error("Submit Error:", error);

      Swal.fire({
        title: "Error",
        text:
          error.response?.data?.data?.errorMsg ||
          error.response?.data?.message ||
          error.message ||
          "Something went wrong",
      });
    }
  };

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, setFieldValue }) => {
        useEffect(() => {
          const loadDepartmentConfig = async () => {
            if (!values.userId || !values.zoneId || values.zoneId === "-1") {
              setFieldValue("selectedDepartments", []);

              setDepartments((prev) =>
                prev.map((dept) => ({
                  ...dept,
                  checked: false,
                })),
              );

              return;
            }

            const mappedDepartmentIds = await fetchDepartmentConfig(
              values.userId,
              values.zoneId,
            );

            setFieldValue("selectedDepartments", mappedDepartmentIds || []);
          };

          loadDepartmentConfig();
        }, [values.userId, values.zoneId]);

        const handleDepartmentCheck = (row, checked) => {
          const departmentId = row.deptId;

          setDepartments((prev) =>
            prev.map((dept) =>
              dept.deptId === departmentId
                ? {
                    ...dept,
                    checked,
                  }
                : dept,
            ),
          );

          const currentSelected = values.selectedDepartments || [];

          let updatedSelected;

          if (checked) {
            updatedSelected = currentSelected.includes(departmentId)
              ? currentSelected
              : [...currentSelected, departmentId];
          } else {
            updatedSelected = currentSelected.filter(
              (id) => id !== departmentId,
            );
          }

          setFieldValue("selectedDepartments", updatedSelected);
        };

        const handleSelectAllDepartments = (checked) => {
          setDepartments((prev) =>
            prev.map((dept) => ({
              ...dept,
              checked,
            })),
          );

          if (checked) {
            const allDepartmentIds = departments.map((dept) => dept.deptId);

            setFieldValue("selectedDepartments", allDepartmentIds);
          } else {
            setFieldValue("selectedDepartments", []);
          }
        };

        return (
          <Form>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="px-2 sm:px-4 mt-4 sm:mt-6"
            >
              <Card className="border shadow-sm">
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    User Department Mapping
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 sm:p-5 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="वापरकर्ता" />
                        <span>:</span>
                      </div>

                      <Select
                        value={values.userId}
                        onValueChange={(v) => setFieldValue("userId", v)}
                      >
                        <SelectTrigger className="w-full h-9">
                          <SelectValue placeholder="-- विकल्प निवडा --" />
                        </SelectTrigger>

                        <SelectContent>
                          {userList.length > 0 ? (
                            userList.map((user) => (
                              <SelectItem key={user.USERID} value={user.USERID}>
                                {user.USERNAME}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-data" disabled>
                              No Users Found
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                        <Label text="प्रभाग" />
                        <span>:</span>
                      </div>

                      <Select
                        value={values.zoneId}
                        onValueChange={(v) => setFieldValue("zoneId", v)}
                      >
                        <SelectTrigger className="w-full h-9 overflow-hidden">
                          <SelectValue placeholder="-- ALL --" />
                        </SelectTrigger>

                        <SelectContent>
                          <SelectItem value={"-1"}>-- ALL --</SelectItem>
                          {zoneList.map((zone) => (
                            <SelectItem
                              key={zone.ZONEID}
                              value={zone.ZONEID.toString()}
                            >
                              {zone.ZONEENAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="border rounded-md bg-white overflow-x-auto">
                    <ShadCNTable
                      headers={departmentHeaders}
                      data={departments}
                      keyMapping={departmentKeyMapping}
                      columnStyles={departmentColumnStyles}
                      pagination={false}
                      onSelectAllChange={handleSelectAllDepartments}
                      onRowCheckChange={handleDepartmentCheck}
                    />
                  </div>

                  <div className="flex justify-center flex-wrap gap-4 pt-4">
                    <Button
                      type="submit"
                      className="bg-blue-900 text-white px-6 h-9"
                    >
                      Submit
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      className="px-6 h-9"
                      onClick={() => navigate("/HomePage/FrmHomePage")}
                    >
                      Back
                    </Button>
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

export default FrmUserDepartmentMapping;
