import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default function ClubRedirectPage({ params }: PageProps) {
  redirect(`/clubs/${params.id}`);
}
