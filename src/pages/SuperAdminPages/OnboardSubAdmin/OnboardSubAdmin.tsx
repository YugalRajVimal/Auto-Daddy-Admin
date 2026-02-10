import { useState } from "react";
import Label from "../../../components/form/Label";
import Input from "../../../components/form/input/InputField";
import { EnvelopeIcon, UserCircleIcon } from "../../../icons";
import PhoneInput from "../../../components/form/group-input/PhoneInput";
import Button from "../../../components/ui/button/Button";
import Alert from "../../../components/ui/alert/Alert";
import ComponentCard from "../../../components/common/ComponentCard";
import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import axios from "axios";

const countries = [
  { code: "IN", label: "+91" },
  { code: "US", label: "+1" },
  { code: "GB", label: "+44" },
  { code: "CA", label: "+1" },
  { code: "AU", label: "+61" },
];

// Define the type for the error state to ensure variant is one of the allowed types
interface AlertState {
  isEnable: boolean;
  variant: "success" | "error" | "warning" | "info";
  title: string;
  message: string;
}

const OnboardSubAdmin = () => {
  const [nickName, setNickName] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState<string | undefined>(undefined);
  const [phoneNo, setPhoneNo] = useState<string | undefined>(undefined);
  const [name, setName] = useState<string | undefined>(undefined);
  // New state variables for address fields
  const [addressLine, setAddressLine] = useState<string | undefined>(undefined);
  const [city, setCity] = useState<string | undefined>(undefined);
  const [state, setState] = useState<string | undefined>(undefined);
  const [pinCode, setPinCode] = useState<string | undefined>(undefined);
  // New state variable for zone
  const [zone, setZone] = useState<string | undefined>(undefined);

  const [alert, setAlert] = useState<AlertState>({
    isEnable: false, // Initially disabled, only show when an alert occurs
    variant: "info", // Default variant, will be overridden on alert
    title: "",
    message: "",
  });

  const handlePhoneNumberChange = (phoneNumber: string) => {
    console.log("Updated phone number:", phoneNumber);
    setPhoneNo(phoneNumber);
  };

  const handleOnboardVendor = async () => {
    // Clear any previous alert messages at the start of a new submission attempt
    setAlert({
      isEnable: false,
      variant: "info",
      title: "",
      message: "",
    });

    // Vendor Code validation
    if (!nickName) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Missing Nick Name",
        message: "Please enter the Nick Name.",
      });
      return;
    }

    if (!name) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Missing Name",
        message: "Please enter the Vendor's name.",
      });
      return;
    }

    if (!email) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Missing Email",
        message: "Please enter the Vendor's email.",
      });
      return;
    }

    // Basic email validation regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Invalid Email",
        message: "Please enter a valid email address.",
      });
      return;
    }

    if (!phoneNo) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Missing Phone Number",
        message: "Please enter the Vendor's phone number.",
      });
      return;
    }

    // Assuming phoneNo includes country code and is 13 chars long, e.g., +911234567890
    // This validation might need adjustment based on the PhoneInput component's output format
    // For now, keeping the existing logic.
    if (phoneNo.length !== 13) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Invalid Phone Number",
        message:
          "Phone number must be 10 digits long (excluding country code, e.g., +91XXXXXXXXXX).",
      });
      return;
    }

    // Address field validations
    if (!addressLine) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Missing Address Line",
        message: "Please enter the Vendor's address line.",
      });
      return;
    }

    if (!city) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Missing City",
        message: "Please enter the Vendor's city.",
      });
      return;
    }

    if (!state) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Missing State",
        message: "Please enter the Vendor's state.",
      });
      return;
    }

    if (!pinCode) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Missing Pin Code",
        message: "Please enter the Vendor's pin code.",
      });
      return;
    }

    // Validate zone
    if (!zone) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Missing Zone",
        message: "Please enter the Zone.",
      });
      return;
    }

    // Basic pin code validation (e.g., 6 digits for India, adjust as needed)
    const pinCodeRegex = /^\d{6}$/;
    if (!pinCodeRegex.test(pinCode)) {
      setAlert({
        isEnable: true,
        variant: "error",
        title: "Invalid Pin Code",
        message: "Please enter a valid 6-digit pin code.",
      });
      return;
    }

    // If all validations pass

    console.log("NickName:", nickName);
    console.log("Name:", name);
    console.log("Email:", email);
    console.log("Phone No:", phoneNo);
    console.log("Address Line:", addressLine);
    console.log("City:", city);
    console.log("State:", state);
    console.log("Pin Code:", pinCode);
    console.log("Zone:", zone);

    try {
      const token = localStorage.getItem("admin-token");

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/onboard-sub-admin`,
        {
          nickName: nickName, // backend expects vendorId, not nickName
          name,
          email,
          phoneNumber: phoneNo, // backend expects phoneNumber
          addressLine,
          city,
          state,
          pincode: pinCode, // backend expects pincode, not pinCode
          zone, // NEW: zone
        },
        {
          headers: {
            Authorization: `${token}`, // send token for auth
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 201) {
        setAlert({
          isEnable: true,
          variant: "success",
          title: "Success",
          message: response.data.message || "Vendor onboarded successfully!",
        });

        // Optionally clear form after success
        setNickName("");
        setName("");
        setEmail("");
        setPhoneNo("");
        setAddressLine("");
        setCity("");
        setState("");
        setPinCode("");
        setZone("");
      }
    } catch (error: any) {
      console.error("Error onboarding vendor:", error);

      let message =
        error.response?.data?.message ||
        error.message ||
        "An error occurred while onboarding the vendor.";

      setAlert({
        isEnable: true,
        variant: "error",
        title: "Onboarding Failed",
        message,
      });
    }
  };

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Onboard Sub Admin" />
      <div className="space-y-6">
        <ComponentCard title="Fill Sub Admin Details">
          {alert.isEnable && (
            <Alert
              variant={alert.variant as any}
              title={alert.title}
              message={alert.message}
            />
          )}
          <div>
            <Label>Nick Name</Label>
            <div className="relative">
              <Input
                placeholder="e.g., Sub Admin A"
                type="text"
                name="nickName"
                value={nickName}
                onChange={(e) => setNickName(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Name</Label>
            <div className="relative">
              <Input
                placeholder="John Doe"
                type="text"
                className="pl-[62px]"
                name="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <UserCircleIcon className="size-6" />
              </span>
            </div>
          </div>
          <div>
            <Label>Email</Label>
            <div className="relative">
              <Input
                placeholder="info@gmail.com"
                type="text"
                className="pl-[62px]"
                name="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <span className="absolute left-0 top-1/2 -translate-y-1/2 border-r border-gray-200 px-3.5 py-3 text-gray-500 dark:border-gray-800 dark:text-gray-400">
                <EnvelopeIcon className="size-6" />
              </span>
            </div>
          </div>
          <div>
            <Label>Phone</Label>
            <PhoneInput
              selectPosition="start"
              countries={countries}
              placeholder="+1 (555) 000-0000"
              onChange={handlePhoneNumberChange}
            />
          </div>
          {/* New Address Fields */}
          <div>
            <Label>Zone</Label>
            <div className="relative">
              <Input
                placeholder="Zone/Region"
                type="text"
                name="zone"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Address Line</Label>
            <div className="relative">
              <Input
                placeholder="123 Main St"
                type="text"
                name="addressLine"
                value={addressLine}
                onChange={(e) => setAddressLine(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>City</Label>
            <div className="relative">
              <Input
                placeholder="Anytown"
                type="text"
                name="city"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>State</Label>
            <div className="relative">
              <Input
                placeholder="Anystate"
                type="text"
                name="state"
                value={state}
                onChange={(e) => setState(e.target.value)}
              />
            </div>
          </div>
          <div>
            <Label>Pin Code</Label>
            <div className="relative">
              <Input
                placeholder="123456"
                type="text"
                name="pinCode"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
              />
            </div>
          </div>
          <Button onClick={handleOnboardVendor}>Handle Onboard Vendor</Button>
        </ComponentCard>
      </div>
    </div>
  );
};

export default OnboardSubAdmin;
