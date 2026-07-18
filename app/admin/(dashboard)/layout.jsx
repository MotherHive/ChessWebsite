import AdminLayout from '../../../src/pages/admin/AdminLayout'

export const metadata = {
  title: "Club Admin | Scranton Chess Club",
}

export default function AdminSectionLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>
}
