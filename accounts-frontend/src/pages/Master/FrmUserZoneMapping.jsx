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
  selectedZones: [],
};

const FrmUserZoneMapping = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const [zones, setZones] = useState([]);
  const [userList, setUserList] = useState([]);
  const [mappingMode, setMappingMode] = useState(1); 

  const userOptions = userList.map((u) => ({
    label: `${u.USERNAME} (${u.USERID})`,
    value: u.USERID,
  }));

  const fetchZones = async () => {
    try {
      Swal.fire({
        title: "Loading ...",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/Receipt/zones`,
        { corp_id: ulbId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data?.ok) {
        const rawZones = res.data.data || [];
        const formattedZones = rawZones.map((z) => ({
          ...z,
          zoneId: z.ZONEID,
          zoneName: z.ZONEENAME,
          checked: false,
        }));
        setZones(formattedZones);
      }
    } catch (err) {
      console.error("Zone API Error:", err);
    } finally {
      Swal.close();
    }
  };

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

  const fetchZoneConfig = async (userId) => {
    try {
      if (!userId) {
        setMappingMode(1);
        return [];
      }

      Swal.fire({
        title: "Loading ...",
        text: "Fetching zone configuration",
        allowOutsideClick: false,
        allowEscapeKey: false,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await axios.post(
        `${BASE_URL}/api/FrmUserDepartmentMapping/zoneconfigbyid`,
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

        const mappedZoneIds = rows.map((z) => Number(z.ZONEID));

        setZones((prev) =>
          prev.map((zone) => ({
            ...zone,
            checked: mappedZoneIds.includes(Number(zone.zoneId)),
          }))
        );

        Swal.close();
        return mappedZoneIds;
      }

      setMappingMode(1);
      setZones((prev) =>
        prev.map((zone) => ({
          ...zone,
          checked: false,
        }))
      );

      Swal.close();
      return [];
    } catch (err) {
      console.error("Zone Configuration API Error:", err);
      setMappingMode(1);
      Swal.close();

      setZones((prev) =>
        prev.map((zone) => ({
          ...zone,
          checked: false,
        }))
      );

      return [];
    }
  };

  useEffect(() => {
    if (ulbId) {
      fetchZones();
      fetchUsers();
    }
  }, [ulbId]);

  const zoneHeaders = ["Select", "Zone Name"];

  const zoneKeyMapping = {
    Select: "checked",
    "Zone Name": "zoneName",
  };

  const zoneColumnStyles = {
    Select: {
      width: "100px",
    },
    "Zone Name": {
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

      if (!values.selectedZones || values.selectedZones.length === 0) {
        Swal.fire({
          text: "Please select at least one Zone",
        });
        return;
      }

      const userZoneStr = values.selectedZones.join("$");

      const payload = {
        mode: mappingMode, 
        userId: values.userId,
        ulbId: Number(ulbId),
        userZoneStr: userZoneStr,
        loginUserId: user?.userId?.toString() || user?.USERID?.toString() || "",
        ipAddress: config.ip,
        source: config.source,
      };

      const res = await axios.post(
        `${BASE_URL}/api/FrmUserDepartmentMapping/user-zone-master`,
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
          text: res.data?.data?.message || res.data?.message || "User Zone Mapping saved successfully!",
        });

        resetForm();
        setMappingMode(1);

        setZones((prev) =>
          prev.map((zone) => ({
            ...zone,
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
          const loadZoneConfig = async () => {
            if (!values.userId) {
              setFieldValue("selectedZones", []);
              setMappingMode(1);
              setZones((prev) =>
                prev.map((zone) => ({
                  ...zone,
                  checked: false,
                }))
              );
              return;
            }

            const mappedZoneIds = await fetchZoneConfig(values.userId);
            setFieldValue("selectedZones", mappedZoneIds || []);
          };

          loadZoneConfig();
        }, [values.userId]);

        const handleZoneCheck = (row, checked) => {
          const zoneId = row.zoneId;

          setZones((prev) =>
            prev.map((zone) =>
              zone.zoneId === zoneId
                ? {
                    ...zone,
                    checked,
                  }
                : zone
            )
          );

          const currentSelected = values.selectedZones || [];
          let updatedSelected;

          if (checked) {
            updatedSelected = currentSelected.includes(zoneId)
              ? currentSelected
              : [...currentSelected, zoneId];
          } else {
            updatedSelected = currentSelected.filter((id) => id !== zoneId);
          }

          setFieldValue("selectedZones", updatedSelected);
        };

        const handleSelectAllZones = (checked) => {
          setZones((prev) =>
            prev.map((zone) => ({
              ...zone,
              checked,
            }))
          );

          if (checked) {
            const allZoneIds = zones.map((zone) => zone.zoneId);
            setFieldValue("selectedZones", allZoneIds);
          } else {
            setFieldValue("selectedZones", []);
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
                    User Zone Mapping
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
                      headers={zoneHeaders}
                      data={zones}
                      keyMapping={zoneKeyMapping}
                      columnStyles={zoneColumnStyles}
                      pagination={false}
                      onSelectAllChange={handleSelectAllZones}
                      onRowCheckChange={handleZoneCheck}
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

export default FrmUserZoneMapping;