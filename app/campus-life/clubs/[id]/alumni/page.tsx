import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default function ClubAlumniRedirectPage({ params }: PageProps) {
  redirect(`/clubs/${params.id}/alumni`);
}
