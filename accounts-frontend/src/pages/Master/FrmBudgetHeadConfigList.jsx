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

const FrmBudgetHeadConfigList = () => {
  const { user } = useAuth();
  const token = user?.token;
  const ulbId = user?.ulbId;
  const navigate = useNavigate();

  const [selectedOption, setSelectedOption] = useState(""); // Head, SubHead, Group, Sub-Group
  const [headOptions, setHeadOptions] = useState([]);
  const [subHeadOptions, setSubHeadOptions] = useState([]);
  const [groupOptions, setGroupOptions] = useState([]);
  
  const [selectedHead, setSelectedHead] = useState("");
  const [selectedSubHead, setSelectedSubHead] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  
  const [tableData, setTableData] = useState([]);
  const [loading, setLoading] = useState(false);

  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const getTableHeaders = () => {
    if (selectedOption === "Head") {
      return ["Select", "Head Id", "Head Name", "Head Level", "Insert By", "Inserted Date"];
    } else if (selectedOption === "SubHead") {
      return ["Select", "Head Id", "Head Name", "Parent Name", "Head Level", "Insert By", "Inserted Date"];
    } else if (selectedOption === "Group") {
      return ["Select", "Head Id", "Head Name", "Parent Name", "Head Level", "Insert By", "Inserted Date"];
    } else if (selectedOption === "Sub-Group") {
      return ["Select", "Head Id", "Head Name", "Parent Name", "Head Level", "Insert By", "Inserted Date"];
    }
    return [];
  };

  const getKeyMapping = () => {
    if (selectedOption === "Head") {
      return {
        Select: "select",
        "Head Id": "headId",
        "Head Name": "headName",
        "Head Level": "headLevel",
        "Insert By": "insertBy",
        "Inserted Date": "insertedDate",
      };
    } else {
      return {
        Select: "select",
        "Head Id": "headId",
        "Head Name": "headName",
        "Parent Name": "parentName",
        "Head Level": "headLevel",
        "Insert By": "insertBy",
        "Inserted Date": "insertedDate",
      };
    }
  };

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

  const fetchTableData = async () => {
    setLoading(true);
    try {
      let payload = {};
      let response = null;

      switch (selectedOption) {
        case "Head":
          payload = { parentId: 0 };
          response = await axios.post(
            `${BASE_URL}/api/BudgetHeadConfig/BudgetByLevel`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;

        case "SubHead":
          if (!selectedHead) {
            Swal.fire({
              text: "Please select Head first",
            });
            setLoading(false);
            return;
          }
          payload = { parentId: Number(selectedHead), level: 2 };
          response = await axios.post(
            `${BASE_URL}/api/BudgetHeadConfig/BudgetByLevel`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;

        case "Group":
          if (!selectedSubHead) {
            Swal.fire({
              text: "Please select SubHead first",
            });
            setLoading(false);
            return;
          }
          payload = { parentId: Number(selectedSubHead), level: 3 };
          response = await axios.post(
            `${BASE_URL}/api/BudgetHeadConfig/BudgetByLevel`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;

        case "Sub-Group":
          if (!selectedGroup) {
            Swal.fire({
              text: "Please select Group first",
            });
            setLoading(false);
            return;
          }
          payload = { parentId: Number(selectedGroup), level: 4 };
          response = await axios.post(
            `${BASE_URL}/api/BudgetHeadConfig/BudgetByLevel`,
            payload,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          break;

        default:
          setLoading(false);
          return;
      }

      if (response?.data?.data?.data) {
        const mappedData = response.data.data.data.map((item) => ({
          select: (
            <Button
              variant="link"
              size="sm"
              className="text-blue-700 font-medium px-0 cursor-pointer hover:text-blue-900"
              onClick={() => handleSelectItem(item)}
            >
              निवडा
            </Button>
          ),
          headId: item.HEADID,
          headName: item.HEADNAME,
          parentName: item.PARENT || "-",
          headLevel: item.HEADLEVEL,
          insertBy: item.INSBY || "-",
          insertedDate: item.INSDATE ? new Date(item.INSDATE).toLocaleDateString("en-GB") : "-",
        }));
        setTableData(mappedData);
      } else {
        setTableData([]);
      }
    } catch (err) {
      console.error("Error fetching table data:", err);
      Swal.fire({
        text: "Failed to fetch data. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectItem = (item) => {
    console.log("Selected Item:", item);
    navigate("/Masters/FrmBudgetHeadConfig", {
      state: { mode: "2", headId: item.HEADID}
    });
  };

  const handleSearch = () => {
    if (!selectedOption) {
      Swal.fire({
        text: "Please select an option (Head, SubHead, Group, or Sub-Group)",
      });
      return;
    }
    fetchTableData();
  };

  const handleAddNew = () => {
    navigate("/Masters/FrmBudgetHeadConfig", { state: { mode: 1 } });
  };

  useEffect(() => {
    setSelectedHead("");
    setSelectedSubHead("");
    setSelectedGroup("");
    setTableData([]);
    
    if (selectedOption === "Head") {
      fetchHeads();
    } else if (selectedOption === "SubHead") {
      fetchHeads();
      fetchSubHeads();
    } else if (selectedOption === "Group") {
      fetchHeads();
      fetchSubHeads();
    } else if (selectedOption === "Sub-Group") {
      fetchHeads();
      fetchSubHeads();
    }
  }, [selectedOption]);

  useEffect(() => {
    if (selectedSubHead && (selectedOption === "Group" || selectedOption === "Sub-Group")) {
      fetchGroups(selectedSubHead);
      setSelectedGroup("");
    }
  }, [selectedSubHead, selectedOption]);

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <Card className="shadow-sm border">
        <CardHeader className="border-b flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <CardTitle className="text-lg font-semibold">
            Budget Head Master List
          </CardTitle>
          <Button
            className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto"
            onClick={handleAddNew}
          >
            Add New
          </Button>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-center gap-2">
              {/* <Label className='w-36 shrink-0' text="Select :" /> */}
              <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                <Label text="Select " />
                <span>:</span>
              </div>
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
                  id="subgroup"
                  name="budgetOption"
                  value="Sub-Group"
                  checked={selectedOption === "Sub-Group"}
                  onChange={(e) => setSelectedOption(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="subgroup" className="font-medium text-gray-700">Sub-Group</Label>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              {/* <Label className='w-36 shrink-0' text="Head: " /> */}
              <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                <Label text="Head " />
                <span>:</span>
              </div>
              <Select
                value={selectedHead}
                onValueChange={setSelectedHead}
                disabled={selectedOption === "Head"}
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
              {/* <Label className='w-36 shrink-0' text="SubHead: " /> */}
              <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                <Label text="SubHead " />
                <span>:</span>
              </div>
              <Select
                value={selectedSubHead}
                onValueChange={setSelectedSubHead}
                disabled={selectedOption === "Head" || selectedOption === "SubHead"}
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
              {/* <Label className='w-36 shrink-0' text="Group : " /> */}
              <div className="sm:w-36 shrink-0 flex justify-start sm:justify-between items-center">
                <Label text="Group " />
                <span>:</span>
              </div>
              <Select
                value={selectedGroup}
                onValueChange={setSelectedGroup}
                disabled={selectedOption === "Head" || selectedOption === "SubHead" || selectedOption === "Group"}
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

          <div className="flex justify-center gap-4 pt-2">
            <Button
              className="bg-blue-900 hover:bg-blue-800 text-white px-8"
              onClick={handleSearch}
            >
              Search
            </Button>
            <Button
              type="button"
              variant="outline"
              className="px-8"
              onClick={() => navigate(-1)}
            >
              Back
            </Button>
          </div>

          <div className="rounded-lg bg-white overflow-hidden">
            {loading && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                Loading data...
              </div>
            )}

            {!loading && tableData.length > 0 && (
              <ShadCNTable
                headers={getTableHeaders()}
                data={tableData}
                keyMapping={getKeyMapping()}
                pagination={true}
                rowsPerPage={5}
                className="max-md:min-w-380"
              />
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmBudgetHeadConfigList;