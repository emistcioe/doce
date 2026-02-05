import { redirect } from "next/navigation";

interface PageProps {
  params: { id: string };
}

export default function ClubGalleryRedirectPage({ params }: PageProps) {
  redirect(`/clubs/${params.id}/gallery`);
}
