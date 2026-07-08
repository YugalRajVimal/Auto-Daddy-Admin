import AdminPage from "../../components/admin/AdminPage";
import { ContentPanel } from "../../components/admin/ContentPanel";
import { PortalPageContent } from "../../components/admin/PortalPageContent";

export default function PortalPlaceholder({ title }: { title: string }) {
  return (
    <PortalPageContent>
      <AdminPage title={title} noPanel>
        <ContentPanel title={title}>
          <p className="text-sm text-gray-600">This section is coming soon.</p>
        </ContentPanel>
      </AdminPage>
    </PortalPageContent>
  );
}
