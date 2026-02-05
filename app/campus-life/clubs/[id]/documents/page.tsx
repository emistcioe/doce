import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default function ClubDocumentsRedirectPage({ params }: PageProps) {
  redirect(`/clubs/${params.id}/documents`);
}
