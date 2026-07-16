import { ProfileFieldRow, ExpandableCard } from "@/components/reusables";
import { nationalPhoneDisplayFromKeystrokes, NATIONAL_PHONE_DISPLAY_MAX_LENGTH } from "@/lib/national-phone-format";
import {
  clampText,
  digitsOnly,
  formatPincodeDisplay,
  hasCanadianPostalCodeValidationError,
  isValidEmail,
  PINCODE_DISPLAY_MAX_LENGTH,
  POSTAL_CODE_ERROR_MESSAGE,
} from "@/lib/validation";
import { Ionicons } from "@expo/vector-icons";

type Row = {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
};

type PersonalInformationCardProps = {
  expanded: boolean;
  editing: boolean;
  saving?: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  personalFields: Row[];
  editName: string;
  setEditName: (value: string) => void;
  editEmail: string;
  setEditEmail: (value: string) => void;
  editPhone: string;
  setEditPhone: (value: string) => void;
  editPincode: string;
  setEditPincode: (value: string) => void;
  editAddress: string;
  setEditAddress: (value: string) => void;
};

export function PersonalInformationCard({
  expanded,
  editing,
  saving = false,
  onToggle,
  onEdit,
  onSave,
  onCancel,
  personalFields,
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
}: PersonalInformationCardProps) {
  return (
    <ExpandableCard
      title="Personal Information"
      headerIcon="person"
      expanded={expanded}
      onToggle={onToggle}
      onEdit={editing ? undefined : onEdit}
      editing={editing}
      onSave={onSave}
      onCancel={onCancel}
      saving={saving}
    >
      {editing ? (
        <>
          {personalFields.map((row, idx) => {
            const isName = row.label === "Full Name";
            const isEmail = row.label === "Email Address";
            const isMobile = row.label === "Mobile Number";
            const isPincode = row.label === "Pincode" || row.label === "Zip Code";
            return (
              <ProfileFieldRow
                key={row.label}
                icon={row.icon}
                label={row.label === "Pincode" ? "Zip Code" : row.label}
                value={row.value}
                showDivider={idx > 0}
                editable
                inputValue={
                  isName
                    ? editName
                    : isEmail
                      ? editEmail
                      : isMobile
                        ? editPhone
                        : isPincode
                          ? editPincode
                          : editAddress
                }
                onChangeText={
                  isName
                    ? (t) => setEditName(clampText(t, 20))
                    : isEmail
                      ? (t) => setEditEmail(clampText(t, 80))
                      : isMobile
                        ? (t) => setEditPhone(nationalPhoneDisplayFromKeystrokes(t))
                        : isPincode
                          ? (t) => setEditPincode(formatPincodeDisplay(t))
                          : (t) => setEditAddress(clampText(t, 50))
                }
                keyboardType={isEmail ? "email-address" : isMobile ? "number-pad" : "default"}
                autoCapitalize={isEmail ? "none" : isPincode ? "characters" : "sentences"}
                multiline={false}
                inputEditable
                maxLength={
                  isName ? 20 : isEmail ? 80 : isMobile ? NATIONAL_PHONE_DISPLAY_MAX_LENGTH : isPincode ? PINCODE_DISPLAY_MAX_LENGTH : 50
                }
                errorText={
                  isName
                    ? editName.trim().length === 0
                      ? "Name is required."
                      : null
                    : isEmail
                      ? editEmail.trim().length > 0 && !isValidEmail(editEmail)
                        ? "Enter a valid email."
                        : null
                      : isPincode
                        ? hasCanadianPostalCodeValidationError(editPincode)
                          ? POSTAL_CODE_ERROR_MESSAGE
                          : null
                        : isMobile
                          ? digitsOnly(editPhone).length > 0 && digitsOnly(editPhone).length !== 10
                            ? "Phone must be 10 digits."
                            : null
                          : editAddress.trim().length > 50
                            ? "Address must be at most 50 characters."
                            : null
                }
              />
            );
          })}
        </>
      ) : (
        <>
          {personalFields.map((row, idx) => (
            <ProfileFieldRow
              key={row.label}
              icon={row.icon}
              label={row.label === "Pincode" ? "Zip Code" : row.label}
              value={row.value}
              showDivider={idx > 0}
            />
          ))}
        </>
      )}
    </ExpandableCard>
  );
}
