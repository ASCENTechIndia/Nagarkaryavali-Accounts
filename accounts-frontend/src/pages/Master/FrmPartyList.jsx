// import { useNavigate } from "react-router-dom";
// import { motion } from "framer-motion";
// import { useEffect, useState } from "react";
// import axios from "axios";
// import { useAuth } from "@/context/AuthContext";

// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import ShadCNTable from "@/components/ui/table";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Input } from "@/components/ui/input";

// const BASE_URL = import.meta.env.VITE_BASE_URL;

// /* ✅ Row Component */
// const Row = ({ label, children }) => (
//   <div className="grid grid-cols-[140px_300px] items-center gap-3 mb-3">
//     <label className="font-medium text-sm">{label} :</label>
//     {children}
//   </div>
// );

// const FrmPartyList = () => {
//   const navigate = useNavigate();
//   const { user } = useAuth();

//   const ulbId = user?.ulbId;

//   const [corporationList, setCorporationList] = useState([]);
//   const [selectedCorp, setSelectedCorp] = useState("");
//   const [partyList, setPartyList] = useState([]);
//   const [search, setSearch] = useState("");
//   const [loading, setLoading] = useState(false);

//   const api = axios.create({ baseURL: BASE_URL });

//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("token");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });

//   /* 🔥 Load Corporations */
//   const loadCorporations = async () => {
//     try {
//       const res = await api.get("/api/FrmParty/corporation/list");
//       const corpList = res.data?.data?.list || [];

//       setCorporationList(corpList);

//       if (ulbId) {
//         const exists = corpList.find((c) => c.NUM_CORPORATION_ID === ulbId);

//         if (exists) {
//           const selected = ulbId.toString();
//           setSelectedCorp(selected);
//           loadParties(selected);
//         }
//       }
//     } catch (err) {
//       console.error("Error loading corporations", err);
//     }
//   };

//   /* 🔥 Load Parties */
//   const loadParties = async (corpId) => {
//     try {
//       setLoading(true);

//       const res = await api.get(`/api/FrmParty/party/search?corpId=${corpId}`);

//       if (res.data?.ok && res.data?.data?.list) {
//         setPartyList(res.data.data.list);
//       }
//     } catch (err) {
//       console.error("Error loading parties", err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (ulbId) loadCorporations();
//   }, [ulbId]);

//   /* 🔥 Search Filter */
//   const filteredList = partyList.filter((row) => {
//     const value = search.toLowerCase();

//     return (
//       row.PARTYNAME?.toLowerCase().includes(value) ||
//       row.NUM_PARTYMST_MOBNO?.toString().includes(value) ||
//       row.VAR_PARTYMST_CITY?.toLowerCase().includes(value) ||
//       row.VAR_PARTYMST_PANCARD?.toLowerCase().includes(value) ||
//       row.VAR_PARTYMST_GSTNO?.toLowerCase().includes(value)
//     );
//   });

//   /* 🔥 Table Mapping */
//   const tableData = filteredList.map((row) => ({
//     select: (
//       <Button
//         variant="link"
//         className="text-blue-700 px-0 h-auto"
//         onClick={() =>
//           navigate("/Masters/FrmPartyMaster", {
//             state: {
//               mode: 2,
//               data: row,
//             },
//           })
//         }
//       >
//         निवडा
//       </Button>
//     ),
//     name: row.PARTYNAME,
//     mobile: row.NUM_PARTYMST_MOBNO,
//     city: row.VAR_PARTYMST_CITY,
//     pan: row.VAR_PARTYMST_PANCARD,
//     gst: row.VAR_PARTYMST_GSTNO || "-",
//   }));

//   if (loading) {
//     return (
//       <div className="flex justify-center mt-10 text-gray-600">Loading...</div>
//     );
//   }

//   return (
//     <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
//       <Card className="shadow-sm border rounded-lg">
//         {/* Header */}
//         <CardHeader className="border-b flex justify-between items-center">
//           <CardTitle className="text-lg font-semibold">
//             पार्टी मास्टर यादी
//           </CardTitle>

//           <Button
//             className="bg-blue-900 hover:bg-blue-800 text-white"
//             onClick={() => navigate("/Masters/FrmPartyMaster")}
//           >
//             नवीन जोडा
//           </Button>
//         </CardHeader>

//         {/* Content */}
//         <CardContent className="p-2">
//           {/* Filter Box */}
//           <div className="border rounded-md p-4 ">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               {/* Corporation */}
//               <div className="grid grid-cols-[140px_1fr] items-center gap-3">
//                 <label className="font-medium text-sm">नगरपालिका :</label>

//                 <Select
//                   value={selectedCorp}
//                   onValueChange={(value) => {
//                     setSelectedCorp(value);
//                     loadParties(value);
//                   }}
//                   disabled={!!ulbId}
//                 >
//                   <SelectTrigger className="w-full">
//                     <SelectValue placeholder="Select" />
//                   </SelectTrigger>

//                   <SelectContent>
//                     {corporationList.map((c) => (
//                       <SelectItem
//                         key={c.NUM_CORPORATION_ID}
//                         value={c.NUM_CORPORATION_ID.toString()}
//                       >
//                         {c.VAR_CORPORATION_NAME}
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//               </div>

//               {/* Search */}
//               <div className="grid grid-cols-[140px_1fr] items-center gap-3">
//                 <label className="font-medium text-sm">शोधा :</label>

//                 <Input
//                   placeholder="नाव / मोबाइल / शहर / PAN / GST"
//                   value={search}
//                   onChange={(e) => setSearch(e.target.value)}
//                 />
//               </div>
//             </div>
//           </div>

