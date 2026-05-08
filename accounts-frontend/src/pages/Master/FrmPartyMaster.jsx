// import { Formik, Form } from "formik";
// import { useNavigate, useLocation } from "react-router-dom";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import ShadCNTable from "@/components/ui/table";
// import { useAuth } from "@/context/AuthContext";

// import { motion } from "framer-motion";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// import { useEffect, useState } from "react";
// import axios from "axios";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import Swal from "sweetalert2";

// /* ✅ FIXED ROW COMPONENT */
// /* ✅ COMMON FIELD */
// const Field = ({ label, children, width = "w-[220px]" }) => (
//   <div className="flex items-center gap-2">
//     <div className="w-[150px] text-sm font-medium text-right">{label}</div>
//     <div>:</div>
//     <div className={width}>{children}</div>
//   </div>
// );
// const FrmPartyMaster = () => {
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { user } = useAuth();

//   const ulbId = user?.ulbId;
//   const mode = location.state?.mode;

//   const [stateList, setStateList] = useState([]);
//   const [districtList, setDistrictList] = useState([]);
//   const [cityList, setCityList] = useState([]);
//   const [corporationList, setCorporationList] = useState([]);
//   const [bankList, setBankList] = useState([]);
//   const [branchList, setBranchList] = useState([]);

//   const baseUrl = import.meta.env.VITE_BASE_URL;

//   const initialValues = {
//     nagarpalika: ulbId?.toString() || "",
//     partyId: "",
//     partyName: "",
//     ownerName: "",
//     address: "",
//     state: "",
//     district: "",
//     city: "",
//     mobile: "",
//     email: "",
//     pin: "",
//     aadhar: "",
//     pan: "",
//     vat: "",
//     gst: "",
//     sgst: "",
//     bank: "",
//     branch: "",
//     ifsc: "",
//     accountNo: "",
//     status: "",
//     bankList: [],
//   };

//   const api = axios.create({ baseURL: baseUrl });

//   api.interceptors.request.use((config) => {
//     const token = localStorage.getItem("token");
//     if (token) config.headers.Authorization = `Bearer ${token}`;
//     return config;
//   });

//   /* 🔥 LOAD */
//   useEffect(() => {
//     const load = async () => {
//       const [s, b, c] = await Promise.all([
//         api.get("/api/FrmParty/state"),
//         api.get("/api/FrmParty/bank"),
//         api.get("/api/FrmParty/corporation/list"),
//       ]);

//       setStateList(s.data?.data?.list || []);
//       setBankList(b.data?.data?.list || []);
//       setCorporationList(c.data?.data?.list || []);
//     };

//     if (ulbId) load();
//   }, [ulbId]);

//   const getDistricts = async (id) => {
//     const res = await api.get(`/api/FrmParty/district/${id}`);
//     setDistrictList(res.data?.data?.list || []);
//   };

//   const getCities = async (id) => {
//     const res = await api.get(`/api/FrmParty/city/${id}`);
//     setCityList(res.data?.data?.list || []);
//   };

//   const getBranches = async (id) => {
//     const res = await api.get(`/api/FrmParty/branch/${id}`);
//     setBranchList(res.data?.data?.list || []);
//   };

//   const getIFSC = async (id, setFieldValue) => {
//     const res = await api.get(`/api/FrmParty/ifsc/${id}`);
//     setFieldValue("ifsc", res.data?.data?.data?.VAR_BRANCHMST_IFSC || "");
//   };

// const handleSubmit = async (values) => {
//   debugger; 
//   try {
//     Swal.fire({ title: "Saving...", didOpen: () => Swal.showLoading() });

//     /* 🔥 BUILD bankStr */
//     const bankStr = values.bankList
//       .map(
//         (b) =>
//           `${b.bank}#${b.branch}#${b.ifsc}#${b.accountNo}#${
//             b.status === "1" ? "Active" : "Inactive"
//           }#0#0`
//       )
//       .join(",");

