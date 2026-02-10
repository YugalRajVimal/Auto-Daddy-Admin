import SignInForm from "../../../../components/auth/SubAdmin/SignInForm";
import PageMeta from "../../../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";

export default function SubAdminSignIn() {
  return (
    <>
      <PageMeta
        title="Auto Daddy"
        description="Admin and Sub-Admin Panel for Auto Daddy"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
