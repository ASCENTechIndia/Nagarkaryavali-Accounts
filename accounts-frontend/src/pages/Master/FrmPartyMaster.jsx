import { Formik, Form } from "formik";
import { useNavigate, useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import ShadCNTable from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";

import { useEffect, useState } from "react";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { de } from "date-fns/locale";
import Swal from "sweetalert2";

const FrmPartyMaster = () => {
  const [stateList, setStateList] = useState([]);
  const [districtList, setDistrictList] = useState([]);
  const [cityList, setCityList] = useState([]);
  const [corporationList, setCorporationList] = useState([]);

  const [bankList, setBankList] = useState([]);
  const [branchList, setBranchList] = useState([]);
  const navigate = useNavigate();
  const { user, loading: authLoading, token } = useAuth();
  const ulbId = user?.ulbId;

  const [loading, setLoading] = useState(false);
  const [corpLoading, setCorpLoading] = useState(false);

  const location = useLocation();

  const baseUrl = import.meta.env.VITE_BASE_URL;

  const mode = location.state?.mode;

  const initialValues = {
    nagarpalika: ulbId?.toString() || "", // ✅ dynamic initial value
    partyId: "",
    partyName: "",
    ownerName: "",
    address: "",
    state: "MAHARASHTRA",
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
    bank: "",
    branch: "",
    ifsc: "",
    accountNo: "",
    status: "",
    bankList: [
      {
        bank: "",
        branch: "",
        ifsc: "",
        accountNo: "",
        status: "",
      },
    ],
  };

  const api = axios.create({
    baseURL: import.meta.env.VITE_BASE_URL
    
  });

  api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  });

  const getCorpIFSC = async (corpId) => {
    const res = await api.get(`${baseUrl}/api/FrmParty/ifsc?corpId=${corpId}`);
  };

  const getPincode = async (corpId) => {
    const res = await api.get(
      `${baseUrl}/api/FrmParty/pincode?corpId=${corpId}`,
    );
  };

  const getStates = async () => {
    const res = await api.get(`${baseUrl}/api/FrmParty/state`);
    setStateList(res.data.data.list);
  };

  const getDistricts = async (stateId) => {
    const res = await api.get(`${baseUrl}/api/FrmParty/district/${stateId}`);
    setDistrictList(res.data.data.list);
  };

  const getCities = async (districtId) => {
    
    const res = await api.get(`${baseUrl}/api/FrmParty/city/${districtId}`);
    
    setCityList(res.data.data.list);
    console.log("🏙️ Cities loaded:", res.data.data.list);
  };

  const getCorporations = async () => {
    try {
      setCorpLoading(true);

      const res = await api.get("/api/FrmParty/corporation/list");
      setCorporationList(res.data?.data?.list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setCorpLoading(false);
    }
  };

  const getBanks = async () => {
    const res = await api.get(`${baseUrl}/api/FrmParty/bank`);
    setBankList(res.data.data.list);
  };

  const getBranches = async (bankId) => {
    const res = await api.get(`${baseUrl}/api/FrmParty/branch/${bankId}`);
    setBranchList(res.data.data.list);
  };

  const getIFSC = async (bankId, setFieldValue) => {
    const res = await api.get(`${baseUrl}/api/FrmParty/ifsc/${bankId}`);
    setFieldValue("ifsc", res.data.data.data.VAR_BRANCHMST_IFSC);
  };

  //     useEffect(() => {
  //   const loadData = async () => {
  //     try {
  //       setLoading(true);

  //       await Promise.all([
  //         getStates(),
  //         getBanks(),
  //         getCorporations(setFieldValue),
  //       ]);

  //     } catch (err) {
  //       console.error(err);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   if (user?.ulbId) {
  //     loadData();
  //   }
  // }, [user?.ulbId]);

  // const handleSubmit = async (values, { resetForm }) => {
  //   debugger;
  //   try {
  //     const payload = {
  //       mode: Number(mode) || 1,
  //       partyId: Number(values.partyId),

  //       userId: user.userId,
  //       corpId: Number(ulbId),

  //       partyName: values.partyName,
  //       propName: values.ownerName,
  //       partyAddress: values.address,

  //       cityId: values.city,
  //       districtId: Number(values.district),

  //       pinNo: Number(values.pin) || 0,
  //       mobNo: Number(values.mobile) || 0,
  //       email: values.email,

  //       panNo: values.pan,
  //       gstNumber: values.gst,
  //       aadharNo: Number(values.aadhar) || 0,

  //       bankId: Number(values.bank),
  //       branchId: Number(values.branch),
  //       ifscCode: values.ifsc,
  //       accountNo: values.accountNo,

  //       ipAddress: window.location.hostname,
  //       source: "WEB",

  //       bankStr: values.bankList
  //         .filter((b) => b.bank && b.branch && b.accountNo)
  //         .map(
  //           (b) =>
  //             `${b.bank}#${b.branch}#${b.ifsc}#${b.accountNo}#${b.status}#0#0`
  //         )
  //         .join(","),
  //     };

  //     const res = await api.post("/api/FrmParty/party-master", payload);

  //     if (res.data?.ok) {
  //       alert("Saved successfully");
  //       resetForm();
  //     }

  //   } catch (error) {
  //     console.error(error);
  //   }
  // };

  const handleSubmit = async (values, { resetForm }) => {
    try {
      const payload = {
        mode: Number(mode) || 1,
        partyId: Number(values.partyId),

        userId: user?.userId,
        corpId: Number(ulbId),

        partyName: values.partyName,
        propName: values.ownerName,
        partyAddress: values.address,

        cityId: values.city,
        districtId: Number(values.district),

        pinNo: Number(values.pin) || 0,
        mobNo: Number(values.mobile) || 0,
        email: values.email,

        panNo: values.pan,
        gstNumber: values.gst,
        aadharNo: Number(values.aadhar) || 0,

        bankId: Number(values.bank),
        branchId: Number(values.branch),
        ifscCode: values.ifsc,
        accountNo: values.accountNo,

        ipAddress: window.location.hostname,
        source: "WEB",

        bankStr: values.bankList
          .filter((b) => b.bank && b.branch && b.accountNo)
          .map(
            (b) =>
              `${b.bank}#${b.branch}#${b.ifsc}#${b.accountNo}#${b.status}#0#0`,
          )
          .join(","),
      };

      console.log("📤 PAYLOAD:", payload);

      // 🔄 Loader (same as GL page)
      Swal.fire({
        title: "Saving...",
        text: "Please wait",
        allowOutsideClick: false,
        didOpen: () => {
          Swal.showLoading();
        },
      });

      const res = await api.post("/api/FrmParty/party-master", payload);

      Swal.close(); // ✅ close loader

      if (res.data?.ok) {
        await Swal.fire({
          icon: "success",
          title: res.data.message || "Saved successfully",
          confirmButtonColor: "#1e3a8a",
        });

        resetForm();
        navigate("/Masters/FrmPartyList");
      } else {
        Swal.fire({
          icon: "error",
          title: res.data?.message || "Something went wrong",
        });
      }
    } catch (error) {
      console.error("❌ Submit error:", error);

      Swal.close();

      // ❌ Handle token error nicely
      if (error.response?.status === 401) {
        Swal.fire({
          icon: "warning",
          title: "Session Expired",
          text: "Please login again",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: error.response?.data?.message || "Server error",
        });
      }
    }
  };

  if (authLoading) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        Loading user...
      </div>
    );
  }

  if (!ulbId) {
    return (
      <div className="py-10 text-center text-sm text-muted-foreground">
        User not found
      </div>
    );
  }

  return (
    <Formik initialValues={initialValues} onSubmit={handleSubmit}>
      {({ values, handleChange, setFieldValue }) => {
       useEffect(() => {
  const loadData = async () => {
    try {
      setLoading(true);

      await Promise.all([
        getStates(),
        getBanks(),
        getCorporations(),
      ]);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (ulbId) loadData();
}, [ulbId]);
        return (
          <Form className="space-y-6 p-6 bg-white border rounded-lg shadow-sm">
            {/* HEADER */}
            <div className="border-b pb-3">
              <h2 className="text-xl font-bold">पार्टी मास्टर</h2>
            </div>

            {/* FORM GRID */}
            <div className="space-y-4 p-4 border rounded-md ">
              {/* ROW 1 */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <Label className="col-span-2 text-right">
                  नगरपालिकेचे नाव :
                </Label>
                <div className="col-span-4">
                  <Select
                    disabled={corpLoading}
                    value={values.nagarpalika}
                    onValueChange={(val) => setFieldValue("nagarpalika", val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select Corporation" />
                    </SelectTrigger>

                    <SelectContent>
                      {corporationList.map((item) => (
                        <SelectItem
                          key={item.NUM_CORPORATION_ID}
                          value={item.NUM_CORPORATION_ID.toString()}
                        >
                          {item.VAR_CORPORATION_NAME}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* ROW 2 */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <Label className="col-span-2 text-right">पक्ष आय डी :</Label>
                <Input
                  className="col-span-2"
                  name="partyId"
                  value={values.partyId}
                  onChange={handleChange}
                />

                <Label className="col-span-2 text-right">पक्ष नाव :</Label>
                <Input
                  className="col-span-6"
                  name="partyName"
                  value={values.partyName}
                  onChange={handleChange}
                />
              </div>

              {/* ROW 3 */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <Label className="col-span-2 text-right">मालक नाव :</Label>
                <Input
                  className="col-span-2"
                  name="ownerName"
                  value={values.ownerName}
                  onChange={handleChange}
                />

                <Label className="col-span-2 text-right">पत्ता :</Label>
                <Input
                  className="col-span-6"
                  name="address"
                  value={values.address}
                  onChange={handleChange}
                />
              </div>

              {/* ROW 4 */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <Label className="col-span-2 text-right">राज्य :</Label>
                <Select
                  value={values.state}
                  onValueChange={(val) => {
                    setFieldValue("state", val);
                    getDistricts(val);
                  }}
                >
                  <SelectTrigger className="col-span-2 w-full">
                    <SelectValue placeholder="Select State" />
                  </SelectTrigger>

                  <SelectContent>
                    {stateList.map((item) => (
                      <SelectItem
                        key={item.VALUE}
                        value={item.VALUE.toString()}
                      >
                        {item.LABEL}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="col-span-2 text-right">जिल्हा :</Label>
                <Select
                  onValueChange={(val) => {
                    setFieldValue("district", val);
                    getCities(val);
                  }}
                >
                  <SelectTrigger className="col-span-2 w-full">
                    <SelectValue placeholder="Select District" />
                  </SelectTrigger>

                  <SelectContent>
                    {districtList.map((item) => (
                      <SelectItem
                        key={item.VALUE}
                        value={item.VALUE.toString()}
                      >
                        {item.LABEL}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="col-span-2 text-right">शहर :</Label>
                <Select onValueChange={(val) => setFieldValue("city", val)}>
                  <SelectTrigger className="col-span-2 w-full">
                    <SelectValue placeholder="Select City" />
                  </SelectTrigger>

                  <SelectContent>
                    {cityList.map((item) => (
                      <SelectItem
                        key={item.VALUE}
                        value={item.VALUE.toString()}
                      >
                        {item.LABEL}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ROW 5 */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <Label className="col-span-2 text-right">मोबाइल :</Label>
                <Input
                  className="col-span-2"
                  name="mobile"
                  value={values.mobile}
                  onChange={handleChange}
                />

                <Label className="col-span-2 text-right">ई मेल आयडी :</Label>
                <Input
                  className="col-span-2"
                  name="email"
                  value={values.email}
                  onChange={handleChange}
                />

                <Label className="col-span-2 text-right">पिन कोड :</Label>
                <Input
                  className="col-span-2"
                  name="pin"
                  value={values.pin}
                  onChange={handleChange}
                />
              </div>

              {/* ROW 6 */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <Label className="col-span-2 text-right">आधार नं. :</Label>
                <Input
                  className="col-span-2"
                  name="aadhar"
                  value={values.aadhar}
                  onChange={handleChange}
                />

                <Label className="col-span-2 text-right">पॅन कार्ड :</Label>
                <Input
                  className="col-span-2"
                  name="pan"
                  value={values.pan}
                  onChange={handleChange}
                />

                <Label className="col-span-2 text-right">वॅट कोड :</Label>
                <Input
                  className="col-span-2"
                  name="vat"
                  value={values.vat}
                  onChange={handleChange}
                />
              </div>

              {/* ROW 7 */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <Label className="col-span-2 text-right">जी.एस.टी नंबर :</Label>
                <Input
                  className="col-span-2"
                  name="gst"
                  value={values.gst}
                  onChange={handleChange}
                />

                <Label className="col-span-2 text-right">एस.जी.एस.टी :</Label>
                <Input
                  className="col-span-2"
                  name="sgst"
                  value={values.sgst}
                  onChange={handleChange}
                />

                <Label className="col-span-2 text-right">बी.एस.ती :</Label>
                <Input
                  className="col-span-2"
                  name="bct"
                  value={values.bct}
                  onChange={handleChange}
                />
              </div>

              {/* ROW 8 */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <Label className="col-span-2 text-right">बँक :</Label>
                <Select
                  onValueChange={(val) => {
                    setFieldValue("bank", val);
                    getBranches(val);
                    getIFSC(val, setFieldValue);
                  }}
                >
                  <SelectTrigger className="col-span-2 w-full">
                    <SelectValue placeholder="Select Bank" />
                  </SelectTrigger>

                  <SelectContent>
                    {bankList.map((item) => (
                      <SelectItem
                        key={item.VALUE}
                        value={item.VALUE.toString()}
                      >
                        {item.LABEL}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="col-span-2 text-right">बँक शाखा :</Label>
                <Select onValueChange={(val) => setFieldValue("branch", val)}>
                  <SelectTrigger className="col-span-2 w-full">
                    <SelectValue placeholder="Select Branch" />
                  </SelectTrigger>

                  <SelectContent>
                    {branchList.map((item) => (
                      <SelectItem
                        key={item.VALUE}
                        value={item.VALUE.toString()}
                      >
                        {item.LABEL}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Label className="col-span-2 text-right">स्थिती :</Label>
                <Select
                  value={values.status}
                  onValueChange={(val) => setFieldValue("status", val)}
                >
                  <SelectTrigger className="col-span-2 w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* ROW 9 */}
              <div className="grid grid-cols-12 gap-3 items-center">
                <Label className="col-span-2 text-right">आय.एफ.एस.सी :</Label>
                <Input
                  className="col-span-2"
                  name="ifsc"
                  value={values.ifsc}
                  onChange={handleChange}
                />

                <Label className="col-span-2 text-right">खाते क्रमांक :</Label>
                <Input
                  className="col-span-2"
                  name="accountNo"
                  value={values.accountNo}
                  onChange={handleChange}
                />

                <Button
                  type="button"
                  onClick={() => {
                    const newBank = {
                      bank: values.bank,
                      branch: values.branch,
                      ifsc: values.ifsc,
                      accountNo: values.accountNo,
                      status: values.status,
                    };

                    // validation (optional but recommended)
                    if (!values.bank || !values.branch || !values.accountNo) {
                      alert("Please fill bank details");
                      return;
                    }

                    // add to list
                    setFieldValue("bankList", [...values.bankList, newBank]);

                    // clear fields after add
                    setFieldValue("bank", "");
                    setFieldValue("branch", "");
                    setFieldValue("ifsc", "");
                    setFieldValue("accountNo", "");
                  }}
                >
                  बँक जोडा
                </Button>
              </div>
            </div>

            {/* BANK TABLE */}
            <div className="border mt-6">
              <ShadCNTable
                headers={[
                  "बँक",
                  "बँक शाखा",
                  "आय.एफ.एस.सी कोड",
                  "खाते क्रमांक",
                  "स्थिती",
                ]}
                data={values.bankList}
                keyMapping={{
                  बँक: "bank",
                  "बँक शाखा": "branch",
                  "आय.एफ.एस.सी कोड": "ifsc",
                  "खाते क्रमांक": "accountNo",
                  स्थिती: "status",
                }}
                columnStyles={{
                  बँक: { width: "20%" },
                  "बँक शाखा": { width: "20%" },
                  "आय.एफ.एस.सी कोड": { width: "20%" },
                  "खाते क्रमांक": { width: "20%" },
                  स्थिती: { width: "20%" },
                }}
              />
            </div>

            {/* BUTTONS */}
            <div className="flex gap-3 mt-4 justify-center">
              {mode === 2 ? (
                <>
                  {/* EDIT MODE */}
                  <Button type="submit">अद्यावत करा</Button>
                  <Button type="button" variant="secondary">
                    रद्द
                  </Button>
                  <Button type="button" variant="outline">
                    बदल करा
                  </Button>
                </>
              ) : (
                <>
                  {/* ADD MODE */}
                  <Button type="submit">साठवा</Button>
                  <Button type="button" variant="outline">
                    बदल करा
                  </Button>
                </>
              )}

              {/* COMMON */}
              <Button
                type="button"
                variant="destructive"
                onClick={() => navigate("/Masters/FrmPartyList")}
              >
                परत
              </Button>
            </div>
          </Form>
        );
      }}
    </Formik>
  );
};

export default FrmPartyMaster;