//     /* 🔥 FINAL PAYLOAD */
//     const payload = {
//       mode: mode === 2 ? 2 : 1,
//       partyId: values.partyId || 0,
//       userId: user?.ulbId,
//       corpId: values.nagarpalika,

//       partyName: values.partyName,
//       propName: values.ownerName,
//       partyAddress: values.address,

//       cityId: values.city,
//       districtId: values.district,

//       pinNo: values.pin,
//       mobNo: values.mobile,
//       email: values.email,

//       panNo: values.pan,
//       gstNumber: values.gst,
//       aadharNo: values.aadhar,

//       bankId: values.bank,
//       branchId: values.branch,
//       ifscCode: values.ifsc,
//       accountNo: values.accountNo,

//       ipAddress: "192.168.1.1",
//       source: "WEB",

//       bankStr: bankStr,
//     };

//     /* 🔥 API CALL */
//     const res = await api.post("/api/FrmParty/party-master", payload);

//     Swal.close();

//     if (res.data?.ok) {
//       Swal.fire("Success", "Party saved successfully", "success");
//       navigate("/Masters/FrmPartyList");
//     } else {
//       Swal.fire("Error", res.data?.message || "Failed");
//     }
//   } catch (err) {
//     Swal.close();
//     Swal.fire("Error", "Something went wrong");
//     console.error(err);
//   }
// };

//   return (
//     <Formik initialValues={initialValues} onSubmit={handleSubmit}>
//       {({ values, handleChange, setFieldValue }) => (
//         <motion.div
//           initial={{ opacity: 0, y: 30 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.4 }}
//           className="max-w-7xl mx-auto"
//         >
//           <Card className="shadow-lg border rounded-xl">
//             <CardHeader className="border-b">
//               <CardTitle className="text-lg font-semibold">
//                 पार्टी मास्टर
//               </CardTitle>
//             </CardHeader>

//             <CardContent className="p-6 space-y-5">
//               <Form className="space-y-4">
//                 {/* नगरपालिकेचे नाव */}
//                 <Field label="नगरपालिकेचे नाव" width="w-[400px]">
//                   <Select
//                     value={values.nagarpalika}
//                     onValueChange={(v) => setFieldValue("nagarpalika", v)}
//                     desabled
//                   >
//                     <SelectTrigger className="h-9 w-full">
//                       <SelectValue placeholder="निवडा" />
//                     </SelectTrigger>

//                     <SelectContent>
//                       {corporationList.map((c) => (
//                         <SelectItem
//                           key={c.NUM_CORPORATION_ID}
//                           value={c.NUM_CORPORATION_ID?.toString()}
//                         >
//                           {c.VAR_CORPORATION_NAME}
//                         </SelectItem>
//                       ))}
//                     </SelectContent>
//                   </Select>
//                 </Field>

//                 {/* ROW */}
//                 <div className="grid grid-cols-3 gap-6">
//                   <Field label="पक्ष आय डी">
//                     <Input
//                       name="partyId"
//                       value={values.partyId}
//                       onChange={handleChange}
//                       className="w-full"
//                     />
//                   </Field>

//                   <div className="col-span-2">
//                     <Field label="पक्ष नाव">
//                       <Input
//                         name="partyName"
//                         value={values.partyName}
//                         onChange={handleChange}
//                         className="w-full"
//                       />
//                     </Field>
//                   </div>
//                 </div>

//                 <div className="grid grid-cols-3 gap-6">
//                   <Field label="मालक नाव">
//                     <Input
//                       name="ownerName"
//                       value={values.ownerName}
//                       onChange={handleChange}
//                       className="w-full"
//                     />
//                   </Field>

//                   <div className="col-span-2">
//                     <Field label="पत्ता">
//                       <textarea
//                         name="address"
//                         value={values.address}
//                         onChange={handleChange}
//                         className="border w-full rounded-md p-2 h-8"
//                       />
//                     </Field>
//                   </div>
//                 </div>

//                 {/* LOCATION */}
//                 <div className="flex gap-10">
//                   {/* STATE */}
//                   <Field label="राज्य">
//                     <Select
//                       value={values.state}
//                       onValueChange={(v) => {
//                         setFieldValue("state", v);
//                         setFieldValue("district", "");
//                         setFieldValue("city", "");
//                         getDistricts(v);
//                       }}
//                     >
//                       <SelectTrigger className="h-9 w-full">
//                         <SelectValue placeholder="निवडा" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {stateList.map((s) => (
//                           <SelectItem key={s.VALUE} value={s.VALUE?.toString()}>
//                             {s.LABEL}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </Field>

//                   {/* DISTRICT */}
//                   <Field label="जिल्हा">
//                     <Select
//                       value={values.district}
//                       onValueChange={(v) => {
//                         setFieldValue("district", v);
//                         setFieldValue("city", "");
//                         getCities(v);
//                       }}
//                     >
//                       <SelectTrigger className="h-9 w-full">
//                         <SelectValue placeholder="निवडा" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {districtList.map((d) => (
//                           <SelectItem key={d.VALUE} value={d.VALUE?.toString()}>
//                             {d.LABEL}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </Field>

//                   {/* CITY */}
//                   <Field label="शहर">
//                     <Select
//                       value={values.city}
//                       onValueChange={(v) => setFieldValue("city", v)}
//                     >
//                       <SelectTrigger className="h-9 w-full">
//                         <SelectValue placeholder="निवडा" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {cityList.map((c) => (
//                           <SelectItem key={c.VALUE} value={c.VALUE?.toString()}>
//                             {c.LABEL}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </Field>
//                 </div>

//                 {/* CONTACT */}
//                 <div className="flex gap-10">
//                   <Field label="मोबाइल">
//                     <Input name="mobile" />
//                   </Field>

//                   <Field label="ई मेल आयडी">
//                     <Input name="email" />
//                   </Field>

//                   <Field label="पिन कोड">
//                     <Input name="pin" />
//                   </Field>
//                 </div>

//                 {/* TAX */}
//                 <div className="flex gap-10">
//                   <Field label="आधार नं.">
//                     <Input name="aadhar" />
//                   </Field>

//                   <Field label="पॅन कार्ड">
//                     <Input name="pan" />
//                   </Field>

//                   <Field label="व्हॅट कोड">
//                     <Input name="vat" />
//                   </Field>
//                 </div>

//                 <div className="flex gap-10">
//                   <Field label="जी.एस.टी नंबर">
//                     <Input name="gst" />
//                   </Field>

//                   <Field label="एम.एस.टी">
//                     <Input name="sgst" />
//                   </Field>

//                   <Field label="बी.एस.टी">
//                     <Input name="bst" />
//                   </Field>
//                 </div>

//                 {/* BANK SECTION */}
//                 <div className="flex gap-10">
//                   {/* BANK */}
//                   <Field label="बैंक">
//                     <Select
//                       value={values.bank}
//                       onValueChange={(v) => {
//                         setFieldValue("bank", v);
//                         setFieldValue("branch", "");
//                         setFieldValue("ifsc", "");
//                         getBranches(v);
//                       }}
//                     >
//                       <SelectTrigger className="h-9 w-full">
//                         <SelectValue placeholder="निवडा" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {bankList.map((b) => (
//                           <SelectItem key={b.VALUE} value={b.VALUE?.toString()}>
//                             {b.LABEL}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </Field>

//                   {/* BRANCH */}
//                   <Field label="बैंक शाखा">
//                     <Select
//                       value={values.branch}
//                       onValueChange={(v) => {
//                         setFieldValue("branch", v);
//                         getIFSC(v, setFieldValue);
//                       }}
//                     >
//                       <SelectTrigger className="h-9 w-full">
//                         <SelectValue placeholder="निवडा" />
//                       </SelectTrigger>

//                       <SelectContent>
//                         {branchList.map((b) => (
//                           <SelectItem key={b.VALUE} value={b.VALUE?.toString()}>
//                             {b.LABEL}
//                           </SelectItem>
//                         ))}
//                       </SelectContent>
//                     </Select>
//                   </Field>

//                   <Field label="स्थिती">
//                     <Select
//                       value={values.status}
//                       onValueChange={(v) => setFieldValue("status", v)}
//                     >
//                       <SelectTrigger className="h-9 w-full">
//                         <SelectValue />
//                       </SelectTrigger>
//                       <SelectContent>
//                         <SelectItem value="1">open</SelectItem>
//                         <SelectItem value="0">close</SelectItem>
//                       </SelectContent>
//                     </Select>
//                   </Field>
//                 </div>

//                 <div className="flex gap-10 items-center">
//                   <Field label="आय.एफ.एस.सी">
//                     <Input name="ifsc" value={values.ifsc} readOnly />
//                   </Field>

//                   <Field label="खाते क्रमांक">
//                     <Input name="accountNo" />
//                   </Field>

//                   <Button
//                     type="button"
//                     className="mt-2"
//                     onClick={() => {
//                       setFieldValue("bankList", [
//                         ...values.bankList,
//                         {
//                           bank: values.bank,
//                           branch: values.branch,
//                           ifsc: values.ifsc,
//                           accountNo: values.accountNo,
//                           status: values.status,
//                         },
//                       ]);
//                     }}
//                   >
//                     बँक जोडा
//                   </Button>
//                 </div>

//                 {/* 🔥 TABLE */}
//                 <ShadCNTable
//                   headers={[
//                     "बैंक",
//                     "बैंक शाखा",
//                     "आय.एफ.एस.सी",
//                     "खाते क्रमांक",
//                     "स्थिती",
//                   ]}
//                   data={values.bankList || []}
//                   keyMapping={{
//                     बैंक: "bank",
//                     "बैंक शाखा": "branch",
//                     "आय.एफ.एस.सी": "ifsc",
//                     "खाते क्रमांक": "accountNo",
//                     स्थिती: "status",
//                   }}
//                 />

//                 {/* BUTTONS */}
//                 <div className="flex justify-center gap-4 pt-4">
//                   <Button type="submit" className="bg-blue-900 text-white">
//                     साठवा
//                   </Button>
//                   <Button variant="secondary">बदल करा</Button>
//                   <Button variant="destructive">परत</Button>
//                 </div>
//               </Form>
//             </CardContent>
//           </Card>
//         </motion.div>
//       )}
//     </Formik>
//   );
// };

// export default FrmPartyMaster;


import { Formik, Form } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useEffect, useState, useRef } from "react";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import Swal from "sweetalert2";
import config from "@/utils/config";
import GetIPAddress from "@/utils/ipHelper";

const FrmPartyMaster = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const formikRef = useRef();

  const ulbId = user?.ulbId;
  const mode = location.state?.mode;

  const [stateList, setStateList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [corporationList, setCorporationList] = useState([]);
  const [bankList, setBankList] = useState([]);
  const [branchList, setBranchList] = useState([]);

  const baseUrl = import.meta.env.VITE_BASE_URL;

  const token = localStorage.getItem("token");

  const initialValues = {
    nagarpalika: ulbId?.toString() || "",
    partyId: "",
    partyName: "",
    ownerName: "",
    address: "",
    state: "",
    district: "",
    city: "",
    mobile: "",
    email: "",
    pin: "",
    aadhar: "",
    pan: "",
    vat: "",
    gst: "",
    sgst: "",
    bst: "",
    bank: "",
    branch: "",
    ifsc: "",
    accountNo: "",
    status: "",
    bankList: [],
  };

  useEffect(() => {
    const load = async () => {
      try {
        const headers = {
          Authorization: `Bearer ${token}`,
        };

        const [s, b, c] = await Promise.all([
          axios.get(`${baseUrl}/api/FrmParty/state`, {
            headers,
          }),

          axios.get(`${baseUrl}/api/FrmParty/bank`, {
            headers,
          }),

          axios.get(
            `${baseUrl}/api/FrmParty/corporation/list`,
            {
              headers,
            }
          ),
        ]);

        setStateList(s.data?.data?.list || []);
        setBankList(b.data?.data?.list || []);
        setCorporationList(c.data?.data?.list || []);
      } catch (err) {
        console.error(err);
      }
    };

    load();
  }, []);

  const getDistricts = async (id) => {
    try {
      const res = await axios.get(
        `${baseUrl}/api/FrmParty/district/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDistrictList(res.data?.data?.list || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getCities = async (id) => {
    try {
      const res = await axios.get(
        `${baseUrl}/api/FrmParty/city/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setCityList(res.data?.data?.list || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getBranches = async (id) => {
    try {
      const res = await axios.get(
        `${baseUrl}/api/FrmParty/branch/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setBranchList(res.data?.data?.list || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getIFSC = async (id) => {
    try {
      const res = await axios.get(
        `${baseUrl}/api/FrmParty/ifsc/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      formikRef.current?.setFieldValue(
        "ifsc",
        res.data?.data?.data?.VAR_BRANCHMST_IFSC || ""
      );
    } catch (err) {
      console.error(err);
    }
  };

  /* AUTOFILL */
useEffect(() => {
  const fetchParty = async () => {
    try {
      if (
        mode === 2 &&
        location.state?.partyId
      ) {
        Swal.fire({
          title: "Loading Party Details...",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });
        const partyRes = await axios.get(
          `${baseUrl}/api/FrmParty/party/${location.state.partyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const bankRes = await axios.get(
          `${baseUrl}/api/FrmParty/bank/${location.state.partyId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        console.log("PARTY RESPONSE",partyRes.data);
        console.log("BANK RESPONSE",bankRes.data);

        const partyData = partyRes.data?.data?.data?.party || [];
        const bankData = bankRes.data?.data?.data?.bankDetails || [];

        const party = partyData.length > 0 ? partyData[0] : null;

        if (party) {
          if (party.STATE) {
            await getDistricts(party.STATE);
          }
          if (party.DISTRICT) {
            await getCities(party.DISTRICT);
          }

          setTimeout(() => {
            formikRef.current?.setValues({

              nagarpalika: party.ULBID?.toString() || ulbId?.toString() || "",

              partyId: party.PARTYID?.toString() || "",

              partyName: party.PARTY || "",

              ownerName: party.PROPNAME || "",

              address: party.PARTYADD || "",

              state: party.STATE?.toString() || "",

              district: party.DISTRICT?.toString() || "",

              city: party.NUM_CITYMST_CITYID?.toString() || "",

              mobile: party.MOBNO?.toString() || "",

              email: party.EMAIL || "",

              pin: party.PINNO?.toString() || "",

              aadhar: party.AADHARNO?.toString() || "",

              pan: party.PANCARD || "",

              vat: party.VATNO || "",

              gst: party.GSTNO || "",

              sgst: party.MSTNO || "",

              bst: party.BSTNO || "",

              bank: "",
              branch: "",
              ifsc: "",
              accountNo: "",
              status: "",

              bankList:
                bankData.map((b) => {
                  const bankStatus = String(b.STATUS || "").trim().toLowerCase();
                  return {
                    partyBankDtlsId: b.PARTYBANKDTLSID || 0,
                    bankId: b.BANKID?.toString() || "",
                    branchId: b.BRANCHID?.toString() || "",
                    bank: b.BANKNAME || "-",
                    branch: b.BRANCHNAME || "-",
                    ifsc: b.IFSCCODE || "-",
                    accountNo: b.ACCOUNTNO || "-",
                    status: bankStatus === "1" || bankStatus === "open"   ? "1"   : "0",
                    statusLabel: bankStatus === "1" || bankStatus === "open"   ? "Open"   : "Close",
                  };
                }) || [],
            });
            Swal.close();
          }, 500);
        }
      }
    } catch (err) {
      Swal.close();
      console.error(err);
      Swal.fire(
        "Error",
        "Failed to load party details",
        "error"
      );
    }
  };
  fetchParty();
}, []);

  const handleSubmit = async (values) => {
    try {
      if (!values.partyName) {
        Swal.fire(
          "Validation",
          "कृपया पक्ष नाव टाका",
          "warning"
        );
        return;
      }
      if (!values.state) {
        Swal.fire(
          "Validation",
          "कृपया राज्य निवडा",
          "warning"
        );
        return;
      }
      if (!values.district) {
        Swal.fire(
          "Validation",
          "कृपया जिल्हा निवडा",
          "warning"
        );
        return;
      }
      if (!values.city) {
        Swal.fire(
          "Validation",
          "कृपया शहर निवडा",
          "warning"
        );
        return;
      }
      if (!values.mobile) {
        Swal.fire(
          "Validation",
          "कृपया मोबाइल नंबर टाका",
          "warning"
        );
        return;
      }

      Swal.fire({
        title: "Saving...",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const ip = await GetIPAddress();

      const bankStr = values.bankList
        .map(
          (b) =>
            `${b.bankId || 0}#${b.branchId || 0}#${b.ifsc || "-"
            }#${b.accountNo || "-"
            }#${b.status || "0"
            }`
        )
        .join("^");

      const selectedCity =
        cityList.find(
          (x) =>
            x.VALUE?.toString() === values.city
        );

      const payload = {
        mode: mode === 2 ? 2 : 1,
        partyId: values.partyId || 0,
        userId: user?.userId,
        corpId: values.nagarpalika,
        partyName: values.partyName,
        propName: values.ownerName,
        partyAddress: values.address,
        // cityId: values.city,
        cityId: selectedCity?.LABEL || "",
        districtId: values.district,
        pinNo: values.pin,
        mobNo: values.mobile,
        email: values.email,
        panNo: values.pan,
        vatNo: values.vat,
        bstNo: values.bst,
        mstNo: values.sgst,
        gstNumber: values.gst,
        aadharNo: values.aadhar,
        bankId: values.bank || null,
        branchId: values.branch || null,
        ifscCode: values.ifsc || null,
        accountNo: values.accountNo || null,
        ipAddress: ip,
        source: config?.source,
        bankStr,
      };
      console.log("FINAL PAYLOAD", payload);

      const res = await axios.post(
        `${baseUrl}/api/FrmParty/party-master`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      Swal.close();
      if (res.data?.ok) {
        Swal.fire({
          icon: "success",
          title: "Success",
          text: res.data?.message || "Party saved successfully",
        });
        navigate(
          "/Masters/FrmPartyList"
        );
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: res.data?.message || "Failed",
        });
      }
    } catch (err) {
      console.error(err);
      Swal.close();
      Swal.fire({
        icon: "error",
        title: "Error",
        text: err?.response?.data?.message || err?.message || "Something went wrong",
      });
    }
  };


  return (
    <Formik
      innerRef={formikRef}
      initialValues={initialValues}
      onSubmit={handleSubmit}
    >
      {({
        values,
        handleChange,
        setFieldValue,
      }) => (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        // className="max-w-7xl mx-auto"
        >
          <Card className="shadow-lg border rounded-xl">
            <CardHeader className="border-b">
              <CardTitle className="text-lg font-semibold">
                पार्टी मास्टर
              </CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-5">
              <Form className="space-y-4">
                <div className="flex items-center gap-3">
                  <Label text="नगरपालिकेचे नाव :" />
                  <Select
                    value={values.nagarpalika}
                    onValueChange={(v) =>
                      setFieldValue(
                        "nagarpalika",
                        v
                      )
                    }
                    disabled
                  >
                    <SelectTrigger className="w-100">
                      <SelectValue placeholder="निवडा" />
                    </SelectTrigger>

                    <SelectContent>
                      {corporationList.map((c) => (
                        <SelectItem
                          key={c.NUM_CORPORATION_ID}
                          value={c.NUM_CORPORATION_ID?.toString()}
                        >
                          {c.VAR_CORPORATION_NAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center  gap-3">
                    <Label text="पक्ष आय डी :" />
                    <Input
                      name="partyId"
                      value={values.partyId}
                      onChange={handleChange}
                      readOnly
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-3">
                    <Label text="पक्ष नाव :" />
                    <Input
                      name="partyName"
                      value={values.partyName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Label text="मालक नाव :" />
                    <Input
                      name="ownerName"
                      value={values.ownerName}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="col-span-2 flex items-center gap-3">
                    <Label text="पत्ता :" />
                    <textarea
                      name="address"
                      value={values.address}
                      onChange={handleChange}
                      className="border rounded-md p-2 w-full h-10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Label text="राज्य :" />
                    <Select
                      value={values.state}
                      onValueChange={async (v) => {
                        setFieldValue("state", v);
                        setFieldValue("district", "");
                        setFieldValue("city", "");
                        await getDistricts(v);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="निवडा" />
                      </SelectTrigger>

                      <SelectContent>
                        {stateList.map((s) => (
                          <SelectItem
                            key={s.VALUE}
                            value={s.VALUE?.toString()}
                          >
                            {s.LABEL}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="जिल्हा :" />
                    <Select
                      value={values.district}
                      onValueChange={async (v) => {
                        setFieldValue("district", v);
                        setFieldValue("city", "");
                        await getCities(v);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="निवडा" />
                      </SelectTrigger>

                      <SelectContent>
                        {districtList.map((d) => (
                          <SelectItem
                            key={d.VALUE}
                            value={d.VALUE?.toString()}
                          >
                            {d.LABEL}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="शहर :" />
                    <Select
                      value={values.city}
                      onValueChange={(v) =>
                        setFieldValue("city", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="निवडा" />
                      </SelectTrigger>

                      <SelectContent>
                        {cityList.map((c) => (
                          <SelectItem
                            key={c.VALUE}
                            value={c.VALUE?.toString()}
                          >
                            {c.LABEL}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Label text="मोबाइल :" />
                    <Input
                      name="mobile"
                      value={values.mobile}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="ई मेल आयडी :" />
                    <Input
                      name="email"
                      value={values.email}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="पिन कोड :" />
                    <Input
                      name="pin"
                      value={values.pin}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Label text="आधार नं. :" />
                    <Input
                      name="aadhar"
                      value={values.aadhar}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="पॅन कार्ड :" />
                    <Input
                      name="pan"
                      value={values.pan}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="वेट कोड :" />
                    <Input
                      name="vat"
                      value={values.vat}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Label text="जी.एस.टी नंबर :" />
                    <Input
                      name="gst"
                      value={values.gst}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="एम.एस.टी :" />
                    <Input
                      name="sgst"
                      value={values.sgst}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="बी.एस.टी :" />
                    <Input
                      name="bst"
                      value={values.bst}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Label text="बैंक :" />
                    <Select
                      value={values.bank}
                      onValueChange={async (v) => {
                        setFieldValue("bank", v);
                        setFieldValue("branch", "");
                        setFieldValue("ifsc", "");
                        await getBranches(v);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="निवडा" />
                      </SelectTrigger>

                      <SelectContent>
                        {bankList.map((b) => (
                          <SelectItem
                            key={b.VALUE}
                            value={b.VALUE?.toString()}
                          >
                            {b.LABEL}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="बैंक शाखा :" />
                    <Select
                      value={values.branch}
                      disabled={!values.bank}
                      onValueChange={async (v) => {
                        setFieldValue("branch", v);
                        await getIFSC(v);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="निवडा" />
                      </SelectTrigger>

                      <SelectContent>
                        {branchList.map((b) => (
                          <SelectItem
                            key={b.VALUE}
                            value={b.VALUE?.toString()}
                          >
                            {b.LABEL}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="स्थिती :" />
                    <Select
                      value={values.status}
                      onValueChange={(v) =>
                        setFieldValue("status", v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>

                      <SelectContent>
                        <SelectItem value="1">
                          open
                        </SelectItem>

                        <SelectItem value="0">
                          close
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  <div className="flex items-center gap-3">
                    <Label text="आय.एफ.एस.सी :" />
                    <Input
                      name="ifsc"
                      value={values.ifsc}
                      // readOnly
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center gap-3">
                    <Label text="खाते क्रमांक :" />
                    <Input
                      name="accountNo"
                      value={values.accountNo}
                      onChange={handleChange}
                    />
                  </div>

                  <Button
                    type="button"
                    className="mt-1"
                    onClick={() => {

                      if (!values.bank) {
                        Swal.fire(
                          "Validation",
                          "कृपया बँक निवडा",
                          "warning"
                        );
                        return;
                      }
                      if (!values.branch) {
                        Swal.fire(
                          "Validation",
                          "कृपया शाखा निवडा",
                          "warning"
                        );
                        return;
                      }
                      if (!values.ifsc) {
                        Swal.fire(
                          "Validation",
                          "IFSC उपलब्ध नाही",
                          "warning"
                        );
                        return;
                      }
                      if (!values.accountNo) {
                        Swal.fire(
                          "Validation",
                          "कृपया खाते क्रमांक टाका",
                          "warning"
                        );
                        return;
                      }
                      if (!values.status) {
                        Swal.fire(
                          "Validation",
                          "कृपया स्थिती निवडा",
                          "warning"
                        );
                        return;
                      }

                      const alreadyExists =
                        values.bankList.some(
                          (x) =>
                            x.bankId === values.bank &&
                            x.branchId === values.branch &&
                            x.accountNo === values.accountNo
                        );

                      if (alreadyExists) {
                        Swal.fire(
                          "Validation",
                          "ही बँक आधीच जोडलेली आहे",
                          "warning"
                        );
                        return;
                      }

                      const selectedBank =
                        bankList.find(
                          (x) =>
                            x.VALUE?.toString() === values.bank
                        );

                      const selectedBranch =
                        branchList.find(
                          (x) =>
                            x.VALUE?.toString() === values.branch
                        );

                      setFieldValue("bankList", [
                        ...values.bankList,

                        {
                          bankId: values.bank,
                          branchId: values.branch,
                          bank: selectedBank?.LABEL || "-",
                          branch: selectedBranch?.LABEL || "-",
                          ifsc: values.ifsc || "-",
                          accountNo: values.accountNo || "-",
                          status: values.status,
                          statusLabel: values.status === "1" ? "Open" : "Close",
                        },
                      ]);
                      setFieldValue("bank", "");
                      setFieldValue("branch", "");
                      setFieldValue("ifsc", "");
                      setFieldValue("accountNo", "");
                      setFieldValue("status", "");
                    }}
                  >
                    बँक जोडा
                  </Button>
                </div>

                <ShadCNTable
                  headers={[
                    "बैंक",
                    "बैंक शाखा",
                    "आय.एफ.एस.सी",
                    "खाते क्रमांक",
                    "स्थिती",
                  ]}
                  data={values.bankList || []}
                  className="max-md:min-w-3xl"
                  keyMapping={{
                    "बैंक": "bank",
                    "बैंक शाखा": "branch",
                    "आय.एफ.एस.सी": "ifsc",
                    "खाते क्रमांक": "accountNo",
                    "स्थिती": "statusLabel",
                  }}
                />

                <div className="flex justify-center gap-4 pt-4">
                  <Button
                    type="submit"
                    className="bg-blue-900 text-white"
                  >
                    साठवा
                  </Button>
                  {/* <Button variant="secondary">
                    बदल करा
                  </Button> */}
                  <Button
                    variant="destructive"
                    onClick={() =>
                      navigate(
                        "/Masters/FrmPartyList"
                      )
                    }
                  >
                    परत
                  </Button>
                </div>

              </Form>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </Formik>
  );
};

export default FrmPartyMaster;