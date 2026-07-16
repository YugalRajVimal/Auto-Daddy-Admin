import {
  digitsFromNationalPhoneDisplay,
  formatNationalPhoneDisplay,
} from "@/lib/national-phone-format";
import { formatPincodeDisplay } from "@/lib/validation";
import { useEffect, useState } from "react";

type DisplayProfile = {
  name: string;
  email: string;
  phone: string;
  pincode: string;
  address: string;
  countryCode: string;
};

export function usePersonalProfileEditor(displayProfile: DisplayProfile) {
  const [isPersonalEditing, setIsPersonalEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editPincode, setEditPincode] = useState("");
  const [editAddress, setEditAddress] = useState("");

  useEffect(() => {
    if (isPersonalEditing) {
      return;
    }
    setEditName(displayProfile.name || "");
    setEditEmail(displayProfile.email || "");
    setEditPhone(formatNationalPhoneDisplay(digitsFromNationalPhoneDisplay(displayProfile.phone || "")));
    setEditPincode(formatPincodeDisplay(displayProfile.pincode || ""));
    setEditAddress(displayProfile.address || "");
  }, [
    displayProfile.address,
    displayProfile.email,
    displayProfile.name,
    displayProfile.phone,
    displayProfile.pincode,
    isPersonalEditing,
  ]);

  function resetPersonalDrafts() {
    setEditName(displayProfile.name || "");
    setEditEmail(displayProfile.email || "");
    setEditPhone(formatNationalPhoneDisplay(digitsFromNationalPhoneDisplay(displayProfile.phone || "")));
    setEditPincode(formatPincodeDisplay(displayProfile.pincode || ""));
    setEditAddress(displayProfile.address || "");
  }

  function cancelPersonalEdit() {
    resetPersonalDrafts();
    setIsPersonalEditing(false);
  }

  return {
    isPersonalEditing,
    setIsPersonalEditing,
    editName,
    setEditName,
    editEmail,
    setEditEmail,
    editPhone,
    setEditPhone,
    editPincode,
    setEditPincode,
    editAddress,
    setEditAddress,
    resetPersonalDrafts,
    cancelPersonalEdit,
  };
}
