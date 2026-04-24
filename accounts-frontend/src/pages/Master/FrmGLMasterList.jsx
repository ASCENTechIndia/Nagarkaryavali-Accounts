import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShadCNTable from "@/components/ui/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmGLMasterList = () => {
  const navigate = useNavigate();
  const {user} = useAuth();

  const [glList, setGlList] = useState([]);
  const [loading, setLoading] = useState(false);

  const headers = ["निवडा", "जी.एल. नाव"];

  const keyMapping = {
    निवडा: "select",
    "जी.एल. नाव": "name",
  };

  /* 🔥 FETCH API (like Transfer page pattern) */
const fetchGLList = async () => {
  try {
    setLoading(true);

    const headersConfig = {
      Authorization: `Bearer ${user?.token}`,
    };

    const res = await axios.get(
      `${BASE_URL}/api/master/glmaster/list`,
      { headers: headersConfig }
    );

    console.log("GL LIST API:", res.data);

    if (res.data?.ok && res.data?.data?.list) {
      setGlList(res.data.data.list);
    }
  } catch (err) {
    console.error("Error fetching GL list:", err);
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  if (!user?.token) return;   // ✅ wait for token
  fetchGLList();
}, [user?.token]);

  /* 🔥 MAP DATA TO TABLE */
  const tableData = glList.map((row) => ({
    select: (
      <Button
        variant="link"
        className="text-blue-700 px-0 h-auto"
        onClick={() =>
          navigate("/Masters/FrmGLMaster", {
            state: {
              mode: 2,
              data: row,
            },
          })
        }
      >
        निवडा
      </Button>
    ),
    name: row.GLNAME,
  }));

  if (loading) {
    return (
      <div className="flex justify-center mt-10 text-gray-600">
        Loading...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      
    >
      <Card className="shadow-sm border rounded-lg">
        {/* Header */}
        <CardHeader className="border-b flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            सामान्य खातेवही मास्टर यादी
          </CardTitle>

          <Button
            className="bg-blue-900 hover:bg-blue-800 text-white"
            onClick={() => navigate("/Masters/FrmGLMaster")}
          >
            नवीन जोडा
          </Button>
        </CardHeader>

        {/* Table */}
        <CardContent className="p-6">
          <div className="border rounded-md overflow-hidden bg-white">
            <ShadCNTable
              headers={headers}
              data={tableData}
              keyMapping={keyMapping}
              pagination={true} // optional
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmGLMasterList;