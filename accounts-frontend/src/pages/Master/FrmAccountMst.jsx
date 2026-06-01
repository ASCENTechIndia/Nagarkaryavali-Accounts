// import React, { useEffect, useState } from "react";
// import { Formik, Form } from "formik";
// import { motion } from "framer-motion";
// import axios from "axios";
// import { useAuth } from "@/context/AuthContext";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Input } from "@/components/ui/input";
// import Swal from "sweetalert2";
// import { Label } from "@/components/ui/label";
// import {
//   Select,
//   SelectTrigger,
//   SelectValue,
//   SelectContent,
//   SelectItem,
// } from "@/components/ui/select";

// const BASE_URL = import.meta.env.VITE_BASE_URL;

// const FrmAccountMaster = () => {
//   const { user } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const isEditMode = Boolean(location?.state?.accNo);

//   const [corporations, setCorporations] = useState([]);
//   const [glList, setGlList] = useState([]);
//   const [objectCodes, setObjectCodes] = useState([]);
//   const [nidhiList, setNidhiList] = useState([]);
//   const [dropdownLoaded, setDropdownLoaded] = useState(false);

//   const [initialValues, setInitialValues] = useState({
//     corp: "",
//     fund: "",
//     functionCode: "",
//     objectCode: "",
//     accId: "",
//     oldAcc: "",
//     nameMarathi: "",
//     nameEnglish: "",
//     budgetAmt: "",
//     revisedAmt: "",
//     openingBal: "",
//     limit: "",
//   });

//   const api = axios.create({ baseURL: BASE_URL });

//   api.interceptors.request.use((config) => {
//     const token = user?.token || localStorage.getItem("token");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });

//   useEffect(() => {
//     if (!user?.token) return;

//     const loadAll = async () => {
//       try {

//         Swal.fire({
//           title: "Loading...",
//           allowOutsideClick: false,
//           didOpen: () => Swal.showLoading(),
//         });

//         const [corpRes, glRes, objRes, nidhiRes] = await Promise.all([
//           api.get("/api/FrmParty/corporation/list"),
//           api.get("/api/FrmAccount/gl-master"),
//           api.get("/api/FrmAccount/account-subTypes"),
//           api.get("/api/FrmAccount/nidhi-master"),
//         ]);

//         setCorporations(corpRes.data?.data?.list || []);
//         setGlList(glRes.data?.data?.data || []);
//         setObjectCodes(objRes.data?.data?.data || []);
//         setNidhiList(nidhiRes.data?.data?.data || []);

//         if (user?.ulbId) {
//           setInitialValues((prev) => ({
//             ...prev,
//             corp: String(user.ulbId),
//           }));
//         }

//         setDropdownLoaded(true);

//         // ✅ CLOSE ONLY IN MODE 1
//         if (!isEditMode) {
//           Swal.close();
//         }

//       } catch (err) {
//         console.error(err);
//         Swal.close();
//       }
//     };

//     loadAll();
//   }, [user?.token]);

//   useEffect(() => {

//     // ✅ ONLY EDIT MODE
//     if (!isEditMode) return;

//     // ✅ wait dropdown completion
//     if (!dropdownLoaded) return;

//     if (!location?.state?.accNo || !location?.state?.functionCode) return;

//     // 🔥 WAIT until dropdown data is loaded
//     if (!glList.length || !objectCodes.length || !nidhiList.length) return;

//     const loadAllDetails = async () => {
//       try {

//         const { accNo, functionCode, ulbId } = location.state;

//         const mapRes = await api.post(
//           "/api/FrmAccount/account-mapping-details",
//           {
//             glCode: functionCode,
//             accNo,
//           }
//         );

//         const map = mapRes.data?.data?.data?.[0];

//         if (!map) {
//           Swal.close();
//           return;
//         }

//         // 🔥 SECOND API CALL
//         const fullRes = await api.post(
//           "/api/FrmAccount/account-fullDetails",
//           {
//             functionCode,
//             accNo,
//             ulbId: Number(ulbId || user?.ulbId),
//           }
//         );

//         const fullData = fullRes?.data?.data?.data?.[0] || {};

//         // 🔥 SET ALL VALUES
//         setInitialValues({
//           corp: String(ulbId || user?.ulbId || ""),
//           fund: String(fullData.NIDHIID || map.NUM_ACCMASTER_NIDHIID || ""),
//           functionCode,
//           objectCode: String(fullData.ACCSUBTYPE || map.ACCSUBTYPE || ""),
//           accId: accNo,
//           // accId: fullData.ACCNO,
//           oldAcc: fullData.OLDACCNO || "",
//           nameMarathi: fullData.ACCNAME || map.ACCNAME || "",
//           nameEnglish: fullData.VAR_ACCMASTER_ACCNAMEENG || map.VAR_ACCMASTER_ACCNAMEENG || map.ACCNAME || "",
//           budgetAmt: String(fullData.BUDGETAMT || 0),
//           revisedAmt: String(fullData.REVBUDGETAMT || 0),
//           openingBal: String(fullData.OPENBAL || 0),
//           limit: String(fullData.MAXLIMIT || 0),
//         });
//         setTimeout(() => { Swal.close() }, 300);
//       } catch (err) {
//         console.error(err);
//         Swal.close();
//       }
//     };
//     loadAllDetails();
//   }, [location.state, glList, objectCodes, nidhiList]);

//   const handleSubmit = async (values, { resetForm }) => {
//     try {
//       Swal.fire({
//         title: isEditMode ? "Updating..." : "Saving...",
//         allowOutsideClick: false,
//         didOpen: () => {
//           Swal.showLoading();
//         },
//       });
//       const mode = isEditMode ? 2 : 1;
//       const res = await api.post("/api/FrmAccount/save-account", {
//         mode: mode,
//         ulbId: Number(values.corp),
//         glCode: Number(values.functionCode),
//         accNo: Number(values.accId),
//         accName: values.nameMarathi,
//         accNameEng: values.nameEnglish,
//         userId: user?.username || "admin",
//         subTypeId: Number(values.objectCode),
//         oldAccNo: values.oldAcc,
//         nidhiId: Number(values.fund),
//         openingBal: Number(values.openingBal || 0),
//         budgetAmt: Number(values.budgetAmt || 0),
//         maxLimit: Number(values.limit || 0),
//         revBudgetAmt: Number(values.revisedAmt || 0),
//       });

//       const result = res.data?.data;
//       Swal.close();
//       if (result?.errorCode === -100) {
//         await Swal.fire({
//           text: result?.message,
//         });
//         resetForm();
//         navigate("/Masters/FrmAccountListMst")
//       } else {
//         Swal.fire({
//           text: result?.message,
//         });
//       }
//     } catch (err) {
//       console.error(err);

//       Swal.close();

//       Swal.fire({
//         text: err?.response?.data?.message || err?.response?.data?.error || "Failed To Fetch Branch List",
//       });
//     }
//   };

//   return (
//     <Formik
//       initialValues={initialValues}
//       enableReinitialize
//       onSubmit={handleSubmit}
//     >
//       {({ values, setFieldValue, resetForm }) => {
//         /* 🔥 AUTO ACCOUNT NUMBER */
//         if (!isEditMode) {
//           useEffect(() => {
//             if (!values.functionCode || !values.objectCode || !values.corp)
//               return;

//             const generate = async () => {
//               try {
//                 const res = await api.post("/api/FrmAccount/next-accountNo", {
//                   ulbId: Number(values.corp),
//                   glCode: Number(values.functionCode),
//                   subTypeId: Number(values.objectCode),
//                 });

//                 const next = res.data?.data?.data?.NEXTACCNO || "";
//                 const map = `${values.functionCode}${values.objectCode}${next}`;

//                 setFieldValue("accId", map);
//               } catch (err) {
//                 console.error(err);
//               }
//             };

//             generate();
//           }, [values.functionCode, values.objectCode, values.corp]);
//         }

//         return (
//           <Form>
//             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
//               <Card className="border shadow-sm rounded-lg">
//                 {/* HEADER */}
//                 <CardHeader className="border-b">
//                   <CardTitle className="text-lg font-semibold">
//                     खाते मास्टर
//                   </CardTitle>
//                 </CardHeader>

//                 <CardContent className="p-6 space-y-6">
//                   {/* ROW 1 */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {/* CORPORATION */}
//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         महानगरपालिका :
//                       </label>

//                       <Select
//                         value={values.corp || ""}
//                         onValueChange={(v) => setFieldValue("corp", v)}
//                         disabled={!!user?.ulbId}
//                       >
//                         <SelectTrigger className="flex-1 h-9">
//                           <SelectValue placeholder="निवडा" />
//                         </SelectTrigger>

//                         <SelectContent>
//                           {corporations.map((c) => (
//                             <SelectItem
//                               key={c.NUM_CORPORATION_ID}
//                               value={String(c.NUM_CORPORATION_ID)}
//                             >
//                               {c.VAR_CORPORATION_MNAME || c.VAR_CORPORATION_NAME}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* FUND */}
//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         निधी :
//                       </label>


//                       <Select
//                         value={values.fund || ""}
//                         onValueChange={(v) => setFieldValue("fund", v)}
//                       >
//                         <SelectTrigger className="flex-1 h-9">
//                           <SelectValue placeholder="निवडा" />
//                         </SelectTrigger>

//                         <SelectContent>
//                           {nidhiList.map((n) => (
//                             <SelectItem
//                               key={n.NUM_NIDHI_ID}
//                               value={String(n.NUM_NIDHI_ID)}
//                             >
//                               {n.VAR_NIDHI_NIDHINAME}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </div>

//                   {/* ROW 2 */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     {/* GL */}
//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         जी.एल. फंक्शन :
//                       </label>

//                       <Select
//                         value={values.functionCode || ""}
//                         onValueChange={(v) => {
//                           setFieldValue("functionCode", v);
//                           setFieldValue("objectCode", "");
//                           setFieldValue("accId", "");
//                         }}
//                       >
//                         <SelectTrigger className="flex-1 h-9">
//                           <SelectValue placeholder="निवडा" />
//                         </SelectTrigger>

//                         <SelectContent>
//                           {glList.map((g) => (
//                             <SelectItem key={g.GLCODE} value={g.GLCODE}>
//                               {g.GLCODE} - {g.GLNAME}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>

//                     {/* OBJECT CODE */}
//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         ऑब्जेक्ट कोड :
//                       </label>

//                       <Select
//                         value={values.objectCode || ""}
//                         onValueChange={(v) => setFieldValue("objectCode", v)}
//                       >
//                         <SelectTrigger className="flex-1 h-9">
//                           <SelectValue placeholder="निवडा" />
//                         </SelectTrigger>

//                         <SelectContent>
//                           {objectCodes.map((o) => (
//                             <SelectItem
//                               key={o.NUM_ACCSUBTYPEMST_ACCSUBTYPEID}
//                               value={String(o.NUM_ACCSUBTYPEMST_ACCSUBTYPEID)}
//                             >
//                               {o.VAR_ACCSUBTYPEMST_ACCSUBTYPE}
//                             </SelectItem>
//                           ))}
//                         </SelectContent>
//                       </Select>
//                     </div>
//                   </div>

//                   {/* ROW 3 */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         खाते आयडी :
//                       </label>

//                       <Input
//                         value={values.accId}
//                         disabled
//                         className="flex-1 h-9"
//                       />
//                     </div>

//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         जुना खाते क्र. :
//                       </label>

//                       <Input
//                         value={values.oldAcc}
//                         onChange={(e) =>
//                           setFieldValue("oldAcc", e.target.value)
//                         }
//                         className="flex-1 h-9"
//                       />
//                     </div>
//                   </div>

//                   {/* ROW 4 */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         खाते नाव (मराठी) :
//                       </label>

//                       <Input
//                         className="flex-1 h-9"
//                         value={values.nameMarathi}
//                         onChange={(e) =>
//                           setFieldValue("nameMarathi", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         खाते नाव (English) :
//                       </label>

//                       <Input
//                         className="flex-1 h-9"
//                         value={values.nameEnglish}
//                         onChange={(e) =>
//                           setFieldValue("nameEnglish", e.target.value)
//                         }
//                       />
//                     </div>
//                   </div>

//                   {/* ROW 5 */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         बजेट :
//                       </label>

//                       <Input
//                         className="flex-1 h-9"
//                         value={values.budgetAmt}
//                         onChange={(e) =>
//                           setFieldValue("budgetAmt", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         सुधारित बजेट :
//                       </label>

//                       <Input
//                         className="flex-1 h-9"
//                         value={values.revisedAmt}
//                         onChange={(e) =>
//                           setFieldValue("revisedAmt", e.target.value)
//                         }
//                       />
//                     </div>
//                   </div>

