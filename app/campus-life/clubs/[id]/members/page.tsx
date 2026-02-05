import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default function ClubMembersRedirectPage({ params }: PageProps) {
  redirect(`/clubs/${params.id}/members`);
}
