import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShadCNTable from "@/components/ui/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmStateList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [stateList, setStateList] = useState([]);

  const headers = ["निवडा", "राज्याचे नाव"];

  const keyMapping = {
    निवडा: "select",
    "राज्याचे नाव": "name",
  };

  /* FETCH STATE LIST */
  const fetchStates = async () => {
    try {
      Swal.fire({
        title: "Loading States...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.get(
        `${BASE_URL}/api/CityList/statelist`,
        {
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      Swal.close();

      if (res.data?.ok && Array.isArray(res.data?.data?.list)) {
        setStateList(res.data.data.list);
      } else {
        setStateList([]);
      }
    } catch (error) {
      Swal.close();
      console.error("State list error:", error);

      setStateList([]);

      Swal.fire({
        // icon: "error",
        title: "Error loading states",
      });
    }
  };

  /* LOAD DATA WHEN TOKEN IS AVAILABLE */
  useEffect(() => {
    if (user?.token) {
      fetchStates();
    }
  }, [user?.token]);

  /* TABLE DATA */
  const tableData = stateList.map((row, index) => ({
    id: row.STATE_ID || index,
    select: (
      <Button
        type="button"
        variant="link"
        className="text-blue-700 px-0"
        onClick={() =>
          navigate("/Masters/FrmState", {
            state: {
              mode: 2, // Update mode
              data: row,
            },
          })
        }
      >
        निवडा
      </Button>
    ),
    name: row.STATE_NAME?.trim() || "-",
  }));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="max-w-7xl mx-auto mt-6"
    >
      <Card className="shadow-sm border rounded-lg">
        {/* Header */}
        <CardHeader className="border-b flex flex-row justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            राज्याची यादी
          </CardTitle>

          <Button
            type="button"
            onClick={() =>
              navigate("/Masters/FrmState", {
                state: {
                  mode: 1, // Insert mode
                },
              })
            }
          >
            नवीन जोडा
          </Button>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-6">
          {tableData.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <ShadCNTable
                headers={headers}
                data={tableData}
                keyMapping={keyMapping}
                pagination={true}
              />
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500 font-medium">
              Data not found 
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmStateList;