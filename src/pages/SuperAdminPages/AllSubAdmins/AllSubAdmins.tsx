import PageBreadcrumb from "../../../components/common/PageBreadCrumb";
import SubAdminList from "./SubAdminList";

const AllSubAdmins = () => {
  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="All Sub Admin" />
      <div className="space-y-6">
        {/* <ComponentCard title="Sub Admins"> */}
        <SubAdminList />
        {/* </ComponentCard> */}
      </div>
    </div>
  );
};

export default AllSubAdmins;
