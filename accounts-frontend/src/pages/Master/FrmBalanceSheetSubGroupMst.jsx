import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useAuth } from "@/context/AuthContext";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";

const BASE_URL = import.meta.env.VITE_BASE_URL;

const FrmAccountMaster = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const mode = location.state?.mode || 1;
  const editData = location.state?.data;

  const [formData, setFormData] = useState({
    ulbId: "",
    glCode: "",
    subTypeId: "",
    nidhiId: "",
    accountTypeId: "",

    accNo: "",
    accName: "",
    accNameEng: "",
    oldAccNo: "",
    openingBal: "",
    budgetAmt: "",
    maxLimit: "",
    revBudgetAmt: "",
  });

  const [corporationList, setCorporationList] = useState([]);
  const [glList, setGlList] = useState([]);
  const [subTypeList, setSubTypeList] = useState([]);
  const [nidhiList, setNidhiList] = useState([]);

  const api = axios.create({ baseURL: BASE_URL });

  api.interceptors.request.use((config) => {
    config.headers.Authorization = `Bearer ${user?.token}`;
    return config;
  });

  /* 🔥 HANDLE CHANGE */
  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /* 🔥 FETCH DATA */
  useEffect(() => {
    const fetchData = async () => {
      const [corp, gl, sub, nidhi] = await Promise.all([
        api.get("/api/FrmParty/corporation/list"),
        api.get("/api/FrmAccount/gl-master"),
        api.get("/api/FrmAccount/account-subTypes"),
        api.get("/api/FrmAccount/nidhi-master"),
      ]);

      setCorporationList(corp.data.data.list || []);
      setGlList(gl.data.data.data || []);
      setSubTypeList(sub.data.data.data || []);
      setNidhiList(nidhi.data.data.data || []);

      if (user?.ulbId) {
        handleChange("ulbId", user.ulbId.toString());
      }
    };

    fetchData();
  }, []);

  /* 🔥 AUTO ACCOUNT NUMBER */
  const getNextAccountNo = async (glCode, subTypeId) => {
    const res = await api.post("/api/FrmAccount/next-accountNo", {
      ulbId: Number(formData.ulbId),
      glCode: Number(glCode),
      subTypeId: Number(subTypeId),
    });

    const next = res.data?.data?.data?.NEXTACCNO || "";
    handleChange("accNo", `${glCode}${subTypeId}${next}`);
  };

  /* 🔥 SUBTYPE CHANGE */
  const handleSubTypeChange = (val) => {
    const id = Number(val);

    let type = "";
    if (id >= 1000 && id < 2000) type = "1";
    else if (id >= 2000 && id < 3000) type = "2";
    else if (id >= 3000 && id < 4000) type = "3";
    else if (id >= 4000) type = "4";

    handleChange("subTypeId", val);
    handleChange("accountTypeId", type);

    if (formData.glCode) {
      getNextAccountNo(formData.glCode, val);
    }
  };

  /* 🔥 SUBMIT */
  const handleSubmit = async () => {
    try {
      const payload = {
        mode: mode === 2 ? 2 : 1,
        ulbId: Number(formData.ulbId),
        glCode: Number(formData.glCode),
        accNo: Number(formData.accNo),

        accName: formData.accName,
        accNameEng: formData.accNameEng,
        userId: user?.userName,

        subTypeId: Number(formData.subTypeId),
        oldAccNo: formData.oldAccNo,
        nidhiId: Number(formData.nidhiId),

        openingBal: Number(formData.openingBal || 0),
        budgetAmt: Number(formData.budgetAmt || 0),
        maxLimit: Number(formData.maxLimit || 0),
        revBudgetAmt: Number(formData.revBudgetAmt || 0),
      };

      Swal.fire({ title: "Saving...", didOpen: () => Swal.showLoading() });

      const res = await api.post("/api/FrmAccount/save-account", payload);

      Swal.close();

      if (res.data?.data?.success) {
        await Swal.fire({
          icon: "success",
          title: res.data.data.message,
        });

        navigate("/Masters/FrmAccountList");
      }
    } catch (err) {
      Swal.close();
      Swal.fire({ icon: "error", title: "Error" });
    }
  };

  return (
    <motion.div className="max-w-6xl mx-auto mt-6">
      <Card>
        <CardHeader>
          <CardTitle>खाते मास्टर</CardTitle>
        </CardHeader>

        <CardContent className="p-8 space-y-6">

          {/* GRID */}
          <div className="grid grid-cols-2 gap-x-16 gap-y-5">

            {/* ULB */}
            <Field label="महानगरपालिका">
              <Select value={formData.ulbId} disabled>
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
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
            </Field>

            {/* Nidhi */}
            <Field label="निधि">
              <Select
                value={formData.nidhiId}
                onValueChange={(val) => handleChange("nidhiId", val)}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {nidhiList.map((n) => (
                    <SelectItem
                      key={n.NUM_NIDHI_ID}
                      value={n.NUM_NIDHI_ID.toString()}
                    >
                      {n.VAR_NIDHI_NIDHINAME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* GL */}
            <Field label="जी.एल.">
              <Select
                value={formData.glCode}
                onValueChange={(val) => {
                  handleChange("glCode", val);
                  if (formData.subTypeId) {
                    getNextAccountNo(val, formData.subTypeId);
                  }
                }}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {glList.map((g) => (
                    <SelectItem key={g.GLCODE} value={g.GLCODE}>
                      {g.GLCODE} - {g.GLNAME}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* SubType */}
            <Field label="ऑब्जेक्ट कोड">
              <Select
                value={formData.subTypeId}
                onValueChange={handleSubTypeChange}
              >
                <SelectTrigger className="w-full h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {subTypeList.map((s) => (
                    <SelectItem
                      key={s.NUM_ACCSUBTYPEMST_ACCSUBTYPEID}
                      value={s.NUM_ACCSUBTYPEMST_ACCSUBTYPEID.toString()}
                    >
                      {s.VAR_ACCSUBTYPEMST_ACCSUBTYPE}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Account No */}
            <Field label="खाते आयडी">
              <Input value={formData.accNo} readOnly />
            </Field>

            {/* Old */}
            <Field label="जुना खाते क्र.">
              <Input
                value={formData.oldAccNo}
                onChange={(e) => handleChange("oldAccNo", e.target.value)}
              />
            </Field>

            {/* Names */}
            <Field label="खाते नाव (मराठी)">
              <Input
                value={formData.accName}
                onChange={(e) => handleChange("accName", e.target.value)}
              />
            </Field>

            <Field label="खाते नाव (English)">
              <Input
                value={formData.accNameEng}
                onChange={(e) => handleChange("accNameEng", e.target.value)}
              />
            </Field>

          </div>

          {/* BUTTONS */}
          <div className="flex justify-center gap-4 mt-8">
            <Button onClick={handleSubmit}>साठवा</Button>
            <Button onClick={() => navigate(-1)}>रद्द</Button>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
};

const Field = ({ label, children }) => (
  <div className="flex items-center gap-6">
    <span className="w-56 text-right font-medium">{label} :</span>
    <div className="flex-1">{children}</div>
  </div>
);

export default FrmAccountMaster;