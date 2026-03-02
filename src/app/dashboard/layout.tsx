import CommonProvider from "@/components/shared/common-provider";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <CommonProvider>{children}</CommonProvider>;
}
