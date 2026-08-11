import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import config from "@/utils/config.jsx";
import Swal from "sweetalert2";
import ShadCNTable from "@/components/ui/table";
import SearchableSelect from "@/components/SearchableSelect";

const initialValues = {
  userId: "",
  selectedDepartments: [],
};

const FrmUserDepartmentMapping = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [userList, setUserList] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [mappingMode, setMappingMode] = useState(1); 

  const fetchUsers = async () => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/FrmTransactionEntryStatusRpt/username-list`,
        { ulbId: ulbId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
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
      Swal.fire({
        title: "Loading...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/Receipt/departments`,
        { ulbid: ulbId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = res.data?.data || [];

      const formattedData = data.map((dept) => ({
        deptId: dept.DEPTID,
        deptName: dept.DEPTNAME,
        checked: false,
      }));

      setDepartments(formattedData);
    } catch (err) {
      console.error("Department API Error:", err);
    } finally {
      Swal.close();
    }
  };

  const fetchDepartmentConfig = async (userId) => {
    try {
      if (!userId) {
        setMappingMode(1);
        return [];
      }

      Swal.fire({
        title: "Loading ...",
        text: "Fetching department configuration",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmUserDepartmentMapping/deptconfigbyid`,
        {
          userId: userId,
          ulbId: Number(ulbId),
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.ok && res.data?.data?.success) {
        const rows = res.data?.data?.rows || [];

        if (rows.length > 0) {
          setMappingMode(2);
        } else {
          setMappingMode(1);
        }

        const mappedDepartmentIds = rows.map((dept) => Number(dept.DEPTID));

        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            checked: mappedDepartmentIds.includes(Number(dept.deptId)),
          }))
        );

        Swal.close();
        return mappedDepartmentIds;
      }

      setMappingMode(1);
      setDepartments((prev) =>
        prev.map((dept) => ({
          ...dept,
          checked: false,
        }))
      );

      Swal.close();
      return [];
    } catch (err) {
      console.error("Department Configuration API Error:", err);
      setMappingMode(1);
      Swal.close();

      setDepartments((prev) =>
        prev.map((dept) => ({
          ...dept,
          checked: false,
        }))
      );

      return [];
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchUsers();
      fetchDepartments();
    }
  }, [ulbId]);

  const userOptions = userList.map((u) => ({
    value: String(u.USERID),
    label: `${u.USERNAME} (${u.USERID})`,
  }));

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
          text: "Please select User",
        });
        return;
      }

      if (
        !values.selectedDepartments ||
        values.selectedDepartments.length === 0
      ) {
        Swal.fire({
          text: "Please select at least one Department",
        });
        return;
      }

      const userDeptStr = values.selectedDepartments.join("$");

      const payload = {
        mode: mappingMode, 
        userId: values.userId,
        ulbId: Number(ulbId),
        userDeptStr: userDeptStr,
        loginUserId: user?.userId?.toString(),
        ipAddress: config.ip,
        source: config.source,
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmUserDepartmentMapping/user-dept-master`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (res.data?.ok && res.data?.data?.success) {
        Swal.fire({
          text:
            res.data?.data?.message ||
            res.data?.message ||
            "User Department Mapping Configuration saved successfully!",
        });

        resetForm();
        setMappingMode(1);

        setDepartments((prev) =>
          prev.map((dept) => ({
            ...dept,
            checked: false,
          }))
        );
      } else {
        Swal.fire({
          text:
            res.data?.data?.errorMsg ||
            res.data?.message ||
            "Failed to save configuration",
        });
      }
    } catch (error) {
      console.error("Submit Error:", error);

      Swal.fire({
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
            if (!values.userId) {
              setFieldValue("selectedDepartments", []);
              setMappingMode(1);
              setDepartments((prev) =>
                prev.map((dept) => ({
                  ...dept,
                  checked: false,
                }))
              );
              return;
            }

            const mappedDepartmentIds = await fetchDepartmentConfig(values.userId);
            setFieldValue("selectedDepartments", mappedDepartmentIds || []);
          };

          loadDepartmentConfig();
        }, [values.userId]);

        const handleDepartmentCheck = (row, checked) => {
          const departmentId = row.deptId;

          setDepartments((prev) =>
            prev.map((dept) =>
              dept.deptId === departmentId
                ? {
                    ...dept,
                    checked,
                  }
                : dept
            )
          );

          const currentSelected = values.selectedDepartments || [];
          let updatedSelected;

          if (checked) {
            updatedSelected = currentSelected.includes(departmentId)
              ? currentSelected
              : [...currentSelected, departmentId];
          } else {
            updatedSelected = currentSelected.filter((id) => id !== departmentId);
          }

          setFieldValue("selectedDepartments", updatedSelected);
        };

        const handleSelectAllDepartments = (checked) => {
          setDepartments((prev) =>
            prev.map((dept) => ({
              ...dept,
              checked,
            }))
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

                      <SearchableSelect
                        options={userOptions}
                        value={values.userId}
                        onChange={(selected) => {
                          setFieldValue("userId", selected ? selected.value : "");
                        }}
                        placeholder="-- वापरकर्ता निवडा / Search User --"
                        loading={userList.length === 0}
                        loadingMessage="Loading users..."
                      />
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