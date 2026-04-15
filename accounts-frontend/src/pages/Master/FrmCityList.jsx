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

const container = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { staggerChildren: 0.08 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

const FrmCityList = () => {
  const { user } = useAuth()
  const token = user?.token;
  const ulbId = user?.ulbId;

  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [states, setStates] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [districtLoading, setDistrictLoading] = useState(false);
  const [cityLoading, setCityLoading] = useState(false);
  
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  const headers = [
    "निवडा",
    "शहराचे नांव",
    "जिल्हा आयडी"
  ];

  const keyMapping = {
    निवडा: "select",
    "शहराचे नांव": "cityName",
    "जिल्हा आयडी": "districtId",
  };

  const fetchStates = async () => {
    try {
        const res = await axios.get(`${BASE_URL}/api/CityList/statelist`, {
        headers: { Authorization: `Bearer ${token}` },
        });
        console.log("Res: ", res);

        if (res?.data?.data?.success) {
        const formatted = res.data.data.list.map((s) => ({
            value: s.STATE_ID.toString(),  
            label: s.STATE_NAME,
        }));
        setStates(formatted);
        }
    } catch (err) {
        console.error("Error fetching states:", err);
    }
  };
  
  const fetchDistrictsByState = async (stateId) => {
    try {
      setDistrictLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/CityList/districtbystate`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { stateId: Number(stateId) },
        }
      );

      if (res?.data?.data?.success) {
        const formatted = res.data.data.list.map((d) => ({
          value: d.DISTRICT_ID.toString(),
          label: d.DISTRICT_NAME,
        }));
        setDistricts(formatted);
      }
    } catch (err) {
      console.error("Error fetching districts:", err);
    } finally {
      setDistrictLoading(false);
    }
  };

  const fetchCityList = async (districtId) => {
    try {
      setCityLoading(true);

      const res = await axios.get(
        `${BASE_URL}/api/CityList/citybydistrict`,
        {
          headers: { Authorization: `Bearer ${token}` },
          params: { districtId: Number(districtId) },
        }
      );

      if (res?.data?.data?.success) {
        const city = res.data.data.list;
        setData(city);
        setFilteredData(city);
      }
    } catch (err) {
      console.error("City API Error:", err);
    } finally {
      setCityLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDistrict) {
      fetchCityList(selectedDistrict);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    fetchStates();
  }, []);

  useEffect(() => {
    let filtered = [...data];

    if (searchText) {
      const search = searchText.toLowerCase();

      filtered = filtered.filter(item =>
        item.CITYNAME?.toLowerCase().includes(search) ||
        item.DISTRICTID?.toString().includes(search)
      );
    }

    setFilteredData(filtered);
  }, [searchText, data]);
  
  const handleSelectVoucher = (row) => {
    navigate("/Masters/FrmCityMst", {
      state: {
        mode: 2,
        data: {
            cityId: row.CITYID,
            districtId: row.DISTRICTID
        },
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
    cityName: row.CITYNAME,
    districtId: row.DISTRICTID,
  }));

  useEffect(() => {
    if (selectedState) {
      setSelectedDistrict("");
      setData([]);
      setFilteredData([]);
      fetchDistrictsByState(selectedState);
    }
  }, [selectedState]);

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
                शहराची यादी
            </CardTitle>
            <Button
              className="bg-blue-900 hover:bg-blue-800 text-white w-full sm:w-auto"
              onClick={() => navigate("/Masters/FrmCityMst", { state: { mode: 1 } })}
              >
              नविन जोडा
            </Button>
        </CardHeader>

        <CardContent className="p-4 space-y-4">
          <motion.div
            variants={item}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="w-32 font-medium text-gray-700" text="राज्याचे नांव :" />
                <Select
                    value={selectedState}
                    onValueChange={(v) => setSelectedState(v)}
                    >
                    <SelectTrigger className="w-full">
                        <SelectValue placeholder="-- विकल्प निवडा --" />
                    </SelectTrigger>
                    <SelectContent>
                        {states.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
              <Label className="w-32 font-medium text-gray-700" text="जिल्हा नांव :" />
              <Select
                value={selectedDistrict}
                onValueChange={(v) => setSelectedDistrict(v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="-- विकल्प निवडा --" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </motion.div>

          <div className="rounded-lg bg-white overflow-hidden">
            {cityLoading && selectedDistrict && (
              <div className="py-10 text-center text-sm text-muted-foreground">
                माहिती लोड होत आहे...
              </div>
            )}
            {!cityLoading && selectedDistrict && filteredData.length > 0 && (
              <ShadCNTable
                headers={headers}
                data={tableRows}
                keyMapping={keyMapping}
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

export default FrmCityList;