//                   {/* ROW 6 */}
//                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         प्रारंभिक शिल्लक :
//                       </label>

//                       <Input
//                         className="flex-1 h-9"
//                         value={values.openingBal}
//                         onChange={(e) =>
//                           setFieldValue("openingBal", e.target.value)
//                         }
//                       />
//                     </div>

//                     <div className="flex items-center gap-3">
//                       <label className="w-40 text-right text-sm font-medium">
//                         कमाल मर्यादा :
//                       </label>

//                       <Input
//                         className="flex-1 h-9"
//                         value={values.limit}
//                         onChange={(e) => setFieldValue("limit", e.target.value)}
//                       />
//                     </div>
//                   </div>

//                   {/* BUTTONS */}
//                   <div className="flex justify-center gap-4 pt-6 border-t">
//                     <Button type="submit">साठवा</Button>
//                     <Button
//                       type="button"
//                       variant="secondary"
//                       onClick={() => resetForm()}
//                     >
//                       रद्द
//                     </Button>
//                     <Button
//                       type="button"
//                       variant="destructive"
//                       onClick={() => navigate("/Masters/FrmAccountListMst")}
//                       path={"/Masters/FrmAccountListMst"}
//                     >
//                       परत
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             </motion.div>
//           </Form>
//         );
//       }}
//     </Formik>
//   );
// };

