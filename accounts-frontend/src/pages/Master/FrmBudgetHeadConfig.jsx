import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
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
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import Swal from "sweetalert2";

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const initialValues = {
  headName: "",
  headCode: "",
  headLevel: "",
  parentName: "",
  subHeadName: "",
  subHeadCode: "",
  groupName: "",
  groupCode: "",
  subGroupName: "",
  subGroupCode: "",
};

const FrmBudgetHeadConfig = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, headId } = location.state || {};

  const [selectedOption, setSelectedOption] = useState(""); 
  const [headOptions, setHeadOptions] = useState([]);
  const [subHeadOptions, setSubHeadOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  
  const [selectedHead, setSelectedHead] = useState("");
  const [selectedSubHead, setSelectedSubHead] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [formValues, setFormValues] = useState(initialValues);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const fetchHeads = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/BudgetHeadConfig/head`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data?.data?.data) {
        setHeadOptions(res.data.data.data);
      }
    } catch (err) {
      console.error("Error fetching heads:", err);
    }
  };
  
  const fetchSubHeads = async () => {
    try {
      const res = await axios.get(
        `${BASE_URL}/api/BudgetHeadConfig/sub-head`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data?.data?.data) {
        setSubHeadOptions(res.data.data.data);
      }
    } catch (err) {
      console.error("Error fetching subheads:", err);
    }
  };

  const fetchGroups = async (subHeadId) => {
    try {
      const res = await axios.post(
        `${BASE_URL}/api/BudgetHeadConfig/group`,
        { parentId: Number(subHeadId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res?.data?.data?.data) {
        setGroupOptions(res.data.data.data);
      }
    } catch (err) {
      console.error("Error fetching groups:", err);
    }
  };

  const fetchBudgetConfigData = async () => {
    setInitialLoading(true);
    try {
      const res = await axios.post(
        `${BASE_URL}/api/BudgetHeadConfig/BudgetHeadConfig`,
        { headId: Number(headId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res?.data?.data?.data && res.data.data.data.length > 0) {
        const configData = res.data.data.data[0];

        console.log("configData: ", configData)
        
        const level = configData.HEADLEVEL;
        if (level === 1) {
          setSelectedOption("Head");
        } else if (level === 2) {
          setSelectedOption("SubHead");
        } else if (level === 3) {
          setSelectedOption("Group");
        } else if (level === 4) {
          setSelectedOption("Sub-Group");
        }

        if (level === 1) {
          setSelectedHead(configData.HEADID.toString());

          setFormValues((prev) => ({
            ...prev,
            headName: configData.HEADNAME || "",
            headCode: configData.HEADCODE || "",
            headLevel: configData.HEADLEVEL || "",
          }));

        } else if (level === 2) {
          setSelectedHead(configData.PARENTID?.toString() || "");
          setSelectedSubHead(configData.HEADID.toString());

          setFormValues((prev) => ({
            ...prev,
            subHeadName: configData.HEADNAME || "",
            subHeadCode: configData.HEADCODE || "",
          }));

        } else if (level === 3) {
          setSelectedHead(configData.PARENTHEADID?.toString() || "");
          setSelectedSubHead(configData.PARENTSUBHEADID?.toString() || "");
          setSelectedGroup(configData.HEADID.toString());

          setFormValues((prev) => ({
            ...prev,
            groupName: configData.HEADNAME || "",
            groupCode: configData.HEADCODE || "",
          }));

        } else if (level === 4) {
          setSelectedHead(configData.PARENTHEADID?.toString() || "");
          setSelectedSubHead(configData.PARENTSUBHEADID?.toString() || "");
          setSelectedGroup(configData.PARENTID?.toString() || "");

          setFormValues((prev) => ({
            ...prev,
            subGroupName: configData.HEADNAME || "",
            subGroupCode: configData.HEADCODE || "",
          }));
        }

        return configData;
      }
      return null;
    } catch (err) {
      console.error("Error fetching budget config data:", err);
      return null;
    } finally {
      setInitialLoading(false);
    }
  };


  useEffect(() => {
    const loadEditData = async () => {
      console.log("mode:", mode, "headId:", headId);

      if (Number(mode) === 2 && headId) {
        await fetchBudgetConfigData();
      }
    };

    fetchHeads();
    fetchSubHeads();
    loadEditData();
  }, [mode, headId]);

 useEffect(() => {
    if (selectedSubHead && (selectedOption === "Group" || selectedOption === "Sub-Group")) {
      fetchGroups(selectedSubHead);
      if (Number(mode) !== 2) {
        setSelectedGroup("");
      }
    }
  }, [selectedSubHead, selectedOption, mode]);

  useEffect(() => {
    if (Number(mode) === 2 && selectedSubHead && (selectedOption === "Group" || selectedOption === "Sub-Group")) {
      console.log("Edit mode - fetching groups for subhead:", selectedSubHead);
      fetchGroups(selectedSubHead);
    }
  }, [selectedSubHead, selectedOption, mode, initialLoading]);

  const handleSubmit = async (values, { setSubmitting }) => {
    if (!selectedOption) {
      Swal.fire({
        text: "Please select an option (Head, SubHead, Group, or Sub-Group)",
      });
      setSubmitting(false);
      return;
    }

    setLoading(true);
    try {
      let name = "";
      let headId = null;
      let subHeadId = null;
      let groupId = null;

      // Prepare the payload based on selected option
      switch (selectedOption) {
        case "Head":
          name = values.headName;
          if (!name) {
            Swal.fire({ text: "Please enter Head Name" });
            setLoading(false);
            setSubmitting(false);
            return;
          }
          break;
          
        case "SubHead":
          if (!selectedHead) {
            Swal.fire({ text: "Please select Head first" });
            setLoading(false);
            setSubmitting(false);
            return;
          }
          name = values.subHeadName;
          if (!name) {
            Swal.fire({ text: "Please enter SubHead Name" });
            setLoading(false);
            setSubmitting(false);
            return;
          }
          headId = Number(selectedHead);
          break;
          
        case "Group":
          if (!selectedSubHead) {
            Swal.fire({ text: "Please select SubHead first" });
            setLoading(false);
            setSubmitting(false);
            return;
          }
          name = values.groupName;
          if (!name) {
            Swal.fire({ text: "Please enter Group Name" });
            setLoading(false);
            setSubmitting(false);
            return;
          }
          subHeadId = Number(selectedSubHead);
          break;
          
        case "Sub-Group":
          if (!selectedGroup) {
            Swal.fire({ text: "Please select Group first" });
            setLoading(false);
            setSubmitting(false);
            return;
          }
          name = values.subGroupName;
          if (!name) {
            Swal.fire({ text: "Please enter Sub-Group Name" });
            setLoading(false);
            setSubmitting(false);
            return;
          }
          groupId = Number(selectedGroup);
          break;
          
        default:
          Swal.fire({ text: "Please select an option" });
          setLoading(false);
          setSubmitting(false);
          return;
      }

      // Prepare the final payload for the new API
      const payload = {
        mode: Number(mode) === 2 ? "2" : "1", // mode: 1 for insert, 2 for update
        userId: user?.userId || user?.username || "SYSTEM",
        name: name,
        headId: headId,
        subHeadId: subHeadId,
        groupId: groupId,
      };

      // Add budgetId only for update mode (mode=2)
      if (Number(mode) === 2 && headId) {
        payload.budgetId = Number(headId);
      }

      console.log("Submitting payload:", payload);

      const res = await axios.post(`${BASE_URL}/api/BudgetHeadConfig/SaveBudgetHead`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res?.data?.success || res?.data?.data?.success) {
        Swal.fire({
          text: Number(mode) === 2 ? "Data updated successfully" : "Data saved successfully",
          icon: "success"
        });
        navigate("/Masters/FrmBudgetHeadConfigList");
      } else {
        Swal.fire({
          text: res?.data?.data?.message || res?.data?.message || "Error saving data",
          icon: "error"
        });
      }
    } catch (err) {
      console.error("Error saving data:", err);
      Swal.fire({
        text: err?.response?.data?.data?.message || err?.response?.data?.message || "Error saving data",
        icon: "error"
      });
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading data...</p>
        </div>
      </div>
    );
  }

  return (
    <Formik 
      initialValues={formValues}
      enableReinitialize={true}
      onSubmit={handleSubmit}
    >
      {({ values, handleChange, setFieldValue, isSubmitting }) => (
        <Form>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border shadow-sm">
              <CardHeader className="border-b">
                <CardTitle className="text-lg font-semibold">
                  Budget Head Master
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 sm:p-6 space-y-6">
                <motion.div variants={item} className="flex flex-wrap items-center gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
                    <Label className='w-32' text="Select :" />
                    <div className="flex items-center gap-2">
                      <Input
                        type="radio"
                        id="head"
                        name="budgetOption"
                        value="Head"
                        checked={selectedOption === "Head"}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="head" className="font-medium text-gray-700">Head</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="radio"
                        id="subhead"
                        name="budgetOption"
                        value="SubHead"
                        checked={selectedOption === "SubHead"}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="subhead" className="font-medium text-gray-700">SubHead</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="radio"
                        id="group"
                        name="budgetOption"
                        value="Group"
                        checked={selectedOption === "Group"}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="group" className="font-medium text-gray-700">Group</Label>
                    </div>

                    <div className="flex items-center gap-2">
                      <Input
                        type="radio"
                        id="subGroup"
                        name="budgetOption"
                        value="Sub-Group"
                        checked={selectedOption === "Sub-Group"}
                        onChange={(e) => setSelectedOption(e.target.value)}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="subGroup" className="font-medium text-gray-700">Sub Group</Label>
                    </div>
                  </div>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className='w-32 font-medium text-gray-700'>Head :</Label>
                    <Select
                      value={selectedHead}
                      onValueChange={setSelectedHead}
                      disabled={selectedOption === "Head" || (Number(mode) === 2 && selectedOption !== "Head")}

                    >
                      <SelectTrigger className="w-full! h-9 overflow-hidden">
                        <SelectValue placeholder="-- Select Head --" />
                      </SelectTrigger>
                      <SelectContent>
                        {headOptions.map((option) => (
                          <SelectItem key={option.HEADID} value={option.HEADID.toString()}>
                            {option.BUDGETNAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className='w-32 font-medium text-gray-700'>SubHead :</Label>
                    <Select
                      value={selectedSubHead}
                      onValueChange={setSelectedSubHead}
                      disabled={selectedOption === "Head" || selectedOption === "SubHead" || (Number(mode) === 2 && selectedOption !== "SubHead")}
                    >
                      <SelectTrigger className="w-full! h-9 overflow-hidden">
                        <SelectValue placeholder="-- Select SubHead --" />
                      </SelectTrigger>
                      <SelectContent>
                        {subHeadOptions.map((option) => (
                          <SelectItem key={option.HEADID} value={option.HEADID.toString()}>
                            {option.BUDGETNAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className='w-32 font-medium text-gray-700'>Group :</Label>
                    <Select
                      value={selectedGroup}
                      onValueChange={setSelectedGroup}
                      disabled={selectedOption === "Head" || selectedOption === "SubHead" || selectedOption === "Group" || (Number(mode) === 2 && selectedOption !== "Group")}
                    >
                      <SelectTrigger className="w-full! h-9 overflow-hidden">
                        <SelectValue placeholder="-- Select Group --" />
                      </SelectTrigger>
                      <SelectContent>
                        {groupOptions.map((option) => (
                          <SelectItem key={option.HEADID} value={option.HEADID.toString()}>
                            {option.BUDGETNAME}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Label className='w-32 block whitespace-normal wrap-break-word' text="Head/SubHead/Group/SubGroup :" />
                    <Input
                      name={selectedOption === "Head" ? "headName" : 
                             selectedOption === "SubHead" ? "subHeadName" :
                             selectedOption === "Group" ? "groupName" : "subGroupName"}
                      value={selectedOption === "Head" ? values.headName : 
                             selectedOption === "SubHead" ? values.subHeadName :
                             selectedOption === "Group" ? values.groupName : values.subGroupName}
                      onChange={handleChange}
                      className="flex-1 h-9"
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
                  <Button 
                    type="submit" 
                    className="bg-blue-900 hover:bg-blue-800 text-white px-8"
                    disabled={loading || isSubmitting}
                  >
                    {loading ? "Saving..." : "Submit"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="px-8"
                    onClick={() => navigate("/Masters/FrmBudgetHeadConfigList")}
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

export default FrmBudgetHeadConfig;