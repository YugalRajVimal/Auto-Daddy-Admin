import SignUpForm from "../../../../components/auth/SubAdmin/SignUpForm";
import PageMeta from "../../../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SignUp() {
  return (
    <>
     <PageMeta
        title="Auto Daddy"
        description="Admin and Sub-Admin Panel for Auto Daddy"
      />
      <AuthLayout>
        <SignUpForm />
      </AuthLayout>
    </>
  );
}
