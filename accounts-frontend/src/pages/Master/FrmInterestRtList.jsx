import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShadCNTable from "@/components/ui/table";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmInterestRtList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [interestList, setInterestList] = useState([]);
  
  const headers = ["Sr. No", "From Date", "To Date", "Interest Rate (%)", "Select"];

  const keyMapping = {
    "Sr. No": "srNo",
    "From Date": "fromDate",
    "To Date": "toDate",
    "Interest Rate (%)": "interestRate",
    "Select": "select",
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchInterestRates = async () => {
    try {
      Swal.fire({
        title: "Loading Interest Rates...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading(),
      });

      const res = await axios.get(
        `${BASE_URL}/api/InterestMst/interestlist`,    
        {
          params: { ulbId: user?.ulbId },
          headers: {
            Authorization: `Bearer ${user?.token}`,
          },
        }
      );

      Swal.close();
      const rows = res.data?.data?.data ?? [];
      setInterestList(Array.isArray(rows) ? rows : []);
    } catch (err) {
      Swal.close();
      console.error("Interest list error:", err);
      Swal.fire("Error loading interest rates");
    }
  };

  useEffect(() => {
      fetchInterestRates();
  }, [user]);

  const tableData = interestList.map((row, index) => ({
    id: row.INTEREST_ID ?? index,
    srNo: index + 1,
    fromDate: formatDate(row.FROM_DATE),
    toDate: formatDate(row.TO_DATE),
    interestRate: row.INTEREST_RATE ?? "-",
    select: (
      <Button
        variant="link"
        className="text-blue-700 px-0"
        onClick={() =>
          navigate("/Masters/FrmInterestRtMst", {
            state: {
              mode: 2,
              data: {
                interestId: row.INTEREST_ID,
                fromDate: row.FROM_DATE,
                toDate: row.TO_DATE,
                interestRate: row.INTEREST_RATE,
              },
            },
          })
        }
      >
        Select
      </Button>
    ),
  }));

  const finalData =
    tableData.length > 0
      ? tableData
      : [
          {
            id: 0,
            srNo: "-",
            fromDate: "-",
            toDate: "-",
            interestRate: "-",
            select: "",
          },
        ];

  return (
    <>
       <Card className="shadow-sm border rounded-lg">
        <CardHeader className="border-b flex justify-between items-center">
           <CardTitle className="text-2xl font-semibold">Interest Rate List </CardTitle>
        </CardHeader>
          <CardTitle className="border-b text-sm text-gray-500 p-4 pl-7">
          <Button onClick={() => navigate("/Masters/FrmInterestRtMst")}>
            Add New
          </Button>
        </CardTitle>
        <CardContent className="p-6">
          <div className="border rounded-md overflow-hidden">
            <ShadCNTable
              headers={headers}
              data={finalData}
              keyMapping={keyMapping}
              pagination={tableData.length > 0}
            />
          </div>
        </CardContent>
      </Card>
    </>
  );
};

export default FrmInterestRtList;