//           {/* Table */}
//           <div className="mt-4 border rounded-md overflow-hidden bg-white">
//             <ShadCNTable
//               headers={["निवडा", "नाव", "मोबाइल", "शहर", "PAN", "GST"]}
//               data={tableData}
//               keyMapping={{
//                 निवडा: "select",
//                 नाव: "name",
//                 मोबाइल: "mobile",
//                 शहर: "city",
//                 PAN: "pan",
//                 GST: "gst",
//               }}
//               pagination={true}
//             />
//           </div>
//         </CardContent>
//       </Card>
//     </motion.div>
//   );
// };

// export default FrmPartyList;



import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ShadCNTable from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

const BASE_URL = import.meta.env.VITE_BASE_URL;

/* ✅ Row Component */
const Row = ({ label, children }) => (
  <div className="grid grid-cols-[140px_300px] items-center gap-3 mb-3">
    <label className="font-medium text-sm">{label} :</label>
    {children}
  </div>
);

const FrmPartyList = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const ulbId = user?.ulbId;
  console.log("ulbId",ulbId)
  const [corporationList, setCorporationList] = useState([]);
  const [selectedCorp, setSelectedCorp] = useState("");
  const [partyList, setPartyList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);

  const api = axios.create({ baseURL: BASE_URL });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const loadCorporations = async () => {
    try {
      debugger;
      const res = await api.get("/api/FrmParty/corporation/list");
      const corpList = res.data?.data?.list || [];
      console.log("corpList",corpList)
      setCorporationList(corpList);

      if (ulbId) {
        const exists = corpList.find((c) => c.NUM_CORPORATION_ID === ulbId);

        if (exists) {
          const selected = ulbId.toString();
          setSelectedCorp(selected);
          await loadParties(selected);
        }
      }
    } catch (err) {
      console.error("Error loading corporations", err);
    }
  };

  /* 🔥 Load Parties */
  const loadParties = async (corpId) => {
    try {
      setLoading(true);

      const res = await api.get(`/api/FrmParty/party/search?corpId=${corpId}`);

      if (res.data?.ok && res.data?.data?.list) {
        setPartyList(res.data.data.list);
      }
    } catch (err) {
      console.error("Error loading parties", err);
    } finally {
      setLoading(false);
    }
  };

useEffect(() => {

  const init = async () => {

    try {

      setLoading(true);

      if (ulbId) {
        await loadCorporations();
      }

    } catch (err) {

      console.error(err);

    } finally {

      setLoading(false);
    }
  };

  init();

}, [ulbId]);

  /* 🔥 Search Filter */
  const filteredList = partyList.filter((row) => {
    const value = search.toLowerCase();
    return (
      row.PARTYNAME?.toLowerCase().includes(value) ||
      row.NUM_PARTYMST_MOBNO?.toString().includes(value) ||
      row.VAR_PARTYMST_CITY?.toLowerCase().includes(value) ||
      row.VAR_PARTYMST_PANCARD?.toLowerCase().includes(value) ||
      row.VAR_PARTYMST_GSTNO?.toLowerCase().includes(value)
    );
  });

  /* 🔥 Table Mapping */
  const tableData = filteredList.map((row) => ({
    select: (
      <Button
        variant="link"
        className="text-blue-700 px-0 h-auto"
        onClick={() =>
          navigate("/Masters/FrmPartyMaster", {
            state: {
              mode: 2,
              partyId: row.PARTYID,
            },
          })
        }
      >
        निवडा
      </Button>
    ),
    name: row.PARTYNAME,
    mobile: row.NUM_PARTYMST_MOBNO,
    city: row.VAR_PARTYMST_CITY,
    pan: row.VAR_PARTYMST_PANCARD,
    gst: row.VAR_PARTYMST_GSTNO || "-",
  }));

if (loading) {
  return (
    <div className="flex justify-center mt-10 text-gray-600">
      Loading...
    </div>
  );
}

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="shadow-sm border rounded-lg">
        {/* Header */}
        <CardHeader className="border-b flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">
            पार्टी मास्टर यादी
          </CardTitle>

          <Button
            className="bg-blue-900 hover:bg-blue-800 text-white"
            onClick={() => navigate("/Masters/FrmPartyMaster")}
          >
            नवीन जोडा
          </Button>
        </CardHeader>

        {/* Content */}
        <CardContent className="p-2">
          {/* Filter Box */}
          <div className="border rounded-md p-4 ">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Corporation */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <label className="font-medium text-sm">नगरपालिका :</label>

                <Select
                  value={selectedCorp}
                  onValueChange={(value) => {
                    setSelectedCorp(value);
                    loadParties(value);
                  }}
                  disabled={!!ulbId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>

                  <SelectContent>
                    {corporationList.map((c) => (
                      <SelectItem
                        key={c.NUM_CORPORATION_ID}
                        value={c.NUM_CORPORATION_ID.toString()}
                      >
                        {c.VAR_CORPORATION_NAME}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Search */}
              <div className="grid grid-cols-[140px_1fr] items-center gap-3">
                <label className="font-medium text-sm">शोधा :</label>

                <Input
                  placeholder="नाव / मोबाइल / शहर / PAN / GST"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="mt-4 border rounded-md overflow-hidden bg-white">
            <ShadCNTable
              headers={["निवडा", "नाव", "मोबाइल", "शहर", "PAN", "GST"]}
              data={tableData}
              keyMapping={{
                निवडा: "select",
                नाव: "name",
                मोबाइल: "mobile",
                शहर: "city",
                PAN: "pan",
                GST: "gst",
              }}
              pagination={true}
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default FrmPartyList;
