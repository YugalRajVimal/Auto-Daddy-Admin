import PageMeta from "../../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignUpForm from "../../../components/auth/SignUpForm";

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