// export default FrmAccountMaster;
import React, { useEffect, useState } from "react";
import { Formik, Form } from "formik";
import { motion } from "framer-motion";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Swal from "sweetalert2";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmAccountMaster = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditMode = Boolean(location?.state?.accNo);

  const [corporations, setCorporations] = useState([]);
  const [glList, setGlList] = useState([]);
  const [objectCodes, setObjectCodes] = useState([]);
  const [nidhiList, setNidhiList] = useState([]);
  const [dropdownLoaded, setDropdownLoaded] = useState(false);

  const [initialValues, setInitialValues] = useState({
    corp: "",
    fund: "",
    functionCode: "",
    objectCode: "",
    accId: "",
    oldAcc: "",
    nameMarathi: "",
    nameEnglish: "",
    budgetAmt: "",
    revisedAmt: "",
    openingBal: "",
    limit: "",
  });

  const api = axios.create({ baseURL: BASE_URL });

  api.interceptors.request.use((config) => {
    const token = user?.token || localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  useEffect(() => {
    if (!user?.token) return;

    const loadAll = async () => {
      try {

        Swal.fire({
          title: "Loading...",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const [corpRes, glRes, objRes, nidhiRes] = await Promise.all([
          api.get("/api/FrmParty/corporation/list"),
          api.get("/api/FrmAccount/gl-master"),
          api.get("/api/FrmAccount/account-subTypes"),
          api.get("/api/FrmAccount/nidhi-master"),
        ]);

        setCorporations(corpRes.data?.data?.list || []);
        setGlList(glRes.data?.data?.data || []);
        setObjectCodes(objRes.data?.data?.data || []);
        setNidhiList(nidhiRes.data?.data?.data || []);

        if (user?.ulbId) {
          setInitialValues((prev) => ({
            ...prev,
            corp: String(user.ulbId),
          }));
        }

        setDropdownLoaded(true);

        // ✅ CLOSE ONLY IN MODE 1
        if (!isEditMode) {
          Swal.close();
        }

      } catch (err) {
        console.error(err);
        Swal.close();
      }
    };

    loadAll();
  }, [user?.token]);

  useEffect(() => {

    // ✅ ONLY EDIT MODE
    if (!isEditMode) return;

    // ✅ wait dropdown completion
    if (!dropdownLoaded) return;

    if (!location?.state?.accNo || !location?.state?.functionCode) return;

    // 🔥 WAIT until dropdown data is loaded
    if (!glList.length || !objectCodes.length || !nidhiList.length) return;

    const loadAllDetails = async () => {
      try {

        const { accNo, functionCode, ulbId } = location.state;

        const mapRes = await api.post(
          "/api/FrmAccount/account-mapping-details",
          {
            glCode: functionCode,
            accNo,
          }
        );

        const map = mapRes.data?.data?.data?.[0];

        if (!map) {
          Swal.close();
          return;
        }

        // 🔥 SECOND API CALL
        const fullRes = await api.post(
          "/api/FrmAccount/account-fullDetails",
          {
            functionCode,
            accNo,
            ulbId: Number(ulbId || user?.ulbId),
          }
        );

        const fullData = fullRes?.data?.data?.data?.[0] || {};

        // 🔥 SET ALL VALUES
        setInitialValues({
          corp: String(ulbId || user?.ulbId || ""),
          fund: String(fullData.NIDHIID || map.NUM_ACCMASTER_NIDHIID || ""),
          functionCode,
          objectCode: String(fullData.ACCSUBTYPE || map.ACCSUBTYPE || ""),
          accId: accNo,
          // accId: fullData.ACCNO,
          oldAcc: fullData.OLDACCNO || "",
          nameMarathi: fullData.ACCNAME || map.ACCNAME || "",
          nameEnglish: fullData.VAR_ACCMASTER_ACCNAMEENG || map.VAR_ACCMASTER_ACCNAMEENG || map.ACCNAME || "",
          budgetAmt: String(fullData.BUDGETAMT || 0),
          revisedAmt: String(fullData.REVBUDGETAMT || 0),
          openingBal: String(fullData.OPENBAL || 0),
          limit: String(fullData.MAXLIMIT || 0),
        });
        setTimeout(() => { Swal.close() }, 300);
      } catch (err) {
        console.error(err);
        Swal.close();
      }
    };
    loadAllDetails();
  }, [location.state, glList, objectCodes, nidhiList]);

  const handleSubmit = async (values, { resetForm }) => {
    try {
      Swal.fire({
        title: isEditMode ? "Updating..." : "Saving...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });
      const mode = isEditMode ? 2 : 1;
      const res = await api.post("/api/FrmAccount/save-account", {
        mode: mode,
        ulbId: Number(values.corp),
        glCode: Number(values.functionCode),
        accNo: Number(values.accId),
        accName: values.nameMarathi,
        accNameEng: values.nameEnglish,
        userId: user?.username || "admin",
        subTypeId: Number(values.objectCode),
        oldAccNo: values.oldAcc,
        nidhiId: Number(values.fund),
        openingBal: Number(values.openingBal || 0),
        budgetAmt: Number(values.budgetAmt || 0),
        maxLimit: Number(values.limit || 0),
        revBudgetAmt: Number(values.revisedAmt || 0),
      });

      const result = res.data?.data;
      Swal.close();
      if (result?.errorCode === -100) {
        await Swal.fire({
          text: result?.message,
        });
        resetForm();
        navigate("/Masters/FrmAccountListMst")
      } else {
        Swal.fire({
          text: result?.message,
        });
      }
    } catch (err) {
      console.error(err);

      Swal.close();

      Swal.fire({
        text: err?.response?.data?.message || err?.response?.data?.error || "Failed To Fetch Branch List",
      });
    }
  };

  return (
    <Formik
      initialValues={initialValues}
      enableReinitialize
      onSubmit={handleSubmit}
    >
      {({ values, setFieldValue, resetForm }) => {
        /* 🔥 AUTO ACCOUNT NUMBER */
        if (!isEditMode) {
          useEffect(() => {
            if (!values.functionCode || !values.objectCode || !values.corp)
              return;

            const generate = async () => {
              try {
                const res = await api.post("/api/FrmAccount/next-accountNo", {
                  ulbId: Number(values.corp),
                  glCode: Number(values.functionCode),
                  subTypeId: Number(values.objectCode),
                });

                const next = res.data?.data?.data?.NEXTACCNO || "";
                const map = `${values.functionCode}${values.objectCode}${next}`;

                setFieldValue("accId", map);
              } catch (err) {
                console.error(err);
              }
            };

            generate();
          }, [values.functionCode, values.objectCode, values.corp]);
        }

        return (
          <Form>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="border shadow-sm rounded-lg">
                {/* HEADER */}
                <CardHeader className="border-b">
                  <CardTitle className="text-lg font-semibold">
                    खाते मास्टर
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-6 space-y-6">
                  {/* ROW 1 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* CORPORATION */}
                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        महानगरपालिका :
                      </label>

                      <Select
                        value={values.corp || ""}
                        onValueChange={(v) => setFieldValue("corp", v)}
                        disabled={!!user?.ulbId}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="निवडा" />
                        </SelectTrigger>

                        <SelectContent>
                          {corporations.map((c) => (
                            <SelectItem
                              key={c.NUM_CORPORATION_ID}
                              value={String(c.NUM_CORPORATION_ID)}
                            >
                              {c.VAR_CORPORATION_MNAME || c.VAR_CORPORATION_NAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* FUND */}
                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        निधी :
                      </label>


                      <Select
                        value={values.fund || ""}
                        onValueChange={(v) => setFieldValue("fund", v)}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="निवडा" />
                        </SelectTrigger>

                        <SelectContent>
                          {nidhiList.map((n) => (
                            <SelectItem
                              key={n.NUM_NIDHI_ID}
                              value={String(n.NUM_NIDHI_ID)}
                            >
                              {n.VAR_NIDHI_NIDHINAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ROW 2 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* GL */}
                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        जी.एल. फंक्शन :
                      </label>

                      <Select
                        value={values.functionCode || ""}
                        onValueChange={(v) => {
                          setFieldValue("functionCode", v);
                          setFieldValue("objectCode", "");
                          setFieldValue("accId", "");
                        }}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="निवडा" />
                        </SelectTrigger>

                        <SelectContent>
                          {glList.map((g) => (
                            <SelectItem key={g.GLCODE} value={g.GLCODE}>
                              {g.GLCODE} - {g.GLNAME}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* OBJECT CODE */}
                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        ऑब्जेक्ट कोड :
                      </label>

                      <Select
                        value={values.objectCode || ""}
                        onValueChange={(v) => setFieldValue("objectCode", v)}
                      >
                        <SelectTrigger className="flex-1 h-9">
                          <SelectValue placeholder="निवडा" />
                        </SelectTrigger>

                        <SelectContent>
                          {objectCodes.map((o) => (
                            <SelectItem
                              key={o.NUM_ACCSUBTYPEMST_ACCSUBTYPEID}
                              value={String(o.NUM_ACCSUBTYPEMST_ACCSUBTYPEID)}
                            >
                              {o.VAR_ACCSUBTYPEMST_ACCSUBTYPE}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* ROW 3 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        खाते कोड :
                      </label>

                      <Input
                        value={values.accId}
                        readOnly
                        className="flex-1 h-9 "
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        जुना खाते क्र. :
                      </label>

                      <Input
                        value={values.oldAcc}
                        onChange={(e) =>
                          setFieldValue("oldAcc", e.target.value)
                        }
                        className="flex-1 h-9"
                      />
                    </div>
                  </div>

                  {/* ROW 4 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        खाते नाव (मराठी) :
                      </label>

                      <Input
                        className="flex-1 h-9"
                        value={values.nameMarathi}
                        onChange={(e) =>
                          setFieldValue("nameMarathi", e.target.value)
                        }
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        खाते नाव (English) :
                      </label>

                      <Input
                        className="flex-1 h-9"
                        value={values.nameEnglish}
                        onChange={(e) =>
                          setFieldValue("nameEnglish", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* ROW 5 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        बजट तरतूद रक्कम  :
                      </label>

                      <Input
                        className="flex-1 h-9"
                        value={values.budgetAmt}
                        onChange={(e) =>
                          setFieldValue("budgetAmt", e.target.value)
                        }
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        सुधारित बजेट :
                      </label>

                      <Input
                        className="flex-1 h-9"
                        value={values.revisedAmt}
                        onChange={(e) =>
                          setFieldValue("revisedAmt", e.target.value)
                        }
                      />
                    </div>
                  </div>

                  {/* ROW 6 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        प्रारंभिक शिल्लक :
                      </label>

                      <Input
                        className="flex-1 h-9"
                        value={values.openingBal}
                        onChange={(e) =>
                          setFieldValue("openingBal", e.target.value)
                        }
                      />
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="w-40 text-right text-sm font-medium">
                        कमाल मर्यादा :
                      </label>

                      <Input
                        className="flex-1 h-9"
                        value={values.limit}
                        onChange={(e) => setFieldValue("limit", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* BUTTONS */}
                  <div className="flex justify-center gap-4 pt-6 border-t">
                    <Button type="submit">साठवा</Button>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => resetForm()}
                    >
                      रद्द
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => navigate("/Masters/FrmAccountListMst")}
                      path={"/Masters/FrmAccountListMst"}
                    >
                      परत
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

export default FrmAccountMaster;